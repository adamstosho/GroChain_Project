const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/review.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Get reviews for a specific listing (public)
router.get('/listings/:listingId', reviewController.getListingReviews)

// Create a new review (authenticated users only)
router.post('/listings/:listingId', authenticate, authorize('buyer', 'farmer', 'partner', 'admin'), reviewController.createReview)

// Update a review (only by the reviewer)
router.put('/:reviewId', authenticate, reviewController.updateReview)

// Delete a review (only by the reviewer)
router.delete('/:reviewId', authenticate, reviewController.deleteReview)

// Farmer response to review (farmers only)
router.post('/:reviewId/respond', authenticate, authorize('farmer', 'admin'), reviewController.respondToReview)

// Get reviews for farmer's listings (farmer only)
router.get('/farmer', authenticate, authorize('farmer', 'admin'), reviewController.getFarmerReviews)

module.exports = router
