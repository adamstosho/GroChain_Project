const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Order = require('../models/order.model')
const Listing = require('../models/listing.model')
const { sendSMS } = require('../utils/sms.util')

// USSD session management
const ussdSessions = new Map()

// USSD menu structure
const USSD_MENUS = {
  main: {
    text: 'Welcome to GroChain\n\n1. Harvest Management\n2. Marketplace\n3. Orders\n4. Account\n5. Support\n0. Exit',
    options: {
      '1': 'harvest',
      '2': 'marketplace',
      '3': 'orders',
      '4': 'account',
      '5': 'support',
      '0': 'exit'
    }
  },
  harvest: {
    text: 'Harvest Management\n\n1. Record New Harvest\n2. View My Harvests\n3. Update Harvest\n4. Back to Main',
    options: {
      '1': 'record_harvest',
      '2': 'view_harvests',
      '3': 'update_harvest',
      '4': 'main'
    }
  },
  marketplace: {
    text: 'Marketplace\n\n1. View Listings\n2. Search Products\n3. My Listings\n4. Back to Main',
    options: {
      '1': 'view_listings',
      '2': 'search_products',
      '3': 'my_listings',
      '4': 'main'
    }
  },
  orders: {
    text: 'Orders\n\n1. View My Orders\n2. Track Order\n3. Order History\n4. Back to Main',
    options: {
      '1': 'view_orders',
      '2': 'track_order',
      '3': 'order_history',
      '4': 'main'
    }
  },
  account: {
    text: 'Account\n\n1. Profile\n2. Balance\n3. Settings\n4. Back to Main',
    options: {
      '1': 'profile',
      '2': 'balance',
      '3': 'settings',
      '4': 'main'
    }
  },
  support: {
    text: 'Support\n\n1. Contact Support\n2. FAQ\n3. Report Issue\n4. Back to Main',
    options: {
      '1': 'contact_support',
      '2': 'faq',
      '3': 'report_issue',
      '4': 'main'
    }
  }
}

// USSD session class
class USSDSession {
  constructor(phoneNumber, sessionId) {
    this.phoneNumber = phoneNumber
    this.sessionId = sessionId
    this.currentMenu = 'main'
    this.user = null
    this.data = {}
    this.createdAt = new Date()
    this.lastActivity = new Date()
  }

  updateActivity() {
    this.lastActivity = new Date()
  }

  setUser(user) {
    this.user = user
  }

  setData(key, value) {
    this.data[key] = value
  }

  getData(key) {
    return this.data[key]
  }

  clearData() {
    this.data = {}
  }

  isExpired() {
    const now = new Date()
    const diff = now - this.lastActivity
    return diff > 5 * 60 * 1000 // 5 minutes
  }
}

// Initialize USSD session
exports.initUSSD = async (req, res) => {
  try {
    const { phoneNumber, sessionId, serviceCode, text } = req.body

    if (!phoneNumber || !sessionId || !serviceCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters'
      })
    }

    // Check if session exists
    let session = ussdSessions.get(sessionId)
    
    if (!session) {
      // Create new session
      session = new USSDSession(phoneNumber, sessionId)
      ussdSessions.set(sessionId, session)
    } else {
      // Update existing session
      session.updateActivity()
    }

    // Check if user exists
    const user = await User.findOne({ phone: phoneNumber })
    if (user) {
      session.setUser(user)
    }

    // Process USSD input
    const response = await processUSSDInput(session, text)

    // Clean up expired sessions
    cleanupExpiredSessions()

    return res.json({
      status: 'success',
      data: response
    })
  } catch (error) {
    console.error('USSD init error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during USSD initialization'
    })
  }
}

// Process USSD input
async function processUSSDInput(session, text) {
  try {
    if (!text || text.trim() === '') {
      // First time access - show main menu
      return {
        response: 'CON ' + USSD_MENUS.main.text,
        sessionId: session.sessionId
      }
    }

    const input = text.trim()
    const currentMenu = USSD_MENUS[session.currentMenu]
    
    if (!currentMenu) {
      session.currentMenu = 'main'
      return {
        response: 'CON ' + USSD_MENUS.main.text,
        sessionId: session.sessionId
      }
    }

    // Handle menu navigation
    if (currentMenu.options[input]) {
      const nextMenu = currentMenu.options[input]
      
      if (nextMenu === 'main') {
        session.currentMenu = 'main'
        return {
          response: 'CON ' + USSD_MENUS.main.text,
          sessionId: session.sessionId
        }
      } else if (nextMenu === 'exit') {
        return {
          response: 'END Thank you for using GroChain. Goodbye!',
          sessionId: session.sessionId
        }
      } else {
        // Handle specific menu actions
        return await handleMenuAction(session, nextMenu, input)
      }
    } else {
      // Invalid input
      return {
        response: 'CON Invalid option. Please try again.\n\n' + currentMenu.text,
        sessionId: session.sessionId
      }
    }
  } catch (error) {
    console.error('USSD input processing error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle specific menu actions
async function handleMenuAction(session, action, input) {
  try {
    switch (action) {
      case 'harvest':
        session.currentMenu = 'harvest'
        return {
          response: 'CON ' + USSD_MENUS.harvest.text,
          sessionId: session.sessionId
        }

      case 'marketplace':
        session.currentMenu = 'marketplace'
        return {
          response: 'CON ' + USSD_MENUS.marketplace.text,
          sessionId: session.sessionId
        }

      case 'orders':
        session.currentMenu = 'orders'
        return {
          response: 'CON ' + USSD_MENUS.orders.text,
          sessionId: session.sessionId
        }

      case 'account':
        session.currentMenu = 'account'
        return {
          response: 'CON ' + USSD_MENUS.account.text,
          sessionId: session.sessionId
        }

      case 'support':
        session.currentMenu = 'support'
        return {
          response: 'CON ' + USSD_MENUS.support.text,
          sessionId: session.sessionId
        }

      case 'record_harvest':
        return await handleRecordHarvest(session)

      case 'view_harvests':
        return await handleViewHarvests(session)

      case 'view_listings':
        return await handleViewListings(session)

      case 'view_orders':
        return await handleViewOrders(session)

      case 'profile':
        return await handleProfile(session)

      case 'contact_support':
        return await handleContactSupport(session)

      default:
        session.currentMenu = 'main'
        return {
          response: 'CON ' + USSD_MENUS.main.text,
          sessionId: session.sessionId
        }
    }
  } catch (error) {
    console.error('Menu action handling error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle record harvest action
async function handleRecordHarvest(session) {
  try {
    if (!session.user) {
      return {
        response: 'END Please register first. Visit our website or contact support.',
        sessionId: session.sessionId
      }
    }

    if (session.user.role !== 'farmer') {
      return {
        response: 'END This feature is only available for farmers.',
        sessionId: session.sessionId
      }
    }

    // Check if we're collecting harvest data
    if (session.getData('harvest_step')) {
      return await collectHarvestData(session)
    }

    // Start harvest recording process
    session.setData('harvest_step', 'crop_type')
    return {
      response: 'CON Please enter crop type:\n\n1. Maize\n2. Rice\n3. Cassava\n4. Yam\n5. Other\n\n0. Back',
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('Record harvest error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Collect harvest data step by step
async function collectHarvestData(session) {
  try {
    const step = session.getData('harvest_step')
    
    switch (step) {
      case 'crop_type':
        // Handle crop type selection
        const cropTypes = ['maize', 'rice', 'cassava', 'yam', 'other']
        const cropIndex = parseInt(session.getData('last_input')) - 1
        
        if (cropIndex >= 0 && cropIndex < cropTypes.length) {
          session.setData('crop_type', cropTypes[cropIndex])
          session.setData('harvest_step', 'quantity')
          return {
            response: 'CON Please enter quantity (in kg):',
            sessionId: session.sessionId
          }
        } else {
          return {
            response: 'CON Invalid selection. Please choose 1-5:\n\n1. Maize\n2. Rice\n3. Cassava\n4. Yam\n5. Other\n\n0. Back',
            sessionId: session.sessionId
          }
        }

      case 'quantity':
        const quantity = parseFloat(session.getData('last_input'))
        if (isNaN(quantity) || quantity <= 0) {
          return {
            response: 'CON Invalid quantity. Please enter a valid number (in kg):',
            sessionId: session.sessionId
          }
        }
        
        session.setData('quantity', quantity)
        session.setData('harvest_step', 'quality')
        return {
          response: 'CON Please select quality:\n\n1. Grade A (Premium)\n2. Grade B (Good)\n3. Grade C (Standard)\n\n0. Back',
          sessionId: session.sessionId
        }

      case 'quality':
        const qualityIndex = parseInt(session.getData('last_input')) - 1
        const qualities = ['Grade A', 'Grade B', 'Grade C']
        
        if (qualityIndex >= 0 && qualityIndex < qualities.length) {
          session.setData('quality', qualities[qualityIndex])
          session.setData('harvest_step', 'confirm')
          return {
            response: 'CON Please confirm harvest details:\n\nCrop: ' + session.getData('crop_type') + 
                     '\nQuantity: ' + session.getData('quantity') + ' kg' +
                     '\nQuality: ' + session.getData('quality') +
                     '\n\n1. Confirm\n2. Cancel\n\n0. Back',
            sessionId: session.sessionId
          }
        } else {
          return {
            response: 'CON Invalid selection. Please choose 1-3:\n\n1. Grade A (Premium)\n2. Grade B (Good)\n3. Grade C (Standard)\n\n0. Back',
            sessionId: session.sessionId
          }
        }

      case 'confirm':
        const confirmChoice = session.getData('last_input')
        
        if (confirmChoice === '1') {
          // Save harvest
          try {
            const harvest = await Harvest.create({
              farmer: session.user._id,
              cropType: session.getData('crop_type'),
              quantity: session.getData('quantity'),
              quality: session.getData('quality'),
              date: new Date(),
              location: session.user.location || 'Unknown',
              status: 'pending'
            })

            // Clear harvest data
            session.clearData()
            
            return {
              response: 'END Harvest recorded successfully! ID: ' + harvest._id + 
                       '\n\nYou will receive an SMS confirmation.',
              sessionId: session.sessionId
            }
          } catch (error) {
            console.error('Harvest creation error:', error)
            return {
              response: 'END Failed to record harvest. Please try again later.',
              sessionId: session.sessionId
            }
          }
        } else if (confirmChoice === '2') {
          // Cancel
          session.clearData()
          session.currentMenu = 'harvest'
          return {
            response: 'CON ' + USSD_MENUS.harvest.text,
            sessionId: session.sessionId
          }
        } else {
          return {
            response: 'CON Invalid choice. Please select:\n\n1. Confirm\n2. Cancel\n\n0. Back',
            sessionId: session.sessionId
          }
        }

      default:
        session.clearData()
        session.currentMenu = 'harvest'
        return {
          response: 'CON ' + USSD_MENUS.harvest.text,
          sessionId: session.sessionId
        }
    }
  } catch (error) {
    console.error('Collect harvest data error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle view harvests action
async function handleViewHarvests(session) {
  try {
    if (!session.user) {
      return {
        response: 'END Please register first. Visit our website or contact support.',
        sessionId: session.sessionId
      }
    }

    if (session.user.role !== 'farmer') {
      return {
        response: 'END This feature is only available for farmers.',
        sessionId: session.sessionId
      }
    }

    const harvests = await Harvest.find({ farmer: session.user._id })
      .sort({ date: -1 })
      .limit(5)

    if (harvests.length === 0) {
      return {
        response: 'END No harvests found.\n\n1. Record New Harvest\n0. Back',
        sessionId: session.sessionId
      }
    }

    let response = 'END Your Recent Harvests:\n\n'
    harvests.forEach((harvest, index) => {
      response += `${index + 1}. ${harvest.cropType} - ${harvest.quantity}kg (${harvest.quality})\n`
      response += `   Date: ${harvest.date.toLocaleDateString()}\n`
      response += `   Status: ${harvest.status}\n\n`
    })

    response += '1. Record New Harvest\n0. Back'
    
    return {
      response: response,
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('View harvests error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle view listings action
async function handleViewListings(session) {
  try {
    const listings = await Listing.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('farmer', 'name location')

    if (listings.length === 0) {
      return {
        response: 'END No active listings found.',
        sessionId: session.sessionId
      }
    }

    let response = 'END Available Products:\n\n'
    listings.forEach((listing, index) => {
      response += `${index + 1}. ${listing.cropName}\n`
      response += `   Price: ₦${listing.price}/kg\n`
      response += `   Location: ${listing.farmer?.location || 'Unknown'}\n`
      response += `   Quantity: ${listing.quantity}kg\n\n`
    })

    response += '0. Back'
    
    return {
      response: response,
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('View listings error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle view orders action
async function handleViewOrders(session) {
  try {
    if (!session.user) {
      return {
        response: 'END Please register first. Visit our website or contact support.',
        sessionId: session.sessionId
      }
    }

    const orders = await Order.find({ buyer: session.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.listing', 'cropName')

    if (orders.length === 0) {
      return {
        response: 'END No orders found.',
        sessionId: session.sessionId
      }
    }

    let response = 'END Your Recent Orders:\n\n'
    orders.forEach((order, index) => {
      response += `${index + 1}. Order #${order.orderNumber}\n`
      response += `   Total: ₦${order.total}\n`
      response += `   Status: ${order.status}\n`
      response += `   Date: ${order.createdAt.toLocaleDateString()}\n\n`
    })

    response += '0. Back'
    
    return {
      response: response,
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('View orders error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle profile action
async function handleProfile(session) {
  try {
    if (!session.user) {
      return {
        response: 'END Please register first. Visit our website or contact support.',
        sessionId: session.sessionId
      }
    }

    const response = 'END Your Profile:\n\n' +
                   'Name: ' + session.user.name + '\n' +
                   'Phone: ' + session.user.phone + '\n' +
                   'Role: ' + session.user.role + '\n' +
                   'Location: ' + (session.user.location || 'Not set') + '\n' +
                   'Status: ' + session.user.status + '\n\n' +
                   '0. Back'

    return {
      response: response,
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('Profile error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Handle contact support action
async function handleContactSupport(session) {
  try {
    const response = 'END Contact Support:\n\n' +
                   'Phone: +234 800 GROCHAIN\n' +
                   'Email: support@grochain.com\n' +
                   'Website: www.grochain.com\n\n' +
                   'Our team will assist you within 24 hours.\n\n' +
                   '0. Back'

    return {
      response: response,
      sessionId: session.sessionId
    }
  } catch (error) {
    console.error('Contact support error:', error)
    return {
      response: 'END An error occurred. Please try again later.',
      sessionId: session.sessionId
    }
  }
}

// Clean up expired sessions
function cleanupExpiredSessions() {
  const now = new Date()
  for (const [sessionId, session] of ussdSessions.entries()) {
    if (session.isExpired()) {
      ussdSessions.delete(sessionId)
    }
  }
}

// Get USSD session info
exports.getUSSDInfo = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required'
      })
    }

    const session = ussdSessions.get(sessionId)
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      })
    }

    return res.json({
      status: 'success',
      data: {
        sessionId: session.sessionId,
        phoneNumber: session.phoneNumber,
        currentMenu: session.currentMenu,
        user: session.user ? {
          id: session.user._id,
          name: session.user.name,
          role: session.user.role
        } : null,
        data: session.data,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        isExpired: session.isExpired()
      }
    })
  } catch (error) {
    console.error('Get USSD info error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting USSD info'
    })
  }
}

// Get all active USSD sessions (admin only)
exports.getAllUSSDSessions = async (req, res) => {
  try {
    const sessions = Array.from(ussdSessions.values()).map(session => ({
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      currentMenu: session.currentMenu,
      user: session.user ? {
        id: session.user._id,
        name: session.user.name,
        role: session.user.role
      } : null,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isExpired: session.isExpired()
    }))

    return res.json({
      status: 'success',
      data: {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => !s.isExpired).length,
        expiredSessions: sessions.filter(s => s.isExpired).length,
        sessions
      }
    })
  } catch (error) {
    console.error('Get all USSD sessions error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting USSD sessions'
    })
  }
}

// Clear expired USSD sessions
exports.clearExpiredSessions = async (req, res) => {
  try {
    const beforeCount = ussdSessions.size
    cleanupExpiredSessions()
    const afterCount = ussdSessions.size
    const clearedCount = beforeCount - afterCount

    return res.json({
      status: 'success',
      message: `Cleared ${clearedCount} expired sessions`,
      data: {
        beforeCount,
        afterCount,
        clearedCount
      }
    })
  } catch (error) {
    console.error('Clear expired sessions error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while clearing expired sessions'
    })
  }
}

