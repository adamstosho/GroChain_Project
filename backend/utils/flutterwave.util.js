const axios = require('axios')
const crypto = require('crypto')

class FlutterwaveUtil {
  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY
    this.baseURL = 'https://api.flutterwave.com/v3'

    if (!this.secretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is required')
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  // Initialize a hosted payment link.
  // Callers pass `amount` in naira (Flutterwave's native unit — unlike Paystack kobo).
  async initializeTransaction(data) {
    try {
      const amountNaira = Number(data.amount)
      if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
        return {
          success: false,
          message: 'Invalid payment amount'
        }
      }

      if (!data.reference) {
        return {
          success: false,
          message: 'Payment reference is required'
        }
      }

      if (!data.email) {
        return {
          success: false,
          message: 'Customer email is required'
        }
      }

      const callbackUrl = data.callbackUrl || data.callback_url || data.redirect_url

      const payload = {
        tx_ref: data.reference,
        amount: amountNaira,
        currency: data.currency || 'NGN',
        payment_options: data.payment_options || 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: data.email,
          phonenumber: data.phone || '',
          name: data.customerName || ''
        },
        customizations: {
          title: 'GroChain Payment',
          description: `Payment for order ${data.orderId || data.reference}`,
          logo: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/logo-icon.png`
        },
        meta: {
          order_id: data.orderId,
          customer_name: data.customerName,
          ...(data.metadata || {})
        }
      }

      if (callbackUrl) {
        payload.redirect_url = callbackUrl
      }

      const response = await this.axiosInstance.post('/payments', payload)

      if (response.data.status === 'success') {
        return {
          success: true,
          data: {
            ...(response.data.data || {}),
            reference: data.reference
          },
          reference: data.reference,
          message: 'Transaction initialized successfully'
        }
      }

      return {
        success: false,
        message: response.data.message || 'Failed to initialize transaction'
      }
    } catch (error) {
      console.error('Flutterwave initialization error:', error.response?.data || error.message)
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.data?.message ||
          error.message ||
          'Failed to initialize transaction'
      }
    }
  }

  // Verify transaction by OUR tx_ref (not Flutterwave's numeric id).
  // Amount is returned in naira.
  async verifyTransaction(reference) {
    try {
      if (!reference) {
        return { success: false, paid: false, error: 'Reference is required' }
      }

      const response = await this.axiosInstance.get(
        `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`
      )

      if (response.data.status === 'success' && response.data.data) {
        const transaction = response.data.data
        return {
          success: true,
          paid: transaction.status === 'successful',
          status: transaction.status,
          amount: Number(transaction.amount),
          reference: transaction.tx_ref,
          providerTransactionId: transaction.id,
          channel: transaction.payment_type,
          customer: transaction.customer,
          paid_at: transaction.created_at,
          currency: transaction.currency,
          gateway_response: transaction.processor_response,
          metadata: transaction.meta
        }
      }

      return {
        success: false,
        paid: false,
        error: response.data.message || 'Failed to verify transaction'
      }
    } catch (error) {
      console.error('Flutterwave verification error:', error.response?.data || error.message)
      return {
        success: false,
        paid: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to verify transaction'
      }
    }
  }

  // Refund — requires Flutterwave's numeric transaction id, not our tx_ref.
  async refundTransaction(providerTransactionId, amount) {
    try {
      if (!providerTransactionId) {
        return { success: false, message: 'Flutterwave transaction id is required for refund' }
      }

      const payload = {}
      if (amount != null) {
        const amountNaira = Number(amount)
        if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
          return { success: false, message: 'Invalid refund amount' }
        }
        payload.amount = amountNaira
      }

      const response = await this.axiosInstance.post(
        `/transactions/${providerTransactionId}/refund`,
        payload
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Refund initiated successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to initiate refund'
      }
    } catch (error) {
      console.error('Flutterwave refund error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate refund'
      }
    }
  }

  async createCustomer(data) {
    try {
      const payload = {
        email: data.email,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        phone_number: data.phone,
        meta: data.metadata || {}
      }

      const response = await this.axiosInstance.post('/customers', payload)

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: 'Customer created successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to create customer'
      }
    } catch (error) {
      console.error('Flutterwave customer creation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer'
      }
    }
  }

  async getCustomer(customerId) {
    try {
      const response = await this.axiosInstance.get(`/customers/${customerId}`)

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: 'Customer retrieved successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to retrieve customer'
      }
    } catch (error) {
      console.error('Flutterwave customer retrieval error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve customer'
      }
    }
  }

  async createTransferRecipient(data) {
    try {
      const payload = {
        account_bank: data.bankCode,
        account_number: data.accountNumber,
        amount: data.amount,
        narration: data.reason || 'Transfer',
        currency: data.currency || 'NGN',
        reference: data.reference,
        meta: data.metadata || {}
      }

      const response = await this.axiosInstance.post('/transfers', payload)

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: 'Transfer initiated successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to initiate transfer'
      }
    } catch (error) {
      console.error('Flutterwave transfer initiation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate transfer'
      }
    }
  }

  async getBanks() {
    try {
      const response = await this.axiosInstance.get('/banks/NG')

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: 'Banks retrieved successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to retrieve banks'
      }
    } catch (error) {
      console.error('Flutterwave banks retrieval error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve banks'
      }
    }
  }

  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const response = await this.axiosInstance.post('/accounts/resolve', {
        account_number: accountNumber,
        account_bank: bankCode
      })

      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          message: 'Bank account verified successfully'
        }
      }
      return {
        success: false,
        message: response.data.message || 'Failed to verify bank account'
      }
    } catch (error) {
      console.error('Flutterwave bank account verification error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify bank account'
      }
    }
  }

  // Flutterwave webhooks are NOT HMAC-signed — Flutterwave sends back the exact
  // static secret hash configured in the dashboard, in the `verif-hash` header.
  static verifyWebhookSignature(verifHashHeader, secretOverride) {
    try {
      const secret = secretOverride || process.env.FLUTTERWAVE_WEBHOOK_SECRET
      if (!secret || !verifHashHeader) return false

      const secretBuf = Buffer.from(secret)
      const headerBuf = Buffer.from(String(verifHashHeader))
      return (
        secretBuf.length === headerBuf.length &&
        crypto.timingSafeEqual(secretBuf, headerBuf)
      )
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  verifyWebhookSignature(verifHashHeader) {
    return FlutterwaveUtil.verifyWebhookSignature(verifHashHeader)
  }

  generateReference(prefix = 'GROCHAIN') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${prefix}_${timestamp}_${random}`.toUpperCase()
  }

  formatAmount(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency
    }).format(amount)
  }

  getTransactionStatus(status) {
    const statusMap = {
      successful: 'completed',
      failed: 'failed',
      cancelled: 'cancelled',
      pending: 'pending'
    }
    return statusMap[status] || 'unknown'
  }
}

module.exports = FlutterwaveUtil
