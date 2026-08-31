"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Text } from "@/components/ui/typography"
import { dashboard } from "@/lib/design-system"
import { apiService } from "@/lib/api"
import { formatCompactCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  Store,
  Package,
  TrendingUp,
  Eye,
  Edit,
  ShoppingCart,
  Banknote,
  Users,
  Calendar,
  Star,
  Search,
  RefreshCw,
  UserCheck,
  Activity,
  Wheat,
  Leaf,
  Apple,
  Coffee,
  Sprout,
  Plus,
  MoreVertical,
  PlayCircle,
  PauseCircle,
  FileEdit
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
  activeBuyers: number
  recentBuyerActivity: number
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

interface BuyerTestimonial {
  id?: string
  testimonial?: string
  location?: string
  buyerType?: string
}

interface BuyerActivityPayload {
  status?: string
  data?: {
    activeBuyers?: number
    recentActivity?: number
    testimonials?: BuyerTestimonial[]
  }
}

interface FarmerDashboardData {
  activeListings?: number
  pendingApprovals?: number
  totalRevenue?: number
  monthlyRevenue?: number
}

interface FarmerAnalyticsData {
  totalRevenue?: number
}

interface RawFarmerListing {
  _id?: string
  cropName?: string
  category?: string
  description?: string
  basePrice?: number
  quantity?: number
  unit?: string
  availableQuantity?: number
  location?: string | { city?: string; state?: string }
  images?: string[]
  tags?: string[]
  status?: ProductListing['status']
  createdAt?: string
  views?: number
  orders?: number
  rating?: number
  reviewCount?: number
}

interface RawFarmerOrder {
  _id?: string
  orderNumber?: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  products?: Order['products']
  total?: number
  totalAmount?: number
  status?: Order['status']
  orderDate?: string
  expectedDelivery?: string
  paymentStatus?: Order['paymentStatus']
}

export default function MarketplacePage() {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  // This page manages a farmer's own listings/orders - not applicable to other roles
  const isNonFarmer = !!user && user.role !== 'farmer'
  const [stats, setStats] = useState<MarketplaceStats>({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    averageRating: 0,
    activeBuyers: 0,
    recentBuyerActivity: 0
  })
  const [listings, setListings] = useState<ProductListing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const { isInitialLoading, isRefreshing: isDataRefreshing, begin, finish } = useStableDataFetch()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [buyerActivityData, setBuyerActivityData] = useState<BuyerActivityPayload | null>(null)
  const { toast } = useToast()



  const fetchMarketplaceData = useCallback(async () => {
    const generation = begin()
    try {
      // Fetch real marketplace data from backend
      console.log("🔄 Fetching marketplace data...")

      // Fetch farmer-specific marketplace data
      const [farmerDashboard, farmerListings, farmerOrders, farmerAnalytics, buyerActivityResponse] = await Promise.all([
        apiService.getFarmerDashboard(), // Get farmer dashboard data
        apiService.getFarmerListings({ limit: 10 }), // Get farmer's own listings
        apiService.getFarmerOrders({ limit: 10 }), // Get farmer's orders
        apiService.getFarmerAnalytics().catch(() => ({ data: {} })), // Get farmer-specific analytics for accurate revenue
        apiService.getBuyerActivity().catch(() => ({ data: null })) // Get buyer activity data
      ])

      setBuyerActivityData(buyerActivityResponse as BuyerActivityPayload)

      console.log("📊 Farmer Dashboard Response:", farmerDashboard)
      console.log("📦 Farmer Listings Response:", farmerListings)
      console.log("📋 Farmer Orders Response:", farmerOrders)

      // Process farmer dashboard data
      let processedStats: MarketplaceStats
      if (farmerDashboard?.status === 'success' && farmerDashboard?.data) {
        const dashboardData = farmerDashboard.data as FarmerDashboardData
        console.log('🔍 Farmer Dashboard Data:', dashboardData)

        // Prefer the farmer-analytics endpoint's revenue figure when available —
        // it's computed strictly from the farmer's own sales, vs. the dashboard's.
        const analyticsRevenue = (farmerAnalytics?.data as FarmerAnalyticsData | undefined)?.totalRevenue

        processedStats = {
          totalListings: dashboardData.activeListings || 0,
          activeListings: dashboardData.activeListings || 0,
          totalOrders: 0, // Will be calculated from orders
          pendingOrders: dashboardData.pendingApprovals || 0,
          totalRevenue: analyticsRevenue ?? (dashboardData.totalRevenue || 0),
          monthlyRevenue: dashboardData.monthlyRevenue || 0,
          totalCustomers: 0, // Will be calculated from orders
          averageRating: 0, // Not available in dashboard
          activeBuyers: Number((buyerActivityResponse?.data as BuyerActivityPayload['data'])?.activeBuyers) || 0,
          recentBuyerActivity: Number((buyerActivityResponse?.data as BuyerActivityPayload['data'])?.recentActivity) || 0
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
          averageRating: 0,
          activeBuyers: 0,
          recentBuyerActivity: 0
        }

        setStats(processedStats)
        console.log("✅ Default stats set:", processedStats)
      }

      // Process farmer's listings data
      const listingsPayload = farmerListings?.status === 'success'
        ? (farmerListings.data as { listings?: RawFarmerListing[] } | undefined)
        : undefined
      if (listingsPayload?.listings && Array.isArray(listingsPayload.listings)) {
        const listingsData = listingsPayload.listings
        const processedListings: ProductListing[] = listingsData.map((listing) => ({
          _id: String(listing._id ?? ""),
          cropName: listing.cropName || "",
          category: listing.category || "",
          description: listing.description || `${listing.cropName} - Fresh produce`,
          basePrice: listing.basePrice || 0,
          quantity: listing.quantity || 0,
          unit: listing.unit || 'kg',
          availableQuantity: listing.availableQuantity || 0,
          location: listing.location || "",
          images: listing.images || [],
          tags: listing.tags || [],
          status: listing.status || 'draft',
          createdAt: listing.createdAt || "",
          views: listing.views || 0,
          orders: listing.orders || 0,
          rating: listing.rating || 0,
          reviews: listing.reviewCount || 0
        }))

        setListings(processedListings)
        console.log("✅ Farmer listings set:", processedListings.length)
      }

      // Process farmer's orders data
      const ordersPayload = farmerOrders?.status === 'success'
        ? (farmerOrders.data as { orders?: RawFarmerOrder[] } | undefined)
        : undefined
      if (ordersPayload?.orders && Array.isArray(ordersPayload.orders)) {
        const ordersData = ordersPayload.orders
        const processedOrders: Order[] = ordersData.map((order) => ({
          _id: String(order._id ?? ""),
          orderNumber: order.orderNumber || `ORD-${String(order._id).slice(-6).toUpperCase()}`,
          customer: {
            name: order.customer?.name || 'Unknown',
            email: order.customer?.email || '',
            phone: order.customer?.phone || ''
          },
          products: order.products || [],
          totalAmount: order.total ?? order.totalAmount ?? 0,
          status: order.status || 'pending',
          orderDate: order.orderDate || '',
          expectedDelivery: order.expectedDelivery || '',
          paymentStatus: order.paymentStatus || 'pending'
        }))

        // Calculate additional stats from orders
        const pendingOrdersCount = processedOrders.filter((order) => order.status === 'pending').length
        const uniqueCustomers = new Set(processedOrders.map((order) => order.customer.email)).size
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
        description: "Failed to load listings data. Please try again.",
        variant: "destructive"
      })

      // Set honest empty state on failure - no fabricated numbers
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalCustomers: 0,
        averageRating: 0,
        activeBuyers: 0,
        recentBuyerActivity: 0
      })
      setListings((prev) => (prev.length > 0 ? prev : []))
      setOrders((prev) => (prev.length > 0 ? prev : []))
    } finally {
      finish(generation)
    }
  }, [toast, begin, finish])

  useEffect(() => {
    if (!hasHydrated) return
    if (isNonFarmer) {
      router.replace('/dashboard')
      return
    }
    fetchMarketplaceData()
  }, [fetchMarketplaceData, isNonFarmer, hasHydrated, router])

  if (!hasHydrated || isNonFarmer) {
    return null
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchMarketplaceData()
      toast({
        title: "Refreshed",
        description: "Listings data has been updated",
      })
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/10'
      case 'draft': return 'bg-muted text-foreground border-border'
      case 'inactive': return 'bg-warning/10 text-warning border-warning/10'
      case 'sold_out': return 'bg-destructive/10 text-destructive border-destructive/10'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/10'
      case 'confirmed': return 'bg-primary/10 text-primary border-primary/10'
      case 'shipped': return 'bg-accent/10 text-accent border-accent/10'
      case 'delivered': return 'bg-success/10 text-success border-success/10'
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/10'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/10'
      case 'pending': return 'bg-warning/10 text-warning border-warning/10'
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/10'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-5 w-5 text-primary"
    switch (category) {
      case "grains": return <Wheat className={iconClass} />
      case "tubers": return <Package className={iconClass} />
      case "vegetables": return <Leaf className={iconClass} />
      case "fruits": return <Apple className={iconClass} />
      case "legumes": return <Sprout className={iconClass} />
      case "cash_crops": return <Coffee className={iconClass} />
      default: return <Leaf className={iconClass} />
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

  if (isInitialLoading) {
    return (
      <DashboardLayout pageTitle="Marketplace">
        <DashboardPageShell>
          <div className={dashboard.statsGrid}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border h-full">
                <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <div className="h-3 sm:h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="h-6 sm:h-8 bg-muted rounded mb-2"></div>
                  <div className="h-2 sm:h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Listings">
      <DashboardPageShell className="sm:space-y-10">
        <DashboardPageHeader
          badge="Marketplace Intelligence Active"
          title="Merchant"
          titleHighlight="Listings"
          description={
            <>
              Analyze your market performance, manage inventory, and optimize your{" "}
              <span className="font-semibold text-foreground">sales strategy</span> with GroChain.
            </>
          }
          actions={
            <>
              <Button
                onClick={handleRefresh}
                disabled={isInitialLoading || refreshing || isDataRefreshing}
                variant="outline"
                size="lg"
                className="group"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 transition-transform duration-500 group-hover:rotate-180 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Syncing..." : "Refresh"}
              </Button>
              <Button asChild size="lg">
                <Link href="/dashboard/marketplace/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Listing
                </Link>
              </Button>
            </>
          }
        />

        {/* Listings Stats */}
        <div className={dashboard.statsGrid}>
          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Store className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate pr-2 min-w-0 flex-1">Total Listings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Text as="div" variant="stat" className="text-foreground">{stats.totalListings}</Text>
              <p className="text-xs text-muted-foreground">{stats.activeListings} active</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                <span className="truncate pr-2 min-w-0 flex-1">Total Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Text as="div" variant="stat" className="text-foreground">{stats.totalOrders}</Text>
              <p className="text-xs text-muted-foreground">{stats.pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                <span className="truncate pr-2 min-w-0 flex-1">Total Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Text as="div" variant="stat" className="text-foreground">{formatCompactCurrency(stats.totalRevenue)}</Text>
              <p className="text-xs text-muted-foreground">{formatCompactCurrency(stats.monthlyRevenue)} this month</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
                <span className="truncate pr-2 min-w-0 flex-1">Customers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Text as="div" variant="stat" className="text-foreground">{stats.totalCustomers}</Text>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 text-secondary" /> {stats.averageRating} avg rating
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate pr-2 min-w-0 flex-1">Active Buyers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <Text as="div" variant="stat" className="text-foreground">{stats.activeBuyers}</Text>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {stats.recentBuyerActivity} active today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="listings" className="text-xs sm:text-sm">My Listings</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Recent Listings */}
              <Card className="border border-border h-full">
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    Recent Listings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Your latest product listings
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-2 sm:space-y-3">
                    {listings.slice(0, 3).map((listing) => (
                      <div key={listing._id} className="flex items-center justify-between p-2 sm:p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft flex-shrink-0">{getCategoryIcon(listing.category)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground text-xs sm:text-sm truncate">{listing.cropName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {listing.availableQuantity} {listing.unit} available
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium text-foreground text-xs sm:text-sm">₦{listing.basePrice.toLocaleString()}</div>
                          <Badge className={`${getStatusColor(listing.status)} text-xs`}>
                            {listing.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <Button variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm" asChild>
                      <Link href="/dashboard/marketplace/listings">
                        View All Listings
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="border border-border h-full">
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Latest customer orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-2 sm:space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order._id} className="p-2 sm:p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <div className="font-medium text-foreground text-xs sm:text-sm truncate">{order.orderNumber}</div>
                          <Badge className={`${getOrderStatusColor(order.status)} text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1 sm:mb-2 truncate">
                          {order.customer.name} • {order.products.length} item(s)
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-foreground">
                            ₦{order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <Button variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm" asChild>
                      <Link href="/dashboard/marketplace/orders">
                        View All Orders
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Activity */}
              <Card className="border border-border h-full">
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    Buyer Activity
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Active buyers and recent purchases
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-success-soft rounded-lg border border-success/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-success-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-success">Active Buyers Today</p>
                          <p className="text-xs text-success">{stats.recentBuyerActivity} buyers browsing marketplace</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-success">{stats.activeBuyers}</div>
                        <div className="text-xs text-success">total active</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Recent Buyer Testimonials</p>
                      <div className="space-y-2">
                        {buyerActivityData?.data?.testimonials?.slice(0, 2).map((testimonial: BuyerTestimonial, index: number) => (
                          <div key={testimonial.id || index} className={`p-2 rounded border ${index === 0 ? 'bg-primary/10 border-primary/10' : 'bg-accent/10 border-accent/10'}`}>
                            <p className={`text-xs italic ${index === 0 ? 'text-primary' : 'text-accent'}`}>
                              &quot;{testimonial.testimonial}&quot;
                            </p>
                            <p className={`text-xs mt-1 ${index === 0 ? 'text-primary' : 'text-accent'}`}>
                              - {testimonial.location} {testimonial.buyerType}
                            </p>
                          </div>
                        ))}

                        {(!buyerActivityData?.data?.testimonials || buyerActivityData.data.testimonials.length === 0) && (
                          <p className="text-xs text-muted-foreground italic p-2">
                            No buyer testimonials yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm" asChild>
                      <Link href="/marketplace/buyers">
                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Active Buyers
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-border">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm sm:text-base font-medium">Quick Actions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Common listing management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
                  <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm border-primary/20 hover:bg-primary-soft" asChild>
                    <Link href="/marketplace">
                      <Store className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      <span className="text-center">Browse Marketplace</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" asChild>
                    <Link href="/dashboard/marketplace/analytics">
                      <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-center">View Analytics</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" asChild>
                    <Link href="/dashboard/marketplace/orders">
                      <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-center">Manage Orders</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-3 sm:space-y-4">
            {/* Filters and Search */}
            <Card className="border border-border">
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-xs sm:text-sm h-8 sm:h-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2 sm:px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-xs sm:text-sm h-8 sm:h-9"
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
                      className="px-2 sm:px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-xs sm:text-sm h-8 sm:h-9"
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
            <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <Card key={listing._id} className="border border-border hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft flex-shrink-0">{getCategoryIcon(listing.category)}</span>
                          <Badge className={`${getStatusColor(listing.status)} text-xs`}>
                            {listing.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold truncate">{listing.cropName}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm line-clamp-2">
                          {listing.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">₦{listing.basePrice.toLocaleString()}/{listing.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium">{listing.availableQuantity} {listing.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium truncate ml-2">{typeof listing.location === 'string' ? listing.location : `${listing.location?.city || 'Unknown'}, ${listing.location?.state || 'Unknown State'}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 flex-shrink-0" />
                        <span>{listing.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3 flex-shrink-0" />
                        <span>{listing.orders} orders</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 flex-shrink-0" />
                        <span>{listing.rating}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 sm:h-8 text-xs"
                        onClick={() => handleViewListing(listing._id)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 sm:h-8 text-xs"
                        onClick={() => handleEditListing(listing._id)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                            <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {listing.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleUpdateListingStatus(listing._id, 'active')}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {listing.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleUpdateListingStatus(listing._id, 'inactive')}>
                              <PauseCircle className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {listing.status !== 'draft' && (
                            <DropdownMenuItem onClick={() => handleUpdateListingStatus(listing._id, 'draft')}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Move to Draft
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <Card className="text-center py-8 sm:py-12 border border-border">
                <div className="text-muted-foreground mb-3 sm:mb-4">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Listings Found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? "Try adjusting your filters to find listings."
                    : "You haven't created any product listings yet."
                  }
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-3 sm:space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                  Customer Orders
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage incoming orders and track delivery status
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-3 sm:space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="p-3 sm:p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground text-xs sm:text-sm truncate">{order.orderNumber}</h4>
                          <p className="text-xs text-muted-foreground truncate">{order.customer.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium text-foreground text-xs sm:text-sm">₦{order.totalAmount.toLocaleString()}</div>
                          <div className="flex gap-1 sm:gap-2 mt-1">
                            <Badge className={`${getOrderStatusColor(order.status)} text-xs`}>
                              {order.status}
                            </Badge>
                            <Badge className={`${getPaymentStatusColor(order.paymentStatus)} text-xs`}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        {order.products.map((product, index) => (
                          <div key={index} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground truncate mr-2">
                              {product.cropName} ({product.quantity} {product.unit})
                            </span>
                            <span className="font-medium flex-shrink-0">₦{product.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground mb-2 sm:mb-3 gap-1 sm:gap-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col xs:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 sm:h-8 text-xs flex-1"
                          onClick={() => handleViewOrder(order._id)}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          View Details
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            className="h-7 sm:h-8 text-xs flex-1"
                            onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                          >
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="h-7 sm:h-8 text-xs flex-1"
                            onClick={() => handleUpdateOrderStatus(order._id, 'shipped')}
                          >
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 sm:h-8 text-xs flex-1"
                            onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                          >
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Orders Yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      When customers place orders, they will appear here for you to manage.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
