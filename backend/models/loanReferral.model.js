const mongoose = require('mongoose')

const loanReferralSchema = new mongoose.Schema({
  // Referral Details
  referralId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Partner Information
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  
  partnerName: {
    type: String,
    required: true
  },
  
  partnerCode: {
    type: String,
    required: true
  },
  
  // Farmer Information
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  farmerName: {
    type: String,
    required: true
  },
  
  farmerPhone: {
    type: String,
    required: true
  },
  
  farmerEmail: String,
  
  // Loan Details
  loanAmount: {
    type: Number,
    required: true,
    min: 1000,
    max: 10000000 // 10 million Naira max
  },
  
  loanPurpose: {
    type: String,
    required: true,
    enum: [
      'farm_inputs',
      'equipment_purchase',
      'land_expansion',
      'harvest_processing',
      'storage_facilities',
      'transportation',
      'working_capital',
      'other'
    ]
  },
  
  loanTerm: {
    type: Number,
    required: true,
    min: 1,
    max: 60, // 60 months max
    description: 'Loan term in months'
  },
  
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    description: 'Annual interest rate percentage'
  },
  
  // Financial Information
  monthlyIncome: {
    type: Number,
    min: 0,
    description: 'Farmer\'s monthly income in Naira'
  },
  
  existingDebts: {
    type: Number,
    default: 0,
    description: 'Total existing debts in Naira'
  },
  
  collateralValue: {
    type: Number,
    default: 0,
    description: 'Value of offered collateral in Naira'
  },
  
  // Credit Assessment
  creditScore: {
    type: Number,
    min: 300,
    max: 850,
    description: 'Farmer\'s credit score'
  },
  
  riskAssessment: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    description: 'Risk score (0-100, lower is better)'
  },
  
  // Referral Status
  status: {
    type: String,
    enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected', 'funded', 'closed'],
    default: 'pending'
  },
  
  // Processing Timeline
  submittedAt: Date,
  
  reviewedAt: Date,
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  fundedAt: Date,
  
  closedAt: Date,
  
  // Decision Details
  decision: {
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending_additional_info']
    },
    amount: Number,
    term: Number,
    interestRate: Number,
    notes: String,
    conditions: [String]
  },
  
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  
  // Commission & Rewards
  commissionAmount: {
    type: Number,
    default: 0,
    description: 'Commission amount for partner in Naira'
  },
  
  commissionRate: {
    type: Number,
    default: 0.05,
    min: 0,
    max: 1,
    description: 'Commission rate as decimal (0.05 = 5%)'
  },
  
  commissionStatus: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending'
  },
  
  commissionPaidAt: Date,
  
  // Documentation
  requiredDocuments: [{
    type: {
      type: String,
      enum: [
        'bank_statement',
        'utility_bill',
        'national_id',
        'farm_photos',
        'income_proof',
        'collateral_documents',
        'business_plan',
        'other'
      ]
    },
    name: String,
    description: String,
    isRequired: { type: Boolean, default: true },
    isSubmitted: { type: Boolean, default: false },
    submittedAt: Date,
    documentUrl: String
  }],
  
  // Communication History
  communicationHistory: [{
    type: { type: String, enum: ['sms', 'email', 'call', 'in_person'] },
    date: { type: Date, default: Date.now },
    summary: String,
    outcome: String,
    nextAction: String,
    followUpDate: Date
  }],
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpDate: Date,
  
  followUpNotes: String,
  
  // Tags and Categories
  tags: [String],
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Notes and Comments
  partnerNotes: String,
  
  reviewNotes: String,
  
  internalNotes: String,
  
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
loanReferralSchema.index({ partner: 1 })
loanReferralSchema.index({ farmer: 1 })
loanReferralSchema.index({ status: 1 })
loanReferralSchema.index({ riskAssessment: 1 })
loanReferralSchema.index({ createdAt: -1 })
loanReferralSchema.index({ followUpDate: 1 })
loanReferralSchema.index({ commissionStatus: 1 })

// Virtual for loan amount in words
loanReferralSchema.virtual('loanAmountInWords').get(function() {
  const numberToWords = (num) => {
    if (num === 0) return 'Zero'
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '')
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '')
    
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '')
  }
  
  return numberToWords(this.loanAmount) + ' Naira'
})

// Virtual for monthly payment
loanReferralSchema.virtual('monthlyPayment').get(function() {
  if (!this.loanAmount || !this.interestRate || !this.loanTerm) return null
  
  const monthlyRate = this.interestRate / 100 / 12
  const totalPayments = this.loanTerm
  
  if (monthlyRate === 0) {
    return this.loanAmount / totalPayments
  }
  
  const monthlyPayment = this.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
  return Math.round(monthlyPayment)
})

// Virtual for total repayment
loanReferralSchema.virtual('totalRepayment').get(function() {
  if (!this.monthlyPayment || !this.loanTerm) return null
  return this.monthlyPayment * this.loanTerm
})

// Virtual for total interest
loanReferralSchema.virtual('totalInterest').get(function() {
  if (!this.totalRepayment || !this.loanAmount) return null
  return this.totalRepayment - this.loanAmount
})

// Virtual for debt-to-income ratio
loanReferralSchema.virtual('debtToIncomeRatio').get(function() {
  if (!this.monthlyIncome || this.monthlyIncome === 0) return null
  return (this.existingDebts / this.monthlyIncome) * 100
})

// Pre-save middleware
loanReferralSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Generate referral ID if not exists
  if (!this.referralId) {
    this.referralId = this.generateReferralId()
  }
  
  // Calculate commission if loan is approved
  if (this.status === 'approved' && this.decision && this.decision.amount) {
    this.commissionAmount = this.decision.amount * this.commissionRate
    this.commissionStatus = 'calculated'
  }
  
  // Update risk assessment based on credit score
  if (this.creditScore) {
    if (this.creditScore >= 750) {
      this.riskAssessment = 'low'
      this.riskScore = 20
    } else if (this.creditScore >= 650) {
      this.riskAssessment = 'medium'
      this.riskScore = 50
    } else if (this.creditScore >= 550) {
      this.riskAssessment = 'high'
      this.riskScore = 80
    } else {
      this.riskAssessment = 'very_high'
      this.riskScore = 95
    }
  }
  
  next()
})

// Instance method to generate referral ID
loanReferralSchema.methods.generateReferralId = function() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `LOAN${timestamp}${random}`.toUpperCase()
}

// Instance method to submit referral
loanReferralSchema.methods.submit = function() {
  this.status = 'submitted'
  this.submittedAt = new Date()
  return this.save()
}

// Instance method to review referral
loanReferralSchema.methods.review = function(reviewerId, notes) {
  this.status = 'under_review'
  this.reviewedAt = new Date()
  this.reviewedBy = reviewerId
  this.reviewNotes = notes
  return this.save()
}

// Instance method to approve referral
loanReferralSchema.methods.approve = function(decision) {
  this.status = 'approved'
  this.approvedAt = new Date()
  this.decision = decision
  return this.save()
}

// Instance method to reject referral
loanReferralSchema.methods.reject = function(reason) {
  this.status = 'rejected'
  this.rejectionReason = reason
  return this.save()
}

// Instance method to fund loan
loanReferralSchema.methods.fund = function() {
  this.status = 'funded'
  this.fundedAt = new Date()
  return this.save()
}

// Instance method to close referral
loanReferralSchema.methods.close = function() {
  this.status = 'closed'
  this.closedAt = new Date()
  return this.save()
}

// Instance method to add communication record
loanReferralSchema.methods.addCommunication = function(type, summary, outcome, nextAction, followUpDate) {
  this.communicationHistory.push({
    type,
    summary,
    outcome,
    nextAction,
    followUpDate
  })
  
  this.updatedAt = new Date()
  return this.save()
}

// Instance method to mark commission as paid
loanReferralSchema.methods.markCommissionPaid = function() {
  this.commissionStatus = 'paid'
  this.commissionPaidAt = new Date()
  return this.save()
}

// Static method to find by status
loanReferralSchema.statics.findByStatus = function(status) {
  return this.find({ status })
}

// Static method to find pending follow-ups
loanReferralSchema.statics.findPendingFollowUps = function() {
  return this.find({
    followUpRequired: true,
    followUpDate: { $lte: new Date() }
  })
}

// Static method to find by risk level
loanReferralSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ riskAssessment: riskLevel })
}

// Static method to find by partner
loanReferralSchema.statics.findByPartner = function(partnerId) {
  return this.find({ partner: partnerId })
}

// Static method to find by farmer
loanReferralSchema.statics.findByFarmer = function(farmerId) {
  return this.find({ farmer: farmerId })
}

// Static method to get referral statistics
loanReferralSchema.statics.getStats = function(partnerId) {
  return this.aggregate([
    { $match: { partner: partnerId } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalAmount: { $sum: '$loanAmount' },
      totalCommission: { $sum: '$commissionAmount' }
    }}
  ])
}

module.exports = mongoose.model('LoanReferral', loanReferralSchema)

