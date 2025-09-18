const crypto = require('crypto')

class RateLimitMiddleware {
  constructor() {
    this.enabled = process.env.RATE_LIMIT_ENABLED !== 'false'
    
    // Simple in-memory store for rate limiting
    this.memoryStore = new Map()
    this.memoryCleanupInterval = null
    
    // Default rate limit configurations
    this.defaultLimits = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }

    // Specific endpoint limits
    this.endpointLimits = {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 login attempts per 15 minutes
        message: 'Too many authentication attempts, please try again later.'
      },
      payment: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 payment attempts per hour
        message: 'Too many payment attempts, please try again later.'
      },
      ussd: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 20, // 20 USSD requests per 5 minutes
        message: 'Too many USSD requests, please try again later.'
      },
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 API requests per 15 minutes
        message: 'API rate limit exceeded, please try again later.'
      },
      upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // 50 file uploads per hour
        message: 'Too many file uploads, please try again later.'
      }
    }

    // Start memory cleanup interval
    this.startMemoryCleanup()
  }
  
  // Start memory cleanup interval
  startMemoryCleanup() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval)
    }
    
    this.memoryCleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, data] of this.memoryStore.entries()) {
        if (data.expiresAt < now) {
          this.memoryStore.delete(key)
        }
      }
    }, 60000) // Clean up every minute
  }

  // Check rate limit for an identifier
  async checkRateLimit(identifier, endpoint = 'default') {
    if (!this.enabled) {
      return {
        allowed: true,
        limit: 0,
        remaining: 0,
        resetTime: new Date(Date.now() + this.defaultLimits.windowMs)
      }
    }

    const endpointConfig = this.endpointLimits[endpoint] || this.defaultLimits
    const key = `${endpoint}:${identifier}`
    const now = Date.now()
    const windowStart = now - endpointConfig.windowMs

    // Get current data or initialize
    let data = this.memoryStore.get(key)
    if (!data || data.windowStart < windowStart) {
      data = {
        count: 0,
        windowStart: now,
        expiresAt: now + endpointConfig.windowMs
      }
    }

    // Check if limit exceeded
    if (data.count >= endpointConfig.max) {
      return {
        allowed: false,
        limit: endpointConfig.max,
        remaining: 0,
        resetTime: new Date(data.windowStart + endpointConfig.windowMs)
      }
    }

    // Increment count
    data.count++
    this.memoryStore.set(key, data)

    return {
      allowed: true,
      limit: endpointConfig.max,
      remaining: endpointConfig.max - data.count,
      resetTime: new Date(data.windowStart + endpointConfig.windowMs)
    }
  }

  // Basic rate limit middleware
  rateLimit(endpoint = 'default') {
    return async (req, res, next) => {
      try {
        const identifier = req.ip || req.connection.remoteAddress || 'unknown'
        const result = await this.checkRateLimit(identifier, endpoint)
        
        if (!result.allowed) {
          const endpointConfig = this.endpointLimits[endpoint] || this.defaultLimits
          return res.status(429).json({
            success: false,
            message: endpointConfig.message,
            retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
          })
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime.getTime()
        })

        next()
      } catch (error) {
        console.error('Rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // User-specific rate limiting
  userRateLimit(endpoint = 'default') {
    return async (req, res, next) => {
      try {
        const identifier = req.user?.id || req.ip || 'anonymous'
        const result = await this.checkRateLimit(identifier, endpoint)
        
        if (!result.allowed) {
          const endpointConfig = this.endpointLimits[endpoint] || this.defaultLimits
          return res.status(429).json({
            success: false,
            message: endpointConfig.message,
            retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
          })
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime.getTime()
        })

        next()
      } catch (error) {
        console.error('User rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // Role-based rate limiting
  roleRateLimit(role, endpoint = 'default') {
    return async (req, res, next) => {
      try {
        const identifier = `${role}:${req.user?.id || req.ip || 'anonymous'}`
        const result = await this.checkRateLimit(identifier, endpoint)
        
        if (!result.allowed) {
          const endpointConfig = this.endpointLimits[endpoint] || this.defaultLimits
          return res.status(429).json({
            success: false,
            message: endpointConfig.message,
            retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
          })
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime.getTime()
        })

        next()
      } catch (error) {
        console.error('Role rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // Flexible rate limiting with custom options
  flexibleRateLimit(options = {}) {
    return async (req, res, next) => {
      try {
        const identifier = options.identifier ? 
          (typeof options.identifier === 'function' ? options.identifier(req) : options.identifier) :
          (req.ip || req.connection.remoteAddress || 'unknown')
        
        const result = await this.checkRateLimit(identifier, 'custom')
        
        if (!result.allowed) {
          return res.status(429).json({
            success: false,
            message: options.message || 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
          })
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.resetTime.getTime()
        })

        next()
      } catch (error) {
        console.error('Flexible rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // Burst rate limiting
  burstRateLimit(maxBurst = 10, windowMs = 1000) {
    return async (req, res, next) => {
      try {
        const identifier = req.ip || req.connection.remoteAddress || 'unknown'
        const key = `burst:${identifier}`
        const now = Date.now()
        const windowStart = now - windowMs

        // Get current burst data
        let data = this.memoryStore.get(key)
        if (!data || data.windowStart < windowStart) {
          data = {
            count: 0,
            windowStart: now,
            expiresAt: now + windowMs
          }
        }

        // Check burst limit
        if (data.count >= maxBurst) {
          return res.status(429).json({
            success: false,
            message: 'Burst rate limit exceeded',
            retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000)
          })
        }

        // Increment count
        data.count++
        this.memoryStore.set(key, data)

        next()
      } catch (error) {
        console.error('Burst rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // Sliding window rate limiting
  slidingWindowRateLimit(maxRequests = 100, windowMs = 60000) {
    return async (req, res, next) => {
      try {
        const identifier = req.ip || req.connection.remoteAddress || 'unknown'
        const key = `sliding:${identifier}`
        const now = Date.now()
        const windowStart = now - windowMs

        // Get current sliding window data
        let data = this.memoryStore.get(key)
        if (!data) {
          data = {
            requests: [],
            expiresAt: now + windowMs
          }
        }

        // Remove old requests outside the window
        data.requests = data.requests.filter(timestamp => timestamp > windowStart)

        // Check if limit exceeded
        if (data.requests.length >= maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Sliding window rate limit exceeded',
            retryAfter: Math.ceil((data.requests[0] + windowMs - now) / 1000)
          })
        }

        // Add current request
        data.requests.push(now)
        this.memoryStore.set(key, data)

        next()
      } catch (error) {
        console.error('Sliding window rate limit error:', error)
        next() // Continue on error
      }
    }
  }

  // Get rate limit statistics
  async getRateLimitStats() {
    if (!this.enabled) {
      return { enabled: false, message: 'Rate limiting is disabled' }
    }

    const stats = {
      enabled: this.enabled,
      totalKeys: this.memoryStore.size,
      endpoints: {}
    }

    // Count keys by endpoint
    for (const [key, data] of this.memoryStore.entries()) {
      const [endpoint] = key.split(':')
      if (!stats.endpoints[endpoint]) {
        stats.endpoints[endpoint] = 0
      }
      stats.endpoints[endpoint]++
    }

    return stats
  }

  // Reset rate limit for specific identifier
  async resetRateLimit(identifier, endpoint = 'default') {
    if (!this.enabled) return false

    try {
      const key = `${endpoint}:${identifier}`
      this.memoryStore.delete(key)
      return true
    } catch (error) {
      console.error('Error resetting rate limit:', error)
      return false
    }
  }

  // Clear all rate limits
  async clearAllRateLimits() {
    if (!this.enabled) return false

    try {
      this.memoryStore.clear()
      return true
    } catch (error) {
      console.error('Error clearing rate limits:', error)
      return false
    }
  }

  // Cleanup method
  cleanup() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval)
      this.memoryCleanupInterval = null
    }
    
    this.memoryStore.clear()
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      enabled: this.enabled,
      memoryStoreSize: this.memoryStore.size,
      cleanupInterval: this.memoryCleanupInterval ? 'active' : 'inactive'
    }
  }
}

// Create singleton instance
const rateLimitMiddleware = new RateLimitMiddleware()

// Handle process termination
process.on('SIGINT', async () => {
  rateLimitMiddleware.cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  rateLimitMiddleware.cleanup()
  process.exit(0)
})

module.exports = rateLimitMiddleware

