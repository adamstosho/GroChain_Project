const mongoose = require('mongoose')
const PriceAlert = require('../models/price-alert.model')
const Listing = require('../models/listing.model')
const Notification = require('../models/notification.model')
const { WebSocketService } = require('../services/websocket.service')
const NotificationService = require('../services/notification.service')

const priceAlertController = {
  // Create a new price alert
  async createPriceAlert(req, res) {
    try {
      const { listingId, targetPrice, alertType = 'price_drop', notificationChannels = ['in_app'] } = req.body
      const userId = req.user.id

      // Validate required fields
      if (!listingId || !targetPrice) {
        return res.status(400).json({
          status: 'error',
          message: 'Listing ID and target price are required'
        })
      }

      // Check if listing exists
      const listing = await Listing.findById(listingId)
      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Product listing not found'
        })
      }

      // Check if user already has an alert for this product
      const existingAlert = await PriceAlert.findOne({
        user: userId,
        listing: listingId,
        isActive: true
      })

      if (existingAlert) {
        return res.status(400).json({
          status: 'error',
          message: 'You already have an active price alert for this product'
        })
      }

      // Validate target price
      if (targetPrice <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Target price must be greater than 0'
        })
      }

      // Create new price alert
      const priceAlert = new PriceAlert({
        user: userId,
        listing: listingId,
        productName: listing.cropName,
        currentPrice: listing.basePrice,
        targetPrice: targetPrice,
        alertType: alertType,
        notificationChannels: notificationChannels.map(channel => ({
          type: channel,
          enabled: true
        })),
        metadata: {
          originalPrice: listing.basePrice,
          priceHistory: [{
            price: listing.basePrice,
            timestamp: new Date()
          }]
        }
      })

      await priceAlert.save()

      // Populate the listing details
      await priceAlert.populate('listing', 'cropName basePrice images')

      res.status(201).json({
        status: 'success',
        message: 'Price alert created successfully',
        data: priceAlert
      })
    } catch (error) {
      console.error('Error creating price alert:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create price alert'
      })
    }
  },

  // Get user's price alerts
  async getUserPriceAlerts(req, res) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 10, isActive } = req.query

      const query = { user: userId }
      if (isActive !== undefined) {
        query.isActive = isActive === 'true'
      }

      const alerts = await PriceAlert.find(query)
        .populate('listing', 'cropName basePrice images category')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await PriceAlert.countDocuments(query)

      res.json({
        status: 'success',
        data: {
          alerts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error fetching price alerts:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch price alerts'
      })
    }
  },

  // Update a price alert
  async updatePriceAlert(req, res) {
    try {
      const { alertId } = req.params
      const { targetPrice, alertType, isActive, notificationChannels } = req.body
      const userId = req.user.id

      const alert = await PriceAlert.findOne({ _id: alertId, user: userId })
      if (!alert) {
        return res.status(404).json({
          status: 'error',
          message: 'Price alert not found'
        })
      }

      // Update fields if provided
      if (targetPrice !== undefined) {
        if (targetPrice <= 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Target price must be greater than 0'
          })
        }
        alert.targetPrice = targetPrice
      }

      if (alertType !== undefined) {
        alert.alertType = alertType
      }

      if (isActive !== undefined) {
        alert.isActive = isActive
      }

      if (notificationChannels !== undefined) {
        alert.notificationChannels = notificationChannels.map(channel => ({
          type: channel,
          enabled: true
        }))
      }

      await alert.save()
      await alert.populate('listing', 'cropName basePrice images category')

      res.json({
        status: 'success',
        message: 'Price alert updated successfully',
        data: alert
      })
    } catch (error) {
      console.error('Error updating price alert:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update price alert'
      })
    }
  },

  // Delete a price alert
  async deletePriceAlert(req, res) {
    try {
      const { alertId } = req.params
      const userId = req.user.id

      const alert = await PriceAlert.findOneAndDelete({ _id: alertId, user: userId })
      if (!alert) {
        return res.status(404).json({
          status: 'error',
          message: 'Price alert not found'
        })
      }

      res.json({
        status: 'success',
        message: 'Price alert deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting price alert:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete price alert'
      })
    }
  },

  // Get alert details
  async getPriceAlert(req, res) {
    try {
      const { alertId } = req.params
      const userId = req.user.id

      const alert = await PriceAlert.findOne({ _id: alertId, user: userId })
        .populate('listing', 'cropName basePrice images category description')

      if (!alert) {
        return res.status(404).json({
          status: 'error',
          message: 'Price alert not found'
        })
      }

      res.json({
        status: 'success',
        data: alert
      })
    } catch (error) {
      console.error('Error fetching price alert:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch price alert'
      })
    }
  },

  // Check and process price alerts (called by scheduled job)
  async checkPriceAlerts(req, res) {
    try {
      const activeAlerts = await PriceAlert.find({ isActive: true })
        .populate('listing', 'basePrice cropName')
        .populate('user', 'name email phone')

      const triggeredAlerts = []

      for (const alert of activeAlerts) {
        const currentPrice = alert.listing.basePrice
        const wasTriggered = alert.checkAndUpdate(currentPrice)

        if (wasTriggered) {
          triggeredAlerts.push(alert)
          
          // Get enabled notification channels from the alert
          const enabledChannels = alert.notificationChannels
            .filter(channel => channel.enabled)
            .map(channel => channel.type)

          // Create notification using the notification service
          const notificationData = {
            user: alert.user._id,
            title: 'Price Alert Triggered! 🚨',
            message: `${alert.productName} price is now ₦${currentPrice.toLocaleString()} (Target: ₦${alert.targetPrice.toLocaleString()})`,
            type: 'info',
            category: 'marketplace',
            priority: 'high',
            channels: enabledChannels,
            data: {
              alertId: alert._id,
              productId: alert.listing._id,
              currentPrice,
              targetPrice: alert.targetPrice,
              alertType: alert.alertType,
              priceChange: currentPrice - alert.metadata.originalPrice,
              priceChangePercent: ((currentPrice - alert.metadata.originalPrice) / alert.metadata.originalPrice * 100).toFixed(2)
            }
          }

          // Send notification through all enabled channels (email, SMS, push, in-app)
          const notification = await NotificationService.createNotification(notificationData)

          // Send real-time notification via WebSocket for in-app notifications
          if (enabledChannels.includes('in_app')) {
            const wsService = new WebSocketService()
            await wsService.sendNotificationToUser(alert.user._id, {
              id: notification._id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              category: notification.category,
              actionUrl: notification.actionUrl,
              data: notification.data
            })
          }

          // Mark alert as notification sent
          alert.resetAfterNotification()
          await alert.save()
        } else {
          await alert.save()
        }
      }

      res.json({
        status: 'success',
        message: `Checked ${activeAlerts.length} alerts, ${triggeredAlerts.length} triggered`,
        data: {
          totalChecked: activeAlerts.length,
          triggeredCount: triggeredAlerts.length,
          triggeredAlerts: triggeredAlerts.map(alert => ({
            id: alert._id,
            productName: alert.productName,
            currentPrice: alert.currentPrice,
            targetPrice: alert.targetPrice
          }))
        }
      })
    } catch (error) {
      console.error('Error checking price alerts:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to check price alerts'
      })
    }
  },

  // Get price alert statistics
  async getPriceAlertStats(req, res) {
    try {
      const userId = req.user.id

      const stats = await PriceAlert.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
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
            totalTriggers: { $sum: '$triggerCount' }
          }
        }
      ])

      const result = stats[0] || {
        totalAlerts: 0,
        activeAlerts: 0,
        triggeredAlerts: 0,
        totalTriggers: 0
      }

      res.json({
        status: 'success',
        data: result
      })
    } catch (error) {
      console.error('Error fetching price alert stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch price alert statistics'
      })
    }
  }
}

module.exports = priceAlertController

