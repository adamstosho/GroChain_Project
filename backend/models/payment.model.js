const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'bank_transfer', 'ussd', 'mobile_money', 'cash']
  },
  provider: {
    type: String,
    required: true,
    enum: ['paystack', 'flutterwave', 'stripe', 'system']
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  providerReference: {
    type: String,
    sparse: true
  },
  providerTransactionId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  callbackUrl: {
    type: String
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  },
  processedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  description: {
    type: String
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
})

// Indexes
paymentSchema.index({ user: 1, status: 1 })
// paymentSchema.index({ providerReference: 1 })
paymentSchema.index({ status: 1, createdAt: 1 })
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Virtual for isExpired
paymentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt
})

// Virtual for canRefund
paymentSchema.virtual('canRefund').get(function() {
  return this.status === 'completed' && !this.refundedAt
})

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.processedAt = new Date()
  }
  next()
})

// Static methods
paymentSchema.statics.findByReference = function(reference) {
  return this.findOne({ reference })
}

paymentSchema.statics.findByProviderReference = function(providerReference) {
  return this.findOne({ providerReference })
}

paymentSchema.statics.findPendingPayments = function() {
  return this.find({ 
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
}

paymentSchema.statics.findExpiredPayments = function() {
  return this.find({ 
    status: 'pending',
    expiresAt: { $lte: new Date() }
  })
}

// Instance methods
paymentSchema.methods.markAsCompleted = function(providerData = {}) {
  this.status = 'completed'
  this.processedAt = new Date()
  
  if (providerData.reference) {
    this.providerReference = providerData.reference
  }
  
  if (providerData.transactionId) {
    this.providerTransactionId = providerData.transactionId
  }
  
  return this.save()
}

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed'
  this.failureReason = reason
  this.processedAt = new Date()
  return this.save()
}

paymentSchema.methods.markAsRefunded = function(amount, reason) {
  this.status = 'refunded'
  this.refundedAt = new Date()
  this.refundAmount = amount || this.amount
  this.refundReason = reason
  return this.save()
}

paymentSchema.methods.canProcess = function() {
  return this.status === 'pending' && !this.isExpired
}

module.exports = mongoose.model('Payment', paymentSchema)
