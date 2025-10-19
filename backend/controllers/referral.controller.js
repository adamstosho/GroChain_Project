const Referral = require('../models/referral.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')
const Commission = require('../models/commission.model')

const referralController = {
  // Get referrals for partner
  async getReferrals(req, res) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 10, status, farmerId } = req.query

      // Get the user's actual email from the database
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }

      // Build query - find partner by email, create if not exists
      let partner = await Partner.findOne({ email: user.email })

      if (!partner) {
        console.log('🔍 Creating new partner profile for:', user.email)
        // Create partner profile
        partner = new Partner({
          name: user.name,
          email: user.email,
          phone: user.phone || '+234000000000',
          organization: `${user.name} Organization`,
          type: 'cooperative',
          location: user.location || 'Nigeria',
          status: 'active',
          commissionRate: 0.02,
          farmers: [],
          totalFarmers: 0,
          totalCommissions: 0
        })
        await partner.save()
        console.log('✅ Partner profile created:', partner.name)
      }

      const query = { partner: partner._id }
      if (status) query.status = status
      if (farmerId) query.farmer = farmerId

      // Use regular MongoDB queries instead of paginate
      const skip = (parseInt(page) - 1) * parseInt(limit)

      const referrals = await Referral.find(query)
        .populate([
          { path: 'farmer', select: 'name email phone region' },
          { path: 'partner', select: 'name type contactEmail' }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Referral.countDocuments(query)
      
      res.json({
        status: 'success',
        data: {
          docs: referrals,
          totalDocs: total,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      })
    } catch (error) {
      console.error('Error getting referrals:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get referrals'
      })
    }
  },

  // Create new referral
  async createReferral(req, res) {
    try {
      console.log('🔍 Create referral called by user:', req.user.id, 'Role:', req.user.role)
      const userId = req.user.id
      const { farmerId, notes, commissionRate = 0.02 } = req.body
      
      console.log('🔍 Request body:', { farmerId, notes, commissionRate })
      
      if (!farmerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Farmer ID is required'
        })
      }
      
      // Get user's email from database if not in JWT
      let userEmail = req.user.email
      if (!userEmail) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          })
        }
        userEmail = user.email
      }
      
      // Check if partner exists, create if not
      console.log('🔍 Looking for partner with email:', userEmail)
      let partner = await Partner.findOne({ email: userEmail })
      if (!partner) {
        console.log('🔍 Creating new partner profile for:', userEmail)
        // Get user details for partner creation
        const user = await User.findById(userId)
        if (!user) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          })
        }
        
        // Create partner profile
        partner = new Partner({
          name: user.name,
          email: user.email,
          phone: user.phone || '+234000000000',
          organization: `${user.name} Organization`,
          type: 'cooperative',
          location: user.location || 'Nigeria',
          status: 'active',
          commissionRate: 0.02,
          farmers: [],
          totalFarmers: 0,
          totalCommissions: 0
        })
        await partner.save()
        console.log('✅ Partner profile created:', partner.name)
      } else {
        console.log('✅ Partner found:', partner.name)
      }
      
      // Check if farmer exists
      console.log('🔍 Looking for farmer with ID:', farmerId)
      const farmer = await User.findById(farmerId)
      if (!farmer) {
        console.log('❌ Farmer not found with ID:', farmerId)
        return res.status(404).json({
          status: 'error',
          message: 'Farmer not found'
        })
      }
      console.log('✅ Farmer found:', farmer.name)
      
      // Check if referral already exists
      const existingReferral = await Referral.findOne({
        farmer: farmerId,
        partner: partner._id
      })
      
      if (existingReferral) {
        return res.status(400).json({
          status: 'error',
          message: 'Referral already exists for this farmer'
        })
      }
      
      // Create referral
      console.log('🔍 Creating referral...')
      const referral = new Referral({
        farmer: farmerId,
        partner: partner._id,
        status: 'pending',
        commissionRate,
        notes: notes || 'Referral created by partner'
      })
      
      await referral.save()
      console.log('✅ Referral created successfully:', referral._id)
      
      // Populate farmer and partner details
      await referral.populate([
        { path: 'farmer', select: 'name email phone region' },
        { path: 'partner', select: 'name type contactEmail' }
      ])
      
      // If referral should be auto-activated, update farmer's partner field
      if (referral.status === 'active') {
        if (!farmer.partner) {
          farmer.partner = partner._id;
          await farmer.save();
          console.log(`Auto-updated farmer ${farmer.name} partner to ${partner._id}`);
        }
      }

      res.status(201).json({
        status: 'success',
        data: referral,
        message: 'Referral created successfully'
      })
    } catch (error) {
      console.error('❌ Error creating referral:', error)
      console.error('❌ Error stack:', error.stack)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create referral',
        error: error.message
      })
    }
  },

  // Get referral by ID
  async getReferralById(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const referral = await Referral.findById(id)
        .populate([
          { path: 'farmer', select: 'name email phone region' },
          { path: 'partner', select: 'name type contactEmail' }
        ])

      if (!referral) {
        return res.status(404).json({
          status: 'error',
          message: 'Referral not found'
        })
      }

      // Get the user's partner profile
      let userEmail = req.user.email
      if (!userEmail) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          })
        }
        userEmail = user.email
      }

      const partner = await Partner.findOne({ email: userEmail })

      // Check if user has access to this referral
      if (partner && referral.partner.toString() === partner._id.toString()) {
        // User is the partner who created this referral - allow access
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }
      
      res.json({
        status: 'success',
        data: referral
      })
    } catch (error) {
      console.error('Error getting referral by ID:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get referral'
      })
    }
  },

  // Update referral
  async updateReferral(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      const referral = await Referral.findById(id)

      if (!referral) {
        return res.status(404).json({
          status: 'error',
          message: 'Referral not found'
        })
      }

      // Get the user's partner profile
      let userEmail = req.user.email
      if (!userEmail) {
        const user = await User.findById(userId)
        if (!user) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          })
        }
        userEmail = user.email
      }

      const partner = await Partner.findOne({ email: userEmail })

      // Check if user has access to update this referral
      if (partner && referral.partner.toString() === partner._id.toString()) {
        // User is the partner who created this referral - allow access
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }
      
      // Remove fields that shouldn't be updated
      delete updateData._id
      delete updateData.farmer
      delete updateData.partner

      // If status is being changed to 'active', update the farmer's partner field
      if (updateData.status === 'active') {
        const farmer = await User.findById(referral.farmer)
        if (farmer && !farmer.partner) {
          farmer.partner = referral.partner
          await farmer.save()
          console.log(`Updated farmer ${farmer.name} (${farmer._id}) partner to ${referral.partner}`)
        }
      }

      const updatedReferral = await Referral.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: 'farmer', select: 'name email phone region' },
        { path: 'partner', select: 'name type contactEmail' }
      ])
      
      res.json({
        status: 'success',
        data: updatedReferral,
        message: 'Referral updated successfully'
      })
    } catch (error) {
      console.error('Error updating referral:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update referral'
      })
    }
  },

  // Delete referral
  async deleteReferral(req, res) {
    try {
      const { id } = req.params
      const user = req.user // From auth middleware
      
      const referral = await Referral.findById(id)
      
      if (!referral) {
        return res.status(404).json({
          status: 'error',
          message: 'Referral not found'
        })
      }
      
      // Check if user can delete this referral
      // Admins can delete any referral
      // Partners can only delete their own referrals
      if (user.role === 'partner') {
        // Find partner by user email (since user.partner might not be set)
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: user.email })
        
        console.log('🔍 Authorization check:', {
          userRole: user.role,
          userEmail: user.email,
          userPartner: user.partner,
          referralPartner: referral.partner,
          foundPartner: partner?._id,
          referralPartnerString: referral.partner.toString(),
          foundPartnerString: partner?._id?.toString()
        })
        
        if (!partner || referral.partner.toString() !== partner._id.toString()) {
          console.log('❌ Authorization failed - partner mismatch')
          return res.status(403).json({
            status: 'error',
            message: 'You can only delete your own referrals'
          })
        }
      }
      
      console.log('✅ Authorization passed')
      
      // Clean up farmer's partner field when deleting referral
      const User = require('../models/user.model')
      await User.findByIdAndUpdate(referral.farmer, {
        $unset: { partner: 1 }
      })
      
      // Remove farmer from partner's farmers array
      const Partner = require('../models/partner.model')
      await Partner.findByIdAndUpdate(referral.partner, {
        $pull: { farmers: referral.farmer }
      })
      
      // Update partner's totalFarmers count
      const partner = await Partner.findById(referral.partner)
      if (partner) {
        partner.totalFarmers = partner.farmers.length
        await partner.save()
      }
      
      await Referral.findByIdAndDelete(id)
      
      res.json({
        status: 'success',
        message: 'Referral deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting referral:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete referral'
      })
    }
  },

  // Get referral statistics
  async getReferralStats(req, res) {
    try {
      const userId = req.user.id

      // Get the user's actual email from the database
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }

      // Find partner by user's actual email
      const partner = await Partner.findOne({ email: user.email })
      if (!partner) {
        return res.json({
          status: 'success',
          data: {
            totalReferrals: 0,
            pendingReferrals: 0,
            activeReferrals: 0,
            completedReferrals: 0,
            conversionRate: 0,
            monthlyGrowth: 0,
            averageCommission: 0,
            statusBreakdown: [],
            performanceData: []
          }
        })
      }

      const stats = await Referral.aggregate([
        { $match: { partner: partner._id } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCommission: { $sum: '$commission' }
        }}
      ])

      const totalReferrals = await Referral.countDocuments({ partner: partner._id })
      const completedReferrals = await Referral.countDocuments({
        partner: partner._id,
        status: 'completed'
      })
      const activeReferrals = await Referral.countDocuments({
        partner: partner._id,
        status: 'active'
      })
      const pendingReferrals = await Referral.countDocuments({
        partner: partner._id,
        status: 'pending'
      })

      // Calculate average commission
      const totalCommission = await Referral.aggregate([
        { $match: { partner: partner._id, commission: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$commission' }, count: { $sum: 1 } } }
      ])

      const averageCommission = totalCommission.length > 0
        ? totalCommission[0].total / totalCommission[0].count
        : 0

      // Calculate monthly growth (simplified - referrals this month vs last month)
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const thisMonthReferrals = await Referral.countDocuments({
        partner: partner._id,
        createdAt: { $gte: thisMonth }
      })

      const lastMonthReferrals = await Referral.countDocuments({
        partner: partner._id,
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      })

      const monthlyGrowth = lastMonthReferrals > 0
        ? ((thisMonthReferrals - lastMonthReferrals) / lastMonthReferrals * 100)
        : (thisMonthReferrals > 0 ? 100 : 0) // If no referrals last month but some this month, show 100% growth

      const overview = {
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        completedReferrals,
        conversionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100 * 10) / 10 : 0,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        averageCommission: Math.round(averageCommission * 100) / 100,
        statusBreakdown: stats.map(stat => ({
          _id: stat._id,
          count: stat.count
        })),
        performanceData: [
          { month: 'Jan', referrals: 8, completed: 3, conversion: 37.5 },
          { month: 'Feb', referrals: 12, completed: 4, conversion: 33.3 },
          { month: 'Mar', referrals: 15, completed: 5, conversion: 33.3 },
          { month: 'Apr', referrals: 10, completed: 3, conversion: 30.0 }
        ], // TODO: Replace with real performance data
        lastUpdated: new Date()
      }

      res.json({
        status: 'success',
        data: overview
      })
    } catch (error) {
      console.error('Error getting referral stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get referral statistics'
      })
    }
  },

  // Get performance statistics
  async getPerformanceStats(req, res) {
    try {
      const userId = req.user.id
      const { period = 'month' } = req.query
      
      let dateFilter = {}
      const now = new Date()
      
      if (period === 'week') {
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      } else if (period === 'month') {
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      } else if (period === 'year') {
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) }
      }
      
      const performance = await Referral.aggregate([
        { $match: { partner: userId, createdAt: dateFilter } },
        { $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          referrals: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          commission: { $sum: '$commission' }
        }},
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ])
      
      res.json({
        status: 'success',
        data: performance
      })
    } catch (error) {
      console.error('Error getting performance stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get performance statistics'
      })
    }
  },

  // Get pending commissions
  async getPendingCommissions(req, res) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 10 } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
          { path: 'farmer', select: 'name email phone region' }
        ],
        sort: { createdAt: -1 }
      }
      
      const pendingCommissions = await Referral.paginate({
        partner: userId,
        status: 'completed',
        commission: { $gt: 0 }
      }, options)
      
      res.json({
        status: 'success',
        data: pendingCommissions
      })
    } catch (error) {
      console.error('Error getting pending commissions:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get pending commissions'
      })
    }
  },

  // Get paid commissions
  async getPaidCommissions(req, res) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 10 } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
          { path: 'farmer', select: 'name email phone region' }
        ],
        sort: { updatedAt: -1 }
      }
      
      const paidCommissions = await Commission.paginate({
        partner: userId,
        status: 'paid'
      }, options)
      
      res.json({
        status: 'success',
        data: paidCommissions
      })
    } catch (error) {
      console.error('Error getting paid commissions:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get paid commissions'
      })
    }
  }
}

// Sync farmer-partner relationships for active referrals
referralController.syncFarmerPartners = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the user's partner profile
    const partner = await Partner.findOne({ email: req.user.email });
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner profile not found'
      });
    }

    // Find all active/completed referrals for this partner
    const activeReferrals = await Referral.find({
      partner: partner._id,
      status: { $in: ['active', 'completed'] }
    }).populate('farmer', 'name email partner');

    let syncedCount = 0;
    let skippedCount = 0;

    for (const referral of activeReferrals) {
      if (referral.farmer) {
        if (!referral.farmer.partner) {
          // Update farmer's partner field
          await User.findByIdAndUpdate(referral.farmer._id, {
            partner: partner._id
          });
          syncedCount++;
          console.log(`Synced farmer ${referral.farmer.name} with partner ${partner.name}`);
        } else if (referral.farmer.partner.toString() !== partner._id.toString()) {
          // Update if farmer has different partner
          await User.findByIdAndUpdate(referral.farmer._id, {
            partner: partner._id
          });
          syncedCount++;
          console.log(`Updated farmer ${referral.farmer.name} partner to ${partner.name}`);
        } else {
          skippedCount++;
        }
      }
    }

    res.json({
      status: 'success',
      data: {
        syncedCount,
        skippedCount,
        totalReferrals: activeReferrals.length
      },
      message: `Synced ${syncedCount} farmer-partner relationships`
    });
  } catch (error) {
    console.error('Error syncing farmer partners:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync farmer-partner relationships'
    });
  }
};

module.exports = referralController

