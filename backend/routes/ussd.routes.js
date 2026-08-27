const express = require('express')
const router = express.Router()
const ussdController = require('../controllers/ussd.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')
const { verifyUssdCallback } = require('../middlewares/ussdAuth.middleware')

// Provider callback — rate-limited + shared-secret authenticated
router.post(
  '/callback',
  rateLimitMiddleware.rateLimit('ussd'),
  verifyUssdCallback,
  ussdController.initUSSD
)

// Admin endpoints for session management
router.get('/sessions', authenticate, authorize('admin'), ussdController.getAllUSSDSessions)
router.get('/sessions/:sessionId', authenticate, authorize('admin'), ussdController.getUSSDInfo)
router.delete('/sessions/expired', authenticate, authorize('admin'), ussdController.clearExpiredSessions)

module.exports = router
