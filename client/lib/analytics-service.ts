import { apiService } from "./api"

export interface AnalyticsFilters {
  timeRange?: '3months' | '6months' | '1year' | 'custom'
  startDate?: string
  endDate?: string
  location?: string
  farmerStatus?: 'all' | 'active' | 'inactive'
  commissionStatus?: 'all' | 'pending' | 'paid'
}

export interface AnalyticsData {
  overview: {
    totalFarmers: number
    activeFarmers: number
    totalCommissions: number
    monthlyGrowth: number
    averageCommission: number
    successRate: number
    totalRevenue: number
    averageOrderValue: number
  }
  performance: {
    monthlyMetrics: Array<{
      month: string
      farmers: number
      commissions: number
      growth: number
      revenue: number
    }>
    topPerformers: Array<{
      name: string
      performance: number
      status: string
      location: string
      totalHarvests: number
      totalEarnings: number
    }>
    performanceMetrics: {
      farmerRetentionRate: number
      commissionGrowth: number
      qualityScore: number
      averageResponseTime: number
    }
  }
  geographic: {
    locations: Array<{
      name: string
      farmers: number
      commissions: number
      percentage: number
      revenue: number
    }>
    distribution: Array<{
      region: string
      count: number
      color: string
      growth: number
    }>
  }
  trends: {
    farmerGrowth: number[]
    commissionTrends: number[]
    qualityMetrics: number[]
    revenueTrends: number[]
    timeLabels: string[]
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    impact: string
    recommendation: string
    priority: 'high' | 'medium' | 'low'
  }>
  financials: {
    monthlyRevenue: number[]
    commissionBreakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
    payoutHistory: Array<{
      date: string
      amount: number
      status: string
      reference: string
    }>
  }
}

export interface ReportConfig {
  type: 'overview' | 'performance' | 'geographic' | 'financial' | 'custom'
  format: 'pdf' | 'csv' | 'excel'
  filters: AnalyticsFilters
  includeCharts: boolean
  includeInsights: boolean
}

// Mock data for development
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalFarmers: 156,
    activeFarmers: 142,
    totalCommissions: 89,
    monthlyGrowth: 12.5,
    averageCommission: 4500,
    successRate: 94.2,
    totalRevenue: 1250000,
    averageOrderValue: 8500
  },
  performance: {
    monthlyMetrics: [
      { month: 'Jan', farmers: 120, commissions: 65, growth: 8.2, revenue: 850000 },
      { month: 'Feb', farmers: 128, commissions: 72, growth: 10.1, revenue: 920000 },
      { month: 'Mar', farmers: 135, commissions: 78, growth: 12.3, revenue: 980000 },
      { month: 'Apr', farmers: 142, commissions: 82, growth: 11.8, revenue: 1050000 },
      { month: 'May', farmers: 148, commissions: 85, growth: 9.7, revenue: 1120000 },
      { month: 'Jun', farmers: 156, commissions: 89, growth: 12.5, revenue: 1250000 }
    ],
    topPerformers: [
      { name: 'Lagos Cooperative', performance: 98.5, status: 'active', location: 'Lagos', totalHarvests: 45, totalEarnings: 125000 },
      { name: 'Ogun Farmers Union', performance: 96.2, status: 'active', location: 'Ogun', totalHarvests: 38, totalEarnings: 98000 },
      { name: 'Oyo Extension Group', performance: 94.8, status: 'active', location: 'Oyo', totalHarvests: 42, totalEarnings: 115000 }
    ],
    performanceMetrics: {
      farmerRetentionRate: 91.2,
      commissionGrowth: 15.8,
      qualityScore: 88.5,
      averageResponseTime: 2.3
    }
  },
  geographic: {
    locations: [
      { name: 'Lagos', farmers: 45, commissions: 28, percentage: 28.8, revenue: 350000 },
      { name: 'Ogun', farmers: 38, commissions: 22, percentage: 24.7, revenue: 280000 },
      { name: 'Oyo', farmers: 42, commissions: 25, percentage: 28.1, revenue: 320000 },
      { name: 'Osun', farmers: 31, commissions: 14, percentage: 18.4, revenue: 200000 }
    ],
    distribution: [
      { region: 'Southwest', count: 156, color: '#3B82F6', growth: 12.5 },
      { region: 'Southeast', count: 89, color: '#10B981', growth: 8.2 },
      { region: 'North Central', count: 67, color: '#F59E0B', growth: 6.8 }
    ]
  },
  trends: {
    farmerGrowth: [120, 128, 135, 142, 148, 156],
    commissionTrends: [65, 72, 78, 82, 85, 89],
    qualityMetrics: [85, 87, 86, 88, 89, 88.5],
    revenueTrends: [850000, 920000, 980000, 1050000, 1120000, 1250000],
    timeLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  },
  insights: [
    {
      type: 'positive',
      title: 'Strong Farmer Growth',
      description: 'Farmer onboarding increased by 12.5% this month',
      impact: 'High',
      recommendation: 'Continue current onboarding strategies',
      priority: 'high'
    },
    {
      type: 'positive',
      title: 'Revenue Increase',
      description: 'Total revenue grew by 11.6% compared to last month',
      impact: 'High',
      recommendation: 'Maintain quality standards to sustain growth',
      priority: 'high'
    },
    {
      type: 'neutral',
      title: 'Quality Metrics Stable',
      description: 'Quality score remains consistent at 88.5%',
      impact: 'Medium',
      recommendation: 'Focus on improving quality in lower-performing regions',
      priority: 'medium'
    }
  ],
  financials: {
    monthlyRevenue: [850000, 920000, 980000, 1050000, 1120000, 1250000],
    commissionBreakdown: [
      { category: 'Harvest Approvals', amount: 450000, percentage: 36.0 },
      { category: 'Marketplace Fees', amount: 375000, percentage: 30.0 },
      { category: 'Training Services', amount: 250000, percentage: 20.0 },
      { category: 'Extension Services', amount: 175000, percentage: 14.0 }
    ],
    payoutHistory: [
      { date: '2024-06-01', amount: 45000, status: 'completed', reference: 'PAY-001' },
      { date: '2024-05-15', amount: 38000, status: 'completed', reference: 'PAY-002' },
      { date: '2024-05-01', amount: 42000, status: 'completed', reference: 'PAY-003' }
    ]
  }
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private getCacheKey(filters: AnalyticsFilters): string {
    return JSON.stringify(filters)
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  async getDashboardAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
    const cacheKey = this.getCacheKey(filters)
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Try to fetch from API first
      const response = await apiService.getFarmerAnalytics()
      const data = response.data || response
      this.setCache(cacheKey, data)
      return data as AnalyticsData
    } catch (error) {
      console.warn('API call failed, using mock data:', error)
      // Fallback to mock data when API fails
      this.setCache(cacheKey, mockAnalyticsData)
      return mockAnalyticsData
    }
  }

  async getPerformanceAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['performance']> {
    try {
      const response = await apiService.getPerformanceAnalytics(filters)
      return response.data
    } catch (error) {
      console.warn('Performance API call failed, using mock data:', error)
      return mockAnalyticsData.performance
    }
  }

  async getGeographicAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['geographic']> {
    try {
      const response = await apiService.getGeographicAnalytics(filters)
      return response.data
    } catch (error) {
      console.warn('Geographic API call failed, using mock data:', error)
      return mockAnalyticsData.geographic
    }
  }

  async getFinancialAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['financials']> {
    try {
      const response = await apiService.getFinancialAnalytics(filters)
      return response.data
    } catch (error) {
      console.warn('Financial API call failed, using mock data:', error)
      return mockAnalyticsData.financials
    }
  }

  async getTrendAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['trends']> {
    try {
      const response = await apiService.getTrendAnalytics(filters)
      return response.data
    } catch (error) {
      console.warn('Trend API call failed, using mock data:', error)
      return mockAnalyticsData.trends
    }
  }

  async generateReport(config: ReportConfig): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await apiService.generateAnalyticsReport(config)
      return response.data
    } catch (error) {
      console.warn('Report generation API call failed, using mock response:', error)
      // Return mock report data
      return {
        downloadUrl: '#',
        filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
      }
    }
  }

  async exportData(filters: AnalyticsFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const period = filters.timeRange === 'custom' ? '30d' : filters.timeRange || '30d'
      await apiService.exportAnalyticsData('user', period, format)
      // Return a mock blob since the method doesn't return a blob
      return new Blob(['Mock export data'], { type: 'text/csv' })
    } catch (error) {
      console.warn('Export API call failed, generating mock export:', error)
      // Generate mock CSV data
      const csvContent = this.generateMockCSV(filters, format)
      return new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    }
  }

  private generateMockCSV(filters: AnalyticsFilters, format: string): string {
    const headers = ['Month', 'Farmers', 'Commissions', 'Revenue', 'Growth']
    const rows = mockAnalyticsData.performance.monthlyMetrics.map(metric => [
      metric.month,
      metric.farmers,
      metric.commissions,
      metric.revenue,
      `${metric.growth}%`
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    return csvContent
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()
