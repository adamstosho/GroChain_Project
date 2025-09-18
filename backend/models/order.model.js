const mongoose = require('mongoose')

const OrderItemSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  total: { type: Number, required: true, min: 0 }
})

const OrderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  total: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 }, // Default to 0, no VAT
  shipping: { type: Number, default: 0 },
  shippingMethod: { type: String, enum: ['road_standard', 'road_express', 'air', 'courier'], default: 'road_standard' },
  discount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { type: String, enum: ['paystack', 'flutterwave', 'card', 'bank_transfer', 'ussd', 'cash'], default: 'paystack' },
  paymentReference: { type: String },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'Nigeria' },
    postalCode: { type: String },
    phone: { type: String, required: true }
  },
  deliveryInstructions: { type: String },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  trackingNumber: { type: String },
  notes: { type: String },
  metadata: { type: Object }
}, { timestamps: true })

OrderSchema.index({ buyer: 1 })
OrderSchema.index({ seller: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ paymentStatus: 1 })
OrderSchema.index({ createdAt: -1 })

// Calculate totals before saving
OrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0)
    this.total = this.subtotal + this.shipping - this.discount // Removed tax from total calculation
  }
  next()
})

module.exports = mongoose.model('Order', OrderSchema)

