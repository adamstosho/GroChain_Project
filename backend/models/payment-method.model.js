const mongoose = require('mongoose')

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['card', 'bank_account', 'mobile_money', 'wallet']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastUsed: {
    type: Date
  },
  details: {
    // For cards
    last4: String,
    expiry: String,
    brand: String,
    cardholderName: String,
    
    // For bank accounts
    bankName: String,
    accountNumber: String,
    accountName: String,
    bankCode: String,
    
    // For mobile money
    phoneNumber: String,
    provider: String,
    
    // For wallet
    walletId: String,
    walletType: String
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    provider: String, // e.g., 'paystack', 'flutterwave'
    externalId: String // ID from payment provider
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
})

// Indexes
paymentMethodSchema.index({ user: 1, type: 1 })
paymentMethodSchema.index({ user: 1, isDefault: 1 })
paymentMethodSchema.index({ status: 1 })

// Pre-save middleware
paymentMethodSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date()
  next()
})

// Static methods
paymentMethodSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, status: 'active' }).sort({ isDefault: -1, createdAt: -1 })
}

paymentMethodSchema.statics.findDefaultByUser = function(userId) {
  return this.findOne({ user: userId, isDefault: true, status: 'active' })
}

// Instance methods
paymentMethodSchema.methods.setAsDefault = async function() {
  // First, unset any existing default for this user
  await this.constructor.updateMany(
    { user: this.user, isDefault: true },
    { isDefault: false }
  )
  
  // Set this one as default
  this.isDefault = true
  return this.save()
}

paymentMethodSchema.methods.markAsUsed = function() {
  this.lastUsed = new Date()
  return this.save()
}

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema)

