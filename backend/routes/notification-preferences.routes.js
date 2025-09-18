const express = require('express')
const router = express.Router()
const notificationPreferencesController = require('../controllers/notification-preferences.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Get user's current notification preferences
router.get('/preferences', authenticate, notificationPreferencesController.getUserNotificationPreferences)

// Update user's notification preferences
router.put('/preferences', authenticate, notificationPreferencesController.updateNotificationPreferences)

// Get notification analytics
router.get('/analytics', authenticate, notificationPreferencesController.getNotificationAnalytics)

module.exports = router
