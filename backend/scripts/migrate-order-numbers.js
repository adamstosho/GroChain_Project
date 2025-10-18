const mongoose = require('mongoose')
const Order = require('../models/order.model')

// Migration script to add orderNumber to existing orders
async function migrateOrderNumbers() {
  try {
    console.log('🔄 Starting order number migration...')
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grochain')
    console.log('✅ Connected to MongoDB')
    
    // Find all orders without orderNumber
    const ordersWithoutNumber = await Order.find({ 
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' }
      ]
    })
    
    console.log(`📊 Found ${ordersWithoutNumber.length} orders without orderNumber`)
    
    if (ordersWithoutNumber.length === 0) {
      console.log('✅ All orders already have orderNumber')
      return
    }
    
    // Update each order with a unique orderNumber
    let updatedCount = 0
    for (const order of ordersWithoutNumber) {
      try {
        const orderNumber = `ORD-${order._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`
        
        await Order.findByIdAndUpdate(order._id, {
          orderNumber: orderNumber
        })
        
        updatedCount++
        console.log(`✅ Updated order ${order._id} with orderNumber: ${orderNumber}`)
      } catch (error) {
        console.error(`❌ Error updating order ${order._id}:`, error.message)
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} orders`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateOrderNumbers()
}

module.exports = migrateOrderNumbers


