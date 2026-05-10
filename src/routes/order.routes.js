import { Router } from 'express'
import { createOrder, getUserOrders, getOrder } from '../controllers/order.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/', protect, createOrder)
router.get('/', protect, getUserOrders)
router.get('/:id', protect, getOrder)

export default router
