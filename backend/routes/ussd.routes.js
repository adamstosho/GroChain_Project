const express = require('express')
const router = express.Router()
const ussdController = require('../controllers/ussd.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Public endpoint for USSD service provider (e.g., Africa's Talking)
router.post('/callback', ussdController.initUSSD)

// Admin endpoints for session management
router.get('/sessions', authenticate, authorize('admin'), ussdController.getAllUSSDSessions)
router.get('/sessions/:sessionId', authenticate, authorize('admin'), ussdController.getUSSDInfo)
router.delete('/sessions/expired', authenticate, authorize('admin'), ussdController.clearExpiredSessions)

module.exports = router
