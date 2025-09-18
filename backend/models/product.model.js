const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  category: {
    type: String,
    required: true,
    enum: ['grains', 'tubers', 'vegetables', 'fruits', 'legumes', 'spices', 'other']
  },
  
  subcategory: {
    type: String,
    trim: true
  },
  
  // Product Details
  brand: {
    type: String,
    trim: true
  },
  
  variety: {
    type: String,
    trim: true
  },
  
  grade: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'standard'
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN']
  },
  
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'ton', 'bag', 'piece', 'bundle', 'litre']
  },
  
  unitWeight: {
    type: Number,
    min: 0,
    description: 'Weight in kg for the unit'
  },
  
  // Inventory
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  maxOrderQuantity: {
    type: Number,
    min: 1
  },
  
  // Product Images
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Harvest Information
  harvestDate: Date,
  
  expiryDate: Date,
  
  storageConditions: {
    temperature: String,
    humidity: String,
    specialRequirements: String
  },
  
  // Quality & Certifications
  qualityCertifications: [{
    name: String,
    issuer: String,
    validUntil: Date,
    certificateUrl: String
  }],
  
  organicCertified: {
    type: Boolean,
    default: false
  },
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  sellerType: {
    type: String,
    enum: ['farmer', 'aggregator', 'wholesaler', 'retailer'],
    required: true
  },
  
  // Location
  origin: {
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Shipping & Delivery
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'premium']
    }
  },
  
  deliveryOptions: [{
    type: String,
    enum: ['pickup', 'local_delivery', 'national_shipping']
  }],
  
  // Product Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'draft'
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // SEO & Marketing
  tags: [String],
  
  metaTitle: String,
  
  metaDescription: String,
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  favoriteCount: {
    type: Number,
    default: 0
  },
  
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
productSchema.index({ name: 'text', description: 'text', category: 1 })
productSchema.index({ seller: 1 })
productSchema.index({ status: 1 })
productSchema.index({ category: 1, subcategory: 1 })
productSchema.index({ price: 1 })
productSchema.index({ 'origin.state': 1, 'origin.city': 1 })
productSchema.index({ isFeatured: 1 })
productSchema.index({ isVerified: 1 })
productSchema.index({ createdAt: -1 })

// Virtual for price per kg
productSchema.virtual('pricePerKg').get(function() {
  if (this.unitWeight && this.unitWeight > 0) {
    return this.price / this.unitWeight
  }
  return null
})

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'out_of_stock'
  if (this.stockQuantity <= this.minOrderQuantity) return 'low_stock'
  return 'in_stock'
})

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.stockQuantity > 0
})

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Set primary image if none exists
  if (this.images && this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true
  }
  
  next()
})

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    if (this.stockQuantity < quantity) {
      throw new Error('Insufficient stock')
    }
    this.stockQuantity -= quantity
  } else if (operation === 'increase') {
    this.stockQuantity += quantity
  }
  
  // Update status based on stock
  if (this.stockQuantity === 0) {
    this.status = 'out_of_stock'
  } else if (this.status === 'out_of_stock') {
    this.status = 'active'
  }
  
  return this.save()
}

// Instance method to add review
productSchema.methods.addReview = function(rating) {
  const currentTotal = this.rating.average * this.rating.count
  this.rating.count += 1
  this.rating.average = (currentTotal + rating) / this.rating.count
  return this.save()
}

// Static method to find products by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, status: 'active' }
  return this.paginate(query, options)
}

// Static method to find products by location
productSchema.statics.findByLocation = function(state, city) {
  const query = { status: 'active' }
  if (state) query['origin.state'] = state
  if (city) query['origin.city'] = city
  return this.find(query)
}

// Static method to find featured products
productSchema.statics.findFeatured = function(options = {}) {
  const query = { isFeatured: true, status: 'active' }
  return this.paginate(query, options)
}

// Static method to search products
productSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active'
  }
  return this.paginate(query, { ...options, sort: { score: { $meta: 'textScore' } } })
}

// Apply pagination plugin
productSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Product', productSchema)

