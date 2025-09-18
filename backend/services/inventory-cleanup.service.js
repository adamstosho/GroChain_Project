const cron = require('node-cron')
const Listing = require('../models/listing.model')
const mongoose = require('mongoose')

class InventoryCleanupService {
  constructor() {
    this.isRunning = false
    this.cleanupInterval = null
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      console.log('🔄 Inventory cleanup service is already running')
      return
    }

    console.log('🚀 Starting inventory cleanup service...')
    this.isRunning = true

    // Run cleanup every 5 minutes
    this.cleanupInterval = cron.schedule('*/5 * * * *', async () => {
      await this.cleanupSoldOutProducts()
    }, {
      scheduled: true,
      timezone: "Africa/Lagos"
    })

    console.log('✅ Inventory cleanup service started - running every 5 minutes')
  }

  // Stop the cleanup service
  stop() {
    if (this.cleanupInterval) {
      this.cleanupInterval.stop()
      this.cleanupInterval = null
    }
    this.isRunning = false
    console.log('🛑 Inventory cleanup service stopped')
  }

  // Clean up sold-out products that have been sold out for more than 30 minutes
  async cleanupSoldOutProducts() {
    try {
      console.log('🧹 Starting inventory cleanup...')
      
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      
      // Find sold-out products that have been sold out for more than 30 minutes
      const soldOutProducts = await Listing.find({
        status: 'sold_out',
        soldOutAt: { $lte: thirtyMinutesAgo },
        availableQuantity: 0
      })

      if (soldOutProducts.length === 0) {
        console.log('✅ No sold-out products to clean up')
        return
      }

      console.log(`📦 Found ${soldOutProducts.length} sold-out products to clean up`)

      // Archive the products instead of deleting them
      const archivePromises = soldOutProducts.map(async (product) => {
        try {
          // Update status to expired and add archive timestamp
          await Listing.findByIdAndUpdate(product._id, {
            status: 'expired',
            archivedAt: new Date(),
            updatedAt: new Date()
          })

          console.log(`📦 Archived sold-out product: ${product.cropName} (${product._id})`)
          return product._id
        } catch (error) {
          console.error(`❌ Failed to archive product ${product._id}:`, error.message)
          return null
        }
      })

      const archivedIds = await Promise.all(archivePromises)
      const successfulArchives = archivedIds.filter(id => id !== null)

      console.log(`✅ Successfully archived ${successfulArchives.length} sold-out products`)
      
      // Log summary
      if (successfulArchives.length > 0) {
        console.log('📊 Cleanup Summary:', {
          totalFound: soldOutProducts.length,
          successfullyArchived: successfulArchives.length,
          failed: soldOutProducts.length - successfulArchives.length,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('❌ Inventory cleanup failed:', error)
    }
  }

  // Manual cleanup method for admin use
  async manualCleanup() {
    console.log('🔧 Manual inventory cleanup triggered')
    await this.cleanupSoldOutProducts()
  }

  // Get cleanup statistics
  async getCleanupStats() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      
      const stats = await Promise.all([
        Listing.countDocuments({ status: 'sold_out', availableQuantity: 0 }),
        Listing.countDocuments({ 
          status: 'sold_out', 
          availableQuantity: 0,
          soldOutAt: { $lte: thirtyMinutesAgo }
        }),
        Listing.countDocuments({ status: 'expired' }),
        Listing.countDocuments({ status: 'active', availableQuantity: { $gt: 0 } })
      ])

      return {
        soldOutProducts: stats[0],
        readyForCleanup: stats[1],
        archivedProducts: stats[2],
        activeProducts: stats[3],
        serviceStatus: this.isRunning ? 'running' : 'stopped',
        lastCleanup: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Failed to get cleanup stats:', error)
      return null
    }
  }
}

// Create singleton instance
const inventoryCleanupService = new InventoryCleanupService()

module.exports = inventoryCleanupService
