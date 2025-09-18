const Joi = require('joi')

// Common validation schemas
const commonSchemas = {
  id: Joi.string().hex().length(24).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+234|0)?[789][01]\d{8}$/).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  name: Joi.string().min(2).max(100).required(),
  location: Joi.object({
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().default('Nigeria'),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional()
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  geoLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  })
}

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    password: commonSchemas.password,
    role: Joi.string().valid('farmer', 'buyer', 'partner', 'admin').default('farmer'),
    location: commonSchemas.location.optional(),
    profileImage: Joi.string().uri().optional(),
    bvn: Joi.string().length(11).pattern(/^\d+$/).optional(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().length(10).pattern(/^\d+$/).optional(),
      accountName: Joi.string().optional(),
      bankCode: Joi.string().optional(),
      bankName: Joi.string().optional()
    }).optional()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),

  updateProfile: Joi.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    location: commonSchemas.location.optional(),
    profileImage: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().default(true),
      emailUpdates: Joi.boolean().default(true),
      smsUpdates: Joi.boolean().default(false)
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: commonSchemas.password,
    newPassword: commonSchemas.password,
    confirmPassword: Joi.ref('newPassword')
  }),

  resetPassword: Joi.object({
    email: commonSchemas.email,
    token: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.ref('newPassword')
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email
  })
}

// Harvest validation schemas
const harvestSchemas = {
  create: Joi.object({
    cropType: Joi.string().min(2).max(100).required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().valid('kg', 'tonnes', 'bags', 'pieces').default('kg'),
    location: commonSchemas.location,
    geoLocation: commonSchemas.geoLocation,
    date: Joi.date().max('now').default('now'),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').default('good'),
    description: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    agriculturalData: Joi.object({
      soilType: Joi.string().optional(),
      irrigationMethod: Joi.string().optional(),
      fertilizerUsed: Joi.string().optional(),
      pestControl: Joi.string().optional(),
      harvestMethod: Joi.string().optional()
    }).optional(),
    qualityMetrics: Joi.object({
      moistureContent: Joi.number().min(0).max(100).optional(),
      proteinContent: Joi.number().min(0).max(100).optional(),
      sizeGrade: Joi.string().optional(),
      colorGrade: Joi.string().optional(),
      defectPercentage: Joi.number().min(0).max(100).optional()
    }).optional(),
    sustainability: Joi.object({
      organicCertified: Joi.boolean().default(false),
      fairTrade: Joi.boolean().default(false),
      carbonFootprint: Joi.number().positive().optional(),
      waterUsage: Joi.number().positive().optional()
    }).optional()
  }),

  update: Joi.object({
    cropType: Joi.string().min(2).max(100).optional(),
    quantity: Joi.number().positive().optional(),
    unit: Joi.string().valid('kg', 'tonnes', 'bags', 'pieces').optional(),
    location: commonSchemas.location.optional(),
    geoLocation: commonSchemas.geoLocation.optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional(),
    description: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    agriculturalData: Joi.object({
      soilType: Joi.string().optional(),
      irrigationMethod: Joi.string().optional(),
      fertilizerUsed: Joi.string().optional(),
      pestControl: Joi.string().optional(),
      harvestMethod: Joi.string().optional()
    }).optional(),
    qualityMetrics: Joi.object({
      moistureContent: Joi.number().min(0).max(100).optional(),
      proteinContent: Joi.number().min(0).max(100).optional(),
      sizeGrade: Joi.string().optional(),
      colorGrade: Joi.string().optional(),
      defectPercentage: Joi.number().min(0).max(100).optional()
    }).optional(),
    sustainability: Joi.object({
      organicCertified: Joi.boolean().optional(),
      fairTrade: Joi.boolean().optional(),
      carbonFootprint: Joi.number().positive().optional(),
      waterUsage: Joi.number().positive().optional()
    }).optional()
  }),

  query: Joi.object({
    cropType: Joi.string().optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional(),
    status: Joi.string().valid('pending', 'verified', 'rejected', 'approved', 'listed').optional(),
    location: Joi.string().optional(),
    minQuantity: Joi.number().positive().optional(),
    maxQuantity: Joi.number().positive().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    organic: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Marketplace validation schemas
const marketplaceSchemas = {
  createListing: Joi.object({
    harvestId: commonSchemas.id,
    price: Joi.number().positive().required(),
    currency: Joi.string().valid('NGN').default('NGN'),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().valid('kg', 'tonnes', 'bags', 'pieces').required(),
    description: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    deliveryOptions: Joi.array().items(Joi.object({
      method: Joi.string().valid('pickup', 'delivery', 'both').required(),
      cost: Joi.number().positive().required(),
      estimatedDays: Joi.number().integer().positive().required()
    })).min(1).required(),
    minimumOrder: Joi.number().positive().optional(),
    bulkDiscount: Joi.object({
      minQuantity: Joi.number().positive().required(),
      discountPercentage: Joi.number().min(0).max(100).required()
    }).optional()
  }),

  updateListing: Joi.object({
    price: Joi.number().positive().optional(),
    quantity: Joi.number().positive().optional(),
    description: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    deliveryOptions: Joi.array().items(Joi.object({
      method: Joi.string().valid('pickup', 'delivery', 'both').required(),
      cost: Joi.number().positive().required(),
      estimatedDays: Joi.number().integer().positive().required()
    })).min(1).optional(),
    minimumOrder: Joi.number().positive().optional(),
    bulkDiscount: Joi.object({
      minQuantity: Joi.number().positive().required(),
      discountPercentage: Joi.number().min(0).max(100).required()
    }).optional()
  }),

  searchListings: Joi.object({
    query: Joi.string().min(1).optional(),
    cropType: Joi.string().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    location: Joi.string().optional(),
    quality: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional(),
    organic: Joi.boolean().optional(),
    deliveryMethod: Joi.string().valid('pickup', 'delivery', 'both').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    listingId: commonSchemas.id,
    quantity: Joi.number().positive().required(),
    deliveryAddress: commonSchemas.location,
    deliveryMethod: Joi.string().valid('pickup', 'delivery').required(),
    specialInstructions: Joi.string().max(500).optional(),
    paymentMethod: Joi.string().valid('paystack', 'flutterwave', 'card', 'bank_transfer').required()
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
    deliveryAddress: commonSchemas.location.optional(),
    specialInstructions: Joi.string().max(500).optional()
  }),

  query: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Payment validation schemas
const paymentSchemas = {
  initialize: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('NGN').default('NGN'),
    paymentMethod: Joi.string().valid('paystack', 'flutterwave', 'card', 'bank_transfer', 'ussd').required(),
    reference: Joi.string().optional(),
    callbackUrl: Joi.string().uri().optional(),
    metadata: Joi.object().optional()
  }),

  verify: Joi.object({
    reference: Joi.string().required()
  }),

  webhook: Joi.object({
    event: Joi.string().required(),
    data: Joi.object().required()
  })
}

// Shipment validation schemas
const shipmentSchemas = {
  create: Joi.object({
    orderId: commonSchemas.id,
    origin: commonSchemas.location,
    destination: commonSchemas.location,
    items: Joi.array().items(Joi.object({
      productId: commonSchemas.id.required(),
      quantity: Joi.number().positive().required(),
      unit: Joi.string().valid('kg', 'tonnes', 'bags', 'pieces').required()
    })).min(1).required(),
    shippingMethod: Joi.string().valid('standard', 'express', 'overnight').default('standard'),
    carrier: Joi.string().required(),
    trackingNumber: Joi.string().optional(),
    estimatedDelivery: Joi.date().min('now').required(),
    specialInstructions: Joi.string().max(500).optional(),
    insurance: Joi.object({
      required: Joi.boolean().default(false),
      amount: Joi.number().positive().optional(),
      type: Joi.string().valid('basic', 'comprehensive').optional()
    }).optional(),
    packaging: Joi.object({
      type: Joi.string().valid('box', 'bag', 'crate', 'pallet').required(),
      weight: Joi.number().positive().required(),
      dimensions: Joi.object({
        length: Joi.number().positive().required(),
        width: Joi.number().positive().required(),
        height: Joi.number().positive().required()
      }).required()
    }).required()
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed').optional(),
    trackingNumber: Joi.string().optional(),
    estimatedDelivery: Joi.date().min('now').optional(),
    currentLocation: commonSchemas.location.optional(),
    specialInstructions: Joi.string().max(500).optional()
  }),

  query: Joi.object({
    status: Joi.string().valid('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed').optional(),
    carrier: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Weather validation schemas
const weatherSchemas = {
  getWeather: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    units: Joi.string().valid('metric', 'imperial').default('metric')
  }),

  getForecast: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    days: Joi.number().integer().min(1).max(7).default(5),
    units: Joi.string().valid('metric', 'imperial').default('metric')
  }),

  subscribeAlerts: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    alertTypes: Joi.array().items(Joi.string().valid('weather', 'climate', 'agricultural')).min(1).required(),
    notificationMethods: Joi.array().items(Joi.string().valid('email', 'sms', 'push')).min(1).required()
  }),

  reverseGeocode: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  })
}

// Analytics validation schemas
const analyticsSchemas = {
  getAnalytics: Joi.object({
    type: Joi.string().valid('dashboard', 'user', 'harvest', 'marketplace', 'financial', 'partner', 'weather', 'agricultural').required(),
    period: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly').default('monthly'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    filters: Joi.object().optional()
  }),

  exportData: Joi.object({
    type: Joi.string().valid('user', 'harvest', 'marketplace', 'financial', 'partner', 'weather', 'agricultural').required(),
    format: Joi.string().valid('csv', 'excel', 'json').default('csv'),
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly').default('monthly'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    filters: Joi.object().optional()
  })
}

// Partner validation schemas
const partnerSchemas = {
  create: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    type: Joi.string().valid('logistics', 'financial', 'input_supplier', 'processor', 'retailer').required(),
    location: commonSchemas.location,
    description: Joi.string().max(1000).optional(),
    services: Joi.array().items(Joi.string()).min(1).required(),
    certifications: Joi.array().items(Joi.string()).optional(),
    contactPerson: Joi.object({
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
      position: Joi.string().optional()
    }).required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().length(10).pattern(/^\d+$/).required(),
      accountName: Joi.string().required(),
      bankCode: Joi.string().required(),
      bankName: Joi.string().required()
    }).required()
  }),

  update: Joi.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    location: commonSchemas.location.optional(),
    description: Joi.string().max(1000).optional(),
    services: Joi.array().items(Joi.string()).min(1).optional(),
    certifications: Joi.array().items(Joi.string()).optional(),
    contactPerson: Joi.object({
      name: commonSchemas.name.optional(),
      email: commonSchemas.email.optional(),
      phone: commonSchemas.phone.optional(),
      position: Joi.string().optional()
    }).optional(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().length(10).pattern(/^\d+$/).optional(),
      accountName: Joi.string().optional(),
      bankCode: Joi.string().optional(),
      bankName: Joi.string().optional()
    }).optional()
  })
}

// USSD validation schemas
const ussdSchemas = {
  initialize: Joi.object({
    phoneNumber: commonSchemas.phone,
    provider: Joi.string().valid('mtn', 'airtel', 'glo', '9mobile').required(),
    sessionId: Joi.string().required()
  }),

  processInput: Joi.object({
    sessionId: Joi.string().required(),
    userInput: Joi.string().required(),
    phoneNumber: commonSchemas.phone,
    provider: Joi.string().valid('mtn', 'airtel', 'glo', '9mobile').required()
  })
}

// QR Code validation schemas
const qrCodeSchemas = {
  generate: Joi.object({
    type: Joi.string().valid('harvest', 'listing', 'shipment', 'user', 'payment', 'tracking').required(),
    data: Joi.object().required(),
    options: Joi.object({
      width: Joi.number().integer().min(100).max(1000).default(256),
      height: Joi.number().integer().min(100).max(1000).default(256),
      color: Joi.object({
        dark: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#000000'),
        light: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#FFFFFF')
      }).optional()
    }).optional()
  }),

  validate: Joi.object({
    qrData: Joi.string().required()
  })
}

// Commission validation schemas
const commissionSchemas = {
  create: Joi.object({
    partnerId: commonSchemas.id,
    amount: Joi.number().positive().required(),
    percentage: Joi.number().min(0).max(100).required(),
    type: Joi.string().valid('transaction', 'subscription', 'referral').required(),
    reference: Joi.string().required(),
    description: Joi.string().max(500).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'paid', 'rejected').optional(),
    amount: Joi.number().positive().optional(),
    percentage: Joi.number().min(0).max(100).optional(),
    description: Joi.string().max(500).optional()
  }),

  query: Joi.object({
    partnerId: commonSchemas.id.optional(),
    status: Joi.string().valid('pending', 'approved', 'paid', 'rejected').optional(),
    type: Joi.string().valid('transaction', 'subscription', 'referral').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'date').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Price Alert validation schemas
const priceAlertSchemas = {
  create: Joi.object({
    listingId: commonSchemas.id,
    targetPrice: Joi.number().positive().required(),
    alertType: Joi.string().valid('price_drop', 'price_increase', 'both').default('both'),
    notificationChannels: Joi.array().items(Joi.string().valid('email', 'sms', 'push', 'in_app')).default(['in_app'])
  }),

  update: Joi.object({
    targetPrice: Joi.number().positive().optional(),
    alertType: Joi.string().valid('price_drop', 'price_increase', 'both').optional(),
    isActive: Joi.boolean().optional(),
    notificationChannels: Joi.array().items(Joi.string().valid('email', 'sms', 'push', 'in_app')).optional()
  }),

  query: Joi.object({
    listingId: commonSchemas.id.optional(),
    alertType: Joi.string().valid('price_drop', 'price_increase', 'both').optional(),
    isActive: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'targetPrice').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Validation middleware factory
const createValidationMiddleware = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }))

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      })
    }

    // Replace request data with validated data
    req[property] = value
    next()
  }
}

// Export all schemas and middleware
module.exports = {
  // Schemas
  schemas: {
    common: commonSchemas,
    user: userSchemas,
    harvest: harvestSchemas,
    marketplace: marketplaceSchemas,
    order: orderSchemas,
    payment: paymentSchemas,
    shipment: shipmentSchemas,
    weather: weatherSchemas,
    analytics: analyticsSchemas,
    partner: partnerSchemas,
    ussd: ussdSchemas,
    qrCode: qrCodeSchemas,
    commission: commissionSchemas,
    priceAlert: priceAlertSchemas
  },

  // Middleware functions
  validateBody: (schema) => createValidationMiddleware(schema, 'body'),
  validateQuery: (schema) => createValidationMiddleware(schema, 'query'),
  validateParams: (schema) => createValidationMiddleware(schema, 'params'),

  // Specific validation middleware
  validateUser: {
    register: createValidationMiddleware(userSchemas.register),
    login: createValidationMiddleware(userSchemas.login),
    updateProfile: createValidationMiddleware(userSchemas.updateProfile),
    changePassword: createValidationMiddleware(userSchemas.changePassword),
    resetPassword: createValidationMiddleware(userSchemas.resetPassword),
    forgotPassword: createValidationMiddleware(userSchemas.forgotPassword)
  },

  validateHarvest: {
    create: createValidationMiddleware(harvestSchemas.create),
    update: createValidationMiddleware(harvestSchemas.update),
    query: createValidationMiddleware(harvestSchemas.query, 'query')
  },

  validateMarketplace: {
    createListing: createValidationMiddleware(marketplaceSchemas.createListing),
    updateListing: createValidationMiddleware(marketplaceSchemas.updateListing),
    searchListings: createValidationMiddleware(marketplaceSchemas.searchListings, 'query')
  },

  validateOrder: {
    create: createValidationMiddleware(orderSchemas.create),
    update: createValidationMiddleware(orderSchemas.update),
    query: createValidationMiddleware(orderSchemas.query, 'query')
  },

  validatePayment: {
    initialize: createValidationMiddleware(paymentSchemas.initialize),
    verify: createValidationMiddleware(paymentSchemas.verify),
    webhook: createValidationMiddleware(paymentSchemas.webhook)
  },

  validateShipment: {
    create: createValidationMiddleware(shipmentSchemas.create),
    update: createValidationMiddleware(shipmentSchemas.update),
    query: createValidationMiddleware(shipmentSchemas.query, 'query')
  },

  validateWeather: {
    getWeather: createValidationMiddleware(weatherSchemas.getWeather, 'query'),
    getForecast: createValidationMiddleware(weatherSchemas.getForecast, 'query'),
    subscribeAlerts: createValidationMiddleware(weatherSchemas.subscribeAlerts),
    reverseGeocode: createValidationMiddleware(weatherSchemas.reverseGeocode, 'query')
  },

  validateAnalytics: {
    getAnalytics: createValidationMiddleware(analyticsSchemas.getAnalytics, 'query'),
    exportData: createValidationMiddleware(analyticsSchemas.exportData, 'query')
  },

  validatePartner: {
    create: createValidationMiddleware(partnerSchemas.create),
    update: createValidationMiddleware(partnerSchemas.update)
  },

  validateUSSD: {
    initialize: createValidationMiddleware(ussdSchemas.initialize),
    processInput: createValidationMiddleware(ussdSchemas.processInput)
  },

  validateQRCode: {
    generate: createValidationMiddleware(qrCodeSchemas.generate),
    validate: createValidationMiddleware(qrCodeSchemas.validate)
  },

  validateCommission: {
    create: createValidationMiddleware(commissionSchemas.create),
    update: createValidationMiddleware(commissionSchemas.update),
    query: createValidationMiddleware(commissionSchemas.query, 'query')
  },

  validatePriceAlert: {
    create: createValidationMiddleware(priceAlertSchemas.create),
    update: createValidationMiddleware(priceAlertSchemas.update),
    query: createValidationMiddleware(priceAlertSchemas.query, 'query')
  }
}
