import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { 
  Shipment, 
  CreateShipmentRequest, 
  UpdateShipmentStatusRequest, 
  ConfirmDeliveryRequest, 
  ReportIssueRequest, 
  ShipmentStats, 
  ShipmentFilters 
} from '@/types/shipment'

export function useShipments(filters?: ShipmentFilters) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20
  })
  const { toast } = useToast()

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
      }

      const response = await apiService.get(`/shipments?${queryParams.toString()}`)
      
      if (response.status === 'success' && response.data) {
        const data = response.data as { shipments: Shipment[]; pagination: typeof pagination }
        setShipments(data.shipments)
        setPagination(data.pagination)
      } else {
        throw new Error(response.message || 'Failed to fetch shipments')
      }
    } catch (err: any) {
      console.error('Error fetching shipments:', err)
      setError(err.message || 'Failed to fetch shipments')
      toast({
        title: "Error",
        description: err.message || "Failed to fetch shipments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  const refreshShipments = useCallback(() => {
    fetchShipments()
  }, [fetchShipments])

  return {
    shipments,
    loading,
    error,
    pagination,
    refreshShipments
  }
}

export function useShipment(shipmentId: string) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchShipment = useCallback(async () => {
    if (!shipmentId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.get(`/shipments/${shipmentId}`)
      
      if (response.status === 'success') {
        setShipment(response.data as unknown as Shipment)
      } else {
        throw new Error(response.message || 'Failed to fetch shipment')
      }
    } catch (err: any) {
      console.error('Error fetching shipment:', err)
      setError(err.message || 'Failed to fetch shipment')
      toast({
        title: "Error",
        description: err.message || "Failed to fetch shipment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [shipmentId, toast])

  useEffect(() => {
    fetchShipment()
  }, [fetchShipment])

  return {
    shipment,
    loading,
    error,
    refreshShipment: fetchShipment
  }
}

export function useCreateShipment() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createShipment = useCallback(async (data: CreateShipmentRequest) => {
    try {
      setLoading(true)
      
      console.log("🚚 Sending shipment data to API:", data)
      console.log("🌐 API Base URL:", apiService.getBaseUrl())
      
      const response = await apiService.post('/shipments', data)
      console.log("🚚 Shipment API response:", response)
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Shipment created successfully",
        })
        return response.data as unknown as Shipment
      } else {
        throw new Error(response.message || 'Failed to create shipment')
      }
    } catch (err: any) {
      console.error('Error creating shipment:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        payload: err.payload,
        endpoint: err.endpoint
      })
      toast({
        title: "Error",
        description: err.message || "Failed to create shipment",
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    createShipment,
    loading
  }
}

export function useUpdateShipmentStatus() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const updateStatus = useCallback(async (shipmentId: string, data: UpdateShipmentStatusRequest) => {
    try {
      setLoading(true)
      
      const response = await apiService.put(`/shipments/${shipmentId}/status`, data)
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Shipment status updated successfully",
        })
        return response.data as unknown as Shipment
      } else {
        throw new Error(response.message || 'Failed to update shipment status')
      }
    } catch (err: any) {
      console.error('Error updating shipment status:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to update shipment status",
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    updateStatus,
    loading
  }
}

export function useConfirmDelivery() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const confirmDelivery = useCallback(async (shipmentId: string, data: ConfirmDeliveryRequest) => {
    try {
      setLoading(true)
      
      const response = await apiService.put(`/shipments/${shipmentId}/delivery`, data)
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Delivery confirmed successfully",
        })
        return response.data as unknown as Shipment
      } else {
        throw new Error(response.message || 'Failed to confirm delivery')
      }
    } catch (err: any) {
      console.error('Error confirming delivery:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to confirm delivery",
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    confirmDelivery,
    loading
  }
}

export function useReportIssue() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const reportIssue = useCallback(async (shipmentId: string, data: ReportIssueRequest) => {
    try {
      setLoading(true)
      
      const response = await apiService.post(`/shipments/${shipmentId}/issues`, data)
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Issue reported successfully",
        })
        return response.data as unknown as Shipment
      } else {
        throw new Error(response.message || 'Failed to report issue')
      }
    } catch (err: any) {
      console.error('Error reporting issue:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to report issue",
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    reportIssue,
    loading
  }
}

export function useShipmentStats() {
  const [stats, setStats] = useState<ShipmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchStats = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await apiService.get(`/shipments/stats/overview?${queryParams.toString()}`)
      
      if (response.status === 'success') {
        setStats(response.data as unknown as ShipmentStats)
      } else {
        throw new Error(response.message || 'Failed to fetch shipment stats')
      }
    } catch (err: any) {
      console.error('Error fetching shipment stats:', err)
      setError(err.message || 'Failed to fetch shipment stats')
      toast({
        title: "Error",
        description: err.message || "Failed to fetch shipment stats",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}

export function useSearchShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20
  })
  const { toast } = useToast()

  const searchShipments = useCallback(async (query: string, page: number = 1, limit: number = 20) => {
    if (!query.trim()) {
      setShipments([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.get(`/shipments/search/query?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      
      if (response.status === 'success' && response.data) {
        const data = response.data as { shipments: Shipment[]; pagination: typeof pagination }
        setShipments(data.shipments)
        setPagination(data.pagination)
      } else {
        throw new Error(response.message || 'Failed to search shipments')
      }
    } catch (err: any) {
      console.error('Error searching shipments:', err)
      setError(err.message || 'Failed to search shipments')
      toast({
        title: "Error",
        description: err.message || "Failed to search shipments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    shipments,
    loading,
    error,
    pagination,
    searchShipments
  }
}

export function useExportShipments() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const exportShipments = useCallback(async (format: 'csv' | 'excel' | 'json' = 'csv', filters: ShipmentFilters = {}) => {
    try {
      setLoading(true)
      
      const response: any = await apiService.post('/export-import/export/shipments', { format, filters })
      const ok = response?.success === true || response?.status === 'success'
      const filename = response?.data?.filename

      if (ok && filename) {
        toast({
          title: "Preparing Download",
          description: "Your file is ready. Starting download...",
        })

        const downloadResponse = await apiService.getRaw(`/export-import/download/${filename}`)
        const blob = await downloadResponse.blob()

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return response.data as unknown as Shipment
      } else {
        throw new Error(response?.message || 'Failed to export shipments')
      }
    } catch (err: any) {
      console.error('Error exporting shipments:', err)
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export shipments",
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    exportShipments,
    loading
  }
}
