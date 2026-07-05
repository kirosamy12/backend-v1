import Season from '../models/Season.js'
import Product from '../models/Product.js'
import { resolveSeasonState, isValidSeasonTransition } from '../services/seasonDrop.service.js'

/**
 * GET /api/brand/seasons
 * List all seasons for the authenticated brand.
 */
export async function listBrandSeasons(req, res, next) {
  try {
    const seasons = await Season.find({ brand: req.brand._id })
      .sort({ launchDate: -1 })
      .populate('products', 'name images price')

    const now = new Date()
    const resolved = seasons.map(s => {
      const obj = s.toObject()
      obj.status = resolveSeasonState(s, now)
      obj.productCount = s.products.length
      return obj
    })

    res.json({ seasons: resolved })
  } catch (err) { next(err) }
}

/**
 * POST /api/brand/seasons
 * Create a new season for the authenticated brand.
 */
export async function createSeason(req, res, next) {
  try {
    const { name, coverImage, description, launchDate, products = [] } = req.body

    // Validate launchDate is in the future
    const launch = new Date(launchDate)
    if (isNaN(launch.getTime())) {
      return res.status(400).json({ message: 'Invalid launchDate' })
    }

    // Validate all products belong to this brand
    if (products.length > 0) {
      const ownProducts = await Product.find({
        _id: { $in: products },
        brand: req.brand._id,
      }).select('_id')

      const ownIds = new Set(ownProducts.map(p => p._id.toString()))
      for (const id of products) {
        if (!ownIds.has(id.toString())) {
          return res.status(400).json({ message: `Product ${id} does not belong to this brand` })
        }
      }

      // Check no product is already in another active season
      const activeSeasons = await Season.find({
        brand: req.brand._id,
        status: 'active',
        products: { $in: products },
      })

      if (activeSeasons.length > 0) {
        // Find which product is conflicting
        for (const season of activeSeasons) {
          for (const pid of products) {
            if (season.products.some(p => p.toString() === pid.toString())) {
              return res.status(409).json({
                message: `Product ${pid} is already assigned to an active season`,
              })
            }
          }
        }
      }
    }

    const season = await Season.create({
      brand: req.brand._id,
      name,
      coverImage: coverImage || '',
      description: description || '',
      launchDate: launch,
      products: products || [],
    })

    res.status(201).json({ season })
  } catch (err) { next(err) }
}

/**
 * GET /api/brand/seasons/:id
 * Get a single season for the authenticated brand.
 */
export async function getSeasonById(req, res, next) {
  try {
    const season = await Season.findOne({ _id: req.params.id, brand: req.brand._id })
      .populate('products', 'name images price stock')

    if (!season) return res.status(404).json({ message: 'Season not found' })

    const obj = season.toObject()
    obj.status = resolveSeasonState(season)

    res.json({ season: obj })
  } catch (err) { next(err) }
}

/**
 * PUT /api/brand/seasons/:id
 * Update a season. Enforces lifecycle rules.
 */
export async function updateSeason(req, res, next) {
  try {
    const season = await Season.findOne({ _id: req.params.id, brand: req.brand._id })
    if (!season) return res.status(404).json({ message: 'Season not found' })

    const currentStatus = resolveSeasonState(season)
    const { name, coverImage, description, launchDate, products, status } = req.body

    // Cannot edit active/ended seasons except to transition status to ended
    if (currentStatus === 'active' || currentStatus === 'ended') {
      if (status && status !== 'ended') {
        return res.status(403).json({ message: 'Cannot edit a season that is active or ended' })
      }
      if ((name || coverImage !== undefined || description !== undefined || launchDate || products)) {
        return res.status(403).json({ message: 'Cannot edit a season that is active or ended' })
      }
      // Allow transition to ended
      if (status === 'ended') {
        season.status = 'ended'
        await season.save()
        return res.json({ season: season.toObject() })
      }
    }

    // Validate status transition if status is being changed
    if (status && status !== currentStatus) {
      if (!isValidSeasonTransition(currentStatus, status)) {
        return res.status(400).json({ message: 'Invalid status transition' })
      }
      season.status = status
    }

    // Validate launchDate can only be changed if upcoming
    if (launchDate) {
      if (currentStatus !== 'upcoming') {
        return res.status(403).json({ message: 'Cannot edit a season that is active or ended' })
      }
      const launch = new Date(launchDate)
      if (isNaN(launch.getTime())) {
        return res.status(400).json({ message: 'Invalid launchDate' })
      }
      season.launchDate = launch
    }

    if (name !== undefined) season.name = name
    if (coverImage !== undefined) season.coverImage = coverImage
    if (description !== undefined) season.description = description

    // Validate and update products
    if (products !== undefined) {
      if (products.length > 0) {
        const ownProducts = await Product.find({
          _id: { $in: products },
          brand: req.brand._id,
        }).select('_id')

        const ownIds = new Set(ownProducts.map(p => p._id.toString()))
        for (const id of products) {
          if (!ownIds.has(id.toString())) {
            return res.status(400).json({ message: `Product ${id} does not belong to this brand` })
          }
        }

        // Check active seasons
        const activeSeasons = await Season.find({
          brand: req.brand._id,
          status: 'active',
          products: { $in: products },
          _id: { $ne: season._id },
        })

        if (activeSeasons.length > 0) {
          for (const s of activeSeasons) {
            for (const pid of products) {
              if (s.products.some(p => p.toString() === pid.toString())) {
                return res.status(409).json({
                  message: `Product ${pid} is already assigned to an active season`,
                })
              }
            }
          }
        }
      }
      season.products = products
    }

    await season.save()
    res.json({ season: season.toObject() })
  } catch (err) { next(err) }
}

/**
 * DELETE /api/brand/seasons/:id
 * Delete a season. Disassociates products but does not delete them.
 */
export async function deleteSeason(req, res, next) {
  try {
    const season = await Season.findOne({ _id: req.params.id, brand: req.brand._id })
    if (!season) return res.status(404).json({ message: 'Season not found' })

    const currentStatus = resolveSeasonState(season)
    if (currentStatus === 'active' || currentStatus === 'ended') {
      return res.status(403).json({ message: 'Cannot edit a season that is active or ended' })
    }

    // Disassociate products — clear the array but don't delete products
    season.products = []
    await season.save()

    await Season.deleteOne({ _id: season._id })

    res.json({ message: 'Season deleted successfully' })
  } catch (err) { next(err) }
}
