import { apiService } from './api'

export interface Commission {
  _id: string
  partner: {
    _id: string
    name: string
    organization: string
  }
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
  }
  order: {
    _id: string
    orderNumber: string
    total: number
    status: string
  }
  listing: {
    _id: string
    cropName: string
    price: number
  }
  amount: number
  rate: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  orderAmount: number
  orderDate: Date
  paidAt?: Date
  withdrawalId?: string
  notes?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface CommissionStats {
  totalCommissions: number
  totalAmount: number
  statusBreakdown: Array<{
    _id: string
    count: number
    totalAmount: number
  }>
  monthlyBreakdown: Array<{
    _id: {
      year: number
      month: number
    }
    count: number
    totalAmount: number
  }>
  averageCommission: number
}

export interface CommissionSummary {
  summary: {
    totalCommissions: number
    pendingCommissions: number
    paidCommissions: number
    totalAmount: number
    pendingAmount: number
    paidAmount: number
  }
  recentCommissions: Commission[]
}

export interface CommissionFilters {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// REAL DATA ONLY - No mock data fallbacks

export class CommissionService {
  private static instance: CommissionService
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService()
    }
    return CommissionService.instance
  }

  private getCacheKey(key: string): string {
    return `commission_${key}`
  }

  private getCache(key: string): any {
    const cacheKey = this.getCacheKey(key)
    const expiry = this.cacheExpiry.get(cacheKey)
    
    if (expiry && Date.now() < expiry) {
      return this.cache.get(cacheKey)
    }
    
    // Clear expired cache
    this.cache.delete(cacheKey)
    this.cacheExpiry.delete(cacheKey)
    return null
  }

  private setCache(key: string, data: any): void {
    const cacheKey = this.getCacheKey(key)
    this.cache.set(cacheKey, data)
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)
  }

  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }

  async getCommissions(filters: CommissionFilters = {}): Promise<{ commissions: Commission[]; pagination: any }> {
    const cacheKey = `commissions_${JSON.stringify(filters)}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getCommissions(filters)
      const data = response.data
      if (!data) {
        throw new Error('No data received from server')
      }
      const result = {
        commissions: (data.commissions || []) as Commission[],
        pagination: data.pagination || {}
      }
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Failed to fetch commissions:', error)
      // No mock data fallback - throw error
      throw new Error('Failed to fetch commissions from server')
    }
  }

  async getCommissionById(id: string): Promise<Commission> {
    const cacheKey = `commission_${id}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      // Use getCommissions with filter to find specific commission
      const response = await apiService.getCommissions({})
      const commissions = response.data?.commissions || []
      const commission = commissions.find((c: any) => c._id === id)
      
      if (!commission) {
        throw new Error('Commission not found')
      }
      
      this.setCache(cacheKey, commission)
      return commission as Commission
    } catch (error) {
      console.error('Failed to fetch commission:', error)
      throw new Error('Failed to fetch commission from server')
    }
  }

  async getCommissionStats(filters: any = {}): Promise<CommissionStats> {
    const cacheKey = `stats_${JSON.stringify(filters)}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getCommissionStats(filters)
      const stats = response.data as CommissionStats
      this.setCache(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Failed to fetch commission stats:', error)
      throw new Error('Failed to fetch commission stats from server')
    }
  }

  async getPartnerCommissionSummary(partnerId: string): Promise<CommissionSummary> {
    const cacheKey = `summary_${partnerId}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getPartnerCommissionSummary(partnerId)
      const summary = response.data as unknown as CommissionSummary
      this.setCache(cacheKey, summary)
      return summary
    } catch (error) {
      console.error('Failed to fetch commission summary:', error)
      throw new Error('Failed to fetch commission summary from server')
    }
  }

  async updateCommissionStatus(id: string, data: { status: string; notes?: string }): Promise<Commission> {
    try {
      const response = await apiService.updateCommissionStatus(id, data)
      // Clear related cache
      this.clearCache()
      return response.data as Commission
    } catch (error) {
      console.error('Failed to update commission status:', error)
      throw error
    }
  }

  async processCommissionPayout(data: { commissionIds: string[]; payoutMethod: string; payoutDetails: any }): Promise<any> {
    try {
      const response = await apiService.processCommissionPayout(data)
      // Clear related cache
      this.clearCache()
      return response.data
    } catch (error) {
      console.error('Failed to process commission payout:', error)
      throw error
    }
  }

  // Utility methods
  getCommissionStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getCommissionStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳'
      case 'approved': return '✅'
      case 'paid': return '💰'
      case 'cancelled': return '❌'
      default: return '❓'
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }
}

export const commissionService = CommissionService.getInstance()
