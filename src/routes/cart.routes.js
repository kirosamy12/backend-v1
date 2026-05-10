import { Router } from 'express'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, getCart)
router.post('/items', protect, addToCart)
router.put('/items/:itemId', protect, updateCartItem)
router.delete('/items/:itemId', protect, removeCartItem)
router.delete('/', protect, clearCart)

export default router
