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
  ShoppingCart,
  Heart,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  MapPin,
  Package,
  Target,
  Star,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Legend } from "recharts"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BuyerAnalyticsData {
  totalOrders: number
  completedOrders: number
  totalSpent: number
  averageOrderValue: number
  completionRate: number
  favoriteProducts?: number
  pendingDeliveries?: number
  spendingByCategory?: Array<{
    category: string
    amount: number
    percentage: number
  }>
  ordersByStatus?: Array<{
    status: string
    count: number
    percentage: number
  }>
  monthlySpending?: Array<{
    month: string
    spending: number
    orders: number
  }>
  topSuppliers?: Array<{
    name: string
    orders: number
    totalSpent: number
    rating: number
  }>
  recentOrders?: Array<{
    id: string
    orderNumber: string
    date: string
    status: string
    total: number
    items: number
  }>
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export function BuyerAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<BuyerAnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        // Fetch buyer analytics data with period
        const response = await apiService.getBuyerAnalyticsWithPeriod(undefined, timeRange)
        setAnalyticsData(response.data as any)
      } catch (error: any) {
        console.error('Error fetching buyer analytics:', error)
        toast({
          title: "Error loading analytics",
          description: error.message || "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [toast, timeRange])

  const handleRefresh = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getBuyerAnalyticsWithPeriod(undefined, timeRange)
      setAnalyticsData(response.data as BuyerAnalyticsData)
      toast({
        title: "Analytics refreshed",
        description: "Your analytics data has been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  // Helper functions for data validation and formatting
  const isValidData = (data: any) => {
    return data && (Array.isArray(data) ? data.length > 0 : true)
  }

  const getChartColors = () => ['#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

  const prepareCategorySpendingData = () => {
    if (!analyticsData?.spendingByCategory) return []
    return analyticsData.spendingByCategory.map((item, index) => ({
      ...item,
      color: getChartColors()[index % getChartColors().length]
    }))
  }

  const prepareMonthlySpendingData = () => {
    if (!analyticsData?.monthlySpending) return []
    return analyticsData.monthlySpending.map(item => ({
      name: item.month,
      orders: item.orders,
      spending: item.spending,
      avgOrder: item.orders > 0 ? item.spending / item.orders : 0
    }))
  }

  const prepareOrderStatusData = () => {
    if (!analyticsData?.ordersByStatus) return []
    return analyticsData.ordersByStatus.map((item, index) => ({
      ...item,
      color: getChartColors()[index % getChartColors().length]
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
        {/* Header skeleton */}
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <div className="h-6 sm:h-8 bg-muted rounded w-48 sm:w-64 animate-pulse" />
            <div className="h-3 sm:h-4 bg-muted rounded w-72 sm:w-96 animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="h-8 sm:h-9 bg-muted rounded w-full sm:w-32 animate-pulse" />
            <div className="h-8 sm:h-9 bg-muted rounded w-full sm:w-20 animate-pulse" />
          </div>
        </div>

        {/* Key metrics skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                <div className="h-3 sm:h-4 bg-muted rounded w-20 sm:w-24 animate-pulse" />
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="pb-2 sm:pb-3 lg:pb-6">
                <div className="h-6 sm:h-8 lg:h-10 bg-muted rounded w-12 sm:w-16 mb-1 sm:mb-2 animate-pulse" />
                <div className="h-2 sm:h-3 bg-muted rounded w-24 sm:w-32 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="h-4 sm:h-6 bg-muted rounded w-36 sm:w-48 animate-pulse" />
              <div className="h-3 sm:h-4 bg-muted rounded w-48 sm:w-64 animate-pulse" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="h-40 sm:h-48 md:h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="h-4 sm:h-6 bg-muted rounded w-36 sm:w-48 animate-pulse" />
              <div className="h-3 sm:h-4 bg-muted rounded w-48 sm:w-64 animate-pulse" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="h-40 sm:h-48 md:h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Buyer Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track your purchasing patterns, spending analysis, and supplier performance
          </p>
        </div>
        
        {/* Controls - Mobile First Design */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-full xs:w-auto min-w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
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
              className="flex-1 sm:flex-none min-w-[100px] h-8 sm:h-9 text-xs sm:text-sm"
              size="sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Refresh</span>
              <span className="xs:hidden">↻</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Orders</CardTitle>
            <div className="p-1 sm:p-1.5 lg:p-2 bg-blue-50 rounded-full flex-shrink-0">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3 lg:pb-6">
            <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analyticsData?.totalOrders || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5 sm:mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span className="truncate">{analyticsData?.completedOrders || 0} completed</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-blue-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Spent</CardTitle>
            <div className="p-1 sm:p-1.5 lg:p-2 bg-green-50 rounded-full flex-shrink-0">
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3 lg:pb-6">
            <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold break-words">
              {formatCurrency(analyticsData?.totalSpent || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5 sm:mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600 flex-shrink-0" />
              <span className="truncate">Avg: {formatCurrency(analyticsData?.averageOrderValue || 0)}</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-green-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Completion Rate</CardTitle>
            <div className="p-1 sm:p-1.5 lg:p-2 bg-purple-50 rounded-full flex-shrink-0">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3 lg:pb-6">
            <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analyticsData?.completionRate || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5 sm:mt-1">
              <Activity className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
              <span className="truncate">Order success rate</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-purple-50 rounded-bl-full opacity-20" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Orders</CardTitle>
            <div className="p-1 sm:p-1.5 lg:p-2 bg-orange-50 rounded-full flex-shrink-0">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3 lg:pb-6">
            <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">
              {(analyticsData?.totalOrders || 0) - (analyticsData?.completedOrders || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5 sm:mt-1">
              <Package className="h-3 w-3 mr-1 text-blue-600 flex-shrink-0" />
              <span className="truncate">Pending completion</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-orange-50 rounded-bl-full opacity-20" />
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 lg:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger 
            value="purchases" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 lg:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">Purchase Analysis</span>
            <span className="sm:hidden">🛒</span>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 lg:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">Category Spending</span>
            <span className="sm:hidden">📂</span>
          </TabsTrigger>
          <TabsTrigger 
            value="suppliers" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 lg:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 min-h-[36px] sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">Supplier Performance</span>
            <span className="sm:hidden">👥</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Purchase Trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Purchase & Spending Trends</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly order volume, total spending, and average order value
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {isValidData(prepareMonthlySpendingData()) ? (
                <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareMonthlySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
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
                          name === 'spending' || name === 'avgOrder' ? formatCurrency(value) : value,
                          name === 'spending' ? 'Total Spending' : name === 'avgOrder' ? 'Avg Order' : 'Orders'
                        ]}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="orders"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                        name="Orders"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="spending"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Total Spending"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgOrder"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Average Order"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 sm:h-48 md:h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm md:text-base">No spending data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Best Performing Month</CardTitle>
              </CardHeader>
              <CardContent>
                {isValidData(analyticsData?.monthlySpending) ? (() => {
                  const bestMonth = analyticsData!.monthlySpending!.reduce((best, current) =>
                    current.spending > best.spending ? current : best
                  )
                  return (
                    <>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{bestMonth.month}</div>
                      <p className="text-xs text-muted-foreground">
                        {bestMonth.orders} orders • {formatCurrency(bestMonth.spending)} spent
                      </p>
                    </>
                  )
                })() : (
                  <>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-muted-foreground">N/A</div>
                    <p className="text-xs text-muted-foreground">
                      No data available
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {analyticsData?.completionRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.completedOrders || 0} of {analyticsData?.totalOrders || 0} orders completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {formatCurrency(analyticsData?.averageOrderValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spent: {formatCurrency(analyticsData?.totalSpent || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4 sm:space-y-6">
          {/* Purchase Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Orders by Month</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly order volume trends
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                {isValidData(prepareMonthlySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={prepareMonthlySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis tickFormatter={(value) => formatNumber(value)} fontSize={10} />
                      <Tooltip formatter={(value: any) => [formatNumber(value), 'Orders']} />
                      <Bar dataKey="orders" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 sm:h-48 md:h-64 text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm md:text-base">No order data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Spending Growth</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly spending progression
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                {isValidData(prepareMonthlySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={prepareMonthlySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), 'Spending']} />
                      <Line
                        type="monotone"
                        dataKey="spending"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 sm:h-48 md:h-64 text-muted-foreground">
                    <div className="text-center">
                      <LineChart className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm md:text-base">No spending data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 sm:space-y-6">
          {/* Category Spending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Spending by Category</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribution of spending across product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                {isValidData(prepareCategorySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={prepareCategorySpendingData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => `${(props as any).category} ${(props as any).percentage}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {prepareCategorySpendingData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Spending Share']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 sm:h-48 md:h-64 text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm md:text-base">No category spending data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Category Performance</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Spending comparison across categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                {isValidData(prepareCategorySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={prepareCategorySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" fontSize={10} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), 'Total Spent']} />
                      <Bar dataKey="amount" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 sm:h-48 md:h-64 text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm md:text-base">No category data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 sm:space-y-6">
          {/* Supplier Performance */}
          {isValidData(analyticsData?.topSuppliers) ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Supplier Performance Analysis</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Order volume, spending, ratings, and delivery performance by supplier
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1 sm:p-2 font-medium text-xs sm:text-sm">Supplier</th>
                        <th className="text-left p-1 sm:p-2 font-medium text-xs sm:text-sm">Orders</th>
                        <th className="text-left p-1 sm:p-2 font-medium text-xs sm:text-sm">Total Spent</th>
                        <th className="text-left p-1 sm:p-2 font-medium text-xs sm:text-sm">Rating</th>
                        <th className="text-left p-1 sm:p-2 font-medium text-xs sm:text-sm">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData!.topSuppliers!.map((supplier, index) => (
                        <tr key={supplier.name} className="border-b hover:bg-muted/30">
                          <td className="p-1 sm:p-2 font-medium text-xs sm:text-sm truncate max-w-[120px]">{supplier.name}</td>
                          <td className="p-1 sm:p-2 text-xs sm:text-sm">{supplier.orders}</td>
                          <td className="p-1 sm:p-2 text-xs sm:text-sm">{formatCurrency(supplier.totalSpent)}</td>
                          <td className="p-1 sm:p-2 flex items-center gap-1 text-xs sm:text-sm">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            {supplier.rating.toFixed(1)}
                          </td>
                          <td className="p-1 sm:p-2">
                            <Badge
                              variant={supplier.rating >= 4.5 ? "default" : supplier.rating >= 4.0 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {supplier.rating >= 4.5 ? "Excellent" : supplier.rating >= 4.0 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40 sm:h-48 md:h-64">
                <div className="text-center text-muted-foreground">
                  <Star className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-xs sm:text-sm md:text-base">No supplier performance data available</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {isValidData(analyticsData?.recentOrders) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Recent Orders</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your most recent purchase activity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {analyticsData!.recentOrders!.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {order.date} • {order.items} items
                        </p>
                      </div>
                      <div className="text-right w-full sm:w-auto">
                        <p className="font-medium text-sm sm:text-base">{formatCurrency(order.total)}</p>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'secondary' :
                            order.status === 'processing' ? 'outline' : 'destructive'
                          }
                          className="text-xs mt-1"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

