const mongoose = require('mongoose')

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  organization: { type: String, required: true },
  type: { type: String, enum: ['cooperative', 'extension_agency', 'ngo', 'aggregator', 'microfinance', 'bank'], required: true },
  location: { type: String, required: true },
  address: { type: String },
  description: { type: String },
  website: { type: String },
  logo: { type: String },
  contactPerson: {
    name: { type: String },
    position: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  services: [{ type: String }],
  coverageAreas: [{ type: String }],
  certifications: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  commissionRate: { type: Number, default: 0.02, min: 0, max: 1 },
  lendingEnabled: { type: Boolean, default: false },
  maxLoanAmount: { type: Number, default: 2000000 },
  baseInterestRate: { type: Number, default: 15, min: 0, max: 100 },
  farmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalFarmers: { type: Number, default: 0 },
  totalCommissions: { type: Number, default: 0 },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suspensionReason: { type: String },
  suspendedAt: { type: Date },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

PartnerSchema.index({ name: 1, organization: 1 })
PartnerSchema.index({ status: 1 })
PartnerSchema.index({ type: 1 })

module.exports = mongoose.model('Partner', PartnerSchema)

