const mongoose = require('mongoose')

const CreditScoreSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 0, max: 1000, default: 50 },
  factors: {
    paymentHistory: { type: Number, min: 0, max: 100, default: 50 },
    harvestConsistency: { type: Number, min: 0, max: 100, default: 50 },
    businessStability: { type: Number, min: 0, max: 100, default: 50 },
    marketReputation: { type: Number, min: 0, max: 100, default: 50 },
    financialDiscipline: { type: Number, min: 0, max: 100, default: 50 },
    collateralValue: { type: Number, min: 0, max: 100, default: 50 }
  },
  recommendations: [{ type: String }],
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  history: [{
    score: { type: Number, required: true },
    factors: { type: Object },
    reason: { type: String },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true })

CreditScoreSchema.index({ farmer: 1 })
CreditScoreSchema.index({ score: -1 })
CreditScoreSchema.index({ riskLevel: 1 })

module.exports = mongoose.model('CreditScore', CreditScoreSchema)
