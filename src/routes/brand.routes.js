import { Router } from 'express'
import { brandLogin, getBrandMe } from '../controllers/brandAuth.controller.js'
import { getBrandProducts } from '../controllers/product.controller.js'
import { getBrandOrders, updateOrderStatus } from '../controllers/order.controller.js'
import { protectBrand } from '../middleware/auth.js'

const router = Router()

// Auth
router.post('/auth/login', brandLogin)
router.get('/auth/me', protectBrand, getBrandMe)

// Products
router.get('/products', protectBrand, getBrandProducts)

// Orders
router.get('/orders', protectBrand, getBrandOrders)
router.put('/orders/:id/status', protectBrand, updateOrderStatus)

export default router
