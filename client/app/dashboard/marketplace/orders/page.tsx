"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingCart,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Banknote,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Download,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"

interface Order {
  _id: string
  orderNumber: string
  buyer: {
    name: string
    email: string
    phone: string
  }
  seller: {
    _id: string
    name: string
  }
  items: Array<{
    listing: {
      _id: string
      cropName: string
      images: string[]
    }
    quantity: number
    price: number
    unit: string
    total: number
  }>
  total: number
  subtotal: number
  shipping: number
  shippingMethod: string
  discount: number
  status: 'pending' | 'confirmed' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
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
  actualDelivery: string
  trackingNumber: string
  notes: string
  orderDate: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
  monthlyRevenue: number
  averageOrderValue: number
}

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  // Use useMemo for filtered orders to prevent infinite loops
  const filteredOrdersMemo = useMemo(() => {
    let filtered = [...orders]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.listing.cropName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter(order =>
        new Date(order.createdAt) >= filterDate
      )
    }

    return filtered
  }, [orders, searchQuery, statusFilter, dateFilter])

  // Update filteredOrders state when memoized value changes
  useEffect(() => {
    setFilteredOrders(filteredOrdersMemo)
  }, [filteredOrdersMemo])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching orders...")

      // Fetch farmer's orders from backend
      const response = await apiService.getFarmerOrders()
      console.log("📋 Farmer Orders API Response:", response)

      if (response?.status === 'success' && (response.data as any)?.orders) {
        const ordersData = (response.data as any).orders
        console.log("✅ Farmer orders data:", ordersData)

        // Process and format farmer's orders
        const processedOrders = ordersData.map((order: any) => ({
          _id: order._id,
          orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
          buyer: {
            name: order.customer?.name || 'Unknown Customer',
            email: order.customer?.email || '',
            phone: order.customer?.phone || ''
          },
          seller: { _id: '', name: 'You' },
          items: order.products?.map((product: any) => ({
            listing: { 
              _id: product.listingId || '', 
              cropName: product.cropName || 'Unknown Product', 
              images: [] 
            },
            quantity: product.quantity || 0,
            price: product.price || 0,
            unit: product.unit || 'kg',
            total: (product.quantity || 0) * (product.price || 0)
          })) || [],
          total: order.totalAmount || 0,
          subtotal: order.subtotal || order.totalAmount || 0,
          shipping: order.shipping || 0,
          shippingMethod: order.shippingMethod || 'road_standard',
          discount: 0,
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: 'paystack',
          shippingAddress: order.deliveryAddress || {
            street: '',
            city: '',
            state: '',
            country: 'Nigeria',
            postalCode: '',
            phone: ''
          },
          deliveryInstructions: order.notes || '',
          estimatedDelivery: order.expectedDelivery || '',
          actualDelivery: '',
          trackingNumber: '',
          notes: order.notes || '',
          orderDate: order.orderDate || new Date().toISOString(),
          createdAt: order.orderDate || new Date().toISOString(),
          updatedAt: order.orderDate || new Date().toISOString()
        }))

        setOrders(processedOrders)

        // Calculate stats
        calculateStats(processedOrders)

      } else {
        console.warn("⚠️ Orders response not in expected format:", response)
        setOrders([])
      }

    } catch (error) {
      console.error("❌ Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive"
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ordersData: Order[]) => {
    const totalOrders = ordersData.length
    const pendingOrders = ordersData.filter(o => o.status === 'pending').length
    const confirmedOrders = ordersData.filter(o => o.status === 'confirmed').length
    const shippedOrders = ordersData.filter(o => o.status === 'shipped').length
    const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length
    const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length

    const totalRevenue = ordersData
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.total, 0)

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyRevenue = ordersData
      .filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear && o.paymentStatus === 'paid'
      })
      .reduce((sum, order) => sum + order.total, 0)

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    setStats({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      monthlyRevenue,
      averageOrderValue
    })
  }



  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchOrders()
      toast({
        title: "Refreshed",
        description: "Orders data has been updated",
      })
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId)
      console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`)

      await apiService.updateOrderStatus(orderId, newStatus)

      // Update local state
      setOrders(prev => prev.map(order =>
        order._id === orderId
          ? { ...order, status: newStatus as Order['status'] }
          : order
      ))

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })

      // Recalculate stats
      const updatedOrders = orders.map(order =>
        order._id === orderId
          ? { ...order, status: newStatus as Order['status'] }
          : order
      )
      calculateStats(updatedOrders)

    } catch (error) {
      console.error("❌ Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'paid': return 'bg-green-50 text-green-700 border-green-200'
      case 'processing': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      case 'refunded': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      case 'refunded': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Marketplace Orders">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace Orders">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Orders Management</h1>
              <p className="text-gray-600">
                Track and manage all customer orders for your products
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500">{stats.pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</div>
              <p className="text-xs text-gray-500">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.confirmedOrders}</div>
              <p className="text-xs text-gray-500">Confirmed orders</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-gray-500">{formatCurrency(stats.monthlyRevenue)} this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search orders by number, customer, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
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
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="text-center py-12 border border-gray-200">
              <div className="text-gray-400 mb-4">
                <ShoppingCart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {orders.length === 0 ? 'No Orders Yet' : 'No Orders Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {orders.length === 0
                  ? "When customers place orders for your products, they will appear here."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {orders.length === 0 && (
                <Button asChild>
                  <Link href="/dashboard/marketplace">
                    <Package className="h-4 w-4 mr-2" />
                    View Your Listings
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(order.orderDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Customer:</strong> {order.buyer.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Items:</strong> {order.items.map(item => item.listing.cropName).join(', ')}
                    </div>
                    {order.trackingNumber && (
                      <div className="text-sm text-gray-600">
                        <strong>Tracking:</strong> {order.trackingNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrderDetails(order)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                        disabled={updatingOrder === order._id}
                        className="w-full sm:w-auto"
                      >
                        {updatingOrder === order._id ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Confirm Order
                      </Button>
                    )}

                    {order.status === 'confirmed' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/shipments/create?orderId=${order._id}`)}
                          className="w-full sm:w-auto"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Create Shipment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateOrderStatus(order._id, 'shipped')}
                          disabled={updatingOrder === order._id}
                          className="w-full sm:w-auto"
                        >
                          {updatingOrder === order._id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4 mr-1" />
                          )}
                          Mark Shipped
                        </Button>
                      </div>
                    )}

                    {order.status === 'shipped' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                        disabled={updatingOrder === order._id}
                        className="w-full sm:w-auto"
                      >
                        {updatingOrder === order._id ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Truck className="h-4 w-4 mr-1" />
                        )}
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Order Details - {selectedOrder.orderNumber}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Order Status */}
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                  <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedOrder.orderDate)}
                  </span>
                </div>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Name:</span>
                      <span>{selectedOrder.buyer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.buyer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.buyer.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-100 rounded-lg gap-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🌾</div>
                            <div>
                              <div className="font-medium">{item.listing.cropName}</div>
                              <div className="text-sm text-gray-600">
                                {item.quantity} {item.unit} × {formatCurrency(item.price)}
                              </div>
                            </div>
                          </div>
                          <div className="font-medium text-right sm:text-left">{formatCurrency(item.total)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <strong>Address:</strong> {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.country}
                    </div>
                    {selectedOrder.shippingAddress.postalCode && (
                      <div className="text-sm">
                        <strong>Postal Code:</strong> {selectedOrder.shippingAddress.postalCode}
                      </div>
                    )}
                    <div className="text-sm">
                      <strong>Phone:</strong> {selectedOrder.shippingAddress.phone}
                    </div>
                    {selectedOrder.deliveryInstructions && (
                      <div className="text-sm">
                        <strong>Instructions:</strong> {selectedOrder.deliveryInstructions}
                      </div>
                    )}
                    {selectedOrder.trackingNumber && (
                      <div className="text-sm">
                        <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.shipping > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatCurrency(selectedOrder.shipping)}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

