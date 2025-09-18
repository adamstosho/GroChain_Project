const axios = require('axios')
// crypto is built-in to Node.js, no need to require it

class PaystackUtil {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY
    this.baseURL = 'https://api.paystack.co'
    
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is required')
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })
  }
  
  // Initialize transaction
  async initializeTransaction(data) {
    try {
      const payload = {
        amount: data.amount * 100, // Convert to kobo (smallest currency unit)
        email: data.email,
        reference: data.reference,
        callback_url: data.callbackUrl,
        currency: data.currency || 'NGN',
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: data.customerName
            },
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: data.orderId
            }
          ]
        }
      }
      
      // Add additional fields if provided
      if (data.phone) payload.phone = data.phone
      if (data.channels) payload.channels = data.channels
      if (data.subaccount) payload.subaccount = data.subaccount
      if (data.transaction_charge) payload.transaction_charge = data.transaction_charge
      if (data.bearer) payload.bearer = data.bearer
      
      const response = await this.axiosInstance.post('/transaction/initialize', payload)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Transaction initialized successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initialize transaction'
        }
      }
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initialize transaction'
      }
    }
  }
  
  // Verify transaction
  async verifyTransaction(reference) {
    try {
      const response = await this.axiosInstance.get(`/transaction/verify/${reference}`)
      
      if (response.data.status) {
        const transaction = response.data.data
        
        // Check if transaction is successful
        if (transaction.status === 'success') {
          return {
            success: true,
            data: {
              reference: transaction.reference,
              amount: transaction.amount / 100, // Convert from kobo to naira
              currency: transaction.currency,
              status: transaction.status,
              gateway_response: transaction.gateway_response,
              paid_at: transaction.paid_at,
              channel: transaction.channel,
              ip_address: transaction.ip_address,
              fees: transaction.fees / 100,
              customer: transaction.customer,
              metadata: transaction.metadata
            },
            message: 'Transaction verified successfully'
          }
        } else {
          return {
            success: false,
            message: `Transaction failed: ${transaction.gateway_response}`,
            data: {
              reference: transaction.reference,
              status: transaction.status,
              gateway_response: transaction.gateway_response
            }
          }
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to verify transaction'
        }
      }
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify transaction'
      }
    }
  }
  
  // Create customer
  async createCustomer(data) {
    try {
      const payload = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        metadata: data.metadata || {}
      }
      
      const response = await this.axiosInstance.post('/customer', payload)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Customer created successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to create customer'
        }
      }
    } catch (error) {
      console.error('Paystack customer creation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer'
      }
    }
  }
  
  // Get customer
  async getCustomer(customerId) {
    try {
      const response = await this.axiosInstance.get(`/customer/${customerId}`)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Customer retrieved successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to retrieve customer'
        }
      }
    } catch (error) {
      console.error('Paystack customer retrieval error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve customer'
      }
    }
  }
  
  // Create transfer recipient
  async createTransferRecipient(data) {
    try {
      const payload = {
        type: 'nuban',
        name: data.accountName,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        currency: data.currency || 'NGN',
        metadata: data.metadata || {}
      }
      
      const response = await this.axiosInstance.post('/transferrecipient', payload)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Transfer recipient created successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to create transfer recipient'
        }
      }
    } catch (error) {
      console.error('Paystack transfer recipient creation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create transfer recipient'
      }
    }
  }
  
  // Initiate transfer
  async initiateTransfer(data) {
    try {
      const payload = {
        source: 'balance',
        amount: data.amount * 100, // Convert to kobo
        recipient: data.recipientCode,
        reason: data.reason || 'Transfer',
        currency: data.currency || 'NGN',
        metadata: data.metadata || {}
      }
      
      const response = await this.axiosInstance.post('/transfer', payload)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Transfer initiated successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initiate transfer'
        }
      }
    } catch (error) {
      console.error('Paystack transfer initiation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate transfer'
      }
    }
  }
  
  // Get banks list
  async getBanks() {
    try {
      const response = await this.axiosInstance.get('/bank')
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Banks retrieved successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to retrieve banks'
        }
      }
    } catch (error) {
      console.error('Paystack banks retrieval error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve banks'
      }
    }
  }
  
  // Verify bank account
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const response = await this.axiosInstance.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`)
      
      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          message: 'Bank account verified successfully'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to verify bank account'
        }
      }
    } catch (error) {
      console.error('Paystack bank account verification error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify bank account'
      }
    }
  }
  
  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    try {
      const hash = require('crypto')
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex')
      
      return hash === signature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }
  
  // Generate reference
  generateReference(prefix = 'GROCHAIN') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${prefix}_${timestamp}_${random}`.toUpperCase()
  }
  
  // Format amount for display
  formatAmount(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  // Get transaction status
  getTransactionStatus(status) {
    const statusMap = {
      'success': 'completed',
      'failed': 'failed',
      'abandoned': 'cancelled',
      'pending': 'pending'
    }
    
    return statusMap[status] || 'unknown'
  }
}

module.exports = PaystackUtil
