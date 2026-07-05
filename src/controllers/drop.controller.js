import Drop from '../models/Drop.js'
import Product from '../models/Product.js'
import Notification from '../models/Notification.js'
import { resolveDropState } from '../services/seasonDrop.service.js'

const ONE_HOUR_MS = 60 * 60 * 1000

/**
 * GET /api/brand/drops
 * List all drops for the authenticated brand.
 */
export async function listBrandDrops(req, res, next) {
  try {
    const drops = await Drop.find({ brand: req.brand._id })
      .sort({ dropDate: -1 })
      .populate('product', 'name images price')

    const now = new Date()
    const resolved = drops.map(d => {
      const obj = d.toObject()
      obj.state = resolveDropState(d, now)
      return obj
    })

    res.json({ drops: resolved })
  } catch (err) { next(err) }
}

/**
 * POST /api/brand/drops
 * Create a new drop for the authenticated brand.
 */
export async function createDrop(req, res, next) {
  try {
    const { productId, dropDate, teaserImage, stock, notifyList = [] } = req.body

    if (!productId) return res.status(400).json({ message: 'productId is required' })
    if (!dropDate)  return res.status(400).json({ message: 'dropDate is required' })
    if (stock === undefined || stock === null) return res.status(400).json({ message: 'stock is required' })

    // Validate dropDate is at least 1 hour in the future
    const dropTime = new Date(dropDate)
    if (isNaN(dropTime.getTime())) {
      return res.status(400).json({ message: 'Invalid dropDate' })
    }
    if (dropTime.getTime() < Date.now() + ONE_HOUR_MS) {
      return res.status(400).json({ message: 'dropDate must be at least 1 hour in the future' })
    }

    // Validate product belongs to this brand
    const product = await Product.findOne({ _id: productId, brand: req.brand._id })
    if (!product) {
      return res.status(400).json({ message: `Product ${productId} does not belong to this brand` })
    }

    const drop = await Drop.create({
      product: productId,
      brand: req.brand._id,
      dropDate: dropTime,
      teaserImage: teaserImage || '',
      stock: Number(stock),
      notifyList: notifyList || [],
    })

    res.status(201).json({ drop })
  } catch (err) { next(err) }
}

/**
 * GET /api/brand/drops/:id
 * Get a single drop for the authenticated brand.
 */
export async function getDropById(req, res, next) {
  try {
    const drop = await Drop.findOne({ _id: req.params.id, brand: req.brand._id })
      .populate('product', 'name images price stock')

    if (!drop) return res.status(404).json({ message: 'Drop not found' })

    const obj = drop.toObject()
    obj.state = resolveDropState(drop)

    res.json({ drop: obj })
  } catch (err) { next(err) }
}

/**
 * PUT /api/brand/drops/:id
 * Update a drop. Locked when state is open or sold_out.
 */
export async function updateDrop(req, res, next) {
  try {
    const drop = await Drop.findOne({ _id: req.params.id, brand: req.brand._id })
    if (!drop) return res.status(404).json({ message: 'Drop not found' })

    const currentState = resolveDropState(drop)

    // Lock editing when open or sold_out, except manual close
    if (currentState === 'open' || currentState === 'sold_out') {
      const { manualClose } = req.body
      if (manualClose) {
        drop.state = 'sold_out'
        drop.stock = 0
        await drop.save()
        return res.json({ drop: drop.toObject() })
      }
      return res.status(403).json({ message: 'Cannot edit a drop that is open or sold out' })
    }

    const { dropDate, teaserImage, stock, notifyList } = req.body

    if (dropDate !== undefined) {
      const dropTime = new Date(dropDate)
      if (isNaN(dropTime.getTime())) {
        return res.status(400).json({ message: 'Invalid dropDate' })
      }
      if (dropTime.getTime() < Date.now() + ONE_HOUR_MS) {
        return res.status(400).json({ message: 'dropDate must be at least 1 hour in the future' })
      }
      drop.dropDate = dropTime
    }

    if (teaserImage !== undefined) drop.teaserImage = teaserImage
    if (stock !== undefined) drop.stock = Number(stock)
    if (notifyList !== undefined) drop.notifyList = notifyList

    await drop.save()
    res.json({ drop: drop.toObject() })
  } catch (err) { next(err) }
}

/**
 * DELETE /api/brand/drops/:id
 * Delete a drop document.
 */
export async function deleteDrop(req, res, next) {
  try {
    const drop = await Drop.findOne({ _id: req.params.id, brand: req.brand._id })
    if (!drop) return res.status(404).json({ message: 'Drop not found' })

    await Drop.deleteOne({ _id: drop._id })
    res.json({ message: 'Drop deleted successfully' })
  } catch (err) { next(err) }
}

/**
 * Dispatches notifications to all users in the drop's notifyList when the
 * drop transitions to 'open' state. Uses upsert to prevent duplicate notifications.
 *
 * @param {object} drop - Drop document
 */
export async function dispatchDropNotifications(drop) {
  if (drop.notified) return
  if (!drop.notifyList || drop.notifyList.length === 0) {
    drop.notified = true
    await drop.save()
    return
  }

  const ops = drop.notifyList.map(userId => ({
    updateOne: {
      filter: { user: userId, type: 'drop_open', referenceId: drop._id },
      update: {
        $setOnInsert: {
          user: userId,
          type: 'drop_open',
          referenceId: drop._id,
          message: `A drop you're following is now live!`,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }))

  await Notification.bulkWrite(ops)

  drop.notified = true
  await drop.save()
}
