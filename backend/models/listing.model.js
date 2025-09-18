const mongoose = require('mongoose')

const ListingSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  harvest: { type: mongoose.Schema.Types.ObjectId, ref: 'Harvest' },
  cropName: { type: String, required: true },
  category: { type: String, required: true },
  variety: { type: String },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  availableQuantity: { type: Number, required: true, min: 0 },
  seasonality: [{ type: String }],
  qualityGrade: { type: String, enum: ['premium', 'standard', 'basic'], default: 'standard' },
  organic: { type: Boolean, default: false },
  certifications: [{ type: String }],
  images: [{ type: String }],
  location: { type: String, required: true }, // Simple string to avoid geospatial issues
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'sold_out', 'expired'],
    default: 'active'
  },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  metadata: { type: Object }
}, { timestamps: true })

// Simple indexes (no geospatial)
ListingSchema.index({ farmer: 1 })
ListingSchema.index({ cropName: 1 })
ListingSchema.index({ category: 1 })
ListingSchema.index({ status: 1 })
ListingSchema.index({ featured: 1 })
ListingSchema.index({ createdAt: -1 })

// Transform to remove circular references
ListingSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

ListingSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('Listing', ListingSchema)