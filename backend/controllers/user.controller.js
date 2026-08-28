const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const Order = require('../models/order.model')
const Partner = require('../models/partner.model')
const { escapeRegex } = require('../utils/regex.util')

// Partner staff authenticate as a User, but User.partner (on a farmer
// record) refs the Partner *organization* document, never the staff user's
// own User _id. Comparing/assigning against req.user.id directly always
// mismatches — either silently denying a partner their own farmers, or (on
// create) writing a farmer's `partner` field to a value that doesn't
// reference any real Partner document. Resolve the acting partner org once.
async function resolveActingPartnerId(user) {
  if (!user || user.role !== 'partner') return null
  const partner = await Partner.findOne({ email: user.email }).select('_id')
  return partner ? partner._id.toString() : null
}

const userController = {
  // Get user overview (Admin/Manager)
  async getUserOverview(req, res) {
    try {
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = {}
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
        User.countDocuments(query),
        User.countDocuments({ ...query, status: 'active' }),
        User.countDocuments({ ...query, status: 'suspended' })
      ])
      
      const recentUsers = await User.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role status createdAt')
      
      const roleBreakdown = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
      
      res.json({
        status: 'success',
        data: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          recentUsers,
          roleBreakdown
        }
      })
    } catch (error) {
      console.error('Error getting user overview:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user overview'
      })
    }
  },

  // Get all users with filters
  async getAllUsers(req, res) {
    try {
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status, 
        search,
        partnerId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query
      
      const query = {}
      
      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      // Apply filters
      if (role) query.role = role
      if (status) query.status = status
      if (partnerId) query.partner = partnerId
      
      // Search functionality
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i')
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      
      const [users, total] = await Promise.all([
        User.find(query)
          .populate('partner', 'name organization')
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ])
      
      res.json({
        status: 'success',
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting all users:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get users'
      })
    }
  },

  // Get specific user
  async getUserById(req, res) {
    try {
      const { userId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
        .populate('partner', 'name organization')
        .select('-password')
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      res.json({
        status: 'success',
        data: user
      })
    } catch (error) {
      console.error('Error getting user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user'
      })
    }
  },

  // Create user
  async createUser(req, res) {
    try {
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const { name, email, password, role } = req.body
      
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          status: 'error',
          message: 'Name, email, password, and role are required'
        })
      }
      
      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Email already exists'
        })
      }
      
      // Role-based restrictions
      if (req.user.role === 'partner') {
        if (role !== 'farmer') {
          return res.status(403).json({
            status: 'error',
            message: 'Partners can only create farmer accounts'
          })
        }
        // Must be the Partner *organization* _id (User.partner refs Partner,
        // not User) — using req.user.id here would silently mislink every
        // farmer a partner creates, making them invisible to that partner's
        // own farmer/loan/insurance/commission queries.
        const actingPartnerId = await resolveActingPartnerId(req.user)
        if (!actingPartnerId) {
          return res.status(403).json({
            status: 'error',
            message: 'Partner profile not found'
          })
        }
        req.body.partner = actingPartnerId
      }

      const user = await User.create(req.body)
      
      res.status(201).json({
        status: 'success',
        data: user
      })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user'
      })
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { userId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        req.body,
        { new: true, runValidators: true }
      ).select('-password')
      
      res.json({
        status: 'success',
        data: updatedUser
      })
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      })
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const { userId } = req.params
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only admins can delete users'
        })
      }
      
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      // Soft delete - update status to deleted
      await User.findByIdAndUpdate(userId, { 
        status: 'deleted',
        deletedAt: new Date()
      })
      
      res.json({
        status: 'success',
        message: 'User deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user'
      })
    }
  },

  // Bulk create users
  async bulkCreateUsers(req, res) {
    try {
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const { users } = req.body
      
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Users array is required'
        })
      }
      
      const createdUsers = []
      const errors = []

      // Must be the Partner *organization* _id (User.partner refs Partner,
      // not User) — see createUser for why req.user.id would be wrong here.
      const actingPartnerId = req.user.role === 'partner' ? await resolveActingPartnerId(req.user) : null
      if (req.user.role === 'partner' && !actingPartnerId) {
        return res.status(403).json({
          status: 'error',
          message: 'Partner profile not found'
        })
      }

      for (const userData of users) {
        try {
          // Set partner ID for partner users
          if (req.user.role === 'partner') {
            userData.partner = actingPartnerId
            userData.role = 'farmer'
          }

          const user = await User.create(userData)
          createdUsers.push(user)
        } catch (error) {
          errors.push({
            email: userData.email,
            error: error.message
          })
        }
      }
      
      res.status(201).json({
        status: 'success',
        data: {
          created: createdUsers.length,
          failed: errors.length,
          createdUsers,
          errors
        }
      })
    } catch (error) {
      console.error('Error bulk creating users:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to bulk create users'
      })
    }
  },

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const { userId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      // Get user statistics based on role
      let stats = {}
      
      if (user.role === 'farmer') {
        const [harvests, listings, orders] = await Promise.all([
          Harvest.countDocuments({ farmer: userId }),
          Listing.countDocuments({ farmer: userId }),
          Order.countDocuments({ buyer: userId })
        ])
        
        stats = { harvests, listings, orders }
      } else if (user.role === 'buyer') {
        const orders = await Order.countDocuments({ buyer: userId })
        stats = { orders }
      } else if (user.role === 'partner') {
        const farmers = await User.countDocuments({ partner: userId, role: 'farmer' })
        stats = { farmers }
      }
      
      res.json({
        status: 'success',
        data: stats
      })
    } catch (error) {
      console.error('Error getting user stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user statistics'
      })
    }
  },

  // Search users
  async searchUsers(req, res) {
    try {
      const { q, role, status, page = 1, limit = 20 } = req.query
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      if (!q || q.length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Search query must be at least 2 characters'
        })
      }
      
      const searchRegex = new RegExp(escapeRegex(q), 'i')
      const query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }
      
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      if (role) query.role = role
      if (status) query.status = status
      
      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      const [users, total] = await Promise.all([
        User.find(query)
          .populate('partner', 'name organization')
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ])
      
      res.json({
        status: 'success',
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error searching users:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to search users'
      })
    }
  },

  // Verify user
  async verifyUser(req, res) {
    try {
      const { userId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      user.verified = true
      user.verifiedAt = new Date()
      user.verifiedBy = req.user.id
      await user.save()
      
      res.json({
        status: 'success',
        message: 'User verified successfully',
        data: user
      })
    } catch (error) {
      console.error('Error verifying user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify user'
      })
    }
  },

  // Suspend user
  async suspendUser(req, res) {
    try {
      const { userId } = req.params
      const { reason } = req.body
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      user.status = 'suspended'
      user.suspensionReason = reason
      user.suspendedAt = new Date()
      user.suspendedBy = req.user.id
      await user.save()
      
      res.json({
        status: 'success',
        message: 'User suspended successfully',
        data: user
      })
    } catch (error) {
      console.error('Error suspending user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to suspend user'
      })
    }
  },

  // Reactivate user
  async reactivateUser(req, res) {
    try {
      const { userId } = req.params
      
      if (!['admin', 'partner'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      const query = { _id: userId }
      if (req.user.role === 'partner') {
        query.partner = await resolveActingPartnerId(req.user)
      }
      
      const user = await User.findOne(query)
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }
      
      user.status = 'active'
      user.suspensionReason = undefined
      user.suspendedAt = undefined
      user.suspendedBy = undefined
      await user.save()
      
      res.json({
        status: 'success',
        message: 'User reactivated successfully',
        data: user
      })
    } catch (error) {
      console.error('Error reactivating user:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to reactivate user'
      })
    }
  }
}

module.exports = userController

