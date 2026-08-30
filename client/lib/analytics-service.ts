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

    const response = await apiService.getFarmerAnalytics()
    const data = response.data || response
    this.setCache(cacheKey, data)
    return data as AnalyticsData
  }

  async getPerformanceAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['performance']> {
    const response = await apiService.getPerformanceAnalytics(filters as Record<string, unknown>)
    return response.data as AnalyticsData['performance']
  }

  async getGeographicAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['geographic']> {
    const response = await apiService.getGeographicAnalytics(filters as Record<string, unknown>)
    return response.data as AnalyticsData['geographic']
  }

  async getFinancialAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['financials']> {
    const response = await apiService.getFinancialAnalytics(filters as Record<string, unknown>)
    return response.data as AnalyticsData['financials']
  }

  async getTrendAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData['trends']> {
    const response = await apiService.getTrendAnalytics(filters as Record<string, unknown>)
    return response.data as AnalyticsData['trends']
  }

  async generateReport(config: ReportConfig): Promise<{ downloadUrl: string; filename: string }> {
    const response = await apiService.generateAnalyticsReport(config)
    return response.data as { downloadUrl: string; filename: string }
  }

  // apiService.exportAnalyticsData triggers the file download itself; this just forwards the call.
  async exportData(filters: AnalyticsFilters, format: 'csv' | 'excel' = 'csv'): Promise<void> {
    const period = filters.timeRange === 'custom' ? '30d' : filters.timeRange || '30d'
    await apiService.exportAnalyticsData('user', period, format)
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
