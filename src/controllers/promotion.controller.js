import Promotion from '../models/Promotion.js'
import cloudinary from '../config/cloudinary.js'

// ─── Public ───────────────────────────────────────────────────

// GET /api/promotions
export const getActivePromotions = async (req, res, next) => {
  try {
    const now = new Date()
    const promotions = await Promotion.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    }).sort('position')

    res.json({ promotions })
  } catch (err) { next(err) }
}

// ─── Admin ────────────────────────────────────────────────────

// GET /api/admin/promotions?page=1&limit=20
export const getAllPromotions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit

    const [promotions, total] = await Promise.all([
      Promotion.find().sort('position').skip(skip).limit(limit),
      Promotion.countDocuments(),
    ])

    res.json({ promotions, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// POST /api/admin/promotions
export const createPromotion = async (req, res, next) => {
  try {
    const { title, description, badge, badgeColor, link, linkText, position, isActive, startDate, endDate } = req.body

    const data = {
      title,
      description,
      badge,
      badgeColor,
      link,
      linkText,
      position: position ?? 0,
      isActive: isActive !== 'false',
      startDate: startDate || null,
      endDate: endDate || null,
    }

    if (req.file) {
      data.image = req.file.path
      data.imagePublicId = req.file.filename
    }

    const promotion = await Promotion.create(data)
    res.status(201).json({ promotion })
  } catch (err) { next(err) }
}

// PUT /api/admin/promotions/:id
export const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' })

    const fields = ['title', 'description', 'badge', 'badgeColor', 'link', 'linkText', 'startDate', 'endDate']
    fields.forEach(f => { if (req.body[f] !== undefined) promotion[f] = req.body[f] })

    if (req.body.position !== undefined) promotion.position = Number(req.body.position)
    if (req.body.isActive !== undefined) promotion.isActive = req.body.isActive !== 'false' && req.body.isActive !== false

    if (req.file) {
      if (promotion.imagePublicId) {
        await cloudinary.uploader.destroy(promotion.imagePublicId).catch(() => {})
      }
      promotion.image = req.file.path
      promotion.imagePublicId = req.file.filename
    }

    await promotion.save()
    res.json({ promotion })
  } catch (err) { next(err) }
}

// DELETE /api/admin/promotions/:id
export const deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' })

    if (promotion.imagePublicId) {
      await cloudinary.uploader.destroy(promotion.imagePublicId).catch(() => {})
    }

    await promotion.deleteOne()
    res.json({ message: 'Promotion deleted' })
  } catch (err) { next(err) }
}
