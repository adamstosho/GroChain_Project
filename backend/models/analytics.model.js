const mongoose = require('mongoose')

const AnalyticsSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['dashboard', 'user', 'harvest', 'marketplace', 'financial', 'partner', 'weather', 'agricultural'], 
    required: true 
  },
  period: { 
    type: String, 
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 
    required: true 
  },
  date: { type: Date, required: true },
  metrics: {
    // User Metrics
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    newRegistrations: { type: Number, default: 0 },
    verifiedUsers: { type: Number, default: 0 },
    suspendedUsers: { type: Number, default: 0 },
    
    // Harvest Metrics
    totalHarvests: { type: Number, default: 0 },
    approvedHarvests: { type: Number, default: 0 },
    rejectedHarvests: { type: Number, default: 0 },
    pendingHarvests: { type: Number, default: 0 },
    totalHarvestQuantity: { type: Number, default: 0 },
    averageHarvestQuality: { type: Number, default: 0 },
    
    // Marketplace Metrics
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    
    // Financial Metrics
    totalCommissions: { type: Number, default: 0 },
    averageCreditScore: { type: Number, default: 0 },
    totalLoans: { type: Number, default: 0 },
    activeLoans: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    transactionVolume: { type: Number, default: 0 },
    
    // Partner Metrics
    totalPartners: { type: Number, default: 0 },
    activePartners: { type: Number, default: 0 },
    partnerRevenue: { type: Number, default: 0 },
    
    // Weather & Agricultural Metrics
    weatherAlerts: { type: Number, default: 0 },
    criticalWeatherEvents: { type: Number, default: 0 },
    agriculturalAdvisories: { type: Number, default: 0 },
    cropRiskAssessments: { type: Number, default: 0 }
  },
  breakdown: {
    byRole: {
      farmers: { type: Number, default: 0 },
      partners: { type: Number, default: 0 },
      buyers: { type: Number, default: 0 },
      admins: { type: Number, default: 0 }
    },
    byLocation: { type: Object },
    byCropType: { type: Object },
    byStatus: { type: Object },
    byQuality: { type: Object },
    byRegion: { type: Object },
    bySeason: { type: Object }
  },
  trends: {
    growthRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
    churnRate: { type: Number, default: 0 },
    revenueGrowth: { type: Number, default: 0 },
    userEngagement: { type: Number, default: 0 }
  },
  agriculturalInsights: {
    cropPerformance: { type: Object },
    seasonalTrends: { type: Object },
    qualityMetrics: { type: Object },
    sustainabilityIndicators: { type: Object },
    riskAssessments: { type: Object }
  },
  performanceMetrics: {
    responseTime: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    throughput: { type: Number, default: 0 }
  },
  metadata: { 
    type: Object,
    source: { type: String, default: 'system' },
    calculationMethod: { type: String, default: 'aggregate' },
    dataQuality: { type: String, enum: ['high', 'medium', 'low'], default: 'high' }
  }
}, { timestamps: true })

// Indexes for efficient querying
AnalyticsSchema.index({ type: 1, period: 1, date: 1 })
AnalyticsSchema.index({ date: -1 })
AnalyticsSchema.index({ type: 1, date: -1 })
AnalyticsSchema.index({ period: 1, date: -1 })

module.exports = mongoose.model('Analytics', AnalyticsSchema)

