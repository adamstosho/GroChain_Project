const mongoose = require('mongoose');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const { calculateShippingCost, resolveSellerLocation } = require('../utils/shipping-calculator.util');

// Register models
mongoose.model('User', User.schema);
mongoose.model('Order', Order.schema);

class ShippingUpdateService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  async updateOrdersShipping() {
    if (this.isRunning) {
      console.log('🚚 Shipping update already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🚚 Starting shipping cost update service...');

      // Find orders that need shipping calculation
      const ordersToUpdate = await Order.find({
        $or: [
          { shipping: 0, shippingMethod: { $exists: true, $ne: null } },
          { shipping: { $exists: false }, shippingMethod: { $exists: true, $ne: null } },
          { shipping: null, shippingMethod: { $exists: true, $ne: null } }
        ],
        shippingAddress: { $exists: true }
      }).populate('buyer seller');

      if (ordersToUpdate.length === 0) {
        console.log('✅ No orders need shipping updates');
        return;
      }

      console.log(`📦 Found ${ordersToUpdate.length} orders to update`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const order of ordersToUpdate) {
        try {
          // Calculate shipping cost using the order's actual seller location
          // rather than assuming a single city.
          const sellerLocation = resolveSellerLocation(order.seller, null);

          const buyerLocation = {
            city: order.shippingAddress.city || 'Unknown',
            state: order.shippingAddress.state || 'Unknown',
            country: order.shippingAddress.country || 'Nigeria'
          };

          // Calculate total weight from items
          const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);

          const shippingCost = calculateShippingCost(
            sellerLocation,
            buyerLocation,
            totalWeight,
            order.shippingMethod
          );

          // Update order
          const newTotal = order.subtotal + shippingCost;
          
          await Order.findByIdAndUpdate(order._id, {
            shipping: shippingCost,
            total: newTotal
          });

          console.log(`✅ Updated order ${order._id}: ₦0 → ₦${shippingCost} (Total: ₦${order.total} → ₦${newTotal})`);
          updatedCount++;

        } catch (error) {
          console.error(`❌ Error updating order ${order._id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`🎉 Shipping update completed! Updated: ${updatedCount}, Errors: ${errorCount}`);

    } catch (error) {
      console.error('❌ Shipping update service error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(intervalMinutes = 30) {
    if (this.intervalId) {
      console.log('🚚 Shipping update service already running');
      return;
    }

    console.log(`🚚 Starting shipping update service (every ${intervalMinutes} minutes)`);
    
    // Run immediately
    this.updateOrdersShipping();
    
    // Then run every intervalMinutes
    this.intervalId = setInterval(() => {
      this.updateOrdersShipping();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Shipping update service stopped');
    }
  }

  async runOnce() {
    await this.updateOrdersShipping();
  }
}

module.exports = new ShippingUpdateService();

