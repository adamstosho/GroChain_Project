const Notification = require('../models/notification.model')
const User = require('../models/user.model')
const webSocketService = require('../services/websocket.service')
const NotificationService = require('../services/notification.service')

const DEFAULT_NOTIFICATION_CHANNELS = ['in_app', 'email']

const NOTIFICATION_CATEGORIES = [
  'harvest',
  'marketplace',
  'financial',
  'system',
  'weather',
  'order',
  'payment',
  'shipment'
]

const PREFERENCE_CATEGORIES = [...NOTIFICATION_CATEGORIES, 'partner']

const normalizeNotificationCategory = (category) => {
  const map = {
    commission: 'financial',
    farmer: 'system',
    performance: 'system',
    partner: 'system',
    review: 'marketplace'
  }
  const mapped = map[category] || category || 'system'
  return NOTIFICATION_CATEGORIES.includes(mapped) ? mapped : 'system'
}

const resolveDeliveryChannels = (channels) => {
  const input =
    Array.isArray(channels) && channels.length > 0
      ? channels
      : DEFAULT_NOTIFICATION_CHANNELS
  return [...new Set([...input, 'in_app', 'email'])]
}

const toChannelObjects = (channels = DEFAULT_NOTIFICATION_CHANNELS) => {
  const list = resolveDeliveryChannels(channels)
  return list.map((channel) => {
    if (typeof channel === 'string') {
      return { type: channel, sent: false }
    }
    if (channel && typeof channel === 'object' && channel.type) {
      return {
        type: channel.type,
        sent: Boolean(channel.sent),
        sentAt: channel.sentAt,
        error: channel.error
      }
    }
    return { type: 'in_app', sent: false }
  })
}

const toClientNotification = (notification) => {
  const doc = notification?.toObject ? notification.toObject() : notification
  return {
    _id: doc._id,
    id: doc._id,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    category: doc.category,
    read: Boolean(doc.read),
    priority: doc.priority,
    actionUrl: doc.actionUrl || null,
    data: doc.data || {},
    createdAt: doc.createdAt
  }
}

const emitRealtimeNotification = (userId, notification) => {
  if (!userId || !notification) return false
  try {
    return webSocketService.sendNotificationToUser(
      userId.toString(),
      toClientNotification(notification)
    )
  } catch (error) {
    console.warn('Failed to emit realtime notification:', error?.message || error)
    return false
  }
}

const normalizePreferenceCategories = (categories) => {
  if (Array.isArray(categories)) {
    return categories.filter((c) => PREFERENCE_CATEGORIES.includes(c))
  }
  if (categories && typeof categories === 'object') {
    return Object.entries(categories)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key)
      .filter((c) => PREFERENCE_CATEGORIES.includes(c))
  }
  return undefined
}

// Notification templates for different roles and activities
const NOTIFICATION_TEMPLATES = {
  farmer: {
    harvest: {
      approved: {
        title: "Harvest Approved",
        message: "Your harvest batch {batchId} has been successfully approved.",
        type: "success",
        priority: "normal"
      },
      rejected: {
        title: "Harvest Rejected",
        message: "Your harvest batch {batchId} was rejected. Please review the details.",
        type: "warning",
        priority: "high"
      },
      logged: {
        title: "Harvest Logged Successfully",
        message: "Your {cropType} harvest has been logged and is pending approval.",
        type: "info",
        priority: "normal"
      },
      revisionRequested: {
        title: "Harvest Revision Requested",
        message: "Your {cropType} harvest needs revision. Please review the feedback and resubmit.",
        type: "warning",
        priority: "high"
      }
    },
    marketplace: {
      productListed: {
        title: "Product Listed Successfully",
        message: "Your {productName} has been listed in the marketplace.",
        type: "success",
        priority: "normal"
      },
      soldOut: {
        title: "Product Sold Out",
        message: "Your {productName} has been completely sold out.",
        type: "success",
        priority: "normal"
      },
      orderReceived: {
        title: "New Order Received",
        message: "You have received a new order for {productName} from {buyerName}.",
        type: "info",
        priority: "high"
      },
      orderCancelled: {
        title: "Order Cancelled",
        message: "Order for {productName} has been cancelled.",
        type: "warning",
        priority: "normal"
      },
      reviewReceived: {
        title: "New Review Received",
        message: "{buyerName} left a {rating}-star review for your {productName}.",
        type: "info",
        priority: "normal"
      }
    },
    financial: {
      paymentReceived: {
        title: "Payment Received",
        message: "You have received ₦{amount} for order #{orderNumber}.",
        type: "success",
        priority: "high"
      },
      paymentPending: {
        title: "Payment Pending",
        message: "Payment of ₦{amount} for order #{orderNumber} is pending verification.",
        type: "info",
        priority: "normal"
      },
      refundProcessed: {
        title: "Refund Processed",
        message: "A refund of ₦{amount} has been processed for order #{orderNumber}.",
        type: "info",
        priority: "normal"
      }
    }
  },
  buyer: {
    financial: {
      paymentCompleted: {
        title: "Payment Successful",
        message: "Your payment of ₦{amount} for order #{orderNumber} has been completed successfully.",
        type: "success",
        priority: "high"
      },
      paymentPending: {
        title: "Payment Pending",
        message: "Your payment of ₦{amount} for order #{orderNumber} is being processed.",
        type: "info",
        priority: "normal"
      },
      refundProcessed: {
        title: "Refund Processed",
        message: "A refund of ₦{amount} has been processed for order #{orderNumber}.",
        type: "info",
        priority: "normal"
      }
    },
    marketplace: {
      orderReceived: {
        title: "Order Confirmed",
        message: "Your order for {productName} has been confirmed and is being processed.",
        type: "success",
        priority: "normal"
      },
      orderShipped: {
        title: "Order Shipped",
        message: "Your order #{orderNumber} has been shipped and is on its way.",
        type: "info",
        priority: "normal"
      },
      orderDelivered: {
        title: "Order Delivered",
        message: "Your order #{orderNumber} has been delivered successfully.",
        type: "success",
        priority: "normal"
      }
    }
  },
  partner: {
    farmer: {
      registered: {
        title: "New Farmer Registered",
        message: "A new farmer {farmerName} has been registered under your network.",
        type: "info",
        priority: "normal"
      },
      harvestLogged: {
        title: "Farmer Logged Harvest",
        message: "{farmerName} has logged a new {cropType} harvest.",
        type: "info",
        priority: "normal"
      },
      listingCreated: {
        title: "Farmer Created Listing",
        message: "{farmerName} has created a new marketplace listing for {productName}.",
        type: "info",
        priority: "normal"
      }
    },
    performance: {
      weeklyReport: {
        title: "Weekly Performance Report",
        message: "Your network performance for the week: {metrics}",
        type: "info",
        priority: "low"
      }
    },
    commission: {
      earned: {
        title: "Commission Earned",
        message: "You have earned ₦{amount} commission from {farmerName}'s sale of {productName}.",
        type: "success",
        priority: "high"
      },
      paid: {
        title: "Commission Paid",
        message: "Your commission payout of ₦{amount} has been processed successfully.",
        type: "success",
        priority: "normal"
      },
      pending: {
        title: "Commission Available",
        message: "₦{amount} commission is now available for payout from your farmer network.",
        type: "info",
        priority: "normal"
      }
    }
  },
  admin: {
    system: {
      criticalAlert: {
        title: "System Critical Alert",
        message: "{alertMessage}",
        type: "error",
        priority: "urgent"
      },
      newOrder: {
        title: "New Order Received",
        message: "A new order #{orderNumber} worth ₦{totalAmount} has been placed by {buyerName}.",
        type: "info",
        priority: "normal"
      }
    },
    farmer: {
      harvestLogged: {
        title: "New Harvest Logged",
        message: "Farmer {farmerName} has logged a new {cropType} harvest.",
        type: "info",
        priority: "normal"
      },
      listingCreated: {
        title: "New Marketplace Listing",
        message: "Farmer {farmerName} has created a new listing for {productName}.",
        type: "info",
        priority: "normal"
      },
      paymentCompleted: {
        title: "Payment Completed",
        message: "Payment of ₦{amount} has been completed for order #{orderNumber}.",
        type: "success",
        priority: "normal"
      }
    }
  }
}

// Persist + deliver in-app (WebSocket) and email for every notification
exports.createAndEmitNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  category = 'system',
  priority = 'normal',
  data = {},
  actionUrl = null,
  channels = DEFAULT_NOTIFICATION_CHANNELS
}) => {
  try {
    if (!userId || !title || !message) return null

    const deliveryChannels = resolveDeliveryChannels(channels)

    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      category: normalizeNotificationCategory(category),
      channels: toChannelObjects(deliveryChannels),
      data,
      priority,
      actionUrl
    })

    await notification.save()

    // Deliver email + in-app (WebSocket bell/toast) via NotificationService
    try {
      await NotificationService.sendNotification(notification)
    } catch (deliveryError) {
      console.error('Error delivering notification channels:', deliveryError)
      // Fallback: still push to bell if email delivery threw before in-app ran
      emitRealtimeNotification(userId, notification)
    }

    return notification
  } catch (error) {
    console.error('Error creating and emitting notification:', error)
    return null
  }
}

// Enhanced notification creation with role and activity context
exports.createRoleBasedNotification = async (req, res) => {
  try {
    const { 
      userId, 
      role, 
      activity, 
      subActivity, 
      context = {} 
    } = req.body

    // Validate user and role
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Find appropriate template
    const template = NOTIFICATION_TEMPLATES[role]?.[activity]?.[subActivity]
    if (!template) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No notification template found for given role and activity' 
      })
    }

    // Interpolate message with context
    const title = template.title.replace(/\{(\w+)\}/g, (_, key) => context[key] || '')
    const message = template.message.replace(/\{(\w+)\}/g, (_, key) => context[key] || '')

    const notification = await exports.createAndEmitNotification({
      userId,
      title,
      message,
      type: template.type,
      category: activity,
      priority: template.priority,
      data: context,
      actionUrl: context.actionUrl || null
    })

    return res.json({ 
      status: 'success', 
      data: notification 
    })
  } catch (error) {
    console.error('Notification creation error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Fetch user notifications with advanced filtering
exports.getUserNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      type, 
      read,
      priority 
    } = req.query

    // Use authenticated user's ID instead of query parameter
    const userId = req.user.id
    const filter = { user: userId }
    
    if (category) filter.category = category
    if (type) filter.type = type
    if (read !== undefined) filter.read = read === 'true'
    if (priority) filter.priority = priority

    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, read: false })
    ])

    return res.json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Notification fetch error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    })
    return res.json({ status: 'success', data: { unreadCount } })
  } catch (error) {
    console.error('Unread count error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body
    const userId = req.user.id

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'notificationIds required' })
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds }, 
        user: userId 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    )

    return res.json({
      status: 'success',
      data: result
    })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id
    
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    )
    
    return res.json({ status: 'success', message: 'All notifications marked as read' })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params
    const result = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    })

    if (!result) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' })
    }

    return res.json({ status: 'success', message: 'Notification deleted' })
  } catch (error) {
    console.error('Delete notification error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select('notificationPreferences')
    
    return res.json({ status: 'success', data: user.notificationPreferences })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const preferences = { ...(req.body.notifications || req.body) }
    const normalizedCategories = normalizePreferenceCategories(preferences.categories)
    if (normalizedCategories !== undefined) {
      preferences.categories = normalizedCategories
    }
    preferences.lastUpdated = new Date()
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    )
    
    return res.json({ status: 'success', data: user.notificationPreferences })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' })
  }
}

exports.updatePushToken = async (req, res) => {
  try {
    const userId = req.user.id
    const pushToken = req.body.pushToken || req.body.token
    
    await User.findByIdAndUpdate(userId, { pushToken })
    
    return res.json({ status: 'success', message: 'Push token updated successfully' })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Specialized notification functions
exports.sendHarvestNotification = async (req, res) => {
  try {
    const { harvestId, type, message } = req.body
    
    const harvest = await require('../models/harvest.model').findById(harvestId).populate('farmer')
    if (!harvest) {
      return res.status(404).json({ status: 'error', message: 'Harvest not found' })
    }
    
    const notification = await exports.createAndEmitNotification({
      userId: harvest.farmer._id,
      title: `Harvest Update: ${harvest.cropType}`,
      message,
      type: 'info',
      category: 'harvest',
      channels: ['in_app', 'email'],
      data: { harvestId, type },
      actionUrl: `/dashboard/harvests/${harvestId}`
    })
    
    return res.json({ status: 'success', data: notification })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.sendMarketplaceNotification = async (req, res) => {
  try {
    const { listingId, type, message } = req.body
    
    const listing = await require('../models/listing.model').findById(listingId).populate('farmer')
    if (!listing) {
      return res.status(404).json({ status: 'error', message: 'Listing not found' })
    }
    
    const notification = await exports.createAndEmitNotification({
      userId: listing.farmer._id,
      title: `Marketplace Update: ${listing.cropName}`,
      message,
      type: 'info',
      category: 'marketplace',
      channels: ['in_app', 'email'],
      data: { listingId, type },
      actionUrl: `/dashboard/marketplace/listings`
    })
    
    return res.json({ status: 'success', data: notification })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.sendTransactionNotification = async (req, res) => {
  try {
    const { orderId, type, message } = req.body

    const order = await require('../models/order.model').findById(orderId).populate('buyer')
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    const notification = await exports.createAndEmitNotification({
      userId: order.buyer._id,
      title: 'Transaction Update',
      message,
      type: 'success',
      category: 'financial',
      channels: ['in_app', 'email'],
      data: { orderId, type },
      actionUrl: `/dashboard/orders/${orderId}`
    })

    return res.json({ status: 'success', data: notification })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Helper function to create notifications for different activities
exports.createNotificationForActivity = async (userId, role, activity, subActivity, context = {}) => {
  try {
    const template = NOTIFICATION_TEMPLATES[role]?.[activity]?.[subActivity]
    if (!template) {
      console.warn(`No notification template found for ${role}.${activity}.${subActivity}`)
      return null
    }

    // Interpolate message with context
    const title = template.title.replace(/\{(\w+)\}/g, (_, key) => context[key] || '')
    const message = template.message.replace(/\{(\w+)\}/g, (_, key) => context[key] || '')

    return exports.createAndEmitNotification({
      userId,
      title,
      message,
      type: template.type,
      category: activity,
      data: context,
      priority: template.priority,
      actionUrl: context.actionUrl || null
    })
  } catch (error) {
    console.error('Error creating notification for activity:', error)
    return null
  }
}

// Helper function to notify admins about farmer activities
exports.notifyAdmins = async (activity, subActivity, context = {}) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id')
    
    for (const admin of admins) {
      await exports.createNotificationForActivity(admin._id, 'admin', activity, subActivity, context)
    }
    
    return true
  } catch (error) {
    console.error('Error notifying admins:', error)
    return false
  }
}

// Helper function to notify partners about farmer activities
exports.notifyPartners = async (farmerId, activity, subActivity, context = {}) => {
  try {
    const farmer = await User.findById(farmerId).populate('partner')
    if (!farmer || !farmer.partner) return false

    // Partner org doc is not a User — resolve partner login by matching email
    const partnerUser = await User.findOne({
      email: farmer.partner.email,
      role: 'partner'
    }).select('_id')

    if (!partnerUser) {
      console.warn(`No partner user found for org email ${farmer.partner.email}`)
      return false
    }

    await exports.createNotificationForActivity(partnerUser._id, 'partner', activity, subActivity, context)
    return true
  } catch (error) {
    console.error('Error notifying partners:', error)
    return false
  }
}

// Test notification endpoint for demo purposes
exports.testNotification = async (req, res) => {
  try {
    const { type, category, title, message } = req.body
    const userId = req.user.id

    const notification = await exports.createAndEmitNotification({
      userId,
      title: title || `Test ${type || 'info'} notification`,
      message: message || `This is a test ${type || 'info'} notification for ${category || 'system'} category`,
      type: type || 'info',
      category: category || 'system',
      priority: type === 'error' ? 'urgent' : 'normal',
      data: { test: true, timestamp: new Date() }
    })

    return res.json({
      status: 'success',
      message: 'Test notification sent successfully',
      data: notification
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to send test notification' })
  }
}
