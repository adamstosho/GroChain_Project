const mongoose = require('mongoose')

const FinancialGoalSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['savings', 'investment', 'debt_reduction', 'business_expansion', 'equipment_purchase', 'education', 'emergency_fund'], 
    required: true 
  },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'NGN' },
  startDate: { type: Date, default: Date.now },
  targetDate: { type: Date, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'cancelled'], 
    default: 'active' 
  },
  milestones: [{
    amount: { type: Number, required: true },
    description: String,
    achieved: { type: Boolean, default: false },
    achievedAt: Date
  }],
  progress: { type: Number, default: 0, min: 0, max: 100 }, // Percentage
  category: {
    type: String,
    enum: ['short_term', 'medium_term', 'long_term'],
    default: 'medium_term'
  },
  tags: [String],
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  reminders: [{
    date: Date,
    message: String,
    sent: { type: Boolean, default: false }
  }],
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false }
}, { timestamps: true })

// Indexes
FinancialGoalSchema.index({ farmer: 1, status: 1 })
FinancialGoalSchema.index({ type: 1, priority: 1 })
FinancialGoalSchema.index({ targetDate: 1 })
FinancialGoalSchema.index({ progress: 1 })

// Virtual for days remaining
FinancialGoalSchema.virtual('daysRemaining').get(function() {
  return Math.ceil((this.targetDate - new Date()) / (1000 * 60 * 60 * 24))
})

// Virtual for isOverdue
FinancialGoalSchema.virtual('isOverdue').get(function() {
  return new Date() > this.targetDate && this.status === 'active'
})

// Virtual for completion status
FinancialGoalSchema.virtual('completionStatus').get(function() {
  if (this.progress >= 100) return 'completed'
  if (this.isOverdue) return 'overdue'
  if (this.daysRemaining < 30) return 'urgent'
  if (this.daysRemaining < 90) return 'approaching'
  return 'on_track'
})

// Pre-save middleware to calculate progress
FinancialGoalSchema.pre('save', function(next) {
  if (this.targetAmount > 0) {
    this.progress = Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100))
  }
  
  // Auto-complete if target reached
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed'
  }
  
  next()
})

// Methods
FinancialGoalSchema.methods.updateProgress = function(newAmount) {
  this.currentAmount = newAmount
  if (this.targetAmount > 0) {
    this.progress = Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100))
  }
  return this.save()
}

FinancialGoalSchema.methods.addMilestone = function(amount, description) {
  this.milestones.push({ amount, description })
  return this.save()
}

FinancialGoalSchema.methods.markMilestoneAchieved = function(milestoneIndex) {
  if (this.milestones[milestoneIndex]) {
    this.milestones[milestoneIndex].achieved = true
    this.milestones[milestoneIndex].achievedAt = new Date()
    return this.save()
  }
  throw new Error('Milestone not found')
}

// Static methods
FinancialGoalSchema.statics.getActiveGoals = function(farmerId) {
  return this.find({ 
    farmer: farmerId, 
    status: 'active' 
  }).sort({ priority: -1, targetDate: 1 })
}

FinancialGoalSchema.statics.getOverdueGoals = function(farmerId) {
  return this.find({
    farmer: farmerId,
    status: 'active',
    targetDate: { $lt: new Date() }
  }).sort({ targetDate: 1 })
}

FinancialGoalSchema.statics.getGoalsByType = function(farmerId, type) {
  return this.find({ 
    farmer: farmerId, 
    type: type,
    status: 'active' 
  }).sort({ targetDate: 1 })
}

FinancialGoalSchema.statics.getGoalsByPriority = function(farmerId, priority) {
  return this.find({ 
    farmer: farmerId, 
    priority: priority,
    status: 'active' 
  }).sort({ targetDate: 1 })
}

module.exports = mongoose.model('FinancialGoal', FinancialGoalSchema)



