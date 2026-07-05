import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { toggleFollow, getFollowStatus } from '../controllers/follow.controller.js'

const router = Router()

// POST /api/brands/:id/follow — toggle follow (requires auth)
router.post('/:id/follow', protect, toggleFollow)

// GET /api/brands/:id/follow-status — get follow status (requires auth)
router.get('/:id/follow-status', protect, getFollowStatus)

export default router
