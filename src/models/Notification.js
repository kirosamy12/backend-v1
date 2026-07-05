import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['drop_open', 'season_active'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true })

// Unique compound index to prevent duplicate notifications for same event+user
notificationSchema.index({ user: 1, type: 1, referenceId: 1 }, { unique: true })

// Index for efficient user notification lookups by read status
notificationSchema.index({ user: 1, read: 1 })

export default mongoose.model('Notification', notificationSchema)
