import { Router } from 'express'
import { brandLogin, brandRegister, getBrandMe, refreshBrandToken } from '../controllers/brandAuth.controller.js'
import { getBrandProducts } from '../controllers/product.controller.js'
import { getBrandOrders, updateOrderStatus } from '../controllers/order.controller.js'
import { protectBrand } from '../middleware/auth.js'
import { getBrandTheme, updateBrandTheme } from '../controllers/brandTheme.controller.js'
import {
  listBrandSeasons,
  createSeason,
  getSeasonById,
  updateSeason,
  deleteSeason,
} from '../controllers/season.controller.js'
import {
  listBrandDrops,
  createDrop,
  getDropById,
  updateDrop,
  deleteDrop,
} from '../controllers/drop.controller.js'

const router = Router()

// Auth
router.post('/auth/register', brandRegister)
router.post('/auth/login', brandLogin)
router.post('/auth/refresh', refreshBrandToken)
router.get('/auth/me', protectBrand, getBrandMe)

// Products
router.get('/products', protectBrand, getBrandProducts)

// Orders
router.get('/orders', protectBrand, getBrandOrders)
router.put('/orders/:id/status', protectBrand, updateOrderStatus)

// ─── Brand Theme ─────────────────────────────────────────────
router.get('/theme', protectBrand, getBrandTheme)
router.put('/theme', protectBrand, updateBrandTheme)

// ─── Seasons ─────────────────────────────────────────────────
router.get('/seasons', protectBrand, listBrandSeasons)
router.post('/seasons', protectBrand, createSeason)
router.get('/seasons/:id', protectBrand, getSeasonById)
router.put('/seasons/:id', protectBrand, updateSeason)
router.delete('/seasons/:id', protectBrand, deleteSeason)

// ─── Drops ───────────────────────────────────────────────────
router.get('/drops', protectBrand, listBrandDrops)
router.post('/drops', protectBrand, createDrop)
router.get('/drops/:id', protectBrand, getDropById)
router.put('/drops/:id', protectBrand, updateDrop)
router.delete('/drops/:id', protectBrand, deleteDrop)

export default router
