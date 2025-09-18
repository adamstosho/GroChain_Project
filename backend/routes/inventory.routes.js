const express = require('express')
const router = express.Router()
const inventoryController = require('../controllers/inventory.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Get inventory statistics
router.get('/stats', authenticate, authorize('admin', 'partner'), inventoryController.getInventoryStats)

// Manually trigger cleanup of sold-out products
router.post('/cleanup', authenticate, authorize('admin'), inventoryController.cleanupSoldOutProducts)

// Mark a product as sold out
router.post('/mark-sold-out/:listingId', authenticate, authorize('admin', 'farmer'), inventoryController.markAsSoldOut)

// Restore a sold-out product
router.post('/restore/:listingId', authenticate, authorize('admin', 'farmer'), inventoryController.restoreSoldOutProduct)

module.exports = router

