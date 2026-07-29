const mongoose = require('mongoose')

const InsuranceClaimSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePolicy', required: true },
  claimType: {
    type: String,
    enum: ['crop_damage', 'equipment_damage', 'livestock_loss', 'natural_disaster', 'theft', 'other'],
    required: true
  },
  description: { type: String, required: true },
  incidentDate: { type: Date, required: true },
  reportedDate: { type: Date, default: Date.now },
  estimatedLoss: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  // Set by whoever adjudicates the claim - not auto-derived from estimatedLoss
  claimAmount: { type: Number, default: 0, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  location: { type: String },
  weatherConditions: { type: String },
  adjusterNotes: { type: String },
  decisionDate: { type: Date }
}, { timestamps: true })

// Indexes
InsuranceClaimSchema.index({ farmer: 1, status: 1 })
InsuranceClaimSchema.index({ policy: 1 })

// Virtual for processing time (days between report and decision)
InsuranceClaimSchema.virtual('processingTimeDays').get(function () {
  if (!this.decisionDate) return null
  return Math.max(0, (this.decisionDate - this.reportedDate) / (1000 * 60 * 60 * 24))
})

module.exports = mongoose.model('InsuranceClaim', InsuranceClaimSchema)
