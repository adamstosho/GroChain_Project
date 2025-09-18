const inventoryService = require('../services/inventory.service')

const inventoryController = {
  // Get inventory statistics
  async getInventoryStats(req, res) {
    try {
      const stats = await inventoryService.getInventoryStats()
      
      res.json({
        status: 'success',
        data: stats
      })
    } catch (error) {
      console.error('❌ Error getting inventory stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get inventory statistics'
      })
    }
  },

  // Manually trigger cleanup of sold-out products
  async cleanupSoldOutProducts(req, res) {
    try {
      const { olderThanMinutes = 30 } = req.body
      
      const result = await inventoryService.cleanupSoldOutProducts(olderThanMinutes)
      
      res.json({
        status: 'success',
        data: {
          message: `Cleaned up ${result.cleaned} sold-out products`,
          cleaned: result.cleaned,
          remaining: result.remaining
        }
      })
    } catch (error) {
      console.error('❌ Error cleaning up sold-out products:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to clean up sold-out products'
      })
    }
  },

  // Restore a sold-out product
  async restoreSoldOutProduct(req, res) {
    try {
      const { listingId } = req.params
      const { newQuantity = 0 } = req.body
      
      const restoredProduct = await inventoryService.restoreSoldOutProduct(listingId, newQuantity)
      
      res.json({
        status: 'success',
        data: {
          message: 'Product restored successfully',
          product: restoredProduct
        }
      })
    } catch (error) {
      console.error('❌ Error restoring sold-out product:', error)
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to restore sold-out product'
      })
    }
  },

  // Mark a product as sold out
  async markAsSoldOut(req, res) {
    try {
      const { listingId } = req.params
      
      const soldOutProduct = await inventoryService.markAsSoldOut(listingId)
      
      res.json({
        status: 'success',
        data: {
          message: 'Product marked as sold out',
          product: soldOutProduct
        }
      })
    } catch (error) {
      console.error('❌ Error marking product as sold out:', error)
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to mark product as sold out'
      })
    }
  }
}

module.exports = inventoryController

