const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Optional reference to order
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  images: [{ type: String }], // Optional review images
  verified: { type: Boolean, default: false }, // Verified purchase
  helpful: { type: Number, default: 0 }, // Number of helpful votes
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' 
  },
  response: { // Farmer's response to review
    comment: { type: String, maxlength: 1000 },
    respondedAt: { type: Date }
  }
}, { timestamps: true })

// Indexes for efficient queries
ReviewSchema.index({ listing: 1 })
ReviewSchema.index({ buyer: 1 })
ReviewSchema.index({ farmer: 1 })
ReviewSchema.index({ rating: 1 })
ReviewSchema.index({ createdAt: -1 })
ReviewSchema.index({ status: 1 })

// Ensure one review per buyer per listing
ReviewSchema.index({ listing: 1, buyer: 1 }, { unique: true })

// Transform to remove circular references
ReviewSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

ReviewSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('Review', ReviewSchema)


