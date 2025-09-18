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
  metadata: { type: Object, default: {} }
}, { timestamps: true })

CommissionSchema.index({ partner: 1 })
CommissionSchema.index({ farmer: 1 })
CommissionSchema.index({ order: 1 })
CommissionSchema.index({ status: 1 })
CommissionSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Commission', CommissionSchema)

