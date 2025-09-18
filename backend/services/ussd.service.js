const axios = require('axios')
const crypto = require('crypto')
const User = require('../models/user.model')
const Transaction = require('../models/transaction.model')
const Payment = require('../models/payment.model')

class USSDService {
  constructor() {
    this.providers = {
      mtn: {
        baseUrl: process.env.MTN_USSD_URL || 'https://api.mtn.com/ussd',
        apiKey: process.env.MTN_API_KEY,
        secretKey: process.env.MTN_SECRET_KEY
      },
      airtel: {
        baseUrl: process.env.AIRTEL_USSD_URL || 'https://api.airtel.com/ussd',
        apiKey: process.env.AIRTEL_API_KEY,
        secretKey: process.env.AIRTEL_SECRET_KEY
      },
      glo: {
        baseUrl: process.env.GLO_USSD_URL || 'https://api.glo.com/ussd',
        apiKey: process.env.GLO_API_KEY,
        secretKey: process.env.GLO_SECRET_KEY
      },
      '9mobile': {
        baseUrl: process.env.NINEMOBILE_USSD_URL || 'https://api.9mobile.com/ussd',
        apiKey: process.env.NINEMOBILE_API_KEY,
        secretKey: process.env.NINEMOBILE_SECRET_KEY
      }
    }
    
    this.sessionTimeout = 300000 // 5 minutes
    this.activeSessions = new Map()
  }

  // Initialize USSD session
  async initializeSession(phoneNumber, provider, sessionId) {
    try {
      // Check if user exists
      const user = await User.findOne({ phone: phoneNumber })
      
      if (!user) {
        return this.generateResponse(
          'Welcome to GroChain!\n\n1. Register\n2. Login\n3. Help\n\nReply with option number',
          'CON'
        )
      }

      // Create session
      const session = {
        sessionId,
        phoneNumber,
        provider,
        userId: user._id,
        currentMenu: 'main',
        data: {},
        startTime: Date.now(),
        lastActivity: Date.now()
      }

      this.activeSessions.set(sessionId, session)

      return this.generateResponse(
        `Welcome back ${user.name}!\n\n1. Check Balance\n2. Send Money\n3. Buy Airtime\n4. Pay Bills\n5. My Account\n6. Help\n\nReply with option number`,
        'CON'
      )
    } catch (error) {
      console.error('Error initializing USSD session:', error)
      return this.generateResponse(
        'Sorry, service temporarily unavailable. Please try again later.',
        'END'
      )
    }
  }

  // Process USSD input
  async processInput(sessionId, userInput, phoneNumber, provider) {
    try {
      const session = this.activeSessions.get(sessionId)
      
      if (!session) {
        return this.generateResponse(
          'Session expired. Please dial *123# again.',
          'END'
        )
      }

      // Update last activity
      session.lastActivity = Date.now()
      session.data.lastInput = userInput

      // Process based on current menu
      switch (session.currentMenu) {
        case 'main':
          return await this.processMainMenu(session, userInput)
        case 'register':
          return await this.processRegistration(session, userInput)
        case 'login':
          return await this.processLogin(session, userInput)
        case 'balance':
          return await this.processBalance(session, userInput)
        case 'send_money':
          return await this.processSendMoney(session, userInput)
        case 'buy_airtime':
          return await this.processBuyAirtime(session, userInput)
        case 'pay_bills':
          return await this.processPayBills(session, userInput)
        case 'account':
          return await this.processAccount(session, userInput)
        case 'help':
          return await this.processHelp(session, userInput)
        default:
          return this.generateResponse(
            'Invalid option. Please try again.',
            'CON'
          )
      }
    } catch (error) {
      console.error('Error processing USSD input:', error)
      return this.generateResponse(
        'Sorry, an error occurred. Please try again.',
        'END'
      )
    }
  }

  // Process main menu
  async processMainMenu(session, userInput) {
    switch (userInput) {
      case '1':
        session.currentMenu = 'balance'
        return this.generateResponse(
          'Enter your PIN to check balance:',
          'CON'
        )
      case '2':
        session.currentMenu = 'send_money'
        return this.generateResponse(
          'Enter recipient phone number:',
          'CON'
        )
      case '3':
        session.currentMenu = 'buy_airtime'
        return this.generateResponse(
          'Enter phone number for airtime:',
          'CON'
        )
      case '4':
        session.currentMenu = 'pay_bills'
        return this.generateResponse(
          'Select bill type:\n\n1. Electricity\n2. Water\n3. Internet\n4. TV Subscription\n\nReply with option number',
          'CON'
        )
      case '5':
        session.currentMenu = 'account'
        return this.generateResponse(
          'Account Options:\n\n1. Change PIN\n2. View Profile\n3. Transaction History\n4. Back to Main Menu\n\nReply with option number',
          'CON'
        )
      case '6':
        session.currentMenu = 'help'
        return this.generateResponse(
          'Help & Support:\n\n1. Contact Support\n2. FAQs\n3. Back to Main Menu\n\nReply with option number',
          'CON'
        )
      default:
        return this.generateResponse(
          'Invalid option. Please select 1-6:',
          'CON'
        )
    }
  }

  // Process registration
  async processRegistration(session, userInput) {
    if (!session.data.step) {
      session.data.step = 'name'
      return this.generateResponse(
        'Enter your full name:',
        'CON'
      )
    }

    switch (session.data.step) {
      case 'name':
        session.data.name = userInput
        session.data.step = 'email'
        return this.generateResponse(
          'Enter your email address:',
          'CON'
        )
      case 'email':
        session.data.email = userInput
        session.data.step = 'pin'
        return this.generateResponse(
          'Create a 4-digit PIN:',
          'CON'
        )
      case 'pin':
        if (userInput.length !== 4 || !/^\d+$/.test(userInput)) {
          return this.generateResponse(
            'PIN must be 4 digits. Please try again:',
            'CON'
          )
        }
        session.data.pin = userInput
        session.data.step = 'confirm_pin'
        return this.generateResponse(
          'Confirm your PIN:',
          'CON'
        )
      case 'confirm_pin':
        if (userInput !== session.data.pin) {
          session.data.step = 'pin'
          return this.generateResponse(
            'PINs do not match. Please try again:',
            'CON'
          )
        }
        
        // Create user
        try {
          const user = new User({
            name: session.data.name,
            email: session.data.email,
            phone: session.phoneNumber,
            pin: this.hashPIN(session.data.pin),
            role: 'farmer',
            emailVerified: false,
            phoneVerified: true
          })
          
          await user.save()
          session.userId = user._id
          
          return this.generateResponse(
            `Registration successful! Welcome ${session.data.name}.\n\nYou can now use all GroChain services.`,
            'END'
          )
        } catch (error) {
          console.error('Error creating user:', error)
          return this.generateResponse(
            'Registration failed. Please try again later.',
            'END'
          )
        }
    }
  }

  // Process login
  async processLogin(session, userInput) {
    if (!session.data.step) {
      session.data.step = 'pin'
      return this.generateResponse(
        'Enter your 4-digit PIN:',
        'CON'
      )
    }

    if (session.data.step === 'pin') {
      try {
        const user = await User.findOne({ phone: session.phoneNumber })
        
        if (!user || !this.verifyPIN(userInput, user.pin)) {
          return this.generateResponse(
            'Invalid PIN. Please try again:',
            'CON'
          )
        }

        session.userId = user._id
        session.currentMenu = 'main'
        
        return this.generateResponse(
          `Welcome back ${user.name}!\n\n1. Check Balance\n2. Send Money\n3. Buy Airtime\n4. Pay Bills\n5. My Account\n6. Help\n\nReply with option number`,
          'CON'
        )
      } catch (error) {
        console.error('Error during login:', error)
        return this.generateResponse(
          'Login failed. Please try again.',
          'END'
        )
      }
    }
  }

  // Process balance check
  async processBalance(session, userInput) {
    if (!session.data.pinVerified) {
      try {
        const user = await User.findById(session.userId)
        
        if (!this.verifyPIN(userInput, user.pin)) {
          return this.generateResponse(
            'Invalid PIN. Please try again:',
            'CON'
          )
        }

        session.data.pinVerified = true
        
        // Get user's balance
        const balance = await this.getUserBalance(session.userId)
        
        return this.generateResponse(
          `Your current balance: ₦${balance.toFixed(2)}\n\n1. Back to Main Menu\n2. End Session`,
          'CON'
        )
      } catch (error) {
        console.error('Error checking balance:', error)
        return this.generateResponse(
          'Error checking balance. Please try again.',
          'END'
        )
      }
    } else {
      switch (userInput) {
        case '1':
          session.currentMenu = 'main'
          session.data.pinVerified = false
          return this.generateResponse(
            '1. Check Balance\n2. Send Money\n3. Buy Airtime\n4. Pay Bills\n5. My Account\n6. Help\n\nReply with option number',
            'CON'
          )
        case '2':
          return this.generateResponse(
            'Thank you for using GroChain USSD. Goodbye!',
            'END'
          )
        default:
          return this.generateResponse(
            'Invalid option. Please select 1 or 2:',
            'CON'
          )
      }
    }
  }

  // Process send money
  async processSendMoney(session, userInput) {
    if (!session.data.step) {
      session.data.step = 'recipient'
      return this.generateResponse(
        'Enter recipient phone number:',
        'CON'
      )
    }

    switch (session.data.step) {
      case 'recipient':
        if (!this.isValidPhoneNumber(userInput)) {
          return this.generateResponse(
            'Invalid phone number. Please try again:',
            'CON'
          )
        }
        
        session.data.recipient = userInput
        session.data.step = 'amount'
        return this.generateResponse(
          'Enter amount to send (₦):',
          'CON'
        )
      case 'amount':
        const amount = parseFloat(userInput)
        if (isNaN(amount) || amount <= 0) {
          return this.generateResponse(
            'Invalid amount. Please enter a valid amount:',
            'CON'
          )
        }
        
        session.data.amount = amount
        session.data.step = 'pin'
        return this.generateResponse(
          `Send ₦${amount} to ${session.data.recipient}?\n\nEnter your PIN to confirm:`,
          'CON'
        )
      case 'pin':
        try {
          const user = await User.findById(session.userId)
          
          if (!this.verifyPIN(userInput, user.pin)) {
            return this.generateResponse(
              'Invalid PIN. Please try again:',
              'CON'
            )
          }

          // Process the transfer
          const result = await this.processTransfer(
            session.userId,
            session.data.recipient,
            session.data.amount,
            session.provider
          )

          if (result.success) {
            return this.generateResponse(
              `Transfer successful!\n\nAmount: ₦${session.data.amount}\nRecipient: ${session.data.recipient}\nReference: ${result.reference}\n\nThank you for using GroChain!`,
              'END'
            )
          } else {
            return this.generateResponse(
              `Transfer failed: ${result.error}\n\nPlease try again later.`,
              'END'
            )
          }
        } catch (error) {
          console.error('Error processing transfer:', error)
          return this.generateResponse(
            'Transfer failed. Please try again later.',
            'END'
          )
        }
    }
  }

  // Process buy airtime
  async processBuyAirtime(session, userInput) {
    if (!session.data.step) {
      session.data.step = 'phone'
      return this.generateResponse(
        'Enter phone number for airtime:',
        'CON'
      )
    }

    switch (session.data.step) {
      case 'phone':
        if (!this.isValidPhoneNumber(userInput)) {
          return this.generateResponse(
            'Invalid phone number. Please try again:',
            'CON'
          )
        }
        
        session.data.phone = userInput
        session.data.step = 'amount'
        return this.generateResponse(
          'Enter airtime amount (₦):',
          'CON'
        )
      case 'amount':
        const amount = parseFloat(userInput)
        if (isNaN(amount) || amount < 50 || amount > 10000) {
          return this.generateResponse(
            'Amount must be between ₦50 and ₦10,000. Please try again:',
            'CON'
          )
        }
        
        session.data.amount = amount
        session.data.step = 'pin'
        return this.generateResponse(
          `Buy ₦${amount} airtime for ${session.data.phone}?\n\nEnter your PIN to confirm:`,
          'CON'
        )
      case 'pin':
        try {
          const user = await User.findById(session.userId)
          
          if (!this.verifyPIN(userInput, user.pin)) {
            return this.generateResponse(
              'Invalid PIN. Please try again:',
              'CON'
            )
          }

          // Process airtime purchase
          const result = await this.processAirtimePurchase(
            session.userId,
            session.data.phone,
            session.data.amount,
            session.provider
          )

          if (result.success) {
            return this.generateResponse(
              `Airtime purchase successful!\n\nAmount: ₦${session.data.amount}\nPhone: ${session.data.phone}\nReference: ${result.reference}\n\nThank you for using GroChain!`,
              'END'
            )
          } else {
            return this.generateResponse(
              `Airtime purchase failed: ${result.error}\n\nPlease try again later.`,
              'END'
            )
          }
        } catch (error) {
          console.error('Error processing airtime purchase:', error)
          return this.generateResponse(
            'Airtime purchase failed. Please try again later.',
            'END'
          )
        }
    }
  }

  // Process pay bills
  async processPayBills(session, userInput) {
    if (!session.data.step) {
      session.data.step = 'bill_type'
      return this.generateResponse(
        'Select bill type:\n\n1. Electricity\n2. Water\n3. Internet\n4. TV Subscription\n\nReply with option number',
        'CON'
      )
    }

    switch (session.data.step) {
      case 'bill_type':
        const billTypes = ['electricity', 'water', 'internet', 'tv']
        const selectedType = billTypes[parseInt(userInput) - 1]
        
        if (!selectedType) {
          return this.generateResponse(
            'Invalid option. Please select 1-4:',
            'CON'
          )
        }
        
        session.data.billType = selectedType
        session.data.step = 'meter_number'
        return this.generateResponse(
          `Enter ${selectedType} meter/account number:`,
          'CON'
        )
      case 'meter_number':
        session.data.meterNumber = userInput
        session.data.step = 'amount'
        return this.generateResponse(
          'Enter bill amount (₦):',
          'CON'
        )
      case 'amount':
        const amount = parseFloat(userInput)
        if (isNaN(amount) || amount <= 0) {
          return this.generateResponse(
            'Invalid amount. Please enter a valid amount:',
            'CON'
          )
        }
        
        session.data.amount = amount
        session.data.step = 'pin'
        return this.generateResponse(
          `Pay ₦${amount} for ${session.data.billType}?\n\nMeter/Account: ${session.data.meterNumber}\n\nEnter your PIN to confirm:`,
          'CON'
        )
      case 'pin':
        try {
          const user = await User.findById(session.userId)
          
          if (!this.verifyPIN(userInput, user.pin)) {
            return this.generateResponse(
              'Invalid PIN. Please try again:',
              'CON'
            )
          }

          // Process bill payment
          const result = await this.processBillPayment(
            session.userId,
            session.data.billType,
            session.data.meterNumber,
            session.data.amount,
            session.provider
          )

          if (result.success) {
            return this.generateResponse(
              `Bill payment successful!\n\nType: ${session.data.billType}\nAmount: ₦${session.data.amount}\nReference: ${result.reference}\n\nThank you for using GroChain!`,
              'END'
            )
          } else {
            return this.generateResponse(
              `Bill payment failed: ${result.error}\n\nPlease try again later.`,
              'END'
            )
          }
        } catch (error) {
          console.error('Error processing bill payment:', error)
          return this.generateResponse(
            'Bill payment failed. Please try again later.',
            'END'
          )
        }
    }
  }

  // Process account operations
  async processAccount(session, userInput) {
    switch (userInput) {
      case '1':
        session.currentMenu = 'change_pin'
        return this.generateResponse(
          'Enter current PIN:',
          'CON'
        )
      case '2':
        try {
          const user = await User.findById(session.userId)
          return this.generateResponse(
            `Profile Information:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\nRole: ${user.role}\n\n1. Back to Account\n2. Main Menu`,
            'CON'
          )
        } catch (error) {
          return this.generateResponse(
            'Error loading profile. Please try again.',
            'END'
          )
        }
      case '3':
        session.currentMenu = 'transaction_history'
        return this.generateResponse(
          'Select period:\n\n1. Last 5 transactions\n2. Last 10 transactions\n3. This month\n4. Last month\n\nReply with option number',
          'CON'
        )
      case '4':
        session.currentMenu = 'main'
        return this.generateResponse(
          '1. Check Balance\n2. Send Money\n3. Buy Airtime\n4. Pay Bills\n5. My Account\n6. Help\n\nReply with option number',
          'CON'
        )
      default:
        return this.generateResponse(
          'Invalid option. Please select 1-4:',
          'CON'
        )
    }
  }

  // Process help
  async processHelp(session, userInput) {
    switch (userInput) {
      case '1':
        return this.generateResponse(
          'Contact Support:\n\nPhone: +234-800-GROCHAIN\nEmail: support@grochain.com\nHours: 24/7\n\nThank you for using GroChain!',
          'END'
        )
      case '2':
        return this.generateResponse(
          'Frequently Asked Questions:\n\n1. How to register?\n2. How to send money?\n3. How to buy airtime?\n4. How to pay bills?\n\nReply with question number:',
          'CON'
        )
      case '3':
        session.currentMenu = 'main'
        return this.generateResponse(
          '1. Check Balance\n2. Send Money\n3. Buy Airtime\n4. Pay Bills\n5. My Account\n6. Help\n\nReply with option number',
          'CON'
        )
      default:
        return this.generateResponse(
          'Invalid option. Please select 1-3:',
          'CON'
        )
    }
  }

  // Generate USSD response
  generateResponse(message, sessionStatus) {
    return {
      message,
      sessionStatus,
      timestamp: new Date().toISOString()
    }
  }

  // Hash PIN for security
  hashPIN(pin) {
    return crypto.createHash('sha256').update(pin + this.secretKey).digest('hex')
  }

  // Verify PIN
  verifyPIN(inputPin, hashedPIN) {
    const inputHash = this.hashPIN(inputPin)
    return inputHash === hashedPIN
  }

  // Validate phone number
  isValidPhoneNumber(phone) {
    const phoneRegex = /^(\+234|0)?[789][01]\d{8}$/
    return phoneRegex.test(phone)
  }

  // Get user balance
  async getUserBalance(userId) {
    try {
      const user = await User.findById(userId)
      return user.balance || 0
    } catch (error) {
      console.error('Error getting user balance:', error)
      return 0
    }
  }

  // Process money transfer
  async processTransfer(senderId, recipientPhone, amount, provider) {
    try {
      // Check sender balance
      const sender = await User.findById(senderId)
      if (sender.balance < amount) {
        return { success: false, error: 'Insufficient balance' }
      }

      // Find recipient
      const recipient = await User.findOne({ phone: recipientPhone })
      if (!recipient) {
        return { success: false, error: 'Recipient not found' }
      }

      // Process through provider
      const providerConfig = this.providers[provider]
      if (!providerConfig) {
        return { success: false, error: 'Provider not supported' }
      }

      // Create transaction record
      const transaction = new Transaction({
        sender: senderId,
        recipient: recipient._id,
        amount,
        type: 'transfer',
        status: 'pending',
        provider,
        reference: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })

      await transaction.save()

      // Update balances
      sender.balance -= amount
      recipient.balance += amount

      await Promise.all([sender.save(), recipient.save()])

      // Update transaction status
      transaction.status = 'completed'
      await transaction.save()

      return {
        success: true,
        reference: transaction.reference,
        transactionId: transaction._id
      }
    } catch (error) {
      console.error('Error processing transfer:', error)
      return { success: false, error: 'Transfer failed' }
    }
  }

  // Process airtime purchase
  async processAirtimePurchase(userId, phone, amount, provider) {
    try {
      const user = await User.findById(userId)
      if (user.balance < amount) {
        return { success: false, error: 'Insufficient balance' }
      }

      // Process through provider
      const providerConfig = this.providers[provider]
      if (!providerConfig) {
        return { success: false, error: 'Provider not supported' }
      }

      // Create transaction record
      const transaction = new Transaction({
        sender: userId,
        recipient: phone,
        amount,
        type: 'airtime',
        status: 'pending',
        provider,
        reference: `AIRTIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })

      await transaction.save()

      // Deduct balance
      user.balance -= amount
      await user.save()

      // Update transaction status
      transaction.status = 'completed'
      await transaction.save()

      return {
        success: true,
        reference: transaction.reference,
        transactionId: transaction._id
      }
    } catch (error) {
      console.error('Error processing airtime purchase:', error)
      return { success: false, error: 'Airtime purchase failed' }
    }
  }

  // Process bill payment
  async processBillPayment(userId, billType, meterNumber, amount, provider) {
    try {
      const user = await User.findById(userId)
      if (user.balance < amount) {
        return { success: false, error: 'Insufficient balance' }
      }

      // Process through provider
      const providerConfig = this.providers[provider]
      if (!providerConfig) {
        return { success: false, error: 'Provider not supported' }
      }

      // Create transaction record
      const transaction = new Transaction({
        sender: userId,
        recipient: `${billType}_${meterNumber}`,
        amount,
        type: 'bill_payment',
        status: 'pending',
        provider,
        reference: `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })

      await transaction.save()

      // Deduct balance
      user.balance -= amount
      await user.save()

      // Update transaction status
      transaction.status = 'completed'
      await transaction.save()

      return {
        success: true,
        reference: transaction.reference,
        transactionId: transaction._id
      }
    } catch (error) {
      console.error('Error processing bill payment:', error)
      return { success: false, error: 'Bill payment failed' }
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = Date.now()
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  // Get session statistics
  getSessionStats() {
    return {
      totalSessions: this.activeSessions.size,
      activeSessions: Array.from(this.activeSessions.values()).map(session => ({
        sessionId: session.sessionId,
        phoneNumber: session.phoneNumber,
        provider: session.provider,
        currentMenu: session.currentMenu,
        startTime: session.startTime,
        lastActivity: session.lastActivity
      }))
    }
  }
}

module.exports = new USSDService()
