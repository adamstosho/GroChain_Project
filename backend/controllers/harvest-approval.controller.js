const mongoose = require('mongoose')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const User = require('../models/user.model')
const Notification = require('../models/notification.model')

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

const harvestApprovalController = {
  // Get all harvests for approvals dashboard (pending, approved, rejected)
  async getAllHarvests(req, res) {
    try {
      const { page = 1, limit = 20, cropType, location, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      console.log('=== GET ALL HARVESTS ===')
      console.log('User:', req.user.email, 'Role:', req.user.role)
      console.log('Query params:', { page, limit, cropType, location, sortBy, sortOrder })

      // Build base query - include all harvests (pending, approved, rejected)
      const query = { status: { $in: ['pending', 'approved', 'rejected', 'revision_requested'] } }

      // Add partner filtering for non-admin users
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          console.log('No partner profile found for user:', req.user.email)
          query.farmer = { $in: [] } // Return no results
        } else {
          // Find farmers that belong to this partner
          const User = require('../models/user.model')
          const partnerFarmers = await User.find({ partner: partner._id }, '_id')
          const farmerIds = partnerFarmers.map(f => f._id)

          console.log('Partner found:', partner.name, partner._id)
          console.log('Partner farmers found:', partnerFarmers.length)
          console.log('Farmer IDs:', farmerIds)

          query.farmer = { $in: farmerIds }
        }

        console.log('Final query:', JSON.stringify(query, null, 2))
      }

      // Add other filters
      if (cropType) query.cropType = cropType
      if (location) query.location = location

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [harvests, total] = await Promise.all([
        Harvest.find(query)
          .populate({
            path: 'farmer',
            select: 'name email phone location partner',
            populate: {
              path: 'partner',
              select: 'name organization'
            }
          })
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Harvest.countDocuments(query)
      ])

      console.log('Query results:')
      console.log('- Total harvests:', total)
      console.log('- Returned harvests:', harvests.length)
      console.log('- Sample harvest:', harvests[0] ? {
        id: harvests[0]._id,
        farmer: harvests[0].farmer?.name,
        cropType: harvests[0].cropType,
        status: harvests[0].status
      } : 'None')

      res.json({
        status: 'success',
        data: {
          harvests,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting all harvests:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get harvests'
      })
    }
  },

  // Get harvests pending approval
  async getPendingHarvests(req, res) {
    try {
      const { page = 1, limit = 20, cropType, location, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      console.log('=== GET PENDING HARVESTS ===')
      console.log('User:', req.user.email, 'Role:', req.user.role)
      console.log('Query params:', { page, limit, cropType, location, sortBy, sortOrder })

      // Build base query - only pending harvests
      const query = { status: 'pending' }

      // Add partner filtering for non-admin users
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          console.log('No partner profile found for user:', req.user.email)
          query.farmer = { $in: [] } // Return no results
        } else {
          // Find farmers that belong to this partner
          const User = require('../models/user.model')
          const partnerFarmers = await User.find({ partner: partner._id }, '_id')
          const farmerIds = partnerFarmers.map(f => f._id)

          console.log('Partner found:', partner.name, partner._id)
          console.log('Partner farmers found:', partnerFarmers.length)
          console.log('Farmer IDs:', farmerIds)

          query.farmer = { $in: farmerIds }
        }

        console.log('Final query:', JSON.stringify(query, null, 2))
      }

      // Add other filters
      if (cropType) query.cropType = cropType
      if (location) query.location = location

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      const [harvests, total] = await Promise.all([
        Harvest.find(query)
          .populate({
            path: 'farmer',
            select: 'name email phone location partner',
            populate: {
              path: 'partner',
              select: 'name organization'
            }
          })
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Harvest.countDocuments(query)
      ])

      console.log('Query results:')
      console.log('- Total pending harvests:', total)
      console.log('- Returned harvests:', harvests.length)
      console.log('- Sample harvest:', harvests[0] ? {
        id: harvests[0]._id,
        farmer: harvests[0].farmer?.name,
        cropType: harvests[0].cropType,
        status: harvests[0].status
      } : 'None')

      res.json({
        status: 'success',
        data: {
          harvests,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting pending harvests:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get pending harvests'
      })
    }
  },

  // Approve harvest
  async approveHarvest(req, res) {
    try {
      console.log('=== APPROVE HARVEST START ===')
      const { harvestId } = req.params
      const { quality, notes, agriculturalData, qualityMetrics } = req.body

      console.log('Request params:', { harvestId })
      console.log('Request body:', { quality, notes })
      console.log('User info:', { id: req.user?.id, email: req.user?.email, role: req.user?.role })

      // TEMPORARY: Skip authentication for testing - REMOVE THIS IN PRODUCTION
      if (!req.user) {
        console.log('⚠️ TEMPORARY: Skipping authentication for testing')
        req.user = {
          _id: '507f1f77bcf86cd799439011', // Mock admin user ID
          id: '507f1f77bcf86cd799439011',
          role: 'admin',
          email: 'test@grochain.com',
          name: 'Test Admin'
        }
      }

      if (!['partner', 'admin'].includes(req.user.role)) {
        console.log('Role check failed:', req.user.role)
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can approve harvests'
        })
      }

      console.log('Finding harvest:', harvestId)
      const harvest = await Harvest.findById(harvestId).populate('farmer', 'partner')
      if (!harvest) {
        console.log('Harvest not found:', harvestId)
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }

      console.log('Harvest found:', {
        id: harvest._id,
        status: harvest.status,
        farmer: harvest.farmer?._id,
        farmerPartner: harvest.farmer?.partner
      })

      // Check if partner owns this farmer (for partner role)
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          console.log('Partner authorization failed: No partner profile found for user:', req.user.email)
          return res.status(403).json({
            status: 'error',
            message: 'Partner profile not found'
          })
        }

        // Check if the harvest farmer belongs to this partner
        if (harvest.farmer.partner.toString() !== partner._id.toString()) {
          console.log('Partner authorization failed:', {
            harvestFarmerPartner: harvest.farmer.partner,
            partnerId: partner._id,
            userEmail: req.user.email
          })
          return res.status(403).json({
            status: 'error',
            message: 'You can only approve harvests from farmers in your network'
          })
        }

        console.log('Partner authorization passed:', {
          partnerName: partner.name,
          farmerBelongsToPartner: true
        })
      }

      if (harvest.status !== 'pending') {
        console.log('Harvest status check failed:', harvest.status)
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is not pending approval'
        })
      }

      console.log('Updating harvest...')
      // Update harvest with approval details
      harvest.status = 'approved'
      harvest.verifiedBy = req.user.id
      harvest.verifiedAt = new Date()
      harvest.quality = quality || harvest.quality

      if (agriculturalData) {
        harvest.agriculturalData = { ...harvest.agriculturalData, ...agriculturalData }
      }

      if (qualityMetrics) {
        harvest.qualityMetrics = { ...harvest.qualityMetrics, ...qualityMetrics }
      }

      console.log('Saving harvest...')
      await harvest.save()
      console.log('Harvest saved successfully')

      console.log('Creating notification...')
      // Create notification for farmer
      await Notification.create({
        user: harvest.farmer,
        title: 'Harvest Approved',
        message: `Your ${harvest.cropType} harvest has been approved with ${harvest.quality} quality rating.`,
        type: 'success',
        category: 'harvest',
        data: { harvestId: harvest._id, quality: harvest.quality }
      })
      console.log('Notification created')

      console.log('=== APPROVE HARVEST SUCCESS ===')
      res.json({
        status: 'success',
        message: 'Harvest approved successfully',
        data: harvest
      })
    } catch (error) {
      console.error('=== APPROVE HARVEST ERROR ===')
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve harvest',
        details: error.message
      })
    }
  },

  // Reject harvest
  async rejectHarvest(req, res) {
    try {
      console.log('=== REJECT HARVEST START ===')
      const { harvestId } = req.params
      const { rejectionReason, notes } = req.body

      console.log('Request params:', { harvestId })
      console.log('Request body:', { rejectionReason, notes })
      console.log('User info:', { id: req.user?.id, email: req.user?.email, role: req.user?.role })

      // TEMPORARY: Skip authentication for testing - REMOVE THIS IN PRODUCTION
      if (!req.user) {
        console.log('⚠️ TEMPORARY: Skipping authentication for testing')
        req.user = {
          _id: '507f1f77bcf86cd799439011', // Mock admin user ID
          id: '507f1f77bcf86cd799439011',
          role: 'admin',
          email: 'test@grochain.com',
          name: 'Test Admin'
        }
      }

      if (!['partner', 'admin'].includes(req.user.role)) {
        console.log('Role check failed:', req.user.role)
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can reject harvests'
        })
      }
      
      if (!rejectionReason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required'
        })
      }

      const harvest = await Harvest.findById(harvestId).populate('farmer', 'partner')
      if (!harvest) {
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }

      // Check if partner owns this farmer (for partner role)
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          return res.status(403).json({
            status: 'error',
            message: 'Partner profile not found'
          })
        }

        // Check if the harvest farmer belongs to this partner
        if (harvest.farmer.partner.toString() !== partner._id.toString()) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only reject harvests from farmers in your network'
          })
        }
      }
      
      if (harvest.status !== 'pending') {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is not pending approval'
        })
      }
      
      // Update harvest with rejection details
      harvest.status = 'rejected'
      harvest.verifiedBy = req.user.id
      harvest.verifiedAt = new Date()
      harvest.rejectionReason = rejectionReason
      
      await harvest.save()
      
      // Create notification for farmer
      await Notification.create({
        user: harvest.farmer,
        title: 'Harvest Rejected',
        message: `Your ${harvest.cropType} harvest has been rejected. Reason: ${rejectionReason}`,
        type: 'warning',
        category: 'harvest',
        data: { harvestId: harvest._id, rejectionReason }
      })
      
      res.json({
        status: 'success',
        message: 'Harvest rejected successfully',
        data: harvest
      })
    } catch (error) {
      console.error('Error rejecting harvest:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to reject harvest'
      })
    }
  },

  // Request harvest revision
  async requestRevision(req, res) {
    try {
      const { harvestId } = req.params
      const { revisionNotes, requiredChanges } = req.body
      
      if (!['partner', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can request revisions'
        })
      }
      
      if (!revisionNotes) {
        return res.status(400).json({
          status: 'error',
          message: 'Revision notes are required'
        })
      }
      
      const harvest = await Harvest.findById(harvestId)
      if (!harvest) {
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }
      
      if (harvest.status !== 'pending') {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is not pending approval'
        })
      }
      
      // Update harvest status to revision requested
      harvest.status = 'revision_requested'
      harvest.revisionNotes = revisionNotes
      harvest.requiredChanges = requiredChanges
      harvest.revisionRequestedBy = req.user.id
      harvest.revisionRequestedAt = new Date()
      
      await harvest.save()
      
      // Create notification for farmer
      await Notification.create({
        user: harvest.farmer,
        title: 'Harvest Revision Requested',
        message: `Your ${harvest.cropType} harvest needs revision. Please review the feedback and resubmit.`,
        type: 'info',
        category: 'harvest',
        data: { harvestId: harvest._id, revisionNotes, requiredChanges }
      })
      
      res.json({
        status: 'success',
        message: 'Revision requested successfully',
        data: harvest
      })
    } catch (error) {
      console.error('Error requesting revision:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to request revision'
      })
    }
  },

  // Get harvest approval statistics
  async getApprovalStats(req, res) {
    try {
      const { partnerId, startDate, endDate } = req.query

      console.log('=== GET APPROVAL STATS ===')
      console.log('User:', req.user.email, 'Role:', req.user.role)

      // Build base queries for different statuses
      const baseQuery = {}

      // Add partner filtering for non-admin users
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          console.log('No partner profile found for user:', req.user.email)
          // Return empty stats for users without partner profile
          return res.json({
            status: 'success',
            data: {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              underReview: 0,
              averageQualityScore: 0,
              totalValue: 0,
              weeklyTrend: 0,
              qualityDistribution: [],
              cropDistribution: [],
              approvalRate: 0
            }
          })
        }

        // Find farmers that belong to this partner
        const User = require('../models/user.model')
        const partnerFarmers = await User.find({ partner: partner._id }, '_id')
        const farmerIds = partnerFarmers.map(f => f._id)
        baseQuery.farmer = { $in: farmerIds }

        console.log('Partner found:', partner.name, partner._id)
        console.log('Partner farmers for stats:', partnerFarmers.length)
        console.log('Farmer IDs for stats:', farmerIds)
      }

      // Add date filtering if provided
      if (startDate || endDate) {
        baseQuery.createdAt = {}
        if (startDate) baseQuery.createdAt.$gte = new Date(startDate)
        if (endDate) baseQuery.createdAt.$lte = new Date(endDate)
      }

      // Build queries for each status
      const approvedQuery = { ...baseQuery, status: 'approved' }
      const rejectedQuery = { ...baseQuery, status: 'rejected' }
      const pendingQuery = { ...baseQuery, status: 'pending' }
      const revisionQuery = { ...baseQuery, status: 'revision_requested' }

      const [totalApproved, totalRejected, totalPending, totalRevision] = await Promise.all([
        Harvest.countDocuments(approvedQuery),
        Harvest.countDocuments(rejectedQuery),
        Harvest.countDocuments(pendingQuery),
        Harvest.countDocuments(revisionQuery)
      ])
      
      // Get quality distribution for approved harvests
      const qualityDistribution = await Harvest.aggregate([
        { $match: approvedQuery },
        { $group: { _id: '$quality', count: { $sum: 1 } } }
      ])

      // Get crop type distribution
      const cropDistribution = await Harvest.aggregate([
        { $match: approvedQuery },
        { $group: { _id: '$cropType', count: { $sum: 1 } } }
      ])
      
      // Calculate total submissions and statistics
      const total = totalApproved + totalRejected + totalPending + totalRevision
      const underReview = totalRevision

      // Calculate average quality score from quality distribution
      const qualityScores = qualityDistribution.map(q => {
        const scoreMap = { 'excellent': 9, 'good': 7, 'fair': 5, 'poor': 3 }
        return scoreMap[q._id] || 5
      })
      const averageQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0

      // Calculate total value (rough estimate)
      const totalValue = totalApproved * 5000 // Rough estimate per approved harvest

      // Calculate weekly trend (mock data for now)
      const weeklyTrend = 12.5

      console.log('Stats results:')
      console.log('- Total:', total)
      console.log('- Pending:', totalPending)
      console.log('- Approved:', totalApproved)
      console.log('- Rejected:', totalRejected)
      console.log('- Under Review:', underReview)

      res.json({
        status: 'success',
        data: {
          total,
          pending: totalPending,
          approved: totalApproved,
          rejected: totalRejected,
          underReview,
          averageQualityScore: Math.round(averageQualityScore * 10) / 10,
          totalValue,
          weeklyTrend,
          // Include additional backend-specific data
          qualityDistribution,
          cropDistribution,
          approvalRate: totalApproved + totalRejected > 0 ?
            (totalApproved / (totalApproved + totalRejected)) * 100 : 0
        }
      })
    } catch (error) {
      console.error('Error getting approval stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get approval statistics'
      })
    }
  },

  // Create listing from approved harvest
  async createListingFromHarvest(req, res) {
    try {
      const { harvestId } = req.params
      const { price, description, quantity, unit } = req.body

      console.log('Creating listing from harvest:', { harvestId, price, description, quantity, unit })

      if (!price || Number(price) <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid price is required'
        })
      }

      const harvest = await Harvest.findById(harvestId)
      if (!harvest) {
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }

      console.log('Found harvest:', {
        id: harvest._id,
        farmer: harvest.farmer,
        status: harvest.status,
        cropType: harvest.cropType,
        quantity: harvest.quantity,
        unit: harvest.unit,
        location: harvest.location,
        quality: harvest.quality
      })

      // Validate harvest has required fields with detailed checks
      if (!harvest.cropType || typeof harvest.cropType !== 'string' || harvest.cropType.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is missing valid crop type information'
        })
      }

      if (!harvest.quantity || isNaN(harvest.quantity) || harvest.quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: `Harvest has invalid quantity: ${harvest.quantity}`
        })
      }

      if (!harvest.unit || typeof harvest.unit !== 'string' || harvest.unit.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is missing valid unit information'
        })
      }

      // Additional validation for farmer
      if (!harvest.farmer || !harvest.farmer.toString()) {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest is missing farmer information'
        })
      }

      if (harvest.status !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message: `Harvest status is "${harvest.status}". Only approved harvests can be listed`
        })
      }

      if (String(harvest.farmer) !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Only the harvest owner can create listings'
        })
      }

      // Parse location from harvest.location string
      let city = 'Unknown City'
      let state = 'Unknown State'

      try {
        if (harvest.location && typeof harvest.location === 'string') {
          const locationParts = harvest.location.split(',')
          if (locationParts[0]?.trim()) city = locationParts[0].trim()
          if (locationParts[1]?.trim()) state = locationParts[1].trim()
        }
      } catch (locationError) {
        console.warn('⚠️ Error parsing location, using defaults:', locationError.message)
      }

      // Map harvest quality to listing qualityGrade
      const qualityGradeMap = {
        'excellent': 'premium',
        'good': 'standard',
        'fair': 'basic',
        'poor': 'basic'
      }
      const qualityGrade = qualityGradeMap[harvest.quality] || 'standard'

      // Validate required fields
      const finalQuantity = quantity || harvest.quantity
      const finalUnit = unit || harvest.unit

      if (!finalQuantity || finalQuantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid quantity is required'
        })
      }

      if (!finalUnit) {
        return res.status(400).json({
          status: 'error',
          message: 'Unit is required'
        })
      }

      console.log('Creating listing with data:', {
        farmer: harvest.farmer,
        harvest: harvest._id,
        cropName: harvest.cropType,
        category: getCategoryFromCropType(harvest.cropType),
        basePrice: Number(price),
        quantity: finalQuantity,
        availableQuantity: finalQuantity,
        unit: finalUnit,
        location: { city, state, country: 'Nigeria' },
        qualityGrade,
        description: description || harvest.description
      })

      // Validate all required fields before creating
      const cropName = harvest.cropType?.trim()
      const category = getCategoryFromCropType(cropName)
      const listingDescription = (description || harvest.description || `Fresh ${cropName} harvest`).trim()

      if (!cropName) {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest crop type is missing or invalid'
        })
      }

      if (!category || category === 'grains') {
        console.warn('⚠️ Category defaulted to "grains" for crop:', cropName)
      }

      if (!listingDescription) {
        return res.status(400).json({
          status: 'error',
          message: 'Description is required for listing'
        })
      }

      // Create listing with correct field names and validation
      let listing = null
      try {
        const listingData = {
          farmer: harvest.farmer,
          harvest: harvest._id,
          cropName: cropName,
          category: category,
          description: listingDescription,
          basePrice: Number(price),
          quantity: finalQuantity,
          availableQuantity: finalQuantity,
          unit: finalUnit,
          images: harvest.images || [],
          location: `${city || 'Unknown City'}, ${state || 'Unknown State'}, Nigeria`,
          qualityGrade: qualityGrade || 'standard',
          status: 'active',
          tags: harvest.quality ? [harvest.quality] : []
        }

        console.log('📝 Final listing data to create:')
        console.log('   Farmer:', listingData.farmer)
        console.log('   Crop Name:', listingData.cropName)
        console.log('   Category:', listingData.category)
        console.log('   Base Price:', listingData.basePrice)
        console.log('   Quantity:', listingData.quantity)
        console.log('   Unit:', listingData.unit)
        console.log('   Location:', listingData.location)
        console.log('   Quality Grade:', listingData.qualityGrade)

        // Check database connection before attempting to create
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database connection is not ready:', mongoose.connection.readyState)
          return res.status(500).json({
            status: 'error',
            message: 'Database connection failed. Please ensure MongoDB is running and try again.',
            dbConnectionError: true,
            readyState: mongoose.connection.readyState
          })
        }

        console.log('🏗️ Creating listing with data structure:')
        console.log('   Type of listingData:', typeof listingData)
        console.log('   Keys in listingData:', Object.keys(listingData))
        console.log('   listingData.farmer:', listingData.farmer, typeof listingData.farmer)
        console.log('   listingData.cropName:', listingData.cropName, typeof listingData.cropName)
        console.log('   listingData.category:', listingData.category, typeof listingData.category)
        console.log('   listingData.basePrice:', listingData.basePrice, typeof listingData.basePrice)
        console.log('   listingData.quantity:', listingData.quantity, typeof listingData.quantity)
        console.log('   listingData.availableQuantity:', listingData.availableQuantity, typeof listingData.availableQuantity)
        console.log('   listingData.unit:', listingData.unit, typeof listingData.unit)
        console.log('   listingData.location:', listingData.location)
        console.log('   listingData.qualityGrade:', listingData.qualityGrade, typeof listingData.qualityGrade)

        // Validate the data before creating
        try {
          const testListing = new Listing(listingData)
          const validationResult = testListing.validateSync()

          if (validationResult) {
            console.log('❌ Validation errors found:')
            Object.keys(validationResult.errors).forEach(key => {
              console.log(`   ${key}: ${validationResult.errors[key].message}`)
            })

            return res.status(400).json({
              status: 'error',
              message: 'Listing data validation failed',
              validationErrors: Object.values(validationResult.errors).map(err => err.message)
            })
          } else {
            console.log('✅ Data validation passed')
          }
        } catch (validationError) {
          console.log('❌ Validation test failed:', validationError.message)
          return res.status(400).json({
            status: 'error',
            message: 'Failed to validate listing data',
            error: validationError.message
          })
        }

        listing = await Listing.create(listingData)

        console.log('✅ Listing created successfully:', listing._id)

        // Update harvest status to listed only if listing was created successfully
        harvest.status = 'listed'
        await harvest.save()

        console.log('Harvest status updated to "listed"')

        res.status(201).json({
          status: 'success',
          message: 'Listing created successfully',
          data: { listingId: listing._id, harvestId: harvest._id }
        })

      } catch (listingError) {
        console.error('❌ Error creating listing:', listingError)
        console.error('❌ Error name:', listingError.name)
        console.error('❌ Error code:', listingError.code)
        console.error('❌ Error message:', listingError.message)

        if (listingError.name === 'ValidationError') {
          console.error('❌ Validation errors:', listingError.errors)
          const errors = Object.values(listingError.errors).map(err => err.message)
          return res.status(400).json({
            status: 'error',
            message: 'Listing validation failed',
            details: errors
          })
        }

        if (listingError.code === 11000) {
          console.error('❌ Duplicate key error - listing already exists')
          return res.status(400).json({
            status: 'error',
            message: 'A listing for this harvest already exists'
          })
        }

        if (listingError.name === 'MongoError' || listingError.name === 'MongoServerError') {
          console.error('❌ MongoDB error:', listingError)
          return res.status(500).json({
            status: 'error',
            message: 'Database error occurred while creating listing'
          })
        }

        // Handle connection errors
        if (listingError.message && listingError.message.includes('ECONNREFUSED')) {
          console.error('❌ Database connection refused')
          return res.status(500).json({
            status: 'error',
            message: 'Database connection failed. Please try again.',
            connectionError: true
          })
        }

        console.error('❌ Full error object:', listingError)
        console.error('❌ Error stack:', listingError.stack)

        console.error('❌ Unknown error type:', typeof listingError)
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create listing due to unknown error',
          errorType: listingError.name,
          errorCode: listingError.code
        })
      }
    } catch (error) {
      console.error('❌ TOP LEVEL ERROR in createListingFromHarvest:', error)
      console.error('❌ Error name:', error.name)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error code:', error.code)
      console.error('❌ Full error:', error)

      // Check for specific database errors
      if (error.name === 'ValidationError') {
        console.error('❌ Validation errors:', error.errors)
        return res.status(400).json({
          status: 'error',
          message: 'Invalid data provided for listing creation',
          details: Object.values(error.errors).map(err => err.message)
        })
      }

      if (error.code === 11000) {
        console.error('❌ Duplicate key error - listing may already exist')
        return res.status(409).json({
          status: 'error',
          message: 'A listing for this harvest already exists'
        })
      }

      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        console.error('❌ MongoDB specific error:', error)
        return res.status(500).json({
          status: 'error',
          message: 'Database error occurred while creating listing'
        })
      }

      // Catch-all for any other error
      console.error('❌ Unknown error type:', typeof error)
      return res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred while creating the listing'
      })
    }
  },

  // Bulk approve/reject harvests
  async bulkProcessHarvests(req, res) {
    try {
      const { harvestIds, action, quality, rejectionReason, notes } = req.body
      
      if (!['partner', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can bulk process harvests'
        })
      }
      
      if (!Array.isArray(harvestIds) || harvestIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest IDs are required'
        })
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          status: 'error',
          message: 'Action must be either approve or reject'
        })
      }
      
      if (action === 'reject' && !rejectionReason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required for rejections'
        })
      }
      
      // Build query with partner filtering
      const query = {
        _id: { $in: harvestIds },
        status: 'pending'
      }

      // Add partner filtering for partner role users
      if (req.user.role === 'partner') {
        // Find the partner profile for this user
        const Partner = require('../models/partner.model')
        const partner = await Partner.findOne({ email: req.user.email })

        if (!partner) {
          return res.status(403).json({
            status: 'error',
            message: 'Partner profile not found'
          })
        }

        const User = require('../models/user.model')
        const partnerFarmers = await User.find({ partner: partner._id }, '_id')
        const farmerIds = partnerFarmers.map(f => f._id)
        query.farmer = { $in: farmerIds }
      }

      const harvests = await Harvest.find(query).populate('farmer', 'partner')
      
      if (harvests.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No pending harvests found'
        })
      }
      
      const updateData = {
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      }
      
      if (action === 'approve') {
        updateData.status = 'approved'
        if (quality) updateData.quality = quality
      } else {
        updateData.status = 'rejected'
        updateData.rejectionReason = rejectionReason
      }
      
      // Update all harvests
      await Harvest.updateMany(
        { _id: { $in: harvestIds } },
        updateData
      )
      
      // Create notifications for farmers
      const notifications = harvests.map(harvest => ({
        user: harvest.farmer,
        title: `Harvest ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your ${harvest.cropType} harvest has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        type: action === 'approve' ? 'success' : 'warning',
        category: 'harvest',
        data: { 
          harvestId: harvest._id, 
          action,
          quality: action === 'approve' ? quality : undefined,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        }
      }))
      
      await Notification.insertMany(notifications)
      
      res.json({
        status: 'success',
        message: `Successfully ${action}d ${harvests.length} harvests`,
        data: { processedCount: harvests.length, action }
      })
    } catch (error) {
      console.error('Error bulk processing harvests:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to bulk process harvests'
      })
    }
  }
}

// Check current harvest data status
const getHarvestStatus = async (req, res) => {
  try {
    const Harvest = require('../models/harvest.model')
    const User = require('../models/user.model')
    const Partner = require('../models/partner.model')

    const totalHarvests = await Harvest.countDocuments()
    const pendingHarvests = await Harvest.countDocuments({ status: 'pending' })
    const approvedHarvests = await Harvest.countDocuments({ status: 'approved' })
    const rejectedHarvests = await Harvest.countDocuments({ status: 'rejected' })

    const totalUsers = await User.countDocuments()
    const farmerUsers = await User.countDocuments({ role: 'farmer' })
    const totalPartners = await Partner.countDocuments()

    // Get sample pending harvests
    const samplePending = await Harvest.find({ status: 'pending' })
      .populate('farmer', 'name email')
      .limit(3)
      .select('cropType quantity unit location')

    res.json({
      status: 'success',
      data: {
        harvests: {
          total: totalHarvests,
          pending: pendingHarvests,
          approved: approvedHarvests,
          rejected: rejectedHarvests
        },
        users: {
          total: totalUsers,
          farmers: farmerUsers
        },
        partners: totalPartners,
        samplePending: samplePending.map(h => ({
          id: h._id,
          cropType: h.cropType,
          quantity: h.quantity,
          unit: h.unit,
          farmer: h.farmer?.name || 'Unknown'
        }))
      }
    })
  } catch (error) {
    console.error('Error getting harvest status:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get harvest status',
      error: error.message
    })
  }
}

// Create sample data for testing (temporary endpoint)
const createSampleData = async (req, res) => {
  try {
    const Harvest = require('../models/harvest.model')
    const User = require('../models/user.model')
    const Partner = require('../models/partner.model')

    // Create test partner if it doesn't exist
    let partner = await Partner.findOne({ email: 'testpartner@grochain.com' })
    if (!partner) {
      partner = await Partner.create({
        name: 'Test Agricultural Partner',
        email: 'testpartner@grochain.com',
        phone: '+2348012345678',
        organization: 'Test Agricultural Cooperative',
        type: 'cooperative',
        location: 'Lagos, Nigeria',
        status: 'active',
        commissionRate: 0.05,
        farmers: [],
        totalFarmers: 0,
        totalCommissions: 0
      })
    }

    // Create test farmers
    const farmers = []
    const farmerData = [
      { name: 'John Farmer', email: 'johnfarmer@test.com', phone: '+2348011111111', location: 'Lagos' },
      { name: 'Mary Farmer', email: 'maryfarmer@test.com', phone: '+2348012222222', location: 'Abuja' },
      { name: 'Peter Farmer', email: 'peterfarmer@test.com', phone: '+2348013333333', location: 'Kano' },
      { name: 'Sarah Farmer', email: 'sarahfarmer@test.com', phone: '+2348014444444', location: 'Ondo' }
    ]

    for (const farmerInfo of farmerData) {
      let farmer = await User.findOne({ email: farmerInfo.email })
      if (!farmer) {
        farmer = await User.create({
          name: farmerInfo.name,
          email: farmerInfo.email,
          phone: farmerInfo.phone,
          password: '$2a$10$hashedpassword',
          role: 'farmer',
          location: farmerInfo.location,
          partner: partner._id,
          status: 'active'
        })
        farmers.push(farmer)
      } else {
        farmers.push(farmer)
      }
    }

    // Create test harvests
    const harvests = []
    const harvestData = [
      {
        farmer: farmers[0]._id,
        cropType: 'Tomatoes',
        quantity: 150,
        unit: 'kg',
        date: new Date('2024-01-20'),
        location: 'Lagos Farm',
        quality: 'excellent',
        images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400'],
        description: 'Fresh red tomatoes harvested this morning',
        status: 'pending',
        geoLocation: { lat: 6.5244, lng: 3.3792 } // Lagos coordinates
      },
      {
        farmer: farmers[1]._id,
        cropType: 'Cassava',
        quantity: 200,
        unit: 'kg',
        date: new Date('2024-01-19'),
        location: 'Abuja Farm',
        quality: 'good',
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'],
        description: 'Fresh cassava tubers, good size and quality',
        status: 'pending',
        geoLocation: { lat: 9.0765, lng: 7.3986 } // Abuja coordinates
      },
      {
        farmer: farmers[2]._id,
        cropType: 'Maize',
        quantity: 300,
        unit: 'kg',
        date: new Date('2024-01-18'),
        location: 'Kano Farm',
        quality: 'fair',
        images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'],
        description: 'Maize grains, some moisture content issues',
        status: 'pending',
        geoLocation: { lat: 12.0022, lng: 8.5920 } // Kano coordinates
      },
      {
        farmer: farmers[3]._id,
        cropType: 'Rice',
        quantity: 100,
        unit: 'kg',
        date: new Date('2024-01-17'),
        location: 'Ondo Farm',
        quality: 'excellent',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'],
        description: 'Premium quality rice, excellent grain size',
        status: 'pending',
        geoLocation: { lat: 7.1000, lng: 4.8417 } // Ondo coordinates
      }
    ]

    for (const harvestInfo of harvestData) {
      const harvest = await Harvest.create(harvestInfo)
      harvests.push(harvest)
    }

    // Update partner with farmers
    partner.farmers = farmers.map(f => f._id)
    partner.totalFarmers = farmers.length
    await partner.save()

    res.json({
      status: 'success',
      message: 'Sample data created successfully',
      data: {
        partner: partner.name,
        farmers: farmers.length,
        harvests: harvests.length
      }
    })
  } catch (error) {
    console.error('Error creating sample data:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to create sample data',
      error: error.message
    })
  }
}

module.exports = {
  harvestApprovalController,
  createSampleData,
  getHarvestStatus
}


