const mongoose = require('mongoose')

const ShipmentSchema = new mongoose.Schema({
  // Basic shipment info
  shipmentNumber: { 
    type: String, 
    required: true,
    default: () => `SHIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Shipment details
  items: [{
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  
  // Origin and destination
  origin: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  destination: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  // Shipping details
  shippingMethod: { 
    type: String, 
    enum: ['road_standard', 'road_express', 'air', 'courier'], 
    required: true 
  },
  carrier: { type: String, required: true },
  trackingNumber: { type: String, sparse: true },
  estimatedDelivery: { type: Date, required: true },
  actualDelivery: { type: Date },
  
  // Status and tracking
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'], 
    default: 'pending' 
  },
  
  trackingEvents: [{
    status: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }],
  
  // Financial details
  shippingCost: { type: Number, required: true },
  insuranceCost: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  // Insurance and safety
  insurance: {
    insured: { type: Boolean, default: false },
    insuranceProvider: { type: String },
    policyNumber: { type: String },
    coverageAmount: { type: Number },
    premium: { type: Number }
  },
  
  // Quality and condition
  packaging: {
    type: { type: String, required: true },
    materials: [String],
    weight: { type: Number, required: true },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    }
  },
  
  // Special requirements
  specialInstructions: { type: String },
  temperatureControl: { type: Boolean, default: false },
  temperatureRange: {
    min: { type: Number },
    max: { type: Number }
  },
  fragile: { type: Boolean, default: false },
  
  // Delivery confirmation
  deliveryProof: {
    signature: { type: String },
    photo: { type: String },
    notes: { type: String },
    deliveredBy: { type: String },
    deliveryTime: { type: Date }
  },
  
  // Issues and returns
  issues: [{
    type: { type: String, enum: ['damage', 'delay', 'loss', 'quality', 'other'] },
    description: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
    resolution: { type: String },
    resolvedAt: { type: Date }
  }],
  
  // Returns
  returnRequested: { type: Boolean, default: false },
  returnReason: { type: String },
  returnStatus: { 
    type: String, 
    enum: ['none', 'requested', 'approved', 'in_transit', 'received', 'processed'] 
  },
  
  // Metadata
  notes: { type: String },
  tags: [String],
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  }
}, { timestamps: true })

// Indexes for efficient querying
ShipmentSchema.index({ shipmentNumber: 1 })
ShipmentSchema.index({ order: 1 })
ShipmentSchema.index({ buyer: 1 })
ShipmentSchema.index({ seller: 1 })
ShipmentSchema.index({ status: 1 })
ShipmentSchema.index({ trackingNumber: 1 }, { unique: true, sparse: true })
ShipmentSchema.index({ estimatedDelivery: 1 })
ShipmentSchema.index({ 'origin.coordinates': '2dsphere' })
ShipmentSchema.index({ 'destination.coordinates': '2dsphere' })
ShipmentSchema.index({ createdAt: -1 })

// Virtual for total items quantity
ShipmentSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

// Virtual for total items value
ShipmentSchema.virtual('totalValue').get(function() {
  return this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
})

// Pre-save middleware to calculate total cost
ShipmentSchema.pre('save', function(next) {
  this.totalCost = this.shippingCost + this.insuranceCost
  next()
})

// Method to add tracking event
ShipmentSchema.methods.addTrackingEvent = function(status, location, description, coordinates = null) {
  this.trackingEvents.push({
    status,
    location,
    description,
    coordinates
  })
  
  // Update main status based on tracking event
  if (status === 'delivered') {
    this.status = 'delivered'
    this.actualDelivery = new Date()
  } else if (status === 'in_transit') {
    this.status = 'in_transit'
  }
  
  return this.save()
}

// Method to update delivery status
ShipmentSchema.methods.updateDeliveryStatus = function(status, proof = {}) {
  this.status = status
  
  if (status === 'delivered') {
    this.actualDelivery = new Date()
    this.deliveryProof = { ...this.deliveryProof, ...proof }
  }
  
  return this.save()
}

// Method to report issue
ShipmentSchema.methods.reportIssue = function(type, description, reportedBy) {
  this.issues.push({
    type,
    description,
    reportedBy
  })
  
  return this.save()
}

// Static method to get shipments by status
ShipmentSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('order buyer seller')
}

// Static method to get shipments by location
ShipmentSchema.statics.getByLocation = function(city, state) {
  return this.find({
    $or: [
      { 'origin.city': city, 'origin.state': state },
      { 'destination.city': city, 'destination.state': state }
    ]
  }).populate('order buyer seller')
}

// Static method to get delayed shipments
ShipmentSchema.statics.getDelayedShipments = function() {
  const now = new Date()
  return this.find({
    status: { $in: ['confirmed', 'in_transit', 'out_for_delivery'] },
    estimatedDelivery: { $lt: now }
  }).populate('order buyer seller')
}

module.exports = mongoose.model('Shipment', ShipmentSchema)

