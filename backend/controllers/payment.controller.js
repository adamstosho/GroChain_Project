const crypto = require('crypto')
const mongoose = require('mongoose')
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')
const Commission = require('../models/commission.model')
const PaymentMethod = require('../models/payment-method.model')
const notificationController = require('./notification.controller')
const realTimeCommissionService = require('../services/commission-realtime.service')
const PaystackUtil = require('../utils/paystack.util')
const FlutterwaveUtil = require('../utils/flutterwave.util')
const { createCommissionIdempotent } = require('../utils/commission-idempotency')
const {
  fulfillOrderInSession,
  runPostPaymentSideEffects,
  reconcileOrderFulfillment,
} = require('../utils/payment-fulfillment')

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

    // Reuse an existing pending transaction for this order+provider+amount so retries
    // (cancel popup, retry payment) don't pile up orphan pending Transaction rows.
    let transaction = await Transaction.findOne({
      orderId,
      status: 'pending',
      paymentProvider,
      amount: requestedAmount,
      type: 'payment'
    }).sort({ createdAt: -1 })

    let reference
    if (transaction) {
      reference = transaction.reference
      console.log('♻️ Reusing pending transaction for order:', orderId, reference)
      transaction.metadata = {
        ...(transaction.metadata || {}),
        orderId,
        callbackUrl,
        paymentProvider,
        reusedAt: new Date()
      }
      await transaction.save()
    } else {
      // Generate unique reference
      reference = `GROCHAIN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`

      // Create transaction record
      transaction = new Transaction({
        type: 'payment',
        status: 'pending',
        amount: requestedAmount,
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
    }
    
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

    // Test-mode side effects (inventory, commissions, order paid) run only in
    // verifyPayment / webhooks — never at init — so retries cannot double-apply.
    if (isTestMode) {
      console.log('🧪 Test mode init: transaction stays pending until verify/webhook runs side effects')
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
  let verifyLockToken = null
  let verifyReference = null
  try {
    const { reference } = req.params
    const { paymentProvider } = req.query
    const currentUserId = req.user?.id || req.user?._id
    const currentUserRole = req.user?.role
    verifyReference = reference

    console.log('🔍 Manual payment verification for reference:', reference, 'provider:', paymentProvider)

    let transaction = await Transaction.findOne({ reference: reference })
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

    // Share webhookLock with webhook handlers so concurrent verify + webhook
    // cannot both apply inventory/commission side effects.
    const now = new Date()
    verifyLockToken = crypto.randomBytes(16).toString('hex')
    const lockedTx = await Transaction.findOneAndUpdate(
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
            token: verifyLockToken,
            event: 'manual_verify',
            startedAt: now,
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
          }
        }
      },
      { new: true }
    )

    if (!lockedTx) {
      const existingTx = await Transaction.findOne({ reference })
      if (existingTx?.status === 'completed') {
        let orderData = null
        if (existingTx.orderId) {
          orderData = await Order.findById(existingTx.orderId)
            .populate('items.listing', 'cropName availableQuantity quantity status updatedAt createdAt')
        }
        return res.json({
          status: 'success',
          data: {
            transaction: existingTx,
            order: orderData,
            message: 'Payment already verified'
          }
        })
      }
      return res.status(409).json({
        status: 'error',
        message: 'Payment verification already in progress. Please try again shortly.'
      })
    }

    transaction = lockedTx

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
        await Transaction.findOneAndUpdate(
          { reference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': `Unsupported payment provider: ${provider}`
            }
          }
        )
        return res.status(400).json({ 
          status: 'error', 
          message: `Unsupported payment provider: ${provider}` 
        })
      }
      
      if (!providerVerification.success) {
        console.log(`❌ ${provider} verification failed:`, providerVerification.error)
        await Transaction.findOneAndUpdate(
          { reference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': providerVerification.error || 'Provider verification failed'
            }
          }
        )
        return res.status(400).json({ 
          status: 'error', 
          message: 'Payment verification failed: ' + providerVerification.error 
        })
      }

      if (!providerVerification.paid) {
        console.log(`❌ Payment not successful according to ${provider}`)
        await Transaction.findOneAndUpdate(
          { reference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': 'Payment was not successful'
            }
          }
        )
        return res.status(400).json({
          status: 'error',
          message: 'Payment was not successful'
        })
      }

      // Paystack/Flutterwave both allow underpayment via bank transfer/USSD channels —
      // a "success" status only means *some* amount was received, not that it matches
      // what we asked for. Without this check an order could be marked fully paid after
      // the buyer sent less than the total.
      const paidAmountNaira = provider === 'paystack'
        ? providerVerification.amount / 100
        : providerVerification.amount
      if (Math.abs(paidAmountNaira - transaction.amount) > 1) {
        console.error(`❌ Amount mismatch for ${reference}: expected ₦${transaction.amount}, ${provider} confirmed ₦${paidAmountNaira}`)
        await Transaction.findOneAndUpdate(
          { reference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': `Amount mismatch: expected ${transaction.amount}, got ${paidAmountNaira}`
            }
          }
        )
        return res.status(400).json({
          status: 'error',
          message: 'Payment verification failed: amount paid does not match the amount due'
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

    let shouldRunSideEffects = false
    let order = null

    try {
      // Update transaction status
      transaction.status = 'completed'
      transaction.paymentProviderReference = reference
      transaction.processedAt = new Date()
      transaction.metadata = transaction.metadata || {}
      transaction.metadata.verification = verificationData
      transaction.metadata.webhookLock = {
        ...(transaction.metadata.webhookLock || {}),
        status: 'completed',
        completedAt: new Date()
      }
      await transaction.save({ session })

      if (transaction.metadata?.loanApplicationId || transaction.loanApplicationId) {
        const { completeLoanRepayment } = require('../services/loan-payment.service')
        const loanResult = await completeLoanRepayment(reference, session)
        if (!loanResult.success && !loanResult.alreadyProcessed) {
          throw new Error(loanResult.error || 'Loan repayment processing failed')
        }
      } else if (transaction.orderId) {
        order = await Order.findById(transaction.orderId).session(session)

        if (order) {
          console.log('📦 Finalizing paid order:', transaction.orderId)
          const fulfillment = await fulfillOrderInSession({
            order,
            paymentReference: reference,
            session,
          })
          shouldRunSideEffects = fulfillment.needsSideEffects
        }
      }

      await session.commitTransaction()
    } catch (txError) {
      console.error('❌ Payment verification transaction failed, rolling back:', txError)
      await session.abortTransaction()
      session.endSession()
      if (verifyReference && verifyLockToken) {
        await Transaction.findOneAndUpdate(
          { reference: verifyReference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': txError.message
            }
          }
        )
      }
      return res.status(500).json({ status: 'error', message: 'Failed to finalize payment. Please try verifying again.' })
    }
    session.endSession()

    let updatedOrder = order
    if (!order) {
      console.log('⚠️ No order found for transaction')
    } else if (shouldRunSideEffects) {
      await runPostPaymentSideEffects(order)
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
    if (verifyReference && verifyLockToken) {
      try {
        await Transaction.findOneAndUpdate(
          { reference: verifyReference, 'metadata.webhookLock.token': verifyLockToken },
          {
            $set: {
              'metadata.webhookLock.status': 'failed',
              'metadata.webhookLock.failedAt': new Date(),
              'metadata.webhookLock.error': error.message
            }
          }
        )
      } catch {
        // best-effort lock release
      }
    }
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
        const commissionPayload = {
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
        }

        const { commission, created } = await createCommissionIdempotent(
          commissionPayload,
          partnerCommission
        )

        if (created && commission) {
          console.log('✅ Commission record created:', commission._id)
        } else if (commission) {
          console.log('ℹ️ Commission already exists for this order item:', commission._id)
        }

        if (created) {
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
          }
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



// Core refund logic, reusable by both the HTTP endpoint below and other
// flows that need to trigger a real refund (e.g. cancelling a paid order —
// see marketplace.routes.js PATCH /orders/:id/status, which used to just
// restore inventory and mark the order "cancelled" without ever refunding
// the buyer's money or touching paymentStatus). Returns a plain result
// object instead of writing to `res` so callers can decide how to respond.
async function refundOrderCore(orderId, { reason, amount, idempotencyKey, resultingOrderStatus = 'refunded' } = {}) {
  const order = await Order.findById(orderId)
  if (!order) {
    return { success: false, statusCode: 404, message: 'Order not found' }
  }

  if (order.paymentStatus !== 'paid') {
    if (order.paymentStatus === 'refunded' || order.status === 'refunded') {
      const existingRefund = await Transaction.findOne({
        orderId, type: 'refund', status: 'completed'
      }).sort({ createdAt: -1 })
      if (existingRefund) {
        return { success: true, statusCode: 200, idempotent: true, data: { refund: existingRefund, message: 'Refund already processed' } }
      }
    }
    return { success: false, statusCode: 400, message: 'Order is not paid' }
  }

  if (order.paymentStatus === 'refunded' || order.status === 'refunded') {
    const existingRefund = await Transaction.findOne({
      orderId, type: 'refund', status: 'completed'
    }).sort({ createdAt: -1 })
    if (existingRefund) {
      return { success: true, statusCode: 200, idempotent: true, data: { refund: existingRefund, message: 'Refund already processed' } }
    }
    return { success: false, statusCode: 400, message: 'Order is already refunded' }
  }

  if (idempotencyKey) {
    const keyedRefund = await Transaction.findOne({
      orderId, type: 'refund', status: 'completed', 'metadata.idempotencyKey': idempotencyKey
    })
    if (keyedRefund) {
      return { success: true, statusCode: 200, idempotent: true, data: { refund: keyedRefund, message: 'Refund already processed' } }
    }
  }

  const existingCompletedRefund = await Transaction.findOne({
    orderId, type: 'refund', status: 'completed'
  })
  if (existingCompletedRefund) {
    return { success: true, statusCode: 200, idempotent: true, data: { refund: existingCompletedRefund, message: 'Refund already processed' } }
  }

  const refundAmount = amount != null ? Number(amount) : order.total
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return { success: false, statusCode: 400, message: 'Invalid refund amount' }
  }
  if (refundAmount > order.total) {
    return { success: false, statusCode: 400, message: 'Refund amount cannot exceed order total' }
  }

  // Atomically claim this order for refund processing — everything above
  // this point is a plain read, so a double-click or client retry could
  // otherwise pass all those checks twice and call the provider's refund
  // API twice for the same order (real double refund, unlike verify/
  // webhook handling which already locks via Transaction.webhookLock
  // before this point). Mirrors that same lock pattern, scoped to the
  // order since no refund Transaction exists yet to lock onto.
  const refundLockToken = crypto.randomBytes(16).toString('hex')
  const refundLockNow = new Date()
  const lockedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: 'paid',
      $or: [
        { 'metadata.refundLock.status': { $exists: false } },
        { 'metadata.refundLock.status': { $ne: 'processing' } },
        { 'metadata.refundLock.expiresAt': { $lt: refundLockNow } }
      ]
    },
    {
      $set: {
        'metadata.refundLock': {
          status: 'processing',
          token: refundLockToken,
          startedAt: refundLockNow,
          expiresAt: new Date(refundLockNow.getTime() + 5 * 60 * 1000)
        }
      }
    },
    { new: true }
  )

  if (!lockedOrder) {
    // Either already refunded (handled by the idempotent-return checks
    // above on a subsequent request once this one finishes), or another
    // refund request for this order is already in flight right now.
    return { success: false, statusCode: 409, message: 'A refund for this order is already being processed. Please wait a moment and check the order status.' }
  }

  const releaseRefundLock = () => Order.updateOne(
    { _id: orderId, 'metadata.refundLock.token': refundLockToken },
    { $unset: { 'metadata.refundLock': '' } }
  ).catch((e) => console.error('Failed to release refund lock:', e.message))

  // Find the original completed payment so we know which provider/reference to refund
  const originalPayment = await Transaction.findOne({
    orderId, type: 'payment', status: 'completed'
  }).sort({ createdAt: -1 })

  if (!originalPayment) {
    await releaseRefundLock()
    return { success: false, statusCode: 400, message: 'No completed payment found for this order' }
  }

  const provider = originalPayment.paymentProvider || 'paystack'

  let providerResult
  if (provider === 'paystack') {
    const paystackUtil = new PaystackUtil()
    providerResult = await paystackUtil.refundTransaction(originalPayment.reference, refundAmount)
  } else if (provider === 'flutterwave') {
    const providerTransactionId = originalPayment.metadata?.verification?.providerTransactionId
    if (!providerTransactionId) {
      await releaseRefundLock()
      return { success: false, statusCode: 400, message: 'Cannot refund: missing Flutterwave transaction id on the original payment' }
    }
    const flutterwaveUtil = new FlutterwaveUtil()
    providerResult = await flutterwaveUtil.refundTransaction(providerTransactionId, refundAmount)
  } else {
    await releaseRefundLock()
    return { success: false, statusCode: 400, message: `Unsupported payment provider: ${provider}` }
  }

  if (!providerResult.success) {
    await releaseRefundLock()
    return { success: false, statusCode: 502, message: 'Refund failed at payment provider: ' + providerResult.message }
  }

  // Provider already moved money — wrap DB side in a transaction so order +
  // refund record + inventory restore stay consistent. If this fails after a
  // successful provider refund, log for manual reconcile.
  const session = await mongoose.startSession()
  session.startTransaction()
  let refundTransaction
  try {
    const Listing = require('../models/listing.model')
    const populatedOrder = await Order.findById(orderId).session(session)
    if (!populatedOrder) {
      throw new Error('Order disappeared during refund')
    }

    ;[refundTransaction] = await Transaction.create([{
      type: 'refund',
      status: 'completed',
      amount: refundAmount,
      currency: 'NGN',
      reference: `REFUND_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      description: `Refund for order ${orderId}: ${reason || 'no reason given'}`,
      userId: populatedOrder.buyer,
      orderId: orderId,
      paymentProvider: provider,
      processedAt: new Date(),
      metadata: {
        reason: reason,
        originalOrderId: orderId,
        originalTransactionId: originalPayment._id,
        providerResponse: providerResult.data,
        ...(idempotencyKey ? { idempotencyKey } : {})
      }
    }], { session })

    populatedOrder.status = resultingOrderStatus
    populatedOrder.paymentStatus = 'refunded'
    if (populatedOrder.metadata?.refundLock) {
      populatedOrder.metadata.refundLock = undefined
    }
    await populatedOrder.save({ session })

    // Restore stock that was decremented when payment completed
    for (const item of populatedOrder.items || []) {
      const listingId = item.listing?._id || item.listing
      if (!listingId) continue
      await Listing.findByIdAndUpdate(
        listingId,
        { $inc: { availableQuantity: Number(item.quantity) || 0 } },
        { session }
      )
    }

    await session.commitTransaction()
  } catch (txError) {
    await session.abortTransaction()
    console.error(
      'CRITICAL: Provider refund succeeded but DB commit failed — manual reconcile required',
      { orderId, provider, refundAmount, error: txError.message }
    )
    return { success: false, statusCode: 500, message: 'Refund succeeded at provider but failed to update records. Support has been alerted.' }
  } finally {
    session.endSession()
  }

  return { success: true, statusCode: 200, data: { refund: refundTransaction, message: 'Refund processed successfully' } }
}

exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params
    const { reason, amount } = req.body
    const rawIdempotencyKey = req.get('Idempotency-Key') || req.body?.idempotencyKey || ''
    const idempotencyKey = String(rawIdempotencyKey).trim().slice(0, 128) || null

    const currentUserId = (req.user?.id || req.user?._id)?.toString?.()
    const currentRole = req.user?.role

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    if (currentRole !== 'admin' && order.buyer?.toString?.() !== currentUserId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const result = await refundOrderCore(orderId, { reason, amount, idempotencyKey })
    if (!result.success) {
      return res.status(result.statusCode).json({ status: 'error', message: result.message })
    }
    return res.status(result.statusCode).json({ status: 'success', data: result.data, ...(result.idempotent ? { idempotent: true } : {}) })
  } catch (error) {
    console.error('processRefund error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.refundOrderCore = refundOrderCore

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

      if (!PaystackUtil.verifyWebhookSignature(req.body, signature, secret)) {
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

    if (event !== 'charge.success') {
      console.log('ℹ️ Webhook: Event type not charge.success:', event)
      return res.json({ status: 'success', message: 'Event ignored' })
    }

    const now = new Date()
    webhookLockToken = crypto.randomBytes(16).toString('hex')
    let webhookSideEffectsApplied = false

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

        // Guard against underpayment (e.g. bank transfer/USSD channels that don't
        // enforce the requested amount) — a "success" charge that paid less than
        // the transaction total must not be allowed to mark the order as paid.
        const paidAmountNaira = paystackVerification.amount / 100
        if (Math.abs(paidAmountNaira - tx.amount) > 1) {
          console.error(`❌ Webhook amount mismatch for ${reference}: expected ₦${tx.amount}, Paystack confirmed ₦${paidAmountNaira}`)
          await Transaction.findOneAndUpdate(
            { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
            {
              $set: {
                'metadata.webhookLock.status': 'failed',
                'metadata.webhookLock.failedAt': new Date(),
                'metadata.webhookLock.error': `Amount mismatch: expected ${tx.amount}, got ${paidAmountNaira}`
              }
            }
          )
          return res.json({ status: 'success', message: 'Webhook received but amount did not match' })
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

          if (tx.metadata?.loanApplicationId || tx.loanApplicationId) {
            const { completeLoanRepayment } = require('../services/loan-payment.service')
            const loanResult = await completeLoanRepayment(reference, session)
            if (!loanResult.success && !loanResult.alreadyProcessed) {
              throw new Error(loanResult.error || 'Loan repayment processing failed')
            }
            console.log('✅ Loan repayment processed via Paystack webhook')
          } else           if (tx.orderId) {
            order = await Order.findById(tx.orderId).session(session)
            if (order) {
              console.log('📦 Webhook: Finalizing paid order', {
                orderId: tx.orderId,
                currentStatus: order.status,
                currentPaymentStatus: order.paymentStatus,
              })

              const fulfillment = await fulfillOrderInSession({
                order,
                paymentReference: data.reference,
                session,
              })
              wasJustPaid = fulfillment.needsSideEffects
            }
          }

          await session.commitTransaction()
          webhookSideEffectsApplied = true
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

        if (order && wasJustPaid) {
          await runPostPaymentSideEffects(order)
        }
      } catch (processingError) {
        console.error('❌ Webhook processing error:', processingError)
        if (webhookReference && webhookLockToken && !webhookSideEffectsApplied) {
          try {
            await Transaction.findOneAndUpdate(
              { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
              {
                $set: {
                  'metadata.webhookLock.status': 'failed',
                  'metadata.webhookLock.failedAt': new Date(),
                  'metadata.webhookLock.error': processingError.message
                }
              }
            )
          } catch (lockError) {
            console.error('❌ Failed to update webhook lock failure state:', lockError)
          }
        }
      }
    }

    console.log('✅ Webhook processing completed')
    if (webhookSideEffectsApplied && webhookReference && webhookLockToken) {
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

    const isSuccessfulCharge = event === 'charge.completed' && data.status === 'successful'
    if (!isSuccessfulCharge) {
      console.log('ℹ️ Flutterwave webhook: Event/status not a successful charge:', event, data.status)
      return res.json({ status: 'success', message: 'Event ignored' })
    }

    const now = new Date()
    webhookLockToken = crypto.randomBytes(16).toString('hex')
    let webhookSideEffectsApplied = false

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

        // Guard against underpayment (e.g. bank transfer/USSD channels that don't
        // enforce the requested amount) — a "success" charge that paid less than
        // the transaction total must not be allowed to mark the order as paid.
        if (Math.abs(flutterwaveVerification.amount - tx.amount) > 1) {
          console.error(`❌ Webhook amount mismatch for ${reference}: expected ₦${tx.amount}, Flutterwave confirmed ₦${flutterwaveVerification.amount}`)
          await Transaction.findOneAndUpdate(
            { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
            {
              $set: {
                'metadata.webhookLock.status': 'failed',
                'metadata.webhookLock.failedAt': new Date(),
                'metadata.webhookLock.error': `Amount mismatch: expected ${tx.amount}, got ${flutterwaveVerification.amount}`
              }
            }
          )
          return res.json({ status: 'success', message: 'Webhook received but amount did not match' })
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

          if (tx.metadata?.loanApplicationId || tx.loanApplicationId) {
            const { completeLoanRepayment } = require('../services/loan-payment.service')
            const loanResult = await completeLoanRepayment(reference, session)
            if (!loanResult.success && !loanResult.alreadyProcessed) {
              throw new Error(loanResult.error || 'Loan repayment processing failed')
            }
            console.log('✅ Loan repayment processed via Flutterwave webhook')
          } else if (tx.orderId) {
            order = await Order.findById(tx.orderId).session(session)
            if (order) {
              const fulfillment = await fulfillOrderInSession({
                order,
                paymentReference: reference,
                session,
              })
              wasJustPaid = fulfillment.needsSideEffects
            }
          }

          await session.commitTransaction()
          webhookSideEffectsApplied = true
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
          await runPostPaymentSideEffects(order)
        }
      } catch (processingError) {
        console.error('❌ Flutterwave webhook processing error:', processingError)
        if (webhookReference && webhookLockToken && !webhookSideEffectsApplied) {
          try {
            await Transaction.findOneAndUpdate(
              { reference: webhookReference, 'metadata.webhookLock.token': webhookLockToken },
              {
                $set: {
                  'metadata.webhookLock.status': 'failed',
                  'metadata.webhookLock.failedAt': new Date(),
                  'metadata.webhookLock.error': processingError.message
                }
              }
            )
          } catch (lockError) {
            console.error('❌ Failed to update webhook lock failure state:', lockError)
          }
        }
      }
    }

    console.log('✅ Flutterwave webhook processing completed')
    if (webhookSideEffectsApplied && webhookReference && webhookLockToken) {
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

// Reconciliation endpoint — replays the full idempotent fulfillment pipeline
// (order paid + inventory + commissions/notifications), never status-only patches.
exports.syncOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params

    if (!orderId) {
      return res.status(400).json({ status: 'error', message: 'Order ID is required' })
    }

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

    const result = await reconcileOrderFulfillment(orderId)

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        status: 'error',
        message: result.error || 'Order reconciliation failed',
      })
    }

    if (result.reason === 'no_completed_payment') {
      return res.json({
        status: 'success',
        message: 'No completed payment found — order unchanged',
        data: { order: result.order },
      })
    }

    if (result.alreadySynced) {
      return res.json({
        status: 'success',
        message: 'Order already fully fulfilled',
        data: { order: result.order, idempotent: true },
      })
    }

    return res.json({
      status: 'success',
      message: 'Order fulfillment reconciled',
      data: {
        order: result.order,
        wasJustPaid: result.wasJustPaid,
        inventoryApplied: result.inventoryApplied,
        paymentReference: result.transaction?.reference,
      },
    })
  } catch (error) {
    console.error('❌ Order reconciliation error:', error)
    return res.status(500).json({ status: 'error', message: 'Order reconciliation failed' })
  }
}

// Admin bulk reconciliation — same idempotent pipeline as syncOrderStatus
exports.bulkSyncOrders = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Admin access required' })
    }

    const pendingOrders = await Order.find({
      $or: [{ status: 'pending' }, { paymentStatus: 'pending' }],
    }).limit(100)

    // Also heal legacy rows where status was patched paid without inventory fulfillment
    const inventoryDriftOrders = await Order.find({
      paymentStatus: 'paid',
      $or: [
        { 'metadata.fulfillment.inventoryAppliedAt': { $exists: false } },
        { 'metadata.fulfillment.inventoryAppliedAt': null },
      ],
    }).limit(50)

    const seen = new Set()
    const ordersToReconcile = []
    for (const order of [...pendingOrders, ...inventoryDriftOrders]) {
      const id = order._id.toString()
      if (seen.has(id)) continue
      seen.add(id)
      ordersToReconcile.push(order)
    }

    let reconciledCount = 0
    let alreadySyncedCount = 0
    let noPaymentCount = 0
    const results = []

    for (const order of ordersToReconcile) {
      try {
        const result = await reconcileOrderFulfillment(order._id)

        if (result.reason === 'no_completed_payment') {
          noPaymentCount++
          continue
        }

        if (result.alreadySynced) {
          alreadySyncedCount++
          continue
        }

        if (result.synced) {
          reconciledCount++
          results.push({
            orderId: order._id,
            reconciled: true,
            wasJustPaid: result.wasJustPaid,
            inventoryApplied: result.inventoryApplied,
          })
        }
      } catch (orderError) {
        console.error(`❌ Reconciliation failed for order ${order._id}:`, orderError)
        results.push({ orderId: order._id, error: orderError.message })
      }
    }

    return res.json({
      status: 'success',
      message: 'Bulk order reconciliation completed',
      summary: {
        totalChecked: ordersToReconcile.length,
        reconciled: reconciledCount,
        alreadySynced: alreadySyncedCount,
        noCompletedPayment: noPaymentCount,
        errors: results.filter((r) => r.error).length,
      },
      results: results.slice(0, 10),
    })
  } catch (error) {
    console.error('❌ Bulk reconciliation error:', error)
    return res.status(500).json({ status: 'error', message: 'Bulk reconciliation failed' })
  }
}

// Provider verification helpers — delegate to shared utils (single source of truth)
async function verifyWithPaystackAPI(reference) {
  try {
    const paystackUtil = new PaystackUtil()
    const result = await paystackUtil.verifyTransaction(reference)
    console.log('📊 Paystack API Response:', result)
    return result
  } catch (error) {
    console.error('❌ Paystack API request error:', error)
    return { success: false, paid: false, error: error.message }
  }
}

async function verifyWithFlutterwaveAPI(reference) {
  try {
    const flutterwaveUtil = new FlutterwaveUtil()
    const result = await flutterwaveUtil.verifyTransaction(reference)
    console.log('📊 Flutterwave API Response:', result)
    return result
  } catch (error) {
    console.error('❌ Flutterwave API request error:', error)
    return { success: false, paid: false, error: error.message }
  }
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

exports.initializeLoanPayment = async (req, res) => {
  try {
    const { loanApplicationId, paymentProvider = 'paystack' } = req.body
    const currentUserId = req.user?.id || req.user?._id

    if (!loanApplicationId) {
      return res.status(400).json({ status: 'error', message: 'Loan application ID is required' })
    }

    const LoanApplication = require('../models/loan-application.model')
    const { getNextPendingInstallment, generateLoanPaymentReference } = require('../services/loan-payment.service')

    const loan = await LoanApplication.findById(loanApplicationId)
    if (!loan) {
      return res.status(404).json({ status: 'error', message: 'Loan not found' })
    }

    if (loan.farmer.toString() !== currentUserId?.toString()) {
      return res.status(403).json({ status: 'error', message: 'You can only pay your own loans' })
    }

    if (!['approved', 'disbursed'].includes(loan.status)) {
      return res.status(400).json({ status: 'error', message: 'This loan is not active for repayment' })
    }

    const installment = await getNextPendingInstallment(loan)
    if (!installment) {
      return res.status(400).json({ status: 'error', message: 'No pending installments' })
    }

    const installmentIndex = loan.repaymentSchedule.findIndex(
      p => p._id?.toString() === installment._id?.toString() ||
        (p.dueDate?.toString() === installment.dueDate?.toString() && p.amount === installment.amount)
    )

    const user = await require('../models/user.model').findById(currentUserId).select('email name')
    if (!user?.email) {
      return res.status(400).json({ status: 'error', message: 'User email is required for payment' })
    }

    const amount = installment.amount
    let reference
    let transaction = await Transaction.findOne({
      loanApplicationId,
      status: 'pending',
      type: 'loan_repayment',
      amount,
      'metadata.installmentIndex': installmentIndex >= 0 ? installmentIndex : undefined
    }).sort({ createdAt: -1 })

    if (transaction) {
      reference = transaction.reference
    } else {
      reference = generateLoanPaymentReference(loanApplicationId)
      transaction = await Transaction.create({
        type: 'loan_repayment',
        status: 'pending',
        amount,
        currency: 'NGN',
        reference,
        description: `Loan repayment installment — ${loan.purpose}`,
        userId: currentUserId,
        loanApplicationId,
        paymentProvider,
        metadata: {
          loanApplicationId,
          installmentIndex: installmentIndex >= 0 ? installmentIndex : 0,
          installmentAmount: amount,
          dueDate: installment.dueDate
        }
      })
    }

    if (!hasValidProviderSecret(paymentProvider)) {
      if (!allowInsecureTestPayments()) {
        return res.status(503).json({
          status: 'error',
          message: 'Payment provider is not configured. Please contact support.'
        })
      }
      return res.json({
        status: 'success',
        data: {
          transaction: { reference, amount, status: 'pending' },
          paystack: { reference, access_code: null, authorization_url: null },
          testMode: true
        }
      })
    }

    const paystackData = {
      email: user.email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: req.body.callbackUrl || `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/payment/verify`,
      metadata: {
        loan_application_id: loanApplicationId,
        installment_index: installmentIndex >= 0 ? installmentIndex : 0,
        payment_type: 'loan_repayment'
      }
    }

    const paystackUtil = new PaystackUtil()
    const paystackInit = await paystackUtil.initializeTransaction(paystackData)

    if (!paystackInit.success) {
      return res.status(502).json({
        status: 'error',
        message: paystackInit.message || 'Failed to initialize payment with Paystack'
      })
    }

    return res.json({
      status: 'success',
      data: {
        transaction: {
          reference,
          amount,
          status: 'pending',
          loanApplicationId
        },
        paystack: {
          reference,
          access_code: paystackInit.data?.access_code,
          authorization_url: paystackInit.data?.authorization_url
        }
      }
    })
  } catch (error) {
    console.error('Error initializing loan payment:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to initialize loan payment' })
  }
}