import Banner from '../models/Banner.js'
import cloudinary from '../config/cloudinary.js'

// ─── Public ───────────────────────────────────────────────────

// GET /api/banners?type=hero
export const getActiveBanners = async (req, res, next) => {
  try {
    const filter = { isActive: true }
    if (req.query.type) filter.type = req.query.type

    const banners = await Banner.find(filter).sort('position')
    res.json({ banners })
  } catch (err) { next(err) }
}

// ─── Admin ────────────────────────────────────────────────────

// GET /api/banners/all?page=1&limit=20
export const getAllBanners = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit

    const [banners, total] = await Promise.all([
      Banner.find().sort('position').skip(skip).limit(limit),
      Banner.countDocuments(),
    ])

    res.json({ banners, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// POST /api/admin/banners  (image already uploaded via multer → req.file)
export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, link, linkText, position, isActive, type } = req.body

    if (!req.file) return res.status(400).json({ message: 'Banner image is required' })

    const banner = await Banner.create({
      title,
      subtitle,
      image: req.file.path,
      imagePublicId: req.file.filename,
      link,
      linkText,
      position: position ?? 0,
      isActive: isActive !== 'false',
      type: type || 'hero',
    })

    res.status(201).json({ banner })
  } catch (err) { next(err) }
}

// PUT /api/admin/banners/:id
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) return res.status(404).json({ message: 'Banner not found' })

    const { title, subtitle, link, linkText, position, isActive, type } = req.body
    if (title !== undefined) banner.title = title
    if (subtitle !== undefined) banner.subtitle = subtitle
    if (link !== undefined) banner.link = link
    if (linkText !== undefined) banner.linkText = linkText
    if (position !== undefined) banner.position = Number(position)
    if (isActive !== undefined) banner.isActive = isActive !== 'false' && isActive !== false
    if (type !== undefined) banner.type = type

    // Replace image if new file uploaded
    if (req.file) {
      if (banner.imagePublicId) {
        await cloudinary.uploader.destroy(banner.imagePublicId).catch(() => {})
      }
      banner.image = req.file.path
      banner.imagePublicId = req.file.filename
    }

    await banner.save()
    res.json({ banner })
  } catch (err) { next(err) }
}

// DELETE /api/admin/banners/:id
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) return res.status(404).json({ message: 'Banner not found' })

    if (banner.imagePublicId) {
      await cloudinary.uploader.destroy(banner.imagePublicId).catch(() => {})
    }

    await banner.deleteOne()
    res.json({ message: 'Banner deleted' })
  } catch (err) { next(err) }
}
