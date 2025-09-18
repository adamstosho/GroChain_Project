import { useState, useEffect, useCallback } from 'react'
import { analyticsService, AnalyticsFilters, AnalyticsData } from '@/lib/analytics-service'
import { useToast } from './use-toast'

interface UseAnalyticsReturn {
  data: AnalyticsData | null
  isLoading: boolean
  error: string | null
  filters: AnalyticsFilters
  setFilters: (filters: AnalyticsFilters) => void
  refreshData: () => Promise<void>
  exportData: (format: 'csv' | 'excel') => Promise<void>
  generateReport: (config: any) => Promise<void>
  clearCache: () => void
}

export function useAnalytics(initialFilters: AnalyticsFilters = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<AnalyticsFilters>(initialFilters)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const analyticsData = await analyticsService.getDashboardAnalytics(filters)
      setData(analyticsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch analytics data'
      setError(errorMessage)
      toast({
        title: "Error loading analytics",
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

  const setFilters = useCallback((newFilters: AnalyticsFilters) => {
    setFiltersState(newFilters)
  }, [])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const exportData = useCallback(async (format: 'csv' | 'excel') => {
    try {
      setIsLoading(true)
      
      const blob = await analyticsService.exportData(filters, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
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

  const generateReport = useCallback(async (config: any) => {
    try {
      setIsLoading(true)
      
      const report = await analyticsService.generateReport({
        ...config,
        filters,
        includeCharts: true,
        includeInsights: true
      })
      
      // Handle report download
      if (report.downloadUrl) {
        window.open(report.downloadUrl, '_blank')
      }
      
      toast({
        title: "Report generated",
        description: "Your analytics report is ready for download",
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate report'
      toast({
        title: "Report generation failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  const clearCache = useCallback(() => {
    analyticsService.clearCache()
    toast({
      title: "Cache cleared",
      description: "Analytics cache has been cleared",
    })
  }, [toast])

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData,
    exportData,
    generateReport,
    clearCache,
  }
}

// Specialized hooks for different analytics sections
export function usePerformanceAnalytics(filters: AnalyticsFilters = {}) {
  const [data, setData] = useState<AnalyticsData['performance'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const performanceData = await analyticsService.getPerformanceAnalytics(filters)
      setData(performanceData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch performance analytics'
      setError(errorMessage)
      toast({
        title: "Error loading performance data",
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

  return { data, isLoading, error, refreshData: fetchData }
}

export function useGeographicAnalytics(filters: AnalyticsFilters = {}) {
  const [data, setData] = useState<AnalyticsData['geographic'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const geographicData = await analyticsService.getGeographicAnalytics(filters)
      setData(geographicData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch geographic analytics'
      setError(errorMessage)
      toast({
        title: "Error loading geographic data",
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

  return { data, isLoading, error, refreshData: fetchData }
}

export function useFinancialAnalytics(filters: AnalyticsFilters = {}) {
  const [data, setData] = useState<AnalyticsData['financials'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const financialData = await analyticsService.getFinancialAnalytics(filters)
      setData(financialData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch financial analytics'
      setError(errorMessage)
      toast({
        title: "Error loading financial data",
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

  return { data, isLoading, error, refreshData: fetchData }
}

export function useTrendAnalytics(filters: AnalyticsFilters = {}) {
  const [data, setData] = useState<AnalyticsData['trends'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const trendData = await analyticsService.getTrendAnalytics(filters)
      setData(trendData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch trend analytics'
      setError(errorMessage)
      toast({
        title: "Error loading trend data",
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

  return { data, isLoading, error, refreshData: fetchData }
}
