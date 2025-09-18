"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Users,
  Handshake,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  MapPin,
  Target,
  Award,
  Building,
  AlertCircle
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Legend, ComposedChart } from "recharts"
import { LineChart as LineChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useExportService } from "@/lib/export-utils"

interface PartnerAnalyticsData {
  // Basic farmer stats
  totalFarmers: number
  activeFarmers: number
  inactiveFarmers: number
  pendingFarmers: number

  // Harvest and listing stats
  totalHarvests?: number
  approvedHarvests?: number
  totalListings?: number
  averageFarmerHarvests?: number

  // Commission data
  totalCommissions: number
  monthlyCommissions: number
  commissionRate: number

  // Rates and conversion
  approvalRate: number
  conversionRate: number

  // Performance metrics
  performanceMetrics: {
    farmersOnboardedThisMonth: number
    commissionsEarnedThisMonth: number
    averageCommissionPerFarmer: number
  }

  // Trends data for charts
  monthlyTrends?: Array<{
    month: string
    farmers: number
    harvests: number
    listings: number
    revenue: number
  }>

  // Regional data for charts
  regionalDistribution?: Array<{
    name: string
    value: number
    farmers: number
    color: string
  }>

  // Top performers
  topFarmers?: Array<{
    name: string
    location: string
    harvests: number
    revenue: number
    rating: number
    status: string
  }>

  // Partner info
  partnerInfo?: {
    name: string
    email: string
    organization: string
    status: string
    joinedAt: string
  }

  // Period for context
  period?: string
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export function PartnerAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<PartnerAnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const exportService = useExportService()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch partner analytics data with period parameter
        const response = await apiService.getPartnerMetrics({ period: timeRange })
        const data = response.data || response

        if (data && typeof data === 'object') {
          setAnalyticsData(data as PartnerAnalyticsData)
        } else {
          throw new Error('Invalid data format received from API')
        }
      } catch (error: any) {
        console.error('Analytics fetch error:', error)
        setError(error.message || 'Failed to load analytics data')

        toast({
          title: "Error loading analytics",
          description: error.message || 'Failed to load analytics data. Please try again.',
          variant: "destructive",
        })

        // Set empty data to prevent crashes
        setAnalyticsData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [toast, timeRange])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.getPartnerMetrics({ period: timeRange })
      const data = response.data || response
      setAnalyticsData(data as PartnerAnalyticsData)
      setError(null)
    } catch (error: any) {
      setError(error.message || 'Failed to refresh analytics data')
      toast({
        title: "Error refreshing analytics",
        description: error.message || 'Failed to refresh analytics data',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportService.exportAnalytics('partner', timeRange, 'csv')
      toast({
        title: "Export successful",
        description: "Analytics data has been exported successfully",
      })
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || 'Failed to export analytics data',
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }

  // Ensure data is valid before rendering charts
  const isValidData = (data: any[]) => {
    return Array.isArray(data) && data.length > 0 && data.every(item => item !== null && item !== undefined)
  }

  // Safe chart rendering with error boundaries
  const renderFarmerGrowthChart = () => {
    if (!analyticsData?.monthlyTrends || !isValidData(analyticsData.monthlyTrends)) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No growth data available</p>
          </div>
        </div>
      )
    }

    try {
      return (
        <ResponsiveContainer width="100%" height="100%" minHeight={320} maxHeight={500}>
          <ComposedChart data={analyticsData.monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              fontSize={12}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatNumber(value)}
              fontSize={12}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatCurrency(value)}
              fontSize={12}
              width={80}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : name === 'harvests' ? 'Harvests' : 'Farmers'
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="farmers"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.1}
              name="Farmers"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="harvests"
              stroke="#22c55e"
              strokeWidth={2}
              name="Harvests"
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Revenue"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )
    } catch (error) {
      console.error('Error rendering growth chart:', error)
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Unable to display chart</span>
        </div>
      )
    }
  }

  const renderRegionalChart = () => {
    if (!analyticsData?.regionalDistribution || !isValidData(analyticsData.regionalDistribution)) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No regional data available</p>
          </div>
        </div>
      )
    }

    try {
      return (
        <ResponsiveContainer width="100%" height="100%" minHeight={280} maxHeight={400}>
          <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={analyticsData.regionalDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius="70%"
              fill="#8884d8"
              dataKey="value"
            >
              {analyticsData.regionalDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Distribution']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      )
    } catch (error) {
      console.error('Error rendering regional chart:', error)
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Unable to display chart</span>
        </div>
      )
    }
  }

  const renderFarmerPerformanceChart = () => {
    if (!analyticsData?.monthlyTrends || !isValidData(analyticsData.monthlyTrends)) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No performance data available</p>
          </div>
        </div>
      )
    }

    try {
      return (
        <ResponsiveContainer width="100%" height="100%" minHeight={280} maxHeight={400}>
          <BarChart data={analyticsData.monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              fontSize={12}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(value) => formatNumber(value)}
              fontSize={12}
              width={60}
            />
            <Tooltip
              formatter={(value: any) => [formatNumber(value), 'Farmers']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="farmers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    } catch (error) {
      console.error('Error rendering performance chart:', error)
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Unable to display chart</span>
        </div>
      )
    }
  }

  const renderHarvestGrowthChart = () => {
    if (!analyticsData?.monthlyTrends || !isValidData(analyticsData.monthlyTrends)) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <div className="text-center">
            <LineChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No harvest data available</p>
          </div>
        </div>
      )
    }

    try {
      return (
        <ResponsiveContainer width="100%" height="100%" minHeight={280} maxHeight={400}>
          <LineChart data={analyticsData.monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              fontSize={12}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(value) => formatNumber(value)}
              fontSize={12}
              width={60}
            />
            <Tooltip
              formatter={(value: any) => [formatNumber(value), 'Harvests']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="harvests"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22c55e' }}
              activeDot={{ r: 6, fill: '#22c55e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    } catch (error) {
      console.error('Error rendering harvest chart:', error)
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Unable to display chart</span>
        </div>
      )
    }
  }

  const renderRegionalBarChart = () => {
    if (!analyticsData?.regionalDistribution || !isValidData(analyticsData.regionalDistribution)) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No regional data available</p>
          </div>
        </div>
      )
    }

    try {
      return (
        <ResponsiveContainer width="100%" height="100%" minHeight={280} maxHeight={400}>
          <BarChart data={analyticsData.regionalDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              fontSize={12}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              fontSize={12}
              width={50}
            />
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Market Share']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    } catch (error) {
      console.error('Error rendering regional bar chart:', error)
      return (
        <div className="flex items-center justify-center h-48 md:h-64 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span>Unable to display chart</span>
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Partner Analytics</h2>
            <p className="text-muted-foreground">
              Loading your farmer network performance data...
            </p>
          </div>
        </div>

        {/* Loading Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Partner Analytics</h2>
            <p className="text-muted-foreground">
              Monitor your farmer network performance and commission earnings
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partner Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your farmer network performance, commission earnings, and regional impact
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.totalFarmers || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              {formatNumber(analyticsData?.activeFarmers || 0)} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.activeFarmers || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              {formatNumber(analyticsData?.pendingFarmers || 0)} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Banknote className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.totalCommissions || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Award className="h-3 w-3 mr-1 text-blue-600" />
              {((analyticsData?.commissionRate || 0) * 100).toFixed(1)}% rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.approvalRate?.toFixed(1) || 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Building className="h-3 w-3 mr-1 text-blue-600" />
              Network efficiency
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="farmers">Farmer Network</TabsTrigger>
          <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Network Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Network Growth & Performance
              </CardTitle>
              <CardDescription>
                Monthly farmer growth, harvest volume, and revenue trends for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 md:h-96">
              {renderFarmerGrowthChart()}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monthly Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData?.monthlyCommissions || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month's earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.approvalRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Harvest approval rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.conversionRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Farmer to listing conversion
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-6">
          {/* Farmer Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Farmers by Month
                </CardTitle>
                <CardDescription>
                  Monthly farmer onboarding trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                {renderFarmerPerformanceChart()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-primary" />
                  Harvest Growth
                </CardTitle>
                <CardDescription>
                  Monthly harvest volume progression
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                {renderHarvestGrowthChart()}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performing Farmers
              </CardTitle>
              <CardDescription>
                Best performing farmers in your network based on harvest volume and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.topFarmers && analyticsData.topFarmers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Farmer</th>
                        <th className="text-left p-2 font-medium">Location</th>
                        <th className="text-left p-2 font-medium">Harvests</th>
                        <th className="text-left p-2 font-medium">Revenue</th>
                        <th className="text-left p-2 font-medium">Rating</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topFarmers.map((farmer, index) => (
                        <tr key={farmer.name} className="border-b hover:bg-muted/30">
                          <td className="p-2 font-medium">{farmer.name}</td>
                          <td className="p-2">{farmer.location}</td>
                          <td className="p-2">{farmer.harvests}</td>
                          <td className="p-2">{formatCurrency(farmer.revenue)}</td>
                          <td className="p-2 flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {farmer.rating.toFixed(1)}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant={
                                farmer.status === 'active' ? "default" :
                                farmer.status === 'inactive' ? "secondary" : "outline"
                              }
                            >
                              {farmer.status === 'active' ? "Active" :
                               farmer.status === 'inactive' ? "Inactive" : "Pending"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No farmer performance data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          {/* Regional Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Regional Distribution
                </CardTitle>
                <CardDescription>
                  Farmer distribution across regions in your network
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                {renderRegionalChart()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Regional Performance
                </CardTitle>
                <CardDescription>
                  Performance comparison across regions
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                {renderRegionalBarChart()}
              </CardContent>
            </Card>
          </div>

          {/* Regional Stats */}
          {analyticsData?.regionalDistribution && analyticsData.regionalDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Regional Statistics
                </CardTitle>
                <CardDescription>
                  Detailed breakdown by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.regionalDistribution.map((region, index) => (
                    <div key={region.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{region.name}</h4>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: region.color }}
                        />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Farmers:</span>
                          <span className="font-medium">{region.farmers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Share:</span>
                          <span className="font-medium">{region.value}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Network Performance
                </CardTitle>
                <CardDescription>
                  Key performance indicators for your farmer network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Approval Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData?.approvalRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${analyticsData?.approvalRate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData?.conversionRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${analyticsData?.conversionRate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Commission Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {((analyticsData?.commissionRate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${(analyticsData?.commissionRate || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Commission Overview
                </CardTitle>
                <CardDescription>
                  Commission earnings and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(analyticsData?.monthlyCommissions || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">This Month</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(analyticsData?.totalCommissions || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Earned</div>
                    </div>
                  </div>

                  {analyticsData?.performanceMetrics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Farmers Onboarded (This Month)</span>
                        <span className="font-medium">
                          {analyticsData.performanceMetrics.farmersOnboardedThisMonth}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Commission/Farmer</span>
                        <span className="font-medium">
                          {formatCurrency(analyticsData.performanceMetrics.averageCommissionPerFarmer)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Network Growth Trend
              </CardTitle>
              <CardDescription>
                Farmer network expansion over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 md:h-80">
              {renderFarmerPerformanceChart()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

