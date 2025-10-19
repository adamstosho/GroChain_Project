const mongoose = require('mongoose')

const referralSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  
  // Referral Details
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  referralCode: {
    type: String,
    required: true,
    default: function() {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 5)
      return `REF${timestamp}${random}`.toUpperCase()
    }
  },
  
  referralDate: {
    type: Date,
    default: Date.now
  },
  
  activationDate: Date,
  
  completionDate: Date,
  
  // Commission Information
  commissionRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.02, // 2% default commission
    description: 'Commission rate as decimal (0.02 = 2%)'
  },
  
  commission: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Actual commission amount earned'
  },
  
  commissionStatus: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending'
  },
  
  commissionPaidAt: Date,
  
  // Performance Metrics
  performanceMetrics: {
    totalTransactions: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    customerRetention: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  // Notes and Communication
  notes: {
    type: String,
    maxlength: 500
  },
  
  communicationHistory: [{
    type: { type: String, enum: ['sms', 'email', 'call', 'visit', 'other'] },
    date: { type: Date, default: Date.now },
    summary: String,
    outcome: String
  }],
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpDate: Date,
  
  followUpNotes: String,
  
  // Expiration and Renewal
  expiresAt: {
    type: Date,
    default: function() {
      // Referral expires after 1 year
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  },
  
  isRenewable: {
    type: Boolean,
    default: true
  },
  
  renewalDate: Date,
  
  // Tags and Categories
  tags: [String],
  
  category: {
    type: String,
    enum: ['new_farmer', 'returning_farmer', 'high_value', 'strategic', 'other'],
    default: 'new_farmer'
  },
  
  // Status tracking
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
referralSchema.index({ farmer: 1, partner: 1 }, { unique: true })
referralSchema.index({ status: 1 })
referralSchema.index({ partner: 1 })
referralSchema.index({ expiresAt: 1 })
referralSchema.index({ commissionStatus: 1 })

// Virtual for referral age in days
referralSchema.virtual('referralAge').get(function() {
  const now = new Date()
  const created = this.createdAt
  return Math.floor((now - created) / (1000 * 60 * 60 * 24))
})

// Virtual for days until expiration
referralSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date()
  const expires = this.expiresAt
  return Math.ceil((expires - now) / (1000 * 60 * 60 * 24))
})

// Virtual for commission percentage
referralSchema.virtual('commissionPercentage').get(function() {
  return (this.commissionRate * 100).toFixed(1)
})

// Pre-save middleware
referralSchema.pre('save', function(next) {
  // Generate referral code if not exists
  if (!this.referralCode) {
    // Generate referral code directly (avoiding instance method issues)
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    this.referralCode = `REF${timestamp}${random}`.toUpperCase()
  }

  // Update last activity
  this.lastActivity = new Date()

  // Set activation date when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.activationDate) {
    this.activationDate = new Date()
  }

  // Set completion date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completionDate) {
    this.completionDate = new Date()
  }

  // Check if referral has expired
  if (this.expiresAt && new Date() > this.expiresAt && this.status === 'pending') {
    this.status = 'expired'
  }

  next()
})

// Instance method to generate referral code
referralSchema.methods.generateReferralCode = function() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `REF${timestamp}${random}`.toUpperCase()
}

// Instance method to calculate commission
referralSchema.methods.calculateCommission = function(transactionAmount) {
  this.commission = transactionAmount * this.commissionRate
  this.commissionStatus = 'calculated'
  this.performanceMetrics.totalTransactions += 1
  this.performanceMetrics.totalValue += transactionAmount
  this.performanceMetrics.averageOrderValue = this.performanceMetrics.totalValue / this.performanceMetrics.totalTransactions
  
  return this.save()
}

// Instance method to mark commission as paid
referralSchema.methods.markCommissionPaid = function() {
  this.commissionStatus = 'paid'
  this.commissionPaidAt = new Date()
  return this.save()
}

// Instance method to add communication record
referralSchema.methods.addCommunication = function(type, summary, outcome) {
  this.communicationHistory.push({
    type,
    summary,
    outcome
  })
  this.lastActivity = new Date()
  return this.save()
}

// Static method to find active referrals
referralSchema.statics.findActive = function() {
  return this.find({ 
    status: { $in: ['pending', 'active'] },
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
}

// Static method to find expired referrals
referralSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $lte: new Date() }
  })
}

// Static method to find referrals by partner
referralSchema.statics.findByPartner = function(partnerId) {
  return this.find({ partner: partnerId }).populate('farmer', 'name email phone region')
}

// Static method to find referrals by farmer
referralSchema.statics.findByFarmer = function(farmerId) {
  return this.find({ farmer: farmerId }).populate('partner', 'name type contactEmail')
}

// Static method to get referral statistics
referralSchema.statics.getStats = function(partnerId) {
  return this.aggregate([
    { $match: { partner: partnerId } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalCommission: { $sum: '$commission' }
    }}
  ])
}

module.exports = mongoose.model('Referral', referralSchema)

