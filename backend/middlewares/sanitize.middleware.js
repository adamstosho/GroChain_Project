const xss = require('xss')
const DOMPurify = require('isomorphic-dompurify')

// HTML sanitization options
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'id', 'style'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

// XSS prevention function
const sanitizeXSS = (data) => {
  if (typeof data === 'string') {
    return xss(data, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    })
  }
  return data
}

// HTML sanitization function
const sanitizeHTML = (data) => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data, SANITIZE_OPTIONS)
  }
  return data
}

// Recursive sanitization for nested objects
const sanitizeObject = (obj, sanitizeFunction) => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizeFunction))
  }

  if (typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive fields that shouldn't be sanitized
      if (['password', 'token', 'secret', 'apiKey', 'privateKey'].includes(key)) {
        sanitized[key] = value
        continue
      }
      sanitized[key] = sanitizeObject(value, sanitizeFunction)
    }
    return sanitized
  }

  if (typeof obj === 'string') {
    return sanitizeFunction(obj)
  }

  return obj
}

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body, sanitizeXSS)
    }
    next()
  } catch (error) {
    console.error('Body sanitization error:', error)
    next()
  }
}

// Sanitize request query parameters
const sanitizeQuery = (req, res, next) => {
  try {
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeObject(req.query, sanitizeXSS)
    }
    next()
  } catch (error) {
    console.error('Query sanitization error:', error)
    next()
  }
}

// Sanitize request parameters
const sanitizeParams = (req, res, next) => {
  try {
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = sanitizeObject(req.params, sanitizeXSS)
    }
    next()
  } catch (error) {
    console.error('Params sanitization error:', error)
    next()
  }
}

// Sanitize headers (excluding sensitive ones)
const sanitizeHeaders = (req, res, next) => {
  try {
    const sensitiveHeaders = [
      'authorization', 'cookie', 'x-api-key', 'x-auth-token',
      'x-csrf-token', 'x-requested-with'
    ]

    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (!sensitiveHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
          req.headers[key] = sanitizeXSS(value)
        }
      }
    }
    next()
  } catch (error) {
    console.error('Headers sanitization error:', error)
    next()
  }
}

// Sanitize file uploads
const sanitizeFileUploads = (req, res, next) => {
  try {
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.originalname) {
            file.originalname = sanitizeXSS(file.originalname)
          }
        })
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(file => {
              if (file.originalname) {
                file.originalname = sanitizeXSS(file.originalname)
              }
            })
          }
        })
      }
    }
    next()
  } catch (error) {
    console.error('File upload sanitization error:', error)
    next()
  }
}

// Sanitize specific fields
const sanitizeFields = (fields, sanitizeFunction = sanitizeXSS) => {
  return (req, res, next) => {
    try {
      if (req.body) {
        fields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = sanitizeFunction(req.body[field])
          }
        })
      }
      next()
    } catch (error) {
      console.error('Fields sanitization error:', error)
      next()
    }
  }
}

// Sanitize HTML content fields
const sanitizeHTMLFields = (fields) => {
  return sanitizeFields(fields, sanitizeHTML)
}

// Remove potentially dangerous characters
const removeDangerousChars = (str) => {
  if (typeof str !== 'string') return str
  
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/file:/gi, '') // Remove file: protocol
}

// Sanitize SQL injection attempts
const sanitizeSQL = (str) => {
  if (typeof str !== 'string') return str
  
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\b(and|or)\b\s+\d+\s*[=<>])/gi,
    /(\b(and|or)\b\s+['"][^'"]*['"]\s*[=<>])/gi,
    /(--|\/\*|\*\/)/g,
    /(;|\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi
  ]
  
  let sanitized = str
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  return sanitized
}

// Sanitize NoSQL injection attempts
const sanitizeNoSQL = (obj) => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeNoSQL(item))
  }

  if (typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Check for MongoDB operator injection
      if (key.startsWith('$') && !['$and', '$or', '$nor', '$not'].includes(key)) {
        continue // Skip potentially dangerous operators
      }
      sanitized[key] = sanitizeNoSQL(value)
    }
    return sanitized
  }

  if (typeof obj === 'string') {
    return sanitizeSQL(obj)
  }

  return obj
}

// Comprehensive sanitization middleware
const sanitizeAll = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body, sanitizeXSS)
      req.body = sanitizeNoSQL(req.body)
    }

    // Sanitize query
    if (req.query) {
      req.query = sanitizeObject(req.query, sanitizeXSS)
      req.query = sanitizeNoSQL(req.query)
    }

    // Sanitize params
    if (req.params) {
      req.params = sanitizeObject(req.params, sanitizeXSS)
    }

    // Sanitize headers (excluding sensitive ones)
    const sensitiveHeaders = [
      'authorization', 'cookie', 'x-api-key', 'x-auth-token',
      'x-csrf-token', 'x-requested-with', 'content-type', 'content-length'
    ]

    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (!sensitiveHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
          req.headers[key] = sanitizeXSS(value)
        }
      }
    }

    next()
  } catch (error) {
    console.error('Comprehensive sanitization error:', error)
    next()
  }
}

// Rate limiting for sanitization (prevent abuse)
const sanitizeRateLimit = (req, res, next) => {
  try {
    // Simple rate limiting based on request size
    const requestSize = JSON.stringify(req.body).length + JSON.stringify(req.query).length
    
    if (requestSize > 1000000) { // 1MB limit
      return res.status(413).json({
        status: 'error',
        message: 'Request too large'
      })
    }

    next()
  } catch (error) {
    console.error('Sanitization rate limit error:', error)
    next()
  }
}

// Validation middleware for common input patterns
const validateInput = (req, res, next) => {
  try {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
    const urlPattern = /^https?:\/\/.+/i

    if (req.body) {
      // Validate email if present
      if (req.body.email && !emailPattern.test(req.body.email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        })
      }

      // Validate phone if present
      if (req.body.phone && !phonePattern.test(req.body.phone.replace(/\s/g, ''))) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid phone number format'
        })
      }

      // Validate URL if present
      if (req.body.url && !urlPattern.test(req.body.url)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid URL format'
        })
      }
    }

    next()
  } catch (error) {
    console.error('Input validation error:', error)
    next()
  }
}

module.exports = {
  sanitizeXSS,
  sanitizeHTML,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeHeaders,
  sanitizeFileUploads,
  sanitizeFields,
  sanitizeHTMLFields,
  removeDangerousChars,
  sanitizeSQL,
  sanitizeNoSQL,
  sanitizeAll,
  sanitizeRateLimit,
  validateInput,
  SANITIZE_OPTIONS
}

