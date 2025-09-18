const Commission = require('../models/commission.model')
const Partner = require('../models/partner.model')
const User = require('../models/user.model')
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')

const commissionController = {
  // Get all commissions with filters
  async getCommissions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        partnerId,
        farmerId,
        status,
        commissionType,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const query = {}

      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      } else if (partnerId) {
        query.partner = partnerId
      }

      if (farmerId) query.farmer = farmerId
      if (status) query.status = status

      // Commission type filtering
      if (commissionType) {
        query['metadata.commissionType'] = commissionType
      }

      // Date filtering
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [commissions, total] = await Promise.all([
        Commission.find(query)
          .populate('partner', 'name organization commissionRate')
          .populate('farmer', 'name email phone')
          .populate('order', 'orderNumber total status buyer')
          .populate('listing', 'cropName price quantity')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Commission.countDocuments(query)
      ])

      // Add commission type breakdown
      const typeBreakdown = await Commission.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$metadata.commissionType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])

      res.json({
        status: 'success',
        data: {
          commissions,
          summary: {
            totalCommissions: total,
            totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
            typeBreakdown: typeBreakdown.reduce((acc, type) => {
              acc[type._id || 'unknown'] = {
                count: type.count,
                totalAmount: type.totalAmount
              }
              return acc
            }, {})
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting commissions:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get commissions'
      })
    }
  },

  // Get commission by ID
  async getCommissionById(req, res) {
    try {
      const { id } = req.params
      
      const commission = await Commission.findById(id)
        .populate('partner', 'name organization')
        .populate('farmer', 'name email phone')
        .populate('order', 'orderNumber total status buyer')
        .populate('listing', 'cropName price quantity')
      
      if (!commission) {
        return res.status(404).json({
          status: 'error',
          message: 'Commission not found'
        })
      }
      
      // Check permissions
      if (req.user.role === 'partner' && commission.partner.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }
      
      res.json({
        status: 'success',
        data: commission
      })
    } catch (error) {
      console.error('Error getting commission:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get commission'
      })
    }
  },

  // Create commission
  async createCommission(req, res) {
    try {
      if (!['admin', 'system'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Only admins and system can create commissions'
        })
      }
      
      const { partnerId, farmerId, orderId, listingId, amount, rate } = req.body
      
      if (!partnerId || !farmerId || !orderId || !listingId || !amount || !rate) {
        return res.status(400).json({
          status: 'error',
          message: 'All fields are required'
        })
      }
      
      // Verify entities exist
      const [partner, farmer, order, listing] = await Promise.all([
        Partner.findById(partnerId),
        User.findById(farmerId),
        Order.findById(orderId),
        require('../models/listing.model').findById(listingId)
      ])
      
      if (!partner || !farmer || !order || !listing) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more entities not found'
        })
      }
      
      // Check if commission already exists
      const existingCommission = await Commission.findOne({
        partner: partnerId,
        order: orderId,
        listing: listingId
      })
      
      if (existingCommission) {
        return res.status(409).json({
          status: 'error',
          message: 'Commission already exists for this order and listing'
        })
      }
      
      // Create commission
      const commission = await Commission.create({
        partner: partnerId,
        farmer: farmerId,
        order: orderId,
        listing: listingId,
        amount: Number(amount),
        rate: Number(rate),
        orderAmount: order.total,
        orderDate: order.createdAt,
        status: 'pending'
      })
      
      // Update partner's total commissions
      await Partner.findByIdAndUpdate(partnerId, {
        $inc: { totalCommissions: Number(amount) }
      })
      
      res.status(201).json({
        status: 'success',
        data: commission
      })
    } catch (error) {
      console.error('Error creating commission:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create commission'
      })
    }
  },

  // Update commission status
  async updateCommissionStatus(req, res) {
    try {
      const { id } = req.params
      const { status, notes } = req.body
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const commission = await Commission.findById(id)
      if (!commission) {
        return res.status(404).json({
          status: 'error',
          message: 'Commission not found'
        })
      }
      
      // Check permissions
      if (req.user.role === 'partner' && commission.partner.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }
      
      // Update commission
      commission.status = status
      if (notes) commission.notes = notes
      commission.updatedAt = new Date()
      
      await commission.save()
      
      res.json({
        status: 'success',
        data: commission
      })
    } catch (error) {
      console.error('Error updating commission status:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update commission status'
      })
    }
  },

  // Get commission statistics
  async getCommissionStats(req, res) {
    try {
      const { partnerId, farmerId, startDate, endDate } = req.query

      const query = {}

      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      } else if (partnerId) {
        query.partner = partnerId
      }

      if (farmerId) query.farmer = farmerId

      // Date filtering
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      const stats = await Commission.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])

      const totalCommissions = await Commission.countDocuments(query)
      const totalAmount = await Commission.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])

      // Get commission type breakdown
      const typeBreakdown = await Commission.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$metadata.commissionType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        }
      ])

      // Get monthly breakdown
      const monthlyBreakdown = await Commission.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])

      // Get platform fee summary
      const platformFeeSummary = await Commission.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalPlatformFees: { $sum: '$metadata.platformFee' },
            averagePlatformFee: { $avg: '$metadata.platformFee' },
            totalPartnerCommissions: { $sum: '$amount' },
            totalOrderValue: { $sum: '$orderAmount' }
          }
        }
      ])

      const platformStats = platformFeeSummary[0] || {
        totalPlatformFees: 0,
        averagePlatformFee: 0,
        totalPartnerCommissions: 0,
        totalOrderValue: 0
      }

      res.json({
        status: 'success',
        data: {
          totalCommissions,
          totalAmount: totalAmount[0]?.total || 0,
          statusBreakdown: stats,
          typeBreakdown: typeBreakdown.reduce((acc, type) => {
            acc[type._id || 'unknown'] = {
              count: type.count,
              totalAmount: type.totalAmount,
              averageAmount: type.averageAmount
            }
            return acc
          }, {}),
          monthlyBreakdown,
          platformSummary: {
            totalPlatformFees: platformStats.totalPlatformFees,
            totalPartnerCommissions: platformStats.totalPartnerCommissions,
            totalOrderValue: platformStats.totalOrderValue,
            totalDeductions: platformStats.totalPlatformFees + platformStats.totalPartnerCommissions,
            platformSharePercentage: platformStats.totalOrderValue > 0 ?
              (platformStats.totalPlatformFees / platformStats.totalOrderValue * 100).toFixed(2) : 0,
            partnerSharePercentage: platformStats.totalOrderValue > 0 ?
              (platformStats.totalPartnerCommissions / platformStats.totalOrderValue * 100).toFixed(2) : 0
          },
          averageCommission: totalCommissions > 0 ?
            (totalAmount[0]?.total || 0) / totalCommissions : 0
        }
      })
    } catch (error) {
      console.error('Error getting commission stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get commission statistics'
      })
    }
  },

  // Process commission payout
  async processCommissionPayout(req, res) {
    try {
      const { commissionIds, payoutMethod, payoutDetails } = req.body
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Commission IDs are required'
        })
      }
      
      const query = { _id: { $in: commissionIds }, status: 'pending' }
      
      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      }
      
      const commissions = await Commission.find(query)
      
      if (commissions.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No valid commissions found for payout'
        })
      }
      
      const totalPayoutAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
      
      // Update commission statuses
      await Commission.updateMany(
        { _id: { $in: commissionIds } },
        { 
          status: 'paid',
          paidAt: new Date(),
          payoutMethod,
          payoutDetails
        }
      )
      
      // Create payout transaction
      const payoutTransaction = await Transaction.create({
        type: 'commission_payout',
        status: 'completed',
        amount: totalPayoutAmount,
        currency: 'NGN',
        reference: `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: `Commission payout for ${commissions.length} commissions`,
        userId: req.user.id,
        metadata: {
          commissionIds,
          payoutMethod,
          payoutDetails
        }
      })
      
      res.json({
        status: 'success',
        data: {
          totalPayoutAmount,
          processedCommissions: commissions.length,
          payoutTransaction
        }
      })
    } catch (error) {
      console.error('Error processing commission payout:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to process commission payout'
      })
    }
  },

  // Get partner commission summary
  async getPartnerCommissionSummary(req, res) {
    try {
      const { partnerId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      // Check permissions
      if (req.user.role === 'partner' && partnerId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }
      
      const query = { partner: partnerId }
      
      const [totalCommissions, pendingCommissions, paidCommissions] = await Promise.all([
        Commission.countDocuments(query),
        Commission.countDocuments({ ...query, status: 'pending' }),
        Commission.countDocuments({ ...query, status: 'paid' })
      ])
      
      const [totalAmount, pendingAmount, paidAmount] = await Promise.all([
        Commission.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { $match: { ...query, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { $match: { ...query, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ])
      
      // Get recent commissions
      const recentCommissions = await Commission.find(query)
        .populate('farmer', 'name')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .limit(5)
      
      res.json({
        status: 'success',
        data: {
          summary: {
            totalCommissions,
            pendingCommissions,
            paidCommissions,
            totalAmount: totalAmount[0]?.total || 0,
            pendingAmount: pendingAmount[0]?.total || 0,
            paidAmount: paidAmount[0]?.total || 0
          },
          recentCommissions
        }
      })
    } catch (error) {
      console.error('Error getting partner commission summary:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get partner commission summary'
      })
    }
  }
}

module.exports = commissionController

