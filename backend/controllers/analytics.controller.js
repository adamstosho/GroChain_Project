const Analytics = require('../models/analytics.model')
const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const Order = require('../models/order.model')
const CreditScore = require('../models/credit-score.model')
const Partner = require('../models/partner.model')
const mongoose = require('mongoose')

// Add export helpers
const ExcelJS = require('exceljs')
const { createObjectCsvStringifier } = require('csv-writer')

// Helper functions for analytics calculations
function getCropColor(cropType) {
  const colors = {
    'Maize': '#22c55e',
    'Cassava': '#f59e0b',
    'Rice': '#ef4444',
    'Yam': '#8b5cf6',
    'Vegetables': '#06b6d4',
    'Fruits': '#ec4899',
    'default': '#6b7280'
  }
  return colors[cropType] || colors.default
}

function calculateGrowth(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].harvests
  const previous = data[data.length - 2].harvests
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

function calculateRevenueGrowth(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].revenue
  const previous = data[data.length - 2].revenue
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

function calculateQualityTrend(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].quality
  const previous = data[data.length - 2].quality
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

function calculateOrderGrowth(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].orders
  const previous = data[data.length - 2].orders
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

function calculateSpendingGrowth(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].spending
  const previous = data[data.length - 2].spending
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

function calculateAvgOrderGrowth(data) {
  if (data.length < 2) return 0
  const current = data[data.length - 1].avgOrder
  const previous = data[data.length - 2].avgOrder
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
}

exports.getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    
    // Get current metrics
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: 'active' })
    const newRegistrations = await User.countDocuments({ createdAt: { $gte: startOfMonth } })
    
    const totalHarvests = await Harvest.countDocuments()
    const approvedHarvests = await Harvest.countDocuments({ status: 'approved' })
    
    const totalListings = await Listing.countDocuments()
    const totalOrders = await Order.countDocuments()
    
    // Calculate revenue (simplified)
    const orders = await Order.find({ status: 'paid' })
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    
    // Get credit score average
    const creditScores = await CreditScore.find()
    const averageCreditScore = creditScores.length > 0 
      ? creditScores.reduce((sum, cs) => sum + cs.score, 0) / creditScores.length 
      : 0
    
    const metrics = {
      totalUsers,
      activeUsers,
      newRegistrations,
      totalHarvests,
      approvedHarvests,
      totalListings,
      totalOrders,
      totalRevenue,
      averageCreditScore: Math.round(averageCreditScore),
      approvalRate: totalHarvests > 0 ? Math.round((approvedHarvests / totalHarvests) * 100) : 0
    }
    
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getFarmerAnalytics = async (req, res) => {
  try {
    // Support both /farmers/me and /farmers/:farmerId patterns
    const farmerId = req.params.farmerId || req.user.id
    const { period = 'monthly' } = req.query

    const farmer = await User.findById(farmerId).select('partner role')
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({ status: 'error', message: 'Farmer not found' })
    }

    // Get farmer's harvests
    const harvests = await Harvest.find({ farmer: farmerId })
    const approvedHarvests = harvests.filter(h => h.status === 'approved')

    // Get farmer's listings
    const listings = await Listing.find({ farmer: farmerId })

    // Get farmer's orders (as seller) - correctly calculate revenue from payments
    const listingIds = listings.map(l => l._id)
    console.log('🔍 Farmer listings:', listings.length, 'Listing IDs:', listingIds)

    const orders = await Order.find({
      'items.listing': { $in: listingIds },
      paymentStatus: 'paid' // Only include paid orders for revenue calculation
    }).populate('items.listing')

    console.log('🛒 Found orders for farmer:', orders.length)

    // Calculate total revenue from paid orders where farmer is the seller
    let totalRevenue = 0
    let totalOrders = 0

    // Check if farmer has a partner (already fetched above)
    const hasPartner = farmer && farmer.partner

    // Platform fee rate (3%)
    const platformFeeRate = 0.03
    // Partner commission rate (5%)
    const partnerCommissionRate = hasPartner ? 0.05 : 0

    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        // Sum up revenue from this farmer's listings in the order
        let farmerOrderRevenue = 0
        order.items?.forEach(item => {
          if (item.listing && listingIds.some(listingId => listingId.toString() === item.listing._id.toString())) {
            farmerOrderRevenue += item.total || 0
            console.log('💰 Adding revenue from item:', item.total, 'for listing:', item.listing._id)
          }
        })

        // Deduct platform fee and partner commission
        const platformFee = farmerOrderRevenue * platformFeeRate
        const partnerCommission = farmerOrderRevenue * partnerCommissionRate
        farmerOrderRevenue = farmerOrderRevenue - platformFee - partnerCommission

        totalRevenue += farmerOrderRevenue
        totalOrders += 1
        console.log('🛒 Order revenue after fees:', farmerOrderRevenue, 'Total so far:', totalRevenue)
      }
    })

    // Calculate monthly trends for charts
    const monthlyTrends = []
    const currentDate = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6)

    // Group orders by month for revenue trends
    const revenueByMonth = {}
    orders.forEach(order => {
      if (order.createdAt >= sixMonthsAgo) {
        const monthKey = order.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = 0
        }
        // Sum up revenue from this farmer's listings in the order
        let farmerOrderRevenue = 0
        order.items?.forEach(item => {
          if (item.listing && listingIds.some(listingId => listingId.toString() === item.listing._id.toString())) {
            farmerOrderRevenue += item.total || 0
          }
        })

        // Deduct platform fee and partner commission from monthly trends
        const platformFee = farmerOrderRevenue * platformFeeRate
        const partnerCommission = farmerOrderRevenue * partnerCommissionRate
        farmerOrderRevenue = farmerOrderRevenue - platformFee - partnerCommission

        revenueByMonth[monthKey] += farmerOrderRevenue
      }
    })

    // Group harvests by month for harvest trends
    const harvestsByMonth = {}
    const qualityByMonth = {}

    harvests.forEach(harvest => {
      if (harvest.createdAt >= sixMonthsAgo) {
        const monthKey = harvest.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!harvestsByMonth[monthKey]) {
          harvestsByMonth[monthKey] = 0
          qualityByMonth[monthKey] = []
        }
        harvestsByMonth[monthKey] += 1
        // Assume quality score based on approval status (you can enhance this)
        qualityByMonth[monthKey].push(harvest.status === 'approved' ? 85 : 70)
      }
    })

    // Create monthly trends array
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const harvests = harvestsByMonth[monthKey] || 0
      const revenue = revenueByMonth[monthKey] || 0
      const qualityScores = qualityByMonth[monthKey] || []
      const quality = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 75 // Default quality score

      monthlyTrends.push({
        month: monthKey,
        harvests: harvests,
        revenue: revenue,
        quality: Math.round(quality)
      })
    }

    // Calculate metrics
    const metrics = {
      totalHarvests: harvests.length,
      approvedHarvests: approvedHarvests.length,
      approvalRate: harvests.length > 0 ? Math.round((approvedHarvests.length / harvests.length) * 100) : 0,
      totalListings: listings.length,
      totalOrders: totalOrders, // Only count orders where farmer is seller
      totalRevenue: totalRevenue, // Only count revenue from farmer's sales
      averageHarvestQuantity: harvests.length > 0 ? harvests.reduce((sum, h) => sum + h.quantity, 0) / harvests.length : 0,
      // Add monthly trends for better chart data
      monthlyTrends: monthlyTrends
    }

    console.log('📊 Final metrics for farmer:', metrics)
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Get farmer crop analytics (crop distribution and performance)
exports.getFarmerCropAnalytics = async (req, res) => {
  try {
    const farmerId = req.params.farmerId || req.user.id
    const { period = '30d' } = req.query

    const farmer = await User.findById(farmerId).select('role')
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({ status: 'error', message: 'Farmer not found' })
    }

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date(now)
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get crop distribution data
    const cropDistribution = await Harvest.aggregate([
      {
        $match: {
          farmer: new mongoose.Types.ObjectId(farmerId),
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$cropType',
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          totalValue: { $sum: '$price' },
          avgQuality: { 
            $avg: { 
              $cond: [
                { $eq: ['$quality', 'excellent'] }, 4,
                { $cond: [
                  { $eq: ['$quality', 'good'] }, 3,
                  { $cond: [
                    { $eq: ['$quality', 'fair'] }, 2, 1
                  ]}
                ]}
              ]
            }
          },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { quantity: -1 }
      }
    ])

    // Get crop performance data (monthly trends for each crop)
    const cropPerformance = await Harvest.aggregate([
      {
        $match: {
          farmer: new mongoose.Types.ObjectId(farmerId),
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            cropType: '$cropType',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          quantity: { $sum: '$quantity' },
          revenue: { $sum: '$price' },
          count: { $sum: 1 },
          avgQuality: { 
            $avg: { 
              $cond: [
                { $eq: ['$quality', 'excellent'] }, 4,
                { $cond: [
                  { $eq: ['$quality', 'good'] }, 3,
                  { $cond: [
                    { $eq: ['$quality', 'fair'] }, 2, 1
                  ]}
                ]}
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    // Get quality distribution data
    const qualityDistribution = await Harvest.aggregate([
      {
        $match: {
          farmer: new mongoose.Types.ObjectId(farmerId),
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$quality',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' },
          avgPrice: { $avg: '$price' },
          crops: { $addToSet: '$cropType' }
        }
      },
      {
        $sort: { 
          count: -1,
          _id: 1 // Sort by quality level (excellent, good, fair, poor)
        }
      }
    ])

    // Get quality trends over time
    const qualityTrends = await Harvest.aggregate([
      {
        $match: {
          farmer: new mongoose.Types.ObjectId(farmerId),
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            quality: '$quality',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    // Get quality by crop type
    const qualityByCrop = await Harvest.aggregate([
      {
        $match: {
          farmer: new mongoose.Types.ObjectId(farmerId),
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            cropType: '$cropType',
            quality: '$quality'
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.cropType': 1, count: -1 }
      }
    ])

    // Format crop distribution data for charts
    const totalQuantity = cropDistribution.reduce((sum, crop) => sum + crop.quantity, 0)
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347']
    
    const formattedCropDistribution = cropDistribution.map((crop, index) => ({
      name: crop._id,
      value: totalQuantity > 0 ? Math.round((crop.quantity / totalQuantity) * 100) : 0,
      quantity: crop.quantity,
      count: crop.count,
      totalValue: crop.totalValue,
      avgQuality: Math.round(crop.avgQuality * 100) / 100,
      avgPrice: Math.round(crop.avgPrice * 100) / 100,
      color: colors[index % colors.length]
    }))

    // Format crop performance data for charts
    const cropPerformanceMap = {}
    cropPerformance.forEach(item => {
      const cropType = item._id.cropType
      const monthKey = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      
      if (!cropPerformanceMap[cropType]) {
        cropPerformanceMap[cropType] = {}
      }
      
      cropPerformanceMap[cropType][monthKey] = {
        quantity: item.quantity,
        revenue: item.revenue,
        count: item.count,
        avgQuality: Math.round(item.avgQuality * 100) / 100
      }
    })

    // Create monthly performance data for top crops
    const topCrops = formattedCropDistribution.slice(0, 5)
    const monthlyPerformance = []
    
    // Generate month labels for the period
    const monthLabels = []
    const current = new Date(startDate)
    while (current <= now) {
      const monthKey = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`
      const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthLabels.push({ key: monthKey, label: monthLabel })
      
      const monthData = { month: monthLabel, monthKey }
      
      topCrops.forEach(crop => {
        const cropData = cropPerformanceMap[crop.name]?.[monthKey]
        monthData[`${crop.name}_quantity`] = cropData?.quantity || 0
        monthData[`${crop.name}_revenue`] = cropData?.revenue || 0
        monthData[`${crop.name}_quality`] = cropData?.avgQuality || 0
      })
      
      monthlyPerformance.push(monthData)
      current.setMonth(current.getMonth() + 1)
    }

    // Format quality distribution data for charts
    const qualityColors = {
      'excellent': '#22c55e', // Green
      'good': '#84cc16',      // Lime
      'fair': '#f59e0b',      // Amber
      'poor': '#ef4444'       // Red
    }

    const qualityLabels = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    }

    const totalQualityHarvests = qualityDistribution.reduce((sum, quality) => sum + quality.count, 0)
    
    const formattedQualityDistribution = qualityDistribution.map(quality => ({
      name: qualityLabels[quality._id] || quality._id,
      value: totalQualityHarvests > 0 ? Math.round((quality.count / totalQualityHarvests) * 100) : 0,
      count: quality.count,
      totalQuantity: quality.totalQuantity,
      totalValue: quality.totalValue,
      avgPrice: Math.round(quality.avgPrice * 100) / 100,
      crops: quality.crops,
      color: qualityColors[quality._id] || '#8884d8'
    }))

    // Format quality trends data
    const qualityTrendsMap = {}
    qualityTrends.forEach(item => {
      const quality = item._id.quality
      const monthKey = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      
      if (!qualityTrendsMap[quality]) {
        qualityTrendsMap[quality] = {}
      }
      
      qualityTrendsMap[quality][monthKey] = {
        count: item.count,
        quantity: item.totalQuantity,
        value: item.totalValue
      }
    })

    // Create monthly quality trends
    const monthlyQualityTrends = []
    const currentTrend = new Date(startDate)
    while (currentTrend <= now) {
      const monthKey = `${currentTrend.getFullYear()}-${(currentTrend.getMonth() + 1).toString().padStart(2, '0')}`
      const monthLabel = currentTrend.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      const monthData = { month: monthLabel, monthKey }
      
      Object.keys(qualityColors).forEach(quality => {
        const qualityData = qualityTrendsMap[quality]?.[monthKey]
        monthData[`${quality}_count`] = qualityData?.count || 0
        monthData[`${quality}_quantity`] = qualityData?.quantity || 0
        monthData[`${quality}_value`] = qualityData?.value || 0
      })
      
      monthlyQualityTrends.push(monthData)
      currentTrend.setMonth(currentTrend.getMonth() + 1)
    }

    // Format quality by crop data
    const qualityByCropMap = {}
    qualityByCrop.forEach(item => {
      const cropType = item._id.cropType
      const quality = item._id.quality
      
      if (!qualityByCropMap[cropType]) {
        qualityByCropMap[cropType] = {}
      }
      
      qualityByCropMap[cropType][quality] = {
        count: item.count,
        quantity: item.totalQuantity,
        value: item.totalValue
      }
    })

    // Calculate quality insights
    const qualityInsights = formattedQualityDistribution.map(quality => {
      const percentage = quality.value
      const isHighQuality = quality.name === 'Excellent' || quality.name === 'Good'
      
      return {
        quality: quality.name,
        percentage,
        count: quality.count,
        quantity: quality.totalQuantity,
        revenue: quality.totalValue,
        avgPrice: quality.avgPrice,
        crops: quality.crops,
        isHighQuality,
        recommendation: quality.name === 'Excellent'
          ? 'Outstanding quality! Maintain these standards'
          : quality.name === 'Good'
          ? 'Good quality production, aim for excellence'
          : quality.name === 'Fair'
          ? 'Quality needs improvement, review farming practices'
          : 'Poor quality detected, immediate attention required'
      }
    })

    // Calculate crop insights
    const cropInsights = formattedCropDistribution.map(crop => {
      const marketShare = crop.value
      const isTopPerformer = marketShare >= 20
      const isGrowing = true // This could be calculated by comparing with previous period
      
      return {
        cropType: crop.name,
        marketShare,
        quantity: crop.quantity,
        revenue: crop.totalValue,
        avgQuality: crop.avgQuality,
        avgPrice: crop.avgPrice,
        isTopPerformer,
        isGrowing,
        recommendation: marketShare >= 20 
          ? 'Consider expanding production of this high-performing crop'
          : marketShare >= 10
          ? 'This crop shows good performance, monitor for growth opportunities'
          : 'Evaluate market demand and consider optimizing production'
      }
    })

    const analyticsData = {
      period,
      cropDistribution: formattedCropDistribution,
      cropPerformance: {
        monthly: monthlyPerformance,
        topCrops: topCrops.map(crop => ({
          name: crop.name,
          quantity: crop.quantity,
          revenue: crop.totalValue,
          marketShare: crop.value,
          avgQuality: crop.avgQuality,
          color: crop.color
        }))
      },
      qualityDistribution: {
        distribution: formattedQualityDistribution,
        trends: {
          monthly: monthlyQualityTrends
        },
        byCrop: qualityByCropMap,
        insights: qualityInsights
      },
      insights: cropInsights,
      summary: {
        totalCrops: cropDistribution.length,
        totalQuantity,
        topCrop: formattedCropDistribution[0]?.name || 'N/A',
        avgQuality: formattedCropDistribution.length > 0 
          ? Math.round(formattedCropDistribution.reduce((sum, crop) => sum + crop.avgQuality, 0) / formattedCropDistribution.length * 100) / 100
          : 0,
        diversification: formattedCropDistribution.length >= 3 ? 'High' : formattedCropDistribution.length >= 2 ? 'Medium' : 'Low',
        qualitySummary: {
          totalHarvests: totalQualityHarvests,
          highQualityPercentage: qualityInsights.filter(q => q.isHighQuality).reduce((sum, q) => sum + q.percentage, 0),
          averageQualityScore: qualityInsights.length > 0 
            ? Math.round(qualityInsights.reduce((sum, q) => {
                const score = q.quality === 'Excellent' ? 4 : q.quality === 'Good' ? 3 : q.quality === 'Fair' ? 2 : 1
                return sum + (score * q.percentage / 100)
              }, 0) * 100) / 100
            : 0
        }
      }
    }

    return res.json({ status: 'success', data: analyticsData })
  } catch (error) {
    console.error('Farmer crop analytics error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getPartnerAnalytics = async (req, res) => {
  try {
    // Support both /partners/me and /partners/:partnerId patterns
    const partnerId = req.params.partnerId || req.user.id

    const partner = await Partner.findById(partnerId)
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    // Get partner's farmers
    const farmers = await User.find({ partner: partnerId, role: 'farmer' })
    
    // Get harvests from partner's farmers
    const harvests = await Harvest.find({ 
      farmer: { $in: farmers.map(f => f._id) }
    })
    
    // Get listings from partner's farmers
    const listings = await Listing.find({ 
      farmer: { $in: farmers.map(f => f._id) }
    })
    
    // Calculate metrics
    const metrics = {
      totalFarmers: farmers.length,
      totalHarvests: harvests.length,
      approvedHarvests: harvests.filter(h => h.status === 'approved').length,
      totalListings: listings.length,
      totalCommissions: partner.totalCommissions,
      commissionRate: partner.commissionRate,
      averageFarmerHarvests: farmers.length > 0 ? harvests.length / farmers.length : 0
    }
    
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getBuyerAnalytics = async (req, res) => {
  try {
    // Support both /buyers/me and /buyers/:buyerId patterns
    const buyerId = req.params.buyerId || req.user.id
    const { period = '30d' } = req.query

    const buyer = await User.findById(buyerId)
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(404).json({ status: 'error', message: 'Buyer not found' })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get buyer's orders within the period
    const orders = await Order.find({
      buyer: buyerId,
      createdAt: { $gte: startDate }
    }).populate('items.listing').sort({ createdAt: -1 })

    const allOrders = await Order.find({ buyer: buyerId })
    const completedOrders = orders.filter(o => o.status === 'delivered')
    const allCompletedOrders = allOrders.filter(o => o.status === 'delivered')

    // Calculate basic metrics
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0
    const completionRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0

    // Calculate spending by category
    const categorySpending = {}
    let totalCategorySpending = 0

    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.listing && item.listing.category) {
          const category = item.listing.category
          const amount = item.total || 0
          if (!categorySpending[category]) {
            categorySpending[category] = 0
          }
          categorySpending[category] += amount
          totalCategorySpending += amount
        }
      })
    })

    const spendingByCategory = Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalCategorySpending > 0 ? Math.round((amount / totalCategorySpending) * 100) : 0
    }))

    // Calculate monthly spending data
    const monthlyData = {}
    orders.forEach(order => {
      const month = order.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { spending: 0, orders: 0 }
      }
      monthlyData[month].spending += order.total || 0
      monthlyData[month].orders += 1
    })

    const monthlySpending = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      spending: data.spending,
      orders: data.orders
    }))

    // Get top suppliers
    const supplierData = {}
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.listing && item.listing.farmer) {
          const farmerId = item.listing.farmer.toString()
          const farmerName = item.listing.farmer.name || `Farmer ${farmerId.slice(-4)}`
          if (!supplierData[farmerId]) {
            supplierData[farmerId] = {
              name: farmerName,
              orders: 0,
              totalSpent: 0,
              rating: 4.0 // Default rating, can be enhanced later with real ratings
            }
          }
          supplierData[farmerId].orders += 1
          supplierData[farmerId].totalSpent += item.total || 0
        }
      })
    })

    const topSuppliers = Object.values(supplierData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // Get recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map(order => ({
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      date: order.createdAt.toLocaleDateString(),
      status: order.status,
      total: order.total || 0,
      items: order.items?.length || 0
    }))

    // Calculate order status distribution
    const orderStatuses = {}
    orders.forEach(order => {
      const status = order.status
      if (!orderStatuses[status]) {
        orderStatuses[status] = 0
      }
      orderStatuses[status] += 1
    })

    const ordersByStatus = Object.entries(orderStatuses).map(([status, count]) => ({
      status,
      count,
      percentage: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
    }))

    const metrics = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      completionRate,
      favoriteProducts: orders.filter(o => o.status === 'delivered').length, // Real delivered orders count
      pendingDeliveries: orders.filter(o => o.status === 'shipped').length,
      spendingByCategory,
      monthlySpending,
      topSuppliers,
      recentOrders,
      ordersByStatus,
      period
    }

    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    console.error('Buyer analytics error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getHarvestAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query
    
    const totalHarvests = await Harvest.countDocuments()
    const approvedHarvests = await Harvest.countDocuments({ status: 'approved' })
    const rejectedHarvests = await Harvest.countDocuments({ status: 'rejected' })
    const pendingHarvests = await Harvest.countDocuments({ status: 'pending' })
    
    // Get harvests by crop type
    const cropTypes = await Harvest.aggregate([
      { $group: { _id: '$cropType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    // Get harvests by location
    const locations = await Harvest.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    const metrics = {
      totalHarvests,
      approvedHarvests,
      rejectedHarvests,
      pendingHarvests,
      approvalRate: totalHarvests > 0 ? Math.round((approvedHarvests / totalHarvests) * 100) : 0,
      cropTypeBreakdown: cropTypes,
      locationBreakdown: locations
    }
    
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getMarketplaceAnalytics = async (req, res) => {
  try {
    const totalListings = await Listing.countDocuments()
    const activeListings = await Listing.countDocuments({ status: 'active' })
    const totalOrders = await Order.countDocuments()
    const completedOrders = await Order.countDocuments({ status: 'delivered' })

    // Calculate revenue
    const orders = await Order.find({ status: 'paid' })
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

    // Get top selling crops
    const topCrops = await Listing.aggregate([
      { $group: { _id: '$cropName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    const metrics = {
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      topSellingCrops: topCrops
    }

    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Get comprehensive marketplace analytics for a specific farmer
exports.getFarmerMarketplaceAnalytics = async (req, res) => {
  try {
    const farmerId = req.params.farmerId || req.user.id
    const period = req.query.period || '30d' // 30d, 7d, 90d, 1y

    // Calculate date ranges
    const now = new Date()
    const currentPeriodStart = new Date(now)
    const previousPeriodStart = new Date(now)

    // Set period based on request
    switch (period) {
      case '7d':
        currentPeriodStart.setDate(now.getDate() - 7)
        previousPeriodStart.setDate(now.getDate() - 14)
        break
      case '30d':
        currentPeriodStart.setDate(now.getDate() - 30)
        previousPeriodStart.setDate(now.getDate() - 60)
        break
      case '90d':
        currentPeriodStart.setDate(now.getDate() - 90)
        previousPeriodStart.setDate(now.getDate() - 180)
        break
      case '1y':
        currentPeriodStart.setFullYear(now.getFullYear() - 1)
        previousPeriodStart.setFullYear(now.getFullYear() - 2)
        break
      default:
        currentPeriodStart.setDate(now.getDate() - 30)
        previousPeriodStart.setDate(now.getDate() - 60)
    }

    // Get farmer's listings stats
    const totalListings = await Listing.countDocuments({ farmer: farmerId })
    const activeListings = await Listing.countDocuments({ farmer: farmerId, status: 'active' })
    const pendingListings = await Listing.countDocuments({ farmer: farmerId, status: 'draft' })
    const soldOutListings = await Listing.countDocuments({ farmer: farmerId, status: 'sold_out' })

    // Get orders for farmer's listings
    const farmerListings = await Listing.find({ farmer: farmerId }).select('_id cropName category')
    const listingIds = farmerListings.map(l => l._id)

    // Current period metrics
    const currentOrders = await Order.find({
      'items.listing': { $in: listingIds },
      createdAt: { $gte: currentPeriodStart }
    }).populate('items.listing')

    const previousOrders = await Order.find({
      'items.listing': { $in: listingIds },
      createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
    }).populate('items.listing')

    // Calculate current period metrics
    const totalOrders = currentOrders.length
    const previousTotalOrders = previousOrders.length

    const paidOrders = currentOrders.filter(order => order.paymentStatus === 'paid')
    const previousPaidOrders = previousOrders.filter(order => order.paymentStatus === 'paid')

    // Check if farmer has a partner
    const farmer = await User.findById(farmerId).select('partner')
    const hasPartner = farmer && farmer.partner

    // Platform fee rate (3%)
    const platformFeeRate = 0.03
    // Partner commission rate (5%)
    const partnerCommissionRate = hasPartner ? 0.05 : 0

    // Calculate farmer's revenue from their listings (after fees)
    const calculateFarmerRevenue = (orders) => {
      return orders.reduce((sum, order) => {
        let farmerOrderRevenue = 0
        order.items?.forEach(item => {
          if (item.listing && listingIds.some(listingId => listingId.toString() === item.listing._id.toString())) {
            farmerOrderRevenue += item.total || 0
          }
        })

        // Deduct platform fee and partner commission
        const platformFee = farmerOrderRevenue * platformFeeRate
        const partnerCommission = farmerOrderRevenue * partnerCommissionRate
        farmerOrderRevenue = farmerOrderRevenue - platformFee - partnerCommission

        return sum + farmerOrderRevenue
      }, 0)
    }

    const totalRevenue = calculateFarmerRevenue(paidOrders)
    const previousRevenue = calculateFarmerRevenue(previousPaidOrders)

    // Get unique customers for current period
    const currentCustomers = [...new Set(currentOrders.map(order => order.buyer?.toString()))]
    const previousCustomers = [...new Set(previousOrders.map(order => order.buyer?.toString()))]

    const totalCustomers = currentCustomers.length
    const previousCustomersCount = previousCustomers.length

    // Calculate total views for current period
    const totalViews = farmerListings.reduce((sum, listing) => sum + (listing.views || 0), 0)

    // Calculate growth percentages
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersChange = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0
    const customersChange = previousCustomersCount > 0 ? ((totalCustomers - previousCustomersCount) / previousCustomersCount) * 100 : 0

    // Top performing products (by revenue)
    const productRevenue = {}
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.listing) {
          const productName = item.listing.cropName || 'Unknown Product'
          if (!productRevenue[productName]) {
            productRevenue[productName] = {
              name: productName,
              revenue: 0,
              orders: 0,
              views: 0,
              rating: 4.5 + Math.random() * 0.4 // Mock rating
            }
          }
          productRevenue[productName].revenue += item.total || 0
          productRevenue[productName].orders += 1
        }
      })
    })

    // Get actual views from listings
    farmerListings.forEach(listing => {
      if (productRevenue[listing.cropName]) {
        productRevenue[listing.cropName].views = listing.views || 0
      }
    })

    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)

    // Revenue by category
    const revenueByCategory = {}
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.listing && item.listing.category) {
          const category = item.listing.category
          if (!revenueByCategory[category]) {
            revenueByCategory[category] = 0
          }
          revenueByCategory[category] += item.total || 0
        }
      })
    })

    // Monthly performance trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const monthOrders = await Order.find({
        'items.listing': { $in: listingIds },
        createdAt: { $gte: monthDate, $lt: nextMonth },
        status: 'paid'
      })

      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const monthOrderCount = monthOrders.length
      const uniqueMonthCustomers = [...new Set(monthOrders.map(order => order.buyer?.toString()))]

      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrderCount,
        customers: uniqueMonthCustomers.length
      })
    }

    // Customer insights (segmentation)
    const allPaidOrders = await Order.find({
      'items.listing': { $in: listingIds },
      status: 'paid'
    }).populate('buyer')

    const customerSegments = {
      new: { count: 0, revenue: 0 },
      returning: { count: 0, revenue: 0 },
      loyal: { count: 0, revenue: 0 }
    }

    // Simple segmentation based on order count (you can enhance this)
    const customerOrderCount = {}
    allPaidOrders.forEach(order => {
      const customerId = order.buyer?._id?.toString()
      if (customerId) {
        if (!customerOrderCount[customerId]) {
          customerOrderCount[customerId] = { count: 0, revenue: 0 }
        }
        customerOrderCount[customerId].count += 1
        customerOrderCount[customerId].revenue += order.total || 0
      }
    })

    Object.values(customerOrderCount).forEach(customer => {
      if (customer.count === 1) {
        customerSegments.new.count += 1
        customerSegments.new.revenue += customer.revenue
      } else if (customer.count <= 3) {
        customerSegments.returning.count += 1
        customerSegments.returning.revenue += customer.revenue
      } else {
        customerSegments.loyal.count += 1
        customerSegments.loyal.revenue += customer.revenue
      }
    })

    // Get recent listings
    const recentListings = await Listing.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('cropName category basePrice quantity availableQuantity location status views rating reviewCount images createdAt')

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      customerName: order.buyer?.name || 'Unknown Customer',
      total: order.total || 0,
      status: order.status,
      items: order.items?.map(item => ({
        productName: item.listing?.cropName || 'Unknown Product',
        quantity: item.quantity || 0,
        price: item.price || 0
      })) || [],
      createdAt: order.createdAt
    }))

    // Calculate total revenue from all categories
    const totalRevenueFromCategories = Object.values(revenueByCategory).reduce((sum, revenue) => sum + revenue, 0)

    // Format revenue by category with percentages
    const formattedRevenueByCategory = Object.entries(revenueByCategory).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenueFromCategories > 0 ? Math.round((revenue / totalRevenueFromCategories) * 100) : 0
    }))

    // Generate recommended actions based on data
    const recommendedActions = []
    if (totalViews > totalOrders * 2) {
      recommendedActions.push({
        title: "Increase Product Visibility",
        description: "Your products are getting good views but fewer conversions. Consider improving product descriptions and images."
      })
    }
    if (customerSegments.returning.revenue > customerSegments.new.revenue) {
      recommendedActions.push({
        title: "Customer Retention Focus",
        description: "Returning customers generate more revenue. Implement loyalty programs and follow-up communications."
      })
    }
    if (topProducts.length > 0 && topProducts[0].rating > 4.5) {
      recommendedActions.push({
        title: "Quality Excellence",
        description: "High customer ratings indicate quality products. Maintain these standards and highlight quality in marketing."
      })
    }

    // Return comprehensive analytics data
    const analyticsData = {
      period,
      revenue: {
        total: totalRevenue,
        change: Math.round(revenueChange * 100) / 100,
        trend: revenueChange >= 0 ? 'up' : 'down'
      },
      orders: {
        total: totalOrders,
        change: Math.round(ordersChange * 100) / 100,
        trend: ordersChange >= 0 ? 'up' : 'down'
      },
      customers: {
        total: totalCustomers,
        change: Math.round(customersChange * 100) / 100,
        trend: customersChange >= 0 ? 'up' : 'down'
      },
      views: {
        total: totalViews,
        change: 0, // Would need historical data for this
        trend: 'up'
      },
      topProducts,
      revenueByCategory: formattedRevenueByCategory,
      monthlyTrends,
      customerInsights: {
        newCustomers: {
          count: customerSegments.new.count,
          percentage: totalCustomers > 0 ? Math.round((customerSegments.new.count / totalCustomers) * 100) : 0,
          revenue: customerSegments.new.revenue
        },
        returningCustomers: {
          count: customerSegments.returning.count,
          percentage: totalCustomers > 0 ? Math.round((customerSegments.returning.count / totalCustomers) * 100) : 0,
          revenue: customerSegments.returning.revenue
        },
        loyalCustomers: {
          count: customerSegments.loyal.count,
          percentage: totalCustomers > 0 ? Math.round((customerSegments.loyal.count / totalCustomers) * 100) : 0,
          revenue: customerSegments.loyal.revenue
        }
      },
      recentListings: recentListings.map(listing => ({
        id: listing._id,
        cropName: listing.cropName,
        category: listing.category,
        price: listing.basePrice,
        quantity: listing.quantity,
        status: listing.status,
        views: listing.views || 0,
        rating: listing.rating || 0,
        createdAt: listing.createdAt
      })),
      recentOrders: formattedRecentOrders,
      recommendedActions,
      summary: {
        totalListings,
        activeListings,
        pendingListings,
        soldOutListings,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        conversionRate: totalViews > 0 ? Math.round((totalOrders / totalViews) * 100) : 0
      }
    }

    return res.json({ status: 'success', data: analyticsData })
  } catch (error) {
    console.error('Farmer marketplace analytics error:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getFinancialAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ status: 'paid' })
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
    
    const creditScores = await CreditScore.find()
    const averageCreditScore = creditScores.length > 0 
      ? creditScores.reduce((sum, cs) => sum + cs.score, 0) / creditScores.length 
      : 0
    
    const riskDistribution = await CreditScore.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ])
    
    const metrics = {
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      averageCreditScore: Math.round(averageCreditScore),
      riskDistribution,
      totalCreditScores: creditScores.length
    }
    
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: transactions
exports.getTransactionAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query
    const match = {}
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }
    const Order = require('../models/order.model')
    const groupId = interval === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } } : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
    const pipeline = [
      { $match: match },
      { $group: { _id: groupId, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]
    const series = await Order.aggregate(pipeline)
    const totals = await Order.aggregate([{ $match: match }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' }, aov: { $avg: '$total' } } }])
    return res.json({ status: 'success', data: { series, totals: totals[0] || { orders: 0, revenue: 0, aov: 0 } } })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: regional
exports.getRegionalAnalytics = async (req, res) => {
  try {
    const Listing = require('../models/listing.model')
    const Harvest = require('../models/harvest.model')
    const Order = require('../models/order.model')
    const byStateListings = await Listing.aggregate([
      { $group: { _id: '$location.state', listings: { $sum: 1 }, avgPrice: { $avg: '$basePrice' }, quantity: { $sum: '$quantity' } } },
      { $sort: { listings: -1 } }
    ])
    const byStateHarvests = await Harvest.aggregate([
      { $group: { _id: '$location', harvests: { $sum: 1 }, qty: { $sum: '$quantity' } } }
    ])
    const byStateOrders = await Order.aggregate([
      { $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyerUser' } },
      { $unwind: '$buyerUser' },
      { $group: { _id: '$buyerUser.location', orders: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ])
    return res.json({ status: 'success', data: { listings: byStateListings, harvests: byStateHarvests, orders: byStateOrders } })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: impact (simple proxy metrics)
exports.getImpactAnalytics = async (req, res) => {
  try {
    const User = require('../models/user.model')
    const Harvest = require('../models/harvest.model')
    const Order = require('../models/order.model')
    const farmers = await User.countDocuments({ role: 'farmer', status: 'active' })
    const totalHarvests = await Harvest.countDocuments()
    const totalOrders = await Order.countDocuments()
    return res.json({ status: 'success', data: { activeFarmers: farmers, totalHarvests, totalOrders, sdg2Proxy: { increasedIncomeBeneficiaries: farmers, reducedPostHarvestLoss: Math.round(totalHarvests * 0.1) } } })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: weather statistics per region
exports.getWeatherAnalytics = async (req, res) => {
  try {
    const { region } = req.query
    const WeatherData = require('../models/weather.model')
    const match = {}
    if (region) match['location.state'] = region
    const agg = await WeatherData.aggregate([
      { $match: match },
      { $group: { _id: '$location.state', avgTemp: { $avg: '$current.temperature' }, avgHumidity: { $avg: '$current.humidity' }, alerts: { $sum: { $size: { $ifNull: ['$alerts', []] } } } } },
      { $sort: { _id: 1 } }
    ])
    return res.json({ status: 'success', data: agg })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: fintech
exports.getFintechAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const match = {}
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }
    
    const LoanApplication = require('../models/loan-application.model')
    const CreditScore = require('../models/credit-score.model')
    
    const loanStats = await LoanApplication.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ])
    
    const creditScoreStats = await CreditScore.aggregate([
      { $match: match },
      { $group: { _id: null, avgScore: { $avg: '$score' }, minScore: { $min: '$score' }, maxScore: { $max: '$score' } } }
    ])
    
    const loanTrends = await LoanApplication.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ])
    
    return res.json({
      status: 'success',
      data: {
        loanStats,
        creditScoreStats: creditScoreStats[0] || { avgScore: 0, minScore: 0, maxScore: 0 },
        loanTrends
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: reports list
exports.getReportsList = async (req, res) => {
  try {
    const { type, status } = req.query
    const match = {}
    if (type) match.type = type
    if (status) match.status = status
    
    const Report = require('../models/report.model')
    const reports = await Report.find(match).sort({ createdAt: -1 }).limit(50)
    const reportStats = await Report.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    
    return res.json({
      status: 'success',
      data: { reports, stats: reportStats }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: export functionality
exports.exportAnalytics = async (req, res) => {
  try {
    const { format = 'json', type, filters } = req.query
    
    let data = {}
    const Order = require('../models/order.model')
    const Harvest = require('../models/harvest.model')
    const User = require('../models/user.model')
    
    if (type === 'transactions') {
      data = await Order.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { _id: 1 } }
      ])
    } else if (type === 'harvests') {
      data = await Harvest.aggregate([
        { $group: { _id: '$cropType', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
        { $sort: { count: -1 } }
      ])
    } else if (type === 'users') {
      data = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    }
    
    const exportData = {
      timestamp: new Date().toISOString(),
      type,
      filters,
      data,
      format
    }
    
    return res.json({
      status: 'success',
      data: exportData
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: compare data
exports.compareAnalytics = async (req, res) => {
  try {
    const { metrics, timeframes, regions } = req.body
    
    const Order = require('../models/order.model')
    const Harvest = require('../models/harvest.model')
    
    let comparisonData = {}
    
    if (metrics.includes('revenue')) {
      const revenueComparison = await Order.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
        { $sort: { _id: 1 } }
      ])
      comparisonData.revenue = revenueComparison
    }
    
    if (metrics.includes('harvests')) {
      const harvestComparison = await Harvest.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
      comparisonData.harvests = harvestComparison
    }
    
    if (regions && regions.length > 0) {
      const regionalComparison = await Order.aggregate([
        { $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyerUser' } },
        { $unwind: '$buyerUser' },
        { $match: { 'buyerUser.location': { $in: regions } } },
        { $group: { _id: '$buyerUser.location', orders: { $sum: 1 }, revenue: { $sum: '$total' } } }
      ])
      comparisonData.regional = regionalComparison
    }
    
    return res.json({
      status: 'success',
      data: comparisonData
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: predictive analytics
exports.getPredictiveAnalytics = async (req, res) => {
  try {
    const { forecast = 30 } = req.query // days to forecast
    
    const Order = require('../models/order.model')
    const Harvest = require('../models/harvest.model')
    
    // Get historical data for trend analysis
    const historicalOrders = await Order.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: -1 } },
      { $limit: 90 } // Last 90 days
    ])
    
    const historicalHarvests = await Harvest.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 90 }
    ])
    
    // Simple trend calculation (linear regression approximation)
    const calculateTrend = (data, key) => {
      if (data.length < 2) return 0
      const recent = data.slice(0, 7).reduce((sum, item) => sum + item[key], 0) / 7
      const older = data.slice(-7).reduce((sum, item) => sum + item[key], 0) / 7
      return (recent - older) / 7
    }
    
    const orderTrend = calculateTrend(historicalOrders, 'orders')
    const revenueTrend = calculateTrend(historicalOrders, 'revenue')
    const harvestTrend = calculateTrend(historicalHarvests, 'count')
    
    // Generate forecast
    const forecastData = []
    for (let i = 1; i <= forecast; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      forecastData.push({
        date: dateStr,
        predictedOrders: Math.max(0, Math.round(historicalOrders[0]?.orders + (orderTrend * i))),
        predictedRevenue: Math.max(0, historicalOrders[0]?.revenue + (revenueTrend * i)),
        predictedHarvests: Math.max(0, Math.round(historicalHarvests[0]?.count + (harvestTrend * i)))
      })
    }
    
    return res.json({
      status: 'success',
      data: {
        historical: { orders: historicalOrders, harvests: historicalHarvests },
        trends: { orders: orderTrend, revenue: revenueTrend, harvests: harvestTrend },
        forecast: forecastData
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Advanced analytics: summary dashboard
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query
    
    const Order = require('../models/order.model')
    const Harvest = require('../models/harvest.model')
    const User = require('../models/user.model')
    const Listing = require('../models/listing.model')
    
    const now = new Date()
    const startOfPeriod = new Date()
    
    if (period === 'week') {
      startOfPeriod.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startOfPeriod.setMonth(now.getMonth() - 1)
    } else if (period === 'quarter') {
      startOfPeriod.setMonth(now.getMonth() - 3)
    } else if (period === 'year') {
      startOfPeriod.setFullYear(now.getFullYear() - 1)
    }
    
    const match = { createdAt: { $gte: startOfPeriod, $lte: now } }
    
    // Key metrics
    const [orders, harvests, users, listings] = await Promise.all([
      Order.countDocuments(match),
      Harvest.countDocuments(match),
      User.countDocuments({ ...match, role: 'farmer' }),
      Listing.countDocuments(match)
    ])
    
    // Revenue metrics
    const revenueData = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$total' }, avg: { $avg: '$total' }, count: { $sum: 1 } } }
    ])
    
    // Top performing crops
    const topCrops = await Harvest.aggregate([
      { $match: match },
      { $group: { _id: '$cropType', count: { $sum: 1 }, quantity: { $sum: '$quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ])
    
    // Regional distribution
    const regionalData = await Order.aggregate([
      { $match: match },
      { $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyerUser' } },
      { $unwind: '$buyerUser' },
      { $group: { _id: '$buyerUser.location', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ])
    
    // Growth rates (compare with previous period)
    const previousStart = new Date(startOfPeriod)
    const previousEnd = new Date(startOfPeriod)
    if (period === 'week') {
      previousStart.setDate(previousStart.getDate() - 7)
      previousEnd.setDate(previousEnd.getDate() - 7)
    } else if (period === 'month') {
      previousStart.setMonth(previousStart.getMonth() - 1)
      previousEnd.setMonth(previousEnd.getMonth() - 1)
    }
    
    const previousMatch = { createdAt: { $gte: previousStart, $lte: previousEnd } }
    const [prevOrders, prevRevenue] = await Promise.all([
      Order.countDocuments(previousMatch),
      Order.aggregate([{ $match: previousMatch }, { $group: { _id: null, total: { $sum: '$total' } } }])
    ])
    
    const orderGrowth = prevOrders > 0 ? ((orders - prevOrders) / prevOrders * 100).toFixed(2) : 0
    const revenueGrowth = prevRevenue[0]?.total > 0 ? ((revenueData[0]?.total - prevRevenue[0].total) / prevRevenue[0].total * 100).toFixed(2) : 0
    
    return res.json({
      status: 'success',
      data: {
        period,
        metrics: {
          orders,
          harvests,
          activeFarmers: users,
          listings,
          totalRevenue: revenueData[0]?.total || 0,
          avgOrderValue: revenueData[0]?.avg || 0
        },
        growth: {
          orders: parseFloat(orderGrowth),
          revenue: parseFloat(revenueGrowth)
        },
        topCrops,
        regionalData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Helpers for reporting
function resolvePeriodToDates (period) {
  const now = new Date()
  switch (period) {
    case 'today':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), endDate: now }
    case 'weekly': {
      const day = now.getDay()
      const diff = now.getDate() - day
      return { startDate: new Date(now.getFullYear(), now.getMonth(), diff), endDate: now }
    }
    case 'monthly':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now }
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3)
      const startMonth = quarter * 3
      return { startDate: new Date(now.getFullYear(), startMonth, 1), endDate: now }
    }
    case 'yearly':
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now }
    default:
      return null
  }
}

function buildRows (type, docs) {
  switch (type) {
    case 'user':
      return docs.map(u => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }))
    case 'harvest':
      return docs.map(h => ({
        id: String(h._id),
        batchId: h.batchId,
        cropType: h.cropType,
        quantity: h.quantity,
        unit: h.unit,
        status: h.status,
        farmerName: h.farmer?.name,
        farmerEmail: h.farmer?.email,
        createdAt: h.createdAt
      }))
    case 'marketplace':
      return docs.map(l => ({
        id: String(l._id),
        cropName: l.cropName,
        price: l.price,
        status: l.status,
        farmerName: l.farmer?.name,
        farmerEmail: l.farmer?.email,
        createdAt: l.createdAt
      }))
    case 'financial':
      return docs.map(o => ({
        id: String(o._id),
        buyerName: o.buyer?.name,
        buyerEmail: o.buyer?.email,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt
      }))
    default:
      return []
  }
}

function csvFromRows (rows) {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0]).map(id => ({ id, title: id }))
  const stringifier = createObjectCsvStringifier({ header: headers })
  return stringifier.getHeaderString() + stringifier.stringifyRecords(rows)
}

async function xlsxFromRows (rows, sheetName = 'Report') {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)
  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }))
    sheet.addRows(rows)
  }
  return await workbook.xlsx.writeBuffer()
}

exports.generateReport = async (req, res) => {
  try {
    const { type, period, startDate, endDate, format = 'json', filename } = req.body
    
    // Validate type
    const allowedTypes = ['user', 'harvest', 'marketplace', 'financial']
    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing report type' })
    }
    
    // Resolve date range
    let from = startDate ? new Date(startDate) : undefined
    let to = endDate ? new Date(endDate) : undefined
    if ((!from || !to) && period) {
      const resolved = resolvePeriodToDates(period)
      if (resolved) {
        from = resolved.startDate
        to = resolved.endDate
      }
    }
    
    const query = {}
    if (from && to && !isNaN(from) && !isNaN(to)) {
      query.createdAt = { $gte: from, $lte: to }
    }
    
    // Get data
    let docs = []
    switch (type) {
      case 'user':
        docs = await User.find(query).select('-password')
        break
      case 'harvest':
        docs = await Harvest.find(query).populate('farmer', 'name email')
        break
      case 'marketplace':
        docs = await Listing.find(query).populate('farmer', 'name email')
        break
      case 'financial':
        docs = await Order.find(query)
          .populate('buyer', 'name email')
          .populate('seller', 'name email profile.farmName')
        break
    }
    
    // Return JSON if requested
    if (format === 'json') {
      return res.json({ status: 'success', data: docs })
    }
    
    // Build flat rows for export
    const rows = buildRows(type, docs)
    const safeBase = `${type}-report-${Date.now()}`
    const outName = `${filename || safeBase}.${format === 'xlsx' ? 'xlsx' : 'csv'}`
    
    if (format === 'csv') {
      const csv = csvFromRows(rows)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${outName}"`)
      return res.status(200).send(csv)
    }
    
    if (format === 'xlsx') {
      const buffer = await xlsxFromRows(rows, `${type} Report`)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${outName}"`)
      return res.status(200).send(Buffer.from(buffer))
    }
    
    return res.status(400).json({ status: 'error', message: 'Unsupported format. Use json, csv, or xlsx' })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

