import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  image: { type: String, required: true },        // Cloudinary URL
  imagePublicId: { type: String },                // for deletion
  link: { type: String, trim: true },             // optional CTA link
  linkText: { type: String, trim: true },         // CTA button text
  position: { type: Number, default: 0 },         // display order
  isActive: { type: Boolean, default: true },
  type: {
    type: String,
    enum: ['hero', 'promo', 'sidebar'],
    default: 'hero',
  },
}, { timestamps: true })

export default mongoose.model('Banner', bannerSchema)
