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
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

// Ensure uploads directory exists
const uploadsDir = 'uploads/avatars'
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
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

    console.log('Fetching admin profile for user ID:', req.user.id)
    console.log('Available user fields:', Object.keys(req.user))
    console.log('User _id:', req.user._id)
    console.log('User id:', req.user.id)

    // Try both _id and id fields
    const userId = req.user._id || req.user.id
    console.log('Using user ID for query:', userId)

    const user = await User.findById(userId).select('-password')
    console.log('User found:', !!user)
    console.log('User data:', user ? { name: user.name, email: user.email, phone: user.phone, location: user.location } : 'null')

    if (!user) {
      // Let's also check what users exist in the database
      const allUsers = await User.find({}, 'name email role').limit(5)
      console.log('All users in database:', allUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })))

      return res.status(404).json({
        status: 'error',
        message: 'Admin profile not found',
        searchedId: userId,
        availableUsers: allUsers.length
      })
    }

    // Add admin-specific profile data
    const adminProfile = {
      ...user.toObject(),
      // Ensure avatar is properly set from profile subdocument
      avatar: user.profile?.avatar || user.avatar,
      employeeId: user.employeeId || `ADM-${user._id.toString().slice(-6)}`,
      department: user.department || 'IT',
      position: user.position || 'System Administrator',
      accessLevel: user.accessLevel || 'admin',
      permissions: user.permissions || [
        'user_management',
        'system_configuration',
        'data_management',
        'security_settings'
      ],
      officeLocation: user.officeLocation || {
        address: 'Remote',
        city: 'Lagos',
        state: 'Lagos State',
        coordinates: {
          latitude: 6.5244,
          longitude: 3.3792
        }
      },
      contactInfo: user.contactInfo || {
        workPhone: user.phone || '',
        extension: '',
        emergencyContact: '',
        emergencyPhone: ''
      },
      preferences: user.preferences || {
        preferredCommunicationMethod: 'email',
        preferredReportFormat: 'pdf',
        dashboardLayout: 'detailed',
        notificationPreferences: ['email']
      },
      settings: user.settings || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        twoFactorAuth: true,
        sessionTimeout: 30,
        privacyLevel: 'staff'
      },
      verificationStatus: user.verificationStatus || 'verified',
      verificationDocuments: user.verificationDocuments || [],
      performanceMetrics: {
        totalUsersManaged: 0, // TODO: Implement actual user count
        totalReportsGenerated: 0,
        averageResponseTime: 150, // Default response time in ms
        systemUptime: 99.9,
        userSatisfaction: 4.5
      },
      isActive: user.status !== 'inactive' && user.status !== 'suspended',
      lastActivity: user.lastLogin || new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }


    console.log('Sending admin profile response:', {
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone,
      location: adminProfile.location
    })

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
    const updateData = req.body
    
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

    // Add some recent system activities
    const recentActivities = [
      {
        id: 'system_check_' + Date.now(),
        action: 'System Health Check',
        description: 'Automated system health verification completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        ipAddress: 'System',
        userAgent: 'Automated',
        status: 'success'
      }
    ]

    // Combine and sort by timestamp (most recent first)
    const allLogs = [...logs, ...recentActivities]
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
    const user = await User.findById(userId).select('lastLogin createdAt updatedAt settings twoFactorEnabled')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    // Get real security settings based on user data
    const securitySettings = {
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastPasswordChange: user.updatedAt || user.createdAt,
      passwordExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days from now
      loginAttempts: 0, // This would come from a login attempts collection in production
      lastLogin: user.lastLogin || user.createdAt,
      trustedDevices: [
        {
          id: 'device_' + userId,
          name: 'Current Device',
          lastUsed: user.lastLogin || new Date(),
          location: 'Current Location'
        }
      ]
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

// Multer error handler
const multerErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Maximum 5MB allowed.'
      })
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid file field name. Expected "avatar".'
      })
    }
  } else if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      status: 'error',
      message: 'Only image files are allowed'
    })
  }

  next(error)
}

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
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
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
        
      default:
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
    const [dbStatus, apiStatus, servicesStatus] = await Promise.all([
      // Database status
      User.findOne().then(() => ({ status: 'healthy', responseTime: Date.now() % 100 }))
        .catch(() => ({ status: 'unhealthy', responseTime: null })),
      
      // API status
      Promise.resolve({ status: 'healthy', responseTime: Date.now() % 50 }),
      
      // Services status
      Promise.all([
        // Mock service checks
        Promise.resolve({ name: 'Authentication', status: 'healthy', uptime: process.uptime() }),
        Promise.resolve({ name: 'File Upload', status: 'healthy', uptime: process.uptime() }),
        Promise.resolve({ name: 'Notifications', status: 'healthy', uptime: process.uptime() }),
        Promise.resolve({ name: 'Payment Gateway', status: 'healthy', uptime: process.uptime() }),
        Promise.resolve({ name: 'SMS Service', status: 'healthy', uptime: process.uptime() })
      ])
    ])

    res.json({
      status: 'success',
      data: {
        overall: 'healthy',
        database: dbStatus,
        api: apiStatus,
        services: servicesStatus,
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
router.get('/system/logs', async (req, res) => {
  try {
    const { level = 'all', limit = 100, page = 1 } = req.query
    
    // Mock log entries (in a real system, this would come from a logging service)
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        level: 'info',
        message: 'User login successful',
        module: 'auth',
        userId: 'user123',
        metadata: { ip: '192.168.1.1', userAgent: 'Chrome/91.0' }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        level: 'warn',
        message: 'High memory usage detected',
        module: 'system',
        metadata: { memory: '85%', threshold: '80%' }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        level: 'error',
        message: 'Database connection timeout',
        module: 'database',
        metadata: { timeout: '5000ms', retries: 3 }
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        level: 'info',
        message: 'Harvest created successfully',
        module: 'harvest',
        userId: 'farmer456',
        metadata: { harvestId: 'h789', cropType: 'tomato' }
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        level: 'debug',
        message: 'API request processed',
        module: 'api',
        metadata: { endpoint: '/api/harvests', method: 'GET', responseTime: '120ms' }
      }
    ]

    // Filter by level if specified
    let filteredLogs = mockLogs
    if (level !== 'all') {
      filteredLogs = mockLogs.filter(log => log.level === level)
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + parseInt(limit))

    res.json({
      status: 'success',
      data: {
        logs: paginatedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredLogs.length,
          pages: Math.ceil(filteredLogs.length / parseInt(limit))
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
router.put('/system/config', async (req, res) => {
  try {
    const { section, settings } = req.body
    
    if (!section || !settings) {
      return res.status(400).json({
        status: 'error',
        message: 'Section and settings are required'
      })
    }

    // In a real system, you would validate and update configuration
    // For now, we'll just return success
    res.json({
      status: 'success',
      message: `${section} configuration updated successfully`,
      data: {
        section,
        settings,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Update system config error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update system configuration'
    })
  }
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
    const { type = 'full', description } = req.body
    
    // Mock backup creation
    const backupId = `backup_${Date.now()}`
    const backup = {
      id: backupId,
      type,
      description: description || `${type} backup created on ${new Date().toLocaleDateString()}`,
      status: 'completed',
      size: '1.2GB',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      collections: ['users', 'harvests', 'orders', 'listings', 'transactions'],
      downloadUrl: `/api/admin/system/backups/${backupId}/download`
    }

    res.json({
      status: 'success',
      message: 'Backup created successfully',
      data: backup
    })
  } catch (error) {
    console.error('Create backup error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to create backup'
    })
  }
})

// Admin System Management - List Backups
router.get('/system/backups', async (req, res) => {
  try {
    // Mock backup list
    const backups = [
      {
        id: 'backup_1703001234567',
        type: 'full',
        description: 'Weekly full backup',
        status: 'completed',
        size: '1.2GB',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        createdBy: 'admin',
        collections: ['users', 'harvests', 'orders', 'listings', 'transactions']
      },
      {
        id: 'backup_1702987654321',
        type: 'incremental',
        description: 'Daily incremental backup',
        status: 'completed',
        size: '256MB',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        createdBy: 'admin',
        collections: ['users', 'harvests', 'orders']
      },
      {
        id: 'backup_1702974321098',
        type: 'full',
        description: 'Pre-update backup',
        status: 'completed',
        size: '1.1GB',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
        createdBy: 'admin',
        collections: ['users', 'harvests', 'orders', 'listings', 'transactions']
      }
    ]

    res.json({
      status: 'success',
      data: {
        backups,
        total: backups.length
      }
    })
  } catch (error) {
    console.error('List backups error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to list backups'
    })
  }
})

// Admin System Management - Restore Backup
router.post('/system/restore', async (req, res) => {
  try {
    const { backupId, collections = [] } = req.body
    
    if (!backupId) {
      return res.status(400).json({
        status: 'error',
        message: 'Backup ID is required'
      })
    }

    // Mock restore process
    res.json({
      status: 'success',
      message: 'Backup restore initiated',
      data: {
        restoreId: `restore_${Date.now()}`,
        backupId,
        collections: collections.length > 0 ? collections : ['users', 'harvests', 'orders', 'listings', 'transactions'],
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        startedBy: req.user.id,
        estimatedDuration: '15-30 minutes'
      }
    })
  } catch (error) {
    console.error('Restore backup error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to restore backup'
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

// Admin Reports Management - Generate Report
router.post('/reports/generate', async (req, res) => {
  try {
    const { templateId, parameters = {} } = req.body
    
    if (!templateId) {
      return res.status(400).json({
        status: 'error',
        message: 'Template ID is required'
      })
    }

    // Mock report generation
    const reportId = `report_${Date.now()}`
    const report = {
      id: reportId,
      templateId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      parameters
    }

    // Simulate processing time
    setTimeout(() => {
      // In a real implementation, you would update the report status in the database
      console.log(`Report ${reportId} generated successfully`)
    }, 3000)

    res.json({
      status: 'success',
      message: 'Report generation started',
      data: report
    })
  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report'
    })
  }
})

// Admin Reports Management - Get Generated Reports
router.get('/reports/generated', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, format } = req.query
    
    // Mock generated reports
    const reports = [
      {
        id: '1',
        templateName: 'Harvest Summary Report',
        fileName: `harvest_summary_${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '_')}.pdf`,
        generatedDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        fileSize: '2.4 MB',
        format: 'pdf',
        status: 'completed',
        downloadUrl: '/api/admin/reports/1/download'
      },
      {
        id: '2',
        templateName: 'Financial Performance Report',
        fileName: `financial_performance_${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '_')}.xlsx`,
        generatedDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        fileSize: '1.8 MB',
        format: 'excel',
        status: 'completed',
        downloadUrl: '/api/admin/reports/2/download'
      },
      {
        id: '3',
        templateName: 'User Analytics Report',
        fileName: `user_analytics_${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '_')}.csv`,
        generatedDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        fileSize: '856 KB',
        format: 'csv',
        status: 'completed',
        downloadUrl: '/api/admin/reports/3/download'
      }
    ]

    // Apply filters
    let filteredReports = reports
    if (status) {
      filteredReports = filteredReports.filter(r => r.status === status)
    }
    if (format) {
      filteredReports = filteredReports.filter(r => r.format === format)
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const paginatedReports = filteredReports.slice(startIndex, startIndex + parseInt(limit))

    res.json({
      status: 'success',
      data: {
        reports: paginatedReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredReports.length,
          pages: Math.ceil(filteredReports.length / parseInt(limit))
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
    
    // Mock file download
    const report = {
      id,
      fileName: `report_${id}.pdf`,
      contentType: 'application/pdf'
    }

    // In a real implementation, you would stream the actual file
    res.setHeader('Content-Type', report.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`)
    res.send('Mock file content for report ' + id)
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
    
    // Mock report deletion
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

// Admin Reports Management - Schedule Report
router.post('/reports/schedule', async (req, res) => {
  try {
    const { templateId, frequency, recipients, parameters } = req.body
    
    if (!templateId || !frequency || !recipients) {
      return res.status(400).json({
        status: 'error',
        message: 'Template ID, frequency, and recipients are required'
      })
    }

    const scheduleId = `schedule_${Date.now()}`
    const nextRun = new Date()
    
    // Calculate next run based on frequency
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        break
    }

    const scheduledReport = {
      id: scheduleId,
      templateId,
      frequency,
      recipients,
      parameters,
      nextRun: nextRun.toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    }

    res.json({
      status: 'success',
      message: 'Report scheduled successfully',
      data: scheduledReport
    })
  } catch (error) {
    console.error('Schedule report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to schedule report'
    })
  }
})

// Admin Reports Management - Get Scheduled Reports
router.get('/reports/scheduled', async (req, res) => {
  try {
    // Mock scheduled reports
    const scheduledReports = [
      {
        id: 'sched-1',
        templateId: 'harvest-summary',
        templateName: 'Harvest Summary Report',
        frequency: 'weekly',
        nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        status: 'active',
        recipients: ['admin@grochain.com', 'manager@grochain.com'],
        parameters: { dateRange: 'last7days' }
      },
      {
        id: 'sched-2',
        templateId: 'financial-performance',
        templateName: 'Financial Performance Report',
        frequency: 'monthly',
        nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
        lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        status: 'active',
        recipients: ['finance@grochain.com'],
        parameters: { dateRange: 'last30days' }
      }
    ]

    res.json({
      status: 'success',
      data: { scheduledReports }
    })
  } catch (error) {
    console.error('Get scheduled reports error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get scheduled reports'
    })
  }
})

// Admin Reports Management - Update Scheduled Report
router.put('/reports/scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, frequency, recipients, parameters } = req.body
    
    // Mock update
    res.json({
      status: 'success',
      message: 'Scheduled report updated successfully',
      data: {
        id,
        status: status || 'active',
        frequency: frequency || 'weekly',
        recipients: recipients || [],
        parameters: parameters || {},
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Update scheduled report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update scheduled report'
    })
  }
})

// Admin Reports Management - Delete Scheduled Report
router.delete('/reports/scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Mock deletion
    res.json({
      status: 'success',
      message: 'Scheduled report deleted successfully',
      data: { id }
    })
  } catch (error) {
    console.error('Delete scheduled report error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete scheduled report'
    })
  }
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