"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { dashboard, textStyles } from "@/lib/design-system"
import { cn } from "@/lib/utils"
import { Users, TrendingUp, Banknote, Database, UserCheck, Settings, BarChart3, FileText, RefreshCw } from "lucide-react"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  totalRevenue: number
  activeTransactions: number
  totalHarvests: number
  pendingApprovals: number
  activeListings: number
  monthlyRevenue: number
  userDistribution: Record<string, number>
  approvalRate: number
  commissionStats?: {
    totalCommissions: number
    pendingCommissions: number
    paidCommissions: number
    totalCommissionAmount: number
    pendingCommissionAmount: number
    paidCommissionAmount: number
    commissionRate: number
  }
}

interface SystemHealth {
  uptime: string
  // Real request-timing/error-rate metrics require an APM/metrics
  // collector this app doesn't have yet — left undefined rather than a
  // fabricated number, and rendered as "—" until that's built.
  responseTime?: string
  activeUsers: number
  errorRate?: string
  status?: string
  memory?: Record<string, unknown>
  timestamp?: string
}

interface RecentAdminUser {
  _id: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  createdAt?: string
  role?: string
  status?: string
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentAdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  const fetchDashboardData = useCallback(async (reason: string = 'manual') => {
    try {
      setIsLoading(true)
      console.log(`🔄 Fetching admin dashboard data (${reason})...`)

      // Use Promise.allSettled for better error handling
      const [dashboardResponse, systemHealthResponse, recentUsersResponse] = await Promise.allSettled([
        apiService.getAdminDashboard(),
        apiService.getAdminSystemHealth(),
        apiService.getAdminRecentUsers(5)
      ])

      // Process dashboard data
      if (dashboardResponse.status === 'fulfilled') {
        const dashboardData = asRecord(dashboardResponse.value.data)
        const commission = asRecord(dashboardData.commissionStats)
        const distribution = asRecord(dashboardData.userDistribution)
        const userDistribution: Record<string, number> = {}
        for (const [key, value] of Object.entries(distribution)) {
          if (typeof value === "number") userDistribution[key] = value
        }
        setStats({
          totalUsers: typeof dashboardData.totalUsers === "number" ? dashboardData.totalUsers : 0,
          totalRevenue: typeof dashboardData.totalRevenue === "number" ? dashboardData.totalRevenue : 0,
          activeTransactions: typeof dashboardData.activeTransactions === "number" ? dashboardData.activeTransactions : 0,
          totalHarvests: typeof dashboardData.totalHarvests === "number" ? dashboardData.totalHarvests : 0,
          pendingApprovals: typeof dashboardData.pendingApprovals === "number" ? dashboardData.pendingApprovals : 0,
          activeListings: typeof dashboardData.totalListings === "number" ? dashboardData.totalListings : 0,
          monthlyRevenue: typeof dashboardData.monthlyRevenue === "number" ? dashboardData.monthlyRevenue : 0,
          userDistribution,
          approvalRate: typeof dashboardData.approvalRate === "number" ? dashboardData.approvalRate : 0,
          commissionStats: dashboardData.commissionStats ? {
            totalCommissions: typeof commission.totalCommissions === "number" ? commission.totalCommissions : 0,
            pendingCommissions: typeof commission.pendingCommissions === "number" ? commission.pendingCommissions : 0,
            paidCommissions: typeof commission.paidCommissions === "number" ? commission.paidCommissions : 0,
            totalCommissionAmount: typeof commission.totalCommissionAmount === "number" ? commission.totalCommissionAmount : 0,
            pendingCommissionAmount: typeof commission.pendingCommissionAmount === "number" ? commission.pendingCommissionAmount : 0,
            paidCommissionAmount: typeof commission.paidCommissionAmount === "number" ? commission.paidCommissionAmount : 0,
            commissionRate: typeof commission.commissionRate === "number" ? commission.commissionRate : 0,
          } : {
            totalCommissions: 0,
            pendingCommissions: 0,
            paidCommissions: 0,
            totalCommissionAmount: 0,
            pendingCommissionAmount: 0,
            paidCommissionAmount: 0,
            commissionRate: 0
          },
        })
      } else {
        console.error('❌ Dashboard data failed:', dashboardResponse.reason)
        // Set fallback data
        setStats({
          totalUsers: 0,
          totalRevenue: 0,
          activeTransactions: 0,
          totalHarvests: 0,
          pendingApprovals: 0,
          activeListings: 0,
          monthlyRevenue: 0,
          userDistribution: {},
          approvalRate: 0,
          commissionStats: {
            totalCommissions: 0,
            pendingCommissions: 0,
            paidCommissions: 0,
            totalCommissionAmount: 0,
            pendingCommissionAmount: 0,
            paidCommissionAmount: 0,
            commissionRate: 0
          }
        })
      }

      // Process system health data — only real fields from the health-check
      // response are used; responseTime/errorRate aren't computed anywhere
      // on the backend, so they're left unset rather than faked.
      if (systemHealthResponse.status === 'fulfilled') {
        const healthData = asRecord(systemHealthResponse.value.data)
        const uptime = typeof healthData.uptime === "number" ? healthData.uptime : Number(healthData.uptime)
        setSystemHealth({
          uptime: `${(uptime / 3600).toFixed(1)}h`,
          activeUsers: stats?.totalUsers || 0,
          status: typeof healthData.status === "string" ? healthData.status : undefined,
          memory: healthData.memory && typeof healthData.memory === "object" ? asRecord(healthData.memory) : undefined,
          timestamp: typeof healthData.timestamp === "string" ? healthData.timestamp : undefined
        })
      } else {
        console.error('❌ System health failed:', systemHealthResponse.reason)
        setSystemHealth(null)
      }

      // Process recent users data
      if (recentUsersResponse.status === 'fulfilled') {
        const usersData = asRecord(recentUsersResponse.value.data)
        const usersRaw = Array.isArray(usersData.users) ? usersData.users : []
        setRecentUsers(usersRaw.map((user) => {
          const rec = asRecord(user)
          return {
            _id: typeof rec._id === "string" ? rec._id : String(rec.id ?? ""),
            name: typeof rec.name === "string" ? rec.name : undefined,
            firstName: typeof rec.firstName === "string" ? rec.firstName : undefined,
            lastName: typeof rec.lastName === "string" ? rec.lastName : undefined,
            email: typeof rec.email === "string" ? rec.email : undefined,
            createdAt: typeof rec.createdAt === "string" ? rec.createdAt : undefined,
            role: typeof rec.role === "string" ? rec.role : undefined,
            status: typeof rec.status === "string" ? rec.status : undefined,
          }
        }))
      } else {
        console.error('❌ Recent users failed:', recentUsersResponse.reason)
        setRecentUsers([])
      }

      setLastUpdated(new Date())

    } catch (error) {
      console.error('❌ Dashboard error:', error)
      toast({
        title: "Error loading dashboard",
        description: getErrorMessage(error),
        variant: "destructive",
      })
      // Set fallback data
      setStats({
        totalUsers: 0,
        totalRevenue: 0,
        activeTransactions: 0,
        totalHarvests: 0,
        pendingApprovals: 0,
        activeListings: 0,
        monthlyRevenue: 0,
        userDistribution: {},
        approvalRate: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, stats?.totalUsers])

  // Smart event-driven refresh system
  useDashboardRefresh({
    onRefresh: fetchDashboardData
  })

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchDashboardData('manual')
      toast({
        title: "Dashboard refreshed",
        description: "Admin dashboard data has been updated",
        variant: "default",
      })
    } catch {
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
      title: "User Management",
      description: "Manage platform users",
      icon: UserCheck,
      href: "/dashboard/users",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "System Settings",
      description: "Configure platform",
      icon: Settings,
      href: "/dashboard/system",
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Analytics",
      description: "Platform insights",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Generate Reports",
      description: "Export data reports",
      icon: FileText,
      href: "/dashboard/reports",
      color: "bg-success/10 text-success",
    },
  ]

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
            </Card>
          ))}
        </div>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        badge="Platform Control"
        title="Admin"
        titleHighlight="Dashboard"
        description="Manage platform users and monitor system performance."
        lastUpdated={lastUpdated}
        actions={
          <>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs sm:text-sm">Loading...</span>
              </div>
            )}
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              variant="outline"
              size="lg"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {/* Stats Overview - Enhanced Responsive Grid */}
      <div className={dashboard.statsGrid}>
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="Platform users"
          icon={Users}
        />
        <StatsCard
          title="Platform Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          description="Total earnings"
          icon={Banknote}
        />
        <StatsCard
          title="Active Transactions"
          value={stats?.activeTransactions || 0}
          description="In progress"
          icon={TrendingUp}
        />
        <StatsCard
          title="System Health"
          value={systemHealth?.uptime || "Unavailable"}
          description="Uptime"
          icon={Database}
        />
        <StatsCard
          title="Total Commissions"
          value={stats?.commissionStats?.totalCommissions || 0}
          description="Commission payments"
          icon={Banknote}
        />
        <StatsCard
          title="Commission Revenue"
          value={`₦${(stats?.commissionStats?.totalCommissionAmount || 0).toLocaleString()}`}
          description="Partner earnings"
          icon={TrendingUp}
        />
        <StatsCard
          title="Commission Rate"
          value={`${stats?.commissionStats?.commissionRate || 0}%`}
          description="Of total revenue"
          icon={BarChart3}
        />
      </div>

      <div className={dashboard.contentGrid}>
        {/* Main Content - Enhanced Responsive */}
        <div className={dashboard.contentMain}>
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Platform Overview - Enhanced Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className={cn(textStyles.cardTitle, "flex items-center")}>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Platform Overview
              </CardTitle>
              <CardDescription className="text-sm">Key metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
                  <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
                  <TabsTrigger value="commissions" className="text-xs sm:text-sm">Commissions</TabsTrigger>
                  <TabsTrigger value="system" className="text-xs sm:text-sm">System</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {(() => {
                      const totalUsers = stats?.totalUsers || 1
                      const farmers = stats?.userDistribution?.farmers || 0
                      const buyers = stats?.userDistribution?.buyers || 0
                      const partners = stats?.userDistribution?.partners || 0
                      const admins = stats?.userDistribution?.admins || 0

                      const farmersPercent = Math.round((farmers / totalUsers) * 100)
                      const buyersPercent = Math.round((buyers / totalUsers) * 100)
                      const partnersPercent = Math.round((partners / totalUsers) * 100)
                      const adminsPercent = Math.round((admins / totalUsers) * 100)

                      return (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Farmers</span>
                              <span>{farmersPercent}% ({farmers})</span>
                            </div>
                            <Progress value={farmersPercent} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Buyers</span>
                              <span>{buyersPercent}% ({buyers})</span>
                            </div>
                            <Progress value={buyersPercent} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Partners</span>
                              <span>{partnersPercent}% ({partners})</span>
                            </div>
                            <Progress value={partnersPercent} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Admins</span>
                              <span>{adminsPercent}% ({admins})</span>
                            </div>
                            <Progress value={adminsPercent} className="h-2" />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span>10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Failed</span>
                        <span>3%</span>
                      </div>
                      <Progress value={3} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Refunded</span>
                        <span>2%</span>
                      </div>
                      <Progress value={2} className="h-2" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commissions" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Commission Overview</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Commissions</span>
                          <span>{stats?.commissionStats?.totalCommissions || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Amount</span>
                          <span>₦{(stats?.commissionStats?.totalCommissionAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Commission Rate</span>
                          <span>{stats?.commissionStats?.commissionRate || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Commission Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pending</span>
                          <span>{stats?.commissionStats?.pendingCommissions || 0} (₦{(stats?.commissionStats?.pendingCommissionAmount || 0).toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Paid</span>
                          <span>{stats?.commissionStats?.paidCommissions || 0} (₦{(stats?.commissionStats?.paidCommissionAmount || 0).toLocaleString()})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Commission Distribution</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {(() => {
                        const totalCommissions = stats?.commissionStats?.totalCommissions || 1
                        const pending = stats?.commissionStats?.pendingCommissions || 0
                        const paid = stats?.commissionStats?.paidCommissions || 0

                        const pendingPercent = Math.round((pending / totalCommissions) * 100)
                        const paidPercent = Math.round((paid / totalCommissions) * 100)

                        return (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Pending</span>
                                <span>{pendingPercent}% ({pending})</span>
                              </div>
                              <Progress value={pendingPercent} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Paid</span>
                                <span>{paidPercent}% ({paid})</span>
                              </div>
                              <Progress value={paidPercent} className="h-2" />
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage</span>
                        <span>38%</span>
                      </div>
                      <Progress value={38} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Network</span>
                        <span>25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent Users - Enhanced Responsive */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4">
              <div className="min-w-0 flex-1">
                <CardTitle className={cn(textStyles.cardTitle, "flex items-center mb-1")}>
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span className="truncate">Recent Users</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                  Latest user registrations
                </CardDescription>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                <Link href="/dashboard/users">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">View All Users</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                      {/* User Info - Responsive Layout */}
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {user.name || user.firstName + ' ' + user.lastName || 'Unknown User'}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* User Actions - Responsive Layout */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                        {/* Badges - Responsive Stack */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Badge variant="secondary" className="capitalize text-xs px-2 py-1">
                            {user.role}
                          </Badge>
                          <Badge
                            variant={user.status === "active" ? "default" : "destructive"}
                            className="text-xs px-2 py-1"
                          >
                            {user.status || "inactive"}
                          </Badge>
                        </div>

                        {/* View Button - Responsive */}
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                        >
                          <Link href="/dashboard/users">
                            <span className="hidden sm:inline">View</span>
                            <span className="sm:hidden">View Details</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">No recent users</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Enhanced Responsive */}
        <div className={dashboard.contentSide}>
          <RecentActivity />

          {/* System Health - Enhanced Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className={cn(textStyles.cardTitle, "flex items-center")}>
                <Database className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                System Health
              </CardTitle>
              <CardDescription className="text-sm">Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="font-medium text-success">
                    {systemHealth?.uptime || "Unavailable"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-medium text-muted-foreground">
                    {systemHealth?.responseTime || "Not tracked yet"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="font-medium">
                    {stats?.totalUsers?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-medium text-muted-foreground">
                    {systemHealth?.errorRate || "Not tracked yet"}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/system">View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions - Enhanced Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className={cn(textStyles.cardTitle, "flex items-center")}>
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm" asChild>
                  <Link href="/dashboard/system">
                    <Database className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    System Management
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm" asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    System Settings
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm" asChild>
                  <Link href="/dashboard/reports">
                    <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Generate Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  )
}
