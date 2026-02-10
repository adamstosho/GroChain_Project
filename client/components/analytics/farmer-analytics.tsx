"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  Banknote,
  Package,
  Leaf,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Target,
  AlertCircle,
  CheckCircle,
  Users,
  Zap,
  FileText,
  FileSpreadsheet
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Legend } from "recharts"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useExportService } from "@/lib/export-utils"

interface FarmerAnalyticsData {
  totalHarvests: number
  approvedHarvests: number
  approvalRate: number
  totalListings: number
  totalOrders: number
  totalRevenue: number
  averageHarvestQuantity: number
  creditScore?: number
  qualityMetrics?: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  monthlyTrends?: Array<{
    month: string
    harvests: number
    revenue: number
    quality: number
  }>
  cropDistribution?: Array<{
    name: string
    value: number
    color: string
    quantity: number
    count: number
    totalValue: number
    avgQuality: number
    avgPrice: number
  }>
  qualityDistribution?: {
    distribution: Array<{
      name: string
      value: number
      count: number
      totalQuantity: number
      totalValue: number
      avgPrice: number
      crops: string[]
      color: string
    }>
    trends: {
      monthly: Array<{
        month: string
        monthKey: string
        [key: string]: any
      }>
    }
    byCrop: { [cropType: string]: { [quality: string]: any } }
    insights: Array<{
      quality: string
      percentage: number
      count: number
      quantity: number
      revenue: number
      avgPrice: number
      crops: string[]
      isHighQuality: boolean
      recommendation: string
    }>
  }
  marketplaceStats?: {
    activeListings: number
    totalViews: number
    conversionRate: number
    topProducts: Array<{
      name: string
      revenue: number
      orders: number
    }>
  }
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export function FarmerAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<FarmerAnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const exportService = useExportService()

  // Fetch analytics data from backend
  const fetchAnalytics = useCallback(async (period?: string) => {
    try {
      setError(null)
      if (!period) setIsLoading(true)

      const [farmerAnalytics, creditScore, cropAnalytics] = await Promise.all([
        apiService.getFarmerAnalytics(),
        apiService.getMyCreditScore().catch(() => ({ data: { creditScore: 0 } })),
        apiService.getFarmerCropAnalytics(undefined, period || timeRange).catch(() => ({ data: null }))
      ])

      // Debug: Log the raw API response
      console.log('🔍 Analytics API Response:', {
        status: farmerAnalytics.status,
        data: farmerAnalytics.data,
        creditScore: (creditScore.data as any)?.creditScore
      })

      // Process and combine the data
      const combinedData: FarmerAnalyticsData = {
        ...(farmerAnalytics.data as any),
        creditScore: (creditScore.data as any)?.creditScore || 0,
        qualityMetrics: (farmerAnalytics.data as any)?.qualityMetrics || {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0
        },
        monthlyTrends: (farmerAnalytics.data as any)?.monthlyTrends || [],
        cropDistribution: (cropAnalytics.data as any)?.cropDistribution || [],
        qualityDistribution: (cropAnalytics.data as any)?.qualityDistribution || null,
        marketplaceStats: {
          activeListings: (farmerAnalytics.data as any)?.totalListings || 0,
          totalViews: 0,
          conversionRate: (farmerAnalytics.data as any)?.totalOrders && (farmerAnalytics.data as any)?.totalListings
            ? Math.round(((farmerAnalytics.data as any)?.totalOrders / (farmerAnalytics.data as any)?.totalListings) * 100)
            : 0,
          topProducts: []
        }
      }

      // Debug: Log the processed data
      console.log('📊 Processed Analytics Data:', {
        totalRevenue: combinedData.totalRevenue,
        totalOrders: combinedData.totalOrders,
        totalHarvests: combinedData.totalHarvests,
        totalListings: combinedData.totalListings
      })

      setAnalyticsData(combinedData)
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      setError(error.message || 'Failed to load analytics data')
      toast({
        title: "Error loading analytics",
        description: error.message || "Failed to load analytics data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast, timeRange])

  useEffect(() => {
    fetchAnalytics(timeRange)
  }, [timeRange, fetchAnalytics])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics(timeRange)
  }

  const handleExport = async () => {
    if (isExporting) return // Prevent multiple export requests

    // Validate that we have data to export
    if (!analyticsData) {
      toast({
        title: "No data available",
        description: "Please wait for analytics data to load before exporting.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      await exportService.exportAnalytics('farmer', timeRange, exportFormat)
    } finally {
      setIsExporting(false)
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
  const renderChart = (chartType: string, data: any[], fallback: React.ReactNode) => {
    if (!isValidData(data)) {
      return fallback
    }

    try {
      switch (chartType) {
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="harvests"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Harvests"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue (₦)"
                />
              </LineChart>
            </ResponsiveContainer>
          )
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="harvests"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Harvests"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Revenue (₦)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Harvest Count" />
                <Bar dataKey="quantity" fill="#10b981" name="Total Quantity" />
              </BarChart>
            </ResponsiveContainer>
          )
        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Excellent', value: analyticsData?.qualityMetrics?.excellent, color: '#10b981' },
                    { name: 'Good', value: analyticsData?.qualityMetrics?.good, color: '#3b82f6' },
                    { name: 'Fair', value: analyticsData?.qualityMetrics?.fair, color: '#f59e0b' },
                    { name: 'Poor', value: analyticsData?.qualityMetrics?.poor, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {[
                    { name: 'Excellent', value: analyticsData?.qualityMetrics?.excellent, color: '#10b981' },
                    { name: 'Good', value: analyticsData?.qualityMetrics?.good, color: '#3b82f6' },
                    { name: 'Fair', value: analyticsData?.qualityMetrics?.fair, color: '#f59e0b' },
                    { name: 'Poor', value: analyticsData?.qualityMetrics?.poor, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )
        default:
          return fallback
      }
    } catch (error) {
      console.error(`Error rendering ${chartType} chart:`, error)
      return fallback
    }
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  )

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Failed to load analytics</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  // Debug: Show data status
  if (analyticsData) {
    console.log('✅ Analytics data loaded:', {
      hasRevenue: (analyticsData.totalRevenue || 0) > 0,
      revenue: analyticsData.totalRevenue,
      orders: analyticsData.totalOrders,
      harvests: analyticsData.totalHarvests
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Farmer Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor your harvest performance, earnings, and farm productivity
          </p>
        </div>

        {/* Controls - Mobile First Design */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Time Range and Export Format */}
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
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger className="w-full xs:w-auto min-w-[100px]">
                <div className="flex items-center gap-2">
                  {exportFormat === 'csv' ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none min-w-[100px]"
              size="sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              <span className="hidden xs:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
              <span className="xs:hidden">
                {isRefreshing ? '...' : '↻'}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || !analyticsData}
              className="flex-1 sm:flex-none min-w-[100px]"
              size="sm"
              title={`Export analytics data as ${exportFormat.toUpperCase()} for ${timeRange} period`}
            >
              <Download className={cn("h-4 w-4 mr-2", isExporting && "animate-pulse")} />
              <span className="hidden xs:inline">
                {isExporting ? `Exporting ${exportFormat.toUpperCase()}...` : `Export ${exportFormat.toUpperCase()}`}
              </span>
              <span className="xs:hidden">
                {isExporting ? "..." : "↓"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Harvests</CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-full flex-shrink-0">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatNumber(analyticsData?.totalHarvests || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span className="truncate">{analyticsData?.approvalRate || 0}% approval rate</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Revenue</CardTitle>
            <div className="p-1.5 sm:p-2 bg-green-50 rounded-full flex-shrink-0">
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
              {formatCurrency(analyticsData?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span className="truncate">{analyticsData?.totalOrders || 0} orders completed</span>
            </div>
            {(analyticsData?.totalRevenue || 0) === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                💡 Start selling to see revenue here
              </div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Listings</CardTitle>
            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-full flex-shrink-0">
              <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analyticsData?.marketplaceStats?.activeListings || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
              <span className="truncate">{analyticsData?.marketplaceStats?.totalViews || 0} total views</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Credit Score</CardTitle>
            <div className="p-1.5 sm:p-2 bg-orange-50 rounded-full flex-shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analyticsData?.creditScore || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Zap className="h-3 w-3 mr-1 text-orange-600 flex-shrink-0" />
              <span className="truncate">Financial health indicator</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-bl-full opacity-20" />
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="overview"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Overview</span>
            <span className="xs:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger
            value="harvests"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Harvests</span>
            <span className="xs:hidden">🌾</span>
          </TabsTrigger>
          <TabsTrigger
            value="crops"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Crops</span>
            <span className="xs:hidden">🥕</span>
          </TabsTrigger>
          <TabsTrigger
            value="quality"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[40px]"
          >
            <span className="hidden xs:inline">Quality</span>
            <span className="xs:hidden">⭐</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Harvest Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Harvest & Revenue Trends
              </CardTitle>
              <CardDescription>
                Monthly harvest volume, revenue, and quality trends
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="h-[250px] sm:h-[300px] lg:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="month"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="harvests"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      name="Harvests"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.1}
                      name="Revenue"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="quality"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.1}
                      name="Quality Score"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate">Best Performing Month</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length > 0
                    ? analyticsData.monthlyTrends.reduce((best, current) =>
                      current.revenue > best.revenue ? current : best
                    ).month
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length > 0
                    ? (() => {
                      const best = analyticsData?.monthlyTrends?.reduce((best, current) =>
                        current.revenue > best.revenue ? current : best
                      )
                      return `${best.harvests} harvests • ${formatCurrency(best.revenue)} • ${best.quality}% quality`
                    })()
                    : 'No data available'
                  }
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-green-50 rounded-bl-full opacity-30" />
            </Card>

            <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Average Harvest Size</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {formatNumber(analyticsData?.averageHarvestQuantity || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {analyticsData?.totalHarvests || 0} total harvests
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-blue-50 rounded-bl-full opacity-30" />
            </Card>

            <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200 sm:col-span-2 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                  <span className="truncate">Market Success Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {analyticsData?.marketplaceStats?.conversionRate
                    ? `${Math.round(analyticsData.marketplaceStats.conversionRate)}%`
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analyticsData?.totalOrders || 0} orders from {analyticsData?.totalListings || 0} listings
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-purple-50 rounded-bl-full opacity-30" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="harvests" className="space-y-4 sm:space-y-6">
          {/* Harvest Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Harvest Volume by Month</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly harvest volume trends
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="month"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatNumber(value)}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [formatNumber(value), 'Harvests']}
                      />
                      <Bar
                        dataKey="harvests"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Revenue Growth</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly revenue progression
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData?.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="month"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#22c55e', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Harvest Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Harvest Quality Trend
                </CardTitle>
                <CardDescription>
                  Quality score progression over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analyticsData?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="month"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Quality Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey="quality"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance Summary
                </CardTitle>
                <CardDescription>
                  Key harvest performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Harvests</span>
                  <Badge variant="secondary">{formatNumber(analyticsData?.totalHarvests || 0)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approved Rate</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {analyticsData?.approvalRate || 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Quantity</span>
                  <Badge variant="secondary">{formatNumber(analyticsData?.averageHarvestQuantity || 0)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {analyticsData?.marketplaceStats?.conversionRate
                      ? `${Math.round(analyticsData.marketplaceStats.conversionRate)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crops" className="space-y-6">
          {/* Crop Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Crop Distribution
                </CardTitle>
                <CardDescription>
                  Volume distribution across different crop types
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.cropDistribution && analyticsData.cropDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.cropDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => `${(props as any).name} ${((props as any).percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantity"
                      >
                        {analyticsData.cropDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'quantity') return [`${formatNumber(value)} kg`, 'Quantity']
                          if (name === 'totalValue') return [`₦${formatNumber(value)}`, 'Revenue']
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Crop: ${label}`}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No crop distribution data</p>
                      <p className="text-xs text-muted-foreground">Start harvesting different crops to see distribution</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Crop Performance
                </CardTitle>
                <CardDescription>
                  Revenue comparison across crop types
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.cropDistribution && analyticsData.cropDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                    <BarChart data={analyticsData.cropDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₦${formatNumber(value)}`}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'totalValue') return [`₦${formatNumber(value)}`, 'Revenue']
                          if (name === 'quantity') return [`${formatNumber(value)} kg`, 'Quantity']
                          if (name === 'avgQuality') return [`${value}/5`, 'Quality']
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Crop: ${label}`}
                      />
                      <Bar
                        dataKey="totalValue"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No crop data available</p>
                      <p className="text-xs text-muted-foreground">Start harvesting to see performance data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Crop Insights */}
          {analyticsData?.cropDistribution && analyticsData.cropDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Crop Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  Performance analysis and optimization suggestions for your crops
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {analyticsData.cropDistribution.slice(0, 6).map((crop, index) => (
                    <div key={crop.name} className="p-3 sm:p-4 border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: crop.color }}
                          />
                          <div>
                            <h4 className="font-medium text-sm sm:text-base">{crop.name}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {crop.value}% of total volume
                            </p>
                          </div>
                        </div>
                        <Badge variant={crop.value >= 20 ? "default" : crop.value >= 10 ? "secondary" : "outline"} className="text-xs">
                          {crop.value >= 20 ? "High" : crop.value >= 10 ? "Medium" : "Low"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <p className="font-medium">{formatNumber(crop.quantity)} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <p className="font-medium">₦{formatNumber(crop.totalValue)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality:</span>
                          <p className="font-medium">{crop.avgQuality?.toFixed(1) || 'N/A'}/5</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Price:</span>
                          <p className="font-medium">₦{formatNumber(crop.avgPrice)}</p>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-3 p-2 bg-muted/30 rounded text-xs">
                        <p className="text-muted-foreground">
                          {crop.value >= 20
                            ? "💡 Consider expanding production of this high-performing crop"
                            : crop.value >= 10
                              ? "📈 This crop shows good performance, monitor for growth opportunities"
                              : "🔍 Evaluate market demand and consider optimizing production"
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Products */}
          {analyticsData?.marketplaceStats?.topProducts && analyticsData.marketplaceStats.topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Top Performing Products
                </CardTitle>
                <CardDescription>
                  Your best-selling products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.marketplaceStats.topProducts.slice(0, 4).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-semibold rounded-full text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                {analyticsData?.qualityDistribution?.distribution && analyticsData.qualityDistribution.distribution.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.qualityDistribution.distribution.map((quality, index) => (
                      <div key={quality.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: quality.color }}
                            />
                            <span className="text-sm font-medium">{quality.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{quality.value}%</span>
                            <p className="text-xs text-muted-foreground">{quality.count} harvests</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${quality.value}%`,
                              backgroundColor: quality.color
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>Quantity: {formatNumber(quality.totalQuantity)} kg</span>
                          <span>Revenue: ₦{formatNumber(quality.totalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No quality data available</p>
                      <p className="text-xs text-muted-foreground">Quality metrics will appear as you log more harvests</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quality Trends
                </CardTitle>
                <CardDescription>
                  Quality improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.qualityDistribution?.trends?.monthly && analyticsData.qualityDistribution.trends.monthly.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                    <AreaChart data={analyticsData.qualityDistribution.trends.monthly}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name.includes('_count')) {
                            const quality = name.replace('_count', '')
                            const qualityLabel = quality === 'excellent' ? 'Excellent' :
                              quality === 'good' ? 'Good' :
                                quality === 'fair' ? 'Fair' : 'Poor'
                            return [`${value} harvests`, qualityLabel]
                          }
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="excellent_count"
                        stackId="1"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        name="Excellent"
                      />
                      <Area
                        type="monotone"
                        dataKey="good_count"
                        stackId="1"
                        stroke="#84cc16"
                        fill="#84cc16"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        name="Good"
                      />
                      <Area
                        type="monotone"
                        dataKey="fair_count"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        name="Fair"
                      />
                      <Area
                        type="monotone"
                        dataKey="poor_count"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        name="Poor"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No quality trends data</p>
                      <p className="text-xs text-muted-foreground">Quality trends will appear over time</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quality Insights */}
          {analyticsData?.qualityDistribution?.insights && analyticsData.qualityDistribution.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Quality Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your harvest quality performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {analyticsData.qualityDistribution.insights.map((insight, index) => (
                    <div key={insight.quality} className="p-3 sm:p-4 border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: insight.isHighQuality ? '#22c55e' : '#f59e0b'
                            }}
                          />
                          <div>
                            <h4 className="font-medium text-sm sm:text-base">{insight.quality} Quality</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {insight.percentage}% of total harvests
                            </p>
                          </div>
                        </div>
                        <Badge variant={insight.isHighQuality ? "default" : "secondary"} className="text-xs">
                          {insight.percentage >= 50 ? "High" : insight.percentage >= 25 ? "Medium" : "Low"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Count:</span>
                          <p className="font-medium">{insight.count} harvests</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <p className="font-medium">{formatNumber(insight.quantity)} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <p className="font-medium">₦{formatNumber(insight.revenue)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Price:</span>
                          <p className="font-medium">₦{formatNumber(insight.avgPrice)}</p>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-3 p-2 bg-muted/30 rounded text-xs">
                        <p className="text-muted-foreground">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-green-700">High Quality Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.qualityDistribution?.insights
                    ? Math.round(analyticsData.qualityDistribution.insights
                      .filter(q => q.isHighQuality)
                      .reduce((sum, q) => sum + q.percentage, 0))
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Excellent + Good quality harvests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-700">Average Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.qualityDistribution?.insights?.length
                    ? (() => {
                      const avgScore = analyticsData.qualityDistribution.insights.reduce((sum, q) => {
                        const score = q.quality === 'Excellent' ? 4 : q.quality === 'Good' ? 3 : q.quality === 'Fair' ? 2 : 1
                        return sum + (score * q.percentage / 100)
                      }, 0)
                      return Math.round(avgScore * 100) / 100
                    })()
                    : 0}/5
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Weighted quality average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-purple-700">Total Quality Harvests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.qualityDistribution?.insights
                    ? analyticsData.qualityDistribution.insights.reduce((sum, q) => sum + q.count, 0)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Harvests with quality ratings
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Insights Section */}
      <Card className="mt-4 sm:mt-6 lg:mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
            <span className="truncate">Performance Insights & Recommendations</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            AI-powered insights to help you optimize your farming operations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Revenue Growth Insight */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-full flex-shrink-0">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-800 text-sm sm:text-base">Revenue Growth</h4>
              </div>
              <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length >= 2
                  ? (() => {
                    const first = analyticsData?.monthlyTrends?.[0]?.revenue
                    const last = analyticsData?.monthlyTrends?.[analyticsData?.monthlyTrends?.length - 1]?.revenue
                    const growth = Math.round(((last - first) / first) * 100)
                    return growth >= 0
                      ? `Your revenue has grown by ${growth}% this period. Keep up the excellent work!`
                      : `Revenue decreased by ${Math.abs(growth)}%. Consider reviewing your pricing strategy.`
                  })()
                  : 'Start logging harvests to see revenue growth insights.'
                }
              </p>
            </div>

            {/* Quality Improvement Insight */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full flex-shrink-0">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Quality Focus</h4>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length > 0
                  ? (() => {
                    const avgQuality = analyticsData?.monthlyTrends?.reduce((sum, item) => sum + item.quality, 0) / analyticsData?.monthlyTrends?.length
                    if (avgQuality >= 90) return 'Excellent quality standards! Your products are premium grade.'
                    if (avgQuality >= 75) return 'Good quality performance. Focus on consistent harvesting practices.'
                    return 'Quality improvement needed. Review harvesting and storage techniques.'
                  })()
                  : 'Quality insights will appear as you log more harvests.'
                }
              </p>
            </div>

            {/* Market Performance Insight */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-full flex-shrink-0">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Market Performance</h4>
              </div>
              <p className="text-xs sm:text-sm text-purple-700 leading-relaxed">
                {analyticsData?.marketplaceStats?.conversionRate
                  ? analyticsData.marketplaceStats.conversionRate >= 50
                    ? `Strong market performance! ${analyticsData.marketplaceStats.conversionRate}% conversion rate.`
                    : `Market performance could improve. Only ${analyticsData.marketplaceStats.conversionRate}% of views convert to sales.`
                  : 'Market insights will appear as you create listings and receive views.'
                }
              </p>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Actionable Recommendations</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {analyticsData?.totalHarvests === 0 && (
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-md">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm">Start Logging Harvests</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Begin tracking your harvests to unlock detailed analytics and insights.</p>
                  </div>
                </div>
              )}
              {analyticsData?.totalListings === 0 && (
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-md">
                  <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm">Create Marketplace Listings</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">List your products to reach more buyers and increase revenue.</p>
                  </div>
                </div>
              )}
              {analyticsData?.marketplaceStats?.totalViews && analyticsData.marketplaceStats.totalViews > analyticsData.totalOrders * 2 && (
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-md">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm">Improve Product Descriptions</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">High views but low conversions. Enhance your product descriptions and photos.</p>
                  </div>
                </div>
              )}
              {analyticsData?.approvalRate && analyticsData.approvalRate < 80 && (
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-md">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm">Focus on Quality Standards</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Only {analyticsData.approvalRate}% of harvests are approved. Review quality requirements.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

