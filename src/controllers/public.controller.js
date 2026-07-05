import Season from '../models/Season.js'
import Drop from '../models/Drop.js'
import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import { resolveDropState, resolveSeasonState, resolveTheme } from '../services/seasonDrop.service.js'

// ─── Seasons ──────────────────────────────────────────────────

/**
 * GET /api/public/seasons
 * Returns all upcoming and active seasons sorted by launchDate, with brand details.
 * Paginated — default limit 12.
 */
export async function getPublicSeasons(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 12)
    const skip  = (page - 1) * limit

    const now = new Date()

    const [seasons, total] = await Promise.all([
      Season.find({ status: { $in: ['upcoming', 'active'] } })
        .sort({ launchDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('brand', 'name logo slug theme'),
      Season.countDocuments({ status: { $in: ['upcoming', 'active'] } }),
    ])

    // Resolve state at read time for accuracy
    const resolved = seasons.map(s => {
      const obj = s.toObject()
      obj.status = resolveSeasonState(s, now)
      if (obj.brand) obj.brand.theme = resolveTheme(obj.brand)
      return obj
    })

    res.json({
      seasons: resolved,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) { next(err) }
}

/**
 * GET /api/public/seasons/:id
 * Returns a single season with populated brand + products.
 */
export async function getPublicSeasonById(req, res, next) {
  try {
    const season = await Season.findById(req.params.id)
      .populate('brand', 'name logo slug theme')
      .populate('products')

    if (!season) return res.status(404).json({ message: 'Season not found' })

    const obj = season.toObject()
    obj.status = resolveSeasonState(season)
    if (obj.brand) obj.brand.theme = resolveTheme(obj.brand)

    res.json({ season: obj })
  } catch (err) { next(err) }
}

// ─── Drops ────────────────────────────────────────────────────

/**
 * GET /api/public/drops
 * Returns all drops in teaser or open state with brand details.
 */
export async function getPublicDrops(req, res, next) {
  try {
    const drops = await Drop.find({ state: { $in: ['teaser', 'open'] } })
      .populate('brand', 'name logo slug theme')
      .sort({ dropDate: 1 })

    const now = new Date()
    const resolved = drops.map(d => serializeDropForState(d, resolveDropState(d, now)))

    res.json({ drops: resolved })
  } catch (err) { next(err) }
}

/**
 * GET /api/public/drops/:id
 * Returns state-filtered drop details based on current state.
 */
export async function getPublicDropById(req, res, next) {
  try {
    const drop = await Drop.findById(req.params.id)
      .populate('brand', 'name logo slug theme')
      .populate('product')

    if (!drop) return res.status(404).json({ message: 'Drop not found' })

    const state = resolveDropState(drop)
    const serialized = serializeDropForState(drop, state)

    res.json({ drop: serialized })
  } catch (err) { next(err) }
}

/**
 * Serializes a drop for the public API based on its current state.
 * - scheduled: minimal response (no product details)
 * - teaser: teaserImage, brand name, dropDate, countdown only
 * - open/sold_out: full product details
 */
function serializeDropForState(drop, state) {
  const obj = drop.toObject ? drop.toObject() : { ...drop }
  const brand = obj.brand || {}
  if (brand.theme) brand.theme = resolveTheme(brand)

  const base = {
    _id:      obj._id,
    state,
    brand: {
      _id:   brand._id,
      name:  brand.name,
      logo:  brand.logo,
      slug:  brand.slug,
      theme: brand.theme,
    },
    dropDate: obj.dropDate,
  }

  if (state === 'scheduled') {
    // No product details exposed
    return { ...base, message: 'Coming soon' }
  }

  if (state === 'teaser') {
    // Only teaserImage, brand name, countdown — no product details
    return {
      ...base,
      teaserImage: obj.teaserImage,
    }
  }

  // open or sold_out — full product details
  return {
    ...base,
    teaserImage: obj.teaserImage,
    stock:       obj.stock,
    product:     obj.product,
    notified:    obj.notified,
  }
}

// ─── Brands ──────────────────────────────────────────────────

/**
 * GET /api/public/brands/:slug
 * Returns brand public profile with theme fields.
 */
export async function getPublicBrandBySlug(req, res, next) {
  try {
    const brand = await Brand.findOne({
      $or: [
        { slug: req.params.slug },
        { _id: req.params.slug.match(/^[0-9a-fA-F]{24}$/) ? req.params.slug : null },
      ],
      status: 'active',
    }).select('-password -refreshToken')

    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    const obj = brand.toObject()
    obj.theme = resolveTheme(brand)

    res.json({ brand: obj })
  } catch (err) { next(err) }
}

/**
 * GET /api/public/brands/:slug/products
 * Returns paginated products for a brand, with optional season filter.
 */
export async function getPublicBrandProducts(req, res, next) {
  try {
    const { slug } = req.params
    const page     = Math.max(1, parseInt(req.query.page)  || 1)
    const limit    = Math.min(100, parseInt(req.query.limit) || 20)
    const skip     = (page - 1) * limit
    const seasonId = req.query.season

    // Find brand by slug or ID
    const brand = await Brand.findOne({
      $or: [
        { slug },
        { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null },
      ],
      status: 'active',
    })

    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    let productIds = null
    if (seasonId) {
      const season = await Season.findById(seasonId).select('products')
      if (!season) return res.status(404).json({ message: 'Season not found' })
      productIds = season.products.map(p => p.toString())
    }

    const query = {
      brand: brand._id,
      status: { $ne: 'inactive' },
    }
    if (productIds) {
      query._id = { $in: productIds }
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ])

    res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) { next(err) }
}
