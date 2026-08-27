const Notification = require('../models/notification.model')
const User = require('../models/user.model')
const twilio = require('twilio')
const nodemailer = require('nodemailer')
const { sendEmailViaResend } = require('../utils/resend-direct')

const DEFAULT_NOTIFICATION_CHANNELS = ['in_app', 'email']

const resolveDeliveryChannels = (channels) => {
  const input =
    Array.isArray(channels) && channels.length > 0
      ? channels
      : DEFAULT_NOTIFICATION_CHANNELS
  return [...new Set([...input, 'in_app', 'email'])]
}

class NotificationService {
  constructor() {
    // Initialize Twilio client for SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    }

    // Initialize all configured email providers (SendGrid + SMTP) for failover
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      this.sendgridClient = sgMail
      console.log('✅ SendGrid email service initialized')
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000),
        // Prefer IPv4 — avoids ENETUNREACH on some Windows networks for Gmail SMTP
        family: Number(process.env.SMTP_IP_FAMILY || 4)
      })
      console.log('✅ SMTP email service initialized')
    }

    if (!this.sendgridClient && !this.emailTransporter && !process.env.RESEND_API_KEY) {
      console.warn('⚠️ No email service configured')
    } else if (process.env.RESEND_API_KEY) {
      console.log('✅ Resend email service available (HTTP API)')
    }
  }

  getEmailProviderOrder() {
    const provider = String(process.env.EMAIL_PROVIDER || 'resend').toLowerCase()
    const available = {
      resend: Boolean(process.env.RESEND_API_KEY),
      sendgrid: Boolean(this.sendgridClient),
      smtp: Boolean(this.emailTransporter)
    }

    const preferenceMap = {
      resend: ['resend', 'sendgrid', 'smtp'],
      sendgrid: ['sendgrid', 'resend', 'smtp'],
      smtp: ['resend', 'sendgrid', 'smtp']
    }

    const order = preferenceMap[provider] || preferenceMap.resend
    return order.filter((name) => available[name])
  }

  async sendViaResend(user, notification, emailContent) {
    return sendEmailViaResend(user.email, notification.title, emailContent.html)
  }

  async sendViaSendGrid(user, notification, emailContent) {
    const msg = {
      to: user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
        name: process.env.SENDGRID_FROM_NAME || 'GroChain'
      },
      subject: notification.title,
      html: emailContent.html,
      text: emailContent.text
    }
    return this.sendgridClient.send(msg)
  }

  async sendViaSmtp(user, notification, emailContent) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: notification.title,
      html: emailContent.html,
      text: emailContent.text
    }
    return this.emailTransporter.sendMail(mailOptions)
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const {
        user,
        title,
        message,
        type = 'info',
        category = 'system',
        priority = 'normal',
        channels = DEFAULT_NOTIFICATION_CHANNELS,
        data = {},
        scheduledFor = null,
        expiresAt = null,
        sentBy = null
      } = notificationData

      // Create notification record
      const deliveryChannels = resolveDeliveryChannels(channels)
      const notification = await Notification.create({
        user,
        title,
        message,
        type,
        category,
        priority,
        channels: deliveryChannels.map(channel => ({
          type: channel,
          sent: false,
          sentAt: null,
          error: null
        })),
        data,
        scheduledFor,
        expiresAt,
        sentBy,
        read: false
      })

      // Send immediately if not scheduled
      if (!scheduledFor || scheduledFor <= new Date()) {
        await this.sendNotification(notification)
      }

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Send notification through all specified channels
  async sendNotification(notification) {
    try {
      const user = await User.findById(notification.user)
      if (!user) {
        throw new Error('User not found')
      }

      const results = []
      
      for (const channel of notification.channels) {
        if (channel.sent) continue

        try {
          let result
          switch (channel.type) {
            case 'email':
              result = await this.sendEmail(user, notification)
              break
            case 'sms':
              result = await this.sendSMS(user, notification)
              break
            case 'push':
              result = await this.sendPushNotification(user, notification)
              break
            case 'in_app':
              result = await this.sendInAppNotification(user, notification)
              break
            default:
              console.warn(`Unknown notification channel: ${channel.type}`)
              continue
          }

          // Update channel status
          channel.sent = true
          channel.sentAt = new Date()
          channel.error = null
          
          results.push({ channel: channel.type, success: true, result })
        } catch (error) {
          console.error(`Error sending ${channel.type} notification:`, error)
          channel.error = error.message
          results.push({ channel: channel.type, success: false, error: error.message })
        }
      }

      const inAppChannel = notification.channels.find((c) => c.type === 'in_app')
      const emailChannel = notification.channels.find((c) => c.type === 'email')
      const smsChannel = notification.channels.find((c) => c.type === 'sms')

      notification.deliveryStatus = {
        websocket: Boolean(inAppChannel?.sent),
        email: Boolean(emailChannel?.sent),
        sms: Boolean(smsChannel?.sent),
        timestamp: new Date()
      }

      // Save updated notification
      await notification.save()

      return results
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  // Send email notification (with provider failover)
  async sendEmail(user, notification) {
    if (!user.email) {
      throw new Error('User email not available')
    }

    // Check user preferences
    if (user.notificationPreferences?.email === false) {
      throw new Error('Email notifications disabled by user')
    }

    const providers = this.getEmailProviderOrder()
    if (providers.length === 0) {
      throw new Error('No email service configured')
    }

    const emailContent = this.generateEmailContent(notification)
    let lastError = null

    for (const provider of providers) {
      try {
        if (provider === 'resend') {
          return await this.sendViaResend(user, notification, emailContent)
        }
        if (provider === 'sendgrid') {
          return await this.sendViaSendGrid(user, notification, emailContent)
        }
        return await this.sendViaSmtp(user, notification, emailContent)
      } catch (error) {
        lastError = error
        console.warn(
          `Email via ${provider} failed${providers.length > 1 ? ', trying fallback' : ''}:`,
          error.message
        )
      }
    }

    throw lastError || new Error('Failed to send email')
  }

  // Send SMS notification
  async sendSMS(user, notification) {
    if (!this.twilioClient) {
      throw new Error('SMS service not configured')
    }

    if (!user.phone) {
      throw new Error('User phone not available')
    }

    // Check user preferences
    if (user.notificationPreferences?.sms === false) {
      throw new Error('SMS notifications disabled by user')
    }

    const message = this.generateSMSContent(notification)
    
    const result = await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    })

    return result
  }

  // Send push notification
  async sendPushNotification(user, notification) {
    if (!user.pushToken) {
      throw new Error('User push token not available')
    }

    // Check user preferences
    if (user.notificationPreferences?.push === false) {
      throw new Error('Push notifications disabled by user')
    }

    // This would integrate with Firebase Cloud Messaging or similar
    // For now, we'll simulate the push notification
    const pushData = {
      to: user.pushToken,
      notification: {
        title: notification.title,
        body: notification.message,
        icon: '/icon.png',
        click_action: notification.actionUrl || '/notifications'
      },
      data: {
        notificationId: notification._id.toString(),
        category: notification.category,
        type: notification.type
      }
    }

    // Simulate push notification (replace with actual FCM implementation)
    console.log('Push notification would be sent:', pushData)
    return { success: true, message: 'Push notification sent' }
  }

  // Send in-app notification
  async sendInAppNotification(user, notification) {
    // Persist is already done; emit realtime so the bell updates immediately
    try {
      const webSocketService = require('./websocket.service')
      webSocketService.sendNotificationToUser(user._id || notification.user, {
        _id: notification._id,
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        read: Boolean(notification.read),
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        data: notification.data,
        createdAt: notification.createdAt
      })
    } catch (error) {
      console.warn('In-app websocket emit failed:', error?.message || error)
    }
    return { success: true, message: 'In-app notification stored' }
  }

  // Generate email content
  generateEmailContent(notification) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #166534; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #166534; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.actionUrl ? `<p><a href="${notification.actionUrl}" class="button">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from GroChain</p>
              <p>You can manage your notification preferences in your account settings</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      ${notification.title}
      
      ${notification.message}
      
      ${notification.actionUrl ? `View Details: ${notification.actionUrl}` : ''}
      
      ---
      This is an automated notification from GroChain
      You can manage your notification preferences in your account settings
    `

    return { html, text }
  }

  // Generate SMS content
  generateSMSContent(notification) {
    let message = `${notification.title}: ${notification.message}`
    
    if (notification.actionUrl) {
      message += `\n\nView: ${notification.actionUrl}`
    }
    
    return message
  }

  // Bulk send notifications
  async bulkSendNotifications(notifications) {
    try {
      const results = []
      
      for (const notificationData of notifications) {
        try {
          const notification = await this.createNotification(notificationData)
          results.push({ success: true, notification })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }
      
      return results
    } catch (error) {
      console.error('Error bulk sending notifications:', error)
      throw error
    }
  }

  // Send notification to multiple users
  async sendToMultipleUsers(userIds, notificationData) {
    try {
      const notifications = []
      
      for (const userId of userIds) {
        notifications.push({
          ...notificationData,
          user: userId
        })
      }
      
      return await this.bulkSendNotifications(notifications)
    } catch (error) {
      console.error('Error sending to multiple users:', error)
      throw error
    }
  }

  // Send notification to users by role
  async sendToUsersByRole(role, notificationData) {
    try {
      const users = await User.find({ role }).select('_id')
      const userIds = users.map(user => user._id)
      
      return await this.sendToMultipleUsers(userIds, notificationData)
    } catch (error) {
      console.error('Error sending to users by role:', error)
      throw error
    }
  }

  // Send notification to users by location
  async sendToUsersByLocation(location, notificationData) {
    try {
      const users = await User.find({ location }).select('_id')
      const userIds = users.map(user => user._id)
      
      return await this.sendToMultipleUsers(userIds, notificationData)
    } catch (error) {
      console.error('Error sending to users by location:', error)
      throw error
    }
  }

  // Schedule notification
  async scheduleNotification(notificationData, scheduledFor) {
    try {
      const scheduledNotification = {
        ...notificationData,
        scheduledFor: new Date(scheduledFor)
      }
      
      return await this.createNotification(scheduledNotification)
    } catch (error) {
      console.error('Error scheduling notification:', error)
      throw error
    }
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = new Date()
      const scheduledNotifications = await Notification.find({
        scheduledFor: { $lte: now },
        'channels.sent': false
      })
      
      const results = []
      
      for (const notification of scheduledNotifications) {
        try {
          const result = await this.sendNotification(notification)
          results.push({ notificationId: notification._id, success: true, result })
        } catch (error) {
          results.push({ notificationId: notification._id, success: false, error: error.message })
        }
      }
      
      return results
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
      throw error
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      )
      
      return notification
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds, userId) {
    try {
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, user: userId },
        { read: true, readAt: new Date() }
      )
      
      return result
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error)
      throw error
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      })
      
      return result
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences')
      return user?.notificationPreferences || {}
    } catch (error) {
      console.error('Error getting user preferences:', error)
      throw error
    }
  }

  // Update user notification preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { notificationPreferences: preferences } },
        { new: true, runValidators: true }
      )
      
      return user.notificationPreferences
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  // Get notification statistics
  async getNotificationStats(userId = null, filters = {}) {
    try {
      const query = {}
      if (userId) query.user = userId
      if (filters.category) query.category = filters.category
      if (filters.type) query.type = filters.type
      if (filters.startDate || filters.endDate) {
        query.createdAt = {}
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate)
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate)
      }
      
      const [total, read, unread, byCategory, byType] = await Promise.all([
        Notification.countDocuments(query),
        Notification.countDocuments({ ...query, read: true }),
        Notification.countDocuments({ ...query, read: false }),
        Notification.aggregate([
          { $match: query },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Notification.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ])
      
      return {
        total,
        read,
        unread,
        readRate: total > 0 ? (read / total) * 100 : 0,
        byCategory,
        byType
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      throw error
    }
  }
}

module.exports = new NotificationService()
