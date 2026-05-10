import { Router } from 'express'
import {
  adminLogin, getAdminOverview, getRevenueAnalytics,
  getBrands, createBrand, updateBrand, deleteBrand,
  getUsers, updateUserStatus,
  getAllOrders,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getCategories, createCategory, deleteCategory,
} from '../controllers/admin.controller.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()

// Auth
router.post('/auth/login', adminLogin)

// Analytics
router.get('/analytics/overview', protectAdmin, getAdminOverview)
router.get('/analytics/revenue', protectAdmin, getRevenueAnalytics)

// Brands
router.get('/brands', protectAdmin, getBrands)
router.post('/brands', protectAdmin, createBrand)
router.put('/brands/:id', protectAdmin, updateBrand)
router.delete('/brands/:id', protectAdmin, deleteBrand)

// Users
router.get('/users', protectAdmin, getUsers)
router.put('/users/:id/status', protectAdmin, updateUserStatus)

// Orders
router.get('/orders', protectAdmin, getAllOrders)

// Coupons
router.get('/coupons', protectAdmin, getCoupons)
router.post('/coupons', protectAdmin, createCoupon)
router.put('/coupons/:id', protectAdmin, updateCoupon)
router.delete('/coupons/:id', protectAdmin, deleteCoupon)

// Categories
router.get('/categories', protectAdmin, getCategories)
router.post('/categories', protectAdmin, createCategory)
router.delete('/categories/:id', protectAdmin, deleteCategory)

export default router
