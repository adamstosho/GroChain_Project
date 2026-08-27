"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  TrendingUp,
  Banknote,
  Users,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  MapPin,
  Target,
  Shield
} from "lucide-react"
import {
  Line,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  Legend,
  ComposedChart
} from "recharts"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { getExportService } from "@/lib/export-utils"
import { brandColors } from "@/lib/brand/colors"
import { formatCompactCurrency, formatCompactNumber } from "@/lib/format"

interface AdminAnalyticsData {
  totalUsers: number
  activeUsers: number
  newRegistrations: number
  totalHarvests: number
  approvedHarvests: number
  totalListings: number
  totalOrders: number
  totalRevenue: number
  averageCreditScore: number
  approvalRate: number
  userDistribution?: {
    farmers: number;
    buyers: number;
    partners: number;
    admins: number;
  };
}

interface OverviewData {
  monthlyGrowth: any[]
  userGrowth: any[]
  harvestTrends: any[]
  revenueTrends: any[]
}

interface UserAnalyticsData {
  userDistribution: any[]
  userGrowth: any[]
  userActivity: any[]
  topUsers: any[]
}

interface RegionalData {
  regionalData: any[]
}

interface QualityData {
  qualityDistribution: any[]
  statusMetrics: any[]
  creditScoreStats: any
  approvalMetrics: any
}

export function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null)
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [userAnalyticsData, setUserAnalyticsData] = useState<UserAnalyticsData | null>(null)
  const [regionalData, setRegionalData] = useState<RegionalData | null>(null)
  const [qualityData, setQualityData] = useState<QualityData | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()
  const exportService = getExportService()

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch dashboard metrics and overview data in parallel
      const [dashboardResponse, overviewResponse] = await Promise.allSettled([
        apiService.getAdminDashboard(),
        apiService.getAdminAnalyticsOverview(timeRange)
      ])

      // Handle dashboard data
      if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.status === 'success') {
        const data = dashboardResponse.value.data as any
        setAnalyticsData({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          newRegistrations: 0, // This would need to be calculated
          totalHarvests: data.totalHarvests || 0,
          approvedHarvests: data.totalHarvests - (data.pendingApprovals || 0),
          totalListings: data.totalListings || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          averageCreditScore: 650, // Default value
          approvalRate: data.approvalRate || 0,
          userDistribution: data.userDistribution
        })
      }

      // Handle overview data
      if (overviewResponse.status === 'fulfilled' && overviewResponse.value.status === 'success') {
        setOverviewData(overviewResponse.value.data as OverviewData)
      }

    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error loading analytics",
        description: error.message || "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, toast])

  useEffect(() => {
    fetchAllAnalytics()
  }, [fetchAllAnalytics])

  const fetchTabData = async (tab: string) => {
    try {
      switch (tab) {
        case 'users':
          if (!userAnalyticsData) {
            const response = await apiService.getAdminAnalyticsUsers(timeRange)
            if (response.status === 'success') {
              setUserAnalyticsData(response.data as UserAnalyticsData)
            }
          }
          break
        case 'regional':
          if (!regionalData) {
            const response = await apiService.getAdminAnalyticsRegional(timeRange)
            if (response.status === 'success') {
              setRegionalData(response.data as RegionalData)
            }
          }
          break
        case 'quality':
          if (!qualityData) {
            const response = await apiService.getAdminAnalyticsQuality(timeRange)
            if (response.status === 'success') {
              setQualityData(response.data as QualityData)
            }
          }
          break
      }
    } catch {
      toast({
        title: "Error",
        description: `Failed to load ${tab} data`,
        variant: "destructive",
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    fetchTabData(value)
  }

  const handleRefresh = () => {
    fetchAllAnalytics()
    // Clear cached tab data to force refresh
    setUserAnalyticsData(null)
    setRegionalData(null)
    setQualityData(null)
  }

  const handleExport = async () => {
    await exportService.exportAnalytics('all', timeRange, 'json')
  }

  const formatCurrency = formatCompactCurrency
  const formatNumber = formatCompactNumber

  const processChartData = (data: any[], format: 'monthly' | 'combined' = 'monthly') => {
    if (!Array.isArray(data) || data.length === 0) return []

    if (format === 'combined') {
      // Combine data from different sources
      const combinedMap = new Map()

      data.forEach(item => {
        const month = item._id
        if (!combinedMap.has(month)) {
          combinedMap.set(month, { name: month })
        }
        const existing = combinedMap.get(month)
        Object.keys(item).forEach(key => {
          if (key !== '_id') {
            existing[key] = item[key]
          }
        })
      })

      return Array.from(combinedMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }

    return data.map(item => ({
      name: item._id,
      value: item.count || item.users || item.harvests || item.revenue || 0,
      ...item
    })).sort((a, b) => a.name.localeCompare(b.name))
  }

  const getUserDistributionData = () => {
    if (!analyticsData?.userDistribution) return []

    const { farmers, buyers, partners, admins } = analyticsData.userDistribution
    const total = farmers + buyers + partners + admins

    if (total === 0) return []

    return [
      { name: 'Farmers', value: Math.round((farmers / total) * 100), count: farmers, color: '#166534' },
      { name: 'Buyers', value: Math.round((buyers / total) * 100), count: buyers, color: brandColors.chartEarth },
      { name: 'Partners', value: Math.round((partners / total) * 100), count: partners, color: brandColors.chartGold },
      { name: 'Admins', value: Math.round((admins / total) * 100), count: admins, color: '#df000d' }
    ]
  }

  const getQualityDistributionData = () => {
    if (!qualityData?.qualityDistribution) return []

    const total = qualityData.qualityDistribution.reduce((sum: number, item: any) => sum + item.count, 0)

    return qualityData.qualityDistribution.map((item: any) => ({
      quality: item._id || 'Unknown',
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      count: item.count
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Platform-wide insights, user growth, and system performance metrics
          </p>
        </div>

        {/* Controls - Mobile First Design */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col xs:flex-row gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-full xs:w-auto min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-none min-w-[100px]"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
              <span className="xs:hidden">↻</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex-1 sm:flex-none min-w-[100px]"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Export</span>
              <span className="xs:hidden">↓</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Users</CardTitle>
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full flex-shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatNumber(analyticsData?.totalUsers || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-success flex-shrink-0" />
              <span className="truncate">{formatNumber(analyticsData?.activeUsers || 0)} active</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Revenue</CardTitle>
            <div className="p-1.5 sm:p-2 bg-success/10 rounded-full flex-shrink-0">
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
              {formatCurrency(analyticsData?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-success flex-shrink-0" />
              <span className="truncate">From {formatNumber(analyticsData?.totalOrders || 0)} orders</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-success/10 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Harvests</CardTitle>
            <div className="p-1.5 sm:p-2 bg-accent/10 rounded-full flex-shrink-0">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatNumber(analyticsData?.totalHarvests || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 mr-1 text-primary flex-shrink-0" />
              <span className="truncate">{analyticsData?.approvalRate || 0}% approval rate</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Credit Score</CardTitle>
            <div className="p-1.5 sm:p-2 bg-warning/10 rounded-full flex-shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analyticsData?.averageCreditScore || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Shield className="h-3 w-3 mr-1 text-primary flex-shrink-0" />
              <span className="truncate">Platform average</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-warning/10 rounded-bl-full opacity-20" />
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="overview"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">User Analytics</span>
            <span className="xs:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="regional"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Regional Data</span>
            <span className="xs:hidden">Regions</span>
          </TabsTrigger>
          <TabsTrigger
            value="quality"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Quality Metrics</span>
            <span className="xs:hidden">Quality</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Platform Growth & Performance
              </CardTitle>
              <CardDescription>
                Monthly user growth, harvest volume, revenue, and order trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewData?.monthlyGrowth && overviewData.monthlyGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={processChartData(overviewData.monthlyGrowth)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name === 'users' ? 'Users' : name === 'harvests' ? 'Harvests' : name === 'orders' ? 'Orders' : 'Revenue'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke={brandColors.chartEarth}
                      fill={brandColors.chartEarth}
                      fillOpacity={0.1}
                      name="Users"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="harvests"
                      stroke="#166534"
                      strokeWidth={2}
                      name="Harvests"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="#df000d"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No growth data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(analyticsData?.newRegistrations || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  New registrations this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {analyticsData?.approvalRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Harvest approval rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {analyticsData?.totalUsers ? Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  User engagement rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  User Distribution
                </CardTitle>
                <CardDescription>
                  Distribution of users across different roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getUserDistributionData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={getUserDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill={brandColors.primary}
                        dataKey="value"
                      >
                        {getUserDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Distribution']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>No user distribution data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  User Activity
                </CardTitle>
                <CardDescription>
                  User status and activity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userAnalyticsData?.userActivity ? (
                  <div className="space-y-4">
                    {userAnalyticsData.userActivity.map((status: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{status._id}</span>
                          <span className="text-sm text-muted-foreground">{status.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              status._id === "active" && "bg-success",
                              status._id === "pending" && "bg-warning",
                              status._id === "suspended" && "bg-destructive",
                              status._id === "verified" && "bg-primary"
                            )}
                            style={{
                              width: `${Math.min(100, (status.count / (analyticsData?.totalUsers || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>Loading user activity data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Regional Performance Analysis
              </CardTitle>
              <CardDescription>
                User distribution, harvest volume, and revenue by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {regionalData?.regionalData && regionalData.regionalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionalData.regionalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis yAxisId="left" tickFormatter={(value) => formatNumber(value)} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name === 'revenue' ? 'Revenue' : name === 'harvests' ? 'Harvests' : 'Users'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="users" fill={brandColors.chartEarth} name="Users" />
                    <Bar yAxisId="left" dataKey="harvests" fill="#166534" name="Harvests" />
                    <Bar yAxisId="right" dataKey="revenue" fill={brandColors.chartGold} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Loading regional data...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regional Table */}
          {regionalData?.regionalData && regionalData.regionalData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Regional Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Region</th>
                        <th className="text-left p-2 font-medium">Users</th>
                        <th className="text-left p-2 font-medium">Harvests</th>
                        <th className="text-left p-2 font-medium">Revenue</th>
                        <th className="text-left p-2 font-medium">Avg Revenue/User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.regionalData.map((region) => (
                        <tr key={region.region} className="border-b hover:bg-muted/30">
                          <td className="p-2 font-medium">{region.region}</td>
                          <td className="p-2">{formatNumber(region.users)}</td>
                          <td className="p-2">{formatNumber(region.harvests)}</td>
                          <td className="p-2">{formatCurrency(region.revenue)}</td>
                          <td className="p-2">
                            {region.users > 0 ? formatCurrency(region.revenue / region.users) : '₦0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Quality Distribution
                </CardTitle>
                <CardDescription>
                  Harvest quality breakdown across all products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getQualityDistributionData().length > 0 ? (
                  <div className="space-y-4">
                    {getQualityDistributionData().map((quality) => (
                      <div key={quality.quality} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{quality.quality}</span>
                          <span className="text-sm text-muted-foreground">{quality.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              quality.quality === "excellent" && "bg-success",
                              quality.quality === "good" && "bg-primary",
                              quality.quality === "fair" && "bg-warning",
                              quality.quality === "poor" && "bg-destructive"
                            )}
                            style={{ width: `${quality.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>Loading quality data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Platform Metrics
                </CardTitle>
                <CardDescription>
                  Key platform performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData?.activeUsers || 0} / {analyticsData?.totalUsers || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${analyticsData?.totalUsers && analyticsData.totalUsers > 0 ? (analyticsData.activeUsers / analyticsData.totalUsers) * 100 : 0}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Approval Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData?.approvalRate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-success transition-all duration-300"
                      style={{ width: `${analyticsData?.approvalRate || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Credit Score</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData?.averageCreditScore || 0}/100
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${Math.min(100, analyticsData?.averageCreditScore || 0)}%` }}
                    />
                  </div>

                  {qualityData?.approvalMetrics && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Harvest Approval</span>
                        <span className="text-sm text-muted-foreground">
                          {qualityData.approvalMetrics.approved} / {qualityData.approvalMetrics.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-success transition-all duration-300"
                          style={{
                            width: `${qualityData.approvalMetrics.total > 0 ? (qualityData.approvalMetrics.approved / qualityData.approvalMetrics.total) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}