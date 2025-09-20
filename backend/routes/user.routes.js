const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const User = require('../models/user.model')
const upload = require('../utils/upload')

router.get('/dashboard', authenticate, authorize('admin','partner','farmer','buyer'), async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    
    let dashboardData = {
      totalHarvests: 0,
      pendingApprovals: 0,
      activeListings: 0,
      monthlyRevenue: 0
    }
    
    // Get harvest data for farmers
    if (userRole === 'farmer') {
      const Harvest = require('../models/harvest.model')
      const [totalHarvests, pendingHarvests] = await Promise.all([
        Harvest.countDocuments({ farmer: userId }),
        Harvest.countDocuments({ farmer: userId, status: 'pending' })
      ])
      
      dashboardData.totalHarvests = totalHarvests
      dashboardData.pendingApprovals = pendingHarvests
      
      // Get marketplace listings for farmers
      const Listing = require('../models/listing.model')
      const activeListings = await Listing.countDocuments({ 
        farmer: userId, 
        status: 'active' 
      })
      dashboardData.activeListings = activeListings
      
      // Get monthly revenue for farmers from completed orders
      const Order = require('../models/order.model')
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Get farmer's listings first
      const farmerListings = await Listing.find({ farmer: userId }).select('_id')
      const listingIds = farmerListings.map(listing => listing._id)

      // Check if farmer has a partner
      const farmer = await User.findById(userId).select('partner')
      const hasPartner = farmer && farmer.partner

      // Platform fee rate (3%)
      const platformFeeRate = 0.03
      // Partner commission rate (5%)
      const partnerCommissionRate = hasPartner ? 0.05 : 0

      // Calculate monthly revenue from farmer's orders (after fees)
      const monthlyRevenueResult = await Order.aggregate([
        {
          $match: {
            'items.listing': { $in: listingIds },
            paymentStatus: 'paid',
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.listing': { $in: listingIds }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        }
      ])

      let monthlyRevenue = monthlyRevenueResult[0]?.total || 0
      // Deduct platform fee and partner commission
      const monthlyPlatformFee = monthlyRevenue * platformFeeRate
      const monthlyPartnerCommission = monthlyRevenue * partnerCommissionRate
      monthlyRevenue = monthlyRevenue - monthlyPlatformFee - monthlyPartnerCommission

      dashboardData.monthlyRevenue = monthlyRevenue

      // Calculate total revenue (all time, after fees)
      const totalRevenueResult = await Order.aggregate([
        {
          $match: {
            'items.listing': { $in: listingIds },
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.listing': { $in: listingIds }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        }
      ])

      let totalRevenue = totalRevenueResult[0]?.total || 0
      // Deduct platform fee and partner commission
      const totalPlatformFee = totalRevenue * platformFeeRate
      const totalPartnerCommission = totalRevenue * partnerCommissionRate
      totalRevenue = totalRevenue - totalPlatformFee - totalPartnerCommission

      dashboardData.totalRevenue = totalRevenue
    }
    
    // Get partner data
    if (userRole === 'partner') {
      const Partner = require('../models/partner.model')
      const Commission = require('../models/commission.model')
      const partner = await Partner.findOne({ user: userId })

      if (partner) {
        const Harvest = require('../models/harvest.model')

        // Get harvest data
        const pendingApprovals = await Harvest.countDocuments({
          partner: partner._id,
          status: 'pending'
        })
        dashboardData.pendingApprovals = pendingApprovals
        dashboardData.totalHarvests = await Harvest.countDocuments({ partner: partner._id })

        // Get commission data
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [commissionStats, monthlyCommission] = await Promise.all([
          // Overall commission stats
          Commission.aggregate([
            { $match: { partner: partner._id } },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ]),
          // This month's commission
          Commission.aggregate([
            {
              $match: {
                partner: partner._id,
                createdAt: { $gte: startOfMonth }
              }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ])

        // Calculate commission totals
        const pendingAmount = commissionStats.find(stat => stat._id === 'pending')?.totalAmount || 0
        const paidAmount = commissionStats.find(stat => stat._id === 'paid')?.totalAmount || 0
        const totalCommission = pendingAmount + paidAmount
        const monthlyCommissionAmount = monthlyCommission[0]?.total || 0


        // Add commission data to dashboard
        dashboardData.totalCommission = totalCommission
        dashboardData.pendingCommission = pendingAmount
        dashboardData.paidCommission = paidAmount
        dashboardData.monthlyCommission = monthlyCommissionAmount
        dashboardData.commissionRate = partner.commissionRate || 0.05
        dashboardData.totalFarmers = partner.farmers?.length || 0
      }
    }
    
    // Get buyer data
    if (userRole === 'buyer') {
      const Order = require('../models/order.model')
      const Favorite = require('../models/favorite.model')

      // Get current month start and end
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Get total orders
      const totalOrders = await Order.countDocuments({ buyer: userId })

      // Get total spent (sum of all completed orders) - use paymentStatus: 'paid'
      const totalSpentResult = await Order.aggregate([
        {
          $match: {
            buyer: userId,
            paymentStatus: 'paid',
            total: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$total', 0] } }
          }
        }
      ])
      let totalSpent = totalSpentResult[0]?.total || 0

      // Fallback: If no results from aggregation, try manual calculation
      if (totalSpent === 0) {
        const paidOrders = await Order.find({
          buyer: userId,
          paymentStatus: 'paid',
          total: { $exists: true, $ne: null }
        }).select('total')
        totalSpent = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      }

      // Get monthly spent (current month)
      const monthlySpentResult = await Order.aggregate([
        {
          $match: {
            buyer: userId,
            paymentStatus: 'paid',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            total: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$total', 0] } }
          }
        }
      ])
      let monthlySpent = monthlySpentResult[0]?.total || 0

      // Fallback: If no results from aggregation, try manual calculation
      if (monthlySpent === 0) {
        const monthlyPaidOrders = await Order.find({
          buyer: userId,
          paymentStatus: 'paid',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          total: { $exists: true, $ne: null }
        }).select('total')
        monthlySpent = monthlyPaidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      }

      // Get favorites count
      const favoritesCount = await Favorite.countDocuments({ user: userId })

      // Get pending deliveries (orders that are shipped but not delivered)
      const pendingDeliveries = await Order.countDocuments({
        buyer: userId,
        status: 'shipped'
      })

      // Get active orders (confirmed, processing, or paid but not shipped)
      const activeOrders = await Order.countDocuments({
        buyer: userId,
        status: { $in: ['confirmed', 'processing', 'paid'] }
      })

      dashboardData = {
        totalOrders,
        totalSpent,
        monthlySpent,
        favoriteProducts: favoritesCount,
        pendingDeliveries,
        activeOrders,
        lastOrderDate: null
      }

      // Get last order date and recent orders
      const lastOrder = await Order.findOne({ buyer: userId }).sort({ createdAt: -1 })
      if (lastOrder) {
        dashboardData.lastOrderDate = lastOrder.createdAt
      }

      // Get recent orders for dashboard
      const recentOrders = await Order.find({ buyer: userId })
        .populate({
          path: 'items.listing',
          select: 'cropName images farmer category unit',
          populate: {
            path: 'farmer',
            select: 'name email phone location profile.phone profile.farmName'
          }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('status total paymentStatus createdAt orderNumber items')

      dashboardData.recentOrders = recentOrders
    }
    
    // Get admin data
    if (userRole === 'admin') {
      const Harvest = require('../models/harvest.model')
      const User = require('../models/user.model')
      const Transaction = require('../models/transaction.model')
      
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const [totalHarvests, pendingApprovals, totalUsers, monthlyRevenue] = await Promise.all([
        Harvest.countDocuments(),
        Harvest.countDocuments({ status: 'pending' }),
        User.countDocuments(),
        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ])
      
      dashboardData.totalHarvests = totalHarvests
      dashboardData.pendingApprovals = pendingApprovals
      dashboardData.activeListings = totalUsers
      dashboardData.monthlyRevenue = monthlyRevenue[0]?.total || 0
    }
    
    return res.json({ status: 'success', data: dashboardData })
  } catch (error) {
    console.error('Dashboard error:', error)
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to load dashboard data' 
    })
  }
})

router.get('/profile/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('partner').select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -smsOtpToken -smsOtpExpires')

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Get additional profile data based on user role
    let profileData = {
      ...user.toObject(),
      stats: {
        totalHarvests: 0,
        totalListings: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastActive: user.stats?.lastActive || user.createdAt
      }
    }

    if (user.role === 'farmer') {
      // Get farmer-specific stats
      const Harvest = require('../models/harvest.model')
      const Listing = require('../models/listing.model')
      const Order = require('../models/order.model')
      const Transaction = require('../models/transaction.model')

      // Get farmer's listings first
      const farmerListings = await Listing.find({ farmer: user._id }).select('_id')
      const listingIds = farmerListings.map(listing => listing._id)

      // Check if farmer has a partner
      const hasPartner = user.partner

      // Platform fee rate (3%)
      const platformFeeRate = 0.03
      // Partner commission rate (5%)
      const partnerCommissionRate = hasPartner ? 0.05 : 0

      const [totalHarvests, totalListings, totalOrders, totalRevenueResult] = await Promise.all([
        Harvest.countDocuments({ farmer: user._id }),
        Listing.countDocuments({ farmer: user._id }),
        Order.countDocuments({ 'items.listing': { $in: listingIds } }),
        // Calculate total revenue from farmer's orders
        Order.aggregate([
          {
            $match: {
              'items.listing': { $in: listingIds },
              paymentStatus: 'paid'
            }
          },
          {
            $unwind: '$items'
          },
          {
            $match: {
              'items.listing': { $in: listingIds }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          }
        ])
      ])

      // Calculate net revenue after fees
      let totalRevenue = totalRevenueResult[0]?.total || 0
      const platformFee = totalRevenue * platformFeeRate
      const partnerCommission = totalRevenue * partnerCommissionRate
      totalRevenue = totalRevenue - platformFee - partnerCommission

      profileData.stats = {
        totalHarvests,
        totalListings,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        lastActive: user.stats?.lastActive || user.createdAt
      }

      // Get recent harvests
      const recentHarvests = await Harvest.find({ farmer: user._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('cropType quantity qualityGrade status createdAt')

      profileData.recentHarvests = recentHarvests

    } else if (user.role === 'buyer') {
      // Get buyer-specific stats
      const Order = require('../models/order.model')
      const Transaction = require('../models/transaction.model')
      const Favorite = require('../models/favorite.model')

      const [totalOrders, totalSpent, favoriteProducts] = await Promise.all([
        Order.countDocuments({ buyer: user._id }),
        Transaction.aggregate([
          { $match: { userId: user._id, type: 'payment', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Favorite.countDocuments({ user: user._id })
      ])

      profileData.stats = {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        favoriteProducts,
        lastActive: user.stats?.lastActive || user.createdAt
      }

      // Get recent orders
      const recentOrders = await Order.find({ buyer: user._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('status total paymentStatus createdAt')

      profileData.recentOrders = recentOrders

    } else if (user.role === 'partner') {
      // Get partner-specific data
      const partnerFarmers = await User.countDocuments({ partner: user.partner?._id, role: 'farmer' })
      const partnerHarvests = await require('../models/harvest.model').countDocuments({
        farmer: { $in: await User.find({ partner: user.partner?._id, role: 'farmer' }).distinct('_id') }
      })

      profileData.partnerStats = {
        totalFarmers: partnerFarmers,
        totalHarvests: partnerHarvests,
        partnerInfo: user.partner
      }
    }

    return res.json({ status: 'success', data: profileData })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile' })
  }
})

// Profile picture upload endpoint
router.post('/profile/avatar', authenticate, (req, res) => {
  try {
    // Configure multer for this specific route
    const multer = require('multer')
    const path = require('path')

    const storage = multer.memoryStorage()
    const upload = multer({
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedImageTypes.test(file.mimetype)

        if (mimetype && extname) {
          return cb(null, true)
        } else {
          cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'))
        }
      }
    })

    // Use multer middleware
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err)
        return res.status(400).json({
          status: 'error',
          message: err.message || 'File upload error'
        })
      }

      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No avatar file provided' })
      }

      try {
        const cloudinary = require('cloudinary').v2

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64')
        const dataURI = `data:${req.file.mimetype};base64,${b64}`

        // Upload to Cloudinary
        const uploadOptions = {
          folder: 'grochain/avatars',
          public_id: `avatar_${req.user.id}_${Date.now()}`,
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        }

        const result = await cloudinary.uploader.upload(dataURI, uploadOptions)

        // Update user's profile avatar
        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            'profile.avatar': result.secure_url,
            stats: { lastActive: new Date() }
          },
          { new: true }
        ).select('-password')

        if (!user) {
          return res.status(404).json({ status: 'error', message: 'User not found' })
        }

        return res.json({
          status: 'success',
          data: {
            avatar: result.secure_url,
            public_id: result.public_id
          },
          message: 'Avatar uploaded successfully'
        })
      } catch (error) {
        console.error('Error uploading avatar:', error)
        return res.status(500).json({
          status: 'error',
          message: 'Failed to upload avatar',
          error: error.message
        })
      }
    })
  } catch (error) {
    console.error('Route error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    })
  }
})

router.put('/profile/me', authenticate, async (req, res) => {
  try {
    const updateData = { ...req.body }

    // Remove sensitive fields that shouldn't be updated via profile
    delete updateData.password
    delete updateData.role
    delete updateData.status
    delete updateData.emailVerified
    delete updateData.phoneVerified
    delete updateData.resetPasswordToken
    delete updateData.resetPasswordExpires
    delete updateData.emailVerificationToken
    delete updateData.emailVerificationExpires
    delete updateData.smsOtpToken
    delete updateData.smsOtpExpires
    delete updateData.suspensionReason
    delete updateData.suspendedAt
    delete updateData.suspendedBy

    // Update last active timestamp
    updateData.stats = {
      ...updateData.stats,
      lastActive: new Date()
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -smsOtpToken -smsOtpExpires')

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    return res.json({ status: 'success', data: user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to update profile' })
  }
})

router.get('/preferences/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id)
  return res.json({ notifications: user?.notificationPreferences || {} })
})

router.put('/preferences/me', authenticate, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { notificationPreferences: req.body.notifications || {} }, { new: true })
  return res.json({ notifications: user.notificationPreferences })
})

router.get('/settings/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings preferences notificationPreferences profile')

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Return structured settings data
    const settingsData = {
      general: {
        language: user.settings?.language || 'en',
        timezone: user.settings?.timezone || 'Africa/Lagos',
        currency: user.settings?.currency || 'NGN',
        theme: user.settings?.theme || 'auto'
      },
      notifications: user.notificationPreferences || {},
      preferences: user.preferences || {},
      profile: {
        bio: user.profile?.bio || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        country: user.profile?.country || 'Nigeria',
        postalCode: user.profile?.postalCode || '',
        avatar: user.profile?.avatar || null
      },
      security: {
        twoFactorAuth: false, // Will be implemented later
        loginNotifications: true,
        sessionTimeout: 60 // minutes
      }
    }

    return res.json({ status: 'success', data: settingsData })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to fetch settings' })
  }
})

router.put('/settings/me', authenticate, async (req, res) => {
  try {
    const { general, notifications, preferences, security } = req.body

    // Prepare update data
    const updateData = {}

    if (general) {
      updateData.settings = {
        ...general
      }
    }

    if (notifications) {
      updateData.notificationPreferences = {
        ...notifications
      }
    }

    if (preferences) {
      updateData.preferences = {
        ...preferences
      }
    }

    // Note: Security settings will be handled separately for now
    // as they may require additional validation and implementation

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('settings preferences notificationPreferences')

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Return updated settings
    const settingsData = {
      general: {
        language: user.settings?.language || 'en',
        timezone: user.settings?.timezone || 'Africa/Lagos',
        currency: user.settings?.currency || 'NGN',
        theme: user.settings?.theme || 'auto'
      },
      notifications: user.notificationPreferences || {},
      preferences: user.preferences || {},
      security: {
        twoFactorAuth: false,
        loginNotifications: true,
        sessionTimeout: 60
      }
    }

    return res.json({ status: 'success', data: settingsData, message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to update settings' })
  }
})

router.get('/recent-activities', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const limit = parseInt(req.query.limit) || 10

    let activities = []

    // Get recent harvests for farmers
    if (userRole === 'farmer') {
      const Harvest = require('../models/harvest.model')
      const recentHarvests = await Harvest.find({ farmer: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('farmer', 'name')

      activities = recentHarvests.map(harvest => ({
        _id: harvest._id,
        type: 'harvest',
        description: `New harvest of ${harvest.quantity}${harvest.unit} ${harvest.cropType} submitted`,
        timestamp: harvest.createdAt,
        user: typeof harvest.farmer === 'object' ? harvest.farmer?.name || 'You' : harvest.farmer || 'You',
        metadata: {
          cropType: harvest.cropType,
          quantity: harvest.quantity,
          status: harvest.status
        }
      }))
    }

    // Get recent orders for buyers
    if (userRole === 'buyer') {
      const Order = require('../models/order.model')
      const Favorite = require('../models/favorite.model')
      
      // Get recent orders
      const recentOrders = await Order.find({ buyer: userId })
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit * 0.7)) // 70% of activities from orders
        .populate('buyer', 'name')
        .populate('items.listing', 'cropName')

      // Get recent favorites
      const recentFavorites = await Favorite.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit * 0.3)) // 30% of activities from favorites
        .populate('listing', 'cropName')
        .populate('user', 'name')

      // Map orders to activities
      const orderActivities = recentOrders.map(order => {
        const totalAmount = order.totalAmount || order.total || 0
        const orderNumber = order.orderNumber || order._id.toString().slice(-6)
        
        let description = ''
        if (order.items && order.items.length > 0) {
          const firstItem = order.items[0]
          const cropName = firstItem.listing?.cropName || 'product'
          description = `Order #${orderNumber} for ${cropName}`
          if (order.items.length > 1) {
            description += ` and ${order.items.length - 1} other item${order.items.length > 2 ? 's' : ''}`
          }
        } else {
          description = `Order #${orderNumber} placed`
        }

        return {
          _id: order._id,
          type: 'order',
          description: description,
          timestamp: order.createdAt,
          user: 'You',
          metadata: {
            amount: totalAmount,
            status: order.status,
            orderNumber: orderNumber
          }
        }
      })

      // Map favorites to activities
      const favoriteActivities = recentFavorites.map(favorite => ({
        _id: favorite._id,
        type: 'favorite',
        description: `Added ${favorite.listing?.cropName || 'product'} to favorites`,
        timestamp: favorite.createdAt,
        user: 'You',
        metadata: {
          listingId: favorite.listing?._id,
          cropName: favorite.listing?.cropName
        }
      }))

      // Combine and sort activities by timestamp
      activities = [...orderActivities, ...favoriteActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    }

    // Get recent activities for partners
    if (userRole === 'partner') {
      const Partner = require('../models/partner.model')
      const partner = await Partner.findOne({ user: userId })

      if (partner) {
        const Harvest = require('../models/harvest.model')
        const recentHarvests = await Harvest.find({ partner: partner._id })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('farmer', 'name')

        activities = recentHarvests.map(harvest => ({
          _id: harvest._id,
          type: 'harvest',
          description: `Harvest from ${typeof harvest.farmer === 'object' ? harvest.farmer?.name || 'Unknown Farmer' : harvest.farmer || 'Unknown Farmer'} verified`,
          timestamp: harvest.updatedAt || harvest.createdAt,
          user: typeof harvest.farmer === 'object' ? harvest.farmer?.name || 'Unknown Farmer' : harvest.farmer || 'Unknown Farmer',
          metadata: {
            cropType: harvest.cropType,
            quantity: harvest.quantity,
            status: harvest.status
          }
        }))
      }
    }

    return res.json({ status: 'success', data: activities })

  } catch (error) {
    console.error('Recent activities error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent activities'
    })
  }
})

// Avatar upload endpoint (must be before admin middleware)
router.post('/upload-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      })
    }

    const userId = req.user.id
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    // Update user profile with new avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'profile.avatar': avatarUrl
      },
      { new: true }
    )

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      data: {
        avatarUrl: avatarUrl,
        message: 'Avatar uploaded successfully'
      }
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload avatar'
    })
  }
})

// Proxy endpoint for serving avatars (bypasses CORS issues)
router.get('/avatar/:filename', async (req, res) => {
  try {
    console.log('Avatar proxy request received for:', req.params.filename)
    const fs = require('fs')
    const path = require('path')
    const filename = req.params.filename
    const filePath = path.join(__dirname, '..', 'uploads', 'avatars', filename)

    console.log('Looking for file at:', filePath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath)
      return res.status(404).json({
        status: 'error',
        message: 'Avatar not found'
      })
    }

    console.log('File exists, sending file...')
    // Send the file directly (no CORS issues since it's from the same origin)
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err)
        // Check if headers have already been sent before sending error response
        if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to serve avatar'
          })
        }
      } else {
        console.log('File sent successfully')
      }
    })
  } catch (error) {
    console.error('Avatar proxy error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to serve avatar'
    })
  }
})

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      })
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long'
      })
    }

    // Get user with password field
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      })
    }

    // Update password (pre-save middleware will hash it)
    user.password = newPassword
    await user.save()

    return res.json({
      status: 'success',
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    })
  }
})

// Admin suite
router.use(authenticate, authorize('admin'))

// List users
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query
  const query = {}
  if (role) query.role = role
  if (status) query.status = status
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') }
    ]
  }
  const users = await User.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit))
  const total = await User.countDocuments(query)
  return res.json({ status: 'success', data: { users, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total/limit), totalItems: total, itemsPerPage: parseInt(limit) } } })
})

// Create user
router.post('/', async (req, res) => {
  const user = await User.create(req.body)
  return res.status(201).json({ status: 'success', data: user })
})

// Get user
router.get('/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId)
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

// Update user
router.put('/:userId', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true })
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

// Delete user
router.delete('/:userId', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.userId)
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', message: 'User deleted' })
})

// Bulk create
router.post('/bulk-create', async (req, res) => {
  const { users } = req.body || {}
  if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ status: 'error', message: 'users array required' })
  const created = await User.insertMany(users, { ordered: false })
  return res.status(201).json({ status: 'success', data: { created: created.length } })
})

// Bulk update
router.put('/bulk-update', async (req, res) => {
  const { updates } = req.body || {}
  if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ status: 'error', message: 'updates array required' })
  for (const u of updates) { await User.findByIdAndUpdate(u.id, u.data) }
  return res.json({ status: 'success', message: 'Bulk update applied' })
})

// Bulk delete
router.delete('/bulk-delete', async (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ status: 'error', message: 'ids array required' })
  const result = await User.deleteMany({ _id: { $in: ids } })
  return res.json({ status: 'success', data: { deleted: result.deletedCount } })
})

// Search users
router.get('/search/query', async (req, res) => {
  const { q } = req.query
  const users = await User.find({ $or: [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') } ] }).limit(50)
  return res.json({ status: 'success', data: users })
})

// Stats & activity
router.get('/:userId/stats', async (req, res) => {
  return res.json({ status: 'success', data: { orders: 0, harvests: 0, listings: 0 } })
})

router.get('/:userId/activity', async (req, res) => {
  return res.json({ status: 'success', data: [] })
})

// Verify / suspend / reactivate / change role
router.post('/:userId/verify', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { emailVerified: true }, { new: true })
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

router.patch('/:userId/suspend', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { status: 'suspended', suspendedAt: new Date(), suspensionReason: req.body?.reason }, { new: true })
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

router.patch('/:userId/reactivate', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { status: 'active', suspensionReason: null, suspendedAt: null }, { new: true })
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

router.patch('/:userId/role', async (req, res) => {
  const { role } = req.body || {}
  if (!role) return res.status(400).json({ status: 'error', message: 'role required' })
  const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true })
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
  return res.json({ status: 'success', data: user })
})

// Export users (stub)
router.post('/export', async (req, res) => {
  return res.json({ status: 'success', data: { url: null, message: 'Not yet implemented' } })
})



module.exports = router


