const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `Duplicate field value: ${field}`
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field'
    error = { message, statusCode: 400 }
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests'
    error = { message, statusCode: 429 }
  }

  // Cloudinary errors
  if (err.http_code) {
    let message = 'File upload failed'
    let statusCode = 400

    switch (err.http_code) {
      case 400:
        message = 'Invalid file format or size'
        break
      case 401:
        message = 'File upload authentication failed'
        statusCode = 401
        break
      case 413:
        message = 'File too large'
        break
      default:
        message = err.message || 'File upload failed'
    }

    error = { message, statusCode }
  }

  // Paystack payment errors
  if (err.status === 'failed') {
    const message = err.message || 'Payment failed'
    error = { message, statusCode: 400 }
  }

  // Twilio SMS errors
  if (err.code && err.code.startsWith('TWILIO')) {
    let message = 'SMS sending failed'
    let statusCode = 500

    switch (err.code) {
      case 'TWILIO_AUTH_FAILED':
        message = 'SMS service authentication failed'
        statusCode = 500
        break
      case 'TWILIO_INVALID_PHONE':
        message = 'Invalid phone number'
        statusCode = 400
        break
      case 'TWILIO_RATE_LIMIT':
        message = 'SMS rate limit exceeded'
        statusCode = 429
        break
      default:
        message = err.message || 'SMS sending failed'
    }

    error = { message, statusCode }
  }

  // Handle circular reference errors (JSON serialization issues)
  if (err.message && err.message.includes('Converting circular structure to JSON')) {
    console.error('Circular reference error detected:', {
      url: req.originalUrl,
      method: req.method,
      user: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    })

    error = {
      message: 'Server encountered a serialization error while processing your request',
      statusCode: 500
    }
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500
  const message = error.message || 'Internal Server Error'

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Safely construct response object to avoid circular references
  const responseData = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  }

  // Only add development details if not a circular reference error
  if (isDevelopment && !err.message?.includes('Converting circular structure to JSON')) {
    responseData.stack = err.stack
    responseData.details = error
  }

  try {
    res.status(statusCode).json(responseData)
  } catch (jsonError) {
    // If JSON serialization fails, send a simple error response
    console.error('JSON serialization failed in error handler:', jsonError.message)
    res.status(500).json({
      status: 'error',
      message: 'Server encountered an error while processing your request',
      timestamp: new Date().toISOString()
    })
  }
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

// Validation error handler
const handleValidationError = (err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString()
    })
  }
  next(err)
}

// Database connection error handler
const handleDatabaseError = (err, req, res, next) => {
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    console.error('Database error:', err)
    
    return res.status(503).json({
      status: 'error',
      message: 'Database service temporarily unavailable',
      timestamp: new Date().toISOString()
    })
  }
  next(err)
}

// File upload error handler
const handleFileUploadError = (err, req, res, next) => {
  if (err.code && (err.code.startsWith('LIMIT_') || err.code.startsWith('MULTER_'))) {
    let message = 'File upload failed'
    let statusCode = 400

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds limit'
        break
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded'
        break
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field'
        break
      default:
        message = err.message || 'File upload failed'
    }

    return res.status(statusCode).json({
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    })
  }
  next(err)
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationError,
  handleDatabaseError,
  handleFileUploadError
}

