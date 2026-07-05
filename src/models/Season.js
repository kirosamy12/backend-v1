import mongoose from 'mongoose'

const seasonSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '', maxlength: 1000 },
  launchDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming',
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true })

// Compound indexes for efficient querying
seasonSchema.index({ brand: 1, status: 1 })
seasonSchema.index({ launchDate: 1, status: 1 })

export default mongoose.model('Season', seasonSchema)
