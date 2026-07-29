const express = require('express')
const router = express.Router()
const AiController = require('../controllers/ai.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

/**
 * AI Routes - GroChain Intelligent Features
 * All routes require authentication
 */

// Trust Score - Analysis of user reputation
router.get('/trust-score/:userId', 
  authenticate, 
  AiController.getTrustScore
)

// PricePulse - Dynamic market price advisory
router.get('/price-pulse', 
  authenticate, 
  AiController.getPricePulse
)

// Shipment Risk - Analysis of perishability and delays
router.get('/shipment-risk/:shipmentId', 
  authenticate, 
  AiController.getShipmentRisk
)

// Forecast - Growth predictions for farmers
router.get('/forecast', 
  authenticate, 
  AiController.getFarmerForecast
)

// GroScan - AI Vision analysis (Post for image data)
router.post('/scan-quality', 
  authenticate, 
  AiController.analyzeCropQuality
)

module.exports = router
