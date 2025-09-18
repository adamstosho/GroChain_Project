"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonStats, SkeletonFilters } from "@/components/ui/enhanced-skeleton"
import { Separator } from "@/components/ui/separator"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { ReceiptGenerator } from "@/lib/receipt-generator"
import { ShipmentTrackingWidget } from "@/components/shipment/shipment-tracking-widget"
import {
  Package,
  Search,
  Filter,
  MapPin,
  Star,
  Eye,
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Banknote,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Loader2,
  Receipt,
  User,
  Building,
  FileSpreadsheet
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface OrderItem {
  _id: string
  listing: {
    _id: string
    cropName: string
    images: string[]
    category: string
    unit: string
    farmer: {
      _id: string
      name: string
      email: string
      profile: {
        phone: string
        farmName: string
      }
    }
  }
  quantity: number
  price: number
  unit: string
  total: number
}

interface Order {
  _id: string
  orderNumber: string
  buyer: {
    _id: string
    name: string
    email: string
    profile: {
      phone: string
      avatar: string
    }
  }
  seller: string
  items: OrderItem[]
  total: number
  subtotal: number
  shipping: number
  discount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    phone: string
  }
  deliveryInstructions: string
  estimatedDelivery: string
  actualDelivery?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
  totalSpent: number
}

interface OrdersResponse {
  orders: Order[]
  stats: OrderStats
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

interface OrderFilters {
  status: "all" | OrderStatus
  paymentStatus: "all" | PaymentStatus
  dateRange: "all" | "today" | "week" | "month" | "quarter" | "year"
  searchQuery: string
}

// Helper function to calculate stats from orders data
const calculateStatsFromOrders = (orders: Order[]): OrderStats => {
  const stats = {
    total: orders.length,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalSpent: 0
  }

  orders.forEach(order => {
    // Count by status
    if (order.status === 'pending') stats.pending++
    else if (order.status === 'confirmed') stats.confirmed++
    else if (order.status === 'shipped') stats.shipped++
    else if (order.status === 'delivered') stats.delivered++
    else if (order.status === 'cancelled') stats.cancelled++
    
    // Calculate total spent from paid orders only
    if (order.paymentStatus === 'paid') {
      stats.totalSpent += order.total
    }
  })

  return stats
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalSpent: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [filters, setFilters] = useState<OrderFilters>({
    status: "all",
    paymentStatus: "all",
    dateRange: "all",
    searchQuery: ""
  })
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrdersData()

    // Check if user came from payment verification
    const urlParams = new URLSearchParams(window.location.search)
    const fromPayment = urlParams.get('from_payment')
    const paymentRef = urlParams.get('payment_ref')

    if (fromPayment === 'true' && paymentRef) {
      console.log('🔄 User returned from payment verification, refreshing data...')
      // Force refresh after a short delay to ensure backend has processed everything
      setTimeout(() => {
        fetchOrdersData()
      }, 2000)
    }
  }, [])

  const fetchOrdersData = async (page = 1, status?: string, paymentStatus?: string) => {
    try {
      setLoading(true)
      console.log('📦 Fetching orders from backend...')

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (status && status !== 'all') queryParams.append('status', status)
      if (paymentStatus && paymentStatus !== 'all') queryParams.append('paymentStatus', paymentStatus)

      const response = await apiService.getUserOrders({
        page: page.toString(),
        limit: '20',
        ...(status && status !== 'all' && { status }),
        ...(paymentStatus && paymentStatus !== 'all' && { paymentStatus })
      })
      console.log('📋 Orders API Response:', response)

      if (response?.status === 'success' && response?.data) {
        // Handle the structured response from backend
        const ordersData = (response.data as any).orders || []
        let statsData = (response.data as any).stats || {
          total: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalSpent: 0
        }
        
        // If backend stats are not available or all zeros, calculate from orders data
        if (!(response.data as any).stats || (statsData.confirmed === 0 && statsData.totalSpent === 0 && ordersData.length > 0)) {
          console.log('📊 Calculating stats from orders data...')
          statsData = calculateStatsFromOrders(ordersData)
        }
        
        const paginationData = (response.data as any).pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }

        setOrders(ordersData)
        setStats(statsData)
        setPagination(paginationData)

        console.log('✅ Orders loaded successfully:', ordersData?.length || 0, 'orders')
        console.log('📊 Stats:', statsData)
      } else {
        console.warn('⚠️ Orders response not in expected format:', response)
        setOrders([])
        setStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalSpent: 0
        })
      }
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error)
      
      // Try to get orders from a different endpoint or use mock data
      try {
        console.log('🔄 Attempting to fetch orders from alternative endpoint...')
        const fallbackResponse = await apiService.getUserOrders({ page: '1', limit: '100' })
        if ((fallbackResponse?.data as any)?.orders) {
          const ordersData = (fallbackResponse.data as any).orders
          const statsData = calculateStatsFromOrders(ordersData)
          setOrders(ordersData)
          setStats(statsData)
          console.log('✅ Fallback orders loaded:', ordersData.length, 'orders')
          console.log('📊 Fallback stats:', statsData)
        } else {
          throw new Error('No orders data available')
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        toast({
          title: "Error Loading Orders",
          description: "Failed to load your orders. Please try again.",
          variant: "destructive",
        })
        setOrders([])
        setStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalSpent: 0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchOrdersData(1, filters.status, filters.paymentStatus)
      toast({
        title: "Refreshed",
        description: "Orders data has been updated",
      })
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleOrderUpdate = (orderId: string, newStatus: string) => {
    // Update the order in the local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus as OrderStatus }
          : order
      )
    )
    
    // Recalculate stats
    const updatedOrders = orders.map(order => 
      order._id === orderId 
        ? { ...order, status: newStatus as OrderStatus }
        : order
    )
    const newStats = calculateStatsFromOrders(updatedOrders)
    setStats(newStats)
  }

  const exportOrders = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    try {
      setExporting(true)
      
      // Use filtered orders for export
      const ordersToExport = filteredOrders
      
      if (ordersToExport.length === 0) {
        toast({
          title: "No orders to export",
          description: "There are no orders matching your current filters to export.",
          variant: "destructive"
        })
        return
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `grochain-orders-${timestamp}`

      switch (format) {
        case 'csv':
          exportToCSV(ordersToExport, filename)
          break
        case 'json':
          exportToJSON(ordersToExport, filename)
          break
        case 'pdf':
          await exportToPDF(ordersToExport, filename)
          break
      }

      toast({
        title: "Export successful",
        description: `${ordersToExport.length} orders exported as ${format.toUpperCase()} successfully`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: "Failed to export orders. Please try again.",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  const exportToCSV = (orders: Order[], filename: string) => {
    // Add summary information at the top
    const summary = [
      ['GroChain Orders Export'],
      [`Export Date: ${new Date().toLocaleDateString()}`],
      [`Total Orders: ${orders.length}`],
      [`Filter Applied: ${activeTab !== 'all' ? activeTab : 'All orders'}`],
      [''],
      ['Order Details:'],
      ['']
    ]

    const headers = [
      'Order Number',
      'Status',
      'Payment Status',
      'Total Amount (₦)',
      'Subtotal (₦)',
      'Shipping (₦)',
      'Discount (₦)',
      'Order Date',
      'Items Count',
      'Crop Types',
      'Seller Name',
      'Seller Email',
      'Delivery Address',
      'Delivery Instructions'
    ]

    const csvData = orders.map(order => [
      order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`,
      order.status,
      order.paymentStatus,
      order.total.toLocaleString(),
      order.subtotal.toLocaleString(),
      order.shipping.toLocaleString(),
      order.discount.toLocaleString(),
      new Date(order.createdAt).toLocaleDateString(),
      order.items.length,
      order.items.map(item => item.listing?.cropName).join('; '),
      order.items[0]?.listing?.farmer?.name || 'Unknown',
      order.items[0]?.listing?.farmer?.email || 'Unknown',
      `"${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}"`,
      `"${order.deliveryInstructions || 'None'}"`
    ])

    const csvContent = [
      ...summary.map(row => row.join(',')),
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  const exportToJSON = (orders: Order[], filename: string) => {
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportFormat: 'JSON',
        totalOrders: orders.length,
        appliedFilters: {
          status: filters.status,
          paymentStatus: filters.paymentStatus,
          dateRange: filters.dateRange,
          searchQuery: filters.searchQuery,
          activeTab: activeTab
        },
        stats: {
          total: stats.total,
          pending: stats.pending,
          confirmed: stats.confirmed,
          shipped: stats.shipped,
          delivered: stats.delivered,
          cancelled: stats.cancelled,
          totalSpent: stats.totalSpent
        }
      },
      orders: orders.map(order => ({
        orderId: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        orderDate: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          itemId: item._id,
          cropName: item.listing?.cropName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total,
          listingId: item.listing?._id
        })),
        seller: {
          id: order.items[0]?.listing?.farmer?._id,
          name: order.items[0]?.listing?.farmer?.name,
          email: order.items[0]?.listing?.farmer?.email,
          phone: order.items[0]?.listing?.farmer?.profile?.phone,
          farmName: order.items[0]?.listing?.farmer?.profile?.farmName
        },
        buyer: {
          id: order.buyer._id,
          name: order.buyer.name,
          email: order.buyer.email,
          phone: order.buyer.profile?.phone
        },
        shippingAddress: order.shippingAddress,
        deliveryInstructions: order.deliveryInstructions,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery,
        trackingNumber: order.trackingNumber
      }))
    }

    downloadFile(JSON.stringify(exportData, null, 2), `${filename}.json`, 'application/json')
  }

  const exportToPDF = async (orders: Order[], filename: string) => {
    // For PDF export, we'll create a simple HTML table and convert it
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GroChain Orders Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; margin-bottom: 20px; }
          .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .status-verified { color: #059669; }
          .status-pending { color: #d97706; }
          .status-cancelled { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>GroChain Orders Export</h1>
        <div class="summary">
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Orders:</strong> ${orders.length}</p>
          <p><strong>Filter Applied:</strong> ${activeTab !== 'all' ? activeTab : 'All orders'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Status</th>
              <th>Payment Status</th>
              <th>Total Amount</th>
              <th>Order Date</th>
              <th>Items</th>
              <th>Seller</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`}</td>
                <td class="status-${order.status}">${order.status}</td>
                <td>${order.paymentStatus}</td>
                <td>₦${order.total.toLocaleString()}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${order.items.length} items</td>
                <td>${order.items[0]?.listing?.farmer?.name || 'Unknown'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

    // Use useMemo for filtered orders to prevent infinite loops
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab)
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Payment status filter
    if (filters.paymentStatus !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus)
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (filters.dateRange) {
        case "today":
          filtered = filtered.filter(order =>
            new Date(order.createdAt).toDateString() === today.toDateString()
          )
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo)
          break
        case "month":
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo)
          break
        case "quarter":
          const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
          filtered = filtered.filter(order => new Date(order.createdAt) >= quarterAgo)
          break
        case "year":
          const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
          filtered = filtered.filter(order => new Date(order.createdAt) >= yearAgo)
          break
      }
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(query) ||
        order.items.some(item => item.listing?.cropName?.toLowerCase().includes(query)) ||
        order.items.some(item => item.listing?.farmer?.name?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [orders, filters, activeTab])



  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <RefreshCw className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'refunded': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }



  if (loading) {
    return (
      <DashboardLayout pageTitle="My Orders">
        <div className="space-y-6">
          {/* Loading Header */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Enhanced Loading Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Enhanced Loading Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Enhanced Loading Orders */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="My Orders">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground">
              Track your orders, view delivery status, and manage your purchases
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportOrders('csv')}
              disabled={exporting || filteredOrders.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export CSV ({filteredOrders.length})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting || filteredOrders.length === 0}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportOrders('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportOrders('json')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportOrders('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as HTML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild>
              <Link href="/dashboard/marketplace">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Shipped</p>
                  <p className="text-2xl font-bold">{stats.shipped}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>
              View and manage your orders by status and filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
                <TabsTrigger value="shipped">Shipped ({stats.shipped})</TabsTrigger>
                <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
                <TabsTrigger value="refunded">Refunded</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search orders, products, or sellers..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      value={filters.status} 
                      onValueChange={(value) => setFilters({ ...filters, status: value as OrderStatus })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={filters.paymentStatus} 
                      onValueChange={(value) => setFilters({ ...filters, paymentStatus: value as PaymentStatus })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters({ ...filters, dateRange: value as OrderFilters['dateRange'] })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      {stats.total === 0 ? (
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {stats.total === 0
                        ? "No orders yet"
                        : `No ${activeTab !== "all" ? activeTab : ""} orders found`
                      }
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {stats.total === 0
                        ? "You haven't placed any orders yet. Start shopping to see your orders here."
                        : activeTab === "all"
                          ? "No orders match your current filters. Try adjusting your search criteria."
                          : `You don't have any orders with "${activeTab}" status.`
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {stats.total === 0 ? (
                        <Button asChild size="lg">
                          <Link href="/dashboard/marketplace">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Start Shopping
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setFilters({
                                status: "all",
                                paymentStatus: "all",
                                dateRange: "all",
                                searchQuery: ""
                              })
                              setActiveTab("all")
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                          <Button asChild>
                            <Link href="/dashboard/marketplace">
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Browse More Products
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <OrderCard 
                        key={order._id} 
                        order={order}
                        getStatusColor={getStatusColor}
                        getPaymentStatusColor={getPaymentStatusColor}
                        getStatusIcon={getStatusIcon}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        onOrderUpdate={handleOrderUpdate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

interface OrderCardProps {
  order: Order
  getStatusColor: (status: OrderStatus) => string
  getPaymentStatusColor: (status: PaymentStatus) => string
  getStatusIcon: (status: OrderStatus) => React.ReactNode
  formatPrice: (price: number) => string
  formatDate: (date: Date) => string
  onOrderUpdate?: (orderId: string, newStatus: string) => void
}

function OrderCard({
  order,
  getStatusColor,
  getPaymentStatusColor,
  getStatusIcon,
  formatPrice,
  formatDate,
  onOrderUpdate
}: OrderCardProps) {
  const { toast } = useToast()
  const [cancelling, setCancelling] = useState(false)

  const handleCancelOrder = async () => {
    try {
      setCancelling(true)
      console.log('🚫 Cancelling order:', order._id)
      
      const response = await apiService.cancelOrder(order._id)
      
      if (response?.status === 'success') {
        toast({
          title: "Order Cancelled",
          description: "Your order has been cancelled successfully.",
        })
        
        // Update the order status in the parent component
        if (onOrderUpdate) {
          onOrderUpdate(order._id, 'cancelled')
        } else {
          // Fallback to page reload if no callback provided
          window.location.reload()
        }
      } else {
        throw new Error(response?.message || 'Failed to cancel order')
      }
    } catch (error: any) {
      console.error('❌ Failed to cancel order:', error)
      toast({
        title: "Failed to Cancel Order",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadReceipt = async () => {
    try {
      console.log('📄 Starting receipt generation for order:', order._id)
      
      toast({
        title: "Generating receipt...",
        description: "Please wait while we prepare your receipt.",
      })

      const response = await apiService.downloadOrderReceipt(order._id)
      
      console.log('📄 Receipt API response:', response)
      
      if (response?.status === 'success' && response?.data) {
        console.log('📄 Generating PDF with data:', response.data)
        await ReceiptGenerator.generatePDF(response.data as any)
        
        toast({
          title: "Receipt generated!",
          description: "Your receipt has been prepared for download.",
        })
      } else {
        console.error('❌ Receipt generation failed - invalid response:', response)
        throw new Error(response?.message || 'Failed to generate receipt')
      }
    } catch (error: any) {
      console.error('❌ Receipt generation failed:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        endpoint: error.endpoint,
        orderId: order._id
      })
      
      toast({
        title: "Failed to generate receipt",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    }
  }
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      <CardContent className="p-6">
        {/* Order Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2">
              {getStatusIcon(order.status)}
              <Badge className={`${getStatusColor(order.status)} font-medium`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`${getPaymentStatusColor(order.paymentStatus)} font-medium`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Order:</span>
            <span className="font-mono font-semibold text-primary">{order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{formatDate(new Date(order.createdAt))}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item._id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={item.listing?.images?.[0] || "/placeholder.svg"}
                  alt={item.listing?.cropName || 'Product'}
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{item.listing?.cropName || 'Unknown Product'}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit} × {formatPrice(item.price)}
                </p>
                {item.listing?.farmer?.name && (
                  <p className="text-xs text-muted-foreground">
                    Sold by: {item.listing.farmer.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{formatPrice((item.quantity || 0) * (item.price || 0))}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Seller Info */}
          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Seller Information
            </h5>
            <div className="space-y-2">
              {order.items[0]?.listing?.farmer ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{order.items[0].listing.farmer.name}</span>
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    <span>{order.items[0].listing.farmer.profile?.farmName || (order.items[0].listing.farmer as any).location || 'Farm'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{(order.items[0].listing.farmer as any).phone || order.items[0].listing.farmer.profile?.phone || 'Phone not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{order.items[0].listing.farmer.email}</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Seller information not available
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Information
            </h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Est. Delivery: {formatDate(new Date(order.estimatedDelivery))}
                  </span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex items-center space-x-2 text-sm">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Tracking: {order.trackingNumber}
                  </span>
                </div>
              )}
              {order.actualDelivery && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    Delivered: {formatDate(new Date(order.actualDelivery!))}
                  </span>
                </div>
              )}
              {order.deliveryInstructions && (
                <div className="text-sm text-muted-foreground">
                  <strong>Instructions:</strong> {order.deliveryInstructions}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Order Summary
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span>{formatPrice(order.shipping || 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Tracking */}
        {(order.status === 'shipped' || order.status === 'delivered') && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-sm text-blue-800 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipment Tracking
            </h5>
            <ShipmentTrackingWidget orderId={order._id} />
          </div>
        )}

        {/* Order Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/orders/${order._id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Full Details
            </Link>
          </Button>

          {order.trackingNumber && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/orders/${order._id}/tracking`}>
                <Truck className="h-4 w-4 mr-2" />
                Track Package
              </Link>
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          )}

          {order.status === 'pending' && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}

          {order.status === 'shipped' && !order.trackingNumber && (
            <Button variant="outline" size="sm">
              <Truck className="h-4 w-4 mr-2" />
              Request Tracking
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
            <FileText className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
