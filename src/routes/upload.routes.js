import { Router } from 'express'
import { uploadBrandLogo, uploadProductImages, uploadAvatar } from '../config/cloudinary.js'
import { uploadBrandLogoHandler, uploadProductImagesHandler, uploadAvatarHandler } from '../controllers/upload.controller.js'
import { protectAdmin, protectBrand, protect } from '../middleware/auth.js'

const router = Router()

// Brand logo — admin or brand
router.post('/brand-logo', protectAdmin, uploadBrandLogo, uploadBrandLogoHandler)

// Product images — brand only
router.post('/product-images', protectBrand, uploadProductImages, uploadProductImagesHandler)

// User avatar — authenticated user
router.post('/avatar', protect, uploadAvatar, uploadAvatarHandler)

export default router
