const Partner = require('../models/partner.model')
const User = require('../models/user.model')
const Commission = require('../models/commission.model')

// Get partner settings
exports.getPartnerSettings = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id })
      .populate('user', 'name email phone')

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      data: {
        partner,
        settings: {
          commissionRate: partner.commissionRate || 0,
          autoApproval: partner.autoApproval || false,
          notificationPreferences: partner.notificationPreferences || {},
          paymentPreferences: partner.paymentPreferences || {},
          businessHours: partner.businessHours || {},
          serviceAreas: partner.serviceAreas || []
        }
      }
    })
  } catch (error) {
    console.error('Get partner settings error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting partner settings'
    })
  }
}

// Update partner settings
exports.updatePartnerSettings = async (req, res) => {
  try {
    const {
      commissionRate,
      autoApproval,
      notificationPreferences,
      paymentPreferences,
      businessHours,
      serviceAreas,
      organization,
      address,
      phone,
      website,
      description
    } = req.body

    // Validate commission rate
    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({
          status: 'error',
          message: 'Commission rate must be between 0 and 100'
        })
      }
    }

    // Validate service areas
    if (serviceAreas && Array.isArray(serviceAreas)) {
      if (serviceAreas.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one service area is required'
        })
      }
    }

    // Validate business hours
    if (businessHours && typeof businessHours === 'object') {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const validTimeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

      for (const [day, hours] of Object.entries(businessHours)) {
        if (!validDays.includes(day.toLowerCase())) {
          return res.status(400).json({
            status: 'error',
            message: `Invalid day: ${day}. Valid days: ${validDays.join(', ')}`
          })
        }

        if (hours && typeof hours === 'object') {
          if (hours.open && !validTimeFormat.test(hours.open)) {
            return res.status(400).json({
              status: 'error',
              message: `Invalid opening time format for ${day}. Use HH:MM format`
            })
          }
          if (hours.close && !validTimeFormat.test(hours.close)) {
            return res.status(400).json({
              status: 'error',
              message: `Invalid closing time format for ${day}. Use HH:MM format`
            })
          }
        }
      }
    }

    // Update partner settings
    const updateData = {}
    
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate
    if (autoApproval !== undefined) updateData.autoApproval = autoApproval
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences
    if (paymentPreferences) updateData.paymentPreferences = paymentPreferences
    if (businessHours) updateData.businessHours = businessHours
    if (serviceAreas) updateData.serviceAreas = serviceAreas
    if (organization) updateData.organization = organization
    if (address) updateData.address = address
    if (phone) updateData.phone = phone
    if (website) updateData.website = website
    if (description) updateData.description = description

    const updatedPartner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone')

    if (!updatedPartner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      message: 'Partner settings updated successfully',
      data: updatedPartner
    })
  } catch (error) {
    console.error('Update partner settings error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating partner settings'
    })
  }
}

// Get partner dashboard settings
exports.getDashboardSettings = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id })
      .select('dashboardSettings commissionRate autoApproval')

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    // Get default dashboard settings if none exist
    const defaultSettings = {
      widgets: [
        { id: 'earnings', enabled: true, position: 0 },
        { id: 'farmers', enabled: true, position: 1 },
        { id: 'harvests', enabled: true, position: 2 },
        { id: 'orders', enabled: true, position: 3 },
        { id: 'commissions', enabled: true, position: 4 },
        { id: 'analytics', enabled: true, position: 5 }
      ],
      layout: 'grid',
      theme: 'light',
      refreshInterval: 300000, // 5 minutes
      showNotifications: true,
      compactMode: false
    }

    const dashboardSettings = partner.dashboardSettings || defaultSettings

    return res.json({
      status: 'success',
      data: {
        dashboardSettings,
        commissionRate: partner.commissionRate || 0,
        autoApproval: partner.autoApproval || false
      }
    })
  } catch (error) {
    console.error('Get dashboard settings error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting dashboard settings'
    })
  }
}

// Update dashboard settings
exports.updateDashboardSettings = async (req, res) => {
  try {
    const {
      widgets,
      layout,
      theme,
      refreshInterval,
      showNotifications,
      compactMode
    } = req.body

    // Validate widgets
    if (widgets && Array.isArray(widgets)) {
      const validWidgets = ['earnings', 'farmers', 'harvests', 'orders', 'commissions', 'analytics']
      
      for (const widget of widgets) {
        if (!validWidgets.includes(widget.id)) {
          return res.status(400).json({
            status: 'error',
            message: `Invalid widget ID: ${widget.id}. Valid widgets: ${validWidgets.join(', ')}`
          })
        }
      }
    }

    // Validate layout
    if (layout && !['grid', 'list', 'compact'].includes(layout)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid layout. Valid layouts: grid, list, compact'
      })
    }

    // Validate theme
    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid theme. Valid themes: light, dark, auto'
      })
    }

    // Validate refresh interval (between 30 seconds and 10 minutes)
    if (refreshInterval !== undefined) {
      if (refreshInterval < 30000 || refreshInterval > 600000) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh interval must be between 30 seconds and 10 minutes'
        })
      }
    }

    const updateData = {}
    
    if (widgets) updateData['dashboardSettings.widgets'] = widgets
    if (layout) updateData['dashboardSettings.layout'] = layout
    if (theme) updateData['dashboardSettings.theme'] = theme
    if (refreshInterval) updateData['dashboardSettings.refreshInterval'] = refreshInterval
    if (showNotifications !== undefined) updateData['dashboardSettings.showNotifications'] = showNotifications
    if (compactMode !== undefined) updateData['dashboardSettings.compactMode'] = compactMode

    const updatedPartner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    ).select('dashboardSettings')

    if (!updatedPartner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      message: 'Dashboard settings updated successfully',
      data: updatedPartner.dashboardSettings
    })
  } catch (error) {
    console.error('Update dashboard settings error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating dashboard settings'
    })
  }
}

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id })
      .select('notificationPreferences')

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    // Default notification preferences
    const defaultPreferences = {
      email: {
        newHarvest: true,
        newOrder: true,
        commissionEarned: true,
        paymentReceived: true,
        systemUpdates: true,
        marketing: false
      },
      sms: {
        newHarvest: false,
        newOrder: true,
        commissionEarned: true,
        paymentReceived: true,
        systemUpdates: false,
        marketing: false
      },
      push: {
        newHarvest: true,
        newOrder: true,
        commissionEarned: true,
        paymentReceived: true,
        systemUpdates: true,
        marketing: false
      },
      frequency: 'immediate', // immediate, hourly, daily, weekly
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    }

    const preferences = partner.notificationPreferences || defaultPreferences

    return res.json({
      status: 'success',
      data: preferences
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting notification preferences'
    })
  }
}

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const {
      email,
      sms,
      push,
      frequency,
      quietHours
    } = req.body

    // Validate frequency
    if (frequency && !['immediate', 'hourly', 'daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid frequency. Valid frequencies: immediate, hourly, daily, weekly'
      })
    }

    // Validate quiet hours
    if (quietHours) {
      if (quietHours.enabled && (!quietHours.start || !quietHours.end)) {
        return res.status(400).json({
          status: 'error',
          message: 'Start and end times are required when quiet hours are enabled'
        })
      }

      if (quietHours.start && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHours.start)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid start time format. Use HH:MM format'
        })
      }

      if (quietHours.end && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHours.end)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid end time format. Use HH:MM format'
        })
      }
    }

    const updateData = {}
    
    if (email) updateData['notificationPreferences.email'] = email
    if (sms) updateData['notificationPreferences.sms'] = sms
    if (push) updateData['notificationPreferences.push'] = push
    if (frequency) updateData['notificationPreferences.frequency'] = frequency
    if (quietHours) updateData['notificationPreferences.quietHours'] = quietHours

    const updatedPartner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    ).select('notificationPreferences')

    if (!updatedPartner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: updatedPartner.notificationPreferences
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating notification preferences'
    })
  }
}

// Get payment preferences
exports.getPaymentPreferences = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id })
      .select('paymentPreferences')

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    // Default payment preferences
    const defaultPreferences = {
      preferredMethod: 'bank_transfer', // bank_transfer, mobile_money, cash
      bankDetails: {
        accountNumber: '',
        accountName: '',
        bankName: '',
        bankCode: ''
      },
      mobileMoney: {
        provider: '', // mtn, airtel, 9mobile, glo
        phoneNumber: ''
      },
      autoPayout: {
        enabled: false,
        threshold: 10000, // Minimum amount for auto payout
        frequency: 'weekly' // daily, weekly, monthly
      },
      taxInformation: {
        taxId: '',
        taxRate: 0,
        taxExempt: false
      }
    }

    const preferences = partner.paymentPreferences || defaultPreferences

    return res.json({
      status: 'success',
      data: preferences
    })
  } catch (error) {
    console.error('Get payment preferences error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting payment preferences'
    })
  }
}

// Update payment preferences
exports.updatePaymentPreferences = async (req, res) => {
  try {
    const {
      preferredMethod,
      bankDetails,
      mobileMoney,
      autoPayout,
      taxInformation
    } = req.body

    // Validate preferred method
    if (preferredMethod && !['bank_transfer', 'mobile_money', 'cash'].includes(preferredMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment method. Valid methods: bank_transfer, mobile_money, cash'
      })
    }

    // Validate auto payout frequency
    if (autoPayout && autoPayout.frequency && !['daily', 'weekly', 'monthly'].includes(autoPayout.frequency)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid auto payout frequency. Valid frequencies: daily, weekly, monthly'
      })
    }

    // Validate tax rate
    if (taxInformation && taxInformation.taxRate !== undefined) {
      if (taxInformation.taxRate < 0 || taxInformation.taxRate > 100) {
        return res.status(400).json({
          status: 'error',
          message: 'Tax rate must be between 0 and 100'
        })
      }
    }

    const updateData = {}
    
    if (preferredMethod) updateData['paymentPreferences.preferredMethod'] = preferredMethod
    if (bankDetails) updateData['paymentPreferences.bankDetails'] = bankDetails
    if (mobileMoney) updateData['paymentPreferences.mobileMoney'] = mobileMoney
    if (autoPayout) updateData['paymentPreferences.autoPayout'] = autoPayout
    if (taxInformation) updateData['paymentPreferences.taxInformation'] = taxInformation

    const updatedPartner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    ).select('paymentPreferences')

    if (!updatedPartner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      message: 'Payment preferences updated successfully',
      data: updatedPartner.paymentPreferences
    })
  } catch (error) {
    console.error('Update payment preferences error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating payment preferences'
    })
  }
}

// Reset partner settings to defaults
exports.resetSettings = async (req, res) => {
  try {
    const { settingsType } = req.params

    const validTypes = ['all', 'dashboard', 'notifications', 'payments']
    
    if (!validTypes.includes(settingsType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid settings type. Valid types: ${validTypes.join(', ')}`
      })
    }

    const updateData = {}

    if (settingsType === 'all' || settingsType === 'dashboard') {
      updateData.dashboardSettings = {
        widgets: [
          { id: 'earnings', enabled: true, position: 0 },
          { id: 'farmers', enabled: true, position: 1 },
          { id: 'harvests', enabled: true, position: 2 },
          { id: 'orders', enabled: true, position: 3 },
          { id: 'commissions', enabled: true, position: 4 },
          { id: 'analytics', enabled: true, position: 5 }
        ],
        layout: 'grid',
        theme: 'light',
        refreshInterval: 300000,
        showNotifications: true,
        compactMode: false
      }
    }

    if (settingsType === 'all' || settingsType === 'notifications') {
      updateData.notificationPreferences = {
        email: {
          newHarvest: true,
          newOrder: true,
          commissionEarned: true,
          paymentReceived: true,
          systemUpdates: true,
          marketing: false
        },
        sms: {
          newHarvest: false,
          newOrder: true,
          commissionEarned: true,
          paymentReceived: true,
          systemUpdates: false,
          marketing: false
        },
        push: {
          newHarvest: true,
          newOrder: true,
          commissionEarned: true,
          paymentReceived: true,
          systemUpdates: true,
          marketing: false
        },
        frequency: 'immediate',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      }
    }

    if (settingsType === 'all' || settingsType === 'payments') {
      updateData.paymentPreferences = {
        preferredMethod: 'bank_transfer',
        bankDetails: {
          accountNumber: '',
          accountName: '',
          bankName: '',
          bankCode: ''
        },
        mobileMoney: {
          provider: '',
          phoneNumber: ''
        },
        autoPayout: {
          enabled: false,
          threshold: 10000,
          frequency: 'weekly'
        },
        taxInformation: {
          taxId: '',
          taxRate: 0,
          taxExempt: false
        }
      }
    }

    const updatedPartner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    )

    if (!updatedPartner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      })
    }

    return res.json({
      status: 'success',
      message: `${settingsType} settings reset to defaults successfully`,
      data: updatedPartner
    })
  } catch (error) {
    console.error('Reset settings error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while resetting settings'
    })
  }
}

