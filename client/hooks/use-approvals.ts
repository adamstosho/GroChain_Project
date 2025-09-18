import React, { useState, useEffect, useCallback } from 'react'
import { approvalsService, HarvestApproval, ApprovalStats, ApprovalFilters } from '@/lib/approvals-service'
import { useToast } from './use-toast'

interface UseApprovalsReturn {
  approvals: HarvestApproval[]
  stats: ApprovalStats | null
  isLoading: boolean
  error: string | null
  filters: ApprovalFilters
  setFilters: (filters: ApprovalFilters) => void
  refreshData: () => Promise<void>
  approveHarvest: (approvalId: string, notes?: string) => Promise<void>
  rejectHarvest: (approvalId: string, reason: string, notes?: string) => Promise<void>
  markForReview: (approvalId: string, notes?: string) => Promise<void>
  batchProcess: (action: 'approve' | 'reject', approvalIds: string[], notes?: string, reason?: string) => Promise<void>
  exportData: (format: 'csv' | 'excel') => Promise<void>
  clearCache: () => void
}

export function useApprovals(initialFilters: ApprovalFilters = {}): UseApprovalsReturn {
  const [approvals, setApprovals] = useState<HarvestApproval[]>([])
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ApprovalFilters>(initialFilters)
  const { toast } = useToast()

  // Debug: Track approvals state changes
  React.useEffect(() => {
    console.log('useApprovals: Approvals state changed -', {
      count: approvals.length,
      firstItem: approvals[0]?.harvest?.cropType || 'none',
      timestamp: new Date().toISOString()
    })
  }, [approvals])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [approvalsData, statsData] = await Promise.all([
        approvalsService.getApprovals(filters),
        approvalsService.getApprovalStats()
      ])

      console.log('useApprovals: Fetched data -', {
        approvalsCount: approvalsData.length,
        stats: statsData
      })

      setApprovals(approvalsData)
      setStats(statsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch approvals data'
      setError(errorMessage)
      toast({
        title: "Error loading approvals",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  // Safeguard: Prevent approvals from being cleared if we have data and no error
  // Only restore if we have stats indicating there should be data
  React.useEffect(() => {
    if (approvals.length === 0 && !isLoading && !error && stats && stats.total > 0 && stats.pending > 0) {
      console.log('useApprovals: Approvals list cleared unexpectedly, attempting to restore data')
      console.log('Stats indicate there should be data:', { total: stats.total, pending: stats.pending })
      // Try to restore from cache or refetch
      fetchData()
    }
  }, [approvals.length, isLoading, error, stats, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setFilters = useCallback((newFilters: ApprovalFilters) => {
    setFiltersState(newFilters)
  }, [])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const approveHarvest = useCallback(async (approvalId: string, notes?: string) => {
    try {
      console.log('=== useApprovals: Starting approval for harvest:', approvalId, '===', { notes })
      setIsLoading(true)

      console.log('useApprovals: Calling approvalsService.approveHarvest...')
      const result = await approvalsService.approveHarvest(approvalId, notes)
      console.log('useApprovals: API approval successful, result:', result)

      // Refresh all data after approval to get updated status
      console.log('useApprovals: Refreshing all data after approval...')
      await fetchData()

      toast({
        title: "Harvest approved",
        description: "The harvest has been approved successfully",
      })
      console.log('useApprovals: Approval process completed successfully')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to approve harvest'
      console.error('=== useApprovals: Approval failed ===', {
        message: errorMessage,
        error: err,
        stack: err.stack
      })

      // If approval failed due to authorization (partner trying to approve non-network farmer)
      if (errorMessage.includes('You can only approve') || errorMessage.includes('Partner profile not found')) {
        toast({
          title: "Authorization Error",
          description: "You can only approve harvests from farmers in your network",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error approving harvest",
          description: errorMessage,
          variant: "destructive",
        })
      }
      // Don't throw - allow the UI to remain stable
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const rejectHarvest = useCallback(async (approvalId: string, reason: string, notes?: string) => {
    try {
      setIsLoading(true)

      await approvalsService.rejectHarvest(approvalId, reason, notes)

      // Refresh all data after rejection to get updated status
      console.log('useApprovals: Refreshing all data after rejection...')
      await fetchData()

      toast({
        title: "Harvest rejected",
        description: "The harvest has been rejected with reason provided",
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reject harvest'
      console.error('Rejection failed:', errorMessage)

      // If rejection failed due to authorization (partner trying to reject non-network farmer)
      if (errorMessage.includes('You can only reject') || errorMessage.includes('Partner profile not found')) {
        toast({
          title: "Authorization Error",
          description: "You can only reject harvests from farmers in your network",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error rejecting harvest",
          description: errorMessage,
          variant: "destructive",
        })
      }
      // Don't throw - allow the UI to remain stable
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const markForReview = useCallback(async (approvalId: string, notes?: string) => {
    try {
      setIsLoading(true)
      
      await approvalsService.markForReview(approvalId, notes)
      
      // Update local state
      setApprovals(prev => prev.map(a => 
        a._id === approvalId 
          ? { ...a, status: 'under_review', reviewedAt: new Date() }
          : a
      ))
      
      toast({
        title: "Harvest marked for review",
        description: "The harvest has been marked for further review",
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to mark harvest for review'
      toast({
        title: "Error marking for review",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const batchProcess = useCallback(async (action: 'approve' | 'reject', approvalIds: string[], notes?: string, reason?: string) => {
    try {
      if (approvalIds.length === 0) {
        toast({
          title: "No approvals selected",
          description: "Please select approvals to process",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      
      const batchAction = {
        approvalIds,
        action,
        notes,
        reason
      }
      
      await approvalsService.batchProcessApprovals(batchAction)
      
      // Refresh all data after batch processing
      console.log('useApprovals: Refreshing all data after batch processing...')
      await fetchData()
      
      toast({
        title: `Batch ${action} successful`,
        description: `${approvalIds.length} harvests have been ${action}d`,
      })
    } catch (err: any) {
      const errorMessage = err.message || `Failed to process batch ${action}`
      toast({
        title: `Error in batch ${action}`,
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const exportData = useCallback(async (format: 'csv' | 'excel') => {
    try {
      setIsLoading(true)
      
      const blob = await approvalsService.exportApprovals(filters, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `approvals-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export successful",
        description: `Approvals data exported as ${format.toUpperCase()}`,
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export data'
      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  const clearCache = useCallback(() => {
    console.log('Clearing approvals cache manually')
    approvalsService.clearCache()
    // Refresh data after clearing cache
    fetchData()
    toast({
      title: "Cache cleared",
      description: "Approvals cache has been cleared",
    })
  }, [toast, fetchData])

  return {
    approvals,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData,
    approveHarvest,
    rejectHarvest,
    markForReview,
    batchProcess,
    exportData,
    clearCache,
  }
}

// Specialized hooks for different approval sections
export function usePendingApprovals(filters: ApprovalFilters = {}) {
  const [approvals, setApprovals] = useState<HarvestApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const approvalsData = await approvalsService.getApprovals({ ...filters, status: 'pending' })
      setApprovals(approvalsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch pending approvals'
      setError(errorMessage)
      toast({
        title: "Error loading pending approvals",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { approvals, isLoading, error, refreshData: fetchData }
}

export function useApprovalStats() {
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const statsData = await approvalsService.getApprovalStats()
      setStats(statsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch approval stats'
      setError(errorMessage)
      toast({
        title: "Error loading approval stats",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { stats, isLoading, error, refreshData: fetchData }
}
