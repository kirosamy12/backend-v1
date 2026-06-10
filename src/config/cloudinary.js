import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Storage for brand logos
const brandLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopco/brands',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }],
  },
})

// Storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopco/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
})

// Storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopco/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
})

// Storage for banners
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopco/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1440, height: 600, crop: 'limit', quality: 'auto' }],
  },
})

// Storage for promotions
const promotionStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopco/promotions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
  },
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const uploadBrandLogo = multer({ storage: brandLogoStorage, limits: { fileSize: MAX_FILE_SIZE } }).single('logo')
export const uploadProductImages = multer({ storage: productImageStorage, limits: { fileSize: MAX_FILE_SIZE } }).array('images', 5)
export const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar')
export const uploadBannerImage = multer({ storage: bannerStorage, limits: { fileSize: MAX_FILE_SIZE } }).single('image')
export const uploadPromotionImage = multer({ storage: promotionStorage, limits: { fileSize: MAX_FILE_SIZE } }).single('image')

// Direct upload helper (for base64 or URL)
export const uploadToCloudinary = async (file, folder = 'shopco') => {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ quality: 'auto' }],
  })
  return result.secure_url
}

export default cloudinary
