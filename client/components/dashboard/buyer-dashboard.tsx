"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { MarketplaceCard, type MarketplaceProduct } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { extractListingsFromResponse } from "@/lib/marketplace-listings"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { ShoppingCart, Package, Heart, TrendingUp, Search, QrCode, Eye, RefreshCw, Brain, Sparkles, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { dashboard, textStyles } from "@/lib/design-system"
import { getErrorMessage, asRecord } from "@/lib/error-utils"

interface DashboardStats {
  totalOrders: number
  totalSpent: number
  pendingDeliveries: number
  activeOrders: number
  favoriteProducts: number
  monthlySpent: number
  lastOrderDate?: string
  favorites: number
}

interface BuyerOrder {
  _id?: string
  id?: string
  orderNumber?: string
  total?: number
  totalAmount?: number
  status?: string
  createdAt?: string
}

interface BuyerProduct {
  _id?: string
  id?: string
  cropName?: string
  name?: string
  category?: string
  cropType?: string
  variety?: string
  description?: string
  basePrice?: number
  price?: number
  unit?: string
  quantity?: number
  availableQuantity?: number
  qualityGrade?: string
  quality?: string
  organic?: boolean
  createdAt?: string
  location?: string
  farmer?: {
    _id?: string
    farmerId?: string
    name?: string
    profile?: {
      avatar?: string
    }
    rating?: number
    emailVerified?: boolean
    location?: string
  }
  farmerId?: string
  farmerName?: string
  rating?: number
  images?: string[]
  certifications?: string[]
  qrCode?: string
  tags?: string[]
  reviewCount?: number
}


interface OptimisticUpdateData {
  total?: number
  productId?: string
}

interface BuyerDashboardApiData {
  totalOrders?: number
  totalSpent?: number
  pendingDeliveries?: number
  activeOrders?: number
  favoriteProducts?: number
  monthlySpent?: number
  lastOrderDate?: string
  recentOrders?: BuyerOrder[]
}

export function BuyerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<BuyerOrder[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<BuyerProduct[]>([])
  const { isInitialLoading, isRefreshing, begin, finish } = useStableDataFetch()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()
  const { addToCart } = useBuyerStore()

  // Optimistic updates for immediate UI feedback
  const handleOptimisticUpdate = useCallback((action: string, data: OptimisticUpdateData) => {
    console.log(`⚡ Optimistic update: ${action}`, data)

    switch (action) {
      case 'order_placed':
        // Immediately update stats
        setStats(prev => ({
          totalOrders: (prev?.totalOrders || 0) + 1,
          totalSpent: (prev?.totalSpent || 0) + (data.total || 0),
          monthlySpent: (prev?.monthlySpent || 0) + (data.total || 0),
          pendingDeliveries: prev?.pendingDeliveries || 0,
          activeOrders: prev?.activeOrders || 0,
          favoriteProducts: prev?.favoriteProducts || 0,
          lastOrderDate: prev?.lastOrderDate,
          favorites: prev?.favorites || 0
        }))
        toast({
          title: "Order placed successfully!",
          description: "Your dashboard will update with the latest data.",
          variant: "default",
        })
        break

      case 'favorite_added':
        setStats(prev => ({
          totalOrders: prev?.totalOrders || 0,
          totalSpent: prev?.totalSpent || 0,
          monthlySpent: prev?.monthlySpent || 0,
          pendingDeliveries: prev?.pendingDeliveries || 0,
          activeOrders: prev?.activeOrders || 0,
          favoriteProducts: (prev?.favoriteProducts || 0) + 1,
          lastOrderDate: prev?.lastOrderDate,
          favorites: (prev?.favorites || 0) + 1
        }))
        break

      case 'favorite_removed':
        setStats(prev => ({
          totalOrders: prev?.totalOrders || 0,
          totalSpent: prev?.totalSpent || 0,
          monthlySpent: prev?.monthlySpent || 0,
          pendingDeliveries: prev?.pendingDeliveries || 0,
          activeOrders: prev?.activeOrders || 0,
          favoriteProducts: Math.max((prev?.favoriteProducts || 0) - 1, 0),
          lastOrderDate: prev?.lastOrderDate,
          favorites: Math.max((prev?.favorites || 0) - 1, 0)
        }))
        break
    }

  }, [toast])

  const fetchDashboardData = useCallback(async (reason: string = 'manual') => {
    const generation = begin()
    try {
      console.log(`🔄 Fetching dashboard data (${reason})...`)

      // Fetch dashboard data in parallel for better performance
      const [dashboardResponse, ordersResponse, listingsResponse] = await Promise.allSettled([
        apiService.getDashboard(),
        apiService.getUserOrders({ limit: 5 }),
        apiService.getMarketplaceListings({ limit: 6, featured: true })
      ])

      console.log('📊 Dashboard responses:', {
        dashboard: dashboardResponse.status,
        orders: ordersResponse.status,
        listings: listingsResponse.status
      })

      // Process dashboard stats
      let dashboardData: BuyerDashboardApiData = {}
      if (dashboardResponse.status === 'fulfilled') {
        dashboardData = asRecord(dashboardResponse.value?.data ?? dashboardResponse.value) as BuyerDashboardApiData
        console.log('✅ Dashboard data received:', dashboardData)
        console.log('📊 Dashboard recent orders:', dashboardData.recentOrders)
      } else {
        console.error('❌ Dashboard data failed:', dashboardResponse.reason)
      }

      const processedStats = {
        totalOrders: Number(dashboardData.totalOrders) || 0,
        totalSpent: Number(dashboardData.totalSpent) || 0,
        pendingDeliveries: Number(dashboardData.pendingDeliveries) || 0,
        activeOrders: Number(dashboardData.activeOrders) || 0,
        favoriteProducts: Number(dashboardData.favoriteProducts) || 0,
        monthlySpent: Number(dashboardData.monthlySpent) || 0,
        lastOrderDate: dashboardData.lastOrderDate,
        favorites: Number(dashboardData.favoriteProducts) || 0 // For backward compatibility
      }

      console.log('📈 Processed stats:', processedStats)
      setStats(processedStats)

      // Process recent orders
      let ordersData = []
      if (ordersResponse.status === 'fulfilled') {
        const response = ordersResponse.value
        console.log('📋 Orders API response:', response)
        ordersData = Array.isArray(response?.data) ? response.data :
          Array.isArray(response) ? response : []
        console.log('✅ Orders data received:', ordersData.length, 'orders')
        console.log('📋 Orders data:', ordersData)
      } else {
        console.error('❌ Orders data failed:', ordersResponse.reason)
        // If orders API fails, try to get orders from dashboard data
        if (dashboardData?.recentOrders) {
          ordersData = dashboardData.recentOrders
          console.log('📋 Using orders from dashboard data:', ordersData.length, 'orders')
        }
      }
      console.log('🎯 Final orders data being set:', ordersData)
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : [])

      if (listingsResponse.status === "fulfilled") {
        const listingsData = extractListingsFromResponse(listingsResponse.value)
        setFeaturedProducts(listingsData)
      }

      setLastUpdated(new Date())
      finish(generation)
    } catch (error: unknown) {
      console.error("❌ Dashboard data fetch error:", error)
      finish(generation)
      const message =
        error instanceof Error ? error.message : "Failed to load dashboard data. Please try again."
      toast({
        title: "Error loading dashboard",
        description: message,
        variant: "destructive",
      })
      setStats((prev) =>
        prev ?? {
          totalOrders: 0,
          totalSpent: 0,
          pendingDeliveries: 0,
          activeOrders: 0,
          favoriteProducts: 0,
          monthlySpent: 0,
          favorites: 0,
        }
      )
      setFeaturedProducts((prev) => (prev.length > 0 ? prev : []))
    }
  }, [toast, begin, finish])

  // Smart event-driven refresh system
  const { optimisticUpdate } = useDashboardRefresh({
    onRefresh: fetchDashboardData,
    onOptimisticUpdate: handleOptimisticUpdate
  })

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData]) // Added fetchDashboardData dependency

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      await fetchDashboardData('manual')
      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard data has been updated",
        variant: "default",
      })
    } catch {
      toast({
        title: "Refresh failed",
        description: "Could not refresh dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsManualRefreshing(false)
    }
  }

  const quickActions = [
    {
      title: "Browse Products",
      description: "Explore fresh produce",
      icon: Search,
      href: "/dashboard/products",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Scan QR Code",
      description: "Verify product authenticity",
      icon: QrCode,
      href: "/dashboard/scanner",
      color: "bg-secondary/10 text-secondary border border-secondary/20",
    },
    {
      title: "View Orders",
      description: "Track your purchases",
      icon: Eye,
      href: "/dashboard/orders",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "My Favorites",
      description: "Saved products",
      icon: Heart,
      href: "/dashboard/favorites",
      color: "bg-success/10 text-success",
    },
  ]

  // Convert product data to our component format
  const convertToMarketplaceProduct = (product: BuyerProduct): MarketplaceProduct => {
    return {
      id: String(product._id || product.id),
      name: product.cropName || product.name || "Fresh Produce",
      cropType: product.cropType || product.category || "Agricultural Product",
      variety: product.variety || "Standard",
      description: product.description || "Fresh agricultural product from local farmers",
      price: product.basePrice || product.price || 0,
      unit: product.unit || "kg",
      quantity: product.quantity || 100,
      availableQuantity: product.availableQuantity || product.quantity || 100,
      quality: (product.qualityGrade || product.quality || "good") as MarketplaceProduct["quality"],
      grade: (product.qualityGrade || "B") as MarketplaceProduct["grade"],
      organic: product.organic || false,
      harvestDate: product.createdAt ? new Date(product.createdAt) : new Date(),
      location: product.location || "Unknown Location",
      farmer: {
        id: product.farmer?._id || product.farmerId || "1",
        name: product.farmer?.name || product.farmerName || "Local Farmer",
        avatar: product.farmer?.profile?.avatar || "",
        rating: product.farmer?.rating || product.rating || 4.5,
        verified: product.farmer?.emailVerified || false,
        location: product.farmer?.location || product.location || "Unknown Location"
      },
      images: product.images || ["/placeholder.svg"],
      certifications: product.certifications || [],
      shipping: {
        available: true,
        cost: 500,
        estimatedDays: 3
      },
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || 0,
      qrCode: product.qrCode || `PRODUCT_${product._id || Date.now()}`,
      tags: (product.tags || [product.cropType || product.category, "fresh", "local"]).filter((t): t is string => Boolean(t))
    }
  }

  const handleMarketplaceAction = async (action: string, productId: string) => {
    switch (action) {
      case "addToCart":
        console.log("Adding to cart:", productId)
        try {
          // Find the product details from featured products
          const product = featuredProducts.find(p => (p._id || p.id) === productId)
          if (!product) {
            toast({
              title: "Product not found",
              description: "Could not find product details",
              variant: "destructive",
            })
            return
          }

          // Add to cart using the buyer store
          await addToCart(product, 1)

          toast({
            title: "Added to cart!",
            description: `${product.cropName || product.name} has been added to your cart`,
            variant: "default",
          })
        } catch (error: unknown) {
          console.error("Failed to add to cart:", error)
          toast({
            title: "Failed to add to cart",
            description: getErrorMessage(error, "Please try again"),
            variant: "destructive",
          })
        }
        break
      case "addToWishlist":
        console.log("Adding to wishlist:", productId)
        // MarketplaceCard already shows its own success/error toast for this action.
        optimisticUpdate('favorite_added', { productId })
        break
      case "view":
        window.location.href = `/dashboard/products/${productId}`
        break
      case "contact":
        console.log("Contacting farmer for:", productId)
        break
      case "share":
        console.log("Sharing product:", productId)
        break
    }
  }

  if (isInitialLoading) {
    return (
      <DashboardPageShell>
        <div className={dashboard.statsGrid4}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </DashboardPageShell>
    )
  }

  const buyerName = useAuthStore.getState().user?.name || "Buyer"

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        badge="Buyer Intelligence Active"
        title="Buyer"
        titleHighlight="Dashboard"
        description={
          <>
            Welcome back, {buyerName}. Discover premium agricultural products verified by{" "}
            <span className="font-semibold text-foreground">GroChain</span>.
          </>
        }
        lastUpdated={lastUpdated}
        actions={
          <>
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isManualRefreshing}
              variant="outline"
              size="lg"
              className="group"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 transition-transform duration-500 group-hover:rotate-180 ${isRefreshing || isManualRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing || isManualRefreshing ? "Syncing..." : "Refresh"}
            </Button>
            <Button asChild size="lg">
              <Link href="/dashboard/products">
                <Search className="mr-2 h-5 w-5" />
                Find Products
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats Overview */}
      <div className={dashboard.statsGrid4}>
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          description="All time purchases"
          icon={ShoppingCart}
        />
        <StatsCard
          title="Total Spent"
          value={`₦${(stats?.totalSpent || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Lifetime spending"
          icon={TrendingUp}
        />
        <StatsCard
          title="Favorites"
          value={stats?.favorites || 0}
          description="Saved products"
          icon={Heart}
        />
        <StatsCard
          title="This Month"
          value={`₦${(stats?.monthlySpent || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Monthly spending"
          icon={Package}
        />
      </div>

      {/* Welcome Message for New Users */}
      {stats && stats.totalOrders === 0 && stats.totalSpent === 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Welcome to GroChain!</h3>
          <p className="text-muted-foreground mb-4">
            You haven't made any purchases yet. Start exploring our marketplace to find fresh, local produce from verified farmers.
          </p>
          <Button asChild>
            <Link href="/dashboard/products">Start Shopping</Link>
          </Button>
        </div>
      )}

      <div className={dashboard.contentGrid}>
        {/* Main Content */}
        <div className={dashboard.contentMain}>
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Featured Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className={textStyles.cardTitle}>Featured Products</CardTitle>
                <CardDescription>Fresh, verified produce from local farmers</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/products">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.length > 0 ? (
                  featuredProducts.slice(0, 6).map((product) => (
                    <MarketplaceCard
                      key={product._id}
                      product={convertToMarketplaceProduct(product)}
                      variant="compact"
                      onAddToCart={(id) => handleMarketplaceAction("addToCart", id)}
                      onAddToWishlist={(id) => handleMarketplaceAction("addToWishlist", id)}
                      onView={(id) => handleMarketplaceAction("view", id)}
                      onContact={(id) => handleMarketplaceAction("contact", id)}
                      onShare={(id) => handleMarketplaceAction("share", id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No featured products available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className={textStyles.cardTitle}>Recent Orders</CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order._id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.orderNumber || order._id?.slice(-6) || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            ₦{order.total?.toLocaleString() || order.totalAmount?.toLocaleString() || '0'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "pending" || order.status === "confirmed"
                                ? "secondary"
                                : order.status === "shipped"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {order.status || 'Unknown'}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/orders/${order._id || order.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/products">Start Shopping</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={dashboard.contentSide}>
          <RecentActivity />

          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.cardTitleSm}>QR Code Scanner</CardTitle>
              <CardDescription>Verify product authenticity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="h-32 w-32 mx-auto border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard/scanner">Open Scanner</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Buyer tips */}
          <Card className="relative overflow-hidden border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/10">
            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-20">
              <Brain className="h-20 w-20 text-primary" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className={textStyles.cardTitleSm}>Buyer tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative z-10 space-y-4">
                <div className="rounded-xl border border-border bg-card/80 p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="mb-1 text-xs font-semibold text-foreground">Verify before you pay</p>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Use the QR scanner to confirm batch ID, farmer, and harvest details on the public verify page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/80 p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="mb-1 text-xs font-semibold text-foreground">Check seller trust signals</p>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Review order history and trust badges on shipments — scores reflect platform activity, not a credit guarantee.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/80 p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Heart className="mt-0.5 h-4 w-4 text-destructive" />
                    <div>
                      <p className="mb-1 text-xs font-semibold text-foreground">Save favourites</p>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Bookmark trusted sellers from your orders to reorder quickly from the Favorites page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  )
}
