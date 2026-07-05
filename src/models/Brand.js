import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const brandThemeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#111111' },
  accentColor:  { type: String, default: '#ffffff' },
  coverImage:   { type: String, default: '' },
  tagline:      { type: String, default: '', maxlength: 120 },
  story:        { type: String, default: '', maxlength: 2000 },
  font:         { type: String, enum: ['system', 'inter', 'playfair', 'space-grotesk', 'integral-cf'], default: 'system' },
}, { _id: false })

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  shippingFee: { type: Number, default: 15 },
  freeShippingMin: { type: Number, default: 200 },
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
  theme: { type: brandThemeSchema, default: () => ({}) },
  refreshToken: { type: String, select: false },
}, { timestamps: true })

brandSchema.pre('save', async function (next) {
  // Auto-generate slug from name if not set
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

brandSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

brandSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  return obj
}

export default mongoose.model('Brand', brandSchema)
