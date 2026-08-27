const express = require('express')
const router = express.Router()
const AiController = require('../controllers/ai.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')

/**
 * GroChain Insights (data-driven advisory analytics + optional vision).
 * All routes require auth; AI-specific rate limit (OWASP LLM06).
 */
router.use(authenticate, rateLimitMiddleware.rateLimit('ai'))

router.get('/trust-score/:userId', AiController.getTrustScore)
router.get('/price-pulse', AiController.getPricePulse)
router.get('/shipment-risk/:shipmentId', AiController.getShipmentRisk)
router.get('/forecast', AiController.getFarmerForecast)
router.post('/scan-quality', AiController.analyzeCropQuality)

module.exports = router
