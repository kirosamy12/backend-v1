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

export const uploadBrandLogo = multer({ storage: brandLogoStorage }).single('logo')
export const uploadProductImages = multer({ storage: productImageStorage }).array('images', 5)
export const uploadAvatar = multer({ storage: avatarStorage }).single('avatar')

// Direct upload helper (for base64 or URL)
export const uploadToCloudinary = async (file, folder = 'shopco') => {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ quality: 'auto' }],
  })
  return result.secure_url
}

export default cloudinary
