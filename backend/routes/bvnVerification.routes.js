const express = require('express')
const router = express.Router()
const bvnController = require('../controllers/bvnVerification.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Protected user endpoints
router.post('/verify', authenticate, bvnController.verifyBVN)
router.get('/status', authenticate, bvnController.getBVNStatus)
router.post('/resend', authenticate, bvnController.resendBVNVerification)
router.put('/update', authenticate, bvnController.updateBVN)

// Admin endpoints
router.get('/stats', authenticate, authorize('admin'), bvnController.getBVNStats)
router.post('/bulk-verify', authenticate, authorize('admin'), bvnController.bulkBVNVerification)

module.exports = router
