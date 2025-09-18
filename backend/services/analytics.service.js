const Analytics = require('../models/analytics.model')
const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Order = require('../models/order.model')
const Transaction = require('../models/transaction.model')
const Commission = require('../models/commission.model')
const WeatherData = require('../models/weather.model')

class AnalyticsService {
  // Generate dashboard analytics
  async generateDashboardAnalytics(period = 'daily') {
    try {
      const date = new Date()
      const existingAnalytics = await Analytics.findOne({
        type: 'dashboard',
        period,
        date: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      })

      if (existingAnalytics) {
        return existingAnalytics
      }

      // Calculate real-time metrics
      const [
        totalUsers,
        activeUsers,
        newRegistrations,
        totalHarvests,
        approvedHarvests,
        totalListings,
        totalOrders,
        totalRevenue,
        totalCommissions,
        weatherAlerts
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Harvest.countDocuments(),
        Harvest.countDocuments({ status: 'approved' }),
        require('../models/listing.model').countDocuments({ status: 'active' }),
        Order.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        WeatherData.countDocuments({ 'alerts.severity': { $in: ['high', 'critical'] } })
      ])

      const analytics = await Analytics.create({
        type: 'dashboard',
        period,
        date,
        metrics: {
          totalUsers,
          activeUsers,
          newRegistrations,
          totalHarvests,
          approvedHarvests,
          totalListings,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalCommissions: totalCommissions[0]?.total || 0,
          weatherAlerts
        },
        breakdown: await this.generateBreakdown(),
        trends: await this.calculateTrends(),
        agriculturalInsights: await this.generateAgriculturalInsights(),
        performanceMetrics: await this.getPerformanceMetrics()
      })

      return analytics
    } catch (error) {
      console.error('Error generating dashboard analytics:', error)
      throw error
    }
  }

  // Generate user analytics
  async generateUserAnalytics(period = 'daily', filters = {}) {
    try {
      const date = new Date()
      const query = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      
      if (filters.role) query.role = filters.role
      if (filters.location) query.location = filters.location

      const [
        newUsers,
        verifiedUsers,
        activeUsers,
        suspendedUsers
      ] = await Promise.all([
        User.countDocuments(query),
        User.countDocuments({ ...query, emailVerified: true }),
        User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        User.countDocuments({ status: 'suspended' })
      ])

      const analytics = await Analytics.create({
        type: 'user',
        period,
        date,
        metrics: {
          newRegistrations: newUsers,
          verifiedUsers,
          activeUsers,
          suspendedUsers
        },
        breakdown: await this.getUserBreakdown(filters),
        trends: await this.calculateUserTrends(period)
      })

      return analytics
    } catch (error) {
      console.error('Error generating user analytics:', error)
      throw error
    }
  }

  // Generate harvest analytics
  async generateHarvestAnalytics(period = 'daily', filters = {}) {
    try {
      const date = new Date()
      const query = {}
      
      if (filters.cropType) query.cropType = filters.cropType
      if (filters.location) query.location = filters.location
      if (filters.status) query.status = filters.status

      const [
        totalHarvests,
        approvedHarvests,
        rejectedHarvests,
        pendingHarvests,
        totalQuantity,
        averageQuality
      ] = await Promise.all([
        Harvest.countDocuments(query),
        Harvest.countDocuments({ ...query, status: 'approved' }),
        Harvest.countDocuments({ ...query, status: 'rejected' }),
        Harvest.countDocuments({ ...query, status: 'pending' }),
        Harvest.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]),
        Harvest.aggregate([
          { $match: query },
          { $group: { _id: null, avg: { $avg: { $indexOfArray: ['excellent', 'good', 'fair', 'poor'], '$quality' } } } }
        ])
      ])

      const analytics = await Analytics.create({
        type: 'harvest',
        period,
        date,
        metrics: {
          totalHarvests,
          approvedHarvests,
          rejectedHarvests,
          pendingHarvests,
          totalHarvestQuantity: totalQuantity[0]?.total || 0,
          averageHarvestQuality: averageQuality[0]?.avg || 0
        },
        breakdown: await this.getHarvestBreakdown(filters),
        agriculturalInsights: await this.generateHarvestInsights(filters)
      })

      return analytics
    } catch (error) {
      console.error('Error generating harvest analytics:', error)
      throw error
    }
  }

  // Generate marketplace analytics
  async generateMarketplaceAnalytics(period = 'daily', filters = {}) {
    try {
      const date = new Date()
      const query = {}
      
      if (filters.status) query.status = filters.status
      if (filters.cropType) query.cropType = filters.cropType

      const [
        totalListings,
        activeListings,
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue
      ] = await Promise.all([
        require('../models/listing.model').countDocuments(query),
        require('../models/listing.model').countDocuments({ ...query, status: 'active' }),
        Order.countDocuments(),
        Order.countDocuments({ status: 'completed' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        Order.aggregate([{ $group: { _id: null, avg: { $avg: '$total' } } }])
      ])

      const analytics = await Analytics.create({
        type: 'marketplace',
        period,
        date,
        metrics: {
          totalListings,
          activeListings,
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          averageOrderValue: averageOrderValue[0]?.avg || 0
        },
        breakdown: await this.getMarketplaceBreakdown(filters),
        trends: await this.calculateMarketplaceTrends(period)
      })

      return analytics
    } catch (error) {
      console.error('Error generating marketplace analytics:', error)
      throw error
    }
  }

  // Generate financial analytics
  async generateFinancialAnalytics(period = 'daily', filters = {}) {
    try {
      const date = new Date()
      const query = {}
      
      if (filters.type) query.type = filters.type
      if (filters.status) query.status = filters.status

      const [
        totalTransactions,
        transactionVolume,
        totalCommissions,
        totalLoans,
        activeLoans,
        averageCreditScore
      ] = await Promise.all([
        Transaction.countDocuments(query),
        Transaction.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        require('../models/loan-application.model').countDocuments({ status: 'approved' }),
        require('../models/loan-application.model').countDocuments({ status: 'active' }),
        require('../models/credit-score.model').aggregate([
          { $group: { _id: null, avg: { $avg: '$score' } } }
        ])
      ])

      const analytics = await Analytics.create({
        type: 'financial',
        period,
        date,
        metrics: {
          totalTransactions,
          transactionVolume: transactionVolume[0]?.total || 0,
          totalCommissions: totalCommissions[0]?.total || 0,
          totalLoans,
          activeLoans,
          averageCreditScore: averageCreditScore[0]?.avg || 0
        },
        breakdown: await this.getFinancialBreakdown(filters),
        trends: await this.calculateFinancialTrends(period)
      })

      return analytics
    } catch (error) {
      console.error('Error generating financial analytics:', error)
      throw error
    }
  }

  // Generate weather analytics
  async generateWeatherAnalytics(period = 'daily', filters = {}) {
    try {
      const date = new Date()
      const query = {}
      
      if (filters.severity) query['alerts.severity'] = filters.severity
      if (filters.type) query['alerts.type'] = filters.type

      const [
        weatherAlerts,
        criticalWeatherEvents,
        agriculturalAdvisories,
        cropRiskAssessments
      ] = await Promise.all([
        WeatherData.countDocuments({ 'alerts': { $exists: true, $ne: [] } }),
        WeatherData.countDocuments({ 'alerts.severity': 'critical' }),
        WeatherData.countDocuments({ 'alerts.type': 'agricultural' }),
        WeatherData.countDocuments({ 'agricultural.frostRisk': { $in: ['medium', 'high'] } })
      ])

      const analytics = await Analytics.create({
        type: 'weather',
        period,
        date,
        metrics: {
          weatherAlerts,
          criticalWeatherEvents,
          agriculturalAdvisories,
          cropRiskAssessments
        },
        breakdown: await this.getWeatherBreakdown(filters),
        agriculturalInsights: await this.generateWeatherInsights(filters)
      })

      return analytics
    } catch (error) {
      console.error('Error generating weather analytics:', error)
      throw error
    }
  }

  // Helper methods for breakdowns and insights
  async generateBreakdown() {
    try {
      const [roleBreakdown, locationBreakdown, cropBreakdown] = await Promise.all([
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        Harvest.aggregate([
          { $group: { _id: '$location', count: { $sum: 1 } } }
        ]),
        Harvest.aggregate([
          { $group: { _id: '$cropType', count: { $sum: 1 } } }
        ])
      ])

      return {
        byRole: roleBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        byLocation: locationBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        byCropType: cropBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})
      }
    } catch (error) {
      console.error('Error generating breakdown:', error)
      return {}
    }
  }

  async calculateTrends() {
    try {
      // Calculate trends based on historical data
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const [weeklyGrowth, monthlyGrowth] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: lastWeek } }),
        User.countDocuments({ createdAt: { $gte: lastMonth } })
      ])

      return {
        growthRate: weeklyGrowth,
        conversionRate: 0.75, // Placeholder
        retentionRate: 0.85, // Placeholder
        churnRate: 0.15, // Placeholder
        revenueGrowth: 0.12, // Placeholder
        userEngagement: 0.68 // Placeholder
      }
    } catch (error) {
      console.error('Error calculating trends:', error)
      return {}
    }
  }

  async generateAgriculturalInsights() {
    try {
      const cropPerformance = await Harvest.aggregate([
        { $group: { _id: '$cropType', avgQuality: { $avg: { $indexOfArray: ['excellent', 'good', 'fair', 'poor'], '$quality' } } } }
      ])

      return {
        cropPerformance: cropPerformance.reduce((acc, item) => {
          acc[item._id] = item.avgQuality
          return acc
        }, {}),
        seasonalTrends: {},
        qualityMetrics: {},
        sustainabilityIndicators: {},
        riskAssessments: {}
      }
    } catch (error) {
      console.error('Error generating agricultural insights:', error)
      return {}
    }
  }

  async getPerformanceMetrics() {
    try {
      return {
        responseTime: 150, // ms
        uptime: 99.9, // percentage
        errorRate: 0.1, // percentage
        throughput: 1000 // requests per second
      }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return {}
    }
  }

  // Additional helper methods for specific breakdowns
  async getUserBreakdown(filters) {
    // Implementation for user breakdown
    return {}
  }

  async getHarvestBreakdown(filters) {
    // Implementation for harvest breakdown
    return {}
  }

  async getMarketplaceBreakdown(filters) {
    // Implementation for marketplace breakdown
    return {}
  }

  async getFinancialBreakdown(filters) {
    // Implementation for financial breakdown
    return {}
  }

  async getWeatherBreakdown(filters) {
    // Implementation for weather breakdown
    return {}
  }

  async calculateUserTrends(period) {
    // Implementation for user trends
    return {}
  }

  async calculateMarketplaceTrends(period) {
    // Implementation for marketplace trends
    return {}
  }

  async calculateFinancialTrends(period) {
    // Implementation for financial trends
    return {}
  }

  async generateHarvestInsights(filters) {
    // Implementation for harvest insights
    return {}
  }

  async generateWeatherInsights(filters) {
    // Implementation for weather insights
    return {}
  }
}

module.exports = new AnalyticsService()

