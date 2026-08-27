const express = require('express')
const router = express.Router()
const { harvestApprovalController, getHarvestStatus, exportApprovals } = require('../controllers/harvest-approval.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Get harvests pending approval
router.get('/pending',
  authenticate,
  harvestApprovalController.getPendingHarvests
)

// Export approvals (CSV / Excel / JSON)
router.get('/export',
  authenticate,
  authorize('admin', 'partner'),
  exportApprovals
)

// Get all harvests for approvals dashboard (pending, approved, rejected)
router.get('/all',
  authenticate,
  harvestApprovalController.getAllHarvests
)

// Approve harvest
router.post('/:harvestId/approve',
  authenticate,
  harvestApprovalController.approveHarvest
)

// Reject harvest
router.post('/:harvestId/reject',
  authenticate,
  harvestApprovalController.rejectHarvest
)

// Request harvest revision
router.post('/:harvestId/revision',
  authenticate,
  harvestApprovalController.requestRevision
)

// Get approval statistics
router.get('/stats',
  authenticate,
  harvestApprovalController.getApprovalStats
)

// Create listing from approved harvest
router.post('/:harvestId/create-listing', 
  authenticate, 
  harvestApprovalController.createListingFromHarvest
)

// Bulk process harvests
router.post('/bulk-process',
  authenticate,
  harvestApprovalController.bulkProcessHarvests
)

// Check harvest data status (admin diagnostics)
router.get('/status',
  authenticate,
  authorize('admin'),
  getHarvestStatus
)

module.exports = router


