import { Router } from 'express'
import Brand from '../models/Brand.js'
import Category from '../models/Category.js'
import {
  getPublicSeasons,
  getPublicSeasonById,
  getPublicDrops,
  getPublicDropById,
  getPublicBrandBySlug,
  getPublicBrandProducts,
} from '../controllers/public.controller.js'

const router = Router()

// GET /api/public/brands — list all active brands (existing)
router.get('/brands', async (req, res, next) => {
  try {
    const brands = await Brand.find({ status: 'active' })
      .select('name description logo website phone status slug theme createdAt')
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

// ─── Season Routes ───────────────────────────────────────────
// GET /api/public/seasons
router.get('/seasons', getPublicSeasons)

// GET /api/public/seasons/:id
router.get('/seasons/:id', getPublicSeasonById)

// ─── Drop Routes ─────────────────────────────────────────────
// GET /api/public/drops
router.get('/drops', getPublicDrops)

// GET /api/public/drops/:id
router.get('/drops/:id', getPublicDropById)

// ─── Brand Routes (slug-based) ────────────────────────────────
// GET /api/public/brands/:slug — must come after /brands to avoid conflict
router.get('/brands/:slug/products', getPublicBrandProducts)
router.get('/brands/:slug', getPublicBrandBySlug)

export default router
