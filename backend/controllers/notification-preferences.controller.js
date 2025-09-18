const User = require('../models/user.model')
const webSocketService = require('../services/websocket.service')

exports.getUserNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select('notificationPreferences')

    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      })
    }

    return res.json({
      status: 'success',
      data: user.notificationPreferences || {}
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error retrieving notification preferences' 
    })
  }
}

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const { 
      websocket, 
      email, 
      sms, 
      push, 
      categories, 
      priorityThreshold 
    } = req.body

    // Validate input
    const validCategories = [
      'harvest', 
      'marketplace', 
      'financial', 
      'system', 
      'weather', 
      'shipment', 
      'payment', 
      'partner'
    ]

    if (categories && !categories.every(cat => validCategories.includes(cat))) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid notification categories' 
      })
    }

    // Update preferences via WebSocket service
    const updatedPreferences = await webSocketService.updateUserNotificationPreferences(
      userId, 
      { 
        websocket, 
        email, 
        sms, 
        push, 
        categories, 
        priorityThreshold 
      }
    )

    if (!updatedPreferences) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update notification preferences' 
      })
    }

    return res.json({
      status: 'success',
      data: updatedPreferences
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error updating notification preferences' 
    })
  }
}

exports.getNotificationAnalytics = async (req, res) => {
  try {
    const userId = req.user.id
    const { 
      startDate, 
      endDate, 
      role 
    } = req.query

    const analytics = await webSocketService.getNotificationAnalytics({
      userId,
      role,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    })

    if (!analytics) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve notification analytics' 
      })
    }

    return res.json({
      status: 'success',
      data: analytics
    })
  } catch (error) {
    console.error('Notification analytics error:', error)
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error retrieving notification analytics' 
    })
  }
}
