const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  category: { type: String, enum: ['harvest', 'marketplace', 'financial', 'system', 'weather', 'order', 'payment', 'shipment'], default: 'system' },
  deliveryStatus: {
    websocket: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    timestamp: { type: Date }
  },
  deliveryLogs: [{
    timestamp: { type: Date, default: Date.now },
    status: {
      websocket: { type: Boolean },
      email: { type: Boolean },
      sms: { type: Boolean }
    },
    methods: [{ type: String }],
    error: { type: String }
  }],
  channels: [{
    type: { type: String, enum: ['email', 'sms', 'push', 'in_app'], required: true },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    error: { type: String },
    deliveryTracking: {
      websocket: { type: Boolean },
      email: { type: Boolean },
      sms: { type: Boolean },
      timestamp: { type: Date }
    }
  }],
  data: { type: Object }, // Additional data for the notification
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  actionUrl: { type: String }, // URL to navigate to when clicked
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  scheduledFor: { type: Date }, // For scheduled notifications
  expiresAt: { type: Date }, // When notification expires
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // System or user who sent it
  metadata: { type: Object } // Additional metadata
}, { timestamps: true })

NotificationSchema.index({ user: 1, read: 1 })
NotificationSchema.index({ category: 1 })
NotificationSchema.index({ createdAt: -1 })
NotificationSchema.index({ scheduledFor: 1 })

module.exports = mongoose.model('Notification', NotificationSchema)

