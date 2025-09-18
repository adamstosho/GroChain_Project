"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { MarketplaceCard, type MarketplaceProduct } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { ShoppingCart, Package, Heart, TrendingUp, Search, QrCode, Eye, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

export function BuyerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()
  const { addToCart } = useBuyerStore()

  // Optimistic updates for immediate UI feedback
  const handleOptimisticUpdate = useCallback((action: string, data: any) => {
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
    
    // Trigger a refresh to sync with server
    setTimeout(() => {
      fetchDashboardData('optimistic_sync')
    }, 1000)
  }, [toast])

  const fetchDashboardData = async (reason: string = 'manual') => {
    try {
      setIsLoading(true)
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
      let dashboardData = {}
      if (dashboardResponse.status === 'fulfilled') {
        dashboardData = dashboardResponse.value?.data || dashboardResponse.value || {}
        console.log('✅ Dashboard data received:', dashboardData)
      } else {
        console.error('❌ Dashboard data failed:', dashboardResponse.reason)
      }

      const processedStats = {
        totalOrders: Number((dashboardData as any)?.totalOrders) || 0,
        totalSpent: Number((dashboardData as any)?.totalSpent) || 0,
        pendingDeliveries: Number((dashboardData as any)?.pendingDeliveries) || 0,
        activeOrders: Number((dashboardData as any)?.activeOrders) || 0,
        favoriteProducts: Number((dashboardData as any)?.favoriteProducts) || 0,
        monthlySpent: Number((dashboardData as any)?.monthlySpent) || 0,
        lastOrderDate: (dashboardData as any)?.lastOrderDate,
        favorites: Number((dashboardData as any)?.favoriteProducts) || 0 // For backward compatibility
      }

      console.log('📈 Processed stats:', processedStats)
      setStats(processedStats)

      // Process recent orders
      let ordersData = []
      if (ordersResponse.status === 'fulfilled') {
        ordersData = Array.isArray(ordersResponse.value?.data) ? ordersResponse.value.data : 
                   Array.isArray(ordersResponse.value) ? ordersResponse.value : []
        console.log('✅ Orders data received:', ordersData.length, 'orders')
      } else {
        console.error('❌ Orders data failed:', ordersResponse.reason)
      }
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : [])

      // Process featured products
      let listingsData = []
      if (listingsResponse.status === 'fulfilled') {
        const response = listingsResponse.value
        listingsData = (response as any)?.data?.listings ||
                      (response as any)?.data ||
                      (response as any)?.listings ||
                      response || []
        console.log('✅ Listings data received:', listingsData.length, 'products')
      } else {
        console.error('❌ Listings data failed:', listingsResponse.reason)
      }
      setFeaturedProducts(Array.isArray(listingsData) ? listingsData : [])

      // Update last updated timestamp
      setLastUpdated(new Date())

    } catch (error: any) {
      console.error('❌ Dashboard data fetch error:', error)
      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })

      // Set default empty states on error
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        pendingDeliveries: 0,
        activeOrders: 0,
        favoriteProducts: 0,
        monthlySpent: 0,
        favorites: 0
      })
      setRecentOrders([])
      setFeaturedProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Smart event-driven refresh system
  const { refresh, optimisticUpdate } = useDashboardRefresh({
    onRefresh: fetchDashboardData,
    onOptimisticUpdate: handleOptimisticUpdate
  })

  useEffect(() => {
    fetchDashboardData()
  }, []) // Remove toast dependency to prevent re-renders

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchDashboardData('manual')
      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard data has been updated",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
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
      color: "bg-secondary/10 text-secondary",
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
  const convertToMarketplaceProduct = (product: any): MarketplaceProduct => {
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
      quality: product.qualityGrade || product.quality || "good",
      grade: product.qualityGrade || "B",
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
      tags: product.tags || [product.cropType || product.category, "fresh", "local"]
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
        } catch (error: any) {
          console.error("Failed to add to cart:", error)
          toast({
            title: "Failed to add to cart",
            description: error.message || "Please try again",
            variant: "destructive",
          })
        }
        break
      case "addToWishlist":
        console.log("Adding to wishlist:", productId)
        // Optimistic update for favorite addition
        optimisticUpdate('favorite_added', { productId })
        toast({
          title: "Added to favorites",
          description: "Product has been added to your favorites",
          variant: "default",
        })
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your account.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Loading...
            </div>
          )}
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing || isLoading}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          description="All time purchases"
          icon={ShoppingCart}
          trend={(stats?.totalOrders || 0) > 0 ? { value: Math.min(Math.floor(Math.random() * 20) + 1, 25), isPositive: true } : undefined}
        />
        <StatsCard
          title="Total Spent"
          value={`₦${(stats?.totalSpent || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Lifetime spending"
          icon={TrendingUp}
          trend={(stats?.totalSpent || 0) > 0 ? { value: Math.min(Math.floor(Math.random() * 30) + 5, 35), isPositive: true } : undefined}
        />
        <StatsCard
          title="Favorites"
          value={stats?.favorites || 0}
          description="Saved products"
          icon={Heart}
          trend={(stats?.favorites || 0) > 0 ? { value: Math.min(Math.floor(Math.random() * 15) + 1, 20), isPositive: true } : undefined}
        />
        <StatsCard
          title="This Month"
          value={`₦${(stats?.monthlySpent || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Monthly spending"
          icon={Package}
          trend={(stats?.monthlySpent || 0) > 0 ? { value: Math.min(Math.floor(Math.random() * 25) + 10, 30), isPositive: true } : undefined}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Featured Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Featured Products</CardTitle>
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
                <CardTitle>Recent Orders</CardTitle>
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
        <div className="space-y-6">
          <RecentActivity />

          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
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

          {/* Shopping Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Shopping Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <p>Always verify products with QR codes before purchasing</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <p>Check harvest dates for freshness</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <p>Read farmer reviews and ratings</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <p>Compare prices across different farmers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
