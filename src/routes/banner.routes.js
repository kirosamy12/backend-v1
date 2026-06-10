import { Router } from 'express'
import { uploadBannerImage } from '../config/cloudinary.js'
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()

// Public — storefront fetches active banners
router.get('/', getActiveBanners)

// Admin only
router.get('/all', protectAdmin, getAllBanners)
router.post('/', protectAdmin, uploadBannerImage, createBanner)
router.put('/:id', protectAdmin, uploadBannerImage, updateBanner)
router.delete('/:id', protectAdmin, deleteBanner)

export default router
