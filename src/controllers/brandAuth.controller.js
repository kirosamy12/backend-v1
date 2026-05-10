import jwt from 'jsonwebtoken'
import Brand from '../models/Brand.js'

const signToken = (id) =>
  jwt.sign({ id, role: 'brand' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' })

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

// GET /api/brand/auth/me
export const getBrandMe = (req, res) => {
  res.json({ brand: req.brand })
}
