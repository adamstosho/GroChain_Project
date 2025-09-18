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
router.get('/methods', async (req, res) => {
  try {
    // For now, return mock data - can be replaced with database queries
    const paymentMethods = [
      {
        _id: "1",
        name: "Visa ending in 4242",
        type: "card",
        isDefault: true,
        isVerified: true,
        lastUsed: "2024-01-15",
        details: {
          last4: "4242",
          expiry: "12/26",
          brand: "Visa",
          cardholderName: req.user?.name || "User"
        },
        metadata: {
          createdAt: "2024-01-10",
          updatedAt: "2024-01-15"
        }
      },
      {
        _id: "2",
        name: "GT Bank Account",
        type: "bank_account",
        isDefault: false,
        isVerified: true,
        lastUsed: "2024-01-10",
        details: {
          bankName: "GT Bank",
          accountNumber: "0123456789",
          accountType: "Savings",
          accountName: req.user?.name || "User"
        },
        metadata: {
          createdAt: "2024-01-08",
          updatedAt: "2024-01-10"
        }
      },
      {
        _id: "3",
        name: "MTN Mobile Money",
        type: "mobile_money",
        isDefault: false,
        isVerified: false,
        lastUsed: "2024-01-05",
        details: {
          phoneNumber: "+2348012345678",
          provider: "MTN",
          accountName: req.user?.name || "User"
        },
        metadata: {
          createdAt: "2024-01-05",
          updatedAt: "2024-01-05"
        }
      }
    ]

    res.json({
      status: 'success',
      data: paymentMethods,
      message: 'Payment methods retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment methods'
    })
  }
})

// Add new payment method
router.post('/methods', authenticate, async (req, res) => {
  try {
    const { type, details } = req.body

    if (!type || !details) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment method type and details are required'
      })
    }

    // Mock response - in production, save to database
    const newMethod = {
      _id: Date.now().toString(),
      name: `${type} ending in ${details.last4 || details.accountNumber?.slice(-4) || details.phoneNumber?.slice(-4)}`,
      type,
      isDefault: false,
      isVerified: false,
      lastUsed: null,
      details: {
        ...details,
        accountName: req.user?.name || "User"
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    res.status(201).json({
      status: 'success',
      data: newMethod,
      message: 'Payment method added successfully'
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to add payment method'
    })
  }
})

// Update payment method
router.put('/methods/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Mock response - in production, update in database
    const updatedMethod = {
      _id: id,
      ...updates,
      metadata: {
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    res.json({
      status: 'success',
      data: updatedMethod,
      message: 'Payment method updated successfully'
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update payment method'
    })
  }
})

// Delete payment method
router.delete('/methods/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Mock response - in production, delete from database
    res.json({
      status: 'success',
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete payment method'
    })
  }
})

// Set default payment method
router.patch('/methods/:id/default', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Mock response - in production, update default status in database
    res.json({
      status: 'success',
      message: 'Default payment method updated successfully'
    })
  } catch (error) {
    console.error('Error setting default payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to set default payment method'
    })
  }
})

module.exports = router

