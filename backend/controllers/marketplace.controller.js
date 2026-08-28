const Listing = require('../models/listing.model')
const Order = require('../models/order.model')
const Harvest = require('../models/harvest.model')
const mongoose = require('mongoose')
const notificationController = require('./notification.controller')
const { ensureExactPrecision } = require('../utils/number-precision')
const { calculateShippingCost, resolveSellerLocation } = require('../utils/shipping-calculator.util')
const { escapeRegex } = require('../utils/regex.util')

// Helper function to map crop types to categories
const getCategoryFromCropType = (cropType) => {
  if (!cropType || typeof cropType !== 'string') return 'grains'

  try {
    const crop = cropType.toLowerCase().trim()

    if (['maize', 'rice', 'wheat', 'millet', 'sorghum', 'barley', 'corn'].includes(crop)) return 'grains'
    if (['cassava', 'yam', 'potato', 'sweet potato', 'cocoyam', 'sweet-potato'].includes(crop)) return 'tubers'
    if (['tomato', 'pepper', 'onion', 'lettuce', 'cabbage', 'carrot', 'spinach', 'vegetable'].includes(crop)) return 'vegetables'
    if (['mango', 'orange', 'banana', 'pineapple', 'apple', 'guava', 'fruit'].includes(crop)) return 'fruits'
    if (['beans', 'groundnut', 'soybean', 'cowpea', 'lentils', 'ground-nut', 'legume'].includes(crop)) return 'legumes'
    if (['cocoa', 'coffee', 'tea', 'cashew', 'cash-crop'].includes(crop)) return 'cash_crops'

    console.log(`⚠️ Unknown crop type "${crop}", defaulting to "grains"`)
    return 'grains' // default category
  } catch (error) {
    console.warn('⚠️ Error mapping crop type to category:', error.message)
    return 'grains'
  }
}

const getSellerFromListing = async (listingId) => {
  const listing = await Listing.findById(listingId)
  if (!listing) {
    return null
  }
  return listing.farmer
}

const marketplaceController = {
  // Get all listings with filters
  async getListings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        minPrice, 
        maxPrice, 
        location, 
        quality,
        search,
        farmerId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query
      
      const query = { 
        status: 'active',
        availableQuantity: { $gt: 0 } // Only show products with available stock
      }
      
      // Apply filters
      if (category) query.category = category
      if (minPrice || maxPrice) {
        query.basePrice = {}
        if (minPrice) query.basePrice.$gte = Number(minPrice)
        if (maxPrice) query.basePrice.$lte = Number(maxPrice)
      }
      if (location) query.location = new RegExp(escapeRegex(location), 'i')
      if (quality) query.qualityGrade = quality
      if (farmerId) query.farmer = farmerId

      // Search functionality
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i')
        query.$or = [
          { cropName: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      
      const [listings, total] = await Promise.all([
        Listing.find(query)
          .populate('farmer', 'name location')
          .populate('harvest', 'batchId cropType quality')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Listing.countDocuments(query)
      ])

      // Parse location strings into objects for each listing
      const parsedListings = listings.map(listing => {
        let locationObject = null
        if (listing.location) {
          if (typeof listing.location === 'string') {
            // Parse string location format: "City, State, Country" or "City, State"
            const locationParts = listing.location.split(',').map(part => part.trim())

            locationObject = {
              city: locationParts[0] || 'Unknown City',
              state: locationParts[1] || 'Unknown State',
              country: locationParts[2] || 'Nigeria' // Default to Nigeria if not specified
            }
          } else if (typeof listing.location === 'object') {
            // Already in object format
            locationObject = listing.location
          }
        }

        return {
          ...listing.toObject(),
          location: locationObject
        }
      })

      res.json({
        status: 'success',
        data: {
          listings: parsedListings,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting listings:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get listings'
      })
    }
  },

  // Debug endpoint to get all listings (for troubleshooting)
  async getAllListings(req, res) {
    try {
      const listings = await Listing.find({})
        .populate('farmer', 'name location')
        .populate('harvest', 'batchId cropType quality')
        .sort({ createdAt: -1 })
        .limit(20)

      res.json({
        status: 'success',
        data: {
          listings,
          total: listings.length,
          message: 'Debug endpoint - shows all listings regardless of status'
        }
      })
    } catch (error) {
      console.error('Error getting all listings:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get all listings'
      })
    }
  },

  // Get specific listing (for public viewing - only active listings)
  async getListing(req, res) {
    try {
      const { id } = req.params

      const listing = await Listing.findById(id)
        .populate('farmer', 'name location phone email farmLocation')
        .populate('harvest', 'batchId cropType quality harvestDate geoLocation')

      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }

      if (listing.status !== 'active') {
        return res.status(404).json({
          status: 'error',
          message: 'Listing is not available'
        })
      }

      // Parse location string into object format expected by frontend
      let locationObject = null
      if (listing.location) {
        if (typeof listing.location === 'string') {
          // Parse string location format: "City, State, Country" or "City, State"
          const locationParts = listing.location.split(',').map(part => part.trim())

          locationObject = {
            city: locationParts[0] || 'Unknown City',
            state: locationParts[1] || 'Unknown State',
            country: locationParts[2] || 'Nigeria' // Default to Nigeria if not specified
          }
        } else if (typeof listing.location === 'object') {
          // Already in object format
          locationObject = listing.location
        }
      }

      // Create response data with parsed location
      const responseData = {
        ...listing.toObject(),
        location: locationObject
      }

      res.json({
        status: 'success',
        data: responseData
      })
    } catch (error) {
      console.error('Error getting listing:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get listing'
      })
    }
  },

  // Get specific listing for editing (allows any status)
  async getListingForEdit(req, res) {
    try {
      const { id } = req.params

      const listing = await Listing.findById(id)
        .populate('farmer', 'name location phone email farmLocation')
        .populate('harvest', 'batchId cropType quality harvestDate geoLocation')

      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }

      // Check if the user is the owner of the listing or an admin
      if (listing.farmer._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You can only edit your own listings'
        })
      }

      // Parse location string into object format expected by frontend
      let locationObject = null
      if (listing.location) {
        if (typeof listing.location === 'string') {
          // Parse string location format: "City, State, Country" or "City, State"
          const locationParts = listing.location.split(',').map(part => part.trim())

          locationObject = {
            city: locationParts[0] || 'Unknown City',
            state: locationParts[1] || 'Unknown State',
            country: locationParts[2] || 'Nigeria' // Default to Nigeria if not specified
          }
        } else if (typeof listing.location === 'object') {
          // Already in object format
          locationObject = listing.location
        }
      }

      // Create response data with parsed location
      const responseData = {
        ...listing.toObject(),
        location: locationObject
      }

      res.json({
        status: 'success',
        data: responseData
      })
    } catch (error) {
      console.error('Error getting listing for edit:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get listing for editing'
      })
    }
  },

  // Create listing from harvest
  async createListing(req, res) {
    try {
      const { harvestId, price, description, images } = req.body
      
      if (!harvestId || !price) {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest ID and price are required'
        })
      }
      
      // Verify harvest exists and belongs to user
      const harvest = await Harvest.findById(harvestId)
      if (!harvest) {
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }
      
      if (harvest.farmer.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only create listings for your own harvests'
        })
      }
      
      // Check if harvest is approved
      if (harvest.status !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message: 'Only approved harvests can be listed'
        })
      }
      
      // Ensure quantity is a positive number with exact precision
      const harvestQuantity = ensureExactPrecision(harvest.quantity)
      
      // Logging for debugging
      console.log('📦 Creating Listing:', {
        cropType: harvest.cropType,
        totalQuantity: harvestQuantity,
        price: price
      })

      // Create listing
      const listing = await Listing.create({
        farmer: req.user.id,
        harvest: harvestId,
        cropName: harvest.cropType,
        category: getCategoryFromCropType(harvest.cropType),
        basePrice: Number(price),
        description: description || `Fresh ${harvest.cropType} from ${req.user.name}`,
        images: images || harvest.images || [],
        location: typeof harvest.location === 'string' ? harvest.location : `${harvest.location?.city || 'Unknown'}, ${harvest.location?.state || 'Unknown'}, Nigeria`,
        qualityGrade: harvest.quality || 'standard',
        quantity: harvestQuantity,
        availableQuantity: harvestQuantity,  // Explicitly set available quantity
        unit: harvest.unit,
        status: 'active',
        tags: harvest.quality ? [harvest.quality] : []
      })
      
      // Update harvest status
      harvest.status = 'listed'
      await harvest.save()
      
      // Create notification for farmer
      try {
        await notificationController.createNotificationForActivity(
          req.user.id,
          'farmer',
          'marketplace',
          'productListed',
          {
            productName: listing.cropName,
            actionUrl: `/dashboard/marketplace/listings/${listing._id}`
          }
        )
      } catch (notificationError) {
        console.error('Failed to create listing notification:', notificationError)
      }

      // Notify admins about new listing
      try {
        await notificationController.notifyAdmins(
          'farmer',
          'listingCreated',
          {
            farmerName: req.user.name,
            productName: listing.cropName,
            actionUrl: `/admin/marketplace/listings/${listing._id}`
          }
        )
      } catch (notificationError) {
        console.error('Failed to notify admins about listing:', notificationError)
      }

      // Notify partner about farmer's listing
      try {
        await notificationController.notifyPartners(
          req.user.id,
          'farmer',
          'listingCreated',
          {
            farmerName: req.user.name,
            productName: listing.cropName,
            actionUrl: `/partner/marketplace/listings/${listing._id}`
          }
        )
      } catch (notificationError) {
        console.error('Failed to notify partner about listing:', notificationError)
      }
      
      // Logging for verification
      console.log('✅ Listing Created:', {
        listingId: listing._id,
        cropType: listing.cropName,
        totalQuantity: listing.quantity,
        availableQuantity: listing.availableQuantity
      })

      res.status(201).json(listing)
    } catch (error) {
      console.error('Error creating listing:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create listing'
      })
    }
  },

  // Update listing
  async updateListing(req, res) {
    try {
      const { id } = req.params
      const { price, description, images, status } = req.body
      
      const listing = await Listing.findById(id)
      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }
      
      if (listing.farmer.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own listings'
        })
      }
      
      // Update fields
      if (price !== undefined) listing.price = Number(price)
      if (description !== undefined) listing.description = description
      if (images !== undefined) listing.images = images
      if (status !== undefined) listing.status = status
      
      await listing.save()
      
      res.json({
        status: 'success',
        data: listing
      })
    } catch (error) {
      console.error('Error updating listing:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update listing'
      })
    }
  },

  // Create order
  // NOTE: Live order creation is handled by POST /orders in marketplace.routes.js
  // (idempotency keys, server-side pricing). This method is retained for reference only.
  async createOrder(req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      const { items, shippingAddress, deliveryInstructions, paymentMethod, notes, shipping, shippingMethod } = req.body || {}

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Items are required' })
      }

      // Validate inventory before processing order, and source prices from the
      // listing itself — never trust a client-submitted price.
      const listingPriceById = new Map()
      let sellerOriginListing = null
      for (const item of items) {
        const listing = await Listing.findById(item.listingId)
        if (!listing) {
          await session.abortTransaction()
          session.endSession()
          return res.status(404).json({
            status: 'error',
            message: `Listing ${item.listingId} not found`
          })
        }

        // Strict inventory check with detailed logging
        console.log('🔍 Inventory Check:', {
          listingId: item.listingId,
          cropName: listing.cropName,
          requestedQuantity: item.quantity,
          currentAvailableQuantity: listing.availableQuantity,
          currentTotalQuantity: listing.quantity
        })

        if (listing.availableQuantity < item.quantity) {
          await session.abortTransaction()
          session.endSession()
          return res.status(400).json({
            status: 'error',
            message: `Insufficient inventory for ${listing.cropName}. Requested: ${item.quantity}, Available: ${listing.availableQuantity}`
          })
        }

        listingPriceById.set(item.listingId.toString(), listing.basePrice)
        if (!sellerOriginListing) {
          sellerOriginListing = listing
        }
      }

      // Calculate totals from the authoritative listing price, not the client-submitted one
      const subtotal = items.reduce((s, it) => s + (Number(it.quantity) * listingPriceById.get(it.listingId.toString())), 0)
      
      // Calculate shipping cost if not provided or if it's 0
      let shippingCost = shipping || 0
      if (shippingCost === 0 && shippingMethod && shippingAddress) {
        // Derive the shipping origin from the actual seller's listing location
        // rather than assuming a single city — farmers list from across Nigeria.
        const originLocation = resolveSellerLocation(null, sellerOriginListing?.location)

        shippingCost = calculateShippingCost(
          originLocation,
          { city: shippingAddress.city, state: shippingAddress.state, country: shippingAddress.country || 'Nigeria' },
          items.reduce((sum, item) => sum + Number(item.quantity), 0), // Total weight
          shippingMethod
        )
      }
      
      const tax = 0 // VAT removed
      const total = subtotal + shippingCost

      // Prepare order data
      const orderData = {
        buyer: req.user.id,
        seller: items[0]?.listing ? await getSellerFromListing(items[0].listing) : null,
        items: items.map(item => ({
          listing: item.listing,
          quantity: Number(item.quantity),
          price: Number(item.price),
          unit: item.unit,
          total: Number(item.quantity) * Number(item.price)
        })),
        subtotal,
        shipping: shippingCost,
        shippingMethod: shippingMethod || 'road_standard',
        tax,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'paystack',
        shippingAddress: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country || 'Nigeria',
          postalCode: shippingAddress.postalCode || '',
          phone: shippingAddress.phone
        },
        deliveryInstructions: deliveryInstructions || '',
        notes: notes || ''
      }

      // Create the order
      const order = await Order.create(orderData)

      // Create notifications for new order
      try {
        // Notify buyer about order confirmation
        await notificationController.createNotificationForActivity(
          req.user.id,
          'buyer',
          'marketplace',
          'orderReceived',
          {
            productName: items.length === 1 ? items[0].cropName : `${items.length} products`,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            actionUrl: `/dashboard/orders/${order._id}`
          }
        )

        // Notify farmers about new orders
        const populatedOrder = await Order.findById(order._id)
          .populate('items.listing', 'farmer cropName')
          .populate('buyer', 'name')

        for (const item of populatedOrder.items) {
          if (item.listing && item.listing.farmer) {
            await notificationController.createNotificationForActivity(
              item.listing.farmer,
              'farmer',
              'marketplace',
              'orderReceived',
              {
                productName: item.listing.cropName,
                buyerName: populatedOrder.buyer.name,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                actionUrl: `/dashboard/orders/${order._id}`
              }
            )
          }
        }

        // Notify admins about new order
        await notificationController.notifyAdmins(
          'system',
          'newOrder',
          {
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            buyerName: populatedOrder.buyer.name,
            totalAmount: order.total,
            actionUrl: `/admin/orders/${order._id}`
          }
        )

      } catch (notificationError) {
        console.error('❌ Order notification failed:', notificationError)
        // Don't fail the order creation because of notification errors
      }

      // Reserve quantities for the order (but don't reduce inventory yet)
      // Inventory will be reduced only when payment is successful
      for (const item of items) {
        const listing = await Listing.findById(item.listingId)
        if (listing) {
          // Just validate that there's enough quantity available
          // Don't actually reduce the inventory yet
          console.log('🔍 Validating inventory for order:', {
            listingId: item.listingId,
            cropName: listing.cropName,
            orderedQuantity: item.quantity,
            availableQuantity: listing.availableQuantity,
            totalQuantity: listing.quantity
          })

          // The actual inventory reduction will happen during payment verification
          // This ensures that inventory is only reduced when payment is successful
          console.log('✅ Inventory validation passed - quantities will be reduced on payment success')
        } else {
          console.error(`❌ Listing not found: ${item.listingId}`)
          await session.abortTransaction()
          session.endSession()
          return res.status(404).json({ 
            status: 'error', 
            message: `Listing ${item.listingId} not found` 
          })
        }
      }

      // Commit the transaction
      await session.commitTransaction()
      session.endSession()

      res.status(201).json({
        status: 'success',
        data: order
      })
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      console.error('Error creating order:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create order'
      })
    }
  },

  // Get user orders
  async getUserOrders(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query
      const userId = req.user.id
      const query = { buyer: new mongoose.Types.ObjectId(userId) }
      
      if (status) query.status = status
      
      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // Get orders and total count
      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('items.listing', 'cropName images price')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Order.countDocuments(query)
      ])

      // Calculate comprehensive stats
      const statsPipeline = [
        { $match: { buyer: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            totalSpent: { 
              $sum: { 
                $cond: [
                  { $eq: ['$paymentStatus', 'paid'] }, 
                  '$total', 
                  0
                ] 
              } 
            }
          }
        }
      ]

      const [statsResult] = await Order.aggregate(statsPipeline)
      const stats = statsResult || {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalSpent: 0
      }

      console.log('📊 Orders stats calculated:', stats)
      
      res.json({
        status: 'success',
        data: {
          orders,
          stats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting user orders:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get orders'
      })
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params
      const { status, trackingNumber, notes } = req.body
      
      const order = await Order.findById(id)
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        })
      }
      
      // Check permissions
      if (req.user.role === 'farmer') {
        // Farmer can only update orders for their listings
        const hasPermission = order.items.some(item => 
          item.listing.farmer?.toString() === req.user.id
        )
        if (!hasPermission) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update orders for your own listings'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        })
      }
      
      // Update order
      order.status = status
      if (trackingNumber) order.trackingNumber = trackingNumber
      if (notes) order.notes = notes
      order.updatedAt = new Date()
      
      await order.save()
      
      res.json({
        status: 'success',
        data: order
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update order status'
      })
    }
  },

  // Get search suggestions
  async getSearchSuggestions(req, res) {
    try {
      const { q } = req.query
      
      if (!q || q.length < 2) {
        return res.json({
          status: 'success',
          data: { suggestions: [] }
        })
      }
      
      const suggestions = await Listing.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$cropName',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        },
        {
          $match: {
            _id: { $regex: escapeRegex(q), $options: 'i' }
          }
        },
        { $limit: 10 }
      ])
      
      res.json({
        status: 'success',
        data: { suggestions }
      })
    } catch (error) {
      console.error('Error getting search suggestions:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get search suggestions'
      })
    }
  },

  // Reserve quantity for cart items (temporary reservation)
  async reserveCartQuantity(req, res) {
    try {
      const { items } = req.body // items: [{ listingId, quantity }]

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Items array is required'
        })
      }

      const results = []
      const errors = []

      for (const item of items) {
        try {
          const { listingId, quantity } = item

          const listing = await Listing.findById(listingId)
          if (!listing) {
            errors.push({ listingId, error: 'Listing not found' })
            continue
          }

          // Check if there's enough quantity available (including any existing reservations)
          const availableQuantity = listing.availableQuantity
          if (availableQuantity < quantity) {
            errors.push({
              listingId,
              error: `Insufficient quantity. Available: ${availableQuantity}, Requested: ${quantity}`
            })
            continue
          }

          // For now, we'll just validate the quantity but not actually reserve it
          // The actual reservation will happen during order completion
          // This allows multiple users to add items to cart without blocking each other

          results.push({
            listingId,
            reservedQuantity: quantity,
            remainingQuantity: availableQuantity - quantity,
            actualQuantity: availableQuantity
          })

        } catch (error) {
          errors.push({ listingId: item.listingId, error: error.message })
        }
      }

      res.json({
        status: 'success',
        data: {
          reserved: results,
          errors: errors
        }
      })

    } catch (error) {
      console.error('Error reserving cart quantity:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to reserve cart quantity'
      })
    }
  },

  // Release quantity when items are removed from cart
  async releaseCartQuantity(req, res) {
    try {
      const { items } = req.body // items: [{ listingId, quantity }]

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Items array is required'
        })
      }

      const results = []

      for (const item of items) {
        try {
          const { listingId, quantity } = item

          // Since we're not actually reserving quantities anymore,
          // we just acknowledge the release request
          const listing = await Listing.findById(listingId)

          if (listing) {
            results.push({
              listingId,
              releasedQuantity: quantity,
              currentQuantity: listing.availableQuantity
            })
          } else {
            results.push({
              listingId,
              error: 'Listing not found',
              releasedQuantity: 0
            })
          }

        } catch (error) {
          console.error(`Error releasing quantity for listing ${item.listingId}:`, error)
          results.push({
            listingId: item.listingId,
            error: error.message,
            releasedQuantity: 0
          })
        }
      }

      res.json({
        status: 'success',
        data: { released: results }
      })

    } catch (error) {
      console.error('Error releasing cart quantity:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to release cart quantity'
      })
    }
  },

  // Update cart item quantity
  async updateCartItemQuantity(req, res) {
    try {
      const { listingId, oldQuantity, newQuantity } = req.body

      const quantityDifference = newQuantity - oldQuantity

      if (quantityDifference === 0) {
        return res.json({
          status: 'success',
          message: 'No quantity change needed'
        })
      }

      const listing = await Listing.findById(listingId)
      if (!listing) {
        return res.status(404).json({
          status: 'error',
          message: 'Listing not found'
        })
      }

      // Check if we have enough quantity for increase
      if (quantityDifference > 0 && listing.availableQuantity < quantityDifference) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient quantity. Available: ${listing.availableQuantity}, Requested: ${quantityDifference}`
        })
      }

      // Since we're not actually reserving quantities during cart operations,
      // we just validate that there's enough quantity available
      res.json({
        status: 'success',
        data: {
          listingId,
          oldQuantity,
          newQuantity,
          quantityChange: quantityDifference,
          remainingQuantity: listing.availableQuantity - quantityDifference,
          currentQuantity: listing.availableQuantity
        }
      })

    } catch (error) {
      console.error('Error updating cart item quantity:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update cart item quantity'
      })
    }
  },

  // Clean up sold-out products (remove after 7 days)
  async cleanupSoldOutProducts(req, res) {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const result = await Listing.deleteMany({
        status: 'out_of_stock',
        soldOutAt: { $lt: sevenDaysAgo }
      })

      console.log(`🧹 Cleaned up ${result.deletedCount} sold-out products`)

      res.json({
        status: 'success',
        data: {
          deletedCount: result.deletedCount,
          message: `Cleaned up ${result.deletedCount} sold-out products`
        }
      })

    } catch (error) {
      console.error('Error cleaning up sold-out products:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to cleanup sold-out products'
      })
    }
  },

  // Get marketplace statistics
  async getMarketplaceStats(req, res) {
    try {
      const stats = await Listing.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ])
      
      const totalListings = await Listing.countDocuments({ status: 'active' })
      const totalOrders = await Order.countDocuments()
      
      res.json({
        status: 'success',
        data: {
          totalListings,
          totalOrders,
          categoryBreakdown: stats
        }
      })
    } catch (error) {
      console.error('Error getting marketplace stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get marketplace statistics'
      })
    }
  }
}

// Auto cleanup function (can be called by a cron job)
marketplaceController.autoCleanupSoldOutProducts = async () => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const result = await Listing.deleteMany({
      status: 'out_of_stock',
      soldOutAt: { $lt: sevenDaysAgo }
    })

    console.log(`🧹 Auto-cleanup: Removed ${result.deletedCount} sold-out products older than 7 days`)

    return {
      success: true,
      deletedCount: result.deletedCount
    }

  } catch (error) {
    console.error('❌ Auto-cleanup error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

module.exports = marketplaceController
