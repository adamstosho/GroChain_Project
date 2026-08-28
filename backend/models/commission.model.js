const mongoose = require('mongoose')

const CommissionSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  amount: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0, max: 1 },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending' },
  orderAmount: { type: Number, required: true },
  orderDate: { type: Date, required: true },
  paidAt: { type: Date },
  withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  notes: { type: String },
  metadata: { type: Object, default: {} },
  // A partner requesting payout only records where they want to be paid —
  // it never marks the commission paid or creates a Transaction itself.
  // Only an admin, via the real payout process, can do that.
  payoutRequest: {
    method: { type: String, enum: ['bank_transfer', 'mobile_money', 'wallet'] },
    details: { type: Object },
    notes: { type: String },
    requestedAt: { type: Date },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true })

CommissionSchema.index({ partner: 1 })
CommissionSchema.index({ farmer: 1 })
CommissionSchema.index({ order: 1 })
CommissionSchema.index({ status: 1 })
CommissionSchema.index({ createdAt: -1 })
CommissionSchema.index(
  { partner: 1, farmer: 1, order: 1, listing: 1 },
  { unique: true }
)

module.exports = mongoose.model('Commission', CommissionSchema)

