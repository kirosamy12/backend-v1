import User from '../models/User.js'
import Brand from '../models/Brand.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Coupon from '../models/Coupon.js'
import Category from '../models/Category.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ─── Auth ────────────────────────────────────────────────────
// POST /api/admin/auth/login
export const adminLogin = (req, res) => {
  const { email, password } = req.body
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  const token = jwt.sign({ role: 'superadmin', email }, process.env.JWT_SECRET, { expiresIn: '1d' })
  res.json({ token, user: { email, role: 'superadmin', name: 'Super Admin' } })
}

// ─── Overview ────────────────────────────────────────────────
// GET /api/admin/analytics/overview
export const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, totalBrands, totalOrders, revenueResult] = await Promise.all([
      User.countDocuments(),
      Brand.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    ])

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(10)

    res.json({
      totalUsers,
      totalBrands,
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      recentOrders,
    })
  } catch (err) { next(err) }
}

// GET /api/admin/analytics/revenue
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const monthly = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ])
    res.json({ monthly })
  } catch (err) { next(err) }
}

// ─── Brands ──────────────────────────────────────────────────
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort('-createdAt')
    res.json({ brands })
  } catch (err) { next(err) }
}

export const createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body)
    res.status(201).json({ brand })
  } catch (err) { next(err) }
}

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!brand) return res.status(404).json({ message: 'Brand not found' })
    res.json({ brand })
  } catch (err) { next(err) }
}

export const deleteBrand = async (req, res, next) => {
  try {
    await Brand.findByIdAndDelete(req.params.id)
    res.json({ message: 'Brand deleted' })
  } catch (err) { next(err) }
}

// ─── Users ───────────────────────────────────────────────────
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const query = {}
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
    const total = await User.countDocuments(query)
    const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    res.json({ users, total })
  } catch (err) { next(err) }
}

export const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) { next(err) }
}

// ─── All Orders ──────────────────────────────────────────────
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, brand } = req.query
    const query = {}
    if (status) query.status = status
    if (brand) query['items.brand'] = brand

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ orders, total })
  } catch (err) { next(err) }
}

// ─── Coupons ─────────────────────────────────────────────────
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt')
    res.json({ coupons })
  } catch (err) { next(err) }
}

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body)
    res.status(201).json({ coupon })
  } catch (err) { next(err) }
}

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' })
    res.json({ coupon })
  } catch (err) { next(err) }
}

export const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    res.json({ message: 'Coupon deleted' })
  } catch (err) { next(err) }
}

// ─── Categories ──────────────────────────────────────────────
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('order')
    res.json({ categories })
  } catch (err) { next(err) }
}

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const category = await Category.create({ name, slug })
    res.status(201).json({ category })
  } catch (err) { next(err) }
}

export const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Category deleted' })
  } catch (err) { next(err) }
}
