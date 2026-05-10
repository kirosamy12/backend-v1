import { Router } from 'express'
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getBrandProducts } from '../controllers/product.controller.js'
import { protect, protectBrand } from '../middleware/auth.js'

const router = Router()

router.get('/', getProducts)
router.get('/:id', getProduct)
router.post('/', protectBrand, createProduct)
router.put('/:id', protectBrand, updateProduct)
router.delete('/:id', protectBrand, deleteProduct)

export default router
