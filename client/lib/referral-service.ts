import { apiService } from './api'
import { Referral, ReferralStats, ReferralFilters, CreateReferralData, UpdateReferralData } from './types/referrals'

// Mock data for development
const mockReferrals: Referral[] = [
  {
    _id: "1",
    farmer: {
      _id: "farmer1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+2348000000001",
      region: "Lagos"
    },
    partner: {
      _id: "partner1",
      name: "Sample Partner",
      type: "cooperative",
      contactEmail: "partner@example.com"
    },
    status: "completed",
    commissionRate: 0.05,
    commission: 2500,
    notes: "Successful rice farmer referral",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-25")
  },
  {
    _id: "2",
    farmer: {
      _id: "farmer2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+2348000000002",
      region: "Ogun"
    },
    partner: {
      _id: "partner1",
      name: "Sample Partner",
      type: "cooperative",
      contactEmail: "partner@example.com"
    },
    status: "active",
    commissionRate: 0.05,
    notes: "Maize farmer referral",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-20")
  },
  {
    _id: "3",
    farmer: {
      _id: "farmer3",
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+2348000000003",
      region: "Oyo"
    },
    partner: {
      _id: "partner1",
      name: "Sample Partner",
      type: "cooperative",
      contactEmail: "partner@example.com"
    },
    status: "pending",
    commissionRate: 0.05,
    notes: "Cassava farmer referral",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20")
  }
]

const mockReferralStats: ReferralStats = {
  totalReferrals: 45,
  pendingReferrals: 8,
  activeReferrals: 22,
  completedReferrals: 15,
  conversionRate: 33.3,
  monthlyGrowth: 5,
  averageCommission: 1800,
  statusBreakdown: [
    { _id: 'pending', count: 8 },
    { _id: 'active', count: 22 },
    { _id: 'completed', count: 15 }
  ],
  performanceData: [
    { month: 'Jan', referrals: 8, completed: 3, conversion: 37.5 },
    { month: 'Feb', referrals: 12, completed: 4, conversion: 33.3 },
    { month: 'Mar', referrals: 15, completed: 5, conversion: 33.3 },
    { month: 'Apr', referrals: 10, completed: 3, conversion: 30.0 }
  ]
}

export class ReferralService {
  private static instance: ReferralService
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService()
    }
    return ReferralService.instance
  }

  private getCacheKey(key: string): string {
    return `referral_${key}`
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

  async getReferrals(filters: ReferralFilters = {}): Promise<{ referrals: Referral[]; pagination: any }> {
    const cacheKey = `referrals_${JSON.stringify(filters)}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getReferrals(filters)

      const result = {
        referrals: (response.data?.docs || []) as unknown as Referral[],
        pagination: {
          currentPage: response.data?.page || 1,
          totalPages: response.data?.totalPages || 1,
          totalItems: response.data?.totalDocs || 0,
          itemsPerPage: response.data?.limit || 20
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Referral API call failed:', error)

      // Return empty data instead of mock data for production
      const result = {
        referrals: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20
        }
      }
      this.setCache(cacheKey, result)
      return result
    }
  }

  async getReferralById(id: string): Promise<Referral> {
    const cacheKey = `referral_${id}`
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getReferrals({})
      const referral = (response.data?.docs || []).find((r: any) => r._id === id) as unknown as Referral
      if (!referral) {
        throw new Error('Referral not found')
      }
      this.setCache(cacheKey, referral)
      return referral
    } catch (error) {
      console.warn('API call failed, using mock data:', error)
      // Fallback to mock data
      const referral = mockReferrals.find(r => r._id === id)
      if (referral) {
        this.setCache(cacheKey, referral)
        return referral
      }
      throw new Error('Referral not found')
    }
  }

  async getReferralStats(): Promise<ReferralStats> {
    const cacheKey = 'stats'
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getReferralStats()
      const stats = response.data as ReferralStats
      this.setCache(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Referral stats API call failed:', error)

      // Return default stats instead of mock data
      const defaultStats: ReferralStats = {
        totalReferrals: 0,
        pendingReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        conversionRate: 0,
        monthlyGrowth: 0,
        averageCommission: 0,
        statusBreakdown: [],
        performanceData: []
      }
      this.setCache(cacheKey, defaultStats)
      return defaultStats
    }
  }

  async getPerformanceStats(period: string = 'month'): Promise<any> {
    const cacheKey = `performance_${period}`
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const response = await apiService.getReferralPerformanceStats(period)
      const stats = response.data
      this.setCache(cacheKey, stats)
      return stats
    } catch (error) {
      console.warn('API call failed, using mock data:', error)
      // Fallback to mock data
      const mockPerformance = {
        period,
        data: mockReferralStats.performanceData
      }
      this.setCache(cacheKey, mockPerformance)
      return mockPerformance
    }
  }

  async createReferral(data: CreateReferralData): Promise<Referral> {
    try {
      const response = await apiService.createReferral(data)
      // Clear related cache
      this.clearCache()
      return response.data as Referral
    } catch (error) {
      console.error('Failed to create referral:', error)
      throw error
    }
  }

  async updateReferral(id: string, data: UpdateReferralData): Promise<Referral> {
    try {
      const response = await apiService.updateReferral(id, data)
      // Clear related cache
      this.clearCache()
      return response.data as Referral
    } catch (error) {
      console.error('Failed to update referral:', error)
      throw error
    }
  }

  async deleteReferral(id: string): Promise<void> {
    try {
      await apiService.deleteReferral(id)
      // Clear related cache
      this.clearCache()
    } catch (error) {
      console.error('Failed to delete referral:', error)
      throw error
    }
  }

  // Utility methods
  getReferralStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getReferralStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳'
      case 'active': return '✅'
      case 'completed': return '💰'
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

  calculateConversionRate(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100 * 10) / 10
  }
}

export const referralService = ReferralService.getInstance()

// Re-export types for external use
export type {
  Referral,
  ReferralStats,
  ReferralFilters,
  CreateReferralData,
  UpdateReferralData
} from './types/referrals'
