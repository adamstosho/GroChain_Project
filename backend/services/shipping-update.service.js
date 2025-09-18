const mongoose = require('mongoose');
const Order = require('../models/order.model');
const User = require('../models/user.model');

// Register models
mongoose.model('User', User.schema);
mongoose.model('Order', Order.schema);

// Shipping calculation function (same as marketplace controller)
const NIGERIAN_STATES = {
  'Abia': { lat: 5.5320, lng: 7.4860 },
  'Adamawa': { lat: 9.3265, lng: 12.3988 },
  'Akwa Ibom': { lat: 4.9057, lng: 7.8537 },
  'Anambra': { lat: 6.2209, lng: 7.0722 },
  'Bauchi': { lat: 10.3103, lng: 9.8439 },
  'Bayelsa': { lat: 4.7719, lng: 6.1036 },
  'Benue': { lat: 7.3369, lng: 8.7404 },
  'Borno': { lat: 11.8333, lng: 13.1500 },
  'Cross River': { lat: 5.8702, lng: 8.5988 },
  'Delta': { lat: 5.5320, lng: 5.8980 },
  'Ebonyi': { lat: 6.2649, lng: 8.0137 },
  'Edo': { lat: 6.3350, lng: 5.6037 },
  'Ekiti': { lat: 7.6000, lng: 5.2000 },
  'Enugu': { lat: 6.4413, lng: 7.4988 },
  'FCT': { lat: 9.0765, lng: 7.3986 },
  'Gombe': { lat: 10.2897, lng: 11.1710 },
  'Imo': { lat: 5.4980, lng: 7.0266 },
  'Jigawa': { lat: 12.2280, lng: 9.5616 },
  'Kaduna': { lat: 10.5200, lng: 7.4383 },
  'Kano': { lat: 12.0022, lng: 8.5920 },
  'Katsina': { lat: 12.9855, lng: 7.6171 },
  'Kebbi': { lat: 12.4500, lng: 4.1994 },
  'Kogi': { lat: 7.8000, lng: 6.7333 },
  'Kwara': { lat: 8.5000, lng: 4.5500 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Nasarawa': { lat: 8.5000, lng: 8.2000 },
  'Niger': { lat: 9.6000, lng: 6.5500 },
  'Ogun': { lat: 6.8167, lng: 3.3500 },
  'Ondo': { lat: 7.2500, lng: 5.2000 },
  'Osun': { lat: 7.7667, lng: 4.5667 },
  'Oyo': { lat: 7.3775, lng: 3.9470 },
  'Plateau': { lat: 9.9167, lng: 8.9000 },
  'Rivers': { lat: 4.8156, lng: 7.0498 },
  'Sokoto': { lat: 13.0667, lng: 5.2333 },
  'Taraba': { lat: 8.8833, lng: 11.3667 },
  'Yobe': { lat: 12.0000, lng: 11.5000 },
  'Zamfara': { lat: 12.1333, lng: 6.6667 }
};

const SHIPPING_METHODS = {
  'road_standard': { baseRate: 5, weightMultiplier: 10, timeMultiplier: 1, minCost: 200, maxCost: 2000 },
  'road_express': { baseRate: 8, weightMultiplier: 15, timeMultiplier: 1.2, minCost: 300, maxCost: 3000 },
  'air': { baseRate: 15, weightMultiplier: 30, timeMultiplier: 1.5, minCost: 500, maxCost: 5000 },
  'courier': { baseRate: 10, weightMultiplier: 20, timeMultiplier: 1.3, minCost: 400, maxCost: 4000 }
};

function calculateDistance(location1, location2) {
  const state1 = NIGERIAN_STATES[location1.state];
  const state2 = NIGERIAN_STATES[location2.state];
  
  if (state1 && state2) {
    const R = 6371;
    const dLat = (state2.lat - state1.lat) * Math.PI / 180;
    const dLng = (state2.lng - state1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(state1.lat * Math.PI / 180) * Math.cos(state2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  if (location1.state === location2.state) {
    return 50;
  }
  
  return 200;
}

function calculateShippingCost(origin, destination, weight, methodId) {
  const method = SHIPPING_METHODS[methodId] || SHIPPING_METHODS['road_standard'];
  const distance = calculateDistance(origin, destination);
  
  const baseCost = distance * method.baseRate;
  const weightCost = weight * method.weightMultiplier;
  let totalCost = baseCost + weightCost;
  
  totalCost *= method.timeMultiplier;
  totalCost = Math.max(method.minCost, Math.min(method.maxCost, totalCost));
  
  return Math.round(totalCost);
}

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
          // Calculate shipping cost
          const sellerLocation = {
            city: 'Lagos', // Default seller location
            state: 'Lagos',
            country: 'Nigeria'
          };

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

