import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import Notification from '../models/Notification.js'

const router = Router()

/**
 * GET /api/users/me/notifications
 * Returns paginated notifications for the authenticated user, newest first.
 */
router.get('/me/notifications', protect, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ user: req.user._id }),
    ])

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false })

    res.json({
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount,
    })
  } catch (err) { next(err) }
})

/**
 * PATCH /api/users/me/notifications/:id/read
 * Marks a notification as read for the authenticated user.
 */
router.patch('/me/notifications/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!notification) return res.status(404).json({ message: 'Notification not found' })

    notification.read = true
    await notification.save()

    res.json({ notification })
  } catch (err) { next(err) }
})

export default router
