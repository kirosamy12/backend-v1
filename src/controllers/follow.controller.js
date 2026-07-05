import User from '../models/User.js'
import Brand from '../models/Brand.js'
import Notification from '../models/Notification.js'

/**
 * POST /api/brands/:id/follow
 * Toggle follow/unfollow for the authenticated user.
 * Returns { following: boolean }
 */
export async function toggleFollow(req, res, next) {
  try {
    const { id: brandId } = req.params
    const userId = req.user._id

    // Validate brand exists
    const brand = await Brand.findById(brandId)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isFollowing = user.followedBrands.some(
      b => b.toString() === brandId.toString()
    )

    if (isFollowing) {
      // Unfollow — remove from array
      user.followedBrands = user.followedBrands.filter(
        b => b.toString() !== brandId.toString()
      )
      await user.save()
      return res.json({ following: false })
    } else {
      // Follow — add to array
      user.followedBrands.push(brandId)
      await user.save()
      return res.json({ following: true })
    }
  } catch (err) { next(err) }
}

/**
 * GET /api/brands/:id/follow-status
 * Returns { following: boolean } for the authenticated user.
 */
export async function getFollowStatus(req, res, next) {
  try {
    const { id: brandId } = req.params
    const userId = req.user._id

    const user = await User.findById(userId).select('followedBrands')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const following = user.followedBrands.some(
      b => b.toString() === brandId.toString()
    )

    res.json({ following })
  } catch (err) { next(err) }
}

/**
 * Dispatches season_active notifications to all users who follow the brand.
 * Uses upsert to prevent duplicate notifications (Property 8).
 *
 * @param {object} season - Season document with populated brand
 * @param {mongoose.Types.ObjectId} brandId - The brand ID
 */
export async function dispatchSeasonNotifications(season, brandId) {
  // Find all users who follow this brand
  const followers = await User.find({
    followedBrands: brandId,
  }).select('_id')

  if (followers.length === 0) return

  const ops = followers.map(user => ({
    updateOne: {
      filter: {
        user: user._id,
        type: 'season_active',
        referenceId: season._id,
      },
      update: {
        $setOnInsert: {
          user: user._id,
          type: 'season_active',
          referenceId: season._id,
          message: `A season you're following is now live!`,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }))

  await Notification.bulkWrite(ops)
}
