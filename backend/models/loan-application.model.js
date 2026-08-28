const mongoose = require('mongoose')

const LoanApplicationSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1000 },
  purpose: { type: String, required: true },
  duration: { type: Number, required: true, min: 1, max: 60 }, // months
  interestRate: { type: Number, required: true, min: 0, max: 100 },
  collateral: { type: String },
  collateralValue: { type: Number },
  monthlyIncome: { type: Number },
  existingLoans: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'disbursed', 'completed'], default: 'pending' },
  approvedAmount: { type: Number },
  approvedDuration: { type: Number },
  approvedInterestRate: { type: Number },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  disbursedAt: { type: Date },
  repaymentSchedule: [{
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    paidAt: { type: Date },
    lateFees: { type: Number, default: 0 }
  }],
  documents: [{ type: String }], // URLs to uploaded documents
  notes: { type: String },
  creditScore: { type: Number },
  riskAssessment: { type: String, enum: ['low', 'medium', 'high'] },
  lenderPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  lenderName: { type: String },
  lenderType: { type: String, enum: ['partner_mfi', 'platform_mfi', 'cooperative'], default: 'platform_mfi' },
  submittedToLenderAt: { type: Date },
  idempotencyKey: { type: String, maxlength: 128 },
}, { timestamps: true })

LoanApplicationSchema.index({ farmer: 1 })
LoanApplicationSchema.index({ status: 1 })
LoanApplicationSchema.index({ createdAt: -1 })
LoanApplicationSchema.index(
  { farmer: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
)
LoanApplicationSchema.index(
  { farmer: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
)

module.exports = mongoose.model('LoanApplication', LoanApplicationSchema)
