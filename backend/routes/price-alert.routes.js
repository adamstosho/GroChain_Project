const express = require('express')
const router = express.Router()
const priceAlertController = require('../controllers/price-alert.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { validatePriceAlert } = require('../middlewares/validation.middleware')

// All routes require authentication
router.use(authenticate)

// Create a new price alert
router.post('/', 
  validatePriceAlert.create,
  priceAlertController.createPriceAlert
)

// Get user's price alerts
router.get('/', 
  validatePriceAlert.query,
  priceAlertController.getUserPriceAlerts
)

// Get price alert statistics
router.get('/stats', priceAlertController.getPriceAlertStats)

// Get specific price alert
router.get('/:alertId', priceAlertController.getPriceAlert)

// Update price alert
router.put('/:alertId',
  validatePriceAlert.update,
  priceAlertController.updatePriceAlert
)

// Delete price alert
router.delete('/:alertId', priceAlertController.deletePriceAlert)

// Admin route to check all price alerts (for scheduled jobs)
router.post('/check-all', priceAlertController.checkPriceAlerts)

module.exports = router

