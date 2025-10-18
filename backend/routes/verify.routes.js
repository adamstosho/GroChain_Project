const router = require('express').Router()
const harvestController = require('../controllers/harvest.controller')

// Public QR verification endpoint (no authentication required)
// This matches the spec requirement: GET /api/verify/:batchId
router.get('/:batchId', (req, res, next) => {
  console.log('🔍 Verify route hit:', req.params.batchId)
  next()
}, harvestController.verifyQRCode)

// Additional verification endpoints
router.get('/harvest/:batchId', harvestController.getProvenance)
router.get('/product/:productId', harvestController.getProductProvenance)

module.exports = router

