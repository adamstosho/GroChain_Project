const express = require('express')
const router = express.Router()
const bvnController = require('../controllers/bvnVerification.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')

// Protected user endpoints — rate-limited per user since BVN checks hit a
// paid, PII-sensitive external verification API and are an enumeration risk
router.post('/verify', authenticate, rateLimitMiddleware.userRateLimit('bvn'), bvnController.verifyBVN)
router.get('/status', authenticate, bvnController.getBVNStatus)
router.post('/resend', authenticate, rateLimitMiddleware.userRateLimit('bvn'), bvnController.resendBVNVerification)
router.put('/update', authenticate, rateLimitMiddleware.userRateLimit('bvn'), bvnController.updateBVN)

// Admin endpoints
router.get('/stats', authenticate, authorize('admin'), bvnController.getBVNStats)
router.post('/bulk-verify', authenticate, authorize('admin'), bvnController.bulkBVNVerification)

module.exports = router
