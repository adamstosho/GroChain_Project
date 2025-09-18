const Review = require('../models/review.model')
const Listing = require('../models/listing.model')
const User = require('../models/user.model')
const Order = require('../models/order.model')

const reviewController = {
  // Get reviews for a specific listing
  async getListingReviews(req, res) {
    try {
      const { listingId } = req.params
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      // Verify listing exists
      const listing = await Listing.findById(listingId)
      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [reviews, total] = await Promise.all([
        Review.find({ 
          listing: listingId, 
          status: 'approved' 
        })
          .populate('buyer', 'name profile.avatar')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Review.countDocuments({ 
          listing: listingId, 
          status: 'approved' 
        })
      ])

      // Calculate average rating
      const ratingStats = await Review.aggregate([
        { $match: { listing: listing._id, status: 'approved' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$rating', 5] }, then: 'five' },
                    { case: { $eq: ['$rating', 4] }, then: 'four' },
                    { case: { $eq: ['$rating', 3] }, then: 'three' },
                    { case: { $eq: ['$rating', 2] }, then: 'two' },
                    { case: { $eq: ['$rating', 1] }, then: 'one' }
                  ],
                  default: 'other'
                }
              }
            }
          }
        }
      ])

      const stats = ratingStats[0] || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: []
      }

      // Count rating distribution
      const distribution = {
        five: stats.ratingDistribution.filter(r => r === 'five').length,
        four: stats.ratingDistribution.filter(r => r === 'four').length,
        three: stats.ratingDistribution.filter(r => r === 'three').length,
        two: stats.ratingDistribution.filter(r => r === 'two').length,
        one: stats.ratingDistribution.filter(r => r === 'one').length
      }

      res.json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          stats: {
            averageRating: Math.round(stats.averageRating * 10) / 10,
            totalReviews: stats.totalReviews,
            distribution
          }
        }
      })
    } catch (error) {
      console.error('Error getting listing reviews:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get reviews'
      })
    }
  },

  // Create a new review
  async createReview(req, res) {
    try {
      const { listingId } = req.params
      const { rating, comment, images, orderId } = req.body
      const buyerId = req.user.id

      // Validate required fields
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          status: 'error',
          message: 'Rating must be between 1 and 5'
        })
      }

      // Verify listing exists and get farmer info
      const listing = await Listing.findById(listingId)
        .populate('farmer', 'name')
      
      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }

      // Check if user already reviewed this listing
      const existingReview = await Review.findOne({ 
        listing: listingId, 
        buyer: buyerId 
      })
      
      if (existingReview) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already reviewed this product'
        })
      }

      // Verify order if provided (optional verification)
      let verified = false
      if (orderId) {
        const order = await Order.findOne({ 
          _id: orderId, 
          buyer: buyerId, 
          listing: listingId,
          status: 'delivered'
        })
        verified = !!order
      }

      // Create review
      const review = await Review.create({
        listing: listingId,
        buyer: buyerId,
        farmer: listing.farmer._id,
        order: orderId,
        rating,
        comment: comment || '',
        images: images || [],
        verified
      })

      // Update listing rating and review count
      await updateListingStats(listingId)

      // Populate buyer info for response
      await review.populate('buyer', 'name profile.avatar')

      // Send notification to farmer about new review
      try {
        const Notification = require('../models/notification.model')
        await Notification.create({
          user: listing.farmer._id,
          type: 'review',
          title: 'New Review Received',
          message: `${review.buyer.name} left a ${rating}-star review for your ${listing.cropName}`,
          data: {
            reviewId: review._id,
            listingId: listingId,
            rating: rating
          }
        })
      } catch (notificationError) {
        console.error('Error creating review notification:', notificationError)
        // Don't fail the review creation if notification fails
      }

      res.status(201).json({
        status: 'success',
        data: review,
        message: 'Review created successfully'
      })
    } catch (error) {
      console.error('Error creating review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create review'
      })
    }
  },

  // Update a review (only by the reviewer)
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params
      const { rating, comment, images } = req.body
      const userId = req.user.id

      const review = await Review.findOne({ 
        _id: reviewId, 
        buyer: userId 
      })

      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found or you are not authorized to update it'
        })
      }

      // Update fields
      if (rating !== undefined) review.rating = rating
      if (comment !== undefined) review.comment = comment
      if (images !== undefined) review.images = images

      await review.save()

      // Update listing stats
      await updateListingStats(review.listing)

      res.json({
        status: 'success',
        data: review,
        message: 'Review updated successfully'
      })
    } catch (error) {
      console.error('Error updating review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update review'
      })
    }
  },

  // Delete a review (only by the reviewer)
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params
      const userId = req.user.id

      const review = await Review.findOne({ 
        _id: reviewId, 
        buyer: userId 
      })

      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found or you are not authorized to delete it'
        })
      }

      await Review.findByIdAndDelete(reviewId)

      // Update listing stats
      await updateListingStats(review.listing)

      res.json({
        status: 'success',
        message: 'Review deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete review'
      })
    }
  },

  // Farmer response to review
  async respondToReview(req, res) {
    try {
      const { reviewId } = req.params
      const { comment } = req.body
      const farmerId = req.user.id

      const review = await Review.findOne({ 
        _id: reviewId, 
        farmer: farmerId 
      })

      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found or you are not authorized to respond'
        })
      }

      review.response = {
        comment,
        respondedAt: new Date()
      }

      await review.save()

      res.json({
        status: 'success',
        data: review,
        message: 'Response added successfully'
      })
    } catch (error) {
      console.error('Error responding to review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to add response'
      })
    }
  },

  // Get reviews for farmer's listings
  async getFarmerReviews(req, res) {
    try {
      const farmerId = req.user.id
      const { page = 1, limit = 10, status = 'all' } = req.query

      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // Build query
      const query = { farmer: farmerId }
      if (status !== 'all') {
        query.status = status
      }

      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('listing', 'cropName category basePrice unit')
          .populate('buyer', 'name profile.avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Review.countDocuments(query)
      ])

      // Calculate stats
      const stats = await Review.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            pendingReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            }
          }
        }
      ])

      const reviewStats = stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        approvedReviews: 0
      }

      res.json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          stats: reviewStats
        }
      })
    } catch (error) {
      console.error('Error getting farmer reviews:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get farmer reviews'
      })
    }
  },

  // Update a review (only by the reviewer)
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params
      const { rating, comment, images } = req.body
      const userId = req.user.id

      const review = await Review.findById(reviewId)
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        })
      }

      // Check if user is the reviewer
      if (review.buyer.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own reviews'
        })
      }

      // Update review
      const updateData = {}
      if (rating !== undefined) updateData.rating = rating
      if (comment !== undefined) updateData.comment = comment
      if (images !== undefined) updateData.images = images

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true }
      ).populate('buyer', 'name profile.avatar')

      // Update listing stats
      await updateListingStats(review.listing)

      res.json({
        status: 'success',
        data: updatedReview
      })
    } catch (error) {
      console.error('Error updating review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update review'
      })
    }
  },

  // Delete a review (only by the reviewer)
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params
      const userId = req.user.id

      const review = await Review.findById(reviewId)
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        })
      }

      // Check if user is the reviewer
      if (review.buyer.toString() !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only delete your own reviews'
        })
      }

      await Review.findByIdAndDelete(reviewId)

      // Update listing stats
      await updateListingStats(review.listing)

      res.json({
        status: 'success',
        message: 'Review deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting review:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete review'
      })
    }
  }
}

// Helper function to update listing stats
async function updateListingStats(listingId) {
  try {
    const stats = await Review.aggregate([
      { $match: { listing: listingId, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])

    const listingStats = stats[0] || { averageRating: 0, totalReviews: 0 }

    await Listing.findByIdAndUpdate(listingId, {
      rating: Math.round(listingStats.averageRating * 10) / 10,
      reviewCount: listingStats.totalReviews
    })
  } catch (error) {
    console.error('Error updating listing stats:', error)
  }
}

module.exports = reviewController
