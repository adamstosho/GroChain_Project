const Listing = require('../models/listing.model')
const mongoose = require('mongoose')

class InventoryService {
  constructor() {
    this.cleanupInterval = null
  }

  // Mark products as sold out when quantity reaches zero
  async markAsSoldOut(listingId) {
    try {
      const listing = await Listing.findById(listingId)
      if (!listing) {
        throw new Error('Listing not found')
      }

      if (listing.availableQuantity <= 0) {
        const updatedListing = await Listing.findByIdAndUpdate(
          listingId,
          {
            status: 'sold_out',
            soldOutAt: new Date()
          },
          { new: true }
        )

        console.log('✅ Product marked as sold out:', {
          listingId: listing._id,
          cropName: listing.cropName,
          availableQuantity: listing.availableQuantity
        })

        return updatedListing
      }

      return listing
    } catch (error) {
      console.error('❌ Error marking product as sold out:', error)
      throw error
    }
  }

  // Clean up sold-out products after specified time
  async cleanupSoldOutProducts(olderThanMinutes = 30) {
    try {
      const cutoffTime = new Date(Date.now() - (olderThanMinutes * 60 * 1000))
      
      console.log('🧹 Starting cleanup of sold-out products older than', olderThanMinutes, 'minutes')
      
      const soldOutProducts = await Listing.find({
        status: 'sold_out',
        soldOutAt: { $lte: cutoffTime }
      })

      console.log('📦 Found', soldOutProducts.length, 'sold-out products to clean up')

      if (soldOutProducts.length === 0) {
        console.log('✅ No sold-out products to clean up')
        return { cleaned: 0, remaining: 0 }
      }

      // Option 1: Hide products (set status to inactive)
      const hideResult = await Listing.updateMany(
        {
          status: 'sold_out',
          soldOutAt: { $lte: cutoffTime }
        },
        {
          status: 'inactive',
          cleanedAt: new Date()
        }
      )

      console.log('✅ Cleaned up sold-out products:', {
        hidden: hideResult.modifiedCount,
        total: soldOutProducts.length
      })

      return {
        cleaned: hideResult.modifiedCount,
        remaining: soldOutProducts.length - hideResult.modifiedCount
      }
    } catch (error) {
      console.error('❌ Error cleaning up sold-out products:', error)
      throw error
    }
  }

  // Start automatic cleanup service
  startCleanupService(intervalMinutes = 30) {
    if (this.cleanupInterval) {
      console.log('⚠️ Cleanup service already running')
      return
    }

    console.log('🚀 Starting inventory cleanup service (every', intervalMinutes, 'minutes)')
    
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupSoldOutProducts(intervalMinutes)
      } catch (error) {
        console.error('❌ Cleanup service error:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  // Stop automatic cleanup service
  stopCleanupService() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('🛑 Inventory cleanup service stopped')
    }
  }

  // Get inventory statistics
  async getInventoryStats() {
    try {
      const stats = await Listing.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalAvailableQuantity: { $sum: '$availableQuantity' }
          }
        }
      ])

      const totalListings = await Listing.countDocuments()
      const activeListings = await Listing.countDocuments({ status: 'active' })
      const soldOutListings = await Listing.countDocuments({ status: 'sold_out' })
      const inactiveListings = await Listing.countDocuments({ status: 'inactive' })

      return {
        total: totalListings,
        active: activeListings,
        soldOut: soldOutListings,
        inactive: inactiveListings,
        byStatus: stats
      }
    } catch (error) {
      console.error('❌ Error getting inventory stats:', error)
      throw error
    }
  }

  // Restore sold-out product (for testing or manual intervention)
  async restoreSoldOutProduct(listingId, newQuantity = 0) {
    try {
      const listing = await Listing.findById(listingId)
      if (!listing) {
        throw new Error('Listing not found')
      }

      if (listing.status !== 'sold_out') {
        throw new Error('Product is not sold out')
      }

      const updatedListing = await Listing.findByIdAndUpdate(
        listingId,
        {
          status: 'active',
          availableQuantity: newQuantity,
          quantity: newQuantity,
          soldOutAt: null,
          restoredAt: new Date()
        },
        { new: true }
      )

      console.log('✅ Sold-out product restored:', {
        listingId: listing._id,
        cropName: listing.cropName,
        newQuantity: newQuantity
      })

      return updatedListing
    } catch (error) {
      console.error('❌ Error restoring sold-out product:', error)
      throw error
    }
  }
}

module.exports = new InventoryService()

