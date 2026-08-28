"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Text } from "@/components/ui/typography"
import { dashboard } from "@/lib/design-system"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ReceiptGenerator } from "@/lib/receipt-generator"
import { ShipmentTrackingWidget } from "@/components/shipment/shipment-tracking-widget"
import {
  Package,
  MapPin,
  Eye,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Banknote,
  ShoppingBag,
  ChevronDown,
  CheckCircle2,
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
  seller: string | {
    _id: string
    name: string
    email: string
    phone?: string
    location?: string
    profile?: {
      phone: string
      farmName: string
    }
  }
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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [filters, setFilters] = useState<OrderFilters>({
    status: "all",
    paymentStatus: "all",
    dateRange: "all",
    searchQuery: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const fetchOrdersData = useCallback(async (page = 1, status?: string, paymentStatus?: string) => {
    try {
      setLoading(true)
      console.log('📦 Fetching orders from backend...')

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

        setOrders(ordersData)
        setStats(statsData)

        const paginationData = (response.data as any).pagination
        if (paginationData) {
          setCurrentPage(paginationData.page || page)
          setTotalPages(paginationData.pages || 1)
        }

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
  }, [toast])

  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const fromPayment = urlParams?.get('from_payment') === 'true'
    const paymentRef = urlParams?.get('payment_ref')

    if (fromPayment && paymentRef) {
      const timer = setTimeout(() => {
        fetchOrdersData()
      }, 1500)
      return () => clearTimeout(timer)
    }

    fetchOrdersData()
  }, [fetchOrdersData])

  const handleRefresh = useCallback(async () => {
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
  }, [fetchOrdersData, filters.status, filters.paymentStatus, toast])

  const handleOrderUpdate = useCallback((orderId: string, newStatus: string) => {
    // Update the order in the local state
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? { ...order, status: newStatus as OrderStatus }
          : order
      )
    )

    // Recalculate stats using the updated orders
    setStats(calculateStatsFromOrders(orders.map(order =>
      order._id === orderId ? { ...order, status: newStatus as OrderStatus } : order
    )))
  }, [orders])

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
    const { default: jsPDF } = await import("jspdf")
    const { docBrand, getLogoIconDataUrl, hexToRgb } = await import("@/lib/brand/document-brand")

    const doc = new jsPDF("l", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 12
    const [forestR, forestG, forestB] = hexToRgb(docBrand.forest)
    const [deepR, deepG, deepB] = hexToRgb(docBrand.deep)

    const logo = await getLogoIconDataUrl()

    const drawHeader = (pageNum: number, totalPages: number) => {
      doc.setFillColor(deepR, deepG, deepB)
      doc.rect(0, 0, pageWidth, 22, "F")
      if (logo) {
        try {
          doc.addImage(logo, "PNG", margin, 3, 16, 16)
        } catch {
          /* ignore */
        }
      }
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("GroChain Orders Export", logo ? margin + 20 : margin, 10)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(docBrand.tagline, logo ? margin + 20 : margin, 16)
      doc.text(`Page ${pageNum}/${totalPages}`, pageWidth - margin, 12, { align: "right" })
    }

    const colX = [margin, 42, 68, 100, 130, 158, 200]
    const headers = ["Order #", "Status", "Payment", "Total (NGN)", "Date", "Items", "Seller"]
    const rowH = 8
    let y = 36

    const drawTableHeader = () => {
      doc.setFillColor(forestR, forestG, forestB)
      doc.rect(margin, y - 5, pageWidth - margin * 2, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      headers.forEach((h, i) => doc.text(h, colX[i], y))
      y += 6
      doc.setFont("helvetica", "normal")
      doc.setTextColor(30, 30, 30)
    }

    // Estimate pages for header page numbers (approx)
    const rowsPerPage = Math.floor((pageHeight - 50) / rowH)
    const totalPages = Math.max(1, Math.ceil(orders.length / Math.max(rowsPerPage, 1)))
    let pageNum = 1

    drawHeader(pageNum, totalPages)
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(`Exported: ${new Date().toLocaleString("en-NG")}  ·  ${orders.length} order(s)`, margin, 30)
    drawTableHeader()

    const truncate = (s: string, max: number) => {
      const t = String(s || "")
      return t.length > max ? `${t.slice(0, max - 1)}…` : t
    }

    for (const order of orders) {
      if (y > pageHeight - 16) {
        doc.setFillColor(forestR, forestG, forestB)
        doc.rect(0, pageHeight - 5, pageWidth, 5, "F")
        doc.addPage()
        pageNum += 1
        y = 36
        drawHeader(pageNum, totalPages)
        drawTableHeader()
      }

      const orderNo = order.orderNumber || `ORD-${String(order._id).slice(-6).toUpperCase()}`
      const seller = order.items[0]?.listing?.farmer?.name || "Unknown"
      const cells = [
        truncate(orderNo, 18),
        truncate(order.status, 12),
        truncate(order.paymentStatus, 12),
        truncate(Number(order.total || 0).toLocaleString("en-NG"), 14),
        truncate(new Date(order.createdAt).toLocaleDateString("en-NG"), 12),
        truncate(String(order.items?.length ?? 0), 6),
        truncate(seller, 22),
      ]
      doc.setFontSize(8)
      cells.forEach((c, i) => doc.text(c, colX[i], y))
      y += rowH
    }

    doc.setFillColor(forestR, forestG, forestB)
    doc.rect(0, pageHeight - 5, pageWidth, 5, "F")
    doc.save(`${filename}.pdf`)
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
      case 'pending': return 'bg-warning/10 text-warning border-warning/10'
      case 'confirmed': return 'bg-primary/10 text-primary border-primary/10'
      case 'paid': return 'bg-success/10 text-success border-success/10'
      case 'processing': return 'bg-accent/10 text-accent border-accent/10'
      case 'shipped': return 'bg-primary/10 text-primary border-primary/10'
      case 'delivered': return 'bg-success/10 text-success border-success/10'
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/10'
      case 'refunded': return 'bg-muted text-foreground border-border'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/10'
      case 'paid': return 'bg-success/10 text-success border-success/10'
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/10'
      case 'refunded': return 'bg-muted text-foreground border-border'
      default: return 'bg-muted text-foreground border-border'
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
        <DashboardPageShell>
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
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
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
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
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
              <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-4">
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
        </DashboardPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="My Orders">
      <DashboardPageShell className="px-4 sm:px-6 max-w-full overflow-hidden">
        <DashboardPageHeader
          badge="Order Tracking Active"
          title="My"
          titleHighlight="Orders"
          description="Track your orders, view delivery status, and manage your purchases."
          actions={
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleRefresh}
                disabled={refreshing}
                className="group"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={exporting || filteredOrders.length === 0}
                  >
                    {exporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Export ({filteredOrders.length})
                    <ChevronDown className="ml-2 h-4 w-4" />
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
              <Button size="lg" asChild>
                <Link href="/dashboard/marketplace">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse Products
                </Link>
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className={dashboard.statsGrid}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Orders</p>
                  <Text as="p" variant="stat" className="truncate text-foreground">{stats.total}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-warning flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
                  <Text as="p" variant="stat" className="truncate text-foreground">{stats.pending}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Confirmed</p>
                  <Text as="p" variant="stat" className="truncate text-foreground">{stats.confirmed}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Truck className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Shipped</p>
                  <Text as="p" variant="stat" className="truncate text-foreground">{stats.shipped}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Banknote className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-success flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Spent</p>
                  <Text as="p" variant="stat" className="truncate text-foreground">{formatPrice(stats.totalSpent)}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Order Management</CardTitle>
            <CardDescription className="text-sm">
              View and manage your orders by status and filters
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">All</span>
                  <span className="sm:hidden">All</span>
                  <span className="ml-1 text-xs">({stats.total})</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">Pend</span>
                  <span className="ml-1 text-xs">({stats.pending})</span>
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Confirmed</span>
                  <span className="sm:hidden">Conf</span>
                  <span className="ml-1 text-xs">({stats.confirmed})</span>
                </TabsTrigger>
                <TabsTrigger value="shipped" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Shipped</span>
                  <span className="sm:hidden">Ship</span>
                  <span className="ml-1 text-xs">({stats.shipped})</span>
                </TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Delivered</span>
                  <span className="sm:hidden">Del</span>
                  <span className="ml-1 text-xs">({stats.delivered})</span>
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Cancelled</span>
                  <span className="sm:hidden">Can</span>
                  <span className="ml-1 text-xs">({stats.cancelled})</span>
                </TabsTrigger>
                <TabsTrigger value="refunded" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
                  <span className="hidden sm:inline">Refunded</span>
                  <span className="sm:hidden">Ref</span>
                  <span className="ml-1 text-xs">(0)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                {/* Filters */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {/* Search */}
                  <div className="w-full">
                    <Input
                      placeholder="Search orders, products, or sellers..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="w-full sm:max-w-md h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value as OrderStatus })}
                    >
                      <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
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
                      <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
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
                      <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm xs:col-span-2 sm:col-span-1">
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

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1 || loading}
                            onClick={() => fetchOrdersData(currentPage - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages || loading}
                            onClick={() => fetchOrdersData(currentPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </DashboardPageShell>
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
    if (order.paymentStatus !== 'paid') {
      toast({
        title: "Receipt unavailable",
        description: "Receipts are only available after payment is completed.",
        variant: "destructive",
      })
      return
    }

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
      <CardContent className="p-4 sm:p-6">
        {/* Order Header */}
        <div className="flex flex-col space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <Badge className={`${getStatusColor(order.status)} font-medium text-xs`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`${getPaymentStatusColor(order.paymentStatus)} font-medium text-xs`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Order:</span>
              <span className="font-mono font-semibold text-primary text-xs sm:text-sm break-all">{order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`}</span>
              <span className="hidden sm:inline text-sm text-muted-foreground">•</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(new Date(order.createdAt))}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <Image
                  src={item.listing?.images?.[0] || "/placeholder.svg"}
                  alt={item.listing?.cropName || 'Product'}
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.listing?.cropName || 'Unknown Product'}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {item.quantity} {item.unit} × {formatPrice(item.price)}
                </p>
                {item.listing?.farmer?.name && (
                  <p className="text-xs text-muted-foreground truncate">
                    Sold by: {item.listing.farmer.name}
                  </p>
                )}
              </div>
              <div className="text-right sm:text-right w-full sm:w-auto">
                <p className="font-semibold text-primary text-sm sm:text-base">{formatPrice((item.quantity || 0) * (item.price || 0))}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Seller Info */}
          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Seller Information
            </h5>
            <div className="space-y-2">
              {(() => {
                // Try to get seller info from multiple sources
                // Priority: order.seller (authoritative) > items[0].listing.farmer (fallback)
                const sellerFromOrder = typeof order.seller === 'object' ? order.seller : null
                const sellerFromListing = order.items[0]?.listing?.farmer

                // Debug logging (can be removed in production)
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔍 Seller Info Debug:', {
                    orderId: order._id,
                    sellerFromOrder,
                    sellerFromListing,
                    sellerField: order.seller,
                    hasListing: !!order.items[0]?.listing,
                    hasFarmer: !!order.items[0]?.listing?.farmer
                  })
                }

                const seller = sellerFromOrder || sellerFromListing

                if (seller) {
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-sm truncate">{seller.name || 'Unknown Seller'}</span>
                        <Badge variant="secondary" className="text-xs w-fit">Verified</Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                        <Building className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{seller.profile?.farmName || (seller as any).location || 'Farm'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{(seller as any).phone || seller.profile?.phone || 'Phone not provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{seller.email || 'Email not provided'}</span>
                      </div>
                    </>
                  )
                } else {
                  return (
                    <div className="text-sm text-muted-foreground">
                      Seller information not available
                    </div>
                  )
                }
              })()}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Information
            </h5>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground break-words">
                  {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Est. Delivery: {formatDate(new Date(order.estimatedDelivery))}
                  </span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Truck className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground break-all">
                    Tracking: {order.trackingNumber}
                  </span>
                </div>
              )}
              {order.actualDelivery && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                  <span className="text-success">
                    Delivered: {formatDate(new Date(order.actualDelivery!))}
                  </span>
                </div>
              )}
              {order.deliveryInstructions && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <strong>Instructions:</strong> <span className="break-words">{order.deliveryInstructions}</span>
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
                <div className="flex justify-between text-success">
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
          <div className="mt-4 p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/10">
            <h5 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipment Tracking
            </h5>
            <div className="overflow-hidden">
              <ShipmentTrackingWidget orderId={order._id} />
            </div>
          </div>
        )}

        {/* Order Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" asChild className="h-8 sm:h-9 text-xs sm:text-sm">
            <Link href={`/dashboard/orders/${order._id}`}>
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">View Full Details</span>
              <span className="sm:hidden">Details</span>
            </Link>
          </Button>

          {order.trackingNumber && (
            <Button variant="outline" size="sm" asChild className="h-8 sm:h-9 text-xs sm:text-sm">
              <Link href={`/dashboard/orders/${order._id}`}>
                <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Track Package</span>
                <span className="sm:hidden">Track</span>
              </Link>
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Contact Seller</span>
              <span className="sm:hidden">Contact</span>
            </Button>
          )}

          {order.status === 'pending' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              {cancelling ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              <span className="sm:hidden">{cancelling ? 'Cancelling...' : 'Cancel'}</span>
            </Button>
          )}

          {order.status === 'shipped' && !order.trackingNumber && (
            <Button variant="outline" size="sm">
              <Truck className="h-4 w-4 mr-2" />
              Request Tracking
            </Button>
          )}

          {order.paymentStatus === 'paid' && (
            <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
              <FileText className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
