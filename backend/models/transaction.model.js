const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['payment', 'commission', 'refund', 'withdrawal', 'platform_fee'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'NGN' },
  reference: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  harvestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Harvest' },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentProvider: { type: String, default: 'paystack' },
  paymentProviderReference: { type: String },
  metadata: { type: Object },
  processedAt: { type: Date },
  failureReason: { type: String },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 }
}, { timestamps: true })

TransactionSchema.index({ userId: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ status: 1 })
TransactionSchema.index({ reference: 1 }, { unique: true })
TransactionSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Transaction', TransactionSchema)

