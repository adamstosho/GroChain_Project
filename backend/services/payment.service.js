const axios = require('axios')
const crypto = require('crypto')
const Payment = require('../models/payment.model')
const Transaction = require('../models/transaction.model')
const User = require('../models/user.model')
const Order = require('../models/order.model')

class PaymentService {
  constructor() {
    this.paystack = {
      baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY
    }
    
    this.flutterwave = {
      baseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY
    }
    
    this.stripe = {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publicKey: process.env.STRIPE_PUBLIC_KEY
    }
  }

  // Initialize Paystack payment
  async initializePaystackPayment(paymentData) {
    try {
      const {
        amount,
        email,
        reference,
        callbackUrl,
        metadata = {}
      } = paymentData

      const payload = {
        amount: Math.round(amount * 100), // Convert to kobo
        email,
        reference,
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          source: 'grochain',
          timestamp: new Date().toISOString()
        }
      }

      const response = await axios.post(
        `${this.paystack.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.paystack.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status) {
        return {
          success: true,
          authorizationUrl: response.data.data.authorization_url,
          reference: response.data.data.reference,
          accessCode: response.data.data.access_code
        }
      } else {
        throw new Error(response.data.message || 'Payment initialization failed')
      }
    } catch (error) {
      console.error('Error initializing Paystack payment:', error)
      throw error
    }
  }

  // Verify Paystack payment
  async verifyPaystackPayment(reference) {
    try {
      const response = await axios.get(
        `${this.paystack.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.paystack.secretKey}`
          }
        }
      )

      if (response.data.status) {
        const transaction = response.data.data
        
        // Verify the payment was successful
        if (transaction.status === 'success') {
          return {
            success: true,
            amount: transaction.amount / 100, // Convert from kobo
            reference: transaction.reference,
            transactionId: transaction.id,
            metadata: transaction.metadata,
            paidAt: transaction.paid_at
          }
        } else {
          return {
            success: false,
            status: transaction.status,
            message: transaction.gateway_response
          }
        }
      } else {
        throw new Error(response.data.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying Paystack payment:', error)
      throw error
    }
  }

  // Initialize Flutterwave payment
  async initializeFlutterwavePayment(paymentData) {
    try {
      const {
        amount,
        email,
        reference,
        callbackUrl,
        metadata = {}
      } = paymentData

      const payload = {
        tx_ref: reference,
        amount,
        currency: 'NGN',
        redirect_url: callbackUrl,
        customer: {
          email,
          name: metadata.customerName || 'GroChain User'
        },
        customizations: {
          title: 'GroChain Payment',
          description: metadata.description || 'Payment for GroChain services',
          logo: 'https://grochain.com/logo.png'
        },
        meta: {
          ...metadata,
          source: 'grochain',
          timestamp: new Date().toISOString()
        }
      }

      const response = await axios.post(
        `${this.flutterwave.baseUrl}/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwave.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          authorizationUrl: response.data.data.link,
          reference: response.data.data.tx_ref,
          transactionId: response.data.data.id
        }
      } else {
        throw new Error(response.data.message || 'Payment initialization failed')
      }
    } catch (error) {
      console.error('Error initializing Flutterwave payment:', error)
      throw error
    }
  }

  // Verify Flutterwave payment
  async verifyFlutterwavePayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.flutterwave.baseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwave.secretKey}`
          }
        }
      )

      if (response.data.status === 'success') {
        const transaction = response.data.data
        
        if (transaction.status === 'successful') {
          return {
            success: true,
            amount: transaction.amount,
            reference: transaction.tx_ref,
            transactionId: transaction.id,
            metadata: transaction.meta,
            paidAt: transaction.created_at
          }
        } else {
          return {
            success: false,
            status: transaction.status,
            message: transaction.flw_ref
          }
        }
      } else {
        throw new Error(response.data.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying Flutterwave payment:', error)
      throw error
    }
  }

  // Process card payment with Stripe
  async processStripePayment(paymentData) {
    try {
      const stripe = require('stripe')(this.stripe.secretKey)
      
      const {
        amount,
        currency = 'ngn',
        source,
        description,
        metadata = {}
      } = paymentData

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        source,
        description,
        metadata: {
          ...metadata,
          source: 'grochain',
          timestamp: new Date().toISOString()
        }
      })

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status
      }
    } catch (error) {
      console.error('Error processing Stripe payment:', error)
      throw error
    }
  }

  // Create payment record
  async createPaymentRecord(paymentData) {
    try {
      const payment = new Payment({
        user: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        paymentMethod: paymentData.paymentMethod,
        provider: paymentData.provider,
        reference: paymentData.reference,
        status: 'pending',
        metadata: paymentData.metadata || {},
        callbackUrl: paymentData.callbackUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })

      await payment.save()
      return payment
    } catch (error) {
      console.error('Error creating payment record:', error)
      throw error
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, status, transactionData = {}) {
    try {
      const payment = await Payment.findById(paymentId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      payment.status = status
      payment.processedAt = new Date()
      
      if (transactionData.reference) {
        payment.providerReference = transactionData.reference
      }
      
      if (transactionData.transactionId) {
        payment.providerTransactionId = transactionData.transactionId
      }

      await payment.save()

      // If payment is successful, create transaction record
      if (status === 'completed') {
        await this.createTransactionRecord(payment, transactionData)
      }

      return payment
    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  }

  // Create transaction record
  async createTransactionRecord(payment, transactionData) {
    try {
      const transaction = new Transaction({
        user: payment.user,
        type: 'payment',
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        provider: payment.provider,
        reference: payment.reference,
        providerReference: transactionData.reference,
        providerTransactionId: transactionData.transactionId,
        metadata: {
          ...payment.metadata,
          paymentId: payment._id,
          paidAt: transactionData.paidAt
        }
      })

      await transaction.save()
      return transaction
    } catch (error) {
      console.error('Error creating transaction record:', error)
      throw error
    }
  }

  // Process order payment
  async processOrderPayment(orderId, paymentMethod, paymentData) {
    try {
      const order = await Order.findById(orderId)
        .populate('buyer', 'email name phone')
        .populate('seller', 'email name phone')

      if (!order) {
        throw new Error('Order not found')
      }

      if (order.status !== 'pending_payment') {
        throw new Error('Order is not ready for payment')
      }

      // Create payment record
      const payment = await this.createPaymentRecord({
        userId: order.buyer._id,
        amount: order.totalAmount,
        currency: 'NGN',
        paymentMethod,
        provider: this.getProviderForMethod(paymentMethod),
        reference: `ORDER-${order._id}-${Date.now()}`,
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          buyerId: order.buyer._id,
          sellerId: order.seller._id,
          items: order.items.map(item => ({
            productId: item.product,
            quantity: item.quantity,
            price: item.price
          }))
        },
        callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`
      })

      // Initialize payment based on method
      let paymentResult
      switch (paymentMethod) {
        case 'paystack':
          paymentResult = await this.initializePaystackPayment({
            amount: order.totalAmount,
            email: order.buyer.email,
            reference: payment.reference,
            callbackUrl: payment.callbackUrl,
            metadata: payment.metadata
          })
          break
        case 'flutterwave':
          paymentResult = await this.initializeFlutterwavePayment({
            amount: order.totalAmount,
            email: order.buyer.email,
            reference: payment.reference,
            callbackUrl: payment.callbackUrl,
            metadata: payment.metadata
          })
          break
        case 'card':
          paymentResult = await this.processStripePayment({
            amount: order.totalAmount,
            currency: 'ngn',
            description: `Payment for order ${order.orderNumber}`,
            metadata: payment.metadata
          })
          break
        default:
          throw new Error('Unsupported payment method')
      }

      if (paymentResult.success) {
        // Update payment with provider details
        payment.providerReference = paymentResult.reference
        payment.providerTransactionId = paymentResult.transactionId
        await payment.save()

        return {
          success: true,
          paymentId: payment._id,
          authorizationUrl: paymentResult.authorizationUrl,
          reference: payment.reference,
          amount: order.totalAmount
        }
      } else {
        throw new Error('Payment initialization failed')
      }
    } catch (error) {
      console.error('Error processing order payment:', error)
      throw error
    }
  }

  // Process harvest payment
  async processHarvestPayment(harvestId, buyerId, amount, paymentMethod) {
    try {
      const harvest = await require('../models/harvest.model').findById(harvestId)
        .populate('farmer', 'email name phone')

      if (!harvest) {
        throw new Error('Harvest not found')
      }

      if (harvest.status !== 'approved') {
        throw new Error('Harvest is not available for purchase')
      }

      // Create payment record
      const payment = await this.createPaymentRecord({
        userId: buyerId,
        amount,
        currency: 'NGN',
        paymentMethod,
        provider: this.getProviderForMethod(paymentMethod),
        reference: `HARVEST-${harvest._id}-${Date.now()}`,
        metadata: {
          harvestId: harvest._id,
          cropType: harvest.cropType,
          quantity: harvest.quantity,
          farmerId: harvest.farmer._id,
          buyerId
        },
        callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`
      })

      // Initialize payment
      const paymentResult = await this.initializePaystackPayment({
        amount,
        email: (await User.findById(buyerId)).email,
        reference: payment.reference,
        callbackUrl: payment.callbackUrl,
        metadata: payment.metadata
      })

      if (paymentResult.success) {
        payment.providerReference = paymentResult.reference
        await payment.save()

        return {
          success: true,
          paymentId: payment._id,
          authorizationUrl: paymentResult.authorizationUrl,
          reference: payment.reference,
          amount
        }
      } else {
        throw new Error('Payment initialization failed')
      }
    } catch (error) {
      console.error('Error processing harvest payment:', error)
      throw error
    }
  }

  // Process subscription payment
  async processSubscriptionPayment(userId, planId, amount, paymentMethod) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Create payment record
      const payment = await this.createPaymentRecord({
        userId,
        amount,
        currency: 'NGN',
        paymentMethod,
        provider: this.getProviderForMethod(paymentMethod),
        reference: `SUBSCRIPTION-${planId}-${userId}-${Date.now()}`,
        metadata: {
          planId,
          subscriptionType: 'premium',
          userId
        },
        callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`
      })

      // Initialize payment
      const paymentResult = await this.initializePaystackPayment({
        amount,
        email: user.email,
        reference: payment.reference,
        callbackUrl: payment.callbackUrl,
        metadata: payment.metadata
      })

      if (paymentResult.success) {
        payment.providerReference = paymentResult.reference
        await payment.save()

        return {
          success: true,
          paymentId: payment._id,
          authorizationUrl: paymentResult.authorizationUrl,
          reference: payment.reference,
          amount
        }
      } else {
        throw new Error('Payment initialization failed')
      }
    } catch (error) {
      console.error('Error processing subscription payment:', error)
      throw error
    }
  }

  // Get payment by reference
  async getPaymentByReference(reference) {
    try {
      return await Payment.findOne({ reference })
        .populate('user', 'name email phone')
    } catch (error) {
      console.error('Error getting payment by reference:', error)
      throw error
    }
  }

  // Get user payment history
  async getUserPaymentHistory(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit
      
      const payments = await Payment.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone')

      const total = await Payment.countDocuments({ user: userId })

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error getting user payment history:', error)
      throw error
    }
  }

  // Get payment statistics
  async getPaymentStats(period = 'month') {
    try {
      const now = new Date()
      let startDate

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const stats = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        }
      ])

      const methodStats = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])

      return {
        period,
        startDate,
        endDate: now,
        overview: stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          averageAmount: 0
        },
        byMethod: methodStats
      }
    } catch (error) {
      console.error('Error getting payment stats:', error)
      throw error
    }
  }

  // Refund payment
  async refundPayment(paymentId, reason, amount = null) {
    try {
      const payment = await Payment.findById(paymentId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment cannot be refunded')
      }

      // Process refund through provider
      let refundResult
      switch (payment.provider) {
        case 'paystack':
          refundResult = await this.processPaystackRefund(payment.providerReference, amount)
          break
        case 'flutterwave':
          refundResult = await this.processFlutterwaveRefund(payment.providerTransactionId, amount)
          break
        default:
          throw new Error('Refund not supported for this provider')
      }

      if (refundResult.success) {
        // Update payment status
        payment.status = 'refunded'
        payment.refundedAt = new Date()
        payment.refundReason = reason
        payment.refundAmount = amount || payment.amount
        await payment.save()

        // Create refund transaction
        const refundTransaction = new Transaction({
          user: payment.user,
          type: 'refund',
          amount: payment.refundAmount,
          currency: payment.currency,
          status: 'completed',
          provider: payment.provider,
          reference: `REFUND-${payment.reference}`,
          metadata: {
            originalPaymentId: payment._id,
            reason,
            providerRefundId: refundResult.refundId
          }
        })

        await refundTransaction.save()

        return {
          success: true,
          refundId: refundTransaction._id,
          amount: payment.refundAmount
        }
      } else {
        throw new Error('Refund failed')
      }
    } catch (error) {
      console.error('Error refunding payment:', error)
      throw error
    }
  }

  // Process Paystack refund
  async processPaystackRefund(reference, amount) {
    try {
      const payload = {
        transaction: reference
      }

      if (amount) {
        payload.amount = Math.round(amount * 100)
      }

      const response = await axios.post(
        `${this.paystack.baseUrl}/refund`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.paystack.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status) {
        return {
          success: true,
          refundId: response.data.data.id
        }
      } else {
        throw new Error(response.data.message || 'Refund failed')
      }
    } catch (error) {
      console.error('Error processing Paystack refund:', error)
      throw error
    }
  }

  // Process Flutterwave refund
  async processFlutterwaveRefund(transactionId, amount) {
    try {
      const payload = {
        amount: amount || 0
      }

      const response = await axios.post(
        `${this.flutterwave.baseUrl}/transactions/${transactionId}/refund`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwave.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          refundId: response.data.data.id
        }
      } else {
        throw new Error(response.data.message || 'Refund failed')
      }
    } catch (error) {
      console.error('Error processing Flutterwave refund:', error)
      throw error
    }
  }

  // Get provider for payment method
  getProviderForMethod(paymentMethod) {
    const methodMap = {
      'paystack': 'paystack',
      'flutterwave': 'flutterwave',
      'card': 'stripe',
      'bank_transfer': 'paystack',
      'ussd': 'paystack'
    }

    return methodMap[paymentMethod] || 'paystack'
  }

  // Validate webhook signature
  validateWebhookSignature(signature, body, provider = 'paystack') {
    try {
      switch (provider) {
        case 'paystack':
          const hash = crypto
            .createHmac('sha512', this.paystack.secretKey)
            .update(JSON.stringify(body))
            .digest('hex')
          return hash === signature

        case 'flutterwave':
          const flutterwaveHash = crypto
            .createHmac('sha256', this.flutterwave.secretKey)
            .update(JSON.stringify(body))
            .digest('hex')
          return flutterwaveHash === signature

        default:
          return false
      }
    } catch (error) {
      console.error('Error validating webhook signature:', error)
      return false
    }
  }
}

module.exports = new PaymentService()
