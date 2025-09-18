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
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded w-20 animate-pulse" />
            <div className="h-10 bg-muted rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Key metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-32 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Buyer Analytics</h2>
          <p className="text-muted-foreground">
            Track your purchasing patterns, spending analysis, and supplier performance
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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalOrders || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              {analyticsData?.completedOrders || 0} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.totalSpent || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Avg: {formatCurrency(analyticsData?.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.completionRate || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 mr-1 text-blue-600" />
              Order success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analyticsData?.totalOrders || 0) - (analyticsData?.completedOrders || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Package className="h-3 w-3 mr-1 text-blue-600" />
              Pending completion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Analysis</TabsTrigger>
          <TabsTrigger value="categories">Category Spending</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Purchase Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Purchase & Spending Trends
              </CardTitle>
              <CardDescription>
                Monthly order volume, total spending, and average order value
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isValidData(prepareMonthlySpendingData()) ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={prepareMonthlySpendingData()}>
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
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No spending data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Best Performing Month</CardTitle>
              </CardHeader>
              <CardContent>
                {isValidData(analyticsData?.monthlySpending) ? (() => {
                  const bestMonth = analyticsData!.monthlySpending!.reduce((best, current) =>
                    current.spending > best.spending ? current : best
                  )
                  return (
                    <>
                      <div className="text-2xl font-bold text-green-600">{bestMonth.month}</div>
                      <p className="text-xs text-muted-foreground">
                        {bestMonth.orders} orders • {formatCurrency(bestMonth.spending)} spent
                      </p>
                    </>
                  )
                })() : (
                  <>
                    <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                    <p className="text-xs text-muted-foreground">
                      No data available
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.completionRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.completedOrders || 0} of {analyticsData?.totalOrders || 0} orders completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analyticsData?.averageOrderValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spent: {formatCurrency(analyticsData?.totalSpent || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
          {/* Purchase Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Orders by Month
                </CardTitle>
                <CardDescription>
                  Monthly order volume trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isValidData(prepareMonthlySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareMonthlySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={(value: any) => [formatNumber(value), 'Orders']} />
                      <Bar dataKey="orders" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No order data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Spending Growth
                </CardTitle>
                <CardDescription>
                  Monthly spending progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isValidData(prepareMonthlySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareMonthlySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
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
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No spending data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Category Spending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Distribution of spending across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isValidData(prepareCategorySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={prepareCategorySpendingData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => `${(props as any).category} ${(props as any).percentage}%`}
                        outerRadius={80}
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
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No category spending data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Category Performance
                </CardTitle>
                <CardDescription>
                  Spending comparison across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isValidData(prepareCategorySpendingData()) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareCategorySpendingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), 'Total Spent']} />
                      <Bar dataKey="amount" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Supplier Performance */}
          {isValidData(analyticsData?.topSuppliers) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Supplier Performance Analysis
                </CardTitle>
                <CardDescription>
                  Order volume, spending, ratings, and delivery performance by supplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Supplier</th>
                        <th className="text-left p-2 font-medium">Orders</th>
                        <th className="text-left p-2 font-medium">Total Spent</th>
                        <th className="text-left p-2 font-medium">Rating</th>
                        <th className="text-left p-2 font-medium">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData!.topSuppliers!.map((supplier, index) => (
                        <tr key={supplier.name} className="border-b hover:bg-muted/30">
                          <td className="p-2 font-medium">{supplier.name}</td>
                          <td className="p-2">{supplier.orders}</td>
                          <td className="p-2">{formatCurrency(supplier.totalSpent)}</td>
                          <td className="p-2 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {supplier.rating.toFixed(1)}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant={supplier.rating >= 4.5 ? "default" : supplier.rating >= 4.0 ? "secondary" : "destructive"}
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
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No supplier performance data available</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {isValidData(analyticsData?.recentOrders) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Orders
                </CardTitle>
                <CardDescription>
                  Your most recent purchase activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData!.recentOrders!.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.date} • {order.items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'secondary' :
                            order.status === 'processing' ? 'outline' : 'destructive'
                          }
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

