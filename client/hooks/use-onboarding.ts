import { useState, useEffect, useCallback } from 'react'
import { onboardingService } from '@/lib/onboarding-service'
import { 
  FarmerOnboarding, 
  OnboardingStats, 
  OnboardingFilters, 
  OnboardingTemplate,
  OnboardingWorkflow,
  BulkOnboardingResult
} from '@/lib/types/onboarding'

interface UseOnboardingReturn {
  // Data
  onboardings: FarmerOnboarding[]
  stats: OnboardingStats | null
  templates: OnboardingTemplate[]
  workflow: OnboardingWorkflow | null
  
  // State
  isLoading: boolean
  error: string | null
  filters: OnboardingFilters
  
  // Actions
  setFilters: (filters: OnboardingFilters) => void
  refreshData: () => Promise<void>
  createOnboarding: (data: Partial<FarmerOnboarding>) => Promise<FarmerOnboarding>
  updateOnboarding: (id: string, data: Partial<FarmerOnboarding>) => Promise<FarmerOnboarding>
  updateOnboardingStage: (id: string, stage: string, notes?: string) => Promise<FarmerOnboarding>
  processBulkOnboarding: (file: File) => Promise<BulkOnboardingResult>
  sendCommunication: (templateId: string, farmerId: string, variables: Record<string, string>) => Promise<boolean>
  exportData: (format: 'csv' | 'excel') => Promise<void>
  clearCache: () => void
  
  // Utility
  getOnboardingById: (id: string) => FarmerOnboarding | undefined
  getOnboardingProgress: (farmerId: string) => Promise<any>
}

export function useOnboarding(initialFilters: OnboardingFilters = {}): UseOnboardingReturn {
  const [onboardings, setOnboardings] = useState<FarmerOnboarding[]>([])
  const [stats, setStats] = useState<OnboardingStats | null>(null)
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])
  const [workflow, setWorkflow] = useState<OnboardingWorkflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<OnboardingFilters>(initialFilters)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [onboardingsData, statsData, templatesData, workflowData] = await Promise.all([
        onboardingService.getOnboardings(filters),
        onboardingService.getOnboardingStats(),
        onboardingService.getOnboardingTemplates(),
        onboardingService.getOnboardingWorkflow()
      ])
      
      setOnboardings(onboardingsData)
      setStats(statsData)
      setTemplates(templatesData)
      setWorkflow(workflowData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch onboarding data'
      setError(errorMessage)
      console.error('Error fetching onboarding data:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setFilters = useCallback((newFilters: OnboardingFilters) => {
    setFiltersState(newFilters)
  }, [])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const createOnboarding = useCallback(async (data: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> => {
    try {
      setIsLoading(true)
      const newOnboarding = await onboardingService.createOnboarding(data)
      
      // Update local state
      setOnboardings(prev => [newOnboarding, ...prev])
      
      // Refresh stats
      const newStats = await onboardingService.getOnboardingStats()
      setStats(newStats)
      
      return newOnboarding
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create onboarding'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateOnboarding = useCallback(async (id: string, data: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> => {
    try {
      setIsLoading(true)
      const updatedOnboarding = await onboardingService.updateOnboarding(id, data)
      
      // Update local state
      setOnboardings(prev => prev.map(o => o._id === id ? updatedOnboarding : o))
      
      return updatedOnboarding
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update onboarding'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateOnboardingStage = useCallback(async (id: string, stage: string, notes?: string): Promise<FarmerOnboarding> => {
    try {
      setIsLoading(true)
      const updatedOnboarding = await onboardingService.updateOnboardingStage(id, stage, notes)
      
      // Update local state
      setOnboardings(prev => prev.map(o => o._id === id ? updatedOnboarding : o))
      
      return updatedOnboarding
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update onboarding stage'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const processBulkOnboarding = useCallback(async (file: File): Promise<BulkOnboardingResult> => {
    try {
      setIsLoading(true)
      const result = await onboardingService.processBulkOnboarding(file)
      
      // Refresh data after bulk processing
      await fetchData()
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process bulk onboarding'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchData])

  const sendCommunication = useCallback(async (templateId: string, farmerId: string, variables: Record<string, string>): Promise<boolean> => {
    try {
      return await onboardingService.sendCommunication(templateId, farmerId, variables)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send communication'
      setError(errorMessage)
      throw err
    }
  }, [])

  const exportData = useCallback(async (format: 'csv' | 'excel') => {
    try {
      const blob = await onboardingService.exportOnboardingData(filters, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `onboarding-data-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export data'
      setError(errorMessage)
      throw err
    }
  }, [filters])

  const clearCache = useCallback(() => {
    onboardingService.clearCache()
    refreshData()
  }, [refreshData])

  const getOnboardingById = useCallback((id: string): FarmerOnboarding | undefined => {
    return onboardings.find(o => o._id === id)
  }, [onboardings])

  const getOnboardingProgress = useCallback(async (farmerId: string) => {
    try {
      return await onboardingService.getOnboardingProgress(farmerId)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get onboarding progress'
      setError(errorMessage)
      throw err
    }
  }, [])

  return {
    // Data
    onboardings,
    stats,
    templates,
    workflow,
    
    // State
    isLoading,
    error,
    filters,
    
    // Actions
    setFilters,
    refreshData,
    createOnboarding,
    updateOnboarding,
    updateOnboardingStage,
    processBulkOnboarding,
    sendCommunication,
    exportData,
    clearCache,
    
    // Utility
    getOnboardingById,
    getOnboardingProgress
  }
}

// Specialized hooks for different sections
export function useOnboardingStats() {
  const { stats, isLoading, error, refreshData } = useOnboarding()
  return { stats, isLoading, error, refreshData }
}

export function useOnboardingTemplates() {
  const { templates, isLoading, error, refreshData } = useOnboarding()
  return { templates, isLoading, error, refreshData }
}

export function useOnboardingWorkflow() {
  const { workflow, isLoading, error, refreshData } = useOnboarding()
  return { workflow, isLoading, error, refreshData }
}
