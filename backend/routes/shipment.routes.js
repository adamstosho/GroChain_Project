const express = require('express')
const router = express.Router()
const shipmentController = require('../controllers/shipment.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Create new shipment
router.post(
  '/', 
  authenticate, 
  authorize(['farmer', 'partner', 'admin']), 
  shipmentController.createShipment
)

// Get shipments with filters
router.get(
  '/', 
  authenticate, 
  shipmentController.getShipments
)

// Get shipment statistics
router.get(
  '/stats/overview', 
  authenticate, 
  shipmentController.getShipmentStats
)

// Search shipments
router.get(
  '/search/query', 
  authenticate, 
  shipmentController.searchShipments
)

// Get shipment by ID
router.get(
  '/:shipmentId', 
  authenticate, 
  shipmentController.getShipmentById
)

// Update shipment status
router.put(
  '/:shipmentId/status', 
  authenticate, 
  authorize(['farmer', 'partner', 'admin', 'carrier']), 
  shipmentController.updateShipmentStatus
)

// Confirm delivery
router.put(
  '/:shipmentId/delivery', 
  authenticate, 
  authorize(['farmer', 'partner', 'admin', 'carrier']), 
  shipmentController.confirmDelivery
)

// Report shipment issue
router.post(
  '/:shipmentId/issues', 
  authenticate, 
  shipmentController.reportIssue
)

module.exports = router
