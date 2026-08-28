/**
 * Idempotent payment fulfillment — single source of truth.
 *
 * Industry pattern (Stripe, Shopify, Hookdeck):
 * - One fulfillment handler keyed on order + payment reference
 * - Safe to retry from verify, webhooks, or manual reconciliation
 * - Never patch order status without inventory / side-effect guards
 *
 * @see https://shopify.dev/docs/apps/build/webhooks (reconciliation jobs)
 * @see https://stripe.com/docs/webhooks/best-practices (idempotent processing)
 */

const mongoose = require('mongoose')
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')
const notificationController = require('../controllers/notification.controller')
const realTimeCommissionService = require('../services/commission-realtime.service')

function inventoryApplied(order) {
  return Boolean(order?.metadata?.fulfillment?.inventoryAppliedAt)
}

function isFullyFulfilled(order) {
  return order?.paymentStatus === 'paid' && inventoryApplied(order)
}

/**
 * Mark order paid + decrement inventory inside an existing Mongo session.
 * Idempotent: skips steps already recorded on the order document.
 *
 * @returns {{ wasJustPaid: boolean, inventoryApplied: boolean, needsSideEffects: boolean }}
 */
async function fulfillOrderInSession({ order, paymentReference, session }) {
  if (!order) {
    return { wasJustPaid: false, inventoryApplied: false, needsSideEffects: false }
  }

  if (isFullyFulfilled(order)) {
    if (!order.paymentReference && paymentReference) {
      order.paymentReference = paymentReference
      await order.save({ session })
    }
    return { wasJustPaid: false, inventoryApplied: false, needsSideEffects: false }
  }

  const Listing = require('../models/listing.model')
  const wasAlreadyPaid = order.paymentStatus === 'paid'
  const hadInventory = inventoryApplied(order)
  let wasJustPaid = false
  let appliedInventory = false

  if (!wasAlreadyPaid) {
    order.status = 'confirmed'
    order.paymentStatus = 'paid'
    order.paymentReference = paymentReference
    wasJustPaid = true
  } else if (!order.paymentReference && paymentReference) {
    order.paymentReference = paymentReference
  }

  if (!hadInventory) {
    const populatedOrder = await Order.findById(order._id)
      .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
      .session(session)

    for (const item of populatedOrder?.items || []) {
      if (!item.listing) continue
      const listing = item.listing

      if (listing.availableQuantity < item.quantity) {
        console.error('❌ Insufficient stock during fulfillment (continuing — payment captured):', {
          orderId: order._id,
          listingId: listing._id,
          cropName: listing.cropName,
          availableQuantity: listing.availableQuantity,
          orderedQuantity: item.quantity,
        })
        continue
      }

      const newAvailableQuantity = listing.availableQuantity - item.quantity
      await Listing.findByIdAndUpdate(
        listing._id,
        {
          $inc: { availableQuantity: -item.quantity },
          $set: {
            status: newAvailableQuantity <= 0 ? 'sold_out' : listing.status,
            soldOutAt: newAvailableQuantity <= 0 ? new Date() : null,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true, session }
      )
    }

    order.metadata = {
      ...(order.metadata || {}),
      fulfillment: {
        ...(order.metadata?.fulfillment || {}),
        inventoryAppliedAt: new Date(),
        paymentReference,
        source: order.metadata?.fulfillment?.source || 'payment_fulfillment',
      },
    }
    order.markModified('metadata')
    appliedInventory = true
  }

  if (wasJustPaid || appliedInventory || order.isModified()) {
    await order.save({ session })
  }

  return {
    wasJustPaid,
    inventoryApplied: appliedInventory,
    needsSideEffects: wasJustPaid || appliedInventory,
  }
}

/**
 * Commissions + notifications (idempotent via DB unique indexes / dedupe keys).
 */
async function runPostPaymentSideEffects(order) {
  if (!order?._id) return

  const Listing = require('../models/listing.model')
  const User = require('../models/user.model')

  try {
    const populatedForCommission = await Order.findById(order._id)
      .populate('items.listing')
      .populate('buyer', 'name email')

    if (!populatedForCommission) return

    const commissionResult = await realTimeCommissionService.processOrderCommissions(populatedForCommission)
    if (!commissionResult.success) {
      const { createCommissions } = require('../controllers/payment.controller')
      await createCommissions(populatedForCommission)
    }

    for (const item of populatedForCommission.items || []) {
      if (!item.listing) continue
      const listing = await Listing.findById(item.listing).populate('farmer')
      if (!listing?.farmer) continue
      const farmer =
        typeof listing.farmer === 'object' ? listing.farmer : await User.findById(listing.farmer)
      if (farmer?.partner) {
        await realTimeCommissionService.verifyPartnerCommissions(farmer.partner)
      }
    }
  } catch (commissionError) {
    console.error('❌ Post-payment commission processing failed:', commissionError)
  }

  try {
    const populatedOrder = await Order.findById(order._id)
      .populate('items.listing', 'farmer cropName')
      .populate('buyer', 'name')

    if (!populatedOrder) return

    const buyerId = populatedOrder.buyer?._id || populatedOrder.buyer
    if (buyerId) {
      await notificationController.createNotificationForActivity(
        buyerId,
        'buyer',
        'financial',
        'paymentCompleted',
        {
          amount: populatedOrder.total,
          orderNumber:
            populatedOrder.orderNumber ||
            `ORD-${populatedOrder._id.toString().slice(-6).toUpperCase()}`,
          actionUrl: `/dashboard/orders/${populatedOrder._id}`,
        }
      )
    }

    for (const item of populatedOrder.items || []) {
      const farmerId = item.listing?.farmer?._id || item.listing?.farmer
      if (!farmerId || !item.listing?.cropName) continue
      await notificationController.createNotificationForActivity(
        farmerId,
        'farmer',
        'financial',
        'paymentReceived',
        {
          amount: item.price * item.quantity,
          orderNumber:
            populatedOrder.orderNumber ||
            `ORD-${populatedOrder._id.toString().slice(-6).toUpperCase()}`,
          productName: item.listing.cropName,
          buyerName: populatedOrder.buyer?.name || 'Buyer',
          actionUrl: `/dashboard/orders/${populatedOrder._id}`,
        }
      )
    }

    await notificationController.notifyAdmins('farmer', 'paymentCompleted', {
      amount: populatedOrder.total,
      orderNumber:
        populatedOrder.orderNumber ||
        `ORD-${populatedOrder._id.toString().slice(-6).toUpperCase()}`,
      buyerName: populatedOrder.buyer?.name || 'Buyer',
      actionUrl: `/admin/orders/${populatedOrder._id}`,
    })
  } catch (notificationError) {
    console.error('❌ Post-payment notification failed:', notificationError)
  }
}

/**
 * Reconcile an order against a completed payment transaction.
 * Used by syncOrderStatus, bulkSyncOrders, and recovery flows.
 */
async function reconcileOrderFulfillment(orderId, { runSideEffects = true } = {}) {
  const order = await Order.findById(orderId)
  if (!order) {
    return { success: false, error: 'Order not found', statusCode: 404 }
  }

  const transaction = await Transaction.findOne({
    orderId: order._id,
    type: 'payment',
    status: 'completed',
  }).sort({ createdAt: -1 })

  if (!transaction) {
    return {
      success: true,
      synced: false,
      reason: 'no_completed_payment',
      order,
    }
  }

  if (isFullyFulfilled(order)) {
    return {
      success: true,
      synced: true,
      alreadySynced: true,
      order,
      transaction,
    }
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  let fulfillmentResult

  try {
    const lockedOrder = await Order.findById(orderId).session(session)
    fulfillmentResult = await fulfillOrderInSession({
      order: lockedOrder,
      paymentReference: transaction.reference,
      session,
    })
    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }

  if (runSideEffects && fulfillmentResult.needsSideEffects) {
    await runPostPaymentSideEffects(await Order.findById(orderId))
  }

  const updatedOrder = await Order.findById(orderId)

  return {
    success: true,
    synced: true,
    alreadySynced: false,
    wasJustPaid: fulfillmentResult.wasJustPaid,
    inventoryApplied: fulfillmentResult.inventoryApplied,
    order: updatedOrder,
    transaction,
  }
}

module.exports = {
  inventoryApplied,
  isFullyFulfilled,
  fulfillOrderInSession,
  runPostPaymentSideEffects,
  reconcileOrderFulfillment,
}
