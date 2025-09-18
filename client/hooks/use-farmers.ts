import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'
import { api } from '@/lib/api'

interface Farmer {
  _id: string
  name: string
  email: string
  phone: string
  location: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  joinedDate: string
  totalHarvests?: number
  totalSales?: number
}

interface FarmerFilters {
  searchTerm?: string
  status?: string
  location?: string
  page?: number
  limit?: number
}

// Real data from backend API only - no mock data

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FarmerFilters>({
    searchTerm: "",
    status: "all",
    location: "all",
    page: 1,
    limit: 50
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  })
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    inactiveFarmers: 0,
    suspendedFarmers: 0
  })
  const { toast } = useToast()

  // Fetch farmers from real API
  const fetchFarmers = useCallback(async () => {
    try {
      setIsLoading(true)

      console.log('🔍 useFarmers: Fetching farmers with filters:', filters)

      const response = await api.getPartnerFarmers({
        limit: filters.limit || 50,
        page: filters.page || 1,
        search: filters.searchTerm,
        status: filters.status
      })

      console.log('📊 useFarmers: API response:', response)

      if (response && response.data) {
        const farmersData = response.data.farmers || []
        console.log('👥 useFarmers: Farmers data received:', farmersData.length, 'farmers')

        setFarmers(farmersData)
        setFilteredFarmers(farmersData) // Backend already filters
        setPagination({
          currentPage: response.data.page || 1,
          totalPages: response.data.pages || 1,
          totalItems: response.data.total || 0,
          itemsPerPage: filters.limit || 50
        })

        // Calculate stats from current page data
        const activeFarmers = farmersData.filter(f => f.status === 'active').length
        const inactiveFarmers = farmersData.filter(f => f.status === 'inactive').length
        const pendingFarmers = farmersData.filter(f => f.status === 'pending').length

        const statsData = {
          totalFarmers: response.data.total || 0,
          activeFarmers,
          inactiveFarmers,
          suspendedFarmers: pendingFarmers // Map pending to suspended for compatibility
        }
        console.log('📈 useFarmers: Using calculated stats:', statsData)

        setStats(statsData)
      } else {
        console.log('⚠️ useFarmers: No data in response')
        setFarmers([])
        setFilteredFarmers([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: filters.limit || 50
        })
        setStats({
          totalFarmers: 0,
          activeFarmers: 0,
          inactiveFarmers: 0,
          suspendedFarmers: 0
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch farmers:', error)
      setFarmers([])
      setFilteredFarmers([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: filters.limit || 50
      })
      setStats({
        totalFarmers: 0,
        activeFarmers: 0,
        inactiveFarmers: 0,
        suspendedFarmers: 0
      })

      toast({
        title: "Error loading farmers",
        description: error?.message || "Failed to load farmers data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  // Filter farmers
  const filterFarmers = useCallback(() => {
    let filtered = [...farmers]

    if (filters.searchTerm) {
      filtered = filtered.filter(farmer =>
        farmer.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        farmer.email.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        farmer.phone.includes(filters.searchTerm!)
      )
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(farmer => farmer.status === filters.status)
    }

    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(farmer => farmer.location === filters.location)
    }

    setFilteredFarmers(filtered)
  }, [farmers, filters])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FarmerFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }, [])

  // Add new farmer
  const addFarmer = useCallback(async (farmerData: Omit<Farmer, '_id' | 'joinedDate'>) => {
    try {
      const newFarmer: Farmer = {
        ...farmerData,
        _id: Math.random().toString(36).substr(2, 9),
        joinedDate: new Date().toISOString()
      }
      
      setFarmers(prev => [newFarmer, ...prev])
      toast({
        title: "Farmer added",
        description: "New farmer has been added successfully",
      })
      
      return newFarmer
    } catch (error: any) {
      toast({
        title: "Error adding farmer",
        description: error.message || "Failed to add farmer",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Update farmer
  const updateFarmer = useCallback(async (id: string, updates: Partial<Farmer>) => {
    try {
      setFarmers(prev => 
        prev.map(farmer => 
          farmer._id === id ? { ...farmer, ...updates } : farmer
        )
      )
      
      toast({
        title: "Farmer updated",
        description: "Farmer information has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error updating farmer",
        description: error.message || "Failed to update farmer",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Delete farmer
  const deleteFarmer = useCallback(async (id: string) => {
    try {
      setFarmers(prev => prev.filter(farmer => farmer._id !== id))
      
      toast({
        title: "Farmer removed",
        description: "Farmer has been removed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error removing farmer",
        description: error.message || "Failed to remove farmer",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchFarmers()
    toast({
      title: "Data refreshed",
      description: "Farmer data has been updated",
    })
  }, [fetchFarmers, toast])

  // Load initial data
  useEffect(() => {
    fetchFarmers()
  }, [fetchFarmers])

  // Apply filters when they change
  useEffect(() => {
    filterFarmers()
  }, [filterFarmers])

  return {
    // State
    farmers,
    filteredFarmers,
    isLoading,
    filters,
    pagination,
    stats,

    // Actions
    fetchFarmers,
    updateFilters,
    addFarmer,
    updateFarmer,
    deleteFarmer,
    refreshData,

    // Computed values from backend stats
    activeFarmers: stats.activeFarmers,
    inactiveFarmers: stats.inactiveFarmers,
    suspendedFarmers: stats.suspendedFarmers,
    totalFarmers: stats.totalFarmers,
    totalActiveFarmers: stats.activeFarmers
  }
}
