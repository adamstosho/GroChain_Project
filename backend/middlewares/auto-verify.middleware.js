// Auto-verify middleware for pending payments
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')

const autoVerifyPayments = async (req, res, next) => {
  try {
    const featureEnabled = process.env.ENABLE_AUTO_VERIFY_MIDDLEWARE === 'true'
    if (!featureEnabled) {
      return next()
    }

    if (process.env.NODE_ENV === 'production') {
      return next()
    }

    // Only run for order-related endpoints
    if (req.path.includes('/orders') || req.path.includes('/payments')) {
      // Check if we have any pending orders that need verification
      const pendingOrders = await Order.find({ 
        paymentStatus: 'pending' 
      }).limit(5) // Limit to avoid performance issues

      if (pendingOrders.length > 0) {
        console.log(`🔄 Auto-verifying ${pendingOrders.length} pending orders...`)

        for (const order of pendingOrders) {
          try {
            // Find associated transaction
            const transaction = await Transaction.findOne({ 
              orderId: order._id,
              status: 'pending'
            })

            if (transaction) {
              // Auto-verify in test mode
              transaction.status = 'completed'
              transaction.processedAt = new Date()
              transaction.metadata = {
                ...transaction.metadata,
                autoVerified: true,
                verifiedAt: new Date(),
                middleware: true
              }
              await transaction.save()

              // Update order
              order.status = 'confirmed'
              order.paymentStatus = 'paid'
              order.paymentReference = transaction.reference
              await order.save()

              console.log(`✅ Auto-verified order ${order._id}`)
            }
          } catch (error) {
            console.error(`❌ Error auto-verifying order ${order._id}:`, error.message)
          }
        }
      }
    }

    next()
  } catch (error) {
    console.error('❌ Auto-verify middleware error:', error)
    next() // Continue even if auto-verify fails
  }
}

module.exports = { autoVerifyPayments }
