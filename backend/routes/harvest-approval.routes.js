const express = require('express')
const router = express.Router()
const { harvestApprovalController, createSampleData, getHarvestStatus } = require('../controllers/harvest-approval.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Get harvests pending approval
router.get('/pending',
  authenticate,
  harvestApprovalController.getPendingHarvests
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

// Check harvest data status (temporary endpoint)
router.get('/status',
  getHarvestStatus
)

// Create sample data for testing (temporary endpoint)
router.post('/create-sample-data',
  createSampleData
)

module.exports = router


