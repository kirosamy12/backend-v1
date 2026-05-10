import { Router } from 'express'
import { register, login, refresh, getMe, updateMe, changePassword, logout } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.put('/me', protect, updateMe)
router.put('/change-password', protect, changePassword)

export default router
