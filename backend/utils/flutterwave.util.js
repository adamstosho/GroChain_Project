const axios = require('axios')
// crypto is built-in to Node.js, no need to require it

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
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })
  }
  
  // Initialize transaction
  async initializeTransaction(data) {
    try {
      const payload = {
        tx_ref: data.reference,
        amount: data.amount,
        currency: data.currency || 'NGN',
        redirect_url: data.callbackUrl,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: data.email,
          phonenumber: data.phone || '',
          name: data.customerName || ''
        },
        customizations: {
          title: 'GroChain Payment',
          description: `Payment for order ${data.orderId}`,
          logo: 'https://your-domain.com/logo.png'
        },
        meta: {
          order_id: data.orderId,
          customer_name: data.customerName
        }
      }
      
      const response = await this.axiosInstance.post('/payments', payload)
      
      if (response.data.status === 'success') {
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
      console.error('Flutterwave initialization error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initialize transaction'
      }
    }
  }
  
  // Verify transaction
  async verifyTransaction(transactionId) {
    try {
      const response = await this.axiosInstance.get(`/transactions/${transactionId}/verify`)
      
      if (response.data.status === 'success') {
        const transaction = response.data.data
        
        // Check if transaction is successful
        if (transaction.status === 'successful') {
          return {
            success: true,
            data: {
              reference: transaction.tx_ref,
              amount: transaction.amount,
              currency: transaction.currency,
              status: transaction.status,
              gateway_response: transaction.processor_response,
              paid_at: transaction.created_at,
              channel: transaction.payment_type,
              ip_address: transaction.ip,
              fees: transaction.charged_amount - transaction.amount,
              customer: transaction.customer,
              metadata: transaction.meta
            },
            message: 'Transaction verified successfully'
          }
        } else {
          return {
            success: false,
            message: `Transaction failed: ${transaction.processor_response}`,
            data: {
              reference: transaction.tx_ref,
              status: transaction.status,
              gateway_response: transaction.processor_response
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
      console.error('Flutterwave verification error:', error.response?.data || error.message)
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
        name: `${data.firstName} ${data.lastName}`,
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
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to create customer'
        }
      }
    } catch (error) {
      console.error('Flutterwave customer creation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer'
      }
    }
  }
  
  // Get customer
  async getCustomer(customerId) {
    try {
      const response = await this.axiosInstance.get(`/customers/${customerId}`)
      
      if (response.data.status === 'success') {
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
      console.error('Flutterwave customer retrieval error:', error.response?.data || error.message)
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
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initiate transfer'
        }
      }
    } catch (error) {
      console.error('Flutterwave transfer initiation error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate transfer'
      }
    }
  }
  
  // Get banks list
  async getBanks() {
    try {
      const response = await this.axiosInstance.get('/banks/NG')
      
      if (response.data.status === 'success') {
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
      console.error('Flutterwave banks retrieval error:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve banks'
      }
    }
  }
  
  // Verify bank account
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const payload = {
        account_number: accountNumber,
        account_bank: bankCode
      }
      
      const response = await this.axiosInstance.post('/accounts/resolve', payload)
      
      if (response.data.status === 'success') {
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
      console.error('Flutterwave bank account verification error:', error.response?.data || error.message)
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
        .createHmac('sha256', this.secretKey)
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
      'successful': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'pending': 'pending'
    }
    
    return statusMap[status] || 'unknown'
  }
}

module.exports = FlutterwaveUtil


