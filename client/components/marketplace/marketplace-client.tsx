"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Store,
  Plus,
  Package,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Banknote,
  Users,
  Calendar,
  MapPin,
  Star,
  Filter,
  Search,
  MoreHorizontal,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface MarketplaceStats {
  totalListings: number
  activeListings: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  averageRating: number
}

interface ProductListing {
  _id: string
  cropName: string
  category: string
  description: string
  basePrice: number
  quantity: number
  unit: string
  availableQuantity: number
  location: string | { city?: string; state?: string }
  images: string[]
  tags: string[]
  status: 'draft' | 'active' | 'inactive' | 'sold_out'
  createdAt: string
  views: number
  orders: number
  rating: number
  reviews: number
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
  }
  products: Array<{
    listingId: string
    cropName: string
    quantity: number
    unit: string
    price: number
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  expectedDelivery: string
  paymentStatus: 'pending' | 'paid' | 'failed'
}

export function MarketplaceClient() {
  const [stats, setStats] = useState<MarketplaceStats>({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    averageRating: 0
  })
  const [listings, setListings] = useState<ProductListing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchMarketplaceData()
  }, [])

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true)

      // Fetch real marketplace data from backend
      console.log("🔄 Fetching marketplace data...")

      // Fetch farmer-specific marketplace data
      const [farmerDashboard, farmerListings, farmerOrders, farmerAnalytics] = await Promise.all([
        apiService.getFarmerDashboard(), // Get farmer dashboard data
        apiService.getFarmerListings({ limit: 10 }), // Get farmer's own listings
        apiService.getFarmerOrders({ limit: 10 }), // Get farmer's orders
        apiService.getFarmerAnalytics().catch(() => ({ data: {} })) // Get farmer-specific analytics for accurate revenue
      ])

      console.log("📊 Farmer Dashboard Response:", farmerDashboard)
      console.log("📦 Farmer Listings Response:", farmerListings)
      console.log("📋 Farmer Orders Response:", farmerOrders)

      // Process farmer dashboard data
      let processedStats: MarketplaceStats
      if (farmerDashboard?.status === 'success' && farmerDashboard?.data) {
        const dashboardData = farmerDashboard.data
        console.log('🔍 Farmer Dashboard Data:', dashboardData)

        processedStats = {
          totalListings: (dashboardData as any).activeListings || 0,
          activeListings: (dashboardData as any).activeListings || 0,
          totalOrders: 0, // Will be calculated from orders
          pendingOrders: (dashboardData as any).pendingApprovals || 0,
          totalRevenue: (dashboardData as any).totalRevenue || 0,
          monthlyRevenue: (dashboardData as any).monthlyRevenue || 0,
          totalCustomers: 0, // Will be calculated from orders
          averageRating: 0 // Not available in dashboard
        }

        setStats(processedStats)
        console.log("✅ Stats set from farmer dashboard:", processedStats)
      } else {
        // Default stats if no farmer dashboard data available
        processedStats = {
          totalListings: 0,
          activeListings: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalCustomers: 0,
          averageRating: 0
        }

        setStats(processedStats)
        console.log("✅ Default stats set:", processedStats)
      }

      // Process farmer's listings data
      if (farmerListings?.status === 'success' && (farmerListings.data as any)?.listings && Array.isArray((farmerListings.data as any).listings)) {
        const listingsData = (farmerListings.data as any).listings
        const processedListings = listingsData.map((listing: any) => ({
          _id: listing._id,
          cropName: listing.cropName,
          category: listing.category,
          description: listing.description || `${listing.cropName} - Fresh produce`,
          basePrice: listing.basePrice,
          quantity: listing.quantity,
          unit: listing.unit || 'kg',
          availableQuantity: listing.availableQuantity,
          location: listing.location,
          images: listing.images || [],
          tags: listing.tags || [],
          status: listing.status,
          createdAt: listing.createdAt,
          views: listing.views || 0,
          orders: listing.orders || 0,
          rating: listing.rating || 0,
          reviews: listing.reviewCount || 0
        }))

        setListings(processedListings)
        console.log("✅ Farmer listings set:", processedListings.length)
      }

      // Process farmer's orders data
      if (farmerOrders?.status === 'success' && (farmerOrders.data as any)?.orders && Array.isArray((farmerOrders.data as any).orders)) {
        const ordersData = (farmerOrders.data as any).orders
        const processedOrders = ordersData.map((order: any) => ({
          _id: order._id,
          orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
          customer: {
            name: order.customer?.name || 'Unknown',
            email: order.customer?.email || '',
            phone: order.customer?.phone || ''
          },
          products: order.products || [],
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.orderDate,
          expectedDelivery: order.expectedDelivery || '',
          paymentStatus: order.paymentStatus
        }))

        // Calculate additional stats from orders
        const pendingOrdersCount = processedOrders.filter((order: any) => order.status === 'pending').length
        const uniqueCustomers = new Set(processedOrders.map((order: any) => order.customer.email)).size
        const totalOrdersCount = processedOrders.length

        // Update stats with calculated values
        setStats(prevStats => ({
          ...prevStats,
          totalOrders: totalOrdersCount,
          pendingOrders: pendingOrdersCount,
          totalCustomers: uniqueCustomers
        }))

        setOrders(processedOrders)
        console.log("✅ Farmer orders set:", processedOrders.length)
      }

    } catch (error) {
      console.error("❌ Failed to fetch marketplace data:", error)
      toast({
        title: "Error",
        description: "Failed to load marketplace data. Please try again.",
        variant: "destructive"
      })

      // Set fallback data
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalCustomers: 0,
        averageRating: 0
      })
      setListings([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchMarketplaceData()
      toast({
        title: "Refreshed",
        description: "Marketplace data has been updated",
      })
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'inactive': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'sold_out': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grains': return '🌾'
      case 'tubers': return '🥔'
      case 'vegetables': return '🥬'
      case 'fruits': return '🍎'
      case 'legumes': return '🫘'
      case 'cash_crops': return '☕'
      default: return '🌱'
    }
  }

  const handleViewListing = (listingId: string) => {
    // Navigate to listing details page
    console.log("Viewing listing:", listingId)
    // You can implement navigation to listing details page
  }

  const handleEditListing = (listingId: string) => {
    // Navigate to edit listing page
    console.log("Editing listing:", listingId)
    // You can implement navigation to edit listing page
  }

  const handleViewOrder = (orderId: string) => {
    // Navigate to order details page
    console.log("Viewing order:", orderId)
    // You can implement navigation to order details page
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus)
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
      // Refresh data
      fetchMarketplaceData()
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      })
    }
  }

  const handleUpdateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      await apiService.updateListingStatus(listingId, newStatus)
      toast({
        title: "Success",
        description: `Listing status updated to ${newStatus}`,
      })
      // Refresh data
      fetchMarketplaceData()
    } catch (error) {
      console.error("Failed to update listing status:", error)
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive"
      })
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <DashboardLayout pageTitle="Marketplace">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Marketplace</h1>
            <p className="text-gray-600">
              Manage your product listings, track orders, and monitor sales performance
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/marketplace/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/marketplace/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>

        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-500" />
                Total Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
              <p className="text-xs text-gray-500">{stats.activeListings} active</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-500" />
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
                <Banknote className="h-4 w-4 text-emerald-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-gray-500">₦{(stats.monthlyRevenue / 1000).toFixed(0)}K this month</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
              <p className="text-xs text-gray-500">⭐ {stats.averageRating} avg rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Listings */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Package className="h-4 w-4 text-blue-500" />
                    Recent Listings
                  </CardTitle>
                  <CardDescription>
                    Your latest product listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {listings.slice(0, 3).map((listing) => (
                      <div key={listing._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getCategoryIcon(listing.category)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{listing.cropName}</div>
                            <div className="text-sm text-gray-500">
                              {listing.availableQuantity} {listing.unit} available
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">₦{listing.basePrice.toLocaleString()}</div>
                          <Badge className={getStatusColor(listing.status)}>
                            {listing.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/marketplace/listings">
                        View All Listings
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>
                    Latest customer orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order._id} className="p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {order.customer.name} • {order.products.length} item(s)
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₦{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/marketplace/orders">
                        View All Orders
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                <CardDescription>
                  Common marketplace tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/marketplace/new">
                      <Plus className="h-6 w-6" />
                      Create New Listing
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/marketplace/analytics">
                      <TrendingUp className="h-6 w-6" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/marketplace/orders">
                      <ShoppingCart className="h-6 w-6" />
                      Manage Orders
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            {/* Filters and Search */}
            <Card className="border border-gray-200">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold_out">Sold Out</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      <option value="grains">Grains</option>
                      <option value="tubers">Tubers</option>
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="legumes">Legumes</option>
                      <option value="cash_crops">Cash Crops</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <Card key={listing._id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(listing.category)}</span>
                          <Badge className={getStatusColor(listing.status)}>
                            {listing.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold">{listing.cropName}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {listing.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">₦{listing.basePrice.toLocaleString()}/{listing.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">{listing.availableQuantity} {listing.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{typeof listing.location === 'string' ? listing.location : `${listing.location?.city || 'Unknown'}, ${listing.location?.state || 'Unknown State'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{listing.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        <span>{listing.orders} orders</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{listing.rating}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewListing(listing._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditListing(listing._id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <Card className="text-center py-12 border border-gray-200">
                <div className="text-gray-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? "Try adjusting your filters to find listings."
                    : "You haven't created any product listings yet."
                  }
                </p>
                <Button asChild>
                  <Link href="/dashboard/marketplace/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  Customer Orders
                </CardTitle>
                <CardDescription>
                  Manage incoming orders and track delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">{order.customer.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">₦{order.totalAmount.toLocaleString()}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {order.products.map((product, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {product.cropName} ({product.quantity} {product.unit})
                            </span>
                            <span className="font-medium">₦{product.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'shipped')}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600">
                      When customers place orders, they will appear here for you to manage.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
