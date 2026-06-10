import mongoose from 'mongoose'

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String },                        // Cloudinary URL
  imagePublicId: { type: String },
  badge: { type: String, trim: true },            // e.g. "UP TO 40% OFF"
  badgeColor: { type: String, default: '#FF3333' },
  link: { type: String, trim: true },
  linkText: { type: String, trim: true, default: 'Shop Now' },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true })

// Virtual: is currently active based on dates
promotionSchema.virtual('isLive').get(function () {
  const now = new Date()
  if (!this.isActive) return false
  if (this.startDate && now < this.startDate) return false
  if (this.endDate && now > this.endDate) return false
  return true
})

promotionSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Promotion', promotionSchema)
