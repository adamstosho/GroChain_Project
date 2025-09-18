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
  TrendingDown,
  Banknote,
  Package,
  Leaf,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  MapPin,
  QrCode,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
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
  }>
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

      const [farmerAnalytics, creditScore] = await Promise.all([
        apiService.getFarmerAnalytics(),
        apiService.getMyCreditScore().catch(() => ({ data: { creditScore: 0 } }))
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
        cropDistribution: (farmerAnalytics.data as any)?.cropDistribution || [],
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
  }, [toast])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    if (timeRange) {
      fetchAnalytics(timeRange)
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Farmer Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor your harvest performance, earnings, and farm productivity
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-full sm:w-32">
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
              <SelectTrigger className="w-full sm:w-24">
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || !analyticsData}
              className="flex-1 sm:flex-none"
              title={`Export analytics data as ${exportFormat.toUpperCase()} for ${timeRange} period`}
            >
              <Download className={cn("h-4 w-4 mr-2", isExporting && "animate-pulse")} />
              <span className="hidden sm:inline">
                {isExporting ? `Exporting ${exportFormat.toUpperCase()}...` : `Export ${exportFormat.toUpperCase()}`}
              </span>
              <span className="sm:hidden">
                {isExporting ? "..." : exportFormat.toUpperCase()}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{formatNumber(analyticsData?.totalHarvests || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              {analyticsData?.approvalRate || 0}% approval rate
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Banknote className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              {formatCurrency(analyticsData?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              {analyticsData?.totalOrders || 0} orders completed
            </div>
            {(analyticsData?.totalRevenue || 0) === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                💡 Start selling to see revenue here
              </div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <div className="p-2 bg-purple-50 rounded-full">
              <Leaf className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{analyticsData?.marketplaceStats?.activeListings || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3 mr-1 text-blue-600" />
              {analyticsData?.marketplaceStats?.totalViews || 0} total views
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <div className="p-2 bg-orange-50 rounded-full">
              <Activity className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{analyticsData?.creditScore || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Zap className="h-3 w-3 mr-1 text-orange-600" />
              Financial health indicator
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full opacity-20" />
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-4">Overview</TabsTrigger>
          <TabsTrigger value="harvests" className="text-xs sm:text-sm py-2 px-2 sm:px-4">Harvests</TabsTrigger>
          <TabsTrigger value="crops" className="text-xs sm:text-sm py-2 px-2 sm:px-4">Crops</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs sm:text-sm py-2 px-2 sm:px-4">Quality</TabsTrigger>
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
            <CardContent>
              <ResponsiveContainer width="100%" height={300} className="sm:h-400">
                <AreaChart data={analyticsData?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Best Performing Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length > 0
                    ? analyticsData.monthlyTrends.reduce((best, current) =>
                        current.revenue > best.revenue ? current : best
                      ).month
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
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
              <div className="absolute top-0 right-0 w-12 h-12 bg-green-50 rounded-bl-full opacity-30" />
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Average Harvest Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(analyticsData?.averageHarvestQuantity || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {analyticsData?.totalHarvests || 0} total harvests
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-bl-full opacity-30" />
            </Card>

            <Card className="relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Market Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.marketplaceStats?.conversionRate
                    ? `${Math.round(analyticsData.marketplaceStats.conversionRate)}%`
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analyticsData?.totalOrders || 0} orders from {analyticsData?.totalListings || 0} listings
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full opacity-30" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="harvests" className="space-y-6">
          {/* Harvest Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Harvest Volume by Month
                </CardTitle>
                <CardDescription>
                  Monthly harvest volume trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                  <BarChart data={analyticsData?.monthlyTrends || []}>
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
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Growth
                </CardTitle>
                <CardDescription>
                  Monthly revenue progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                  <LineChart data={analyticsData?.monthlyTrends || []}>
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
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData?.cropDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => `${(props as any).name} ${((props as any).percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analyticsData?.cropDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Market Share']}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={250} className="sm:h-300">
                  <BarChart data={analyticsData?.cropDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Market Share']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
                <div className="space-y-4">
                  {analyticsData?.qualityMetrics && Object.entries(analyticsData.qualityMetrics).map(([quality, percentage]) => (
                    <div key={quality} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{quality}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            quality === "excellent" && "bg-green-500",
                            quality === "good" && "bg-blue-500",
                            quality === "fair" && "bg-yellow-500",
                            quality === "poor" && "bg-red-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!analyticsData?.qualityMetrics || Object.keys(analyticsData.qualityMetrics).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quality data available</p>
                      <p className="text-sm">Quality metrics will appear as you log more harvests</p>
                    </div>
                  )}
                </div>
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
                <ResponsiveContainer width="100%" height={250} className="sm:h-300">
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
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quality Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-green-700">Average Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.monthlyTrends && analyticsData.monthlyTrends.length > 0
                    ? Math.round(analyticsData.monthlyTrends.reduce((sum, item) => sum + item.quality, 0) / analyticsData.monthlyTrends.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on last {analyticsData?.monthlyTrends?.length || 0} months
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-700">Quality Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.monthlyTrends?.length && analyticsData?.monthlyTrends.length >= 2
                    ? (() => {
                        const first = analyticsData?.monthlyTrends?.[0]?.quality
                        const last = analyticsData?.monthlyTrends?.[analyticsData?.monthlyTrends?.length - 1]?.quality
                        const change = Math.round(((last - first) / first) * 100)
                        return `${change >= 0 ? '+' : ''}${change}%`
                      })()
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Trend over time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-purple-700">Top Quality Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.monthlyTrends && analyticsData.monthlyTrends.length > 0
                    ? Math.max(...analyticsData.monthlyTrends.map(item => item.quality))
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best month performance
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Insights Section */}
      <Card className="mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Performance Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered insights to help you optimize your farming operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Revenue Growth Insight */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-800">Revenue Growth</h4>
              </div>
              <p className="text-sm text-green-700 mb-2">
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
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-800">Quality Focus</h4>
              </div>
              <p className="text-sm text-blue-700 mb-2">
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
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-800">Market Performance</h4>
              </div>
              <p className="text-sm text-purple-700 mb-2">
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
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Actionable Recommendations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analyticsData?.totalHarvests === 0 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-md">
                  <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Start Logging Harvests</p>
                    <p className="text-xs text-muted-foreground">Begin tracking your harvests to unlock detailed analytics and insights.</p>
                  </div>
                </div>
              )}
              {analyticsData?.totalListings === 0 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-md">
                  <Leaf className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Create Marketplace Listings</p>
                    <p className="text-xs text-muted-foreground">List your products to reach more buyers and increase revenue.</p>
                  </div>
                </div>
              )}
              {analyticsData?.marketplaceStats?.totalViews && analyticsData.marketplaceStats.totalViews > analyticsData.totalOrders * 2 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-md">
                  <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Improve Product Descriptions</p>
                    <p className="text-xs text-muted-foreground">High views but low conversions. Enhance your product descriptions and photos.</p>
                  </div>
                </div>
              )}
              {analyticsData?.approvalRate && analyticsData.approvalRate < 80 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-md">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Focus on Quality Standards</p>
                    <p className="text-xs text-muted-foreground">Only {analyticsData.approvalRate}% of harvests are approved. Review quality requirements.</p>
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

