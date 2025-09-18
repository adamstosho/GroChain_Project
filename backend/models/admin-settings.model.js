const mongoose = require('mongoose')

const AdminSettingsSchema = new mongoose.Schema({
  // System-wide admin settings
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    systemAlerts: { type: Boolean, default: true },
    userReports: { type: Boolean, default: true },
    securityEvents: { type: Boolean, default: true },
    performanceMetrics: { type: Boolean, default: true },
    backupStatus: { type: Boolean, default: true },
    complianceAlerts: { type: Boolean, default: true },
    maintenanceUpdates: { type: Boolean, default: true }
  },
  system: {
    dashboardLayout: { type: String, default: 'Detailed' },
    reportFormat: { type: String, default: 'PDF' },
    dataRefreshRate: { type: String, default: '5 minutes' },
    sessionTimeout: { type: Number, default: 30 },
    autoLogout: { type: Boolean, default: true },
    auditLogging: { type: Boolean, default: true },
    performanceMonitoring: { type: Boolean, default: true }
  },
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    currency: { type: String, default: 'NGN' },
    timezone: { type: String, default: 'Africa/Lagos' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    numberFormat: { type: String, default: '1,234.56' },
    timeFormat: { type: String, default: '24-hour' }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30 },
    loginNotifications: { type: Boolean, default: true },
    passwordExpiry: { type: Number, default: 90 },
    biometricAuth: { type: Boolean, default: false },
    ipWhitelist: { type: Boolean, default: false },
    deviceManagement: { type: Boolean, default: true }
  },
  data: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
    retentionPeriod: { type: Number, default: 365 },
    exportFormat: { type: String, enum: ['csv', 'json', 'pdf', 'xml'], default: 'csv' },
    dataArchiving: { type: Boolean, default: true },
    realTimeSync: { type: Boolean, default: true }
  },
  // Metadata
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  // Ensure only one document exists for admin settings
  strict: true
})

// Static method to get the single admin settings document
AdminSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

// Static method to update admin settings
AdminSettingsSchema.statics.updateSettings = async function(updates, updatedBy) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }

  // Update the settings
  Object.assign(settings, updates)
  settings.lastUpdatedBy = updatedBy
  settings.lastUpdatedAt = new Date()

  await settings.save()
  return settings
}

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema)



