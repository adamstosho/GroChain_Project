const mongoose = require('mongoose')

const farmerProfileSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Information
  farmName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  farmSize: {
    type: Number,
    min: 0,
    description: 'Farm size in hectares'
  },
  
  farmLocation: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Farming Details
  primaryCrops: [{
    type: String,
    enum: ['maize', 'rice', 'cassava', 'yam', 'sorghum', 'millet', 'beans', 'vegetables', 'fruits', 'other']
  }],
  
  farmingExperience: {
    type: Number,
    min: 0,
    description: 'Years of farming experience'
  },
  
  farmingMethod: {
    type: String,
    enum: ['traditional', 'modern', 'organic', 'mixed', 'other'],
    default: 'traditional'
  },
  
  irrigationType: {
    type: String,
    enum: ['rainfed', 'manual', 'drip', 'sprinkler', 'flood', 'other'],
    default: 'rainfed'
  },
  
  // Financial Information
  annualIncome: {
    type: Number,
    min: 0,
    description: 'Annual income from farming in Naira'
  },
  
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['english', 'hausa', 'yoruba', 'igbo', 'other'],
      default: 'english'
    },
    
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    
    marketPreferences: {
      preferredBuyers: [String],
      preferredPaymentMethods: [String],
      preferredDeliveryMethods: [String]
    }
  },
  
  // Settings
  settings: {
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private', 'partners'], default: 'public' },
      dataSharing: { type: Boolean, default: true }
    },
    
    business: {
      autoAcceptOrders: { type: Boolean, default: false },
      minimumOrderAmount: { type: Number, default: 0 },
      maxDeliveryDistance: { type: Number, default: 50 }
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  verificationDocuments: [{
    type: { type: String, enum: ['id_card', 'utility_bill', 'bank_statement', 'farm_photo', 'other'] },
    url: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Partner Information
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  
  referralDate: Date,
  
  // Performance Metrics
  performanceMetrics: {
    totalHarvests: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    onTimeDelivery: { type: Number, default: 0, min: 0, max: 100 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
farmerProfileSchema.index({ 'farmLocation.state': 1 })
farmerProfileSchema.index({ primaryCrops: 1 })
farmerProfileSchema.index({ verificationStatus: 1 })
farmerProfileSchema.index({ referredBy: 1 })

// Virtual for full address
farmerProfileSchema.virtual('fullAddress').get(function() {
  if (!this.farmLocation) return ''
  const { address, city, state } = this.farmLocation
  return [address, city, state].filter(Boolean).join(', ')
})

// Virtual for verification completion percentage
farmerProfileSchema.virtual('verificationProgress').get(function() {
  if (!this.verificationDocuments || this.verificationDocuments.length === 0) return 0
  const verifiedDocs = this.verificationDocuments.filter(doc => doc.verified).length
  return Math.round((verifiedDocs / this.verificationDocuments.length) * 100)
})

// Pre-save middleware
farmerProfileSchema.pre('save', function(next) {
  this.lastActivity = new Date()
  next()
})

// Static method to find farmers by location
farmerProfileSchema.statics.findByLocation = function(state, city) {
  const query = {}
  if (state) query['farmLocation.state'] = state
  if (city) query['farmLocation.city'] = city
  return this.find(query)
}

// Static method to find farmers by crop
farmerProfileSchema.statics.findByCrop = function(cropType) {
  return this.find({ primaryCrops: cropType })
}

// Instance method to update performance metrics
farmerProfileSchema.methods.updatePerformanceMetrics = function(harvestData) {
  this.performanceMetrics.totalHarvests += 1
  this.performanceMetrics.totalSales += harvestData.salesAmount || 0
  
  if (harvestData.rating) {
    const currentTotal = this.performanceMetrics.averageRating * (this.performanceMetrics.totalHarvests - 1)
    this.performanceMetrics.averageRating = (currentTotal + harvestData.rating) / this.performanceMetrics.totalHarvests
  }
  
  return this.save()
}

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema)

