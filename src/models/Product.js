import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  images: [{ type: String }],
  sizes: [{ type: String }],
  colors: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  sold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  tags: [{ type: String }],
}, { timestamps: true })

// Auto-update status based on stock
productSchema.pre('save', function (next) {
  if (this.stock === 0) this.status = 'out_of_stock'
  next()
})

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ brand: 1, status: 1 })
productSchema.index({ category: 1 })

export default mongoose.model('Product', productSchema)
