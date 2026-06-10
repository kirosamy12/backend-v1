import jwt from 'jsonwebtoken'
import Brand from '../models/Brand.js'

const signToken = (id) =>
  jwt.sign({ id, role: 'brand' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const signRefreshToken = (id) =>
  jwt.sign({ id, role: 'brand' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

// POST /api/brand/auth/login
export const brandLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const brand = await Brand.findOne({ email }).select('+password')
    if (!brand || !(await brand.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (brand.status !== 'active') {
      return res.status(403).json({ message: 'Brand account is not active yet' })
    }

    const token = signToken(brand._id)
    const refreshToken = signRefreshToken(brand._id)
    brand.refreshToken = refreshToken
    await brand.save({ validateBeforeSave: false })

    res.json({ token, refreshToken, brand })
  } catch (err) { next(err) }
}

// POST /api/brand/auth/refresh
export const refreshBrandToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const brand = await Brand.findById(decoded.id)
    if (!brand || brand.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }
    if (brand.status !== 'active') {
      return res.status(403).json({ message: 'Brand account is not active' })
    }

    const token = signToken(brand._id)
    res.json({ token })
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

// GET /api/brand/auth/me
export const getBrandMe = (req, res) => {
  res.json({ brand: req.brand })
}
