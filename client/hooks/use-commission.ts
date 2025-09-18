import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'
import { commissionService, Commission, CommissionStats, CommissionSummary, CommissionFilters } from '@/lib/commission-service'
import { useAuthStore } from '@/lib/auth'

export function useCommission() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filters, setFilters] = useState<CommissionFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })

  // Fetch commissions
  const fetchCommissions = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await commissionService.getCommissions(filters)
      setCommissions(result.commissions)
      setPagination(result.pagination)
    } catch (error: any) {
      toast({
        title: "Error loading commissions",
        description: error.message || "Failed to load commissions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  // Fetch commission stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await commissionService.getCommissionStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Failed to fetch commission stats:', error)
    }
  }, [])

  // Fetch partner commission summary
  const fetchSummary = useCallback(async () => {
    if (!user?._id) return
    
    try {
      const summaryData = await commissionService.getPartnerCommissionSummary(user._id)
      setSummary(summaryData)
    } catch (error: any) {
      console.error('Failed to fetch commission summary:', error)
    }
  }, [user?._id])

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchCommissions(),
        fetchStats(),
        fetchSummary()
      ])
      toast({
        title: "Data refreshed",
        description: "Commission data has been updated",
      })
    } catch (error: any) {
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh data",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchCommissions, fetchStats, fetchSummary, toast])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CommissionFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }, [])

  // Update commission status
  const updateCommissionStatus = useCallback(async (id: string, status: string, notes?: string) => {
    try {
      const updatedCommission = await commissionService.updateCommissionStatus(id, { status, notes })
      
      // Update local state
      setCommissions(prev => 
        prev.map(commission => 
          commission._id === id ? updatedCommission : commission
        )
      )
      
      toast({
        title: "Status updated",
        description: `Commission status updated to ${status}`,
      })
      
      return updatedCommission
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update commission status",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Process commission payout
  const processPayout = useCallback(async (commissionIds: string[], payoutMethod: string, payoutDetails: any) => {
    try {
      const result = await commissionService.processCommissionPayout({
        commissionIds,
        payoutMethod,
        payoutDetails
      })
      
      toast({
        title: "Payout processed",
        description: `Successfully processed payout for ${result.processedCommissions} commissions`,
      })
      
      // Refresh data to show updated statuses
      await refreshData()
      
      return result
    } catch (error: any) {
      toast({
        title: "Payout failed",
        description: error.message || "Failed to process payout",
        variant: "destructive"
      })
      throw error
    }
  }, [refreshData, toast])

  // Clear cache
  const clearCache = useCallback(() => {
    commissionService.clearCache()
  }, [])

  // Load initial data
  useEffect(() => {
    if (user?._id) {
      Promise.all([
        fetchCommissions(),
        fetchStats(),
        fetchSummary()
      ])
    }
  }, [user?._id, fetchCommissions, fetchStats, fetchSummary])

  // Refetch when filters change
  useEffect(() => {
    if (user?._id) {
      fetchCommissions()
    }
  }, [filters, user?._id, fetchCommissions])

  return {
    // State
    commissions,
    stats,
    summary,
    isLoading,
    isRefreshing,
    filters,
    pagination,
    
    // Actions
    fetchCommissions,
    fetchStats,
    fetchSummary,
    refreshData,
    updateFilters,
    updateCommissionStatus,
    processPayout,
    clearCache,
    
    // Computed values
    pendingCommissions: commissions.filter(c => c.status === 'pending'),
    approvedCommissions: commissions.filter(c => c.status === 'approved'),
    paidCommissions: commissions.filter(c => c.status === 'paid'),
    cancelledCommissions: commissions.filter(c => c.status === 'cancelled'),
    
    totalPendingAmount: commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0),
    
    totalPaidAmount: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0)
  }
}
