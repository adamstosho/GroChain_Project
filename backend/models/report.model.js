const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['financial', 'harvest', 'marketplace', 'weather', 'impact', 'custom'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand'], 
    default: 'monthly' 
  },
  status: { 
    type: String, 
    enum: ['draft', 'generating', 'completed', 'failed', 'archived'], 
    default: 'draft' 
  },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parameters: {
    startDate: Date,
    endDate: Date,
    regions: [String],
    cropTypes: [String],
    userRoles: [String],
    metrics: [String],
    filters: mongoose.Schema.Types.Mixed
  },
  data: {
    summary: mongoose.Schema.Types.Mixed,
    charts: [{
      type: String,
      title: String,
      data: mongoose.Schema.Types.Mixed,
      config: mongoose.Schema.Types.Mixed
    }],
    tables: [{
      title: String,
      headers: [String],
      rows: [[mongoose.Schema.Types.Mixed]],
      totals: mongoose.Schema.Types.Mixed
    }],
    insights: [{
      type: String,
      message: String,
      severity: String,
      recommendation: String
    }]
  },
  format: { 
    type: String, 
    enum: ['json', 'csv', 'pdf', 'excel'], 
    default: 'json' 
  },
  fileUrl: String,
  fileSize: Number,
  generationTime: Number, // in milliseconds
  expiresAt: Date,
  isPublic: { type: Boolean, default: false },
  tags: [String],
  notes: String,
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    generatedAt: Date,
    fileUrl: String
  }]
}, { timestamps: true })

// Indexes
ReportSchema.index({ type: 1, status: 1 })
ReportSchema.index({ generatedBy: 1, createdAt: -1 })
ReportSchema.index({ category: 1, status: 1 })
ReportSchema.index({ expiresAt: 1 })
ReportSchema.index({ tags: 1 })

// Virtual for isExpired
ReportSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false
  return new Date() > this.expiresAt
})

// Virtual for age
ReportSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24))
})

// Pre-save middleware
ReportSchema.pre('save', function(next) {
  // Auto-set expiry for certain report types
  if (!this.expiresAt) {
    const expiryMap = {
      daily: 7,
      weekly: 30,
      monthly: 90,
      quarterly: 180,
      annual: 365
    }
    
    if (expiryMap[this.category]) {
      this.expiresAt = new Date()
      this.expiresAt.setDate(this.expiresAt.getDate() + expiryMap[this.category])
    }
  }
  
  next()
})

// Methods
ReportSchema.methods.markAsCompleted = function(fileUrl, fileSize, generationTime) {
  this.status = 'completed'
  this.fileUrl = fileUrl
  this.fileSize = fileSize
  this.generationTime = generationTime
  return this.save()
}

ReportSchema.methods.markAsFailed = function() {
  this.status = 'failed'
  return this.save()
}

ReportSchema.methods.archive = function() {
  this.status = 'archived'
  return this.save()
}

ReportSchema.methods.addInsight = function(type, message, severity, recommendation) {
  this.data.insights.push({ type, message, severity, recommendation })
  return this.save()
}

ReportSchema.methods.addChart = function(type, title, data, config) {
  this.data.charts.push({ type, title, data, config })
  return this.save()
}

ReportSchema.methods.addTable = function(title, headers, rows, totals) {
  this.data.tables.push({ title, headers, rows, totals })
  return this.save()
}

// Static methods
ReportSchema.statics.getActiveReports = function(userId) {
  return this.find({
    $or: [
      { generatedBy: userId },
      { requestedBy: userId },
      { isPublic: true }
    ],
    status: { $in: ['completed', 'generating'] },
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  }).sort({ createdAt: -1 })
}

ReportSchema.statics.getReportsByType = function(type, limit = 50) {
  return this.find({ 
    type: type,
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(limit)
}

ReportSchema.statics.getExpiredReports = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $in: ['completed', 'failed'] }
  })
}

ReportSchema.statics.cleanupExpiredReports = async function() {
  const expiredReports = await this.getExpiredReports()
  
  for (const report of expiredReports) {
    report.status = 'archived'
    await report.save()
  }
  
  return expiredReports.length
}

ReportSchema.statics.generateReportId = function() {
  return `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

module.exports = mongoose.model('Report', ReportSchema)



