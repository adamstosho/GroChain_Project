const mongoose = require('mongoose')
const Shipment = require('../models/shipment.model')
const Order = require('../models/order.model')
const User = require('../models/user.model')
const Notification = require('../models/notification.model')
const webSocketService = require('../services/websocket.service')
const {
  userCanJoinOrderRoom,
  userCanJoinShipmentRoom,
  partnerMayManageShipmentAssignment,
  buildShipmentAccessFilter,
  mergeShipmentQueries,
  toAclUser
} = require('../utils/realtime-room-access.util')
const { getCoordinatesForState } = require('../utils/nigerian-states.util')

const aclUserFromReq = (req) => toAclUser(req.user)

const normalizeUserId = (user) => {
  if (!user) return undefined
  if (typeof user === 'string') return user
  if (user._id) return user._id.toString()
  if (typeof user.toString === 'function') return user.toString()
  return undefined
}

const emitShipmentUpdate = (shipment, status, buyer, seller, extra = {}) => {
  if (!webSocketService || typeof webSocketService.sendShipmentUpdate !== 'function') {
    return
  }

  try {
    const shipmentId = typeof shipment === 'string' ? shipment : shipment?._id?.toString()
    const orderId = typeof shipment === 'object' ? shipment?.order?.toString?.() : undefined

    webSocketService.sendShipmentUpdate(
      shipmentId,
      status,
      normalizeUserId(buyer),
      normalizeUserId(seller),
      {
        ...(orderId ? { orderId } : {}),
        ...extra
      }
    )
  } catch (socketError) {
    console.warn('⚠️ Failed to emit shipment update:', socketError?.message || socketError)
  }
}

const shipmentController = {
  // Create new shipment
  async createShipment(req, res) {
    try {
      console.log('🚚 Creating shipment with data:', JSON.stringify(req.body, null, 2))
      console.log('🚚 Request headers:', req.headers)
      console.log('🚚 Request method:', req.method)
      console.log('🚚 Request URL:', req.url)
      console.log('🚚 User info:', req.user)
      
      const {
        orderId,
        shippingMethod,
        carrier,
        estimatedDelivery,
        shippingCost,
        insuranceCost,
        packaging,
        specialInstructions,
        temperatureControl,
        temperatureRange,
        fragile
      } = req.body

      // Validate required fields
      if (!orderId || !shippingMethod || !carrier || !estimatedDelivery || !shippingCost) {
        console.log('❌ Missing required fields:', { orderId, shippingMethod, carrier, estimatedDelivery, shippingCost })
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        })
      }

      // Get order details
      console.log('🔍 Looking for order with ID:', orderId)
      const order = await Order.findById(orderId)
        .populate('buyer seller items.listing')
      
      console.log('🔍 Found order:', order ? 'Yes' : 'No')
      if (order) {
        console.log('📦 Order details:', {
          id: order._id,
          buyer: order.buyer ? { id: order.buyer._id, name: order.buyer.name, profile: order.buyer.profile } : 'Not populated',
          seller: order.seller ? { id: order.seller._id, name: order.seller.name, profile: order.seller.profile } : 'Not populated',
          items: order.items?.length || 0,
          status: order.status
        })
      } else {
        console.log('❌ Order not found in database')
      }
      
      if (!order) {
        console.log('❌ Order not found for ID:', orderId)
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        })
      }

      const uid = req.user.id.toString()
      const isSeller = order.seller._id.toString() === uid
      const canCreateShipment =
        req.user.role === 'admin' ||
        isSeller ||
        (req.user.role === 'partner' &&
          (await userCanJoinOrderRoom(aclUserFromReq(req), orderId)))

      if (!canCreateShipment) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }

      // Check if shipment already exists for this order
      const existingShipment = await Shipment.findOne({ order: orderId })
      if (existingShipment) {
        return res.status(409).json({
          status: 'error',
          message: 'Shipment already exists for this order'
        })
      }

      // Prepare shipment items
      const items = order.items.map(item => ({
        listing: item.listing._id,
        quantity: item.quantity,
        unit: item.listing.unit || 'kg',
        price: item.price
      }))

      // Create shipment
      console.log('🚚 Creating shipment...')
      
      const shipmentData = {
        order: orderId,
        buyer: order.buyer._id,
        seller: order.seller._id,
        items,
        origin: (() => {
          const state = order.seller.profile?.state || order.seller.location || 'Unknown'
          const fallbackCoords = getCoordinatesForState(state)
          return {
            address: order.seller.profile?.address || order.seller.location || 'Farm Location',
            city: order.seller.profile?.city || order.seller.location || 'Unknown',
            state,
            country: order.seller.profile?.country || 'Nigeria',
            coordinates: {
              lat: order.seller.profile?.coordinates?.lat ?? fallbackCoords.lat,
              lng: order.seller.profile?.coordinates?.lng ?? fallbackCoords.lng
            },
            contactPerson: order.seller.name || 'Unknown',
            phone: order.seller.phone || 'N/A'
          }
        })(),
        destination: (() => {
          const state = order.buyer.profile?.state || order.buyer.location || 'Unknown'
          const fallbackCoords = getCoordinatesForState(state)
          return {
            address: order.buyer.profile?.address || order.buyer.location || 'Delivery Address',
            city: order.buyer.profile?.city || order.buyer.location || 'Unknown',
            state,
            country: order.buyer.profile?.country || 'Nigeria',
            coordinates: {
              lat: order.buyer.profile?.coordinates?.lat ?? fallbackCoords.lat,
              lng: order.buyer.profile?.coordinates?.lng ?? fallbackCoords.lng
            },
            contactPerson: order.buyer.name || 'Unknown',
            phone: order.buyer.phone || 'N/A'
          }
        })(),
        shippingMethod,
        carrier: carrier || 'GIG Logistics',
        estimatedDelivery: new Date(estimatedDelivery),
        shippingCost: Number(shippingCost),
        insuranceCost: Number(insuranceCost) || 0,
        totalCost: Number(shippingCost) + Number(insuranceCost || 0),
        packaging: {
          type: packaging?.type || 'standard',
          materials: packaging?.materials || ['cardboard', 'plastic'],
          weight: packaging?.weight || 1, // Default to 1kg
          dimensions: {
            length: packaging?.dimensions?.length || 10, // Default dimensions
            width: packaging?.dimensions?.width || 10,
            height: packaging?.dimensions?.height || 10
          }
        },
        specialInstructions,
        temperatureControl: temperatureControl || false,
        temperatureRange: temperatureRange || null,
        fragile: fragile || false
      }
      
      console.log('🚚 Shipment data to create:', JSON.stringify(shipmentData, null, 2))
      console.log('🚚 User creating shipment:', {
        userId: req.user.id,
        userRole: req.user.role,
        orderSeller: order.seller._id.toString(),
        orderBuyer: order.buyer._id.toString()
      })
      
      const shipment = await Shipment.create(shipmentData)
      
      console.log('✅ Shipment created successfully:', shipment._id)

      // Add initial tracking event
      const shipmentWithEvent = await shipment.addTrackingEvent(
        'pending',
        'Shipment created',
        'Shipment has been created and is pending confirmation'
      )

      // Create notification for buyer
      const orderNumber = order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`
      await Notification.create({
        user: order.buyer._id,
        title: 'Shipment Created',
        message: `Your order #${orderNumber} has been shipped. Track your delivery with shipment #${shipmentWithEvent.shipmentNumber}`,
        type: 'info',
        category: 'shipment',
        data: { shipmentId: shipmentWithEvent._id, orderId: order._id }
      })

      emitShipmentUpdate(
        shipmentWithEvent,
        shipmentWithEvent.status,
        shipmentWithEvent.buyer,
        shipmentWithEvent.seller,
        {
          lastEvent: shipmentWithEvent.trackingEvents?.[0] || null
        }
      )

      res.status(201).json({
        status: 'success',
        message: 'Shipment created successfully',
        data: shipmentWithEvent
      })
    } catch (error) {
      console.error('❌ Error creating shipment:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      })
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        })
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid data format',
          field: error.path
        })
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to create shipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  },

  // Get shipment by ID
  async getShipmentById(req, res) {
    try {
      const { shipmentId } = req.params
      
      console.log('🔍 Getting shipment by ID:', shipmentId)
      console.log('🔍 Request user:', req.user)
      console.log('🔍 Request headers:', req.headers.authorization ? 'Token present' : 'No token')
      console.log('🔍 Request cookies:', req.cookies?.auth_token ? 'Cookie present' : 'No cookie')

      const shipment = await Shipment.findById(shipmentId)
        .populate('order buyer seller items.listing')
        .populate('issues.reportedBy', 'name')

      if (!shipment) {
        console.log('❌ Shipment not found:', shipmentId)
        return res.status(404).json({
          status: 'error',
          message: 'Shipment not found'
        })
      }
      
      console.log('✅ Shipment found:', {
        id: shipment._id,
        buyer: shipment.buyer,
        seller: shipment.seller,
        status: shipment.status
      })

      const allowed = await userCanJoinShipmentRoom(aclUserFromReq(req), shipmentId)
      if (!allowed) {
        console.log('❌ Access denied for shipment:', shipmentId)
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }

      res.json({
        status: 'success',
        data: shipment
      })
    } catch (error) {
      console.error('Error getting shipment:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get shipment'
      })
    }
  },

  // Get shipments with filters
  async getShipments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        shippingMethod,
        carrier,
        origin,
        destination,
        startDate,
        endDate,
        order,
        q,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const accessFilter = await buildShipmentAccessFilter(aclUserFromReq(req))
      const filterParts = [accessFilter]

      if (q) {
        filterParts.push({
          $or: [
            { shipmentNumber: { $regex: q, $options: 'i' } },
            { trackingNumber: { $regex: q, $options: 'i' } },
            { carrier: { $regex: q, $options: 'i' } },
            { 'origin.city': { $regex: q, $options: 'i' } },
            { 'destination.city': { $regex: q, $options: 'i' } }
          ]
        })
      }

      const extra = {}
      if (status) extra.status = status
      if (shippingMethod) extra.shippingMethod = shippingMethod
      if (carrier) extra.carrier = { $regex: carrier, $options: 'i' }
      if (origin) extra['origin.city'] = { $regex: origin, $options: 'i' }
      if (destination) extra['destination.city'] = { $regex: destination, $options: 'i' }
      if (order) extra.order = new mongoose.Types.ObjectId(order)
      if (startDate || endDate) {
        extra.createdAt = {}
        if (startDate) extra.createdAt.$gte = new Date(startDate)
        if (endDate) extra.createdAt.$lte = new Date(endDate)
      }
      if (Object.keys(extra).length > 0) filterParts.push(extra)

      const query = mergeShipmentQueries(...filterParts)

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [shipments, total] = await Promise.all([
        Shipment.find(query)
          .populate('order', 'orderNumber total')
          .populate('buyer', 'name email phone')
          .populate('seller', 'name email phone')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Shipment.countDocuments(query)
      ])

      res.json({
        status: 'success',
        data: {
          shipments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting shipments:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get shipments'
      })
    }
  },

  // Update shipment status
  async updateShipmentStatus(req, res) {
    try {
      const { shipmentId } = req.params
      const { status, location, description, coordinates } = req.body
      
      console.log('🔄 Updating shipment status:', {
        shipmentId,
        status,
        location,
        description,
        user: req.user
      })

      if (!status || !location || !description) {
        return res.status(400).json({
          status: 'error',
          message: 'Status, location, and description are required'
        })
      }

      const shipment = await Shipment.findById(shipmentId).populate('seller')
      if (!shipment) {
        return res.status(404).json({
          status: 'error',
          message: 'Shipment not found'
        })
      }

      const uid = req.user.id.toString()
      const isSeller = shipment.seller._id.toString() === uid
      const canUpdate =
        req.user.role === 'admin' ||
        isSeller ||
        (['partner', 'carrier'].includes(req.user.role) &&
          (await userCanJoinShipmentRoom(aclUserFromReq(req), shipmentId)))

      if (!canUpdate) {
        console.log('❌ Access denied for status update:', {
          userRole: req.user.role,
          userId: req.user.id,
          sellerId: shipment.seller._id.toString(),
          shipmentId: shipmentId
        })
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }

      // Add tracking event
      const updatedShipment = await shipment.addTrackingEvent(status, location, description, coordinates)

      // Create notification for buyer
      const order = await Order.findById(shipment.order)
      const orderNumber = order?.orderNumber || `ORD-${shipment.order?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}`
      await Notification.create({
        user: updatedShipment.buyer,
        title: 'Shipment Update',
        message: `Your order #${orderNumber} shipment #${updatedShipment.shipmentNumber} status: ${status} - ${description}`,
        type: 'info',
        category: 'shipment',
        data: { shipmentId: updatedShipment._id, status, location }
      })

      emitShipmentUpdate(
        updatedShipment,
        status,
        updatedShipment.buyer,
        updatedShipment.seller,
        {
          location,
          description,
          coordinates: coordinates || null,
          lastEvent: updatedShipment.trackingEvents?.[0] || null
        }
      )

      res.json({
        status: 'success',
        message: 'Shipment status updated successfully',
        data: updatedShipment
      })
    } catch (error) {
      console.error('Error updating shipment status:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update shipment status'
      })
    }
  },

  // Confirm delivery
  async confirmDelivery(req, res) {
    try {
      const { shipmentId } = req.params
      const { signature, photo, notes, deliveredBy } = req.body

      const shipment = await Shipment.findById(shipmentId)
      if (!shipment) {
        return res.status(404).json({
          status: 'error',
          message: 'Shipment not found'
        })
      }

      const uid = req.user.id.toString()
      const isSeller = shipment.seller.toString() === uid
      const canConfirm =
        req.user.role === 'admin' ||
        isSeller ||
        (['partner', 'carrier'].includes(req.user.role) &&
          (await userCanJoinShipmentRoom(aclUserFromReq(req), shipmentId)))

      if (!canConfirm) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }

      // Update delivery status
      const deliveredShipment = await shipment.updateDeliveryStatus('delivered', {
        signature,
        photo,
        notes,
        deliveredBy: deliveredBy || req.user.name,
        deliveryTime: new Date()
      })

      // Add tracking event
      const shipmentWithTracking = await deliveredShipment.addTrackingEvent(
        'delivered',
        deliveredShipment.destination.city,
        'Package delivered successfully',
        deliveredShipment.destination.coordinates
      )

      // Create notification for buyer and seller
      const notifications = [
        {
          user: shipmentWithTracking.buyer,
          title: 'Package Delivered',
          message: `Your shipment #${shipmentWithTracking.shipmentNumber} has been delivered successfully!`,
          type: 'success',
          category: 'shipment'
        },
        {
          user: shipmentWithTracking.seller,
          title: 'Delivery Confirmed',
          message: `Shipment #${shipmentWithTracking.shipmentNumber} has been delivered to the buyer.`,
          type: 'success',
          category: 'shipment'
        }
      ]

      await Notification.insertMany(notifications)

      emitShipmentUpdate(
        shipmentWithTracking,
        'delivered',
        shipmentWithTracking.buyer,
        shipmentWithTracking.seller,
        {
          lastEvent: shipmentWithTracking.trackingEvents?.[0] || null
        }
      )

      res.json({
        status: 'success',
        message: 'Delivery confirmed successfully',
        data: shipmentWithTracking
      })
    } catch (error) {
      console.error('Error confirming delivery:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to confirm delivery'
      })
    }
  },

  // Report shipment issue
  async reportIssue(req, res) {
    try {
      const { shipmentId } = req.params
      const { type, description } = req.body

      if (!type || !description) {
        return res.status(400).json({
          status: 'error',
          message: 'Issue type and description are required'
        })
      }

      const shipment = await Shipment.findById(shipmentId)
      if (!shipment) {
        return res.status(404).json({
          status: 'error',
          message: 'Shipment not found'
        })
      }

      const uid = req.user.id.toString()
      const isParty =
        shipment.buyer.toString() === uid || shipment.seller.toString() === uid
      const canReport =
        isParty || (await userCanJoinShipmentRoom(aclUserFromReq(req), shipmentId))

      if (!canReport) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        })
      }

      // Report issue
      await shipment.reportIssue(type, description, req.user.id)

      // Create notification for relevant parties
      const notifications = []
      
      if (req.user.id === shipment.buyer.toString()) {
        notifications.push({
          user: shipment.seller,
          title: 'Shipment Issue Reported',
          message: `Buyer reported an issue with shipment #${shipment.shipmentNumber}: ${type}`,
          type: 'warning',
          category: 'shipment'
        })
      } else {
        notifications.push({
          user: shipment.buyer,
          title: 'Shipment Issue Reported',
          message: `Seller reported an issue with shipment #${shipment.shipmentNumber}: ${type}`,
          type: 'warning',
          category: 'shipment'
        })
      }

      await Notification.insertMany(notifications)

      res.json({
        status: 'success',
        message: 'Issue reported successfully',
        data: shipment
      })
    } catch (error) {
      console.error('Error reporting issue:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to report issue'
      })
    }
  },

  // Get shipment statistics
  async getShipmentStats(req, res) {
    try {
      const { startDate, endDate } = req.query

      const accessFilter = await buildShipmentAccessFilter(aclUserFromReq(req))
      const dateFilter = {}
      if (startDate || endDate) {
        dateFilter.createdAt = {}
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
      }
      const query = mergeShipmentQueries(
        accessFilter,
        Object.keys(dateFilter).length > 0 ? dateFilter : null
      )
      const delayedQuery = mergeShipmentQueries(accessFilter, dateFilter, {
        status: { $in: ['confirmed', 'in_transit', 'out_for_delivery'] },
        estimatedDelivery: { $lt: new Date() }
      })
      const deliveredQuery = mergeShipmentQueries(accessFilter, dateFilter, {
        status: 'delivered',
        actualDelivery: { $exists: true }
      })

      const [totalShipments, statusBreakdown, delayedShipments, avgDeliveryTime] = await Promise.all([
        Shipment.countDocuments(query),
        Shipment.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Shipment.countDocuments(delayedQuery),
        Shipment.aggregate([
          { $match: deliveredQuery },
          {
            $group: {
              _id: null,
              avgTime: {
                $avg: { $subtract: ['$actualDelivery', '$createdAt'] }
              }
            }
          }
        ])
      ])

      res.json({
        status: 'success',
        data: {
          totalShipments,
          statusBreakdown,
          delayedShipments,
          avgDeliveryTime: avgDeliveryTime[0]?.avgTime ? 
            Math.round(avgDeliveryTime[0].avgTime / (1000 * 60 * 60 * 24)) : 0
        }
      })
    } catch (error) {
      console.error('Error getting shipment stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get shipment statistics'
      })
    }
  },

  // Search shipments
  async searchShipments(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query

      if (!q) {
        return res.status(400).json({
          status: 'error',
          message: 'Search query is required'
        })
      }

      const accessFilter = await buildShipmentAccessFilter(aclUserFromReq(req))
      const query = mergeShipmentQueries(accessFilter, {
        $or: [
          { shipmentNumber: { $regex: q, $options: 'i' } },
          { trackingNumber: { $regex: q, $options: 'i' } },
          { carrier: { $regex: q, $options: 'i' } },
          { 'origin.city': { $regex: q, $options: 'i' } },
          { 'destination.city': { $regex: q, $options: 'i' } }
        ]
      })

      const skip = (parseInt(page) - 1) * parseInt(limit)

      const [shipments, total] = await Promise.all([
        Shipment.find(query)
          .populate('order', 'orderNumber total')
          .populate('buyer', 'name email')
          .populate('seller', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Shipment.countDocuments(query)
      ])

      res.json({
        status: 'success',
        data: {
          shipments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error searching shipments:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to search shipments'
      })
    }
  },

  /**
   * Assign or clear the logistics/driver user for realtime + carrier order-room access.
   * Admin or partner (with existing shipment access per realtime-room-access rules).
   */
  async assignAssignedLogistics(req, res) {
    try {
      const { shipmentId } = req.params
      const { assignedLogisticsUser } = req.body

      const shipment = await Shipment.findById(shipmentId)
      if (!shipment) {
        return res.status(404).json({ status: 'error', message: 'Shipment not found' })
      }

      if (!(await partnerMayManageShipmentAssignment(aclUserFromReq(req), shipmentId))) {
        return res.status(403).json({ status: 'error', message: 'Access denied' })
      }

      if (assignedLogisticsUser != null && String(assignedLogisticsUser).trim() !== '') {
        const aid = String(assignedLogisticsUser).trim()
        if (!mongoose.Types.ObjectId.isValid(aid)) {
          return res.status(400).json({ status: 'error', message: 'Invalid assignedLogisticsUser' })
        }
        const assignee = await User.findById(aid).select('_id status').lean()
        if (!assignee || assignee.status !== 'active') {
          return res.status(400).json({ status: 'error', message: 'Assignee not found or inactive' })
        }
        shipment.assignedLogisticsUser = assignee._id
      } else {
        shipment.set('assignedLogisticsUser', null)
      }

      await shipment.save()

      return res.json({
        status: 'success',
        message: 'Logistics assignment updated',
        data: { shipment }
      })
    } catch (error) {
      console.error('assignAssignedLogistics:', error)
      return res.status(500).json({ status: 'error', message: 'Failed to update assignment' })
    }
  }
}

module.exports = shipmentController

