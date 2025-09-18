const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notification.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Create role-based notification (internal/admin use)
router.post('/create', authenticate, authorize('admin', 'system'), notificationController.createRoleBasedNotification)

// Get user's notifications with advanced filtering
router.get('/', authenticate, notificationController.getUserNotifications)

// Mark multiple notifications as read
router.patch('/mark-read', authenticate, notificationController.markNotificationsAsRead)

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead)

// Get notification preferences
router.get('/preferences', authenticate, notificationController.getNotificationPreferences)

// Update notification preferences
router.put('/preferences', authenticate, notificationController.updateNotificationPreferences)

// Update push token
router.put('/push-token', authenticate, notificationController.updatePushToken)

// Test notification endpoint (for development)
router.post('/test', authenticate, notificationController.testNotification)

// Specialized notification endpoints
router.post('/harvest', authenticate, notificationController.sendHarvestNotification)
router.post('/marketplace', authenticate, notificationController.sendMarketplaceNotification)
router.post('/transaction', authenticate, notificationController.sendTransactionNotification)

module.exports = router

