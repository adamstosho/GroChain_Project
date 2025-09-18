const express = require('express')
const router = express.Router()
const onboardingController = require('../controllers/onboarding.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Apply authentication to all routes
router.use(authenticate)

// Get all onboardings with filters and pagination
router.get('/', onboardingController.getOnboardings)

// Get onboarding statistics
router.get('/stats', onboardingController.getOnboardingStats)

// Get onboarding by ID
router.get('/:id', onboardingController.getOnboardingById)

// Create new onboarding
router.post('/', onboardingController.createOnboarding)

// Update onboarding
router.put('/:id', onboardingController.updateOnboarding)

// Update onboarding stage
router.patch('/:id/stage', onboardingController.updateOnboardingStage)

// Delete onboarding
router.delete('/:id', onboardingController.deleteOnboarding)

// Get onboarding progress for a farmer
router.get('/progress/:farmerId', onboardingController.getOnboardingProgress)

// Bulk update onboardings
router.post('/bulk-update', onboardingController.bulkUpdateOnboardings)

// Export onboardings
router.post('/export', onboardingController.exportOnboardings)

module.exports = router
