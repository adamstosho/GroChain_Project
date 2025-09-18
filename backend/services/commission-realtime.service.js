/**
 * Real-time Commission Service
 * 
 * This service handles real-time commission updates and notifications
 * when payments are processed and commissions are created.
 */

const Commission = require('../models/commission.model');
const Partner = require('../models/partner.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Listing = require('../models/listing.model');
const Notification = require('../models/notification.model');
const websocketService = require('./websocket.service');

class RealTimeCommissionService {
  constructor() {
    this.commissionUpdateQueue = new Map(); // partnerId -> pending updates
  }

  /**
   * Process commissions for an order and emit real-time updates
   */
  async processOrderCommissions(order) {
    console.log('🔄 Processing real-time commissions for order:', order._id);
    
    try {
      let processedItems = 0;
      let totalCommission = 0;
      
      // Get the order with populated data
      const populatedOrder = await Order.findById(order._id)
        .populate('items.listing')
        .populate('buyer', 'name email');
      
      if (!populatedOrder) {
        console.error('❌ Order not found:', order._id);
        return { success: false, error: 'Order not found' };
      }

      // Process each item in the order
      for (const item of populatedOrder.items) {
        if (!item.listing) continue;
        
        const listing = item.listing;
        const itemAmount = item.price * item.quantity;
        const partnerCommission = itemAmount * 0.05; // 5% commission
        
        if (partnerCommission > 0) {
          // Get the farmer and their partner
          const farmer = await User.findById(listing.farmer).populate('partner');
          if (!farmer || !farmer.partner) continue;
          
          const partner = farmer.partner;
          
          // Check if commission already exists to prevent duplicates
          const existingCommission = await Commission.findOne({
            partner: partner._id,
            farmer: farmer._id,
            order: order._id,
            listing: listing._id
          });

          if (existingCommission) {
            console.log('ℹ️ Commission already exists for this order item:', existingCommission._id);
            continue; // Skip this item
          }
          
          // Create commission record
          const commission = new Commission({
            partner: partner._id,
            farmer: farmer._id,
            order: order._id,
            listing: listing._id,
            amount: partnerCommission,
            rate: 0.05,
            orderAmount: itemAmount,
            orderDate: order.createdAt,
            status: 'pending',
            metadata: {
              commissionType: 'direct',
              platformFee: itemAmount * 0.03,
              platformFeeRate: 0.03,
              orderNumber: order.orderNumber,
              buyerName: populatedOrder.buyer.name,
              productName: listing.cropName
            }
          });
          
          await commission.save();
          console.log('✅ Commission record created:', commission._id);
          
          // Update partner's total commissions
          await Partner.findByIdAndUpdate(
            partner._id,
            { $inc: { totalCommissions: partnerCommission } }
          );
          
          // Emit real-time update to partner
          await this.emitCommissionUpdate(partner._id, {
            type: 'commission_earned',
            amount: partnerCommission,
            orderId: order._id,
            farmerName: farmer.name,
            productName: listing.cropName,
            buyerName: populatedOrder.buyer.name,
            timestamp: new Date()
          });
          
          // Create notification for partner
          await this.createCommissionNotification(partner._id, {
            amount: partnerCommission,
            farmerName: farmer.name,
            productName: listing.cropName,
            orderId: order._id
          });
          
          processedItems++;
          totalCommission += partnerCommission;
          
          console.log(`✅ Commission processed: ₦${partnerCommission} for partner ${partner.email}`);
        }
      }
      
      return {
        success: true,
        processedItems,
        totalCommission,
        orderId: order._id
      };
      
    } catch (error) {
      console.error('❌ Error processing real-time commissions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Emit real-time commission update to partner
   */
  async emitCommissionUpdate(partnerId, commissionData) {
    try {
      console.log('📡 Emitting commission update for partner:', partnerId);
      
      // Get partner user to send update
      const partner = await Partner.findById(partnerId);
      if (!partner) return;
      
      const partnerUser = await User.findOne({ email: partner.email });
      if (!partnerUser) return;
      
      // Get updated commission totals
      const commissionTotals = await this.getPartnerCommissionTotals(partnerId);
      
      const updateData = {
        ...commissionData,
        totals: commissionTotals,
        partnerId: partnerId
      };
      
      // Emit to specific user
      if (websocketService && websocketService.emitToUser) {
        websocketService.emitToUser(partnerUser._id, 'commission_update', updateData);
      }
      
      // Also emit to partner role room (using existing method)
      if (websocketService && websocketService.sendNotificationToRole) {
        websocketService.sendNotificationToRole('partner', {
          type: 'commission_update',
          data: updateData
        });
      }
      
      console.log('✅ Commission update emitted successfully');
      
    } catch (error) {
      console.error('❌ Error emitting commission update:', error);
    }
  }

  /**
   * Get current commission totals for a partner
   */
  async getPartnerCommissionTotals(partnerId) {
    try {
      const partner = await Partner.findById(partnerId);
      if (!partner) return null;
      
      // Get commission breakdown
      const [pendingResult, paidResult, thisMonthResult] = await Promise.all([
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { 
            $match: { 
              partner: partnerId,
              orderDate: { 
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
              }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);
      
      return {
        total: partner.totalCommissions || 0,
        pending: pendingResult[0]?.total || 0,
        paid: paidResult[0]?.total || 0,
        thisMonth: thisMonthResult[0]?.total || 0
      };
      
    } catch (error) {
      console.error('❌ Error getting commission totals:', error);
      return {
        total: 0,
        pending: 0,
        paid: 0,
        thisMonth: 0
      };
    }
  }

  /**
   * Create notification for commission earned
   */
  async createCommissionNotification(partnerId, data) {
    try {
      const partner = await Partner.findById(partnerId);
      if (!partner) return;
      
      const partnerUser = await User.findOne({ email: partner.email });
      if (!partnerUser) return;
      
      const notification = new Notification({
        user: partnerUser._id,
        type: 'success',
        category: 'financial',
        title: 'New Commission Earned!',
        message: `You earned ₦${data.amount.toLocaleString()} commission from ${data.farmerName}'s sale of ${data.productName}`,
        data: {
          amount: data.amount,
          farmerName: data.farmerName,
          productName: data.productName,
          orderId: data.orderId,
          actionUrl: `/partners/commissions`
        },
        read: false
      });
      
      await notification.save();
      
      // Emit notification update
      if (websocketService && websocketService.emitToUser) {
        websocketService.emitToUser(partnerUser._id, 'notification', {
          type: 'commission_earned',
          notification: notification
        });
      }
      
      console.log('✅ Commission notification created:', notification._id);
      
    } catch (error) {
      console.error('❌ Error creating commission notification:', error);
    }
  }

  /**
   * Verify partner commissions (legacy method for compatibility)
   */
  async verifyPartnerCommissions(partnerId) {
    console.log('🔍 Verifying partner commissions for:', partnerId);
    
    try {
      const partner = await Partner.findById(partnerId);
      if (!partner) return;
      
      // Recalculate total commissions from actual commission records
      const totalCommissions = await Commission.aggregate([
        { $match: { partner: partnerId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const calculatedTotal = totalCommissions[0]?.total || 0;
      
      if (partner.totalCommissions !== calculatedTotal) {
        console.log(`🔄 Updating partner totalCommissions from ${partner.totalCommissions} to ${calculatedTotal}`);
        partner.totalCommissions = calculatedTotal;
        await partner.save();
        
        // Emit update
        await this.emitCommissionUpdate(partnerId, {
          type: 'commission_verified',
          previousTotal: partner.totalCommissions,
          newTotal: calculatedTotal,
          timestamp: new Date()
        });
      }
      
      return calculatedTotal;
      
    } catch (error) {
      console.error('❌ Error verifying partner commissions:', error);
      return 0;
    }
  }

  /**
   * Get commission update queue for a partner
   */
  getCommissionQueue(partnerId) {
    return this.commissionUpdateQueue.get(partnerId) || [];
  }

  /**
   * Clear commission update queue for a partner
   */
  clearCommissionQueue(partnerId) {
    this.commissionUpdateQueue.delete(partnerId);
  }
}

module.exports = new RealTimeCommissionService();
