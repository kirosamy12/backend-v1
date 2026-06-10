import { Router } from 'express'
import { uploadPromotionImage } from '../config/cloudinary.js'
import { getActivePromotions, getAllPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotion.controller.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()

// Public — storefront fetches live promotions
router.get('/', getActivePromotions)

// Admin only
router.get('/all', protectAdmin, getAllPromotions)
router.post('/', protectAdmin, uploadPromotionImage, createPromotion)
router.put('/:id', protectAdmin, uploadPromotionImage, updatePromotion)
router.delete('/:id', protectAdmin, deletePromotion)

export default router
