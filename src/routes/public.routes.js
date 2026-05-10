import { Router } from 'express'
import Brand from '../models/Brand.js'
import Category from '../models/Category.js'

const router = Router()

// GET /api/public/brands — public, no auth needed
router.get('/brands', async (req, res, next) => {
  try {
    const brands = await Brand.find({ status: 'active' })
      .select('name description logo website phone status createdAt')
      .sort('name')

    // Add product count for each brand
    const Product = (await import('../models/Product.js')).default
    const brandsWithCount = await Promise.all(
      brands.map(async (b) => {
        const count = await Product.countDocuments({ brand: b._id, status: { $ne: 'inactive' } })
        return { ...b.toObject(), products: count }
      })
    )

    res.json({ brands: brandsWithCount })
  } catch (err) { next(err) }
})

// GET /api/public/categories — public
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('order')
    res.json({ categories })
  } catch (err) { next(err) }
})

export default router
