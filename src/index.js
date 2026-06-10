import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
 
import connectDB from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import orderRoutes from './routes/order.routes.js'
import cartRoutes from './routes/cart.routes.js'
import brandRoutes from './routes/brand.routes.js'
import adminRoutes from './routes/admin.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import publicRoutes from './routes/public.routes.js'
import bannerRoutes from './routes/banner.routes.js'
import promotionRoutes from './routes/promotion.routes.js'
import presenceRoutes from './routes/presence.routes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
 
const app = express()
const PORT = process.env.PORT || 5000

// Connect DB
connectDB()

// Security
app.use(helmet())

// General rate limit
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' })
// Stricter limit for upload endpoints
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many upload requests' })

app.use(generalLimiter)
app.use('/api/upload', uploadLimiter)
// Apply upload limiter only on mutating methods for banners/promotions
app.use('/api/banners', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return uploadLimiter(req, res, next)
  next()
})
app.use('/api/promotions', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return uploadLimiter(req, res, next)
  next()
})

// CORS — allow all vercel domains + localhost
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.DASHBOARD_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    // Allow any vercel.app domain
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Handle preflight requests
app.options('*', cors())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/brand', brandRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/presence', presenceRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// Error handling
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
