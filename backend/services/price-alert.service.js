const PriceAlert = require('../models/price-alert.model')
const Listing = require('../models/listing.model')
const Notification = require('../models/notification.model')
const { WebSocketService } = require('./websocket.service')

class PriceAlertService {
  constructor() {
    this.isRunning = false
    this.checkInterval = null
    this.wsService = new WebSocketService()
  }

  // Start the price alert monitoring service
  start(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('Price alert service is already running')
      return
    }

    console.log(`Starting price alert service with ${intervalMinutes} minute intervals`)
    this.isRunning = true
    
    // Run immediately on start
    this.checkAllAlerts()
    
    // Set up interval
    this.checkInterval = setInterval(() => {
      this.checkAllAlerts()
    }, intervalMinutes * 60 * 1000)
  }

  // Stop the price alert monitoring service
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('Price alert service stopped')
  }

  // Check all active price alerts
  async checkAllAlerts() {
    try {
      console.log('Checking price alerts...')
      
      const activeAlerts = await PriceAlert.find({ isActive: true })
        .populate('listing', 'basePrice cropName images category')
        .populate('user', 'name email phone')

      console.log(`Found ${activeAlerts.length} active price alerts`)

      const triggeredAlerts = []
      const errors = []

      for (const alert of activeAlerts) {
        try {
          const currentPrice = alert.listing.basePrice
          const wasTriggered = alert.checkAndUpdate(currentPrice)

          if (wasTriggered) {
            console.log(`Alert triggered for ${alert.productName}: ${currentPrice} (target: ${alert.targetPrice})`)
            triggeredAlerts.push(alert)
            
            // Create notification
            await this.createAlertNotification(alert, currentPrice)
            
            // Mark alert as notification sent
            alert.resetAfterNotification()
          }

          await alert.save()
        } catch (error) {
          console.error(`Error processing alert ${alert._id}:`, error)
          errors.push({ alertId: alert._id, error: error.message })
        }
      }

      console.log(`Price alert check completed: ${triggeredAlerts.length} triggered, ${errors.length} errors`)
      
      return {
        totalChecked: activeAlerts.length,
        triggeredCount: triggeredAlerts.length,
        errorCount: errors.length,
        triggeredAlerts: triggeredAlerts.map(alert => ({
          id: alert._id,
          productName: alert.productName,
          currentPrice: alert.currentPrice,
          targetPrice: alert.targetPrice,
          alertType: alert.alertType
        })),
        errors
      }
    } catch (error) {
      console.error('Error in checkAllAlerts:', error)
      throw error
    }
  }

  // Create notification for triggered alert
  async createAlertNotification(alert, currentPrice) {
    try {
      const notification = new Notification({
        user: alert.user._id,
        title: 'Price Alert Triggered! 🔔',
        message: this.generateAlertMessage(alert, currentPrice),
        type: 'info',
        category: 'marketplace',
        priority: 'normal',
        actionUrl: `/dashboard/products/${alert.listing._id}`,
        data: {
          alertId: alert._id,
          productId: alert.listing._id,
          currentPrice,
          targetPrice: alert.targetPrice,
          alertType: alert.alertType,
          productName: alert.productName
        }
      })

      await notification.save()

      // Send real-time notification via WebSocket
      await this.wsService.sendNotificationToUser(alert.user._id, {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        actionUrl: notification.actionUrl,
        data: notification.data
      })

      console.log(`Notification sent for alert ${alert._id}`)
    } catch (error) {
      console.error(`Error creating notification for alert ${alert._id}:`, error)
      throw error
    }
  }

  // Generate alert message based on alert type
  generateAlertMessage(alert, currentPrice) {
    const { productName, targetPrice, alertType } = alert
    const priceChange = currentPrice - alert.metadata.originalPrice
    const changePercent = ((priceChange / alert.metadata.originalPrice) * 100).toFixed(1)
    
    let message = `"${productName}" price alert triggered!\n\n`
    message += `Current Price: ₦${currentPrice.toLocaleString()}\n`
    message += `Target Price: ₦${targetPrice.toLocaleString()}\n`
    
    if (priceChange !== 0) {
      const changeText = priceChange > 0 ? 'increased' : 'decreased'
      message += `Price has ${changeText} by ${Math.abs(changePercent)}% from original price\n`
    }
    
    message += `\nClick to view the product and make your purchase!`

    return message
  }

  // Check alerts for a specific product (when price is updated)
  async checkProductAlerts(productId, newPrice) {
    try {
      const alerts = await PriceAlert.find({
        listing: productId,
        isActive: true
      }).populate('user', 'name email phone')

      const triggeredAlerts = []

      for (const alert of alerts) {
        const wasTriggered = alert.checkAndUpdate(newPrice)
        
        if (wasTriggered) {
          triggeredAlerts.push(alert)
          await this.createAlertNotification(alert, newPrice)
          alert.resetAfterNotification()
        }
        
        await alert.save()
      }

      return triggeredAlerts
    } catch (error) {
      console.error(`Error checking alerts for product ${productId}:`, error)
      throw error
    }
  }

  // Get alert statistics
  async getAlertStatistics(userId = null) {
    try {
      const match = userId ? { user: userId } : {}
      
      const stats = await PriceAlert.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAlerts: { $sum: 1 },
            activeAlerts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            triggeredAlerts: {
              $sum: { $cond: [{ $ne: ['$triggeredAt', null] }, 1, 0] }
            },
            totalTriggers: { $sum: '$triggerCount' },
            avgTargetPrice: { $avg: '$targetPrice' },
            avgCurrentPrice: { $avg: '$currentPrice' }
          }
        }
      ])

      const result = stats[0] || {
        totalAlerts: 0,
        activeAlerts: 0,
        triggeredAlerts: 0,
        totalTriggers: 0,
        avgTargetPrice: 0,
        avgCurrentPrice: 0
      }

      return result
    } catch (error) {
      console.error('Error getting alert statistics:', error)
      throw error
    }
  }

  // Clean up old triggered alerts (optional maintenance)
  async cleanupOldAlerts(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await PriceAlert.deleteMany({
        triggeredAt: { $lt: cutoffDate },
        isActive: false
      })

      console.log(`Cleaned up ${result.deletedCount} old price alerts`)
      return result.deletedCount
    } catch (error) {
      console.error('Error cleaning up old alerts:', error)
      throw error
    }
  }
}

// Create singleton instance
const priceAlertService = new PriceAlertService()

module.exports = { PriceAlertService, priceAlertService }

