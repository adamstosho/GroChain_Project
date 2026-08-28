"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { HarvestCard, type HarvestData } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { Leaf, Package, TrendingUp, Banknote, Plus, Eye, BarChart3, RefreshCw, Store } from "lucide-react"
import Link from "next/link"
import { AiTrustBadge } from "@/components/ai/ai-trust-badge"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Text } from "@/components/ui/typography"
import { dashboard, textStyles } from "@/lib/design-system"
import { useAuthStore } from "@/lib/auth"

// Helper function to determine credit score status
const getCreditScoreStatus = (score: number): string => {
  if (score >= 740) return "Excellent standing"
  if (score >= 670) return "Good standing"
  if (score >= 580) return "Fair standing"
  if (score >= 300) return "Poor standing"
  return "Very poor standing"
}

interface FarmerStats {
  totalHarvests: number
  pendingApprovals: number
  activeListings: number
  monthlyRevenue: number
  totalRevenue: number
  totalOrders: number
}

interface CreditScoreData {
  score: number | "N/A"
  status: string
  factors?: {
    paymentHistory?: number
    harvestConsistency?: number
    businessStability?: number
    marketReputation?: number
    consistency?: number
    stability?: number
    reputation?: number
  }
}

export function FarmerDashboard() {
  const [stats, setStats] = useState<FarmerStats | null>(null)
  const [recentHarvests, setRecentHarvests] = useState<any[]>([])
  const { isInitialLoading, isRefreshing, begin, finish } = useStableDataFetch()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()
  const [credit, setCredit] = useState<CreditScoreData | null>(null)

  const fetchDashboardData = useCallback(async (reason: string = 'manual') => {
    const generation = begin()
    try {
      console.log(`🔄 Fetching farmer dashboard data (${reason})...`)

      const [dashboardResponse, harvestsResponse, creditResp, farmerAnalytics] = await Promise.allSettled([
        apiService.getDashboard(),
        apiService.getHarvests({ limit: 5 }),
        apiService.getMyCreditScore().catch(() => ({
          data: { score: "N/A", status: "Calculating..." }
        })),
        apiService.getFarmerAnalytics().catch(() => ({ data: {} }))
      ])

      const dashboardData =
        dashboardResponse.status === "fulfilled"
          ? (dashboardResponse.value.data as unknown as Record<string, unknown>)
          : null
      const analyticsData =
        farmerAnalytics.status === "fulfilled" && farmerAnalytics.value.data
          ? (farmerAnalytics.value.data as Record<string, unknown>)
          : null

      const monthlyFromAnalytics =
        Array.isArray(analyticsData?.monthlyTrends) && analyticsData.monthlyTrends.length > 0
          ? (analyticsData.monthlyTrends as { revenue?: number }[])[analyticsData.monthlyTrends.length - 1]
              ?.revenue || 0
          : 0

      const activeListingsCount =
        Number(dashboardData?.activeListings) ||
        Number(analyticsData?.totalListings) ||
        0

      setStats({
        totalHarvests: Number(dashboardData?.totalHarvests) || 0,
        pendingApprovals: Number(dashboardData?.pendingApprovals) || 0,
        activeListings: activeListingsCount,
        monthlyRevenue: Number(dashboardData?.monthlyRevenue) || monthlyFromAnalytics || 0,
        totalRevenue: Number(dashboardData?.totalRevenue) || Number(analyticsData?.totalRevenue) || 0,
        totalOrders: Number(dashboardData?.totalOrders) || Number(analyticsData?.totalOrders) || 0,
      })

      if (harvestsResponse.status === "fulfilled") {
        const harvestData =
          (harvestsResponse.value as { harvests?: unknown[] }).harvests ||
          (harvestsResponse.value as { data?: unknown[] }).data ||
          []
        setRecentHarvests(Array.isArray(harvestData) ? harvestData : [])
      }

      if (creditResp.status === "fulfilled") {
        setCredit(creditResp.value.data as CreditScoreData)
      }

      setLastUpdated(new Date())
      finish(generation)
    } catch (error: unknown) {
      console.error("❌ Dashboard fetch error:", error)
      finish(generation)
      const message = error instanceof Error ? error.message : "Failed to load dashboard data. Please try again."
      toast({
        title: "Error loading dashboard",
        description: message,
        variant: "destructive",
      })
      setStats((prev) =>
        prev ?? {
          totalHarvests: 0,
          pendingApprovals: 0,
          activeListings: 0,
          monthlyRevenue: 0,
          totalRevenue: 0,
          totalOrders: 0,
        }
      )
    }
  }, [toast, begin, finish])

  // Smart event-driven refresh system
  useDashboardRefresh({
    onRefresh: fetchDashboardData
  })

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

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
      title: "Add New Harvest",
      description: "Record a new harvest batch",
      icon: Plus,
      href: "/dashboard/harvests/new",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Browse Marketplace",
      description: "Explore products from other farmers",
      icon: Store,
      href: "/marketplace",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Check Analytics",
      description: "View your performance",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "View Listings",
      description: "Manage your listings",
      icon: Eye,
      href: "/dashboard/marketplace",
      color: "bg-success/10 text-success",
    },
  ]

  // Convert harvest data to our component format
  const convertToHarvestData = (harvest: any): HarvestData => {
    // Handle different date formats from backend
    let harvestDate: Date
    try {
      if (harvest.harvestDate) {
        harvestDate = new Date(harvest.harvestDate)
      } else if (harvest.date) {
        harvestDate = new Date(harvest.date)
      } else if (harvest.createdAt) {
        harvestDate = new Date(harvest.createdAt)
      } else {
        harvestDate = new Date()
      }
    } catch {
      harvestDate = new Date()
    }

    return {
      id: String(harvest._id || harvest.id),
      farmerName: harvest.farmerName || harvest.farmer?.name || "You",
      cropType: harvest.cropType || "Unknown Crop",
      variety: harvest.variety || "Standard",
      harvestDate,
      quantity: harvest.quantity || 0,
      unit: harvest.unit || "kg",
      location: harvest.location || "Unknown Location",
      quality: harvest.quality || "good",
      status: harvest.status || "pending",
      qrCode: harvest.batchId || harvest.qrCode || `HARVEST_${harvest._id || harvest.id}`,
      price: harvest.price || 0,
      organic: harvest.organic || false,
      moistureContent: harvest.moistureContent || 15,
      grade: harvest.grade || harvest.qualityGrade || "B"
    }
  }

  const handleHarvestAction = (action: string, harvestId: string) => {
    switch (action) {
      case "view":
        window.location.href = `/dashboard/harvests/${harvestId}`
        break
      case "edit":
        window.location.href = `/dashboard/harvests/${harvestId}/edit`
        break
      case "approve":
        console.log("Approving harvest:", harvestId)
        break
      case "reject":
        console.log("Rejecting harvest:", harvestId)
        break
    }
  }

  if (isInitialLoading) {
    return (
      <DashboardPageShell>
        <div className={dashboard.statsGrid}>
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse h-full">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                <div className="h-6 sm:h-8 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </DashboardPageShell>
    )
  }

  const farmerName = useAuthStore.getState().user?.name || "Farmer"
  const farmerUserId = useAuthStore.getState().user?._id

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        badge="Farmer Intelligence Active"
        title="Farmer"
        titleHighlight="Dashboard"
        description={
          <>
            Welcome back, {farmerName}. Your farm overview is performing{" "}
            <span className="font-semibold text-foreground">
              {stats?.totalRevenue ? "above baseline" : "optimally"}
            </span>{" "}
            today.
          </>
        }
        lastUpdated={lastUpdated}
        footer={farmerUserId ? <AiTrustBadge userId={farmerUserId} /> : null}
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
              <Link href="/dashboard/harvests/new">
                <Plus className="mr-2 h-5 w-5" />
                New Harvest
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats Overview */}
      <div className={dashboard.statsGrid}>
        <StatsCard
          title="Total Harvests"
          value={stats?.totalHarvests || 0}
          description="All time harvests"
          icon={Leaf}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          description="Awaiting verification"
          icon={Package}
        />
        <StatsCard
          title="Active Listings"
          value={stats?.activeListings || 0}
          description="In marketplace"
          icon={TrendingUp}
        />
        <StatsCard
          title="Revenue This Month"
          value={stats?.monthlyRevenue ? `₦${stats.monthlyRevenue.toLocaleString()}` : "₦0"}
          description="From sales"
          icon={Banknote}
        />
        <StatsCard
          title="Total Revenue"
          value={stats?.totalRevenue ? `₦${stats.totalRevenue.toLocaleString()}` : "₦0"}
          description="All time earnings"
          icon={Banknote}
        />
      </div>

      <div className={dashboard.contentGrid}>
        <div className={dashboard.contentMain}>
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Recent Harvests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className={textStyles.cardTitle}>Recent Harvests</CardTitle>
                <CardDescription>Your latest harvest records</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/harvests">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentHarvests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {recentHarvests.slice(0, 4).map((harvest) => (
                      <HarvestCard
                        key={harvest._id}
                        harvest={convertToHarvestData(harvest)}
                        variant="compact"
                        onView={(id) => handleHarvestAction("view", id)}
                        onEdit={(id) => handleHarvestAction("edit", id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Leaf className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">No harvests recorded yet</p>
                    <Button asChild className="mt-3 sm:mt-4 w-full sm:w-auto">
                      <Link href="/dashboard/harvests/new">Add Your First Harvest</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.cardTitleSm}>Performance Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your farming metrics and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Harvest Quality */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">Harvest Quality</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {(stats?.totalHarvests || 0) > 0 ? '85%' : 'N/A'}
                    </span>
                  </div>
                  {(stats?.totalHarvests || 0) > 0 && (
                    <Progress value={85} className="h-1.5 sm:h-2" />
                  )}
                </div>

                {/* Market Success */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">Market Success</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {(stats?.activeListings || 0) > 0 ? '72%' : 'N/A'}
                    </span>
                  </div>
                  {(stats?.activeListings || 0) > 0 && (
                    <Progress value={72} className="h-1.5 sm:h-2" />
                  )}
                </div>

                {/* Revenue Growth */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">Revenue Growth</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {(stats?.monthlyRevenue || 0) > 0 ? '+15%' : 'N/A'}
                    </span>
                  </div>
                  {(stats?.monthlyRevenue || 0) > 0 && (
                    <Progress value={65} className="h-1.5 sm:h-2" />
                  )}
                </div>

                {/* Activity Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">Activity Level</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {(stats?.totalHarvests || 0) > 0 ? 'Active' : 'Getting Started'}
                    </span>
                  </div>
                  <Progress
                    value={(stats?.totalHarvests || 0) > 0 ? 80 : 20}
                    className="h-1.5 sm:h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={dashboard.contentSide}>
          {/* Weather Widget */}
          <WeatherWidget />

          {/* Recent Activity */}
          <RecentActivity />

          {/* Credit Score */}
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.cardTitleSm}>Credit Score</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your financial standing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {credit && credit.score !== "N/A" ? (
                  <>
                    <Text as="div" variant="stat" className="mb-2 text-primary">
                      {credit.score || "N/A"}
                    </Text>
                    <Text variant="sm">
                      {getCreditScoreStatus(credit.score)}
                    </Text>
                    {credit.factors && (
                      <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="truncate pr-2 min-w-0 flex-1">Payment History</span>
                          <span className="flex-shrink-0">{credit.factors.paymentHistory || credit.factors.paymentHistory || 0}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="truncate pr-2 min-w-0 flex-1">Harvest Consistency</span>
                          <span className="flex-shrink-0">{credit.factors.harvestConsistency || credit.factors.consistency || 0}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="truncate pr-2 min-w-0 flex-1">Business Stability</span>
                          <span className="flex-shrink-0">{credit.factors.businessStability || credit.factors.stability || 0}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="truncate pr-2 min-w-0 flex-1">Market Reputation</span>
                          <span className="flex-shrink-0">{credit.factors.marketReputation || credit.factors.reputation || 0}%</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Text as="div" variant="stat" className="mb-2 text-muted-foreground">
                      N/A
                    </Text>
                    <Text variant="sm">Calculating your credit score...</Text>
                  </>
                )}
                <Button variant="outline" size="sm" className="mt-3 sm:mt-4 w-full text-xs sm:text-sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  )
}
