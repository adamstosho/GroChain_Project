const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const Notification = require('../models/notification.model')
const mongoose = require('mongoose')

class WebSocketService {
  constructor() {
    this.io = null
    this.connectedUsers = new Map() // userId -> socketId
    this.userSockets = new Map() // userId -> socket
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:4000",
          "http://localhost:5000",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://127.0.0.1:3002",
          "http://127.0.0.1:4000",
          "http://127.0.0.1:5000"
        ],
        methods: ["GET", "POST"],
        credentials: true
      },
      // Add path for notifications WebSocket endpoint
      path: '/notifications',
      transports: ['websocket', 'polling'],
      connectTimeout: Number(process.env.WS_CONNECT_TIMEOUT_MS || 10000),
      pingTimeout: Number(process.env.WS_PING_TIMEOUT_MS || 25000),
      pingInterval: Number(process.env.WS_PING_INTERVAL_MS || 20000)
    })

    this.setupMiddleware()
    this.setupEventHandlers()

    // Add error handling for the WebSocket server
    this.io.on('connection_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
    })

    this.io.on('connect_error', (error) => {
      console.error('🔌 WebSocket connect error:', error)
    })

    // Enable built-in retries on the client; here we emit guidance on retry
    this.io.on('reconnect_attempt', (attempt) => {
      console.log('🔌 WebSocket reconnect attempt:', attempt)
    })

    console.log('🔌 WebSocket service initialized')
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        console.log('🔌 WebSocket authentication attempt')
        console.log('🔌 Socket handshake auth:', socket.handshake.auth)
        console.log('🔌 Socket handshake headers:', socket.handshake.headers)

        // Try multiple ways to get the token
        let token = socket.handshake.auth?.token

        // Check query parameters (for WebSocket URL with token)
        if (!token && socket.handshake.query?.token) {
          token = socket.handshake.query.token
        }

        // Check authorization header
        if (!token && socket.handshake.headers?.authorization) {
          token = socket.handshake.headers.authorization.replace('Bearer ', '')
        }

        console.log('🔌 Extracted token:', token ? `${token.substring(0, 20)}...` : 'No token')

        if (!token) {
          console.log('🔌 Authentication failed: No token provided')
          return next(new Error('Authentication token required'))
        }

        // Verify JWT token
        let decoded
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET)
          console.log('🔌 JWT decoded successfully:', { id: decoded.id, email: decoded.email, role: decoded.role })
        } catch (jwtError) {
          console.log('🔌 JWT verification failed:', jwtError.message)
          return next(new Error('Invalid authentication token'))
        }

        const user = await User.findById(decoded.id).select('_id name email role status')
        console.log('🔌 User lookup result:', user ? { id: user._id, name: user.name, role: user.role, status: user.status } : 'User not found')

        if (!user || user.status !== 'active') {
          console.log('🔌 Authentication failed: Invalid or inactive user')
          return next(new Error('Invalid or inactive user'))
        }

        socket.user = user
        console.log('🔌 Authentication successful for user:', user.name)
        next()
      } catch (error) {
        console.log('🔌 Authentication failed with error:', error.message)
        next(new Error('Authentication failed'))
      }
    })
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket connection established`)
      console.log(`🔌 Socket ID: ${socket.id}`)
      console.log(`🔌 User: ${socket.user?.name || 'Unknown'} (${socket.user?._id || 'No ID'})`)
      console.log(`🔌 Connection details:`, {
        remoteAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        origin: socket.handshake.headers.origin,
        auth: socket.handshake.auth ? 'Present' : 'Missing',
        query: socket.handshake.query ? 'Present' : 'Missing'
      })

      // Store user connection
      this.connectedUsers.set(socket.user._id.toString(), socket.id)
      this.userSockets.set(socket.user._id.toString(), socket)

      // Join user to role-based room
      socket.join(`role:${socket.user.role}`)
      
      // Join user to personal room
      socket.join(`user:${socket.user._id}`)

      // Handle user joining specific rooms
      socket.on('join-room', (roomName) => {
        socket.join(roomName)
        console.log(`👥 User ${socket.user.name} joined room: ${roomName}`)
      })

      // Handle user leaving rooms
      socket.on('leave-room', (roomName) => {
        socket.leave(roomName)
        console.log(`👋 User ${socket.user.name} left room: ${roomName}`)
      })

      // Handle private messages
      socket.on('private-message', async (data) => {
        try {
          const { recipientId, message, type = 'text' } = data
          
          if (!recipientId || !message) {
            return socket.emit('error', { message: 'Recipient ID and message are required' })
          }

          // Check if recipient is online
          const recipientSocketId = this.connectedUsers.get(recipientId)
          
          if (recipientSocketId) {
            // Send real-time message
            this.io.to(recipientSocketId).emit('private-message', {
              senderId: socket.user._id,
              senderName: socket.user.name,
              message,
              type,
              timestamp: new Date()
            })
          }

          // Store message in database (you can create a Message model for this)
          // await Message.create({
          //   sender: socket.user._id,
          //   recipient: recipientId,
          //   message,
          //   type
          // })

          // Confirm message sent
          socket.emit('message-sent', { 
            recipientId, 
            message, 
            timestamp: new Date() 
          })
        } catch (error) {
          console.error('Error sending private message:', error)
          socket.emit('error', { message: 'Failed to send message' })
        }
      })

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { recipientId } = data
        const recipientSocketId = this.connectedUsers.get(recipientId)
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('typing-start', {
            userId: socket.user._id,
            userName: socket.user.name
          })
        }
      })

      socket.on('typing-stop', (data) => {
        const { recipientId } = data
        const recipientSocketId = this.connectedUsers.get(recipientId)
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('typing-stop', {
            userId: socket.user._id
          })
        }
      })

      // Handle harvest updates
      socket.on('harvest-update', (data) => {
        const { harvestId, status, message } = data
        
        // Broadcast to relevant users (farmers, partners, admins)
        this.io.to('role:farmer').to('role:partner').to('role:admin').emit('harvest-update', {
          harvestId,
          status,
          message,
          updatedBy: socket.user._id,
          updatedBy: socket.user.name,
          timestamp: new Date()
        })
      })

      // Handle marketplace updates
      socket.on('marketplace-update', (data) => {
        const { type, listingId, message } = data
        
        // Broadcast to all users
        this.io.emit('marketplace-update', {
          type,
          listingId,
          message,
          updatedBy: socket.user._id,
          updatedBy: socket.user.name,
          timestamp: new Date()
        })
      })

      // Handle shipment updates
      socket.on('shipment-update', (data) => {
        const { shipmentId, status, location, message } = data
        
        // Broadcast to relevant users
        this.io.to('role:buyer').to('role:farmer').to('role:partner').emit('shipment-update', {
          shipmentId,
          status,
          location,
          message,
          updatedBy: socket.user._id,
          updatedBy: socket.user.name,
          timestamp: new Date()
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.user.name} (${socket.user._id})`)
        
        // Remove user connection
        this.connectedUsers.delete(socket.user._id.toString())
        this.userSockets.delete(socket.user._id.toString())
      })
    })
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString())

    if (socketId) {
      this.io.to(socketId).emit('notification', notification)
      return true
    }

    return false
  }

  // Emit to specific user (alias for sendNotificationToUser)
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId.toString())

    if (socketId) {
      this.io.to(socketId).emit(event, data)
      return true
    }

    return false
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds, notification) {
    const sentCount = userIds.filter(userId => 
      this.sendNotificationToUser(userId, notification)
    ).length
    
    return sentCount
  }

  // Send notification to users by role
  sendNotificationToRole(role, notification) {
    this.io.to(`role:${role}`).emit('notification', notification)
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    this.io.emit(event, data)
  }

  // Send to specific room
  sendToRoom(roomName, event, data) {
    this.io.to(roomName).emit(event, data)
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size
  }

  // Get online users by role
  getOnlineUsersByRole(role) {
    const users = []
    
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      const socket = this.userSockets.get(userId)
      if (socket && socket.user.role === role) {
        users.push({
          userId,
          name: socket.user.name,
          email: socket.user.email
        })
      }
    }
    
    return users
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString())
  }

  // Send real-time harvest approval update
  sendHarvestApprovalUpdate(harvestId, status, farmerId, partnerId) {
    const update = {
      harvestId,
      status,
      timestamp: new Date()
    }

    // Send to farmer
    this.sendNotificationToUser(farmerId, {
      type: 'harvest-approval',
      title: 'Harvest Status Updated',
      message: `Your harvest has been ${status}`,
      data: update
    })

    // Send to partner
    if (partnerId) {
      this.sendNotificationToUser(partnerId, {
        type: 'harvest-approval',
        title: 'Harvest Processed',
        message: `Harvest ${harvestId} has been ${status}`,
        data: update
      })
    }

    // Broadcast to relevant roles
    this.io.to('role:farmer').to('role:partner').emit('harvest-approval-update', update)
  }

  // Send real-time weather alert
  sendWeatherAlert(location, alert) {
    const weatherUpdate = {
      location,
      alert,
      timestamp: new Date()
    }

    // Send to users in the affected location
    this.io.to(`location:${location.city}:${location.state}`).emit('weather-alert', weatherUpdate)
    
    // Also broadcast to all users (they can filter on frontend)
    this.io.emit('weather-alert', weatherUpdate)
  }

  // Send real-time marketplace update
  sendMarketplaceUpdate(type, data) {
    const update = {
      type,
      data,
      timestamp: new Date()
    }

    // Broadcast to all users
    this.io.emit('marketplace-update', update)
  }

  // Send real-time shipment update
  sendShipmentUpdate(shipmentId, status, buyerId, sellerId) {
    const update = {
      shipmentId,
      status,
      timestamp: new Date()
    }

    // Send to buyer
    if (buyerId) {
      this.sendNotificationToUser(buyerId, {
        type: 'shipment-update',
        title: 'Shipment Update',
        message: `Your shipment status: ${status}`,
        data: update
      })
    }

    // Send to seller
    if (sellerId) {
      this.sendNotificationToUser(sellerId, {
        type: 'shipment-update',
        title: 'Shipment Update',
        message: `Shipment ${shipmentId} status: ${status}`,
        data: update
      })
    }

    // Broadcast to relevant roles
    this.io.to('role:buyer').to('role:farmer').emit('shipment-update', update)
  }

  // Send real-time payment update
  sendPaymentUpdate(paymentId, status, userId) {
    const update = {
      paymentId,
      status,
      timestamp: new Date()
    }

    // Send to user
    if (userId) {
      this.sendNotificationToUser(userId, {
        type: 'payment-update',
        title: 'Payment Update',
        message: `Your payment status: ${status}`,
        data: update
      })
    }

    // Broadcast to relevant roles
    this.io.to('role:buyer').to('role:farmer').to('role:partner').emit('payment-update', update)
  }

  // Enhanced notification tracking
  async trackNotificationDelivery(notification, deliveryMethods = ['websocket', 'email', 'sms']) {
    const deliveryStatus = {
      websocket: false,
      email: false,
      sms: false,
      timestamp: new Date()
    }

    try {
      // WebSocket delivery
      if (deliveryMethods.includes('websocket')) {
        const socketDelivered = this.sendNotificationToUser(notification.user, {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          data: notification.data
        })
        deliveryStatus.websocket = socketDelivered
      }

      // Log delivery status
      await Notification.findByIdAndUpdate(notification._id, {
        $set: { 
          deliveryStatus: deliveryStatus,
          'channels.$[elem].deliveryTracking': deliveryStatus
        },
        $push: { 
          deliveryLogs: {
            timestamp: new Date(),
            status: deliveryStatus,
            methods: deliveryMethods
          }
        }
      }, { 
        arrayFilters: [{ 'elem.type': { $in: deliveryMethods } }],
        new: true 
      })

      return deliveryStatus
    } catch (error) {
      console.error('Notification delivery tracking error:', error)
      return deliveryStatus
    }
  }

  // Advanced notification routing based on user preferences
  async routeNotification(userId, notification) {
    try {
      // Fetch user notification preferences
      const user = await User.findById(userId).select('notificationPreferences')
      
      if (!user || !user.notificationPreferences) {
        // Fallback to default routing
        return this.sendNotificationToUser(userId, notification)
      }

      const preferences = user.notificationPreferences
      const routingMethods = []

      // Determine routing methods based on preferences
      if (preferences.websocket !== false) routingMethods.push('websocket')
      if (preferences.email && notification.type !== 'low') routingMethods.push('email')
      if (preferences.sms && notification.priority === 'high') routingMethods.push('sms')

      // Track notification delivery
      return this.trackNotificationDelivery(
        { ...notification, user: userId }, 
        routingMethods
      )
    } catch (error) {
      console.error('Notification routing error:', error)
      return false
    }
  }

  // Notification analytics method
  async getNotificationAnalytics(options = {}) {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      endDate = new Date(),
      userId,
      role
    } = options

    try {
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            ...(userId && { user: mongoose.Types.ObjectId(userId) }),
            ...(role && { 'user.role': role })
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              category: '$category',
              priority: '$priority'
            },
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$read', 1, 0] } },
            unread: { $sum: { $cond: ['$read', 0, 1] } }
          }
        },
        {
          $project: {
            type: '$_id.type',
            category: '$_id.category',
            priority: '$_id.priority',
            total: 1,
            read: 1,
            unread: 1,
            readPercentage: { 
              $multiply: [
                { $divide: ['$read', '$total'] }, 
                100 
              ] 
            }
          }
        },
        { $sort: { total: -1 } }
      ]

      const analytics = await Notification.aggregate(pipeline)

      return {
        total: analytics.reduce((sum, item) => sum + item.total, 0),
        breakdown: analytics,
        period: {
          start: startDate,
          end: endDate
        }
      }
    } catch (error) {
      console.error('Notification analytics error:', error)
      return null
    }
  }

  // Notification preference management
  async updateUserNotificationPreferences(userId, preferences) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { 
          $set: { 
            notificationPreferences: {
              websocket: preferences.websocket ?? true,
              email: preferences.email ?? true,
              sms: preferences.sms ?? false,
              push: preferences.push ?? true,
              categories: preferences.categories || [],
              priorityThreshold: preferences.priorityThreshold || 'normal'
            }
          } 
        },
        { new: true }
      )

      return updatedUser.notificationPreferences
    } catch (error) {
      console.error('Update notification preferences error:', error)
      return null
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      usersByRole: {
        farmer: this.getOnlineUsersByRole('farmer').length,
        buyer: this.getOnlineUsersByRole('buyer').length,
        partner: this.getOnlineUsersByRole('partner').length,
        admin: this.getOnlineUsersByRole('admin').length
      }
    }
  }
}

module.exports = new WebSocketService()
