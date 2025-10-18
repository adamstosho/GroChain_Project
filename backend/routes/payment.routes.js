const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/payment.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Public routes
router.get('/', ctrl.getPaymentConfig) // Root endpoint redirects to config
router.get('/config', ctrl.getPaymentConfig)
router.post('/initialize', ctrl.initializePayment)
router.get('/verify/:reference', ctrl.verifyPayment)

// Paystack webhook (no auth)
router.post('/verify', express.json({ type: '*/*' }), ctrl.webhookVerify)

// Protected routes (require authentication)
router.use(authenticate)

router.post('/refund/:orderId', ctrl.processRefund)

// Order synchronization routes (protected)
router.post('/sync/:orderId', ctrl.syncOrderStatus)
router.post('/bulk-sync', ctrl.bulkSyncOrders)
router.get('/transactions', ctrl.getTransactionHistory)

// Payment verification routes
router.post('/verify-payment/:reference', ctrl.verifyPayment)


// Payment Methods Management
router.get('/methods', ctrl.getPaymentMethods)

// Add new payment method
router.post('/methods', ctrl.addPaymentMethod)

// Update payment method
router.put('/methods/:id', ctrl.updatePaymentMethod)

// Delete payment method
router.delete('/methods/:id', ctrl.deletePaymentMethod)

// Set default payment method
router.patch('/methods/:id/default', ctrl.setDefaultPaymentMethod)

module.exports = router

