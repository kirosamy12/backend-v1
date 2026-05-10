import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const signToken = (id, role = 'user') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' })

const signRefreshToken = (id, role = 'user') =>
  jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' })

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)
    const refreshToken = signRefreshToken(user._id)

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    res.status(201).json({ token, refreshToken, user })
  } catch (err) { next(err) }
}

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' })

    const token = signToken(user._id)
    const refreshToken = signRefreshToken(user._id)
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    res.json({ token, refreshToken, user })
  } catch (err) { next(err) }
}

// POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id).select('+refreshToken')
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const token = signToken(user._id)
    res.json({ token })
  } catch (err) { next(err) }
}

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: req.user })
}

// PUT /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, phone, birthday } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, birthday },
      { new: true, runValidators: true }
    )
    res.json({ user })
  } catch (err) { next(err) }
}

// PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated successfully' })
  } catch (err) { next(err) }
}

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: '' })
    res.json({ message: 'Logged out successfully' })
  } catch (err) { next(err) }
}
