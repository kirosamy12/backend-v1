import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Brand from '../models/Brand.js'

// Verify customer JWT
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.token

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' })

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Verify brand JWT
export const protectBrand = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.brandToken

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'brand') return res.status(403).json({ message: 'Not a brand account' })

    const brand = await Brand.findById(decoded.id)
    if (!brand || brand.status !== 'active') return res.status(401).json({ message: 'Brand not found or inactive' })

    req.brand = brand
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Verify super admin JWT
export const protectAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.adminToken

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'superadmin') return res.status(403).json({ message: 'Admin access required' })

    req.admin = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
