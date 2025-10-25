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

    // Fetch user data from database to check status
    const User = require('../models/user.model')
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' })
    }
    
    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account suspended. Please contact support.',
        suspensionReason: user.suspensionReason || 'Account has been suspended by an administrator'
      })
    }
    
    // Create user object for the request
    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
      location: user.location,
      status: user.status,
      profile: user.profile
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


