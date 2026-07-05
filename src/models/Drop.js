import mongoose from 'mongoose'

const dropSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true,
  },
  dropDate: { type: Date, required: true },
  teaserImage: { type: String, default: '' },
  stock: { type: Number, required: true, min: 0 },
  state: {
    type: String,
    enum: ['scheduled', 'teaser', 'open', 'sold_out'],
    default: 'scheduled',
  },
  notifyList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notified: { type: Boolean, default: false },
}, { timestamps: true })

// Indexes for efficient querying
dropSchema.index({ brand: 1 })
dropSchema.index({ dropDate: 1 })

export default mongoose.model('Drop', dropSchema)
