const mongoose = require('mongoose')

const PriceAlertSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  listing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  currentPrice: { 
    type: Number, 
    required: true 
  },
  targetPrice: { 
    type: Number, 
    required: true 
  },
  alertType: { 
    type: String, 
    enum: ['price_drop', 'price_increase', 'both'], 
    default: 'price_drop' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastChecked: { 
    type: Date, 
    default: Date.now 
  },
  triggeredAt: { 
    type: Date 
  },
  triggerCount: { 
    type: Number, 
    default: 0 
  },
  notificationSent: { 
    type: Boolean, 
    default: false 
  },
  notificationChannels: [{
    type: { 
      type: String, 
      enum: ['email', 'sms', 'push', 'in_app'], 
      required: true 
    },
    enabled: { 
      type: Boolean, 
      default: true 
    }
  }],
  metadata: {
    originalPrice: Number,
    priceHistory: [{
      price: Number,
      timestamp: { type: Date, default: Date.now }
    }],
    lastNotificationSent: Date
  }
}, { 
  timestamps: true 
})

// Indexes for efficient querying
PriceAlertSchema.index({ user: 1, isActive: 1 })
PriceAlertSchema.index({ listing: 1 })
PriceAlertSchema.index({ lastChecked: 1 })
PriceAlertSchema.index({ triggeredAt: 1 })

// Virtual for checking if alert should trigger
PriceAlertSchema.virtual('shouldTrigger').get(function() {
  if (!this.isActive) return false
  
  const currentPrice = this.currentPrice
  const targetPrice = this.targetPrice
  
  switch (this.alertType) {
    case 'price_drop':
      return currentPrice <= targetPrice
    case 'price_increase':
      return currentPrice >= targetPrice
    case 'both':
      return currentPrice <= targetPrice || currentPrice >= targetPrice
    default:
      return false
  }
})

// Method to check and update alert
PriceAlertSchema.methods.checkAndUpdate = function(newPrice) {
  this.currentPrice = newPrice
  this.lastChecked = new Date()
  
  // Add to price history
  this.metadata.priceHistory.push({
    price: newPrice,
    timestamp: new Date()
  })
  
  // Keep only last 10 price points
  if (this.metadata.priceHistory.length > 10) {
    this.metadata.priceHistory = this.metadata.priceHistory.slice(-10)
  }
  
  // Check if alert should trigger
  if (this.shouldTrigger && !this.triggeredAt) {
    this.triggeredAt = new Date()
    this.triggerCount += 1
    this.notificationSent = false
    return true // Alert triggered
  }
  
  return false // No trigger
}

// Method to reset alert after notification sent
PriceAlertSchema.methods.resetAfterNotification = function() {
  this.notificationSent = true
  this.metadata.lastNotificationSent = new Date()
  // Optionally deactivate after first trigger
  // this.isActive = false
}

module.exports = mongoose.model('PriceAlert', PriceAlertSchema)

