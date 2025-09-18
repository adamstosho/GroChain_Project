const mongoose = require('mongoose')

const bvnVerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // BVN Details
  bvn: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{11}$/.test(v)
      },
      message: 'BVN must be exactly 11 digits'
    }
  },
  
  // Personal Information from BVN
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  middleName: {
    type: String,
    trim: true
  },
  
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(\+234|0)[789][01]\d{8}$/.test(v)
      },
      message: 'Phone number must be a valid Nigerian number'
    }
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String
  },
  
  // Bank Account Information
  bankAccounts: [{
    bankName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v)
        },
        message: 'Account number must be exactly 10 digits'
      }
    },
    accountName: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      enum: ['savings', 'current', 'domiciliary'],
      default: 'savings'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  
  verificationDate: Date,
  
  verificationMethod: {
    type: String,
    enum: ['api', 'manual', 'sms'],
    default: 'api'
  },
  
  // Verification Details
  verificationDetails: {
    apiResponse: Object,
    verificationScore: {
      type: Number,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  
  // Document Verification
  documents: [{
    type: {
      type: String,
      enum: ['national_id', 'passport', 'drivers_license', 'voters_card', 'utility_bill']
    },
    documentNumber: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date,
    documentImage: String,
    isVerified: { type: Boolean, default: false }
  }],
  
  // Security & Privacy
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastVerified: {
    type: Date,
    default: Date.now
  },
  
  verificationExpiry: {
    type: Date,
    default: function() {
      // BVN verification expires after 1 year
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  },
  
  // Audit Trail
  verificationHistory: [{
    date: { type: Date, default: Date.now },
    status: String,
    method: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // Compliance
  kycLevel: {
    type: String,
    enum: ['basic', 'enhanced', 'premium'],
    default: 'basic'
  },
  
  complianceStatus: {
    type: String,
    enum: ['compliant', 'non_compliant', 'pending_review'],
    default: 'pending_review'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
bvnVerificationSchema.index({ verificationStatus: 1 })
bvnVerificationSchema.index({ phoneNumber: 1 })
bvnVerificationSchema.index({ 'bankAccounts.accountNumber': 1 })
bvnVerificationSchema.index({ verificationExpiry: 1 })
bvnVerificationSchema.index({ complianceStatus: 1 })

// Virtual for full name
bvnVerificationSchema.virtual('fullName').get(function() {
  const names = [this.firstName, this.middleName, this.lastName].filter(Boolean)
  return names.join(' ')
})

// Virtual for age
bvnVerificationSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
})

// Virtual for verification expiry status
bvnVerificationSchema.virtual('isExpired').get(function() {
  return this.verificationExpiry && new Date() > this.verificationExpiry
})

// Virtual for days until expiry
bvnVerificationSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.verificationExpiry) return null
  const now = new Date()
  const expiry = new Date(this.verificationExpiry)
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
})

// Pre-save middleware
bvnVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Set primary bank account if none exists
  if (this.bankAccounts && this.bankAccounts.length > 0 && !this.bankAccounts.some(acc => acc.isPrimary)) {
    this.bankAccounts[0].isPrimary = true
  }
  
  // Check if verification has expired
  if (this.verificationExpiry && new Date() > this.verificationExpiry && this.verificationStatus === 'verified') {
    this.verificationStatus = 'expired'
  }
  
  next()
})

// Instance method to add verification record
bvnVerificationSchema.methods.addVerificationRecord = function(status, method, verifiedBy, notes, req) {
  this.verificationHistory.push({
    status,
    method,
    verifiedBy,
    notes,
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent')
  })
  
  this.verificationStatus = status
  this.verificationDate = new Date()
  this.lastVerified = new Date()
  
  return this.save()
}

// Instance method to verify document
bvnVerificationSchema.methods.verifyDocument = function(documentType, isVerified) {
  const document = this.documents.find(doc => doc.type === documentType)
  if (document) {
    document.isVerified = isVerified
    return this.save()
  }
  throw new Error('Document not found')
}

// Instance method to add bank account
bvnVerificationSchema.methods.addBankAccount = function(bankAccountData) {
  // Validate account number format
  if (!/^\d{10}$/.test(bankAccountData.accountNumber)) {
    throw new Error('Invalid account number format')
  }
  
  // Check for duplicate account number
  const existingAccount = this.bankAccounts.find(acc => acc.accountNumber === bankAccountData.accountNumber)
  if (existingAccount) {
    throw new Error('Bank account already exists')
  }
  
  this.bankAccounts.push(bankAccountData)
  
  // Set as primary if it's the first account
  if (this.bankAccounts.length === 1) {
    this.bankAccounts[0].isPrimary = true
  }
  
  return this.save()
}

// Instance method to remove bank account
bvnVerificationSchema.methods.removeBankAccount = function(accountNumber) {
  const accountIndex = this.bankAccounts.findIndex(acc => acc.accountNumber === accountNumber)
  if (accountIndex === -1) {
    throw new Error('Bank account not found')
  }
  
  const isPrimary = this.bankAccounts[accountIndex].isPrimary
  this.bankAccounts.splice(accountIndex, 1)
  
  // Set new primary account if primary was removed
  if (isPrimary && this.bankAccounts.length > 0) {
    this.bankAccounts[0].isPrimary = true
  }
  
  return this.save()
}

// Static method to find by BVN
bvnVerificationSchema.statics.findByBVN = function(bvn) {
  return this.findOne({ bvn })
}

// Static method to find pending verifications
bvnVerificationSchema.statics.findPending = function() {
  return this.find({ verificationStatus: 'pending' })
}

// Static method to find expired verifications
bvnVerificationSchema.statics.findExpired = function() {
  return this.find({
    verificationStatus: 'verified',
    verificationExpiry: { $lt: new Date() }
  })
}

// Static method to find by compliance status
bvnVerificationSchema.statics.findByComplianceStatus = function(status) {
  return this.find({ complianceStatus: status })
}

module.exports = mongoose.model('BVNVerification', bvnVerificationSchema)

