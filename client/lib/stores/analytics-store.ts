import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { analyticsService, AnalyticsFilters, AnalyticsData } from '@/lib/analytics-service'

interface AnalyticsState {
  // Data
  data: AnalyticsData | null
  performanceData: AnalyticsData['performance'] | null
  geographicData: AnalyticsData['geographic'] | null
  financialData: AnalyticsData['financials'] | null
  trendData: AnalyticsData['trends'] | null
  
  // UI State
  isLoading: boolean
  error: string | null
  activeTab: string
  filters: AnalyticsFilters
  
  // Cache
  cache: Map<string, { data: any; timestamp: number }>
  lastUpdated: Date | null
  
  // Actions
  setActiveTab: (tab: string) => void
  setFilters: (filters: AnalyticsFilters) => void
  updateFilter: (key: keyof AnalyticsFilters, value: any) => void
  
  // Data Fetching
  fetchDashboardData: (filters?: AnalyticsFilters) => Promise<void>
  fetchPerformanceData: (filters?: AnalyticsFilters) => Promise<void>
  fetchGeographicData: (filters?: AnalyticsFilters) => Promise<void>
  fetchFinancialData: (filters?: AnalyticsFilters) => Promise<void>
  fetchTrendData: (filters?: AnalyticsFilters) => Promise<void>
  
  // Cache Management
  clearCache: () => void
  getCacheStats: () => { size: number; keys: string[] }
  
  // Export & Reports
  exportData: (format: 'csv' | 'excel') => Promise<void>
  generateReport: (config: any) => Promise<{ downloadUrl: string; filename: string }>
  
  // Real-time Updates
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  timeRange: '6months',
  location: undefined,
  farmerStatus: 'all',
  commissionStatus: 'all'
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        data: null,
        performanceData: null,
        geographicData: null,
        financialData: null,
        trendData: null,
        isLoading: false,
        error: null,
        activeTab: 'overview',
        filters: DEFAULT_FILTERS,
        cache: new Map(),
        lastUpdated: null,
        
        // UI Actions
        setActiveTab: (tab: string) => set({ activeTab: tab }),
        
        setFilters: (filters: AnalyticsFilters) => {
          set({ filters: { ...get().filters, ...filters } })
          // Auto-refresh data when filters change
          get().fetchDashboardData()
        },
        
        updateFilter: (key: keyof AnalyticsFilters, value: any) => {
          const currentFilters = get().filters
          const newFilters = { ...currentFilters, [key]: value }
          set({ filters: newFilters })
          get().fetchDashboardData()
        },
        
        // Data Fetching Actions
        fetchDashboardData: async (filters?: AnalyticsFilters) => {
          const currentFilters = filters || get().filters
          
          set({ isLoading: true, error: null })
          
          try {
            const data = await analyticsService.getDashboardAnalytics(currentFilters)
            set({ 
              data, 
              isLoading: false, 
              lastUpdated: new Date(),
              error: null 
            })
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to fetch dashboard data', 
              isLoading: false 
            })
          }
        },
        
        fetchPerformanceData: async (filters?: AnalyticsFilters) => {
          const currentFilters = filters || get().filters
          
          set({ isLoading: true, error: null })
          
          try {
            const data = await analyticsService.getPerformanceAnalytics(currentFilters)
            set({ 
              performanceData: data, 
              isLoading: false, 
              error: null 
            })
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to fetch performance data', 
              isLoading: false 
            })
          }
        },
        
        fetchGeographicData: async (filters?: AnalyticsFilters) => {
          const currentFilters = filters || get().filters
          
          set({ isLoading: true, error: null })
          
          try {
            const data = await analyticsService.getGeographicAnalytics(currentFilters)
            set({ 
              geographicData: data, 
              isLoading: false, 
              error: null 
            })
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to fetch geographic data', 
              isLoading: false 
            })
          }
        },
        
        fetchFinancialData: async (filters?: AnalyticsFilters) => {
          const currentFilters = filters || get().filters
          
          set({ isLoading: true, error: null })
          
          try {
            const data = await analyticsService.getFinancialAnalytics(currentFilters)
            set({ 
              financialData: data, 
              isLoading: false, 
              error: null 
            })
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to fetch financial data', 
              isLoading: false 
            })
          }
        },
        
        fetchTrendData: async (filters?: AnalyticsFilters) => {
          const currentFilters = filters || get().filters
          
          set({ isLoading: true, error: null })
          
          try {
            const data = await analyticsService.getTrendAnalytics(currentFilters)
            set({ 
              trendData: data, 
              isLoading: false, 
              error: null 
            })
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to fetch trend data', 
              isLoading: false 
            })
          }
        },
        
        // Cache Management
        clearCache: () => {
          analyticsService.clearCache()
          set({ cache: new Map() })
        },
        
        getCacheStats: () => {
          return analyticsService.getCacheStats()
        },
        
        // Export & Reports
        exportData: async (format: 'csv' | 'excel') => {
          const currentFilters = get().filters
          
          try {
            await analyticsService.exportData(currentFilters, format)
          } catch (error: any) {
            set({ error: error.message || 'Export failed' })
            throw error
          }
        },
        
        generateReport: async (config: any) => {
          const currentFilters = get().filters
          
          try {
            const report = await analyticsService.generateReport({
              ...config,
              filters: currentFilters,
              includeCharts: true,
              includeInsights: true
            })
            
            return report
          } catch (error: any) {
            set({ error: error.message || 'Report generation failed' })
            throw error
          }
        },
        
        // Real-time Updates
        subscribeToUpdates: () => {
          // Implementation for WebSocket or Server-Sent Events
          // This would connect to real-time analytics updates
          console.log('Subscribed to analytics updates')
        },
        
        unsubscribeFromUpdates: () => {
          // Cleanup real-time connections
          console.log('Unsubscribed from analytics updates')
        }
      }),
      {
        name: 'analytics-store',
        partialize: (state) => ({
          filters: state.filters,
          activeTab: state.activeTab,
          lastUpdated: state.lastUpdated
        })
      }
    )
  )
)

// Selector hooks for better performance
export const useAnalyticsData = () => useAnalyticsStore((state) => state.data)
export const useAnalyticsLoading = () => useAnalyticsStore((state) => state.isLoading)
export const useAnalyticsError = () => useAnalyticsStore((state) => state.error)
export const useAnalyticsFilters = () => useAnalyticsStore((state) => state.filters)
export const useAnalyticsActiveTab = () => useAnalyticsStore((state) => state.activeTab)

export const useAnalyticsActions = () => useAnalyticsStore((state) => ({
  setActiveTab: state.setActiveTab,
  setFilters: state.setFilters,
  updateFilter: state.updateFilter,
  fetchDashboardData: state.fetchDashboardData,
  fetchPerformanceData: state.fetchPerformanceData,
  fetchGeographicData: state.fetchGeographicData,
  fetchFinancialData: state.fetchFinancialData,
  fetchTrendData: state.fetchTrendData,
  clearCache: state.clearCache,
  exportData: state.exportData,
  generateReport: state.generateReport
}))

// Computed selectors
export const useAnalyticsStats = () => {
  const data = useAnalyticsData()
  
  if (!data) return null
  
  return {
    totalFarmers: data.overview.totalFarmers,
    activeFarmers: data.overview.activeFarmers,
    totalCommissions: data.overview.totalCommissions,
    monthlyGrowth: data.overview.monthlyGrowth,
    successRate: data.overview.successRate,
    averageCommission: data.overview.averageCommission
  }
}

export const useAnalyticsPerformance = () => {
  const data = useAnalyticsData()
  
  if (!data) return null
  
  return {
    monthlyMetrics: data.performance.monthlyMetrics,
    topPerformers: data.performance.topPerformers,
    performanceMetrics: data.performance.performanceMetrics
  }
}

export const useAnalyticsGeographic = () => {
  const data = useAnalyticsData()
  
  if (!data) return null
  
  return {
    locations: data.geographic.locations,
    distribution: data.geographic.distribution
  }
}

export const useAnalyticsTrends = () => {
  const data = useAnalyticsData()
  
  if (!data) return null
  
  return {
    farmerGrowth: data.trends.farmerGrowth,
    commissionTrends: data.trends.commissionTrends,
    qualityMetrics: data.trends.qualityMetrics,
    timeLabels: data.trends.timeLabels
  }
}

export const useAnalyticsInsights = () => {
  const data = useAnalyticsData()
  
  if (!data) return null
  
  return data.insights
}
