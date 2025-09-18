const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Transaction = require('../models/transaction.model')
const FarmerProfile = require('../models/farmer-profile.model')
const Order = require('../models/order.model')
const Listing = require('../models/listing.model')

const farmerController = {
  // Get farmer's own profile
  async getMyProfile(req, res) {
    try {
      const farmerId = req.user.id
      
      const profile = await FarmerProfile.findOne({ farmer: farmerId })
        .populate('farmer', 'name email phone region')
      
      if (!profile) {
        // Return a default profile structure instead of 404
        const defaultProfile = {
          _id: null,
          farmer: farmerId,
          farmName: '',
          farmSize: 0,
          farmLocation: {
            address: '',
            city: '',
            state: '',
            coordinates: {
              latitude: 0,
              longitude: 0
            }
          },
          primaryCrops: [],
          farmingExperience: 0,
          farmingMethod: 'traditional',
          irrigationType: 'rainfed',
          annualIncome: 0,
          bankAccount: {
            bankName: '',
            accountNumber: '',
            accountName: ''
          },
          preferences: {
            language: 'english',
            notifications: {
              sms: true,
              email: true,
              push: true
            },
            marketPreferences: {
              preferredBuyers: [],
              preferredPaymentMethods: [],
              preferredDeliveryMethods: []
            }
          },
          settings: {
            privacy: {
              profileVisibility: 'public',
              dataSharing: true
            },
            business: {
              autoAcceptOrders: false,
              requireApproval: true
            }
          },
          verificationStatus: 'pending',
          verificationDocuments: [],
          referredBy: '',
          referralDate: new Date(),
          performanceMetrics: {
            totalHarvests: 0,
            averageYield: 0,
            customerRating: 0,
            onTimeDelivery: 0,
            qualityScore: 0
          },
          isActive: true,
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        return res.json({
          status: 'success',
          data: defaultProfile,
          message: 'Default profile created'
        })
      }
      
      res.json({
        status: 'success',
        data: profile
      })
    } catch (error) {
      console.error('Error getting farmer profile:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer profile'
      })
    }
  },

  // Update farmer's own profile
  async updateMyProfile(req, res) {
    try {
      const farmerId = req.user.id
      const updateData = req.body
      
      // Remove sensitive fields that shouldn't be updated
      delete updateData.farmer
      delete updateData._id
      
      const profile = await FarmerProfile.findOneAndUpdate(
        { farmer: farmerId },
        updateData,
        { new: true, runValidators: true }
      ).populate('farmer', 'name email phone region')
      
      if (!profile) {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer profile not found'
        })
      }
      
      res.json({
        status: 'success',
        data: profile,
        message: 'Profile updated successfully'
      })
    } catch (error) {
      console.error('Error updating farmer profile:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update farmer profile'
      })
    }
  },

  // Get farmer's preferences
  async getMyPreferences(req, res) {
    try {
      const farmerId = req.user.id
      
      const profile = await FarmerProfile.findOne({ farmer: farmerId })
        .select('preferences')
      
      if (!profile) {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer profile not found'
        })
      }
      
      res.json({
        status: 'success',
        data: profile.preferences || {}
      })
    } catch (error) {
      console.error('Error getting farmer preferences:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer preferences'
      })
    }
  },

  // Update farmer's preferences
  async updateMyPreferences(req, res) {
    try {
      const farmerId = req.user.id
      const preferences = req.body
      
      const profile = await FarmerProfile.findOneAndUpdate(
        { farmer: farmerId },
        { preferences },
        { new: true, runValidators: true }
      )
      
      if (!profile) {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer profile not found'
        })
      }
      
      res.json({
        status: 'success',
        data: profile.preferences,
        message: 'Preferences updated successfully'
      })
    } catch (error) {
      console.error('Error updating farmer preferences:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update farmer preferences'
      })
    }
  },

  // Get farmer's settings
  async getMySettings(req, res) {
    try {
      const farmerId = req.user.id
      
      const profile = await FarmerProfile.findOne({ farmer: farmerId })
        .select('settings')
      
      if (!profile) {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer profile not found'
        })
      }
      
      res.json({
        status: 'success',
        data: profile.settings || {}
      })
    } catch (error) {
      console.error('Error getting farmer settings:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer settings'
      })
    }
  },

  // Update farmer's settings
  async updateMySettings(req, res) {
    try {
      const farmerId = req.user.id
      const settings = req.body
      
      const profile = await FarmerProfile.findOneAndUpdate(
        { farmer: farmerId },
        { settings },
        { new: true, runValidators: true }
      )
      
      if (!profile) {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer profile not found'
        })
      }
      
      res.json({
        status: 'success',
        data: profile.settings,
        message: 'Settings updated successfully'
      })
    } catch (error) {
      console.error('Error updating farmer settings:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update farmer settings'
      })
    }
  },

  // Get farmer's own listings
  async getMyListings(req, res) {
    try {
      const farmerId = req.user.id
      const { 
        page = 1, 
        limit = 20, 
        status = 'all',
        category = 'all',
        search = ''
      } = req.query

      const query = { farmer: farmerId }

      // Apply filters
      if (status !== 'all') {
        query.status = status
      }
      if (category !== 'all') {
        query.category = category
      }
      if (search) {
        query.$or = [
          { cropName: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ]
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)

      const [listings, total] = await Promise.all([
        Listing.find(query)
          .populate('harvest', 'batchId cropType quality harvestDate')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Listing.countDocuments(query)
      ])

      // Parse location strings into objects for each listing
      const processedListings = listings.map(listing => {
        let locationObject = null
        if (listing.location) {
          if (typeof listing.location === 'string') {
            const locationParts = listing.location.split(',').map(part => part.trim())
            locationObject = {
              city: locationParts[0] || 'Unknown City',
              state: locationParts[1] || 'Unknown State',
              country: locationParts[2] || 'Nigeria'
            }
          } else if (typeof listing.location === 'object') {
            locationObject = listing.location
          }
        }

        return {
          ...listing.toObject(),
          location: locationObject
        }
      })

      res.json({
        status: 'success',
        data: {
          listings: processedListings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } catch (error) {
      console.error('Error getting farmer listings:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer listings'
      })
    }
  },

  // Get farmer's orders
  async getMyOrders(req, res) {
    try {
      const farmerId = req.user.id
      const { 
        page = 1, 
        limit = 20, 
        status = 'all'
      } = req.query

      const query = { seller: farmerId }

      // Apply status filter
      if (status !== 'all') {
        query.status = status
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('buyer', 'name email phone')
          .populate('items.listing', 'cropName category unit')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Order.countDocuments(query)
      ])

      // Process orders to include farmer-specific data
      const processedOrders = orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customer: {
          name: order.buyer?.name || 'Unknown Customer',
          email: order.buyer?.email || '',
          phone: order.buyer?.phone || ''
        },
        products: order.items?.map(item => ({
          listingId: item.listing?._id,
          cropName: item.listing?.cropName || 'Unknown Product',
          quantity: item.quantity,
          unit: item.unit || 'kg',
          price: item.price
        })) || [],
        totalAmount: order.total,
        subtotal: order.subtotal,
        shipping: order.shipping,
        shippingMethod: order.shippingMethod,
        status: order.status,
        orderDate: order.createdAt,
        expectedDelivery: order.estimatedDelivery || '',
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes
      }))

      res.json({
        status: 'success',
        data: {
          orders: processedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } catch (error) {
      console.error('Error getting farmer orders:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer orders'
      })
    }
  },

  // Get farmer dashboard data
  async getDashboardData(req, res) {
    try {
      const farmerId = req.user.id

      // Get recent harvests
      const recentHarvests = await Harvest.find({ farmer: farmerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('cropType quantity status createdAt')

      // Get harvest count
      const harvestCount = await Harvest.countDocuments({ farmer: farmerId })

      // Get pending approvals (harvests awaiting approval + pending orders)
      const pendingHarvests = await Harvest.countDocuments({
        farmer: farmerId,
        status: 'pending'
      })

      // Also count pending orders that need farmer approval
      const pendingOrders = await Order.countDocuments({
        seller: farmerId,
        status: 'pending'
      })

      const pendingApprovals = pendingHarvests + pendingOrders

      // Get active listings count
      const activeListings = await Listing.countDocuments({
        farmer: farmerId,
        status: 'active'
      })

      // Calculate monthly revenue (current month)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // Get orders for farmer's listings in current month
      const monthlyOrders = await Order.find({
        seller: farmerId,
        status: { $in: ['paid', 'delivered'] },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).populate('items.listing')

      // Calculate monthly revenue
      let monthlyRevenue = 0
      monthlyOrders.forEach(order => {
        order.items?.forEach(item => {
          if (item.listing && item.listing.farmer && item.listing.farmer.toString() === farmerId.toString()) {
            monthlyRevenue += item.total || 0
          }
        })
      })

      // Get total earnings (all time) - from orders where farmer is seller
      const farmerOrders = await Order.find({
        seller: farmerId,
        status: { $in: ['paid', 'delivered'] }
      }).select('_id')

      const orderIds = farmerOrders.map(order => order._id)

      const earnings = await Transaction.aggregate([
        {
          $match: {
            $or: [
              { orderId: { $in: orderIds } },
              { type: 'commission', userId: farmerId }
            ],
            status: 'completed'
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])

      const dashboardData = {
        // Map to frontend expected fields
        totalHarvests: harvestCount,
        pendingApprovals: pendingApprovals,
        activeListings: activeListings,
        monthlyRevenue: monthlyRevenue,

        // Additional data
        recentHarvests,
        totalEarnings: earnings[0]?.total || 0,
        lastUpdated: new Date()
      }

      res.json({
        status: 'success',
        data: dashboardData
      })
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get dashboard data'
      })
    }
  },

  // Get harvest summary
  async getHarvestSummary(req, res) {
    try {
      const farmerId = req.user.id
      
      const summary = await Harvest.aggregate([
        { $match: { farmer: farmerId } },
        { $group: { 
          _id: '$status', 
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }},
        { $sort: { count: -1 } }
      ])
      
      res.json({
        status: 'success',
        data: summary
      })
    } catch (error) {
      console.error('Error getting harvest summary:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get harvest summary'
      })
    }
  },

  // Get earnings summary
  async getEarningsSummary(req, res) {
    try {
      const farmerId = req.user.id
      
      const earnings = await Transaction.aggregate([
        { $match: { farmer: farmerId, type: 'sale', status: 'completed' } },
        { $group: { 
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
      
      res.json({
        status: 'success',
        data: earnings
      })
    } catch (error) {
      console.error('Error getting earnings summary:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get earnings summary'
      })
    }
  },

  // Search farmers (for partners)
  async searchFarmers(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query
      
      if (!search || search.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Search term must be at least 2 characters long'
        })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const searchRegex = new RegExp(search.trim(), 'i')

      // Search farmers by name, email, or phone
      const query = {
        role: 'farmer',
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }

      const [farmers, total] = await Promise.all([
        User.find(query)
          .select('name email phone location profile.farmName')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ name: 1 }),
        User.countDocuments(query)
      ])

      // Format response
      const formattedFarmers = farmers.map(farmer => ({
        _id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        location: farmer.location || 'Not specified',
        farmName: farmer.profile?.farmName || 'Not specified'
      }))

      res.json({
        status: 'success',
        data: {
          farmers: formattedFarmers,
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          hasNextPage: skip + farmers.length < total,
          hasPrevPage: page > 1
        }
      })
    } catch (error) {
      console.error('Error searching farmers:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to search farmers'
      })
    }
  }
}

module.exports = farmerController

