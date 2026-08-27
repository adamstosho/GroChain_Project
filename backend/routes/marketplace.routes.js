const router = require('express').Router()
const mongoose = require('mongoose')
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const multer = require('multer')
const cloudinary = require('../utils/cloudinary')

// Import models (ensure they are registered)
const Listing = require('../models/listing.model')
const Favorite = require('../models/favorite.model')
const Order = require('../models/order.model')
const User = require('../models/user.model') // Required for population
const Harvest = require('../models/harvest.model') // Required for population
const Review = require('../models/review.model')

// Ensure models are registered with Mongoose
if (!mongoose.models.User) mongoose.model('User', User.schema)
if (!mongoose.models.Favorite) mongoose.model('Favorite', Favorite.schema)
if (!mongoose.models.Listing) mongoose.model('Listing', Listing.schema)
if (!mongoose.models.Harvest) mongoose.model('Harvest', Harvest.schema)
if (!mongoose.models.Order) mongoose.model('Order', Order.schema)

console.log('📋 Models registered in marketplace routes:', Object.keys(mongoose.models))

// Use memory storage for multer
const storage = multer.memoryStorage()

// Custom file filter to allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG images and PDF documents are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
})

router.post('/upload-image', authenticate, authorize('farmer','partner','admin'), upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files || []
    if (files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      })
    }

    console.log(`📤 Uploading ${files.length} file(s) to Cloudinary...`)

    // Upload each file to Cloudinary
    const uploadPromises = files.map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64')
      const dataURI = `data:${file.mimetype};base64,${b64}`

      // Determine resource type and folder based on file type
      const isPDF = file.mimetype === 'application/pdf'
      const uploadOptions = {
        folder: 'grochain-documents',
        public_id: `${isPDF ? 'document' : 'image'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resource_type: isPDF ? 'raw' : 'image'
      }

      // Add transformation for images only
      if (!isPDF) {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      }

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions)
      return result.secure_url
    })

    const urls = await Promise.all(uploadPromises)

    console.log(`✅ Successfully uploaded ${urls.length} file(s)`)

    res.status(201).json({
      status: 'success',
      urls,
      count: files.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Upload failed'
    })
  }
})

// Import marketplace controller
const marketplaceController = require('../controllers/marketplace.controller')
const { calculateShippingCost, resolveSellerLocation } = require('../utils/shipping-calculator.util')

// Use the full marketplace controller for listings
router.get('/listings', marketplaceController.getListings)

// Debug endpoint to see all listings
router.get('/listings-debug', marketplaceController.getAllListings)

// Get individual listing details
router.get('/listings/:id', marketplaceController.getListing)

// Search suggestions (cropName/category/tags)
router.get('/search-suggestions', async (req, res) => {
  const { q = '' } = req.query
  const limit = Number(req.query.limit || 10)
  const regex = new RegExp(q, 'i')
  const crops = await Listing.find({ cropName: regex }).limit(limit).select('cropName').lean()
  const categories = await Listing.find({ category: regex }).limit(limit).select('category').lean()
  const tags = await Listing.find({ tags: regex }).limit(limit).select('tags').lean()
  const suggestions = Array.from(new Set([
    ...crops.map(c => c.cropName),
    ...categories.map(c => c.category),
    ...tags.flatMap(t => t.tags || [])
  ].filter(Boolean))).slice(0, limit)
  return res.json({ status: 'success', data: { suggestions } })
})

// Debug endpoint to check authentication
router.get('/auth/debug', authenticate, (req, res) => {
  console.log('🔍 Auth debug endpoint called for user:', req.user?.email || 'unknown')

  res.json({
    status: 'success',
    user: req.user,
    authenticated: true,
    timestamp: new Date().toISOString()
  })
})

// Debug endpoint to test model registration
router.get('/debug/models', (req, res) => {
  res.json({
    status: 'success',
    registeredModels: Object.keys(mongoose.models),
    connectionState: mongoose.connection.readyState,
    database: mongoose.connection.name
  })
})

// Favorites for current authenticated user
router.get('/favorites/current', authenticate, async (req, res) => {
  console.log('🔍 Favorites/current endpoint called for user:', req.user?.email || 'unknown')

  const { page = 1, limit = 20 } = req.query
  const userId = req.user?.id || req.user?._id

  console.log('User ID extracted:', userId)

  if (!userId) {
    console.log('❌ No user ID found - user not authenticated')
    return res.status(401).json({
      status: 'error',
      message: 'User not authenticated'
    })
  }

  try {
    console.log(`🔍 Fetching favorites for user: ${userId}`)

    // First, let's try a simple query to see if the user exists
    const userExists = await User.findById(userId)
    console.log('User exists in database:', !!userExists)

    // Use a simpler approach to avoid circular references
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'listing',
        select: 'cropName basePrice unit quantity availableQuantity qualityGrade organic images location farmer harvest',
        populate: [
          { path: 'farmer', select: 'name location' },
          { path: 'harvest', select: 'batchId cropType quality' }
        ]
      })
      .sort({ addedAt: -1 })
      .lean() // Use lean() to get plain JavaScript objects

    console.log('✅ Favorites fetched successfully:', favorites.length, 'items')

    // Log the structure of the result safely
    if (favorites.length > 0) {
      console.log('Sample favorite structure:', {
        id: favorites[0]._id,
        user: favorites[0].user,
        listingId: favorites[0].listing?._id,
        listingCropName: favorites[0].listing?.cropName
      })
    }

    return res.json({ 
      status: 'success', 
      data: { 
        favorites,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: favorites.length,
          itemsPerPage: parseInt(limit)
        }
      } 
    })
  } catch (error) {
    console.error('❌ Error fetching favorites for current user:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)

    // Provide more specific error messages
    let errorMessage = 'Failed to fetch favorites'
    if (error.message.includes('Schema hasn\'t been registered')) {
      errorMessage = 'Database model registration error'
    } else if (error.message.includes('ObjectId')) {
      errorMessage = 'Invalid user ID format'
    }

    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      details: error.message
    })
  }
})

// Favorites by user ID (with validation)
router.get('/favorites/:userId', authenticate, async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const { userId } = req.params

  // Validate userId
  if (!userId || userId === 'undefined' || userId === 'null') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID provided'
    })
  }

  // Validate that userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID format'
    })
  }

  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' })
  }

  try {
    // Use lean() to avoid circular references
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'listing',
        select: 'cropName basePrice unit quantity availableQuantity qualityGrade organic images location farmer harvest',
        populate: [
          { path: 'farmer', select: 'name location' },
          { path: 'harvest', select: 'batchId cropType quality' }
        ]
      })
      .sort({ addedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean()

    // Get total count for pagination
    const total = await Favorite.countDocuments({ user: userId })

    const result = {
      docs: favorites,
      totalDocs: total,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1,
      nextPage: parseInt(page) < Math.ceil(total / parseInt(limit)) ? parseInt(page) + 1 : null,
      prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null
    }

    console.log('✅ Favorites fetched successfully:', favorites.length, 'items')
    return res.json({ status: 'success', data: result })
  } catch (error) {
    console.error('❌ Error fetching favorites:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch favorites',
      details: error.message
    })
  }
})

router.post('/favorites', authenticate, async (req, res) => {
  const { listingId, notes } = req.body || {}
  console.log('📝 Favorites POST - Request body:', { listingId, notes })
  console.log('👤 Favorites POST - User:', req.user?.email || 'unknown')

  if (!listingId) {
    console.log('❌ Favorites POST - Missing listingId')
    return res.status(400).json({ status: 'error', message: 'listingId required' })
  }

  try {
    console.log('🔍 Favorites POST - Checking if listing exists:', listingId)

    // Check if the listing exists
    const listing = await Listing.findById(listingId)
    if (!listing) {
      console.log('❌ Favorites POST - Listing not found:', listingId)
      return res.status(404).json({ status: 'error', message: 'Listing not found' })
    }

    console.log('✅ Favorites POST - Listing found:', listing.cropName)
    console.log('💾 Favorites POST - Creating favorite with user:', req.user.id)

    // Create favorite without any population to avoid circular references
    const fav = await Favorite.create({ user: req.user.id, listing: listingId, notes })
    console.log('✅ Favorites POST - Favorite created successfully:', fav._id)

    // Convert to plain object and manually remove any potential circular references
    const favoriteData = fav.toObject()

    // Ensure no circular references by creating a clean object
    const cleanFavoriteData = {
      _id: favoriteData._id,
      user: favoriteData.user,
      listing: favoriteData.listing,
      addedAt: favoriteData.addedAt,
      notes: favoriteData.notes,
      createdAt: favoriteData.createdAt,
      updatedAt: favoriteData.updatedAt
    }

    return res.status(201).json({ status: 'success', data: cleanFavoriteData })
  } catch (e) {
    console.error('❌ Favorites POST - Error creating favorite:', e)
    console.error('❌ Favorites POST - Error name:', e?.name)
    console.error('❌ Favorites POST - Error code:', e?.code)
    console.error('❌ Favorites POST - Error message:', e?.message)
    // Don't log the stack trace as it might contain circular references
    // console.error('❌ Favorites POST - Error stack:', e.stack)

    // Handle specific error types safely
    if (e?.code === 11000) {
      console.log('ℹ️ Favorites POST - Duplicate favorite (already exists)')
      return res.status(200).json({ status: 'success', message: 'Already in favorites' })
    }
    if (e?.name === 'ValidationError') {
      console.log('❌ Favorites POST - Validation error:', e?.message)
      return res.status(400).json({ status: 'error', message: 'Validation error: ' + (e?.message || 'Invalid data') })
    }

    // Generic error handling - avoid serializing the error object to the client
    const errorMessage = e?.message || 'Unknown server error'
    console.log('❌ Favorites POST - Generic server error:', errorMessage)
    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred while adding to favorites'
    })
  }
})

router.delete('/favorites/:userId/:listingId', authenticate, async (req, res) => {
  const { userId, listingId } = req.params
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' })
  }
  await Favorite.deleteOne({ user: userId, listing: listingId })
  return res.json({ status: 'success', message: 'Removed from favorites' })
})

router.post('/listings', authenticate, authorize('farmer','partner','admin'), async (req, res) => {
  // Accept basePrice or legacy price alias
  const { cropName, category, description, unit, quantity, location } = req.body || {}
  const basePrice = req.body.basePrice ?? req.body.price
  if (!cropName || basePrice == null || !category || !description || !unit || !quantity || !location) {
    return res.status(400).json({ status: 'error', message: 'Missing required listing fields' })
  }
  const listing = await Listing.create({
    farmer: req.user.id,
    cropName,
    basePrice,
    category,
    description,
    unit,
    quantity,
    availableQuantity: quantity,
    location,
    status: 'draft'
  })
  return res.status(201).json({ status: 'success', data: listing })
})

router.post('/orders', authenticate, authorize('buyer','farmer','partner','admin'), async (req, res) => {
  const rawIdempotencyKey = req.get('Idempotency-Key') || req.body?.idempotencyKey || ''
  const idempotencyKey = String(rawIdempotencyKey).trim().slice(0, 128) || null

  // Fast path: replay an earlier create for this buyer + key (multi-tab / retry safe)
  if (idempotencyKey) {
    try {
      const existing = await Order.findOne({ buyer: req.user.id, idempotencyKey })
      if (existing) {
        const populatedOrder = await Order.findById(existing._id)
          .populate({
            path: 'buyer',
            select: 'name email phone profile.phone'
          })
          .populate({
            path: 'items.listing',
            select: 'cropName images farmer',
            populate: {
              path: 'farmer',
              select: 'name email phone location profile.phone profile.farmName'
            }
          })

        return res.status(200).json({
          status: 'success',
          data: populatedOrder,
          message: 'Order already created',
          idempotent: true
        })
      }
    } catch (lookupError) {
      console.error('Idempotency lookup failed:', lookupError)
      // Continue to create — unique index still protects against duplicates
    }
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const {
      items,
      shippingAddress,
      deliveryInstructions,
      paymentMethod,
      notes,
      shipping,
      shippingMethod
    } = req.body || {}

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({ status: 'error', message: 'Items are required' })
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({ status: 'error', message: 'Complete shipping address is required' })
    }

    // Validate inventory and source prices from the listing itself — never
    // trust a client-submitted price or skip stock validation.
    const listingPriceById = new Map()
    let sellerOriginListing = null
    for (const item of items) {
      const listing = await Listing.findById(item.listing).session(session)
      if (!listing) {
        await session.abortTransaction()
        session.endSession()
        return res.status(404).json({ status: 'error', message: `Listing ${item.listing} not found` })
      }
      if (listing.availableQuantity < Number(item.quantity)) {
        await session.abortTransaction()
        session.endSession()
        return res.status(400).json({
          status: 'error',
          message: `Insufficient inventory for ${listing.cropName}. Requested: ${item.quantity}, Available: ${listing.availableQuantity}`
        })
      }
      listingPriceById.set(item.listing.toString(), listing.basePrice)
      if (!sellerOriginListing) {
        sellerOriginListing = listing
      }
    }

    // Calculate totals from the authoritative listing price, not the client-submitted one
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) * listingPriceById.get(it.listing.toString())), 0)

    // Use provided shipping cost or calculate it
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

    // Get seller from the first listing
    const seller = items[0]?.listing ? await getSellerFromListing(items[0].listing) : null

    // Validate that we have a seller
    if (!seller) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        status: 'error',
        message: 'Unable to determine seller from listing. Please ensure the listing exists and has a valid farmer.'
      })
    }

    // Prepare order data
    const orderData = {
      buyer: req.user.id,
      seller: seller,
      items: items.map(item => {
        const price = listingPriceById.get(item.listing.toString())
        return {
          listing: item.listing,
          quantity: Number(item.quantity),
          price,
          unit: item.unit,
          total: Number(item.quantity) * price
        }
      }),
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
      notes: notes || '',
      ...(idempotencyKey ? { idempotencyKey } : {})
    }

    // Create the order
    const [order] = await Order.create([orderData], { session })

    await session.commitTransaction()
    session.endSession()

    // Populate the created order for response (outside the transaction, read-only)
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'buyer',
        select: 'name email phone profile.phone'
      })
      .populate({
        path: 'items.listing',
        select: 'cropName images farmer',
        populate: {
          path: 'farmer',
          select: 'name email phone location profile.phone profile.farmName'
        }
      })

    console.log('✅ Order created successfully:', order._id)

    return res.status(201).json({
      status: 'success',
      data: populatedOrder,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('❌ Order creation error:', error)
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    session.endSession()

    // Concurrent creates with the same Idempotency-Key hit the unique index —
    // return the winner's order instead of a 500.
    if (error?.code === 11000 && idempotencyKey) {
      try {
        const existing = await Order.findOne({ buyer: req.user.id, idempotencyKey })
        if (existing) {
          const populatedOrder = await Order.findById(existing._id)
            .populate({
              path: 'buyer',
              select: 'name email phone profile.phone'
            })
            .populate({
              path: 'items.listing',
              select: 'cropName images farmer',
              populate: {
                path: 'farmer',
                select: 'name email phone location profile.phone profile.farmName'
              }
            })

          return res.status(200).json({
            status: 'success',
            data: populatedOrder,
            message: 'Order already created',
            idempotent: true
          })
        }
      } catch (replayError) {
        console.error('Idempotency replay after duplicate key failed:', replayError)
      }
    }

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create order'
    })
  }
})

// Helper function to get seller from listing
async function getSellerFromListing(listingId) {
  try {
    const Listing = require('../models/listing.model')
    const listing = await Listing.findById(listingId).select('farmer')
    return listing?.farmer || null
  } catch (error) {
    console.error('Error getting seller from listing:', error)
    return null
  }
}



// Get all orders for the authenticated user with full population
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build filter
    const filter = { buyer: req.user.id }
    if (status && status !== 'all') filter.status = status
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus

    // Get orders with full population
    const orders = await Order.find(filter)
      .populate({
        path: 'buyer',
        select: 'name email phone profile.phone profile.avatar'
      })
      .populate({
        path: 'seller',
        select: 'name email phone location profile.phone profile.farmName profile.avatar'
      })
      .populate({
        path: 'items.listing',
        select: 'cropName images farmer category unit',
        populate: {
          path: 'farmer',
          select: 'name email phone location profile.phone profile.farmName'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // Get total count for pagination
    const total = await Order.countDocuments(filter)

    // Calculate stats
    const buyerObjectId = new mongoose.Types.ObjectId(req.user.id)
    const stats = {
      total: total,
      pending: await Order.countDocuments({ buyer: buyerObjectId, status: 'pending' }),
      confirmed: await Order.countDocuments({ buyer: buyerObjectId, status: 'confirmed' }),
      shipped: await Order.countDocuments({ buyer: buyerObjectId, status: 'shipped' }),
      delivered: await Order.countDocuments({ buyer: buyerObjectId, status: 'delivered' }),
      cancelled: await Order.countDocuments({ buyer: buyerObjectId, status: 'cancelled' }),
      totalSpent: await Order.aggregate([
        {
          $match: {
            buyer: buyerObjectId,
            paymentStatus: 'paid'
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    }

    if (stats.totalSpent.length > 0) {
      stats.totalSpent = stats.totalSpent[0].total
    } else {
      stats.totalSpent = 0
    }

    return res.json({
      status: 'success',
      data: {
        orders,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to fetch orders' })
  }
})

// Full update listing (PUT)
router.put('/listings/:id', authenticate, authorize('farmer','partner','admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ status: 'error', message: 'Listing not found' })
    if (listing.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' })
    }

    const {
      cropName,
      category,
      description,
      basePrice,
      quantity,
      unit,
      availableQuantity,
      location,
      images,
      tags,
      status
    } = req.body || {}

    // Update fields if provided
    if (cropName !== undefined) listing.cropName = cropName
    if (category !== undefined) listing.category = category
    if (description !== undefined) listing.description = description
    if (basePrice !== undefined) listing.basePrice = Number(basePrice)
    if (quantity !== undefined) listing.quantity = Number(quantity)
    if (unit !== undefined) listing.unit = unit
    if (availableQuantity !== undefined) listing.availableQuantity = Number(availableQuantity)
    if (location !== undefined) listing.location = location
    if (images !== undefined) listing.images = images
    if (tags !== undefined) listing.tags = tags
    if (status !== undefined) listing.status = status

    // Update timestamp
    listing.updatedAt = new Date()

    await listing.save()
    return res.json({ status: 'success', data: listing })
  } catch (e) {
    console.error('Error updating listing:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

// Partial update listing (PATCH) - for backward compatibility
router.patch('/listings/:id', authenticate, authorize('farmer','partner','admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ status: 'error', message: 'Listing not found' })
    if (listing.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' })
    }
    const { status, description, images, basePrice, quantity } = req.body || {}
    if (status) listing.status = status
    if (description !== undefined) listing.description = description
    if (images !== undefined) listing.images = images
    if (basePrice !== undefined) listing.basePrice = Number(basePrice)
    if (quantity !== undefined) listing.quantity = Number(quantity)
    await listing.save()
    return res.json({ status: 'success', data: listing })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

router.patch('/listings/:id/unpublish', authenticate, authorize('farmer','partner','admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ status: 'error', message: 'Listing not found' })
    if (listing.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' })
    }
    listing.status = 'inactive'
    await listing.save()
    return res.json({ status: 'success', data: listing })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

// Order details suite
router.get('/orders/:id', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email phone')
    .populate('items.listing', 'cropName images price farmer')
    .populate('items.listing.farmer', 'name email phone')
  if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' })
  if (order.buyer._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' })
  }
  return res.json({ status: 'success', data: order })
})

// Download order receipt
router.get('/orders/:id/receipt', authenticate, async (req, res) => {
  try {
    console.log('📄 Generating receipt for order:', req.params.id)
    
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'buyer',
        select: 'name email phone profile.phone'
      })
      .populate({
        path: 'items.listing',
        select: 'cropName images farmer',
        populate: {
          path: 'farmer',
          select: 'name email phone location profile.phone profile.farmName'
        }
      })

    if (!order) {
      console.log('❌ Order not found:', req.params.id)
      return res.status(404).json({ status: 'error', message: 'Order not found' })
    }

    console.log('✅ Order found:', {
      orderId: order._id,
      buyerId: order.buyer._id,
      userId: req.user.id,
      orderNumber: order.orderNumber
    })

    // Debug farmer data
    if (order.items && order.items.length > 0) {
      console.log('🔍 Farmer data debug:', {
        farmerName: order.items[0].listing?.farmer?.name,
        farmerPhone: order.items[0].listing?.farmer?.phone,
        farmerProfilePhone: order.items[0].listing?.farmer?.profile?.phone,
        farmerLocation: order.items[0].listing?.farmer?.location,
        farmerProfileFarmName: order.items[0].listing?.farmer?.profile?.farmName,
        farmerEmail: order.items[0].listing?.farmer?.email
      })
    }

    // Check if user has access to this order
    if (order.buyer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('❌ Access denied for order:', req.params.id)
      return res.status(403).json({ status: 'error', message: 'Forbidden' })
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Receipt is only available for paid orders'
      })
    }

    const addr = order.shippingAddress || {}

    // Generate receipt data
    const receiptData = {
      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      buyer: {
        name: order.buyer.name,
        email: order.buyer.email,
        phone: order.buyer.phone || order.buyer.profile?.phone || 'Not provided'
      },
      items: order.items.map(item => ({
        cropName: item.listing?.cropName || 'Unknown Product',
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total,
        farmer: {
          name: item.listing?.farmer?.name || 'Unknown Farmer',
          farmName: item.listing?.farmer?.profile?.farmName || item.listing?.farmer?.location || 'Farm location not specified',
          phone: item.listing?.farmer?.phone || item.listing?.farmer?.profile?.phone || 'Not provided',
          email: item.listing?.farmer?.email || 'Not provided'
        }
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentReference: order.paymentReference || undefined,
      paidAt: order.paidAt
        ? new Date(order.paidAt).toLocaleString('en-NG')
        : order.updatedAt
          ? new Date(order.updatedAt).toLocaleString('en-NG')
          : undefined,
      shippingAddress: {
        street: addr.street || 'Not provided',
        city: addr.city || '',
        state: addr.state || '',
        country: addr.country || 'Nigeria',
        phone: addr.phone || order.buyer.phone || order.buyer.profile?.phone || 'Not provided',
      },
      deliveryInstructions: order.deliveryInstructions
    }

    console.log('✅ Receipt data generated successfully for order:', receiptData.orderNumber)

    // Receipt payload for client-side branded PDF (ReceiptGenerator)
    res.setHeader('Content-Type', 'application/json')
    return res.json({
      status: 'success',
      data: receiptData,
      message: 'Receipt data ready for PDF generation'
    })
  } catch (error) {
    console.error('❌ Receipt generation error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    })
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate receipt'
    })
  }
})

router.get('/orders/buyer/:buyerId', authenticate, async (req, res) => {
  if (req.user.id !== req.params.buyerId && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' })
  }
  const orders = await Order.find({ buyer: req.params.buyerId }).sort({ createdAt: -1 })
  return res.json({ status: 'success', data: orders })
})

router.patch('/orders/:id/status', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('seller', 'name email phone profile.phone profile.farmName')
      .populate({
        path: 'items.listing',
        select: 'farmer',
        populate: { path: 'farmer', select: 'partner' }
      })
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' })
    
    const { status } = req.body || {}
    if (!status) return res.status(400).json({ status: 'error', message: 'status required' })
    
    // Check permissions based on user role and status change
    if (req.user.role === 'farmer') {
      // Farmers can only update orders for their listings
      const hasListing = order.items.some(i => {
        const farmerId = i.listing?.farmer?._id || i.listing?.farmer
        return farmerId?.toString() === req.user.id
      })
      if (!hasListing) return res.status(403).json({ status: 'error', message: 'Forbidden' })
    } else if (req.user.role === 'partner') {
      // Partners can only update orders involving their referred farmers' listings
      const hasRelatedFarmer = order.items.some(i => {
        const farmer = i.listing?.farmer
        return farmer?.partner?.toString() === req.user.id
      })
      if (!hasRelatedFarmer) return res.status(403).json({ status: 'error', message: 'Forbidden' })
    } else if (req.user.role === 'buyer') {
      // Buyers can only cancel their own orders (and only if status is pending)
      if (order.buyer.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' })
      }
      if (status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Only pending orders can be cancelled' 
        })
      }
      // Buyers can only cancel orders, not change to other statuses
      if (status !== 'cancelled') {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Buyers can only cancel orders' 
        })
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' })
    }
    
    // When cancelling a paid order, restore listing inventory (stock was decremented on payment)
    const wasPaid = order.paymentStatus === 'paid' || ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
    if (status === 'cancelled' && wasPaid && order.status !== 'cancelled') {
      const session = await mongoose.startSession()
      session.startTransaction()
      try {
        for (const item of order.items) {
          const listingId = item.listing?._id || item.listing
          if (!listingId) continue
          await Listing.findByIdAndUpdate(
            listingId,
            { $inc: { availableQuantity: Number(item.quantity) || 0 } },
            { session }
          )
        }
        order.status = status
        order.updatedAt = new Date()
        await order.save({ session })
        await session.commitTransaction()
        session.endSession()
        return res.json({ status: 'success', data: order })
      } catch (txErr) {
        await session.abortTransaction()
        session.endSession()
        throw txErr
      }
    }

    order.status = status
    order.updatedAt = new Date()
    await order.save()
    
    console.log(`✅ Order ${order._id} status updated to ${status} by ${req.user.role}`)
    
    return res.json({ status: 'success', data: order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to update order status' })
  }
})

router.get('/orders/:id/tracking', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' })
  if (order.buyer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' })
  }
  // Minimal tracking stub
  return res.json({ status: 'success', data: { trackingNumber: order.trackingNumber || null, status: order.status, updatedAt: order.updatedAt } })
})

// Cart quantity management
router.post('/cart/reserve', authenticate, marketplaceController.reserveCartQuantity)
router.post('/cart/release', authenticate, marketplaceController.releaseCartQuantity)
router.patch('/cart/item-quantity', authenticate, marketplaceController.updateCartItemQuantity)

// Sold-out products cleanup (admin only)
router.post('/cleanup-sold-out', authenticate, authorize('admin'), marketplaceController.cleanupSoldOutProducts)

// Inventory cleanup service management (admin only)
router.get('/cleanup-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const inventoryCleanupService = require('../services/inventory-cleanup.service')
    const stats = await inventoryCleanupService.getCleanupStats()
    
    res.json({
      status: 'success',
      data: stats
    })
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cleanup stats'
    })
  }
})

router.post('/cleanup-manual', authenticate, authorize('admin'), async (req, res) => {
  try {
    const inventoryCleanupService = require('../services/inventory-cleanup.service')
    await inventoryCleanupService.manualCleanup()
    
    res.json({
      status: 'success',
      message: 'Manual cleanup completed'
    })
  } catch (error) {
    console.error('❌ Error running manual cleanup:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to run manual cleanup'
    })
  }
})

// Get buyer activity and testimonials for showing proof of offtakers
router.get('/buyer-activity', async (req, res) => {
  try {
    console.log('📊 Fetching buyer activity data...')

    // Get active buyers count (users who have placed orders in the last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeBuyersCount = await Order.distinct('buyer', {
      createdAt: { $gte: thirtyDaysAgo },
      paymentStatus: 'paid'
    })

    // Get transactions count for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysTransactions = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      paymentStatus: 'paid'
    })

    // Get recent buyer testimonials from real, approved reviews that have a comment
    const recentReviews = await Review.find({ status: 'approved', comment: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('buyer', 'name location businessType')

    const testimonials = recentReviews.map(review => ({
      id: review._id,
      buyerType: review.buyer?.businessType || 'Buyer',
      location: review.buyer?.location || 'Nigeria',
      testimonial: review.comment,
      rating: review.rating,
      daysAgo: Math.floor((Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    }))

    // Calculate real average rating across all approved reviews
    const ratingAgg = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ])
    const averageRating = ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : 0

    // Get recent buyer activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const recentActivity = await Order.countDocuments({
      createdAt: { $gte: last24Hours },
      paymentStatus: 'paid'
    })

    const buyerActivityData = {
      activeBuyers: activeBuyersCount.length,
      todaysTransactions: todaysTransactions,
      recentActivity: recentActivity,
      averageRating: averageRating,
      testimonials: testimonials
    }

    console.log('✅ Buyer activity data fetched:', {
      activeBuyers: buyerActivityData.activeBuyers,
      todaysTransactions: buyerActivityData.todaysTransactions,
      recentActivity: buyerActivityData.recentActivity
    })

    res.json({
      status: 'success',
      data: buyerActivityData
    })

  } catch (error) {
    console.error('❌ Error fetching buyer activity:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch buyer activity data'
    })
  }
})

// Get real, active buyers with their genuine order history for the public buyers directory
router.get('/top-buyers', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50)

    const aggregated = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingDoc' } },
      { $unwind: { path: '$listingDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$buyer',
          orderIds: { $addToSet: '$_id' },
          categories: { $addToSet: '$listingDoc.category' },
          lastOrderAt: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          totalOrders: { $size: '$orderIds' },
          categories: 1,
          lastOrderAt: 1
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: limit }
    ])

    const buyerIds = aggregated.map(entry => entry._id)
    const buyers = await User.find({
      _id: { $in: buyerIds },
      role: 'buyer',
      status: 'active'
    }).select('name businessType location createdAt')

    const buyerById = new Map(buyers.map(b => [b._id.toString(), b]))

    const now = new Date()
    const getRecentActivity = (lastOrderAt) => {
      if (!lastOrderAt) return 'No recent activity'
      const days = Math.floor((now.getTime() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24))
      if (days < 1) return 'Active today'
      if (days === 1) return 'Active yesterday'
      if (days <= 7) return 'Active this week'
      if (days <= 30) return 'Active this month'
      return 'Inactive'
    }

    const result = aggregated
      .filter(entry => buyerById.has(entry._id.toString()))
      .map(entry => {
        const buyer = buyerById.get(entry._id.toString())
        return {
          id: buyer._id,
          name: buyer.name,
          businessType: buyer.businessType || 'Buyer',
          location: buyer.location || 'Nigeria',
          joinedDate: buyer.createdAt,
          totalOrders: entry.totalOrders,
          recentActivity: getRecentActivity(entry.lastOrderAt),
          specialties: (entry.categories || []).filter(Boolean).slice(0, 3)
        }
      })

    res.json({
      status: 'success',
      data: result
    })
  } catch (error) {
    console.error('❌ Error fetching top buyers:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch buyers directory'
    })
  }
})

module.exports = router

