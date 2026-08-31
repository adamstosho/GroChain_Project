import { apiService } from "./api"
import { asRecord, getErrorMessage, getErrorStatus } from "./error-utils"
import { 
  HarvestApproval, 
  ApprovalStats, 
  ApprovalFilters, 
  BatchApprovalAction,
  QualityAssessment,
  ApprovalMetrics
} from "./types/approvals"

export class ApprovalsService {
  private static instance: ApprovalsService
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): ApprovalsService {
    if (!ApprovalsService.instance) {
      ApprovalsService.instance = new ApprovalsService()
    }
    return ApprovalsService.instance
  }

  private getCacheKey(key: string): string {
    return `approvals-${key}`
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private getCache(key: string): unknown | null {
    const cached = this.cache.get(key)
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  // Fetch all approvals with filters
  async getApprovals(filters: ApprovalFilters = {}): Promise<HarvestApproval[]> {
    const cacheKey = this.getCacheKey(`approvals-${JSON.stringify(filters)}`)
    const cached = this.getCache(cacheKey)

    if (cached) {
      console.log('Returning cached approvals data')
      return cached as HarvestApproval[]
    }

    // If no cache, try to fetch fresh data with retry logic
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Fetching approvals from API (attempt ${attempt}) with filters:`, filters)

        // Try real API first - use getAllHarvests to get all harvests (pending, approved, rejected)
        const response = await apiService.getAllHarvests(filters as Record<string, unknown>)
        console.log('API response received:', response)

      // Handle different response structures
      let harvests: unknown[] = []
      const responseData = response?.data
      const dataRec = asRecord(responseData)
      if (Array.isArray(dataRec.harvests)) {
        harvests = dataRec.harvests
      } else if (Array.isArray(responseData)) {
        harvests = responseData
      } else if (Array.isArray(response)) {
        harvests = response
      }

      console.log(`Found ${harvests.length} harvests from API`)

      // Transform backend data to match frontend interface
      const approvals: HarvestApproval[] = harvests.map((harvestUnknown) => {
        const harvest = asRecord(harvestUnknown)
        const farmer = asRecord(harvest.farmer)
        const qualityMetrics = asRecord(harvest.qualityMetrics)
        const photos = Array.isArray(harvest.images) ? harvest.images.filter((p): p is string => typeof p === 'string') : []
        const quantity = typeof harvest.quantity === 'number' ? harvest.quantity : 0
        const price = typeof harvest.price === 'number' ? harvest.price : quantity * 100
        const farmerId = (typeof farmer._id === 'string' && farmer._id) || (typeof farmer.id === 'string' && farmer.id) || ''
        return {
        _id: typeof harvest._id === 'string' ? harvest._id : '',
        farmer: {
          _id: farmerId,
          name: typeof farmer.name === 'string' ? farmer.name : 'Unknown Farmer',
          email: typeof farmer.email === 'string' ? farmer.email : '',
          phone: typeof farmer.phone === 'string' ? farmer.phone : '',
          location: (typeof farmer.location === 'string' && farmer.location) || (typeof harvest.location === 'string' && harvest.location) || '',
          avatar: typeof farmer.avatar === 'string' ? farmer.avatar : undefined
        },
        harvest: {
          _id: typeof harvest._id === 'string' ? harvest._id : '',
          cropType: typeof harvest.cropType === 'string' ? harvest.cropType : 'Unknown Crop',
          quantity,
          unit: typeof harvest.unit === 'string' ? harvest.unit : 'kg',
          harvestDate: (harvest.date || harvest.createdAt || new Date()) as Date,
          qualityScore: typeof qualityMetrics.moistureContent === 'number' ? qualityMetrics.moistureContent : 8.0,
          photos,
          description: typeof harvest.description === 'string' ? harvest.description : ''
        },
        status: (typeof harvest.status === 'string' ? harvest.status : 'pending') as HarvestApproval['status'],
        submittedAt: (harvest.createdAt || harvest.date || new Date()) as Date,
        reviewedAt: harvest.verifiedAt as Date | undefined,
        reviewedBy: typeof harvest.verifiedBy === 'string' ? harvest.verifiedBy : undefined,
        priority: 'medium',
        estimatedValue: price,
        location: (typeof harvest.location === 'string' && harvest.location) || (typeof farmer.location === 'string' && farmer.location) || 'Unknown',
        rejectionReason: typeof harvest.rejectionReason === 'string' ? harvest.rejectionReason : undefined,
        approvalNotes: typeof harvest.approvalNotes === 'string' ? harvest.approvalNotes : undefined
      }
      })

        console.log(`Transformed ${approvals.length} approvals`)
      this.setCache(cacheKey, approvals)
      return approvals

      } catch (apiError: unknown) {
        console.error(`API call failed (attempt ${attempt}), error details:`, {
          message: getErrorMessage(apiError),
          status: getErrorStatus(apiError),
          endpoint: '/api/harvest-approval/pending'
        })

        // If this is not the last attempt, wait and retry
        if (attempt < 2) {
          console.log(`Retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        // Last attempt failed - don't clear cache, return cached data if available
        console.log('All API attempts failed, returning cached data if available')

        // Return cached data if available, otherwise empty array
        const fallbackCached = this.getCache(cacheKey)
        if (fallbackCached) {
          console.log('Returning cached data due to API failure')
          return fallbackCached as HarvestApproval[]
        }

        // If no cached data and API failed, return empty array but don't throw
        console.warn('No cached data available and API failed - returning empty array')
        return []
    }
    }

    // This should never be reached, but just in case
    console.error('Unexpected end of retry loop')
    return []
  }

  // Fetch approval statistics
  async getApprovalStats(): Promise<ApprovalStats> {
    const cacheKey = this.getCacheKey('stats')
    const cached = this.getCache(cacheKey)

    if (cached) {
      console.log('Returning cached approval stats')
      return cached as ApprovalStats
    }

    try {
      console.log('Fetching approval stats from API')

      // Try real API first
      const response = await apiService.getApprovalStats()
      console.log('Stats API response received:', response)

      // Handle different response structures
      const stats = response?.data || response

      // Ensure all required fields are present with defaults
      const defaultStats: ApprovalStats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        underReview: 0,
        averageQualityScore: 0,
        totalValue: 0,
        weeklyTrend: 0
      }

      const statsData = { ...defaultStats, ...(stats as ApprovalStats) }
      console.log('Processed stats:', statsData)

      this.setCache(cacheKey, statsData)
      return statsData

    } catch (apiError: unknown) {
      console.error('Stats API call failed, error details:', {
        message: getErrorMessage(apiError),
        status: getErrorStatus(apiError),
        endpoint: '/api/harvest-approval/stats'
      })

      // Don't clear cache on error - keep existing cached data
      console.log('Stats API failed, returning cached data if available')

      // Return cached data if available, otherwise default stats
      const cachedStats = this.getCache(cacheKey)
      if (cachedStats) {
        console.log('Returning cached stats due to API failure')
        return cachedStats as ApprovalStats
      }

      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        underReview: 0,
        averageQualityScore: 0,
        totalValue: 0,
        weeklyTrend: 0
      }
    }
  }

  // Fetch single approval by ID
  async getApprovalById(approvalId: string): Promise<HarvestApproval> {
    try {
      const response = await apiService.getApprovalById(approvalId)
      return response.data as unknown as HarvestApproval
    } catch (error) {
      console.error('Error fetching approval:', error)
      throw error
    }
  }

  // Approve a harvest
  async approveHarvest(approvalId: string, notes?: string, qualityAssessment?: QualityAssessment): Promise<HarvestApproval> {
    const requestData = {
      quality: qualityAssessment?.overallScore?.toString() || 'excellent',
      notes: notes,
      agriculturalData: qualityAssessment
    }
    const result = await apiService.approveHarvest(approvalId, requestData)
    return result.data as unknown as HarvestApproval
  }

  // Reject a harvest
  async rejectHarvest(approvalId: string, reason: string, notes?: string): Promise<HarvestApproval> {
    const result = await apiService.rejectHarvest(approvalId, {
      rejectionReason: reason,
      reason: reason,
      notes: notes
    })
    return result.data as unknown as HarvestApproval
  }

  // Mark harvest for review
  async markForReview(approvalId: string, notes?: string): Promise<HarvestApproval> {
    try {
      const response = await apiService.markForReview(approvalId, { notes })
      this.clearCache() // Clear cache after status change
      return response.data as unknown as HarvestApproval
    } catch (error) {
      console.error('Error marking for review:', error)
      throw error
    }
  }

  // Batch approve/reject multiple harvests
  async batchProcessApprovals(batchAction: BatchApprovalAction): Promise<{ success: number; failed: number }> {
    try {
      // Use real API endpoint
      const response = await apiService.bulkProcessApprovals(batchAction)

      this.clearCache() // Clear cache after batch processing
      return response.data as unknown as { success: number; failed: number }
    } catch (error) {
      console.error('Error processing batch approvals:', error)
      throw error
    }
  }

  // Get approval metrics
  async getApprovalMetrics(filters?: ApprovalFilters): Promise<ApprovalMetrics> {
    const cacheKey = this.getCacheKey(`metrics-${JSON.stringify(filters)}`)
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached as ApprovalMetrics
    }

    try {
      const response = await apiService.getApprovalMetrics(filters as Record<string, unknown>)
      this.setCache(cacheKey, response.data)
      return response.data as unknown as ApprovalMetrics
    } catch (error) {
      console.error('Error fetching approval metrics:', error)
      throw error
    }
  }

  // Get approval history
  async getApprovalHistory(approvalId: string): Promise<unknown[]> {
    try {
      const response = await apiService.getApprovalHistory(approvalId)
      const data = response.data
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching approval history:', error)
      throw error
    }
  }

  // Export approvals data
  async exportApprovals(filters: ApprovalFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await apiService.exportApprovals(filters as Record<string, unknown>, format)
      return response
    } catch (error) {
      console.error('Error exporting approvals:', error)
      throw error
    }
  }

  // Utility methods for data processing
  filterApprovals(approvals: HarvestApproval[], filters: ApprovalFilters): HarvestApproval[] {
    let filtered = [...approvals]

    // Search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(approval =>
        approval.farmer.name.toLowerCase().includes(searchTerm) ||
        approval.harvest.cropType.toLowerCase().includes(searchTerm) ||
        approval.farmer.location.toLowerCase().includes(searchTerm) ||
        approval.harvest.description.toLowerCase().includes(searchTerm)
      )
    }

    // Status filter (under_review is a display alias for revision_requested)
    if (filters.status && filters.status !== 'all') {
      const statusAliases =
        filters.status === 'revision_requested' || filters.status === 'under_review'
          ? ['revision_requested', 'under_review']
          : [filters.status]
      filtered = filtered.filter(approval => statusAliases.includes(approval.status))
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(approval => approval.priority === filters.priority)
    }

    // Crop type filter
    if (filters.cropType && filters.cropType !== 'all') {
      filtered = filtered.filter(approval => approval.harvest.cropType === filters.cropType)
    }

    // Location filter
    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(approval => approval.location === filters.location)
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(approval => {
        const submittedDate = new Date(approval.submittedAt)
        return submittedDate >= filters.dateRange!.start && submittedDate <= filters.dateRange!.end
      })
    }

    return filtered
  }

  sortApprovals(approvals: HarvestApproval[], sortBy: string = 'submittedAt', sortOrder: 'asc' | 'desc' = 'desc'): HarvestApproval[] {
    const sorted = [...approvals]

    sorted.sort((a, b) => {
      let aValue: unknown
      let bValue: unknown

      switch (sortBy) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt)
          bValue = new Date(b.submittedAt)
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
          break
        case 'estimatedValue':
          aValue = a.estimatedValue
          bValue = b.estimatedValue
          break
        case 'farmerName':
          aValue = a.farmer.name.toLowerCase()
          bValue = b.farmer.name.toLowerCase()
          break
        case 'cropType':
          aValue = a.harvest.cropType.toLowerCase()
          bValue = b.harvest.cropType.toLowerCase()
          break
        default:
          aValue = a[sortBy as keyof HarvestApproval]
          bValue = b[sortBy as keyof HarvestApproval]
      }

      const comparableA = aValue instanceof Date ? aValue.getTime() : aValue
      const comparableB = bValue instanceof Date ? bValue.getTime() : bValue
      const left = typeof comparableA === 'number' || typeof comparableA === 'string' ? comparableA : String(comparableA)
      const right = typeof comparableB === 'number' || typeof comparableB === 'string' ? comparableB : String(comparableB)
      if (left < right) return sortOrder === 'asc' ? -1 : 1
      if (left > right) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  paginateApprovals(approvals: HarvestApproval[], page: number, pageSize: number): {
    data: HarvestApproval[]
    total: number
    totalPages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  } {
    const total = approvals.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const data = approvals.slice(startIndex, endIndex)

    return {
      data,
      total,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  // Calculate approval statistics from data
  calculateStats(approvals: HarvestApproval[]): ApprovalStats {
    const total = approvals.length
    const pending = approvals.filter(a => a.status === 'pending').length
    const approved = approvals.filter(a => a.status === 'approved').length
    const rejected = approvals.filter(a => a.status === 'rejected').length
    const underReview = approvals.filter(a => a.status === 'revision_requested' || a.status === 'under_review').length
    
    const qualityScores = approvals
      .filter(a => a.harvest.qualityScore)
      .map(a => a.harvest.qualityScore!)
    
    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0
    
    const totalValue = approvals
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + a.estimatedValue, 0)
    
    // Calculate weekly trend (mock data for now)
    const weeklyTrend = 12.5

    return {
      total,
      pending,
      approved,
      rejected,
      underReview,
      averageQualityScore: Math.round(averageQualityScore * 10) / 10,
      totalValue,
      weeklyTrend
    }
  }

  // Get quality score color based on score
  getQualityScoreColor(score: number): string {
    if (score >= 8) return "text-success"
    if (score >= 6) return "text-warning"
    return "text-destructive"
  }

  // Get quality score label
  getQualityScoreLabel(score: number): string {
    if (score >= 8) return "Excellent"
    if (score >= 6) return "Good"
    if (score >= 4) return "Average"
    return "Poor"
  }


  // Clear cache
  clearCache(): void {
    console.log('Clearing approvals cache - size before:', this.cache.size)
    this.cache.clear()
    console.log('Cache cleared successfully')
  }

  // Clear specific cache entry
  clearCacheEntry(key: string): void {
    const cacheKey = this.getCacheKey(key)
    const existed = this.cache.delete(cacheKey)
    console.log(`Cleared cache entry "${key}":`, existed ? 'found and removed' : 'not found')
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const approvalsService = ApprovalsService.getInstance()

// Re-export types for external use
export type {
  HarvestApproval,
  ApprovalStats,
  ApprovalFilters,
  ApprovalAction,
  BatchApprovalAction,
  QualityAssessment,
  ApprovalMetrics
} from "./types/approvals"
