"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { useCommissionUpdates } from "@/hooks/use-commission-updates"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display, Text } from "@/components/ui/typography"
import { dashboard, textStyles } from "@/lib/design-system"
import { cn } from "@/lib/utils"
import { Users, Shield, TrendingUp, Banknote, FileCheck, BarChart3, RefreshCw, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"

interface PartnerDashboardData {
  totalFarmers: number
  activeFarmers: number
  totalCommission?: number
  monthlyCommission?: number
  commissionRate?: number
  approvalRate?: number
  recentActivity?: any[]
  commissionBreakdown?: {
    pending: number
    paid: number
    total: number
  }
}

interface PartnerFarmersData {
  farmers: any[]
  total: number
}

interface PartnerCommissionData {
  totalEarned: number
  commissionRate: number
  pendingAmount: number
  paidAmount: number
  summary: {
    thisMonth: number
    lastMonth: number
    totalEarned: number
  }
  monthlyBreakdown: any[]
}

interface PartnerMetricsData {
  performanceMetrics: {
    farmersOnboardedThisMonth: number
  }
  approvalRate: number
  commissionRate: number
  totalFarmers: number
}

export function PartnerDashboard() {
  // State for all dashboard data
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null)
  const [farmersData, setFarmersData] = useState<PartnerFarmersData | null>(null)
  const [commissionData, setCommissionData] = useState<PartnerCommissionData | null>(null)
  const [metricsData, setMetricsData] = useState<PartnerMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  // Ref to store fetchDashboardData function
  const fetchDashboardDataRef = useRef<((reason?: string) => Promise<void>) | null>(null);

  // Stable callback for commission updates
  const handleCommissionUpdate = useCallback((update: any) => {
    console.log('💰 Real-time commission update received:', update);

    // Update local state with new commission data
    setDashboardData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalCommission: update.totals.total,
        monthlyCommission: update.totals.thisMonth,
        commissionBreakdown: {
          pending: update.totals.pending,
          paid: update.totals.paid,
          total: update.totals.total
        }
      };
    });

    // Show success toast
    toast({
      title: "New Commission Earned",
      description: `You earned ₦${update.amount.toLocaleString()} from ${update.farmerName}'s sale of ${update.productName}`,
      variant: "default",
    });

    // Refresh dashboard data to get latest information
    setTimeout(() => {
      if (fetchDashboardDataRef.current) {
        fetchDashboardDataRef.current('commission-update');
      }
    }, 1000);
  }, [toast]);

  // Stable callback for commission errors
  const handleCommissionError = useCallback((error: Error) => {
    console.error('❌ Commission update error:', error);
    toast({
      title: "Commission Update Error",
      description: "Failed to receive real-time commission updates",
      variant: "destructive",
    });
  }, [toast]);

  // Real-time commission updates
  const {
    isConnected: isCommissionConnected
  } = useCommissionUpdates({
    onCommissionUpdate: handleCommissionUpdate,
    onError: handleCommissionError
  });

  // Fetch REAL DATABASE DATA ONLY - No fallback/demo data
  const fetchDashboardData = useCallback(async (reason: string = 'manual') => {
    try {
      if (reason === 'manual') {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      // Fetch all data in parallel for better performance
      const [
        dashboardResponse,
        farmersResponse,
        commissionResponse,
        metricsResponse
      ] = await Promise.allSettled([
        apiService.getPartnerDashboard(),
        apiService.getPartnerFarmers({ limit: 5 }),
        apiService.getPartnerCommission(),
        apiService.getPartnerMetrics()
      ])

      // Handle dashboard data - REAL DATABASE DATA ONLY
      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value.data as PartnerDashboardData);
      } else {
        const errorMessage = dashboardResponse.reason?.response?.data?.message ||
          dashboardResponse.reason?.message ||
          'Failed to load dashboard data from database'
        setError(errorMessage)
        setDashboardData(null)
      }

      // Handle farmers data - REAL DATABASE DATA ONLY
      if (farmersResponse.status === 'fulfilled') {
        console.log('✅ Farmers data loaded from database');
        setFarmersData(farmersResponse.value.data as PartnerFarmersData)
      } else {
        console.error('❌ Farmers fetch failed:', farmersResponse.reason?.message || farmersResponse.reason)
        setFarmersData(null)
      }

      // Handle commission data - REAL DATABASE DATA ONLY with enhanced error handling
      if (commissionResponse.status === 'fulfilled') {
        const commissionDataValue = commissionResponse.value?.data;
        console.log('✅ Commission data received:', commissionDataValue);

        if (commissionDataValue && typeof commissionDataValue === 'object') {
          // Ensure all needed fields exist
          setCommissionData({
            totalEarned: commissionDataValue.totalEarned || 0,
            commissionRate: commissionDataValue.commissionRate || 0.02,
            pendingAmount: commissionDataValue.pendingAmount || 0,
            paidAmount: commissionDataValue.paidAmount || 0,
            summary: {
              thisMonth: commissionDataValue.summary?.thisMonth || 0,
              lastMonth: commissionDataValue.summary?.lastMonth || 0,
              totalEarned: commissionDataValue.summary?.totalEarned || 0
            },
            monthlyBreakdown: commissionDataValue.monthlyBreakdown || []
          });
        } else {
          console.warn('⚠️ Commission data is invalid or empty. Using default values.');
          setCommissionData({
            totalEarned: 0,
            commissionRate: 0.02,
            pendingAmount: 0,
            paidAmount: 0,
            summary: {
              thisMonth: 0,
              lastMonth: 0,
              totalEarned: 0
            },
            monthlyBreakdown: []
          });
        }
      } else {
        console.error('❌ Commission data fetch failed:', commissionResponse.reason);
        // Set default values for commission data
        setCommissionData({
          totalEarned: 0,
          commissionRate: 0.02,
          pendingAmount: 0,
          paidAmount: 0,
          summary: {
            thisMonth: 0,
            lastMonth: 0,
            totalEarned: 0
          },
          monthlyBreakdown: []
        });

        // Display a non-blocking toast notification
        toast({
          title: "Commission data not available",
          description: "Using default values. Please try refreshing later.",
          variant: "default",
        });
      }

      // Handle metrics data - REAL DATABASE DATA ONLY
      if (metricsResponse.status === 'fulfilled') {
        console.log('✅ Metrics data loaded from database:', metricsResponse.value.data);
        console.log('📊 Performance Metrics:', {
          farmersOnboarded: metricsResponse.value.data?.performanceMetrics?.farmersOnboardedThisMonth,
          approvalRate: metricsResponse.value.data?.approvalRate,
          commissionRate: metricsResponse.value.data?.commissionRate
        });
        setMetricsData(metricsResponse.value.data as PartnerMetricsData)
      } else {
        console.error('❌ Metrics fetch failed:', metricsResponse.reason?.message || metricsResponse.reason)
        setMetricsData(null)
      }

      // Show success message on manual refresh
      if (reason === 'manual') {
        toast({
          title: "Dashboard Updated",
          description: "Real data has been refreshed from the database.",
        })
      }

      setLastUpdated(new Date())

    } catch (error: any) {
      console.error('Dashboard fetch error:', error)
      setError(error.message || 'Failed to load dashboard data')

      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  // Store fetchDashboardData in ref for use in callbacks
  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  // Smart event-driven refresh system
  useDashboardRefresh({
    onRefresh: fetchDashboardData
  })

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData('manual')
  }

  const quickActions = [
    // {
    //   title: "Onboard Farmers",
    //   description: "Add new farmers to platform",
    //   icon: UserPlus,
    //   href: "/dashboard/farmers/add",
    //   color: "bg-primary/10 text-primary",
    // },
    // {
    //   title: "Bulk Upload",
    //   description: "CSV farmer onboarding",
    //   icon: Upload,
    //   href: "/dashboard/farmers/bulk",
    //   color: "bg-secondary/10 text-secondary",
    // },
    {
      title: "Pending Approvals",
      description: "Review harvest submissions",
      icon: FileCheck,
      href: "/dashboard/approvals",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "View Analytics",
      description: "Performance insights",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "bg-success/10 text-success",
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardPageShell>
        <div className={dashboard.statsGrid4}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={dashboard.contentGrid}>
          <div className={dashboard.contentMain}>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className={dashboard.contentSide}>
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageShell>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardPageShell>
        <div className="flex items-center justify-between">
          <div>
            <Display as="h1">Partner Dashboard</Display>
            <Text variant="sm">Manage your farmer network and track performance</Text>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Retry'}
          </Button>
        </div>

        <Card className="border-destructive/10 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Failed to Load Dashboard</h3>
                <p className="text-destructive mt-1">{error}</p>
                <Button
                  onClick={handleRefresh}
                  className="mt-4"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardPageShell>
    )
  }

  // Show error state if database connection fails
  if (error && !dashboardData && !farmersData && !commissionData && !metricsData) {
    return (
      <DashboardPageShell>
        <div className="flex items-center justify-between">
          <div>
            <Display as="h1">Partner Dashboard</Display>
            <Text variant="sm">Manage your farmer network and track performance</Text>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Retry'}
          </Button>
        </div>

        <Card className="border-destructive/10 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Database Connection Error</h3>
                <p className="text-destructive mt-1">{error}</p>
                <p className="text-destructive text-sm mt-2">
                  Please check your internet connection and try again.
                </p>
                <Button
                  onClick={handleRefresh}
                  className="mt-4"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        badge="Partner Network Active"
        title="Partner"
        titleHighlight="Dashboard"
        description={
          <>
            Manage your farmer network and track performance.
            {isCommissionConnected && (
              <span className="mt-2 block text-xs font-semibold text-success">
                Live commission updates connected
              </span>
            )}
            {error && (
              <span className="mt-2 flex items-center gap-1 text-xs text-warning">
                <AlertCircle className="h-3 w-3 shrink-0" />
                Some data may be unavailable — {error}
              </span>
            )}
          </>
        }
        lastUpdated={lastUpdated}
        actions={
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="lg" className="group">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className={dashboard.statsGrid4}>
        <StatsCard
          title="Total Farmers"
          value={dashboardData?.totalFarmers || 0}
          description="Under your partnership"
          icon={Users}
        />
        <StatsCard
          title="Active Farmers"
          value={dashboardData?.activeFarmers || 0}
          description="Currently active"
          icon={Users}
        />
        <StatsCard
          title="Commission Earned"
          value={`₦${(dashboardData?.totalCommission || commissionData?.summary?.thisMonth || dashboardData?.monthlyCommission || dashboardData?.commissionBreakdown?.total || 0).toLocaleString()}`}
          description="This month"
          icon={Banknote}
        />
        <StatsCard
          title="Commission Rate"
          value={`${((commissionData?.commissionRate || dashboardData?.commissionRate || 0) * 100).toFixed(1)}%`}
          description="Your earning rate"
          icon={TrendingUp}
        />
      </div>

      <div className={dashboard.contentGrid}>
        {/* Main Content */}
        <div className={dashboard.contentMain}>
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Pending Approvals - Using real data */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <CardTitle className={cn(textStyles.cardTitle, "truncate")}>Pending Approvals</CardTitle>
                <CardDescription className="truncate">Harvest submissions awaiting your review</CardDescription>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto flex-shrink-0">
                <Link href="/dashboard/approvals">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.slice(0, 3).map((activity: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{activity.description || 'Pending Approval'}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {activity.farmer || 'Farmer'} • {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Farmers - Using real data */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <CardTitle className={cn(textStyles.cardTitle, "truncate")}>Recently Onboarded Farmers</CardTitle>
                <CardDescription className="truncate">New farmers in your network</CardDescription>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto flex-shrink-0">
                <Link href="/partners">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {farmersData?.farmers && farmersData.farmers.length > 0 ? (
                  farmersData.farmers.slice(0, 3).map((farmer: any) => (
                    <div key={farmer.id || farmer._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{farmer.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {farmer.location} • Joined {farmer.joinedAt ? new Date(farmer.joinedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {farmer.status || 'active'}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:p-2">
                          <Link href={`/dashboard/farmers/${farmer.id || farmer._id}`}>
                            <span className="hidden sm:inline">View</span>
                            <Eye className="h-4 w-4 sm:hidden" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {farmersData === null ? 'Unable to load farmer data' : 'No recent farmers'}
                    </p>
                    {farmersData !== null && (
                      <Button asChild size="sm" className="mt-4 w-full sm:w-auto">
                        <Link href="/partners">Onboard Farmers</Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics - Using real data */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className={textStyles.cardTitleSm}>Performance Metrics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your partnership performance this month</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {metricsData ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-muted-foreground">Farmers Onboarded</span>
                      <span className="font-medium">
                        {metricsData?.performanceMetrics?.farmersOnboardedThisMonth ??
                          dashboardData?.totalFarmers ?? 0}
                      </span>
                    </div>
                    <Progress
                      value={(() => {
                        const onboarded = metricsData?.performanceMetrics?.farmersOnboardedThisMonth ?? dashboardData?.totalFarmers ?? 0;
                        const total = metricsData?.totalFarmers ?? dashboardData?.totalFarmers ?? 1;
                        return total > 0 ? (onboarded / total) * 100 : 0;
                      })()}
                      className="h-1.5 sm:h-2"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-muted-foreground">Approval Rate</span>
                      <span className="font-medium">
                        {(() => {
                          const rate = metricsData?.approvalRate ?? dashboardData?.approvalRate ?? 0;
                          return `${rate.toFixed(1)}%`;
                        })()}
                      </span>
                    </div>
                    <Progress
                      value={metricsData?.approvalRate ?? dashboardData?.approvalRate ?? 0}
                      className="h-1.5 sm:h-2"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-muted-foreground">Commission Rate</span>
                      <span className="font-medium">
                        {(() => {
                          const rate = commissionData?.commissionRate || dashboardData?.commissionRate || metricsData?.commissionRate;
                          return rate ? `${(rate * 100).toFixed(1)}%` : '0%';
                        })()}
                      </span>
                    </div>
                    <Progress value={(metricsData?.commissionRate || 0) * 100} className="h-1.5 sm:h-2" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <div className="h-8 w-8 sm:h-12 sm:w-12 bg-muted rounded animate-pulse mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-muted-foreground text-xs sm:text-sm">Loading performance metrics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={dashboard.contentSide}>
          <RecentActivity />

          {/* Commission Summary - REAL DATABASE DATA ONLY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn(textStyles.cardTitle, "truncate")}>Commission Summary</CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">Your earnings breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {(commissionData || dashboardData) ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">This Month</span>
                    <span className="font-medium text-sm sm:text-base">₦{((dashboardData?.totalCommission || commissionData?.summary?.thisMonth || dashboardData?.monthlyCommission || dashboardData?.commissionBreakdown?.total || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Last Month</span>
                    <span className="font-medium text-sm sm:text-base">₦{(commissionData?.summary?.lastMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Earned</span>
                    <span className="font-medium text-sm sm:text-base">₦{((dashboardData?.totalCommission || commissionData?.totalEarned || dashboardData?.commissionBreakdown?.total || 0)).toLocaleString()}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link href="/dashboard/commissions">View Details</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Banknote className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Unable to load commission data</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats - REAL DATABASE DATA ONLY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn(textStyles.cardTitle, "truncate")}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData || commissionData ? (
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Farmers</span>
                    <span className="font-medium">{dashboardData?.activeFarmers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Farmers</span>
                    <span className="font-medium">{dashboardData?.totalFarmers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Commission Rate</span>
                    <span className="font-medium">{((commissionData?.commissionRate || dashboardData?.commissionRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium text-xs sm:text-sm">₦{((commissionData?.summary?.thisMonth || dashboardData?.monthlyCommission) || 0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Unable to load statistics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  )
}
