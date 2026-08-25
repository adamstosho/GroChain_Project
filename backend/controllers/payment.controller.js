const crypto = require('crypto')
const mongoose = require('mongoose')
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')
const Commission = require('../models/commission.model')
const PaymentMethod = require('../models/payment-method.model')
const https = require('https')
const notificationController = require('./notification.controller')
const realTimeCommissionService = require('../services/commission-realtime.service')
const PaystackUtil = require('../utils/paystack.util')
const FlutterwaveUtil = require('../utils/flutterwave.util')

const allowInsecureTestPayments = () =>
  process.env.ALLOW_INSECURE_TEST_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production'

const hasValidProviderSecret = (provider) => {
  if (provider === 'flutterwave') {
    const key = process.env.FLUTTERWAVE_SECRET_KEY
    return !!(key && key !== 'FLWSECK_TEST_your_secret_key_here' && key !== 'your_flutterwave_secret_key')
  }

  const key = process.env.PAYSTACK_SECRET_KEY
  return !!(key && key !== 'sk_test_your_secret_key_here')
}

exports.getPaymentConfig = async (req, res) => {
  try {
    // Debug environment variables
    console.log('🔍 Environment variables debug:', {
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? 'Set' : 'Not set',
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? 'Set' : 'Not set',
      FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY ? 'Set' : 'Not set',
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY ? 'Set' : 'Not set'
    })

    const config = {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      paystack: {
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        enabled: !!(process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY)
      },
      flutterwave: {
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY === 'your_flutterwave_public_key' ? 'FLWPUBK_TEST-fd980f9c2c56a376ea35cea0218289ca-X' : process.env.FLUTTERWAVE_PUBLIC_KEY,
        enabled: !!(process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY)
      },
      currency: 'NGN',
      supportedChannels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE) || 0.03,
      supportedProviders: ['paystack', 'flutterwave']
    }
    
    return res.json({ status: 'success', data: config })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.initializePayment = async (req, res) => {
  try {
    const { orderId, amount, email, callbackUrl, paymentProvider = 'paystack' } = req.body
    const currentUserId = req.user?.id || req.user?._id
    
    if (!orderId || !amount || !email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Order ID, amount, and email are required' 
      })
    }

    // Validate payment provider
    const supportedProviders = ['paystack', 'flutterwave']
    if (!supportedProviders.includes(paymentProvider)) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Unsupported payment provider. Supported providers: ${supportedProviders.join(', ')}` 
      })
    }
    
    const order = await Order.findById(orderId)
      .populate('buyer', 'name email phone profile.phone profile.avatar')
      .populate('seller', 'name email phone profile.phone profile.farmName')
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    if (!currentUserId || order.buyer?._id?.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only initialize payment for your own order'
      })
    }

    // More robust email validation - trim whitespace and handle case sensitivity
    const buyerEmail = (order.buyer.email || '').toLowerCase().trim()
    const providedEmail = (email || '').toLowerCase().trim()

    if (!buyerEmail || buyerEmail !== providedEmail) {
      console.log('❌ Email mismatch:', {
        buyerEmail: order.buyer.email,
        providedEmail: email,
        buyerEmailNormalized: buyerEmail,
        providedEmailNormalized: providedEmail
      })
      return res.status(400).json({
        status: 'error',
        message: 'Email mismatch: The email provided does not match the buyer\'s registered email'
      })
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'This order has already been paid'
      })
    }

    const requestedAmount = Number(amount)
    const orderTotal = Number(order.total)
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment amount'
      })
    }
    if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order total is invalid'
      })
    }
    if (Math.abs(requestedAmount - orderTotal) > 0.01) {
      return res.status(400).json({
        status: 'error',
        message: `Payment amount must match order total (₦${orderTotal.toLocaleString('en-NG')})`
      })
    }
    
    // Generate unique reference
    const reference = `GROCHAIN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'payment',
      status: 'pending',
      amount: amount,
      currency: 'NGN',
      reference: reference,
      description: `Payment for order ${orderId}`,
      userId: order.buyer._id,
      orderId: orderId,
      paymentProvider: paymentProvider,
      metadata: {
        orderId: orderId,
        callbackUrl: callbackUrl,
        paymentProvider: paymentProvider
      }
    })
    
    await transaction.save()
    
    // Allow insecure test-mode behavior only when explicitly enabled
    console.log('🔍 Checking payment provider configuration:', {
      provider: paymentProvider,
      hasPaystackKey: !!process.env.PAYSTACK_SECRET_KEY,
      hasFlutterwaveKey: !!process.env.FLUTTERWAVE_SECRET_KEY,
      isTestMode: paymentProvider === 'paystack' ? 
        (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'sk_test_your_secret_key_here') :
        (!process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY === 'FLWSECK_TEST_your_secret_key_here')
    })
    
    const isTestMode = allowInsecureTestPayments()
    
    if (isTestMode) {
      console.log('🧪 Auto-verifying payment in test mode...')
      
      // Update transaction to completed
      transaction.status = 'completed'
      transaction.processedAt = new Date()
      transaction.metadata = {
        ...transaction.metadata,
        autoVerified: true,
        verifiedAt: new Date(),
        testMode: true
      }
      await transaction.save()
      
      // Update order to confirmed (order status) and paid (payment status)
      order.status = 'confirmed'
      order.paymentStatus = 'paid'
      order.paymentReference = reference
      await order.save()
      
      console.log('✅ Payment auto-verified and order marked as paid')
      
      // CRITICAL FIX: Create commissions for auto-verified payments
      try {
        console.log('💰 Auto-verification: Creating commissions for paid order...');
        
        // Populate the order with items and listings before creating commissions
        const populatedOrder = await Order.findById(order._id)
          .populate('items.listing')
          .populate('buyer', 'name email');
        
        if (populatedOrder) {
          await exports.createCommissions(populatedOrder);
          console.log('✅ Auto-verification: Commissions created successfully');
        } else {
          console.log('❌ Auto-verification: Could not populate order for commission creation');
        }
      } catch (commissionError) {
        console.error('❌ Auto-verification: Commission creation failed:', commissionError);
        // Don't fail the auto-verification because of commission errors
      }
      
      // CRITICAL FIX: Update inventory for auto-verified payments
      try {
        console.log('📦 Auto-verification: Updating inventory for paid order...')
        console.log('📦 Order ID:', order._id)
        console.log('📦 Order items before populate:', order.items?.length || 0)
        
        const Listing = require('../models/listing.model')
        
        // Populate the order items with listing details
        const populatedOrder = await Order.findById(order._id)
          .populate('items.listing', 'cropName availableQuantity quantity status')
        
        console.log('📦 Order items after populate:', populatedOrder?.items?.length || 0)
        
        for (const item of populatedOrder.items) {
          console.log('🔍 Processing order item:', {
            hasListing: !!item.listing,
            listingId: item.listing?._id,
            quantity: item.quantity
          })
          
          if (item.listing) {
            const listing = item.listing
            const newAvailableQuantity = listing.availableQuantity - item.quantity
            
            console.log('🛒 Auto-verification: Updating inventory for item:', {
              listingId: listing._id,
              cropName: listing.cropName,
              orderedQuantity: item.quantity,
              oldAvailableQuantity: listing.availableQuantity,
              newAvailableQuantity: newAvailableQuantity
            })

            // Update the listing with final inventory reduction
            const updatedListing = await Listing.findByIdAndUpdate(listing._id, {
              $inc: { 
                availableQuantity: -item.quantity
              },
              status: newAvailableQuantity <= 0 ? 'sold_out' : listing.status,
              soldOutAt: newAvailableQuantity <= 0 ? new Date() : null
            }, { new: true })

            console.log('✅ Auto-verification: Inventory updated:', {
              listingId: listing._id,
              cropName: listing.cropName,
              finalAvailableQuantity: updatedListing.availableQuantity,
              finalTotalQuantity: updatedListing.quantity,
              status: updatedListing.status
            })
          } else {
            console.log('❌ No listing found for order item')
          }
        }
        
        console.log('✅ Auto-verification: All inventory updates completed successfully')
      } catch (inventoryError) {
        console.error('❌ Auto-verification: Inventory update failed:', inventoryError)
        // Don't fail the auto-verification because of inventory errors, but log them
      }
    }
    
    // Initialize payment with the selected provider
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? `${process.env.WEBHOOK_URL || 'https://your-domain.com/api'}/payments/verify`
      : `http://localhost:5000/api/payments/verify`

    let paymentResponse = null

    if (paymentProvider === 'paystack') {
      const paystackData = {
        email: email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference: reference,
        callback_url: callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify`,
        webhook_url: webhookUrl,
        metadata: {
          order_id: orderId,
          transaction_id: transaction._id.toString()
        }
      }
      
      console.log('🔗 Initializing payment with Paystack API...')
      
      // Check if Paystack keys are configured
      if (!hasValidProviderSecret('paystack')) {
        if (!allowInsecureTestPayments()) {
          return res.status(503).json({
            status: 'error',
            message: 'Paystack is not configured. Contact support.'
          })
        }
        console.log('⚠️ Paystack keys not configured, using fallback mode')
        
        // Fallback: Create a simulated response that will work for testing
        paymentResponse = {
          success: true,
          authorization_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify?reference=${reference}&test_mode=true`,
          access_code: require('crypto').randomBytes(32).toString('hex'),
          reference: reference
        }
        
        console.log('✅ Payment initialized in fallback mode (test)')
      } else {
        const paystackUtil = new PaystackUtil()
        paymentResponse = await paystackUtil.initializeTransaction(paystackData)
        
        if (!paymentResponse.success) {
          console.log('❌ Paystack initialization failed:', paymentResponse.message)
          return res.status(400).json({ 
            status: 'error', 
            message: 'Payment initialization failed: ' + paymentResponse.message 
          })
        }
        
        console.log('✅ Paystack payment initialized successfully')
      }
    } else if (paymentProvider === 'flutterwave') {
      const flutterwaveData = {
        email: email,
        amount: amount,
        reference: reference,
        callbackUrl: callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify`,
        orderId: orderId,
        customerName: order.buyer.name
      }
      
      console.log('🔗 Initializing payment with Flutterwave API...')
      
    // Check if Flutterwave keys are configured
      if (!hasValidProviderSecret('flutterwave')) {
        if (!allowInsecureTestPayments()) {
          return res.status(503).json({
            status: 'error',
            message: 'Flutterwave is not configured. Contact support.'
          })
        }
        console.log('⚠️ Flutterwave keys not configured, using fallback mode')
        
        // Fallback: Create a simulated response that will work for testing
        paymentResponse = {
          success: true,
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify?reference=${reference}&test_mode=true`,
          reference: reference
        }
        
        console.log('✅ Payment initialized in fallback mode (test)')
      } else {
        try {
          const flutterwaveUtil = new FlutterwaveUtil()
          paymentResponse = await flutterwaveUtil.initializeTransaction(flutterwaveData)
          
          if (!paymentResponse.success) {
            console.log('❌ Flutterwave initialization failed:', paymentResponse.message)
            throw new Error(paymentResponse.message || 'Flutterwave initialization failed')
          }
          
          console.log('✅ Flutterwave payment initialized successfully')
        } catch (flutterwaveError) {
          console.log('⚠️ Flutterwave API error, falling back to test mode:', flutterwaveError.message)
          
          // Fallback: Create a simulated response that will work for testing
          paymentResponse = {
            success: true,
            link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify?reference=${reference}&test_mode=true`,
            reference: reference
          }
          
          console.log('✅ Payment initialized in fallback mode (test)')
        }
      }
    }
    
    return res.json({
      status: 'success',
      data: {
        transaction: transaction,
        paymentProvider: paymentProvider,
        [paymentProvider]: paymentResponse,
        testMode: isTestMode
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params
    const { paymentProvider } = req.query
    const currentUserId = req.user?.id || req.user?._id
    const currentUserRole = req.user?.role

    console.log('🔍 Manual payment verification for reference:', reference, 'provider:', paymentProvider)

    const transaction = await Transaction.findOne({ reference: reference })
    if (!transaction) {
      console.log('❌ Transaction not found:', reference)
      return res.status(404).json({ status: 'error', message: 'Transaction not found' })
    }

    if (
      currentUserRole !== 'admin' &&
      currentUserRole !== 'partner' &&
      transaction.userId?.toString?.() !== currentUserId?.toString?.()
    ) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    // If already completed, return idempotent success without side effects
    if (transaction.status === 'completed') {
      console.log('✅ Transaction already completed - returning idempotent response')

      // Always try to fetch and return the latest order data
      let orderData = null
      if (transaction.orderId) {
        const order = await Order.findById(transaction.orderId)
          .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
        
        if (order) {
          orderData = order
        }
      }

      return res.json({
        status: 'success',
        data: {
          transaction: transaction,
          order: orderData,
          message: 'Payment already verified'
        }
      })
    }

    // Check if this is a test mode payment
    const isTestMode = (req.query.test_mode === 'true' || req.body?.test_mode === true) && allowInsecureTestPayments()
    const provider = paymentProvider || transaction.paymentProvider || 'paystack'
    
    const isProviderTestMode = !hasValidProviderSecret(provider) && allowInsecureTestPayments()
    let verificationData
    
    if (isTestMode || isProviderTestMode) {
      console.log('🧪 Test mode: Simulating successful payment verification')
      
      // In test mode, always mark as successful
      verificationData = {
        status: 'success',
        amount: transaction.amount * 100, // Convert to kobo
        reference: reference,
        gateway_response: 'Successful (Test Mode)',
        paid_at: new Date().toISOString(),
        channel: 'card',
        ip_address: req.ip,
        fees: Math.round(transaction.amount * 0.015), // 1.5% Paystack fee
        customer: {
          email: 'test@example.com',
          customer_code: 'CUS_TEST'
        }
      }
      
      console.log('✅ Test mode verification successful')
    } else {
      // Verify with the appropriate payment provider API
      console.log(`🔍 Verifying payment with ${provider} API...`)
      
      let providerVerification = null
      
      if (provider === 'paystack') {
        providerVerification = await verifyWithPaystackAPI(reference)
      } else if (provider === 'flutterwave') {
        providerVerification = await verifyWithFlutterwaveAPI(reference)
      } else {
        return res.status(400).json({ 
          status: 'error', 
          message: `Unsupported payment provider: ${provider}` 
        })
      }
      
      if (!providerVerification.success) {
        console.log(`❌ ${provider} verification failed:`, providerVerification.error)
        return res.status(400).json({ 
          status: 'error', 
          message: 'Payment verification failed: ' + providerVerification.error 
        })
      }

      if (!providerVerification.paid) {
        console.log(`❌ Payment not successful according to ${provider}`)
        return res.status(400).json({ 
          status: 'error', 
          message: 'Payment was not successful' 
        })
      }

      console.log(`✅ ${provider} verification successful`)
      
      verificationData = {
        status: 'success',
        amount: providerVerification.amount,
        reference: reference,
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        channel: providerVerification.channel || 'card',
        ip_address: req.ip,
        fees: provider === 'paystack' ?
          Math.round((providerVerification.amount / 100) * 0.015) : // 1.5% Paystack fee
          Math.round(providerVerification.amount * 0.014), // 1.4% Flutterwave fee
        customer: providerVerification.customer || {
          email: 'customer@example.com',
          customer_code: 'CUS_1234567890'
        },
        // Needed to issue a real refund later — Flutterwave's refund API requires its
        // own numeric transaction id, not our reference.
        providerTransactionId: providerVerification.providerTransactionId
      }
    }

    console.log('✅ Updating transaction to completed')

    // Transaction + order status + inventory decrement must all succeed or all roll
    // back together — otherwise an order can end up marked "paid" while stock was
    // never actually decremented (or vice versa).
    const session = await mongoose.startSession()
    session.startTransaction()

    let hadPaidPayment = false
    let order = null

    try {
      // Update transaction status
      transaction.status = 'completed'
      transaction.paymentProviderReference = reference
      transaction.processedAt = new Date()
      transaction.metadata.verification = verificationData
      await transaction.save({ session })

      if (transaction.orderId) {
        order = await Order.findById(transaction.orderId).session(session)

        if (order) {
          console.log('📦 Updating order status to paid:', transaction.orderId)

          // Canonical paid flag is paymentStatus; status may be pending/confirmed/paid depending on flow
          hadPaidPayment = order.paymentStatus === 'paid'

          if (!hadPaidPayment) {
            order.status = 'confirmed'
            order.paymentStatus = 'paid'
            order.paymentReference = reference
            await order.save({ session })
            console.log('✅ Order status updated successfully')

            // Update inventory for each item in the order
            console.log('📦 Updating inventory for paid order...')
            const Listing = require('../models/listing.model')
            const populatedOrder = await Order.findById(order._id)
              .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
              .session(session)

            for (const item of populatedOrder.items) {
              if (!item.listing) continue
              const listing = item.listing

              // Validate that we have enough stock before updating
              if (listing.availableQuantity < item.quantity) {
                console.error('❌ Insufficient stock for item:', {
                  listingId: listing._id,
                  cropName: listing.cropName,
                  availableQuantity: listing.availableQuantity,
                  orderedQuantity: item.quantity
                })
                continue // Payment already captured by the provider — don't block the order over a stock discrepancy
              }

              const newAvailableQuantity = listing.availableQuantity - item.quantity

              const updatedListing = await Listing.findByIdAndUpdate(
                listing._id,
                {
                  $inc: { availableQuantity: -item.quantity },
                  $set: {
                    status: newAvailableQuantity <= 0 ? 'sold_out' : listing.status,
                    soldOutAt: newAvailableQuantity <= 0 ? new Date() : null,
                    updatedAt: new Date()
                  }
                },
                { new: true, runValidators: true, session }
              )

              console.log('✅ Inventory updated:', {
                listingId: listing._id,
                cropName: updatedListing?.cropName,
                finalAvailableQuantity: updatedListing?.availableQuantity
              })
            }
          } else if (!order.paymentReference) {
            order.paymentReference = reference
            await order.save({ session })
          }
        }
      }

      await session.commitTransaction()
    } catch (txError) {
      console.error('❌ Payment verification transaction failed, rolling back:', txError)
      await session.abortTransaction()
      session.endSession()
      return res.status(500).json({ status: 'error', message: 'Failed to finalize payment. Please try verifying again.' })
    }
    session.endSession()

    let updatedOrder = order
    if (!order) {
      console.log('⚠️ No order found for transaction')
    } else if (!hadPaidPayment) {
      // Calculate and create commissions with real-time updates (idempotent —
      // guarded by an existence check, safe to retry independently of the
      // order/inventory transaction above)
      try {
        const Listing = require('../models/listing.model')
        const User = require('../models/user.model')

        console.log('🔄 Processing commissions with real-time updates for order:', order._id);

        const commissionResult = await realTimeCommissionService.processOrderCommissions(order);

        if (commissionResult.success) {
          console.log('✅ Real-time commissions processed successfully:', {
            processedItems: commissionResult.processedItems,
            totalCommission: commissionResult.totalCommission
          });
        } else {
          console.error('❌ Real-time commission processing failed:', commissionResult.error);
          console.log('🔄 Falling back to original commission creation');
          await exports.createCommissions(order);
        }

        // Verify partner commissions for all involved farmers
        for (const item of order.items || []) {
          if (!item.listing) continue;

          const listing = await Listing.findById(item.listing).populate('farmer');
          if (!listing || !listing.farmer) continue;

          const farmer = typeof listing.farmer === 'object' ? listing.farmer : await User.findById(listing.farmer);
          if (!farmer || !farmer.partner) continue;

          console.log('🔄 Verifying partner commissions for farmer:', farmer.name);
          await realTimeCommissionService.verifyPartnerCommissions(farmer.partner);
        }
        console.log('✅ Commissions created successfully')
      } catch (commissionError) {
        console.error('❌ Commission creation failed:', commissionError)
        // Don't fail the verification because of commission errors
      }

      // Create notifications for successful payment
      try {
        await notificationController.createNotificationForActivity(
          order.buyer._id,
          'buyer',
          'financial',
          'paymentCompleted',
          {
            amount: order.total,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            actionUrl: `/dashboard/orders/${order._id}`
          }
        )

        const populatedOrder = await Order.findById(order._id)
          .populate('items.listing', 'farmer cropName')
          .populate('buyer', 'name')

        for (const item of populatedOrder.items) {
          if (item.listing && item.listing.farmer) {
            await notificationController.createNotificationForActivity(
              item.listing.farmer,
              'farmer',
              'financial',
              'paymentReceived',
              {
                amount: item.price * item.quantity,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                productName: item.listing.cropName,
                buyerName: populatedOrder.buyer.name,
                actionUrl: `/dashboard/orders/${order._id}`
              }
            )
          }
        }

        await notificationController.notifyAdmins(
          'farmer',
          'paymentCompleted',
          {
            amount: order.total,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            buyerName: populatedOrder.buyer.name,
            actionUrl: `/admin/orders/${order._id}`
          }
        )

        console.log('✅ Payment notifications sent successfully')
      } catch (notificationError) {
        console.error('❌ Payment notification failed:', notificationError)
        // Don't fail the verification because of notification errors
      }
    }

    return res.json({
      status: 'success',
      data: {
        transaction: transaction,
        order: updatedOrder,
        verification: verificationData
      }
    })
  } catch (error) {
    console.error('❌ Payment verification error:', error)
    return res.status(500).json({ status: 'error', message: 'Payment verification failed' })
  }
}

exports.createCommissions = async (order) => {
  console.log('===== ENHANCED COMMISSION CREATION =====');
  console.log('Processing commissions for order:', order._id);
  
  try {
    // First try using the real-time commission service
    const serviceResult = await realTimeCommissionService.processOrderCommissions(order);
    console.log('✅ Real-time commission service result:', {
      success: serviceResult.success,
      processedItems: serviceResult.processedItems,
      totalCommission: serviceResult.totalCommission
    });
    
    // If service failed or processed no items, fall back to original implementation
    if (!serviceResult.success || serviceResult.processedItems === 0) {
      console.log('⚠️ Falling back to original commission creation logic');
      
      // Original implementation (without exports declaration)
console.log('==== START COMMISSION CALCULATION FOR ORDER:', order._id, '====');
  try {
    console.log('🔄 Starting commission calculation for order:', order._id)

    const Referral = require('../models/referral.model')
    const User = require('../models/user.model')
    const Partner = require('../models/partner.model')
    const Listing = require('../models/listing.model')

    for (const item of order.items) {
      const listing = await Listing.findById(item.listing)
      if (!listing) {
        console.log('⚠️ Listing not found for item:', item.listing)
        continue
      }

      const farmer = await User.findById(listing.farmer).populate('partner')
      if (!farmer) {
        console.log('⚠️ Farmer not found for listing:', listing._id)
        continue
      }

      const itemAmount = item.price * item.quantity
      console.log('💰 Processing commission for item:', {
        listingId: listing._id,
        farmerId: farmer._id,
        itemAmount: itemAmount
      })

      // Always deduct 3% platform fee (this goes to the platform)
      const platformFeeRate = parseFloat(process.env.PLATFORM_FEE_RATE) || 0.03
      const platformFee = itemAmount * platformFeeRate

      console.log('🏢 Platform fee calculated:', {
        rate: platformFeeRate,
        amount: platformFee
      })

      // Check if farmer is referred (via Referral model)
      const referral = await Referral.findOne({
        farmer: farmer._id,
        status: { $in: ['active', 'completed'] },
        expiresAt: { $gt: new Date() }
      }).populate('partner')

      let partnerCommission = 0
      let partner = null
      let commissionType = 'none'
      let commissionRate = 0

      if (referral && referral.partner) {
        // Farmer is referred - 2% commission to referring partner
        partner = referral.partner
        commissionRate = referral.commissionRate || 0.02
        partnerCommission = itemAmount * commissionRate
        commissionType = 'referral'

        console.log('👥 Referral commission calculated:', {
          partnerId: partner._id,
          referralId: referral._id,
          rate: commissionRate,
          amount: partnerCommission
        })
      } else if (farmer.partner) {
        console.log('🔍 DIRECT PARTNER FOUND:', {
          farmerId: farmer._id,
          farmerName: farmer.name,
          partnerId: farmer.partner._id || farmer.partner
        });
        // Farmer is directly under a partner - 2% commission to partner
        partner = farmer.partner // Already populated
        if (partner) {
          commissionRate = partner.commissionRate || 0.02
          partnerCommission = itemAmount * commissionRate
          commissionType = 'direct'

          console.log('🤝 Direct partner commission calculated:', {
            partnerId: partner._id,
            rate: commissionRate,
            amount: partnerCommission
          })
        }
      }

      // Create commission record if there's a partner commission
      if (partner && partnerCommission > 0) {
        // Check if commission already exists to prevent duplicates
        const existingCommission = await Commission.findOne({
          partner: partner._id,
          farmer: farmer._id,
          order: order._id,
          listing: listing._id
        });

        if (existingCommission) {
          console.log('ℹ️ Commission already exists for this order item:', existingCommission._id);
        } else {
          const commission = new Commission({
            partner: partner._id,
            farmer: farmer._id,
            order: order._id,
            listing: listing._id,
            amount: partnerCommission,
            rate: commissionRate,
            orderAmount: itemAmount,
            orderDate: order.createdAt,
            status: 'pending',
            metadata: {
              commissionType: commissionType,
              platformFee: platformFee,
              platformFeeRate: platformFeeRate,
              referralId: referral?._id
            }
          });

          await commission.save();
          console.log('✅ Commission record created:', commission._id);

          // Update partner's total commissions
          try {
            await Partner.findByIdAndUpdate(
              partner._id, 
              { $inc: { totalCommissions: partnerCommission } }
            );
            console.log('✅ Partner totalCommissions updated by:', partnerCommission);
          } catch (updateError) {
            console.error('❌ Failed to update partner totalCommissions:', updateError);
            // Attempt again with a manual update
            try {
              const partnerDoc = await Partner.findById(partner._id);
              if (partnerDoc) {
                partnerDoc.totalCommissions = (partnerDoc.totalCommissions || 0) + partnerCommission;
                await partnerDoc.save();
                console.log('✅ Partner totalCommissions updated manually:', partnerDoc.totalCommissions);
              }
            } catch (retryError) {
              console.error('❌ Final attempt to update partner failed:', retryError);
            }
          }
          console.log('✅ Partner total commissions updated:', partner._id);
        }

        // Notify partner about commission earned
        try {
          const partnerUser = await User.findOne({ email: partner.email })
          if (partnerUser) {
            await notificationController.createNotificationForActivity(
              partnerUser._id,
              'partner',
              'commission',
              'earned',
              {
                amount: partnerCommission,
                farmerName: farmer.name,
                productName: listing.cropName,
                actionUrl: `/dashboard/commissions`
              }
            )
            console.log('✅ Partner commission notification sent:', partnerUser._id)
          }
        } catch (notificationError) {
          console.error('❌ Partner commission notification failed:', notificationError)
          // Don't fail the payment process because of notification errors
        }
      } else {
        console.log('ℹ️ No partner commission for this farmer')
      }

      // Log platform fee (this would typically go to platform revenue)
      console.log('💰 Platform fee summary:', {
        orderId: order._id,
        itemAmount: itemAmount,
        platformFee: platformFee,
        partnerCommission: partnerCommission,
        totalDeductions: platformFee + partnerCommission,
        farmerReceives: itemAmount - platformFee - partnerCommission
      })
    }

    console.log('✅ Commission calculation completed for order:', order._id)
    console.log('==== END COMMISSION CALCULATION ====');
  } catch (error) {
    console.error('❌ Error creating commissions:', error)
    // Don't throw error to avoid breaking payment flow
  }
}
    
    return true;
  } catch (error) {
    console.error('❌ Error in enhanced commission creation:', error);
    // Don't throw error to avoid breaking payment flow
    return false;
  }
};



exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params
    const { reason, amount } = req.body

    const currentUserId = (req.user?.id || req.user?._id)?.toString?.()
    const currentRole = req.user?.role

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    if (currentRole !== 'admin' && order.buyer?.toString?.() !== currentUserId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ status: 'error', message: 'Order is not paid' })
    }

    if (order.paymentStatus === 'refunded' || order.status === 'refunded') {
      return res.status(400).json({ status: 'error', message: 'Order is already refunded' })
    }

    const refundAmount = amount != null ? Number(amount) : order.total
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid refund amount' })
    }
    if (refundAmount > order.total) {
      return res.status(400).json({ status: 'error', message: 'Refund amount cannot exceed order total' })
    }

    // Find the original completed payment so we know which provider/reference to refund
    const originalPayment = await Transaction.findOne({
      orderId,
      type: 'payment',
      status: 'completed'
    }).sort({ createdAt: -1 })

    if (!originalPayment) {
      return res.status(400).json({ status: 'error', message: 'No completed payment found for this order' })
    }

    const provider = originalPayment.paymentProvider || 'paystack'

    let providerResult
    if (provider === 'paystack') {
      const paystackUtil = new PaystackUtil()
      providerResult = await paystackUtil.refundTransaction(originalPayment.reference, refundAmount)
    } else if (provider === 'flutterwave') {
      const providerTransactionId = originalPayment.metadata?.verification?.providerTransactionId
      if (!providerTransactionId) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot refund: missing Flutterwave transaction id on the original payment'
        })
      }
      const flutterwaveUtil = new FlutterwaveUtil()
      providerResult = await flutterwaveUtil.refundTransaction(providerTransactionId, refundAmount)
    } else {
      return res.status(400).json({ status: 'error', message: `Unsupported payment provider: ${provider}` })
    }

    if (!providerResult.success) {
      return res.status(502).json({
        status: 'error',
        message: 'Refund failed at payment provider: ' + providerResult.message
      })
    }

    // Only mark refunded once the provider has actually confirmed the refund
    const refundTransaction = new Transaction({
      type: 'refund',
      status: 'completed',
      amount: refundAmount,
      currency: 'NGN',
      reference: `REFUND_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      description: `Refund for order ${orderId}: ${reason || 'no reason given'}`,
      userId: order.buyer,
      orderId: orderId,
      paymentProvider: provider,
      processedAt: new Date(),
      metadata: {
        reason: reason,
        originalOrderId: orderId,
        originalTransactionId: originalPayment._id,
        providerResponse: providerResult.data
      }
    })

    await refundTransaction.save()

    order.status = 'refunded'
    order.paymentStatus = 'refunded'
    await order.save()

    return res.json({
      status: 'success',
      data: {
        refund: refundTransaction,
        message: 'Refund processed successfully'
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const { page = 1, limit = 20, type, status } = req.query

    let query = {}

    if (userRole === 'farmer') {
      // For farmers, show transactions where they are the seller
      // First, get all orders where farmer is seller
      const farmerOrders = await require('../models/order.model').find({ seller: userId }).select('_id')
      const orderIds = farmerOrders.map(order => order._id)

      // Also get all listings where farmer is the owner
      const farmerListings = await require('../models/listing.model').find({ farmer: userId }).select('_id')
      const listingIds = farmerListings.map(listing => listing._id)

      query = {
        $or: [
          { orderId: { $in: orderIds } }, // Transactions for orders where farmer is seller
          { listingId: { $in: listingIds } } // Transactions for listings where farmer is owner
        ]
      }
    } else {
      // For buyers, show their own transactions
      query = { userId: userId }
    }

    if (type) query.type = type
    if (status) query.status = status

    const transactions = await Transaction.find(query)
      .populate('orderId', 'total status buyer seller')
      .populate('listingId', 'cropName farmer')
      .populate('userId', 'name email') // Buyer info
      .populate('listingId.farmer', 'name email') // Farmer info
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Transaction.countDocuments(query)

    return res.json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Transaction history error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}



exports.webhookVerify = async (req, res) => {
  let webhookLockToken = null
  let webhookReference = null
  try {
    const allowInsecureWebhook =
      process.env.ALLOW_INSECURE_WEBHOOK === 'true' && process.env.NODE_ENV !== 'production'

    if (!allowInsecureWebhook) {
      const signature = req.headers['x-paystack-signature']
      if (!signature) {
        return res.status(401).json({ status: 'error', message: 'Missing signature' })
      }

      const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
      if (!secret) {
        return res.status(500).json({ status: 'error', message: 'Webhook secret not configured' })
      }

      const payload = JSON.stringify(req.body)
      const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex')
      const expectedBuf = Buffer.from(expected, 'hex')
      const signatureBuf = Buffer.from(String(signature), 'hex')
      const signatureValid =
        expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf)
      if (!signatureValid) {
        return res.status(401).json({ status: 'error', message: 'Invalid signature' })
      }
    }

    const event = req.body?.event
    const data = req.body?.data
    if (!event || !data) {
      console.log('❌ Webhook: Invalid payload received', { event, hasData: !!data })
      return res.status(400).json({ status: 'error', message: 'Invalid payload' })
    }

    console.log('🔗 Paystack Webhook Received:', {
      event,
      reference: data.reference,
      amount: data.amount,
      status: data.status,
      timestamp: new Date().toISOString()
    })

    // Use reference to find transaction
    const reference = data.reference
    webhookReference = reference

    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'Missing payment reference' })
    }

    const now = new Date()
    webhookLockToken = crypto.randomBytes(16).toString('hex')

    // Acquire atomic processing lock for this reference.
    // Only one webhook worker can process non-completed transaction side effects.
    let tx = await Transaction.findOneAndUpdate(
      {
        reference,
        status: { $ne: 'completed' },
        $or: [
          { 'metadata.webhookLock.status': { $exists: false } },
          { 'metadata.webhookLock.status': { $ne: 'processing' } },
          { 'metadata.webhookLock.expiresAt': { $lt: now } }
        ]
      },
      {
        $set: {
          'metadata.webhookLock': {
            status: 'processing',
            token: webhookLockToken,
            event,
            startedAt: now,
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000) // 5-minute lock timeout
          }
        }
      },
      { new: true }
    )

    if (!tx) {
      const existingTx = await Transaction.findOne({ reference })
      if (!existingTx) {
        console.log('ℹ️ Webhook: Transaction not found for reference, ignoring')
        return res.json({ status: 'success', message: 'Reference not recognized' })
      }

      if (existingTx.status === 'completed') {
        console.log('✅ Webhook: Transaction already processed')
        return res.json({ status: 'success', message: 'Already processed' })
      }

      console.log('ℹ️ Webhook: Transaction is already being processed by another worker')
      return res.json({ status: 'success', message: 'Processing in progress' })
    }

    if (event === 'charge.success') {
      console.log('💰 Webhook: Processing successful charge')

      try {
        // Verify with Paystack API to double-check
        console.log('🔍 Double-checking with Paystack API...')
        const paystackVerification = await verifyWithPaystackAPI(data.reference)
        
        if (!paystackVerification.success || !paystackVerification.paid) {
          console.log('❌ Paystack verification failed for webhook, skipping update')
          // Release the lock immediately rather than leaving it stuck for its full
          // timeout — a future delivery (or manual verify) should be able to retry right away.
          await Transaction.findOneAndUpdate(
            { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
            {
              $set: {
                'metadata.webhookLock.status': 'failed',
                'metadata.webhookLock.failedAt': new Date(),
                'metadata.webhookLock.error': 'Provider verification did not confirm payment'
              }
            }
          )
          return res.json({ status: 'success', message: 'Webhook received but payment not verified' })
        }

        console.log('✅ Paystack verification confirmed, updating transaction')

        // Transaction + order status + inventory decrement must all succeed or all
        // roll back together — otherwise an order can end up marked "paid" while
        // stock was never actually decremented (or vice versa).
        const session = await mongoose.startSession()
        session.startTransaction()

        let order = null
        let wasJustPaid = false

        try {
          tx.status = 'completed'
          tx.paymentProviderReference = data.reference
          tx.processedAt = new Date()
          tx.metadata = {
            ...tx.metadata,
            webhook: data,
            webhookProcessedAt: new Date(),
            webhookEvent: event,
            paystackVerification: paystackVerification
          }
          tx.markModified('metadata')
          await tx.save({ session })
          console.log('✅ Transaction updated to completed')

          if (tx.orderId) {
            order = await Order.findById(tx.orderId).session(session)
            if (order) {
              console.log('📦 Webhook: Updating order status', {
                orderId: tx.orderId,
                currentStatus: order.status,
                currentPaymentStatus: order.paymentStatus
              })

              // Track whether the order was pending before we attempted to update it.
              // This lets us detect the transition (pending -> paid) caused by this webhook
              // and only run commission creation / notifications once.
              const wasPendingBeforeUpdate = order.status !== 'confirmed' && order.status !== 'paid'

              if (wasPendingBeforeUpdate) {
                order.status = 'confirmed'
                order.paymentStatus = 'paid'
                order.paymentReference = data.reference
                await order.save({ session })
                console.log('✅ Order status updated to confirmed')

                // Update inventory for each item in the order
                console.log('📦 Webhook: Updating inventory for paid order...')
                const Listing = require('../models/listing.model')
                const populatedOrder = await Order.findById(order._id)
                  .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
                  .session(session)

                for (const item of populatedOrder.items) {
                  if (!item.listing) continue
                  const listing = item.listing

                  if (listing.availableQuantity < item.quantity) {
                    console.error('❌ Webhook: Insufficient stock for item:', {
                      listingId: listing._id,
                      cropName: listing.cropName,
                      availableQuantity: listing.availableQuantity,
                      orderedQuantity: item.quantity
                    })
                    continue // Payment already captured by the provider — don't block the order over a stock discrepancy
                  }

                  const newAvailableQuantity = listing.availableQuantity - item.quantity

                  const updatedListing = await Listing.findByIdAndUpdate(
                    listing._id,
                    {
                      $inc: { availableQuantity: -item.quantity },
                      $set: {
                        status: newAvailableQuantity <= 0 ? 'sold_out' : listing.status,
                        soldOutAt: newAvailableQuantity <= 0 ? new Date() : null,
                        updatedAt: new Date()
                      }
                    },
                    { new: true, runValidators: true, session }
                  )

                  console.log('✅ Webhook: Inventory updated:', {
                    listingId: listing._id,
                    cropName: updatedListing?.cropName,
                    finalAvailableQuantity: updatedListing?.availableQuantity
                  })
                }
              } else {
                console.log('ℹ️ Order was already confirmed/paid, skipping update')
              }

              wasJustPaid = wasPendingBeforeUpdate && order.paymentStatus === 'paid'
            }
          }

          await session.commitTransaction()
        } catch (txError) {
          console.error('❌ Webhook: transaction failed, rolling back:', txError)
          await session.abortTransaction()
          session.endSession()

          // Bypass the outer "don't fail the webhook" catch — this is a real failure
          // that needs the lock released as failed so Paystack retries the delivery.
          if (webhookReference && webhookLockToken) {
            try {
              await Transaction.findOneAndUpdate(
                { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
                {
                  $set: {
                    'metadata.webhookLock.status': 'failed',
                    'metadata.webhookLock.failedAt': new Date(),
                    'metadata.webhookLock.error': txError.message
                  }
                }
              )
            } catch (lockError) {
              console.error('❌ Failed to update webhook lock failure state:', lockError)
            }
          }
          return res.status(500).json({ status: 'error', message: 'Webhook processing failed' })
        }
        session.endSession()

        if (!order) {
          console.log('❌ Webhook: Order not found for transaction')
        } else {

            // Create commissions with real-time updates (only if order was just paid)
            if (wasJustPaid) {
              try {
                console.log('🔄 Processing real-time commissions for webhook order:', order._id);
                
                // Populate the order with items and listings before creating commissions
                const populatedOrder = await Order.findById(order._id)
                  .populate('items.listing')
                  .populate('buyer', 'name email');
                
                if (populatedOrder) {
                  // Use the real-time commission service
                  const commissionResult = await realTimeCommissionService.processOrderCommissions(populatedOrder);
                  
                  if (commissionResult.success) {
                    console.log('✅ Real-time commissions processed successfully:', {
                      processedItems: commissionResult.processedItems,
                      totalCommission: commissionResult.totalCommission
                    });
                  } else {
                    console.error('❌ Real-time commission processing failed:', commissionResult.error);
                    
                    // Fallback to original commission creation
                    console.log('🔄 Falling back to original commission creation');
                    await exports.createCommissions(populatedOrder);
                  }
                } else {
                  console.log('❌ Webhook: Could not populate order for commission creation');
                }
                
                console.log('✅ Commissions created successfully')
              } catch (commissionError) {
                console.error('❌ Commission creation failed:', commissionError)
                // Don't fail the webhook because of commission errors
              }
            }

            // Send notifications for successful payment (only if order was just paid)
            if (wasJustPaid) {
              try {
              // Notify buyer about successful payment
              await notificationController.createNotificationForActivity(
                order.buyer._id,
                'buyer',
                'financial',
                'paymentCompleted',
                {
                  amount: order.total,
                  orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                  actionUrl: `/dashboard/orders/${order._id}`
                }
              )

              // Notify farmers about payment received
              const populatedOrder = await Order.findById(order._id)
                .populate('items.listing', 'farmer cropName')
                .populate('buyer', 'name')

              for (const item of populatedOrder.items) {
                if (item.listing && item.listing.farmer) {
                  await notificationController.createNotificationForActivity(
                    item.listing.farmer,
                    'farmer',
                    'financial',
                    'paymentReceived',
                    {
                      amount: item.price * item.quantity,
                      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                      productName: item.listing.cropName,
                      buyerName: populatedOrder.buyer.name,
                      actionUrl: `/dashboard/orders/${order._id}`
                    }
                  )
                }
              }

              // Notify admins about payment completion
              await notificationController.notifyAdmins(
                'farmer',
                'paymentCompleted',
                {
                  amount: order.total,
                  orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                  buyerName: populatedOrder.buyer.name,
                  actionUrl: `/admin/orders/${order._id}`
                }
              )

                console.log('✅ Payment notifications sent successfully')
              } catch (notificationError) {
                console.error('❌ Payment notification failed:', notificationError)
                // Don't fail the webhook because of notification errors
              }
            }
          }
      } catch (processingError) {
        console.error('❌ Webhook processing error:', processingError)
        // Log the error but don't fail the webhook response
      }
    } else {
      console.log('ℹ️ Webhook: Event type not charge.success:', event)
    }

    console.log('✅ Webhook processing completed')
    // Mark lock completed for traceability
    if (webhookReference && webhookLockToken) {
      await Transaction.findOneAndUpdate(
        { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
        {
          $set: {
            'metadata.webhookLock.status': 'completed',
            'metadata.webhookLock.completedAt': new Date()
          }
        }
      )
    }

    return res.json({ status: 'success', message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)

    // Release lock as failed so a new delivery can retry safely
    if (webhookReference && webhookLockToken) {
      try {
        await Transaction.findOneAndUpdate(
          { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': error.message
            }
          }
        )
      } catch (lockError) {
        console.error('❌ Failed to update webhook lock failure state:', lockError)
      }
    }

    return res.status(500).json({ status: 'error', message: 'Webhook processing failed' })
  }
}

exports.webhookVerifyFlutterwave = async (req, res) => {
  let webhookLockToken = null
  let webhookReference = null
  try {
    const allowInsecureWebhook =
      process.env.ALLOW_INSECURE_WEBHOOK === 'true' && process.env.NODE_ENV !== 'production'

    if (!allowInsecureWebhook) {
      const verifHash = req.headers['verif-hash']
      if (!verifHash) {
        return res.status(401).json({ status: 'error', message: 'Missing signature' })
      }
      const flutterwaveUtil = new FlutterwaveUtil()
      if (!flutterwaveUtil.verifyWebhookSignature(verifHash)) {
        return res.status(401).json({ status: 'error', message: 'Invalid signature' })
      }
    }

    const event = req.body?.event
    const data = req.body?.data
    if (!event || !data) {
      console.log('❌ Flutterwave webhook: Invalid payload received', { event, hasData: !!data })
      return res.status(400).json({ status: 'error', message: 'Invalid payload' })
    }

    console.log('🔗 Flutterwave Webhook Received:', {
      event,
      reference: data.tx_ref,
      amount: data.amount,
      status: data.status,
      timestamp: new Date().toISOString()
    })

    // Flutterwave uses "tx_ref" for what we call reference, and reports both
    // success/failure under the same "charge.completed" event, differentiated by data.status.
    const reference = data.tx_ref
    webhookReference = reference

    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'Missing payment reference' })
    }

    const now = new Date()
    webhookLockToken = crypto.randomBytes(16).toString('hex')

    let tx = await Transaction.findOneAndUpdate(
      {
        reference,
        status: { $ne: 'completed' },
        $or: [
          { 'metadata.webhookLock.status': { $exists: false } },
          { 'metadata.webhookLock.status': { $ne: 'processing' } },
          { 'metadata.webhookLock.expiresAt': { $lt: now } }
        ]
      },
      {
        $set: {
          'metadata.webhookLock': {
            status: 'processing',
            token: webhookLockToken,
            event,
            startedAt: now,
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
          }
        }
      },
      { new: true }
    )

    if (!tx) {
      const existingTx = await Transaction.findOne({ reference })
      if (!existingTx) {
        console.log('ℹ️ Flutterwave webhook: Transaction not found for reference, ignoring')
        return res.json({ status: 'success', message: 'Reference not recognized' })
      }
      if (existingTx.status === 'completed') {
        console.log('✅ Flutterwave webhook: Transaction already processed')
        return res.json({ status: 'success', message: 'Already processed' })
      }
      console.log('ℹ️ Flutterwave webhook: Transaction is already being processed by another worker')
      return res.json({ status: 'success', message: 'Processing in progress' })
    }

    if (event === 'charge.completed' && data.status === 'successful') {
      console.log('💰 Flutterwave webhook: Processing successful charge')

      try {
        console.log('🔍 Double-checking with Flutterwave API...')
        const flutterwaveVerification = await verifyWithFlutterwaveAPI(reference)

        if (!flutterwaveVerification.success || !flutterwaveVerification.paid) {
          console.log('❌ Flutterwave verification failed for webhook, skipping update')
          await Transaction.findOneAndUpdate(
            { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
            {
              $set: {
                'metadata.webhookLock.status': 'failed',
                'metadata.webhookLock.failedAt': new Date(),
                'metadata.webhookLock.error': 'Provider verification did not confirm payment'
              }
            }
          )
          return res.json({ status: 'success', message: 'Webhook received but payment not verified' })
        }

        console.log('✅ Flutterwave verification confirmed, updating transaction')

        const session = await mongoose.startSession()
        session.startTransaction()

        let order = null
        let wasJustPaid = false

        try {
          tx.status = 'completed'
          tx.paymentProviderReference = reference
          tx.processedAt = new Date()
          tx.metadata = {
            ...tx.metadata,
            webhook: data,
            webhookProcessedAt: new Date(),
            webhookEvent: event,
            flutterwaveVerification: flutterwaveVerification,
            providerTransactionId: flutterwaveVerification.providerTransactionId
          }
          tx.markModified('metadata')
          await tx.save({ session })
          console.log('✅ Transaction updated to completed')

          if (tx.orderId) {
            order = await Order.findById(tx.orderId).session(session)
            if (order) {
              const wasPendingBeforeUpdate = order.status !== 'confirmed' && order.status !== 'paid'

              if (wasPendingBeforeUpdate) {
                order.status = 'confirmed'
                order.paymentStatus = 'paid'
                order.paymentReference = reference
                await order.save({ session })
                console.log('✅ Order status updated to confirmed')

                console.log('📦 Flutterwave webhook: Updating inventory for paid order...')
                const Listing = require('../models/listing.model')
                const populatedOrder = await Order.findById(order._id)
                  .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
                  .session(session)

                for (const item of populatedOrder.items) {
                  if (!item.listing) continue
                  const listing = item.listing

                  if (listing.availableQuantity < item.quantity) {
                    console.error('❌ Flutterwave webhook: Insufficient stock for item:', {
                      listingId: listing._id,
                      cropName: listing.cropName,
                      availableQuantity: listing.availableQuantity,
                      orderedQuantity: item.quantity
                    })
                    continue
                  }

                  const newAvailableQuantity = listing.availableQuantity - item.quantity

                  const updatedListing = await Listing.findByIdAndUpdate(
                    listing._id,
                    {
                      $inc: { availableQuantity: -item.quantity },
                      $set: {
                        status: newAvailableQuantity <= 0 ? 'sold_out' : listing.status,
                        soldOutAt: newAvailableQuantity <= 0 ? new Date() : null,
                        updatedAt: new Date()
                      }
                    },
                    { new: true, runValidators: true, session }
                  )

                  console.log('✅ Flutterwave webhook: Inventory updated:', {
                    listingId: listing._id,
                    cropName: updatedListing?.cropName,
                    finalAvailableQuantity: updatedListing?.availableQuantity
                  })
                }
              } else {
                console.log('ℹ️ Order was already confirmed/paid, skipping update')
              }

              wasJustPaid = wasPendingBeforeUpdate && order.paymentStatus === 'paid'
            }
          }

          await session.commitTransaction()
        } catch (txError) {
          console.error('❌ Flutterwave webhook: transaction failed, rolling back:', txError)
          await session.abortTransaction()
          session.endSession()

          if (webhookReference && webhookLockToken) {
            try {
              await Transaction.findOneAndUpdate(
                { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
                {
                  $set: {
                    'metadata.webhookLock.status': 'failed',
                    'metadata.webhookLock.failedAt': new Date(),
                    'metadata.webhookLock.error': txError.message
                  }
                }
              )
            } catch (lockError) {
              console.error('❌ Failed to update webhook lock failure state:', lockError)
            }
          }
          return res.status(500).json({ status: 'error', message: 'Webhook processing failed' })
        }
        session.endSession()

        if (order && wasJustPaid) {
          try {
            console.log('🔄 Processing real-time commissions for Flutterwave webhook order:', order._id);
            const populatedOrder = await Order.findById(order._id)
              .populate('items.listing')
              .populate('buyer', 'name email');

            if (populatedOrder) {
              const commissionResult = await realTimeCommissionService.processOrderCommissions(populatedOrder);
              if (!commissionResult.success) {
                console.error('❌ Real-time commission processing failed:', commissionResult.error);
                await exports.createCommissions(populatedOrder);
              }
            }
          } catch (commissionError) {
            console.error('❌ Commission creation failed:', commissionError)
          }

          try {
            await notificationController.createNotificationForActivity(
              order.buyer._id,
              'buyer',
              'financial',
              'paymentCompleted',
              {
                amount: order.total,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                actionUrl: `/dashboard/orders/${order._id}`
              }
            )

            const populatedOrder = await Order.findById(order._id)
              .populate('items.listing', 'farmer cropName')
              .populate('buyer', 'name')

            for (const item of populatedOrder.items) {
              if (item.listing && item.listing.farmer) {
                await notificationController.createNotificationForActivity(
                  item.listing.farmer,
                  'farmer',
                  'financial',
                  'paymentReceived',
                  {
                    amount: item.price * item.quantity,
                    orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                    productName: item.listing.cropName,
                    buyerName: populatedOrder.buyer.name,
                    actionUrl: `/dashboard/orders/${order._id}`
                  }
                )
              }
            }

            await notificationController.notifyAdmins(
              'farmer',
              'paymentCompleted',
              {
                amount: order.total,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                buyerName: populatedOrder.buyer.name,
                actionUrl: `/admin/orders/${order._id}`
              }
            )
            console.log('✅ Payment notifications sent successfully')
          } catch (notificationError) {
            console.error('❌ Payment notification failed:', notificationError)
          }
        } else if (!order) {
          console.log('❌ Flutterwave webhook: Order not found for transaction')
        }
      } catch (processingError) {
        console.error('❌ Flutterwave webhook processing error:', processingError)
      }
    } else {
      console.log('ℹ️ Flutterwave webhook: Event/status not a successful charge:', event, data.status)
    }

    console.log('✅ Flutterwave webhook processing completed')
    if (webhookReference && webhookLockToken) {
      await Transaction.findOneAndUpdate(
        { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
        {
          $set: {
            'metadata.webhookLock.status': 'completed',
            'metadata.webhookLock.completedAt': new Date()
          }
        }
      )
    }

    return res.json({ status: 'success', message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('❌ Flutterwave webhook processing error:', error)

    if (webhookReference && webhookLockToken) {
      try {
        await Transaction.findOneAndUpdate(
          { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': error.message
            }
          }
        )
      } catch (lockError) {
        console.error('❌ Failed to update webhook lock failure state:', lockError)
      }
    }

    return res.status(500).json({ status: 'error', message: 'Webhook processing failed' })
  }
}

// Fallback method to sync order status with transaction status
exports.syncOrderStatus = async (req, res) => {
  try {
    console.log('🔄 syncOrderStatus endpoint hit')
    console.log('📋 Request params:', req.params)
    console.log('👤 Request user:', req.user?.id || 'No user')
    
    const { orderId } = req.params

    if (!orderId) {
      console.log('❌ No orderId provided')
      return res.status(400).json({ status: 'error', message: 'Order ID is required' })
    }

    console.log('🔄 Syncing order status for:', orderId)

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    const currentUserId = req.user?.id || req.user?._id
    const currentUserRole = req.user?.role
    if (
      currentUserRole !== 'admin' &&
      order.buyer?.toString?.() !== currentUserId?.toString?.()
    ) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    // Find the transaction for this order
    const transaction = await Transaction.findOne({ orderId: order._id })
    if (!transaction) {
      console.log('⚠️ No transaction found for order:', orderId)
      return res.json({
        status: 'success',
        message: 'No transaction found, order status unchanged',
        order: {
          id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      })
    }

    console.log('💳 Found transaction:', {
      id: transaction._id,
      reference: transaction.reference,
      status: transaction.status
    })

    // If transaction is completed but order is not confirmed, fix it
    if (transaction.status === 'completed' && order.status !== 'confirmed' && order.status !== 'paid') {
      console.log('🔧 Fixing order status mismatch')

      const oldStatus = order.status
      const oldPaymentStatus = order.paymentStatus

      order.status = 'confirmed'
      order.paymentStatus = 'paid'
      order.paymentReference = transaction.reference
      await order.save()

      console.log('✅ Order status synchronized')

      return res.json({
        status: 'success',
        message: 'Order status synchronized',
        changes: {
          status: `${oldStatus} → ${order.status}`,
          paymentStatus: `${oldPaymentStatus} → ${order.paymentStatus}`,
          paymentReference: order.paymentReference
        }
      })
    } else {
      console.log('ℹ️ Order status already synchronized')
      return res.json({
        status: 'success',
        message: 'Order status already synchronized',
        order: {
          id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentReference: order.paymentReference
        }
      })
    }

  } catch (error) {
    console.error('❌ Order sync error:', error)
    return res.status(500).json({ status: 'error', message: 'Order synchronization failed' })
  }
}

// Bulk sync method to fix multiple orders
exports.bulkSyncOrders = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Admin access required' })
    }

    console.log('🔄 Starting bulk order synchronization...')

    // Find all orders with pending status
    const pendingOrders = await Order.find({
      $or: [
        { status: 'pending' },
        { paymentStatus: 'pending' }
      ]
    }).limit(100) // Limit to prevent timeout

    console.log(`📦 Found ${pendingOrders.length} pending orders to check`)

    let fixedCount = 0
    let alreadySyncedCount = 0
    const results = []

    for (const order of pendingOrders) {
      try {
        // Find transaction for this order
        const transaction = await Transaction.findOne({
          orderId: order._id,
          status: 'completed'
        })

        if (transaction && order.status !== 'confirmed' && order.status !== 'paid') {
          // Fix the order
          order.status = 'confirmed'
          order.paymentStatus = 'paid'
          order.paymentReference = transaction.reference
          await order.save()

          results.push({
            orderId: order._id,
            fixed: true,
            changes: `pending → paid`
          })

          fixedCount++
        } else if (transaction && order.status === 'paid') {
          alreadySyncedCount++
        }
      } catch (orderError) {
        console.error(`❌ Error processing order ${order._id}:`, orderError)
        results.push({
          orderId: order._id,
          error: orderError.message
        })
      }
    }

    console.log('✅ Bulk synchronization completed')

    return res.json({
      status: 'success',
      message: 'Bulk synchronization completed',
      summary: {
        totalChecked: pendingOrders.length,
        fixed: fixedCount,
        alreadySynced: alreadySyncedCount,
        errors: results.filter(r => r.error).length
      },
      results: results.slice(0, 10) // Return first 10 results
    })

  } catch (error) {
    console.error('❌ Bulk sync error:', error)
    return res.status(500).json({ status: 'error', message: 'Bulk synchronization failed' })
  }
}

// Helper function to initialize payment with Paystack API
async function initializePaystackPayment(paymentData) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const postData = JSON.stringify(paymentData)

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => data += chunk)

      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('📊 Paystack Initialize Response:', response)
          
          if (response.status && response.data) {
            resolve({
              success: true,
              authorization_url: response.data.authorization_url,
              access_code: response.data.access_code,
              reference: response.data.reference
            })
          } else {
            resolve({
              success: false,
              error: response.message || 'Payment initialization failed'
            })
          }
        } catch (error) {
          console.error('❌ Paystack initialization response parsing error:', error)
          resolve({
            success: false,
            error: 'Invalid response from Paystack'
          })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Paystack initialization request error:', error)
      resolve({
        success: false,
        error: error.message
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Paystack API timeout'
      })
    })

    req.write(postData)
    req.end()
  })
}

// Helper function to verify payment with Paystack API
async function verifyWithPaystackAPI(reference) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => data += chunk)

      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('📊 Paystack API Response:', response)
          
          if (response.status && response.data) {
            resolve({
              success: true,
              paid: response.data.status === 'success',
              status: response.data.status,
              amount: response.data.amount,
              reference: response.data.reference,
              channel: response.data.channel,
              customer: response.data.customer,
              paid_at: response.data.paid_at
            })
          } else {
            resolve({
              success: false,
              error: response.message || 'Verification failed'
            })
          }
        } catch (error) {
          console.error('❌ Paystack API response parsing error:', error)
          resolve({
            success: false,
            error: 'Invalid response from Paystack'
          })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Paystack API request error:', error)
      resolve({
        success: false,
        error: error.message
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Paystack API timeout'
      })
    })

    req.end()
  })
}

// Helper function to verify payment with Flutterwave API
async function verifyWithFlutterwaveAPI(reference) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.flutterwave.com',
      port: 443,
      // Verify by OUR reference (tx_ref), not Flutterwave's internal numeric id —
      // we never receive/store that id, so /v3/transactions/{id}/verify can't be used here.
      path: `/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => data += chunk)

      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('📊 Flutterwave API Response:', response)

          if (response.status === 'success' && response.data) {
            resolve({
              success: true,
              paid: response.data.status === 'successful',
              status: response.data.status,
              amount: response.data.amount,
              reference: response.data.tx_ref,
              providerTransactionId: response.data.id,
              channel: response.data.payment_type,
              customer: response.data.customer,
              paid_at: response.data.created_at
            })
          } else {
            resolve({
              success: false,
              error: response.message || 'Verification failed'
            })
          }
        } catch (error) {
          console.error('❌ Flutterwave API response parsing error:', error)
          resolve({
            success: false,
            error: 'Invalid response from Flutterwave'
          })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Flutterwave API request error:', error)
      resolve({
        success: false,
        error: error.message
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Flutterwave API timeout'
      })
    })

    req.end()
  })
}

// Payment Methods Management
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get payment methods from database
    const paymentMethods = await PaymentMethod.findByUser(userId)
    
    res.status(200).json({
      status: 'success',
      message: 'Payment methods retrieved successfully',
      data: paymentMethods
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment methods',
      error: error.message
    })
  }
}

exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id
    const { type, details } = req.body
    
    // Validate required fields
    if (!type || !details) {
      return res.status(400).json({
        status: 'error',
        message: 'Type and details are required'
      })
    }
    
    // Create payment method name based on type
    let name = ''
    if (type === 'card') {
      name = `${details.brand || 'Card'} ending in ${details.last4}`
    } else if (type === 'bank_account') {
      name = `${details.bankName} Account`
    } else if (type === 'mobile_money') {
      name = `${details.provider} Mobile Money`
    } else {
      name = `${type.charAt(0).toUpperCase() + type.slice(1)} Payment`
    }
    
    // Create new payment method
    const paymentMethod = new PaymentMethod({
      user: userId,
      name,
      type,
      details,
      isVerified: false, // Will be verified through payment provider
      status: 'active'
    })
    
    await paymentMethod.save()
    
    res.status(201).json({
      status: 'success',
      message: 'Payment method added successfully',
      data: paymentMethod
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to add payment method',
      error: error.message
    })
  }
}

exports.updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id
    const methodId = req.params.id
    const updateData = req.body
    
    // Find payment method and ensure it belongs to user
    const paymentMethod = await PaymentMethod.findOne({ _id: methodId, user: userId })
    
    if (!paymentMethod) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment method not found'
      })
    }
    
    // Update payment method
    Object.assign(paymentMethod, updateData)
    await paymentMethod.save()
    
    res.status(200).json({
      status: 'success',
      message: 'Payment method updated successfully',
      data: paymentMethod
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update payment method',
      error: error.message
    })
  }
}

exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id
    const methodId = req.params.id
    
    // Find payment method and ensure it belongs to user
    const paymentMethod = await PaymentMethod.findOne({ _id: methodId, user: userId })
    
    if (!paymentMethod) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment method not found'
      })
    }
    
    // Soft delete by setting status to inactive
    paymentMethod.status = 'inactive'
    await paymentMethod.save()
    
    res.status(200).json({
      status: 'success',
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete payment method',
      error: error.message
    })
  }
}

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id
    const methodId = req.params.id
    
    // Find payment method and ensure it belongs to user
    const paymentMethod = await PaymentMethod.findOne({ _id: methodId, user: userId })
    
    if (!paymentMethod) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment method not found'
      })
    }
    
    // Set as default
    await paymentMethod.setAsDefault()
    
    res.status(200).json({
      status: 'success',
      message: 'Default payment method updated successfully',
      data: paymentMethod
    })
  } catch (error) {
    console.error('Error setting default payment method:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to set default payment method',
      error: error.message
    })
  }
}