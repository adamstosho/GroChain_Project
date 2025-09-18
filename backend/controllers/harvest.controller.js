const Joi = require('joi')
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')
const Harvest = require('../models/harvest.model')
const User = require('../models/user.model')
const notificationController = require('./notification.controller')

const harvestSchema = Joi.object({
  cropType: Joi.string().required(),
  variety: Joi.string().optional(),
  quantity: Joi.number().required().precision(2),
  date: Joi.date().required(),
  geoLocation: Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() }).required(),
  unit: Joi.string().valid('kg','tons','pieces','bundles','bags','crates','liters').default('kg'),
  location: Joi.string().required(),
  description: Joi.string().optional(),
  quality: Joi.string().valid('excellent','good','fair','poor').default('good'),
  qualityGrade: Joi.string().valid('A','B','C').optional(),
  organic: Joi.boolean().default(false),
  moistureContent: Joi.number().min(0).max(100).optional(),
  price: Joi.number().min(0).optional(),
  images: Joi.array().items(Joi.string()).optional(),
  soilType: Joi.string().valid('clay','loam','sandy','silt','other').optional(),
  irrigationType: Joi.string().valid('rainfed','irrigated','mixed').optional(),
  pestManagement: Joi.string().valid('organic','conventional','integrated').optional(),
  certification: Joi.string().optional(),
}).unknown(true)

exports.createHarvest = async (req, res) => {
  try {
    const body = { ...req.body }
    if (!body.unit || typeof body.unit !== 'string' || body.unit.trim() === '') body.unit = 'kg'

    // Set defaults for optional fields
    if (body.quality && !body.qualityGrade) {
      body.qualityGrade = body.quality === 'excellent' ? 'A' : body.quality === 'good' ? 'B' : 'C'
    }

    const { error, value } = harvestSchema.validate(body)
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message })

    // Validate and round quantity to 2 decimal places
    value.quantity = Number(Number(value.quantity).toFixed(2))

    // Validate and round price to 2 decimal places if present
    if (value.price) {
      value.price = Number(Number(value.price).toFixed(2))
    }

    // Generate unique batch ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Get farmer details for QR code
    const farmer = await User.findById(req.user.id).select('name email profile.phone profile.farmName')

    // Prepare harvest data with structured fields
    const harvestData = {
      ...value,
      farmer: req.user.id,
      batchId,
      agriculturalData: {
        soilType: value.soilType,
        irrigationMethod: value.irrigationType,
        pestControl: value.pestManagement,
        fertilizerUsed: value.certification
      },
      qualityMetrics: {
        moistureContent: value.moistureContent,
        sizeGrade: value.qualityGrade
      },
      sustainability: {
        organicCertified: value.organic || false
      }
    }

    // Remove fields that are now in sub-objects
    delete harvestData.soilType
    delete harvestData.irrigationType
    delete harvestData.pestManagement
    delete harvestData.certification
    delete harvestData.moistureContent
    delete harvestData.qualityGrade
    delete harvestData.organic

    const harvest = await Harvest.create(harvestData)

    // Create notification for farmer
    try {
      await notificationController.createNotificationForActivity(
        req.user.id,
        'farmer',
        'harvest',
        'logged',
        {
          cropType: harvest.cropType,
          batchId: harvest.batchId,
          actionUrl: `/dashboard/harvests/${harvest._id}`
        }
      )
    } catch (notificationError) {
      console.error('Failed to create harvest logged notification:', notificationError)
    }

    // Notify admins about new harvest
    try {
      await notificationController.notifyAdmins(
        'farmer',
        'harvestLogged',
        {
          farmerName: farmer.name,
          cropType: harvest.cropType,
          batchId: harvest.batchId,
          actionUrl: `/admin/harvests/${harvest._id}`
        }
      )
    } catch (notificationError) {
      console.error('Failed to notify admins about harvest:', notificationError)
    }

    // Notify partner about farmer's harvest
    try {
      await notificationController.notifyPartners(
        req.user.id,
        'farmer',
        'harvestLogged',
        {
          farmerName: farmer.name,
          cropType: harvest.cropType,
          batchId: harvest.batchId,
          actionUrl: `/partner/harvests/${harvest._id}`
        }
      )
    } catch (notificationError) {
      console.error('Failed to notify partner about harvest:', notificationError)
    }

    // Removed automatic approval - harvests now require manual approval by partners/admins

    // Generate QR code automatically
    try {
      const qrData = {
        batchId: harvest.batchId,
        cropType: harvest.cropType,
        variety: harvest.variety,
        quantity: harvest.quantity,
        unit: harvest.unit,
        quality: harvest.quality,
        location: harvest.location,
        harvestDate: harvest.date,
        farmer: {
          id: farmer._id,
          name: farmer.name,
          farmName: farmer.profile?.farmName,
          phone: farmer.profile?.phone
        },
        images: harvest.images || [],
        organic: harvest.sustainability?.organicCertified,
        price: value.price,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${harvest.batchId}`,
        timestamp: new Date().toISOString()
      }

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData))

      // Update harvest with QR code
      harvest.qrCode = qrCodeImage
      harvest.qrCodeData = qrData
      await harvest.save()
    } catch (qrError) {
      console.error('QR code generation error:', qrError)
      // Don't fail the harvest creation if QR code fails
    }

    return res.status(201).json({
      status: 'success',
      harvest: {
        ...harvest.toObject(),
        qrCodeGenerated: !!harvest.qrCode
      }
    })
  } catch (e) {
    console.error('createHarvest error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getHarvests = async (req, res) => {
  try {
    const { cropType, status, page = 1, limit = 10 } = req.query
    const filter = { farmer: req.user.id }
    if (cropType) filter.cropType = new RegExp(String(cropType), 'i')
    if (status) filter.status = status
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [harvests, total] = await Promise.all([
      Harvest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Harvest.countDocuments(filter)
    ])
    return res.json({ status: 'success', harvests, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getHarvestById = async (req, res) => {
  try {
    const { id } = req.params
    const harvest = await Harvest.findOne({ _id: id, farmer: req.user.id })

    if (!harvest) {
      return res.status(404).json({ status: 'error', message: 'Harvest not found' })
    }

    return res.json({ status: 'success', harvest })
  } catch (e) {
    console.error('getHarvestById error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getProvenance = async (req, res) => {
  try {
    const { batchId } = req.params
    let harvest = await Harvest.findOne({ batchId })
    if (!harvest && /^[a-fA-F0-9]{24}$/.test(String(batchId))) {
      harvest = await Harvest.findById(batchId)
    }
    if (!harvest) return res.status(404).json({ status: 'error', message: 'Harvest not found' })
    return res.json({ status: 'success', provenance: harvest })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.verifyQRCode = async (req, res) => {
  try {
    const { batchId } = req.params
    let harvest = await Harvest.findOne({ batchId }).populate('farmer', 'name email profile phone')
    if (!harvest && /^[a-fA-F0-9]{24}$/.test(String(batchId))) {
      harvest = await Harvest.findById(batchId).populate('farmer', 'name email profile phone')
    }
    if (!harvest) return res.status(404).json({ status: 'error', message: 'QR code verification failed - harvest not found' })

    // Format location data
    let locationData = {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Nigeria',
      coordinates: null
    }

    if (harvest.location) {
      if (typeof harvest.location === 'string') {
        const locationStr = harvest.location.trim()
        if (locationStr.includes(',')) {
          const parts = locationStr.split(',')
          if (parts.length >= 2) {
            locationData.city = parts[0].trim()
            locationData.state = parts[1].trim()
          } else {
            locationData.city = locationStr
          }
        } else {
          locationData.city = locationStr
          locationData.state = 'Nigeria'
        }
      } else if (typeof harvest.location === 'object') {
        locationData = {
          city: harvest.location.city || 'Unknown',
          state: harvest.location.state || 'Unknown',
          country: harvest.location.country || 'Nigeria',
          coordinates: harvest.location.coordinates || null
        }
      }
    }

    // Return comprehensive verification data
    const verificationData = {
      batchId: harvest.batchId,
      cropType: harvest.cropType,
      variety: harvest.variety,
      quantity: harvest.quantity,
      unit: harvest.unit,
      quality: harvest.qualityGrade || harvest.quality || 'Standard',
      location: locationData,
      harvestDate: harvest.date || harvest.harvestDate,
      images: harvest.images || [],
      organic: harvest.sustainability?.organicCertified || false,
      price: harvest.price,
      status: harvest.status,
      farmer: {
        id: harvest.farmer._id || harvest.farmer,
        name: harvest.farmer.name || 'Unknown Farmer',
        farmName: harvest.farmer.profile?.farmName || `${locationData.city} Farm`,
        phone: harvest.farmer.profile?.phone || harvest.farmer.phone,
        email: harvest.farmer.email
      },
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${harvest.batchId}`,
      timestamp: new Date().toISOString(),
      verified: true
    }

    return res.json({ status: 'success', data: verificationData })
  } catch (e) {
    console.error('QR verification error:', e)
    return res.status(500).json({ status: 'error', message: 'QR code verification failed' })
  }
}

exports.getHarvestVerification = async (req, res) => {
  try {
    const { batchId } = req.params
    let harvest = await Harvest.findOne({ batchId }).populate('farmer', 'name email profile')
    if (!harvest && /^[a-fA-F0-9]{24}$/.test(String(batchId))) {
      harvest = await Harvest.findById(batchId).populate('farmer', 'name email profile')
    }
    if (!harvest) return res.status(404).json({ status: 'error', message: 'Harvest not found' })

    // Format data for verification page
    const verificationData = {
      batchId: harvest.batchId,
      cropType: harvest.cropType,
      variety: harvest.variety,
      quantity: harvest.quantity,
      unit: harvest.unit,
      quality: harvest.quality,
      location: harvest.location,
      harvestDate: harvest.date,
      farmer: {
        id: harvest.farmer._id || harvest.farmer,
        name: harvest.farmer.name,
        farmName: harvest.farmer.profile?.farmName,
        phone: harvest.farmer.profile?.phone
      },
      images: harvest.images || [],
      organic: harvest.sustainability?.organicCertified,
      price: harvest.price,
      status: harvest.status,
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${harvest.batchId}`,
      timestamp: new Date().toISOString()
    }

    return res.json(verificationData)
  } catch (e) {
    console.error('getHarvestVerification error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getProductProvenance = async (req, res) => {
  try {
    const { productId } = req.params
    
    // For now, we'll simulate product provenance by looking up harvests
    // In a real implementation, this would link to a product model
    const harvest = await Harvest.findById(productId)
    if (!harvest) return res.status(404).json({ status: 'error', message: 'Product not found' })
    
    const provenance = {
      productId: harvest._id,
      batchId: harvest.batchId,
      cropType: harvest.cropType,
      harvestDate: harvest.date,
      farmer: harvest.farmer,
      location: harvest.location,
      quality: harvest.quality,
      supplyChain: [
        {
          stage: 'harvest',
          date: harvest.date,
          location: harvest.location,
          actor: harvest.farmer,
          status: 'completed'
        }
      ]
    }
    
    return res.json({ status: 'success', data: provenance })
  } catch (e) {
    console.error('Product provenance error:', e)
    return res.status(500).json({ status: 'error', message: 'Failed to get product provenance' })
  }
}

exports.getHarvestStats = async (req, res) => {
  try {
    const farmerId = req.user.id
    const mongoose = require('mongoose')
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId)

    // Get harvest statistics for the farmer
    const stats = await Harvest.aggregate([
      { $match: { farmer: farmerObjectId } },
      {
        $group: {
          _id: null,
          totalHarvests: { $sum: 1 },
          pendingHarvests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedHarvests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedHarvests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          verifiedHarvests: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' },
          avgQuality: { $avg: { $cond: [{ $eq: ['$quality', 'excellent'] }, 4, { $cond: [{ $eq: ['$quality', 'good'] }, 3, { $cond: [{ $eq: ['$quality', 'fair'] }, 2, 1] }] }] } }
        }
      }
    ])

    const result = stats[0] || {
      totalHarvests: 0,
      pendingHarvests: 0,
      approvedHarvests: 0,
      rejectedHarvests: 0,
      verifiedHarvests: 0,
      totalQuantity: 0,
      totalValue: 0,
      avgQuality: 0
    }

    // Convert quality score back to string
    let qualityString = 'poor'
    if (result.avgQuality >= 3.5) qualityString = 'excellent'
    else if (result.avgQuality >= 2.5) qualityString = 'good'
    else if (result.avgQuality >= 1.5) qualityString = 'fair'

    return res.json({
      status: 'success',
      data: {
        totalHarvests: result.totalHarvests,
        pendingHarvests: result.pendingHarvests,
        approvedHarvests: result.approvedHarvests,
        rejectedHarvests: result.rejectedHarvests,
        verifiedHarvests: result.verifiedHarvests,
        totalQuantity: result.totalQuantity || 0,
        totalValue: result.totalValue || 0,
        averageQuality: qualityString
      }
    })
  } catch (e) {
    console.error('getHarvestStats error:', e)
    return res.status(500).json({ status: 'error', message: 'Failed to get harvest statistics' })
  }
}

exports.getHarvestAnalytics = async (req, res) => {
  try {
    const farmerId = req.user.id
    const mongoose = require('mongoose')
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId)
    const { timeRange = '12months' } = req.query

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '12months':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case '24months':
        startDate.setFullYear(now.getFullYear() - 2)
        break
      default:
        startDate.setFullYear(now.getFullYear() - 1)
    }

    // Get harvest analytics data
    const analytics = await Harvest.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalHarvests: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' },
          avgQuality: { $avg: { $cond: [{ $eq: ['$quality', 'excellent'] }, 4, { $cond: [{ $eq: ['$quality', 'good'] }, 3, { $cond: [{ $eq: ['$quality', 'fair'] }, 2, 1] }] }] } },
          cropTypes: { $addToSet: '$cropType' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    // Get overall statistics
    const overallStats = await Harvest.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          totalHarvests: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' },
          avgQuality: { $avg: { $cond: [{ $eq: ['$quality', 'excellent'] }, 4, { $cond: [{ $eq: ['$quality', 'good'] }, 3, { $cond: [{ $eq: ['$quality', 'fair'] }, 2, 1] }] }] } },
          cropTypes: { $addToSet: '$cropType' },
          topCrop: { $first: '$cropType' }
        }
      }
    ])

    // Get crop distribution
    const cropDistribution = await Harvest.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$cropType',
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { quantity: -1 }
      }
    ])

    // Get quality distribution
    const qualityDistribution = await Harvest.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$quality',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Convert quality score to string
    let qualityString = 'poor'
    if (overallStats[0]?.avgQuality >= 3.5) qualityString = 'excellent'
    else if (overallStats[0]?.avgQuality >= 2.5) qualityString = 'good'
    else if (overallStats[0]?.avgQuality >= 1.5) qualityString = 'fair'

    // Calculate total quantity for percentage calculations
    const totalQuantity = overallStats[0]?.totalQuantity || 1 // Avoid division by zero
    const totalHarvests = overallStats[0]?.totalHarvests || 1

    // Process crop distribution with percentages and colors
    const cropColors = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
    const processedCropDistribution = cropDistribution.map((crop, index) => ({
      crop: crop._id || 'Unknown',
      quantity: crop.quantity || 0,
      percentage: Math.round((crop.quantity / totalQuantity) * 100) || 0,
      color: cropColors[index % cropColors.length]
    }))

    // Process quality distribution with percentages
    const processedQualityDistribution = qualityDistribution.map(quality => ({
      quality: quality._id || 'unknown',
      count: quality.count || 0,
      percentage: Math.round((quality.count / totalHarvests) * 100) || 0
    }))

    // Calculate performance metrics based on real data
    const avgYieldPerHarvest = totalHarvests > 0 ? totalQuantity / totalHarvests : 0
    const yieldEfficiency = Math.min(100, Math.round((avgYieldPerHarvest / 50) * 100)) // Assuming 50kg is baseline
    const qualityConsistency = Math.round((processedQualityDistribution.find(q => q.quality === 'good' || q.quality === 'excellent')?.percentage || 0) + 20)
    const marketReadiness = Math.min(100, qualityConsistency + 10)
    const growthRate = 15 // This would need historical data to calculate properly

    // Find peak month from monthly trend
    const peakMonthData = analytics.reduce((peak, current) =>
      current.totalHarvests > peak.totalHarvests ? current : peak,
      analytics[0] || { _id: { month: 1 }, totalHarvests: 0 }
    )
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const peakMonth = peakMonthData ? monthNames[(peakMonthData._id.month || 1) - 1] : 'May'

    const result = {
      totalHarvests: overallStats[0]?.totalHarvests || 0,
      totalQuantity: overallStats[0]?.totalQuantity || 0,
      totalValue: overallStats[0]?.totalValue || 0,
      averageQuality: qualityString,
      topCrop: overallStats[0]?.topCrop || 'N/A',
      monthlyTrend: analytics.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        harvests: item.totalHarvests,
        quantity: item.totalQuantity,
        value: item.totalValue
      })),
      cropDistribution: processedCropDistribution,
      qualityDistribution: processedQualityDistribution,
      seasonalInsights: {
        bestSeason: totalHarvests > 0 ? 'Dry Season' : 'N/A', // Would need seasonal analysis
        peakMonth: peakMonth,
        yieldPrediction: totalQuantity > 0 ? Math.round(totalQuantity * 1.2) : 0,
        recommendations: totalHarvests > 0 ? [
          processedCropDistribution.length > 0 ? `Consider expanding ${processedCropDistribution[0]?.crop} cultivation` : 'Diversify your crop portfolio',
          qualityConsistency < 80 ? 'Focus on quality improvement for better market prices' : 'Maintain high quality standards',
          `Your peak harvesting month is ${peakMonth} - plan accordingly`
        ] : ['Start logging your harvests to get personalized recommendations']
      },
      performanceMetrics: {
        yieldEfficiency: yieldEfficiency,
        qualityConsistency: Math.min(100, qualityConsistency),
        marketReadiness: marketReadiness,
        growthRate: growthRate
      }
    }

    return res.json({
      status: 'success',
      data: result
    })
  } catch (e) {
    console.error('getHarvestAnalytics error:', e)
    return res.status(500).json({ status: 'error', message: 'Failed to get harvest analytics' })
  }
}

exports.deleteHarvest = async (req, res) => {
  try {
    const { id } = req.params
    const harvest = await Harvest.findById(id)
    if (!harvest) return res.status(404).json({ status: 'error', message: 'Harvest not found' })
    if (String(harvest.farmer) !== req.user.id) return res.status(403).json({ status: 'error', message: 'Forbidden' })
    await harvest.deleteOne()
    return res.json({ status: 'success', message: 'Harvest deleted', data: { id } })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.exportHarvests = async (req, res) => {
  try {
    const farmerId = req.user.id
    const { format = 'pdf', status, cropType, fromDate, toDate } = req.query

    // Build filter
    const filter = { farmer: farmerId }
    if (status && status !== 'all') filter.status = status
    if (cropType && cropType !== 'all') filter.cropType = new RegExp(String(cropType), 'i')
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    const harvests = await Harvest.find(filter)
      .populate('farmer', 'name email profile')
      .sort({ createdAt: -1 })

    if (format === 'pdf') {
      // For now, return JSON data that can be used to generate PDF on frontend
      // In production, you'd use a library like pdfkit or puppeteer
      const exportData = {
        farmer: harvests[0]?.farmer?.name || 'Unknown Farmer',
        farmName: harvests[0]?.farmer?.profile?.farmName || 'Unknown Farm',
        exportDate: new Date().toISOString(),
        totalHarvests: harvests.length,
        harvests: harvests.map(h => ({
          batchId: h.batchId,
          cropType: h.cropType,
          variety: h.variety,
          quantity: h.quantity,
          unit: h.unit,
          quality: h.quality,
          qualityGrade: h.qualityGrade,
          location: h.location,
          harvestDate: h.date,
          status: h.status,
          price: h.price,
          organic: h.sustainability?.organicCertified,
          description: h.description
        }))
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename=harvests-export-${Date.now()}.json`)
      return res.json(exportData)
    }

    // For CSV format
    if (format === 'csv') {
      const csvData = harvests.map(h => ({
        'Batch ID': h.batchId,
        'Crop Type': h.cropType,
        'Variety': h.variety,
        'Quantity': h.quantity,
        'Unit': h.unit,
        'Quality': h.quality,
        'Quality Grade': h.qualityGrade,
        'Location': h.location,
        'Harvest Date': h.date,
        'Status': h.status,
        'Price': h.price,
        'Organic': h.sustainability?.organicCertified ? 'Yes' : 'No',
        'Description': h.description
      }))

      const csvString = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=harvests-export-${Date.now()}.csv`)
      return res.send(csvString)
    }

    return res.status(400).json({ status: 'error', message: 'Invalid export format' })

  } catch (e) {
    console.error('Export error:', e)
    return res.status(500).json({ status: 'error', message: 'Export failed' })
  }
}

exports.updateHarvest = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    const farmerId = req.user.id

    // Find the harvest and ensure it belongs to the authenticated user
    const harvest = await Harvest.findById(id)
    if (!harvest) {
      return res.status(404).json({ status: 'error', message: 'Harvest not found' })
    }

    if (String(harvest.farmer) !== farmerId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update this harvest' })
    }

    // Update the harvest
    const updatedHarvest = await Harvest.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('farmer', 'name email')

    if (!updatedHarvest) {
      return res.status(404).json({ status: 'error', message: 'Harvest not found after update' })
    }

    return res.json({
      status: 'success',
      message: 'Harvest updated successfully',
      data: updatedHarvest
    })
  } catch (e) {
    console.error('updateHarvest error:', e)
    return res.status(500).json({
      status: 'error',
      message: e.message || 'Failed to update harvest'
    })
  }
}

