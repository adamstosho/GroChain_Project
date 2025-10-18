"use client"

import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'
import { useToast } from './use-toast'
import { useAuthStore } from '@/lib/auth'

export interface PriceAlert {
  _id: string
  user: string
  listing: {
    _id: string
    cropName: string
    basePrice: number
    images: string[]
    category: string
  }
  productName: string
  currentPrice: number
  targetPrice: number
  alertType: 'price_drop' | 'price_increase' | 'both'
  isActive: boolean
  lastChecked: string
  triggeredAt?: string
  triggerCount: number
  notificationSent: boolean
  notificationChannels: Array<{
    type: 'email' | 'sms' | 'push' | 'in_app'
    enabled: boolean
  }>
  metadata: {
    originalPrice: number
    priceHistory: Array<{
      price: number
      timestamp: string
    }>
    lastNotificationSent?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreatePriceAlertData {
  listingId: string
  targetPrice: number
  alertType?: 'price_drop' | 'price_increase' | 'both'
  notificationChannels?: Array<'email' | 'sms' | 'push' | 'in_app'>
}

export interface UpdatePriceAlertData {
  targetPrice?: number
  alertType?: 'price_drop' | 'price_increase' | 'both'
  isActive?: boolean
  notificationChannels?: Array<'email' | 'sms' | 'push' | 'in_app'>
}

export interface PriceAlertStats {
  totalAlerts: number
  activeAlerts: number
  triggeredAlerts: number
  totalTriggers: number
  avgTargetPrice: number
  avgCurrentPrice: number
}

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [stats, setStats] = useState<PriceAlertStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAuthenticated, hasHydrated } = useAuthStore()

  // Fetch user's price alerts
  const fetchAlerts = useCallback(async (page = 1, limit = 10, isActive?: boolean) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (isActive !== undefined) {
        params.append('isActive', isActive.toString())
      }

      console.log('🔍 Fetching price alerts with params:', params.toString())
      const response = await apiService.get(`/price-alerts?${params}`)
      console.log('📋 Price alerts response:', response)
      
      if (response && response.status === 'success') {
        const alertsData = response.data?.alerts || []
        setAlerts(alertsData)
        console.log('✅ Price alerts set:', alertsData.length, 'alerts')
        return response.data
      } else {
        console.error('❌ Price alerts API error:', response?.message || 'Unknown error')
        throw new Error(response?.message || 'Failed to fetch alerts')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch price alerts'
      setError(errorMessage)
      console.error('❌ Error fetching price alerts:', error)
      
      // Network/timeout errors will still be caught here
      setAlerts([])
      return { alerts: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit } }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch price alert statistics
  const fetchStats = useCallback(async () => {
    try {
      console.log('🔍 Fetching price alert stats...')
      const response = await apiService.get('/price-alerts/stats')
      console.log('📊 Price alert stats response:', response)
      
      if (response && response.status === 'success') {
        const statsData = response.data || {
          totalAlerts: 0,
          activeAlerts: 0,
          triggeredAlerts: 0,
          totalTriggers: 0,
          avgTargetPrice: 0,
          avgCurrentPrice: 0
        }
        setStats(statsData)
        console.log('✅ Price alert stats set:', statsData)
        return statsData
      } else {
        console.error('❌ Price alert stats API error:', response?.message || 'Unknown error')
        throw new Error(response?.message || 'Failed to fetch stats')
      }
    } catch (error: any) {
      console.error('❌ Error fetching price alert stats:', error)
      
      // Network/timeout errors will still be caught here
      const emptyStats = {
        totalAlerts: 0,
        activeAlerts: 0,
        triggeredAlerts: 0,
        totalTriggers: 0,
        avgTargetPrice: 0,
        avgCurrentPrice: 0
      }
      setStats(emptyStats)
      return emptyStats
    }
  }, [])

  // Create a new price alert
  const createAlert = useCallback(async (data: CreatePriceAlertData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.post('/price-alerts', data)
      
      if (response.status === 'success') {
        const newAlert = response.data
        setAlerts(prev => [newAlert, ...prev])
        
        toast({
          title: "Price alert created!",
          description: `You'll be notified when ${newAlert.productName} reaches ₦${newAlert.targetPrice.toLocaleString()}`,
        })
        
        return newAlert
      } else {
        throw new Error(response.message || 'Failed to create alert')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create price alert'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Update a price alert
  const updateAlert = useCallback(async (alertId: string, data: UpdatePriceAlertData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.put(`/price-alerts/${alertId}`, data)
      
      if (response.status === 'success') {
        const updatedAlert = response.data
        setAlerts(prev => prev.map(alert => 
          alert._id === alertId ? updatedAlert : alert
        ))
        
        toast({
          title: "Price alert updated",
          description: "Your price alert has been updated successfully",
        })
        
        return updatedAlert
      } else {
        throw new Error(response.message || 'Failed to update alert')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update price alert'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Delete a price alert
  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.delete(`/price-alerts/${alertId}`)
      
      if (response.status === 'success') {
        setAlerts(prev => prev.filter(alert => alert._id !== alertId))
        
        toast({
          title: "Price alert deleted",
          description: "Your price alert has been removed",
        })
        
        return true
      } else {
        throw new Error(response.message || 'Failed to delete alert')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete price alert'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Toggle alert active status
  const toggleAlert = useCallback(async (alertId: string) => {
    try {
      const alert = alerts.find(a => a._id === alertId)
      if (!alert) {
        throw new Error('Alert not found')
      }

      await updateAlert(alertId, { isActive: !alert.isActive })
    } catch (error) {
      console.error('Error toggling alert:', error)
      throw error
    }
  }, [alerts, updateAlert])

  // Check if user has an alert for a specific product
  const hasAlertForProduct = useCallback((productId: string) => {
    return alerts.some(alert => 
      alert.listing._id === productId && alert.isActive
    )
  }, [alerts])

  // Get alert for a specific product
  const getAlertForProduct = useCallback((productId: string) => {
    return alerts.find(alert => 
      alert.listing._id === productId && alert.isActive
    )
  }, [alerts])

  // Format price for display
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }, [])

  // Get alert type display text
  const getAlertTypeText = useCallback((alertType: string) => {
    switch (alertType) {
      case 'price_drop':
        return 'Price Drop'
      case 'price_increase':
        return 'Price Increase'
      case 'both':
        return 'Price Change'
      default:
        return 'Price Alert'
    }
  }, [])

  // Get alert status text
  const getAlertStatusText = useCallback((alert: PriceAlert) => {
    if (!alert.isActive) return 'Inactive'
    if (alert.triggeredAt) return 'Triggered'
    return 'Active'
  }, [])

  // Get alert status color
  const getAlertStatusColor = useCallback((alert: PriceAlert) => {
    if (!alert.isActive) return 'text-gray-500'
    if (alert.triggeredAt) return 'text-green-600'
    return 'text-blue-600'
  }, [])

  // Load initial data only if user is authenticated
  useEffect(() => {
    console.log('Price alerts useEffect:', { hasHydrated, isAuthenticated })
    if (hasHydrated && isAuthenticated) {
      console.log('User is authenticated, fetching price alerts...')
      fetchAlerts().catch(err => console.log('fetchAlerts error:', err))
      fetchStats().catch(err => console.log('fetchStats error:', err))
    } else {
      console.log('User not authenticated or not hydrated, skipping API calls')
    }
  }, [fetchAlerts, fetchStats, hasHydrated, isAuthenticated])

  return {
    // State
    alerts,
    stats,
    loading,
    error,
    
    // Actions
    fetchAlerts,
    fetchStats,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    
    // Utilities
    hasAlertForProduct,
    getAlertForProduct,
    formatPrice,
    getAlertTypeText,
    getAlertStatusText,
    getAlertStatusColor,
    
    // Computed
    activeAlerts: alerts.filter(alert => alert.isActive),
    triggeredAlerts: alerts.filter(alert => alert.triggeredAt),
    inactiveAlerts: alerts.filter(alert => !alert.isActive)
  }
}

