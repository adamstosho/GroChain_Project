const { verifyAccess } = require('../utils/jwt')

async function authenticate(req, res, next) {
  try {
    console.log('🔐 Auth middleware called for path:', req.path, 'Method:', req.method, 'Original URL:', req.originalUrl);

    // Production-ready authentication - no bypasses

    // Check Authorization header first
    let header = req.headers.authorization || ''
    let token = header.startsWith('Bearer ') ? header.slice(7) : null

    // If no token in header, check cookies
    if (!token) {
      token = req.cookies?.auth_token || null
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No token provided' })
    }

    const decoded = verifyAccess(token)

    // Create a basic user object from JWT data
    // This avoids async database calls that might be causing issues
    req.user = {
      _id: decoded.id,  // Use _id to match MongoDB convention
      id: decoded.id,
      role: decoded.role,
      email: decoded.email || undefined, // Keep as undefined if not in token
      name: decoded.name || 'User',
      phone: undefined,
      location: undefined
    }

    // For marketplace routes, fetch complete user data to include phone/location
    if (req.path.includes('/marketplace') || req.path.includes('/favorites')) {
      try {
        const User = require('../models/user.model')
        const fullUser = await User.findById(decoded.id).select('phone location profile')
        if (fullUser) {
          req.user.phone = fullUser.phone
          req.user.location = fullUser.location
          req.user.profile = fullUser.profile
        }
      } catch (dbError) {
        console.log('⚠️ Could not fetch complete user data for marketplace:', dbError.message)
        // Continue with basic user data
      }
    }

    console.log('🔌 JWT decoded successfully:', {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    })

    next()
  } catch (e) {
    console.error('Auth middleware error:', e);
    return res.status(401).json({ status: 'error', message: 'Invalid token' })
  }
}

function authorizeRoles(...roles) {
  // Support both authorize('a','b') and authorize(['a','b'])
  const allowed = Array.isArray(roles[0]) ? roles[0] : roles
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' })
    }
    next()
  }
}

module.exports = { 
  authenticate, 
  authorize: authorizeRoles 
}


