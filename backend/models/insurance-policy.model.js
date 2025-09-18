const mongoose = require('mongoose')

const InsurancePolicySchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['crop', 'equipment', 'livestock', 'property', 'liability'], 
    required: true 
  },
  provider: { type: String, required: true },
  policyNumber: { type: String, required: true, unique: true },
  coverageAmount: { type: Number, required: true, min: 0 },
  premium: { type: Number, required: true, min: 0 },
  deductible: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled', 'suspended'], 
    default: 'active' 
  },
  region: { type: String, required: true },
  coverageDetails: {
    crops: [String],
    equipment: [String],
    livestock: [String],
    exclusions: [String],
    specialConditions: [String]
  },
  claims: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceClaim' }],
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: String,
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  renewalDate: Date,
  autoRenew: { type: Boolean, default: false }
}, { timestamps: true })

// Indexes
InsurancePolicySchema.index({ farmer: 1, status: 1 })
InsurancePolicySchema.index({ type: 1, region: 1 })
InsurancePolicySchema.index({ startDate: 1, endDate: 1 })

// Virtual for policy duration
InsurancePolicySchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24 * 30))
})

// Virtual for days until expiry
InsurancePolicySchema.virtual('daysUntilExpiry').get(function() {
  return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24))
})

// Virtual for isExpired
InsurancePolicySchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate
})

// Methods
InsurancePolicySchema.methods.isActive = function() {
  return this.status === 'active' && !this.isExpired
}

InsurancePolicySchema.methods.getRemainingCoverage = function() {
  if (!this.isActive()) return 0
  return this.coverageAmount
}

// Static methods
InsurancePolicySchema.statics.getActivePolicies = function(farmerId) {
  return this.find({ 
    farmer: farmerId, 
    status: 'active',
    endDate: { $gt: new Date() }
  })
}

InsurancePolicySchema.statics.getExpiringPolicies = function(days = 30) {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + days)
  
  return this.find({
    status: 'active',
    endDate: { $lte: threshold, $gt: new Date() }
  })
}

module.exports = mongoose.model('InsurancePolicy', InsurancePolicySchema)


