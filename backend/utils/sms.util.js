const twilio = require('twilio')
const axios = require('axios')

class SMSUtil {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio'
    
    if (this.provider === 'twilio') {
      this.initializeTwilio()
    } else if (this.provider === 'africastalking') {
      this.initializeAfricasTalking()
    } else if (this.provider === 'termii') {
      this.initializeTermii()
    }
  }
  
  // Initialize Twilio
  initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_FROM_NUMBER
    
    if (!accountSid || !authToken || !fromNumber) {
      console.warn('Twilio credentials not configured, SMS will be disabled')
      this.twilioClient = null
      return
    }
    
    this.twilioClient = twilio(accountSid, authToken)
    this.fromNumber = fromNumber
  }
  
  // Initialize Africa's Talking
  initializeAfricasTalking() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY
    this.username = process.env.AFRICASTALKING_USERNAME
    this.baseURL = 'https://api.africastalking.com/version1'
    
    if (!this.apiKey || !this.username) {
      console.warn('Africa\'s Talking credentials not configured, SMS will be disabled')
      this.apiKey = null
      this.username = null
    }
  }
  
  // Initialize Termii
  initializeTermii() {
    this.apiKey = process.env.TERMII_API_KEY
    this.baseURL = 'https://api.ng.termii.com/api'
    
    if (!this.apiKey) {
      console.warn('Termii credentials not configured, SMS will be disabled')
      this.apiKey = null
    }
  }
  
  // Send SMS using configured provider
  async sendSMS(to, message, options = {}) {
    try {
      // Validate phone number
      const validatedPhone = this.validatePhoneNumber(to)
      if (!validatedPhone) {
        throw new Error('Invalid phone number format')
      }
      
      // Check if SMS is enabled
      if (!this.isSMSEnabled()) {
        console.log('SMS disabled, message would be sent:', { to: validatedPhone, message })
        return {
          success: true,
          messageId: 'sms_disabled',
          message: 'SMS disabled in current environment'
        }
      }
      
      let result
      
      switch (this.provider) {
        case 'twilio':
          result = await this.sendViaTwilio(validatedPhone, message, options)
          break
        case 'africastalking':
          result = await this.sendViaAfricasTalking(validatedPhone, message, options)
          break
        case 'termii':
          result = await this.sendViaTermii(validatedPhone, message, options)
          break
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`)
      }
      
      // Log SMS sent
      this.logSMSSent(validatedPhone, message, result)
      
      return result
    } catch (error) {
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: error.message,
        message: 'Failed to send SMS'
      }
    }
  }
  
  // Send SMS via Twilio
  async sendViaTwilio(to, message, options = {}) {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized')
    }
    
    const messageData = {
      body: message,
      from: options.from || this.fromNumber,
      to: validatedPhone
    }
    
    if (options.mediaUrl) {
      messageData.mediaUrl = options.mediaUrl
    }
    
    const result = await this.twilioClient.messages.create(messageData)
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      provider: 'twilio',
      message: 'SMS sent successfully via Twilio'
    }
  }
  
  // Send SMS via Africa's Talking
  async sendViaAfricasTalking(to, message, options = {}) {
    if (!this.apiKey || !this.username) {
      throw new Error('Africa\'s Talking not configured')
    }
    
    const payload = {
      username: this.username,
      to: to,
      message: message,
      from: options.from || 'GroChain'
    }
    
    const response = await axios.post(`${this.baseURL}/messaging`, payload, {
      headers: {
        'apiKey': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    if (response.data.SMSMessageData) {
      return {
        success: true,
        messageId: response.data.SMSMessageData.Recipients[0]?.messageId,
        status: 'sent',
        provider: 'africastalking',
        message: 'SMS sent successfully via Africa\'s Talking'
      }
    } else {
      throw new Error('Failed to send SMS via Africa\'s Talking')
    }
  }
  
  // Send SMS via Termii
  async sendViaTermii(to, message, options = {}) {
    if (!this.apiKey) {
      throw new Error('Termii not configured')
    }
    
    const payload = {
      api_key: this.apiKey,
      to: to,
      from: options.from || 'GroChain',
      sms: message,
      type: 'plain',
      channel: 'generic'
    }
    
    const response = await axios.post(`${this.baseURL}/sms/send`, payload)
    
    if (response.data.code === 'ok') {
      return {
        success: true,
        messageId: response.data.message_id,
        status: 'sent',
        provider: 'termii',
        message: 'SMS sent successfully via Termii'
      }
    } else {
      throw new Error(`Termii error: ${response.data.message}`)
    }
  }
  
  // Send bulk SMS
  async sendBulkSMS(recipients, message, options = {}) {
    try {
      const results = []
      
      for (const recipient of recipients) {
        const result = await this.sendSMS(recipient.phone, message, {
          ...options,
          recipientId: recipient.id,
          recipientName: recipient.name
        })
        
        results.push({
          recipient,
          result
        })
      }
      
      const successCount = results.filter(r => r.result.success).length
      const failureCount = results.length - successCount
      
      return {
        success: true,
        total: results.length,
        successCount,
        failureCount,
        results,
        message: `Bulk SMS completed: ${successCount} successful, ${failureCount} failed`
      }
    } catch (error) {
      console.error('Bulk SMS error:', error)
      return {
        success: false,
        error: error.message,
        message: 'Failed to send bulk SMS'
      }
    }
  }
  
  // Send OTP SMS
  async sendOTP(phone, otp, options = {}) {
    const message = options.message || `Your GroChain verification code is: ${otp}. Valid for 10 minutes.`
    
    return this.sendSMS(phone, message, {
      ...options,
      type: 'otp',
      priority: 'high'
    })
  }
  
  // Send welcome SMS
  async sendWelcomeSMS(phone, name, options = {}) {
    const message = options.message || `Welcome to GroChain, ${name}! Your account has been successfully created. Start exploring our agricultural marketplace.`
    
    return this.sendSMS(phone, message, {
      ...options,
      type: 'welcome',
      priority: 'normal'
    })
  }
  
  // Send harvest notification
  async sendHarvestNotification(phone, farmerName, cropType, quantity, options = {}) {
    const message = options.message || `Hello ${farmerName}, your ${cropType} harvest of ${quantity} has been successfully logged. Your QR code is ready for tracking.`
    
    return this.sendSMS(phone, message, {
      ...options,
      type: 'harvest_notification',
      priority: 'normal'
    })
  }
  
  // Send payment notification
  async sendPaymentNotification(phone, farmerName, amount, orderId, options = {}) {
    const message = options.message || `Hello ${farmerName}, payment of ${amount} for order ${orderId} has been received. Your funds will be processed within 24 hours.`
    
    return this.sendSMS(phone, message, {
      ...options,
      type: 'payment_notification',
      priority: 'high'
    })
  }
  
  // Send reminder SMS
  async sendReminderSMS(phone, message, options = {}) {
    return this.sendSMS(phone, message, {
      ...options,
      type: 'reminder',
      priority: 'normal'
    })
  }
  
  // Validate phone number
  validatePhoneNumber(phone) {
    if (!phone) return null
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle Nigerian numbers
    if (cleaned.startsWith('234')) {
      cleaned = cleaned.substring(3)
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // Check if it's a valid Nigerian number (10 digits starting with 7, 8, or 9)
    if (cleaned.length === 10 && /^[789]\d{9}$/.test(cleaned)) {
      return `+234${cleaned}`
    }
    
    // Check if it's already in international format
    if (phone.startsWith('+') && /^\+\d{10,15}$/.test(phone)) {
      return phone
    }
    
    return null
  }
  
  // Check if SMS is enabled
  isSMSEnabled() {
    if (process.env.NODE_ENV === 'test') return false
    if (process.env.DISABLE_SMS === 'true') return false
    
    switch (this.provider) {
      case 'twilio':
        return !!this.twilioClient
      case 'africastalking':
        return !!(this.apiKey && this.username)
      case 'termii':
        return !!this.apiKey
      default:
        return false
    }
  }
  
  // Log SMS sent
  logSMSSent(phone, message, result) {
    const logData = {
      timestamp: new Date().toISOString(),
      phone,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      provider: this.provider,
      result,
      environment: process.env.NODE_ENV
    }
    
    console.log('SMS Sent:', logData)
    
    // You can also save to database or external logging service here
  }
  
  // Get SMS balance (if supported by provider)
  async getSMSBalance() {
    try {
      switch (this.provider) {
        case 'twilio':
          if (!this.twilioClient) throw new Error('Twilio not configured')
          const account = await this.twilioClient.api.accounts(this.twilioClient.accountSid).fetch()
          return {
            success: true,
            balance: account.balance,
            currency: account.currency,
            provider: 'twilio'
          }
        
        case 'africastalking':
          if (!this.apiKey || !this.username) throw new Error('Africa\'s Talking not configured')
          const response = await axios.get(`${this.baseURL}/user`, {
            headers: { 'apiKey': this.apiKey }
          })
          return {
            success: true,
            balance: response.data.balance,
            currency: 'KES',
            provider: 'africastalking'
          }
        
        default:
          return {
            success: false,
            message: 'Balance checking not supported for this provider'
          }
      }
    } catch (error) {
      console.error('Error getting SMS balance:', error)
      return {
        success: false,
        error: error.message,
        message: 'Failed to get SMS balance'
      }
    }
  }
  
  // Get delivery status
  async getDeliveryStatus(messageId) {
    try {
      switch (this.provider) {
        case 'twilio':
          if (!this.twilioClient) throw new Error('Twilio not configured')
          const message = await this.twilioClient.messages(messageId).fetch()
          return {
            success: true,
            messageId,
            status: message.status,
            provider: 'twilio'
          }
        
        default:
          return {
            success: false,
            message: 'Delivery status checking not supported for this provider'
          }
      }
    } catch (error) {
      console.error('Error getting delivery status:', error)
      return {
        success: false,
        error: error.message,
        message: 'Failed to get delivery status'
      }
    }
  }
}

module.exports = SMSUtil

