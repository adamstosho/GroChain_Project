const User = require('../models/user.model')

// Role hierarchy and permissions
const ROLE_PERMISSIONS = {
  admin: {
    level: 4,
    permissions: [
      'user:read', 'user:write', 'user:delete',
      'harvest:read', 'harvest:write', 'harvest:delete', 'harvest:approve',
      'order:read', 'order:write', 'order:delete',
      'listing:read', 'listing:write', 'listing:delete',
      'transaction:read', 'transaction:write',
      'commission:read', 'commission:write', 'commission:delete',
      'partner:read', 'partner:write', 'partner:delete',
      'analytics:read', 'analytics:write',
      'fintech:read', 'fintech:write', 'fintech:delete',
      'shipment:read', 'shipment:write', 'shipment:delete',
      'system:read', 'system:write'
    ]
  },
  partner: {
    level: 3,
    permissions: [
      'user:read', 'user:write',
      'harvest:read', 'harvest:write',
      'order:read', 'order:write',
      'listing:read', 'listing:write',
      'transaction:read',
      'commission:read', 'commission:write',
      'analytics:read',
      'fintech:read'
    ]
  },
  buyer: {
    level: 2,
    permissions: [
      'harvest:read',
      'order:read', 'order:write',
      'listing:read',
      'transaction:read', 'transaction:write',
      'fintech:read'
    ]
  },
  farmer: {
    level: 1,
    permissions: [
      'harvest:read', 'harvest:write',
      'listing:read', 'listing:write',
      'order:read',
      'transaction:read',
      'fintech:read'
    ]
  }
}

// Check if user has required role
const hasRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role
      if (!userRole) {
        return res.status(403).json({
          status: 'error',
          message: 'User role not defined'
        })
      }

      if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles]
      }

      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
        })
      }

      next()
    } catch (error) {
      console.error('Role check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during role verification'
      })
    }
  }
}

// Check if user has minimum role level
const hasMinRole = (minRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role
      if (!userRole) {
        return res.status(403).json({
          status: 'error',
          message: 'User role not defined'
        })
      }

      const userLevel = ROLE_PERMISSIONS[userRole]?.level || 0
      const requiredLevel = ROLE_PERMISSIONS[minRole]?.level || 0

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Minimum required role: ${minRole}`
        })
      }

      next()
    } catch (error) {
      console.error('Minimum role check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during role verification'
      })
    }
  }
}

// Check if user has specific permission
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role
      if (!userRole) {
        return res.status(403).json({
          status: 'error',
          message: 'User role not defined'
        })
      }

      const rolePermissions = ROLE_PERMISSIONS[userRole]?.permissions || []
      
      if (!rolePermissions.includes(requiredPermission)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required permission: ${requiredPermission}`
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during permission verification'
      })
    }
  }
}

// Check if user can access resource (owner or admin)
const canAccessResource = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role
      const resourceId = req.params[resourceIdField] || req.body[resourceIdField]

      // Admins can access all resources
      if (userRole === 'admin') {
        return next()
      }

      // Partners can access their own resources and their farmers' resources
      if (userRole === 'partner') {
        if (resourceType === 'user') {
          // Check if user belongs to partner
          const user = await User.findById(resourceId).select('partner')
          if (user && user.partner?.toString() === req.user.id) {
            return next()
          }
        } else if (resourceType === 'harvest' || resourceType === 'listing') {
          // Check if resource belongs to partner's farmer
          const resource = await require(`../models/${resourceType}.model`).findById(resourceId).select('farmer')
          if (resource) {
            const farmer = await User.findById(resource.farmer).select('partner')
            if (farmer && farmer.partner?.toString() === req.user.id) {
              return next()
            }
          }
        }
      }

      // Farmers and buyers can only access their own resources
      if (userRole === 'farmer' || userRole === 'buyer') {
        if (resourceType === 'user' && resourceId === req.user.id) {
          return next()
        }
        
        if (resourceType === 'harvest' || resourceType === 'listing') {
          const resource = await require(`../models/${resourceType}.model`).findById(resourceId).select('farmer')
          if (resource && resource.farmer?.toString() === req.user.id) {
            return next()
          }
        }

        if (resourceType === 'order') {
          const order = await require('../models/order.model').findById(resourceId).select('buyer')
          if (order && order.buyer?.toString() === req.user.id) {
            return next()
          }
        }
      }

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only access your own resources.'
      })
    } catch (error) {
      console.error('Resource access check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during resource access verification'
      })
    }
  }
}

// Check if user can modify resource
const canModifyResource = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role
      const resourceId = req.params[resourceIdField] || req.body[resourceIdField]

      // Admins can modify all resources
      if (userRole === 'admin') {
        return next()
      }

      // Partners can modify their own resources and their farmers' resources
      if (userRole === 'partner') {
        if (resourceType === 'user') {
          const user = await User.findById(resourceId).select('partner')
          if (user && user.partner?.toString() === req.user.id) {
            return next()
          }
        } else if (resourceType === 'harvest' || resourceType === 'listing') {
          const resource = await require(`../models/${resourceType}.model`).findById(resourceId).select('farmer')
          if (resource) {
            const farmer = await User.findById(resource.farmer).select('partner')
            if (farmer && farmer.partner?.toString() === req.user.id) {
              return next()
            }
          }
        }
      }

      // Farmers can only modify their own resources
      if (userRole === 'farmer') {
        if (resourceType === 'harvest' || resourceType === 'listing') {
          const resource = await require(`../models/${resourceType}.model`).findById(resourceId).select('farmer')
          if (resource && resource.farmer?.toString() === req.user.id) {
            return next()
          }
        }
      }

      // Buyers can only modify their own orders
      if (userRole === 'buyer' && resourceType === 'order') {
        const order = await require('../models/order.model').findById(resourceId).select('buyer')
        if (order && order.buyer?.toString() === req.user.id) {
          return next()
        }
      }

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only modify your own resources.'
      })
    } catch (error) {
      console.error('Resource modification check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during resource modification verification'
      })
    }
  }
}

// Check if user can delete resource
const canDeleteResource = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      const userRole = req.user.role

      // Only admins can delete resources
      if (userRole !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Only administrators can delete resources.'
        })
      }

      next()
    } catch (error) {
      console.error('Resource deletion check error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during resource deletion verification'
      })
    }
  }
}

// Check if user is verified
const isVerified = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      })
    }

    if (!req.user.verified) {
      return res.status(403).json({
        status: 'error',
        message: 'Account verification required. Please verify your email and complete KYC.'
      })
    }

    next()
  } catch (error) {
    console.error('Verification check error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during verification check'
    })
  }
}

// Check if user is active
const isActive = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      })
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active. Please contact support.'
      })
    }

    next()
  } catch (error) {
    console.error('Active status check error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during active status check'
    })
  }
}

// Check if user has completed profile
const hasCompleteProfile = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      })
    }

    const requiredFields = ['name', 'email', 'phone', 'location']
    const missingFields = requiredFields.filter(field => !req.user[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Please complete your profile. Missing fields: ${missingFields.join(', ')}`
      })
    }

    next()
  } catch (error) {
    console.error('Profile completeness check error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during profile completeness check'
    })
  }
}

module.exports = {
  hasRole,
  hasMinRole,
  hasPermission,
  canAccessResource,
  canModifyResource,
  canDeleteResource,
  isVerified,
  isActive,
  hasCompleteProfile,
  ROLE_PERMISSIONS
}

