const express = require('express')
const router = express.Router()
const Joi = require('joi')
const ctrl = require('../controllers/payment.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { rateLimit, userRateLimit } = require('../middlewares/rateLimit.middleware')
const { validateBody, validateParams, validatePayment } = require('../middlewares/validation.middleware')

const initializePaymentSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  amount: Joi.number().positive().required(),
  email: Joi.string().email().required(),
  callbackUrl: Joi.string().uri().optional(),
  paymentProvider: Joi.string().valid('paystack', 'flutterwave').default('paystack')
})

const verifyPaymentParamsSchema = Joi.object({
  reference: Joi.string().min(6).max(200).required()
})

// Public routes
router.get('/', ctrl.getPaymentConfig) // Root endpoint redirects to config
router.get('/config', ctrl.getPaymentConfig)

// Paystack webhook (no auth)
router.post(
  '/verify',
  rateLimit('paymentWebhook'),
  express.json({ type: '*/*' }),
  validatePayment.webhook,
  ctrl.webhookVerify
)

// Flutterwave webhook (no auth) — Flutterwave signs via a static 'verif-hash'
// header rather than an HMAC, so it needs its own route/handler.
router.post(
  '/verify/flutterwave',
  rateLimit('paymentWebhook'),
  express.json({ type: '*/*' }),
  validatePayment.webhook,
  ctrl.webhookVerifyFlutterwave
)

// Protected routes (require authentication)
router.use(authenticate)

router.post(
  '/initialize',
  userRateLimit('paymentInitialize'),
  validateBody(initializePaymentSchema),
  ctrl.initializePayment
)
router.post('/loan/initialize', userRateLimit('paymentInitialize'), ctrl.initializeLoanPayment)
router.get('/verify/:reference', validateParams(verifyPaymentParamsSchema), ctrl.verifyPayment)
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

