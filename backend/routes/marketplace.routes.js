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

    // Generic error handling - avoid serializing the error object
    console.log('❌ Favorites POST - Generic server error')
    const errorMessage = e?.message || 'Unknown server error'
    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred while adding to favorites'
    })
  }
})

router.delete('/favorites/:userId/:listingId', authenticate, async (req, res) => {
  const { userId, listingId } = req.params
  await Favorite.deleteOne({ user: userId, listing: listingId })
  return res.json({ status: 'success', message: 'Removed from favorites' })
})

router.post('/listings', authenticate, authorize('farmer','partner','admin'), async (req, res) => {
  // Minimal validation for test: expect cropName and price
  const { cropName, basePrice, category, description, unit, quantity, location } = req.body || {}
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
  return res.status(201).json(listing)
})

router.post('/orders', authenticate, authorize('buyer','farmer','partner','admin'), async (req, res) => {
  try {
    const {
      buyer,
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
      return res.status(400).json({ status: 'error', message: 'Items are required' })
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      return res.status(400).json({ status: 'error', message: 'Complete shipping address is required' })
    }

    // Calculate totals
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.price || 0)), 0)
    
    // Use provided shipping cost or calculate it
    let shippingCost = shipping || 0
    if (shippingCost === 0 && shippingMethod && shippingAddress) {
      // Calculate shipping based on method and location
      const calculateShippingCost = (origin, destination, weight, methodId) => {
        const SHIPPING_METHODS = {
          'road_standard': { baseRate: 0.5, weightMultiplier: 0.3, timeMultiplier: 1.0, minCost: 200, maxCost: 2000 },
          'road_express': { baseRate: 0.8, weightMultiplier: 0.5, timeMultiplier: 1.2, minCost: 300, maxCost: 3000 },
          'air': { baseRate: 2.0, weightMultiplier: 1.0, timeMultiplier: 1.5, minCost: 500, maxCost: 5000 },
          'courier': { baseRate: 1.5, weightMultiplier: 0.8, timeMultiplier: 1.3, minCost: 400, maxCost: 4000 }
        }
        
        const calculateDistance = (location1, location2) => {
          // Simplified distance calculation - in real app, use proper geocoding
          const stateDistance = {
            'Lagos': { 'Lagos': 0, 'Abuja': 500, 'Kano': 800, 'Kwara': 300, 'Ogun': 50, 'Oyo': 100 },
            'Abuja': { 'Lagos': 500, 'Abuja': 0, 'Kano': 400, 'Kwara': 200, 'Ogun': 450, 'Oyo': 400 },
            'Kano': { 'Lagos': 800, 'Abuja': 400, 'Kano': 0, 'Kwara': 600, 'Ogun': 750, 'Oyo': 700 },
            'Kwara': { 'Lagos': 300, 'Abuja': 200, 'Kano': 600, 'Kwara': 0, 'Ogun': 250, 'Oyo': 200 },
            'Ogun': { 'Lagos': 50, 'Abuja': 450, 'Kano': 750, 'Kwara': 250, 'Ogun': 0, 'Oyo': 50 },
            'Oyo': { 'Lagos': 100, 'Abuja': 400, 'Kano': 700, 'Kwara': 200, 'Ogun': 50, 'Oyo': 0 }
          }
          
          const distance = stateDistance[location1.state]?.[location2.state] || 200
          return distance
        }
        
        const method = SHIPPING_METHODS[methodId] || SHIPPING_METHODS['road_standard']
        const distance = calculateDistance(origin, destination)
        
        const baseCost = distance * method.baseRate
        const weightCost = weight * method.weightMultiplier
        let totalCost = baseCost + weightCost
        
        totalCost *= method.timeMultiplier
        totalCost = Math.max(method.minCost, Math.min(method.maxCost, totalCost))
        
        return Math.round(totalCost)
      }
      
      shippingCost = calculateShippingCost(
        { city: 'Lagos', state: 'Lagos', country: 'Nigeria' }, // Default seller location
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
      return res.status(400).json({ 
        status: 'error', 
        message: 'Unable to determine seller from listing. Please ensure the listing exists and has a valid farmer.' 
      })
    }

    // Prepare order data
    const orderData = {
      buyer: req.user.id,
      seller: seller,
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

    // Populate the created order for response
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
      shippingAddress: order.shippingAddress,
      deliveryInstructions: order.deliveryInstructions
    }

    console.log('✅ Receipt data generated successfully for order:', receiptData.orderNumber)

    // For now, return JSON data that can be used to generate PDF on frontend
    // In production, you'd use a library like pdfkit or puppeteer
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptData.orderNumber}-${Date.now()}.json`)
    return res.json({
      status: 'success',
      data: receiptData,
      message: 'Receipt data generated successfully'
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
    const order = await Order.findById(req.params.id).populate('items.listing', 'farmer')
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' })
    
    const { status } = req.body || {}
    if (!status) return res.status(400).json({ status: 'error', message: 'status required' })
    
    // Check permissions based on user role and status change
    if (req.user.role === 'farmer') {
      // Farmers can only update orders for their listings
      const hasListing = order.items.some(i => i.listing?.farmer?.toString() === req.user.id)
      if (!hasListing) return res.status(403).json({ status: 'error', message: 'Forbidden' })
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
    } else if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' })
    }
    
    // Update order status
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

module.exports = router

