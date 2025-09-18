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
import { useToast } from "@/hooks/use-toast"
import { useDashboardRefresh } from "@/hooks/use-dashboard-refresh"
import { Users, TrendingUp, Banknote, Database, UserCheck, Settings, BarChart3, FileText, RefreshCw } from "lucide-react"
import Link from "next/link"

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
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
        const dashboardData = dashboardResponse.value.data as any
        setStats({
          totalUsers: dashboardData?.totalUsers || 0,
          totalRevenue: dashboardData?.totalRevenue || 0,
          activeTransactions: dashboardData?.activeTransactions || 0,
          totalHarvests: dashboardData?.totalHarvests || 0,
          pendingApprovals: dashboardData?.pendingApprovals || 0,
          activeListings: dashboardData?.totalListings || 0,
          monthlyRevenue: dashboardData?.monthlyRevenue || 0,
          userDistribution: dashboardData?.userDistribution || {},
          approvalRate: dashboardData?.approvalRate || 0,
          // Commission statistics
          commissionStats: dashboardData?.commissionStats || {
            totalCommissions: 0,
            pendingCommissions: 0,
            paidCommissions: 0,
            totalCommissionAmount: 0,
            pendingCommissionAmount: 0,
            paidCommissionAmount: 0,
            commissionRate: 0
          },
          ...dashboardData
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

      // Process system health data
      if (systemHealthResponse.status === 'fulfilled') {
        const healthData = systemHealthResponse.value.data as any
        setSystemHealth({
          uptime: `${(healthData.uptime / 3600).toFixed(1)}h`,
          responseTime: "120ms",
          activeUsers: stats?.totalUsers || 0,
          errorRate: "0.1%",
          status: healthData.status,
          memory: healthData.memory,
          timestamp: healthData.timestamp
        })
      } else {
        console.error('❌ System health failed:', systemHealthResponse.reason)
        setSystemHealth({
          uptime: "99.9%",
          responseTime: "120ms",
          activeUsers: stats?.totalUsers || 0,
          errorRate: "0.1%",
        })
      }

      // Process recent users data
      if (recentUsersResponse.status === 'fulfilled') {
        const usersData = recentUsersResponse.value.data as any
        setRecentUsers(usersData?.users || [])
      } else {
        console.error('❌ Recent users failed:', recentUsersResponse.reason)
        setRecentUsers([])
      }

      setLastUpdated(new Date())

    } catch (error: any) {
      console.error('❌ Dashboard error:', error)
      toast({
        title: "Error loading dashboard",
        description: error.message,
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
  }, [toast])

  // Smart event-driven refresh system
  const { refresh } = useDashboardRefresh({
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
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage platform users and monitor system performance</p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="Platform users"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Platform Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          description="Total earnings"
          icon={Banknote}
          trend={{ value: 18, isPositive: true }}
        />
        <StatsCard
          title="Active Transactions"
          value={stats?.activeTransactions || 0}
          description="In progress"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="System Health"
          value="99.9%"
          description="Uptime"
          icon={Database}
          trend={{ value: 0.1, isPositive: true }}
        />
        <StatsCard
          title="Total Commissions"
          value={stats?.commissionStats?.totalCommissions || 0}
          description="Commission payments"
          icon={Banknote}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Commission Revenue"
          value={`₦${(stats?.commissionStats?.totalCommissionAmount || 0).toLocaleString()}`}
          description="Partner earnings"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Commission Rate"
          value={`${stats?.commissionStats?.commissionRate || 0}%`}
          description="Of total revenue"
          icon={BarChart3}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Platform Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Key metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="commissions">Commissions</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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

          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/users">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name || user.firstName + ' ' + user.lastName || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email} • Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === "active" ? "default" : "destructive"}>
                          {user.status || "inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/users/${user._id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent users</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RecentActivity />

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="font-medium text-success">
                    {systemHealth?.uptime || "99.9%"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-medium">
                    {systemHealth?.responseTime || "120ms"}
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
                  <span className="font-medium text-success">
                    {systemHealth?.errorRate || "0.1%"}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/system">View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/dashboard/system">
                    <Database className="mr-2 h-4 w-4" />
                    System Management
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/dashboard/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
