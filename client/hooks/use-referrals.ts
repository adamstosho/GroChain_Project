import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'
import { referralService, Referral, ReferralStats, ReferralFilters, CreateReferralData, UpdateReferralData } from '@/lib/referral-service'
import { useAuthStore } from '@/lib/auth'

export function useReferrals() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filters, setFilters] = useState<ReferralFilters>({
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

  // Fetch referrals
  const fetchReferrals = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await referralService.getReferrals(filters)
      setReferrals(result.referrals || [])
      setPagination(result.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
      })
    } catch (error: any) {
      console.error('❌ Failed to fetch referrals:', error)
      setReferrals([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
      })
      toast({
        title: "Error loading referrals",
        description: error.message || "Failed to load referrals",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  // Fetch referral stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await referralService.getReferralStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Failed to fetch referral stats:', error)
      // Set default stats to prevent undefined errors
      setStats({
        totalReferrals: 0,
        pendingReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        conversionRate: 0,
        monthlyGrowth: 0,
        averageCommission: 0,
        statusBreakdown: [],
        performanceData: []
      })
    }
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchReferrals(),
        fetchStats()
      ])
      toast({
        title: "Data refreshed",
        description: "Referral data has been updated",
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
  }, [fetchReferrals, fetchStats, toast])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ReferralFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }, [])

  // Create referral
  const createReferral = useCallback(async (data: CreateReferralData): Promise<Referral> => {
    try {
      const newReferral = await referralService.createReferral(data)
      
      // Update local state
      setReferrals(prev => [newReferral, ...prev])
      
      toast({
        title: "Referral created",
        description: "New farmer referral has been added successfully",
      })
      
      return newReferral
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create referral",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Update referral
  const updateReferral = useCallback(async (id: string, data: UpdateReferralData): Promise<Referral> => {
    try {
      const updatedReferral = await referralService.updateReferral(id, data)
      
      // Update local state
      setReferrals(prev => 
        prev.map(referral => 
          referral._id === id ? updatedReferral : referral
        )
      )
      
      toast({
        title: "Referral updated",
        description: "Referral has been updated successfully",
      })
      
      return updatedReferral
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update referral",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Delete referral
  const deleteReferral = useCallback(async (id: string): Promise<void> => {
    try {
      await referralService.deleteReferral(id)
      
      // Update local state
      setReferrals(prev => prev.filter(referral => referral._id !== id))
      
      toast({
        title: "Referral deleted",
        description: "Referral has been removed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete referral",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Clear cache
  const clearCache = useCallback(() => {
    referralService.clearCache()
  }, [])

  // Load initial data
  useEffect(() => {
    if (user?._id) {
      Promise.all([
        fetchReferrals(),
        fetchStats()
      ])
    }
  }, [user?._id, fetchReferrals, fetchStats])

  // Refetch when filters change
  useEffect(() => {
    if (user?._id) {
      fetchReferrals()
    }
  }, [filters, user?._id, fetchReferrals])

  return {
    // State
    referrals,
    stats,
    isLoading,
    isRefreshing,
    filters,
    pagination,
    
    // Actions
    fetchReferrals,
    fetchStats,
    refreshData,
    updateFilters,
    createReferral,
    updateReferral,
    deleteReferral,
    clearCache,
    
    // Computed values
    pendingReferrals: referrals.filter(r => r.status === 'pending'),
    activeReferrals: referrals.filter(r => r.status === 'active'),
    completedReferrals: referrals.filter(r => r.status === 'completed'),
    cancelledReferrals: referrals.filter(r => r.status === 'cancelled'),
    
    // Utility functions
    getReferralStatusColor: referralService.getReferralStatusColor,
    getReferralStatusIcon: referralService.getReferralStatusIcon,
    formatCurrency: referralService.formatCurrency,
    formatDate: referralService.formatDate,
    calculateConversionRate: referralService.calculateConversionRate
  }
}
