const mongoose = require('mongoose')

const HarvestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cropType: { type: String, required: true },
  variety: { type: String },
  quantity: { type: Number, required: true, default: 0 },
  date: { type: Date, default: () => new Date() },
  geoLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  batchId: {
    type: String,
    unique: true,
    default: () => `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  },
  qrCode: { type: String }, // QR code image data URL
  qrCodeData: { type: mongoose.Schema.Types.Mixed }, // Structured QR code data
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'approved', 'listed'],
    default: 'pending'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  description: String,
  unit: { type: String, default: 'kg' },
  location: { type: String },
  images: { type: [String], default: [] },
  agriculturalData: {
    soilType: String,
    irrigationMethod: String,
    fertilizerUsed: String,
    pestControl: String,
    harvestMethod: String
  },
  qualityMetrics: {
    moistureContent: Number,
    proteinContent: Number,
    sizeGrade: String,
    colorGrade: String,
    defectPercentage: Number
  },
  sustainability: {
    organicCertified: { type: Boolean, default: false },
    fairTrade: { type: Boolean, default: false },
    carbonFootprint: Number,
    waterUsage: Number
  },
  price: { type: Number }, // Price per unit
  certification: { type: String } // Certification details
}, { timestamps: true })

// Indexes for efficient querying
HarvestSchema.index({ farmer: 1, status: 1 })
HarvestSchema.index({ 'geoLocation.lat': 1, 'geoLocation.lng': 1 })
HarvestSchema.index({ cropType: 1, status: 1 })
HarvestSchema.index({ createdAt: -1 })

// Transform to remove circular references
HarvestSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

HarvestSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('Harvest', HarvestSchema)


