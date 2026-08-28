const router = require('express').Router()
const { authenticate, authorize } = require('../../middlewares/auth.middleware')
const User = require('../../models/user.model')
const AdminSettings = require('../../models/admin-settings.model')
const Harvest = require('../../models/harvest.model')
const Transaction = require('../../models/transaction.model')
const Order = require('../../models/order.model')
const Listing = require('../../models/listing.model')
const Partner = require('../../models/partner.model')
const Referral = require('../../models/referral.model')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const path = require('path')
const bcrypt = require('bcryptjs')
const { escapeRegex } = require('../../utils/regex.util')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Apply admin authentication to all routes
router.use(authenticate, authorize('admin'))

// Admin Dashboard Analytics
router.get('/dashboard', async (req, res) => {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      activeUsers,
      totalHarvests,
      pendingHarvests,
      totalListings,
      totalOrders,
      monthlyRevenue,
      roleBreakdown,
      commissionStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Harvest.countDocuments(),
      Harvest.countDocuments({ status: 'pending' }),
      Listing.countDocuments(),
      Order.countDocuments(),
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
      ]),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      // Commission statistics from Commission model
      require('../../models/commission.model').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ])

    const userDistribution = {
      farmers: roleBreakdown.find(r => r._id === 'farmer')?.count || 0,
      buyers: roleBreakdown.find(r => r._id === 'buyer')?.count || 0,
      partners: roleBreakdown.find(r => r._id === 'partner')?.count || 0,
      admins: roleBreakdown.find(r => r._id === 'admin')?.count || 0
    }

    // Calculate commission statistics
    const totalCommissions = commissionStats.reduce((sum, stat) => sum + stat.count, 0)
    const totalCommissionAmount = commissionStats.reduce((sum, stat) => sum + stat.totalAmount, 0)
    const pendingCommissions = commissionStats.find(stat => stat._id === 'pending')?.count || 0
    const paidCommissions = commissionStats.find(stat => stat._id === 'paid')?.count || 0
    const pendingCommissionAmount = commissionStats.find(stat => stat._id === 'pending')?.totalAmount || 0
    const paidCommissionAmount = commissionStats.find(stat => stat._id === 'paid')?.totalAmount || 0

    res.json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        totalHarvests,
        pendingApprovals: pendingHarvests,
        totalListings,
        totalOrders,
        totalRevenue: monthlyRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        activeTransactions: totalOrders,
        userDistribution,
        approvalRate: totalHarvests > 0 ? Math.round(((totalHarvests - pendingHarvests) / totalHarvests) * 100) : 0,
        // Commission statistics
        commissionStats: {
          totalCommissions,
          pendingCommissions,
          paidCommissions,
          totalCommissionAmount,
          pendingCommissionAmount,
          paidCommissionAmount,
          commissionRate: totalOrders > 0 ? ((totalCommissionAmount / (monthlyRevenue[0]?.total || 0)) * 100).toFixed(2) : 0
        }
      }
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to load admin dashboard data'
    })
  }
})

// Debug route to check all users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role phone location').limit(10)
    res.json({
      status: 'success',
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        location: u.location
      }))
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

// Admin Profile
router.get('/profile', async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      })
    }

    // Try both _id and id fields
    const userId = req.user._id || req.user.id

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin profile not found'
      })
    }

    const adminMeta = user.adminProfile || {}

    // Add admin-specific profile data
    const adminProfile = {
      ...user.toObject(),
      // Ensure avatar is properly set from profile subdocument
      avatar: user.profile?.avatar || user.avatar,
      employeeId: adminMeta.employeeId || `ADM-${user._id.toString().slice(-6)}`,
      department: adminMeta.department || '',
      position: adminMeta.position || '',
      accessLevel: 'admin',
      permissions: [
        'user_management',
        'system_configuration',
        'data_management',
        'security_settings'
      ],
      officeLocation: {
        address: adminMeta.officeAddress || '',
        city: adminMeta.officeCity || '',
        state: adminMeta.officeState || ''
      },
      contactInfo: {
        workPhone: adminMeta.workPhone || '',
        extension: adminMeta.extension || '',
        emergencyContact: adminMeta.emergencyContact || '',
        emergencyPhone: adminMeta.emergencyPhone || ''
      },
      performanceMetrics: {
        totalUsersManaged: await User.countDocuments()
      },
      isActive: user.status !== 'inactive' && user.status !== 'suspended',
      lastActivity: user.lastLogin || new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    res.json({
      status: 'success',
      data: adminProfile
    })
  } catch (error) {
    console.error('Admin profile error:', error)

    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Profile validation error'
      })
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to load admin profile'
    })
  }
})

// Update Admin Profile
router.put('/profile', async (req, res) => {
  try {
    const body = req.body || {}
    const updateData = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.location !== undefined) updateData.location = body.location
    if (body.profile && typeof body.profile === 'object') {
      if (body.profile.avatar !== undefined) updateData['profile.avatar'] = body.profile.avatar
      if (body.profile.bio !== undefined) updateData['profile.bio'] = body.profile.bio
    }
    if (body.adminProfile && typeof body.adminProfile === 'object') {
      const allowedAdminFields = [
        'employeeId', 'department', 'position',
        'officeAddress', 'officeCity', 'officeState',
        'workPhone', 'extension', 'emergencyContact', 'emergencyPhone'
      ]
      for (const field of allowedAdminFields) {
        if (body.adminProfile[field] !== undefined) updateData[`adminProfile.${field}`] = body.adminProfile[field]
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin profile not found'
      })
    }

    res.json({
      status: 'success',
      message: 'Admin profile updated successfully',
      data: user
    })
  } catch (error) {
    console.error('Update admin profile error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update admin profile'
    })
  }
})

// Admin Profile Activity Log
router.get('/profile/activity', async (req, res) => {
  try {
    const userId = req.user.id

    // Get real user activity from the database
    const user = await User.findById(userId).select('lastLogin createdAt updatedAt')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    // Create activity logs based on actual user data
    const logs = []

    // Add login activity if available
    if (user.lastLogin) {
      logs.push({
        id: 'login_' + userId,
        action: 'Login',
        description: 'Successfully logged into admin dashboard',
        timestamp: user.lastLogin.toISOString(),
        ipAddress: 'System',
        userAgent: 'Web Browser',
        status: 'success'
      })
    }

    // Add account creation activity
    logs.push({
      id: 'created_' + userId,
      action: 'Account Created',
      description: 'Admin account was created',
      timestamp: user.createdAt.toISOString(),
      ipAddress: 'System',
      userAgent: 'Web Browser',
      status: 'success'
    })

    // Add profile update activity if recently updated
    if (user.updatedAt && user.updatedAt > user.createdAt) {
      logs.push({
        id: 'updated_' + userId,
        action: 'Profile Updated',
        description: 'Profile information was updated',
        timestamp: user.updatedAt.toISOString(),
        ipAddress: 'System',
        userAgent: 'Web Browser',
        status: 'success'
      })
    }

    // Sort by timestamp (most recent first)
    const allLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10) // Limit to 10 most recent activities

    res.json({
      status: 'success',
      data: { logs: allLogs }
    })
  } catch (error) {
    console.error('Get admin activity error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get admin activity'
    })
  }
})

// Admin Profile Security Settings
router.get('/profile/security', async (req, res) => {
  try {
    const userId = req.user.id

    // Get real user security data from the database
    const user = await User.findById(userId).select('lastLogin createdAt updatedAt')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    // Only real, verifiable security data — no fake 2FA/device tracking
    // (this platform has no TOTP or session/device tracking infrastructure yet)
    const securitySettings = {
      lastPasswordChange: user.updatedAt || user.createdAt,
      lastLogin: user.lastLogin || user.createdAt
    }

    res.json({
      status: 'success',
      data: securitySettings
    })
  } catch (error) {
    console.error('Get admin security error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get admin security settings'
    })
  }
})

// Admin Settings Management
// Get system settings
router.get('/settings', async (req, res) => {
  try {
    // Get admin settings from database
    const adminSettings = await AdminSettings.getSettings()

    // Return the settings data
    const settingsData = {
      notifications: adminSettings.notifications,
      system: adminSettings.system,
      preferences: adminSettings.preferences,
      security: adminSettings.security,
      data: adminSettings.data
    }

    res.json({
      status: 'success',
      data: settingsData
    })
  } catch (error) {
    console.error('Get system settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system settings'
    })
  }
})

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const { notifications, system, preferences, security, data } = req.body

    // Prepare the updates object
    const updates = {}
    if (notifications) updates.notifications = notifications
    if (system) updates.system = system
    if (preferences) updates.preferences = preferences
    if (security) updates.security = security
    if (data) updates.data = data

    // Save to database
    const updatedSettings = await AdminSettings.updateSettings(updates, req.user.id)

    // Return the updated settings
    const settingsData = {
      notifications: updatedSettings.notifications,
      system: updatedSettings.system,
      preferences: updatedSettings.preferences,
      security: updatedSettings.security,
      data: updatedSettings.data
    }

    res.json({
      status: 'success',
      message: 'System settings updated successfully',
      data: settingsData
    })
  } catch (error) {
    console.error('Update system settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update system settings'
    })
  }
})

// Get notification settings
router.get('/settings/notifications', async (req, res) => {
  try {
    const adminSettings = await AdminSettings.getSettings()

    res.json({
      status: 'success',
      data: adminSettings.notifications
    })
  } catch (error) {
    console.error('Get notification settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notification settings'
    })
  }
})

// Update notification settings
router.put('/settings/notifications', async (req, res) => {
  try {
    const notificationSettings = req.body

    // Save to database
    const updatedSettings = await AdminSettings.updateSettings(
      { notifications: notificationSettings },
      req.user.id
    )

    res.json({
      status: 'success',
      message: 'Notification settings updated successfully',
      data: updatedSettings.notifications
    })
  } catch (error) {
    console.error('Update notification settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification settings'
    })
  }
})

// Get security settings
router.get('/settings/security', async (req, res) => {
  try {
    const adminSettings = await AdminSettings.getSettings()

    // Include additional security policy information
    const securityData = {
      ...adminSettings.security,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      }
    }

    res.json({
      status: 'success',
      data: securityData
    })
  } catch (error) {
    console.error('Get security settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get security settings'
    })
  }
})

// Update security settings
router.put('/settings/security', async (req, res) => {
  try {
    const securitySettings = req.body

    // Save to database
    const updatedSettings = await AdminSettings.updateSettings(
      { security: securitySettings },
      req.user.id
    )

    // Include additional security policy information
    const securityData = {
      ...updatedSettings.security,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      }
    }

    res.json({
      status: 'success',
      message: 'Security settings updated successfully',
      data: securityData
    })
  } catch (error) {
    console.error('Update security settings error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update security settings'
    })
  }
})

// Change Admin Password
router.post('/profile/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    
    // Update password
    await User.findByIdAndUpdate(req.user.id, { password: hashedNewPassword })

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    })
  }
})

// Create a separate multer instance without body parsers interference
const uploadAvatar = multer({
  storage: multer.memoryStorage(), // Use memory storage to avoid file system issues
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Upload Admin Avatar with error handling
router.post('/profile/avatar', authenticate, authorize('admin'), (req, res, next) => {
  console.log('Avatar upload middleware called')

  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err)
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File size too large. Maximum 5MB allowed.'
          })
        }
      } else if (err.message === 'Only image files are allowed') {
        return res.status(400).json({
          status: 'error',
          message: 'Only image files are allowed'
        })
      }
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload failed'
      })
    }
    next()
  })
}, async (req, res) => {
  try {
    console.log('Avatar upload handler called')
    console.log('Final request body:', req.body)
    console.log('Final file info:', req.file)

    if (!req.file) {
      console.error('No file uploaded - req.file is undefined')
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded or invalid file format'
      })
    }

    console.log('File uploaded successfully:', req.file.originalname)

    // Upload to Cloudinary using buffer
    console.log('Uploading to Cloudinary...')
    const bufferStream = require('stream').Readable.from(req.file.buffer)

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: 'admin-avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ]
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else {
          console.log('Cloudinary upload successful:', result.secure_url)
          resolve(result)
        }
      })

      bufferStream.pipe(stream)
    })

    // Update user avatar
    console.log('Updating user avatar in database...')
    console.log('User ID:', req.user.id)
    console.log('New avatar URL:', result.secure_url)

    // Update the avatar in the profile subdocument
    const updatedUser = await User.findByIdAndUpdate(req.user.id, { 'profile.avatar': result.secure_url }, { new: true })
    console.log('User updated successfully:', !!updatedUser)
    console.log('Updated user profile.avatar:', updatedUser?.profile?.avatar)

    console.log('Avatar upload completed successfully')
    res.json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      data: { avatar: result.secure_url }
    })
  } catch (error) {
    console.error('Upload avatar error:', error)

    // No cleanup needed for memory storage

    // Provide more specific error messages
    let errorMessage = 'Failed to upload avatar'
    if (error.message) {
      errorMessage = error.message
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File size too large. Maximum 5MB allowed.'
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Invalid file field name'
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage
    })
  }
})

// System Health
router.get('/system/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    res.json({
      status: 'success',
      data: healthData
    })
  } catch (error) {
    console.error('System health error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health'
    })
  }
})

// System Metrics
router.get('/system/metrics', async (req, res) => {
  try {
    const metrics = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ status: 'active' }),
      totalHarvests: await Harvest.countDocuments(),
      totalOrders: await Order.countDocuments(),
      totalListings: await Listing.countDocuments(),
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    }

    res.json({
      status: 'success',
      data: metrics
    })
  } catch (error) {
    console.error('System metrics error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system metrics'
    })
  }
})

// Get Recent Users
router.get('/users/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)

    res.json({
      status: 'success',
      data: { users }
    })
  } catch (error) {
    console.error('Recent users error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get recent users'
    })
  }
})

// Get All Users (Admin)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const role = req.query.role || ''
    const status = req.query.status || ''

    // Build filter object
    const filter = {}
    if (search) {
      const safeSearch = escapeRegex(search)
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } }
      ]
    }
    if (role) filter.role = role
    if (status) filter.status = status

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ])

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users'
    })
  }
})

// Get User by ID (Admin)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    
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
    console.error('Get user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user'
    })
  }
})

// Update User (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const updateData = req.body
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    })
  }
})

// Delete/Deactivate User (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended', isActive: false },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'User deactivated successfully',
      data: user
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate user'
    })
  }
})

// Activate User (Admin)
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isActive: true },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'User activated successfully',
      data: user
    })
  } catch (error) {
    console.error('Activate user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate user'
    })
  }
})

// Suspend User (Admin)
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended', isActive: false },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'User suspended successfully',
      data: user
    })
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend user'
    })
  }
})

// Verify User (Admin)
router.post('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        emailVerified: true, 
        verificationStatus: 'verified',
        status: 'active',
        isActive: true
      },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'User verified successfully',
      data: user
    })
  } catch (error) {
    console.error('Verify user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify user'
    })
  }
})

// Reset User Password (Admin)
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    
    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password is required'
      })
    }

    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    res.json({
      status: 'success',
      message: 'Password reset successfully',
      data: user
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    })
  }
})

// Admin Analytics - Overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    const match = { createdAt: { $gte: startDate, $lte: now } }
    
    const [monthlyGrowth, userGrowth, harvestTrends, revenueTrends] = await Promise.all([
      // Monthly platform growth
      User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            users: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),
      
      // User growth by role
      User.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              role: '$role',
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1 } }
      ]),
      
      // Harvest trends
      Harvest.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            harvests: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Revenue trends
      Order.aggregate([
        { $match: { ...match, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ])
    
    res.json({
      status: 'success',
      data: {
        monthlyGrowth,
        userGrowth,
        harvestTrends,
        revenueTrends,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics overview'
    })
  }
})

// Admin Analytics - User Analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    const match = { createdAt: { $gte: startDate, $lte: now } }
    
    const [userDistribution, userGrowth, userActivity, topUsers] = await Promise.all([
      // Current user distribution
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // User growth over time
      User.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              role: '$role'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1 } }
      ]),
      
      // User activity metrics
      User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top active users (farmers with most harvests)
      User.aggregate([
        { $match: { role: 'farmer' } },
        {
          $lookup: {
            from: 'harvests',
            localField: '_id',
            foreignField: 'farmer',
            as: 'harvests'
          }
        },
        {
          $addFields: {
            harvestCount: { $size: '$harvests' }
          }
        },
        { $sort: { harvestCount: -1 } },
        { $limit: 10 },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            harvestCount: 1,
            createdAt: 1
          }
        }
      ])
    ])
    
    res.json({
      status: 'success',
      data: {
        userDistribution,
        userGrowth,
        userActivity,
        topUsers,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user analytics'
    })
  }
})

// Admin Analytics - Regional Data
router.get('/analytics/regional', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    const match = { createdAt: { $gte: startDate, $lte: now } }
    
    const [regionalUsers, regionalHarvests, regionalRevenue] = await Promise.all([
      // Users by state/region
      User.aggregate([
        { $match: { state: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$state',
            users: { $sum: 1 }
          }
        },
        { $sort: { users: -1 } },
        { $limit: 10 }
      ]),
      
      // Harvests by region
      Harvest.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'farmer',
            foreignField: '_id',
            as: 'farmerInfo'
          }
        },
        { $unwind: '$farmerInfo' },
        { $match: { 'farmerInfo.state': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$farmerInfo.state',
            harvests: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        },
        { $sort: { harvests: -1 } },
        { $limit: 10 }
      ]),
      
      // Revenue by region
      Order.aggregate([
        { $match: { ...match, status: 'completed' } },
        {
          $lookup: {
            from: 'users',
            localField: 'buyer',
            foreignField: '_id',
            as: 'buyerInfo'
          }
        },
        { $unwind: '$buyerInfo' },
        { $match: { 'buyerInfo.state': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$buyerInfo.state',
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ])
    ])
    
    // Combine regional data
    const regionalData = regionalUsers.map(region => {
      const harvests = regionalHarvests.find(h => h._id === region._id) || { harvests: 0, totalQuantity: 0 }
      const revenue = regionalRevenue.find(r => r._id === region._id) || { revenue: 0, orders: 0 }
      
      return {
        region: region._id,
        users: region.users,
        harvests: harvests.harvests,
        totalQuantity: harvests.totalQuantity,
        revenue: revenue.revenue,
        orders: revenue.orders
      }
    })
    
    res.json({
      status: 'success',
      data: {
        regionalData,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching regional analytics:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch regional analytics'
    })
  }
})

// Admin Analytics - Quality Metrics
router.get('/analytics/quality', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    const match = { createdAt: { $gte: startDate, $lte: now } }
    
    const [qualityDistribution, statusMetrics, creditScoreStats, approvalMetrics] = await Promise.all([
      // Quality distribution of harvests
      Harvest.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$quality',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Status metrics
      Harvest.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Credit score statistics
      User.aggregate([
        { $match: { role: 'farmer', creditScore: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$creditScore' },
            minScore: { $min: '$creditScore' },
            maxScore: { $max: '$creditScore' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Approval metrics
      Harvest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
              }
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
              }
            }
          }
        }
      ])
    ])
    
    res.json({
      status: 'success',
      data: {
        qualityDistribution,
        statusMetrics,
        creditScoreStats: creditScoreStats[0] || { avgScore: 0, minScore: 0, maxScore: 0, count: 0 },
        approvalMetrics: approvalMetrics[0] || { total: 0, approved: 0, pending: 0, rejected: 0 },
        period
      }
    })
  } catch (error) {
    console.error('Error fetching quality analytics:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch quality analytics'
    })
  }
})

// Admin Analytics - Export Data
router.get('/analytics/export', async (req, res) => {
  try {
    const { type, format = 'json', period = '30d' } = req.query
    
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    const match = { createdAt: { $gte: startDate, $lte: now } }
    
    let exportData = {}
    
    switch (type) {
      case 'users':
        exportData = await User.aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                role: '$role'
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.month': 1 } }
        ])
        break
        
      case 'harvests':
        exportData = await Harvest.aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                cropType: '$cropType',
                status: '$status'
              },
              count: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' }
            }
          },
          { $sort: { '_id.month': 1 } }
        ])
        break
        
      case 'revenue':
        exportData = await Order.aggregate([
          { $match: { ...match, status: 'completed' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: '$total' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
        break
        
      default: {
        // Export all data
        const [users, harvests, orders] = await Promise.all([
          User.aggregate([
            { $match: match },
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ]),
          Harvest.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]),
          Order.aggregate([
            { $match: { ...match, status: 'completed' } },
            { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }
          ])
        ])

        exportData = { users, harvests, orders }
      }
    }
    
    const response = {
      status: 'success',
      data: {
        type: type || 'all',
        period,
        exportedAt: new Date().toISOString(),
        format,
        data: exportData
      }
    }
    
    if (format === 'csv') {
      // Convert to CSV format (basic implementation)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type || 'all'}-${period}.csv"`)
      
      // Simple CSV conversion - you may want to use a library like 'csv-writer'
      const csvData = JSON.stringify(exportData)
      res.send(csvData)
    } else {
      res.json(response)
    }
  } catch (error) {
    console.error('Error exporting analytics:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to export analytics data'
    })
  }
})

// Admin System Management - System Status
router.get('/system/status', async (req, res) => {
  try {
    // Measure real DB round-trip time rather than fabricating one
    const dbCheckStart = Date.now()
    const dbStatus = await User.findOne()
      .then(() => ({ status: 'healthy', responseTime: Date.now() - dbCheckStart }))
      .catch(() => ({ status: 'unhealthy', responseTime: null }))

    const apiStatus = { status: 'healthy', responseTime: 0 }

    res.json({
      status: 'success',
      data: {
        overall: dbStatus.status === 'healthy' ? 'healthy' : 'degraded',
        database: dbStatus,
        api: apiStatus,
        // Per-service health checks (auth, file upload, notifications, payment
        // gateway, SMS) are not implemented yet — omitted rather than reporting
        // a fabricated "healthy" for services that were never actually probed.
        services: [],
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('System status error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status'
    })
  }
})

// Admin System Management - System Logs
// This app has no persistent structured-log store (console/morgan output
// only goes to the process's stdout, which isn't queryable here) — but the
// Notification collection already records real, timestamped system events
// (harvest created, order placed, payment received, etc.) for every
// meaningful thing that happens, so it's used as the real backing data
// instead of the fabricated entries this endpoint used to return.
router.get('/system/logs', async (req, res) => {
  try {
    const { level = 'all', limit = 100, page = 1, search } = req.query
    const Notification = require('../../models/notification.model')

    // Notification.type -> log level: 'success' reads as 'info' (both are
    // non-problem informational events); there's no real 'debug' concept
    // here, so that filter honestly returns nothing rather than fake data.
    const levelToTypes = {
      info: ['info', 'success'],
      warn: ['warning'],
      error: ['error'],
      debug: []
    }

    const query = {}
    if (level !== 'all') {
      query.type = { $in: levelToTypes[level] || [] }
    }
    if (search) {
      const regex = new RegExp(escapeRegex(String(search)), 'i')
      query.$or = [{ title: regex }, { message: regex }]
    }

    const limitNum = parseInt(limit) || 100
    const pageNum = parseInt(page) || 1

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select('title message type category user createdAt metadata')
        .lean()
    ])

    const levelFromType = { info: 'info', success: 'info', warning: 'warn', error: 'error' }
    const logs = notifications.map((n) => ({
      id: n._id.toString(),
      timestamp: n.createdAt,
      level: levelFromType[n.type] || 'info',
      message: n.title ? `${n.title}: ${n.message}` : n.message,
      module: n.category || 'system',
      userId: n.user ? n.user.toString() : undefined,
      metadata: n.metadata || {}
    }))

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('System logs error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system logs'
    })
  }
})

// Admin System Management - System Configuration
router.get('/system/config', async (req, res) => {
  try {
    const config = {
      application: {
        name: 'GroChain',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        domain: process.env.DOMAIN || 'localhost'
      },
      database: {
        type: 'MongoDB',
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'grochain',
        connectionPoolSize: 10,
        maxIdleTime: 30000
      },
      security: {
        jwtExpiration: process.env.JWT_EXPIRES_IN || '7d',
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        rateLimiting: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100
        }
      },
      features: {
        userRegistration: true,
        emailVerification: true,
        smsNotifications: true,
        fileUploads: true,
        paymentGateway: true,
        analyticsTracking: true
      },
      limits: {
        maxFileSize: '10MB',
        maxUsersPerPartner: 1000,
        maxHarvestsPerUser: 50,
        maxOrdersPerDay: 100
      }
    }

    res.json({
      status: 'success',
      data: config
    })
  } catch (error) {
    console.error('System config error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system configuration'
    })
  }
})

// Admin System Management - Update Configuration
// The values GET /system/config returns are deployment-level (environment
// variables, JWT expiry, rate-limit constants) — not database-backed
// settings a running server can safely apply from a web form. This used to
// echo back whatever was submitted and claim success without changing
// anything real; the frontend's config dialog is now honestly read-only and
// no longer calls this at all. Left as an explicit, honest 501 rather than
// silently lying about a save, in case anything still hits it directly.
router.put('/system/config', async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'System configuration is deployment-level (environment variables) and cannot be changed from this dashboard.'
  })
})

// Admin System Management - Maintenance Mode
router.post('/system/maintenance', async (req, res) => {
  try {
    const { enabled, message = 'System maintenance in progress' } = req.body
    
    // In a real system, you would toggle maintenance mode
    // This could involve setting a flag in database or configuration
    
    res.json({
      status: 'success',
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        maintenanceMode: enabled,
        message: enabled ? message : null,
        toggledAt: new Date().toISOString(),
        toggledBy: req.user.id
      }
    })
  } catch (error) {
    console.error('Maintenance mode error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle maintenance mode'
    })
  }
})

// Admin System Management - Create Backup
router.post('/system/backup', async (req, res) => {
  try {
    const backupService = require('../../services/backup.service')
    const { type = 'full', description, collections } = req.body
    const backup = await backupService.createBackup({
      type,
      description,
      collections,
      createdBy: req.user?.id || req.user?.email || 'admin',
    })

    res.json({
      status: 'success',
      message: 'Backup created successfully',
      data: backup,
    })
  } catch (error) {
    console.error('Create backup error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create backup',
    })
  }
})

// Admin System Management - List Backups
router.get('/system/backups', async (req, res) => {
  try {
    const backupService = require('../../services/backup.service')
    const backups = backupService.listBackups()
    res.json({
      status: 'success',
      data: {
        backups,
        total: backups.length,
      },
    })
  } catch (error) {
    console.error('List backups error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to list backups',
    })
  }
})

// Download a stored backup archive
router.get('/system/backups/:backupId/download', async (req, res) => {
  try {
    const backupService = require('../../services/backup.service')
    const filePath = backupService.getBackupFilePath(req.params.backupId)
    if (!filePath) {
      return res.status(404).json({
        status: 'error',
        message: 'Backup not found',
      })
    }

    const filename = `grochain-backup-${req.params.backupId}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.sendFile(path.resolve(filePath))
  } catch (error) {
    console.error('Backup download error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to download backup',
    })
  }
})

// Admin System Management - Restore Backup
router.post('/system/restore', async (req, res) => {
  try {
    const backupService = require('../../services/backup.service')
    const { backupId, collections = [] } = req.body

    if (!backupId) {
      return res.status(400).json({
        status: 'error',
        message: 'Backup ID is required',
      })
    }

    const result = await backupService.restoreBackup(backupId, collections)
    res.json({
      status: 'success',
      message: 'Backup restored successfully',
      data: {
        ...result,
        startedBy: req.user?.id,
      },
    })
  } catch (error) {
    console.error('Restore backup error:', error)
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Failed to restore backup',
    })
  }
})

// Admin Reports Management - Get Report Templates
router.get('/reports/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'harvest-summary',
        name: 'Harvest Summary Report',
        description: 'Comprehensive overview of harvest yields, quality, and performance metrics',
        category: 'harvest',
        format: 'pdf',
        estimatedTime: '2-3 minutes',
        parameters: {
          dateRange: true,
          filters: ['cropType', 'quality', 'status'],
          customFields: ['farmer', 'location', 'quantity']
        }
      },
      {
        id: 'financial-performance',
        name: 'Financial Performance Report',
        description: 'Detailed financial analysis including revenue, expenses, and profit margins',
        category: 'financial',
        format: 'excel',
        estimatedTime: '3-5 minutes',
        parameters: {
          dateRange: true,
          filters: ['paymentStatus', 'transactionType'],
          customFields: ['amount', 'commission', 'fees']
        }
      },
      {
        id: 'marketplace-analytics',
        name: 'Marketplace Analytics Report',
        description: 'Sales performance, customer insights, and market trends analysis',
        category: 'marketplace',
        format: 'pdf',
        estimatedTime: '2-4 minutes',
        parameters: {
          dateRange: true,
          filters: ['status', 'category'],
          customFields: ['price', 'quantity', 'buyer']
        }
      },
      {
        id: 'user-analytics',
        name: 'User Analytics Report',
        description: 'User registration trends, activity patterns, and engagement metrics',
        category: 'user',
        format: 'csv',
        estimatedTime: '1-2 minutes',
        parameters: {
          dateRange: true,
          filters: ['role', 'status', 'verification'],
          customFields: ['registrationDate', 'lastLogin', 'activity']
        }
      },
      {
        id: 'system-performance',
        name: 'System Performance Report',
        description: 'System health, performance metrics, and operational statistics',
        category: 'system',
        format: 'json',
        estimatedTime: '1-2 minutes',
        parameters: {
          dateRange: true,
          filters: ['logLevel', 'module'],
          customFields: ['responseTime', 'errorRate', 'uptime']
        }
      },
      {
        id: 'comprehensive-dashboard',
        name: 'Comprehensive Dashboard Report',
        description: 'Complete platform overview with all key metrics and insights',
        category: 'comprehensive',
        format: 'pdf',
        estimatedTime: '5-7 minutes',
        parameters: {
          dateRange: true,
          filters: ['all'],
          customFields: ['all']
        }
      }
    ]

    res.json({
      status: 'success',
      data: { templates }
    })
  } catch (error) {
    console.error('Get report templates error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get report templates'
    })
  }
})

// In-memory registry for generated admin reports (file-backed)
const generatedAdminReports = new Map()

// Admin Reports Management - Generate Report
router.post('/reports/generate', async (req, res) => {
  try {
    const { templateId, parameters = {} } = req.body
    const ExportImportService = require('../../services/exportImport.service')
    const User = require('../../models/user.model')
    const Harvest = require('../../models/harvest.model')
    const Listing = require('../../models/listing.model')
    const Order = require('../../models/order.model')

    if (!templateId) {
      return res.status(400).json({
        status: 'error',
        message: 'Template ID is required'
      })
    }

    const reportId = `report_${Date.now()}`
    let rows = []
    let format = 'excel'
    let title = templateId

    switch (templateId) {
      case 'harvest-summary': {
        const harvests = await Harvest.find({}).populate('farmer', 'name email').limit(5000).lean()
        rows = harvests.map((h) => ({
          batchId: h.batchId,
          cropType: h.cropType,
          quantity: h.quantity,
          unit: h.unit,
          quality: h.quality,
          status: h.status,
          farmer: h.farmer?.name || '',
          date: h.date,
        }))
        title = 'Harvest Summary'
        format = 'excel'
        break
      }
      case 'financial-performance': {
        const orders = await Order.find({}).limit(5000).lean()
        rows = orders.map((o) => ({
          orderNumber: o.orderNumber,
          total: o.total,
          subtotal: o.subtotal,
          tax: o.tax,
          shipping: o.shipping,
          paymentStatus: o.paymentStatus,
          status: o.status,
          createdAt: o.createdAt,
        }))
        title = 'Financial Performance'
        format = 'excel'
        break
      }
      case 'marketplace-analytics': {
        const listings = await Listing.find({}).populate('farmer', 'name').limit(5000).lean()
        rows = listings.map((l) => ({
          cropName: l.cropName,
          price: l.price,
          quantity: l.quantity,
          status: l.status,
          farmer: l.farmer?.name || '',
          createdAt: l.createdAt,
        }))
        title = 'Marketplace Analytics'
        format = 'excel'
        break
      }
      case 'user-analytics': {
        const users = await User.find({}).select('-password -pin').limit(5000).lean()
        rows = users.map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        }))
        title = 'User Analytics'
        format = 'csv'
        break
      }
      default: {
        const users = await User.countDocuments()
        const harvests = await Harvest.countDocuments()
        const listings = await Listing.countDocuments()
        const orders = await Order.countDocuments()
        rows = [
          { metric: 'Users', value: users },
          { metric: 'Harvests', value: harvests },
          { metric: 'Listings', value: listings },
          { metric: 'Orders', value: orders },
          { metric: 'Generated At', value: new Date().toISOString() },
          { metric: 'Template', value: templateId },
        ]
        title = 'Comprehensive Dashboard'
        format = 'excel'
      }
    }

    const result = await ExportImportService.exportData(rows, {
      format,
      filename: `grochain-${templateId}-${reportId}.${format === 'excel' ? 'xlsx' : 'csv'}`,
    })

    const report = {
      id: reportId,
      templateId,
      title,
      status: 'completed',
      format: format === 'excel' ? 'xlsx' : format,
      fileName: result.filename,
      filePath: result.filePath,
      recordCount: rows.length,
      createdAt: new Date().toISOString(),
      parameters,
      downloadUrl: `/api/admin/reports/${reportId}/download`,
    }
    generatedAdminReports.set(reportId, report)

    res.json({
      status: 'success',
      message: 'Report generated successfully',
      data: report
    })
  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate report'
    })
  }
})

// Admin Reports Management - Get Generated Reports
router.get('/reports/generated', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, format } = req.query
    let reports = Array.from(generatedAdminReports.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    if (status) reports = reports.filter((r) => r.status === status)
    if (format) reports = reports.filter((r) => r.format === format)

    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const paginatedReports = reports.slice(startIndex, startIndex + parseInt(limit))

    res.json({
      status: 'success',
      data: {
        reports: paginatedReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reports.length,
          pages: Math.ceil(reports.length / parseInt(limit)) || 1
        }
      }
    })
  } catch (error) {
    console.error('Get generated reports error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get generated reports'
    })
  }
})

// Admin Reports Management - Download Report
router.get('/reports/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const report = generatedAdminReports.get(id)
    if (!report || !report.filePath) {
      return res.status(404).json({ status: 'error', message: 'Report not found' })
    }

    const fs = require('fs')
    const path = require('path')
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ status: 'error', message: 'Report file missing on disk' })
    }

    const contentType = report.fileName.endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : report.fileName.endsWith('.json')
        ? 'application/json'
        : 'text/csv; charset=utf-8'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(report.fileName)}"`)
    return fs.createReadStream(report.filePath).pipe(res)
  } catch (error) {
    console.error('Download report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to download report'
    })
  }
})

// Admin Reports Management - Delete Report
router.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params
    const report = generatedAdminReports.get(id)
    if (report?.filePath) {
      try {
        const fs = require('fs')
        if (fs.existsSync(report.filePath)) fs.unlinkSync(report.filePath)
      } catch (_) { /* ignore */ }
    }
    generatedAdminReports.delete(id)
    res.json({
      status: 'success',
      message: 'Report deleted successfully',
      data: { id }
    })
  } catch (error) {
    console.error('Delete report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report'
    })
  }
})

// Admin Reports Management - Scheduled Reports
// No frontend page calls any of these four endpoints yet, and there is no
// real scheduler/model behind them — they used to return fabricated data
// (or silently "succeed" without persisting anything). Reporting that
// honestly rather than building a full cron+email scheduling engine for a
// feature with no live UI consumer yet.
router.post('/reports/schedule', async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Scheduled reports are not yet implemented'
  })
})

router.get('/reports/scheduled', async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Scheduled reports are not yet implemented',
    data: { scheduledReports: [] }
  })
})

router.put('/reports/scheduled/:id', async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Scheduled reports are not yet implemented'
  })
})

router.delete('/reports/scheduled/:id', async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Scheduled reports are not yet implemented'
  })
})

// Cleanup orphaned farmers endpoint
router.post('/cleanup-orphaned-farmers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    console.log('🔍 Starting cleanup of orphaned farmers...')
    
    // Find all farmers that have a partner field but no active referral
    const farmersWithPartners = await User.find({
      role: 'farmer',
      partner: { $exists: true, $ne: null }
    })
    
    console.log(`🔍 Found ${farmersWithPartners.length} farmers with partner references`)
    
    let cleanedCount = 0
    const cleanedFarmers = []
    
    for (const farmer of farmersWithPartners) {
      // Check if there's an active referral for this farmer-partner pair
      const activeReferral = await Referral.findOne({
        farmer: farmer._id,
        partner: farmer.partner,
        status: { $in: ['pending', 'active', 'completed'] }
      })
      
      if (!activeReferral) {
        // No active referral found, clean up the farmer's partner field
        await User.findByIdAndUpdate(farmer._id, {
          $unset: { partner: 1 }
        })
        
        // Remove farmer from partner's farmers array
        await Partner.findByIdAndUpdate(farmer.partner, {
          $pull: { farmers: farmer._id }
        })
        
        // Update partner's totalFarmers count
        const partner = await Partner.findById(farmer.partner)
        if (partner) {
          partner.totalFarmers = partner.farmers.length
          await partner.save()
        }
        
        cleanedCount++
        cleanedFarmers.push({
          name: farmer.name,
          email: farmer.email,
          partnerId: farmer.partner
        })
        console.log(`✅ Cleaned up farmer: ${farmer.name} (${farmer.email})`)
      } else {
        console.log(`⏭️ Skipping farmer: ${farmer.name} - has active referral`)
      }
    }
    
    console.log(`🎉 Cleanup complete! Cleaned ${cleanedCount} orphaned farmers`)
    
    // Verify the cleanup
    const remainingFarmersWithPartners = await User.countDocuments({
      role: 'farmer',
      partner: { $exists: true, $ne: null }
    })
    
    res.json({
      status: 'success',
      message: `Cleanup complete! Cleaned ${cleanedCount} orphaned farmers`,
      data: {
        cleanedCount,
        cleanedFarmers,
        remainingFarmersWithPartners
      }
    })
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup orphaned farmers',
      error: error.message
    })
  }
})

module.exports = router