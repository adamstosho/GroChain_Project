"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { formatCompactCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Banknote,
  ShoppingCart,
  Users,
  Eye,
  Star,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award
} from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  period: string
  revenue: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  orders: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  customers: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  views: {
    total: number
    change: number
    trend: 'up' | 'down'
  }
  topProducts: Array<{
    name: string
    revenue: number
    orders: number
    views: number
    rating: number
  }>
  topCategories: Array<{
    name: string
    revenue: number
    percentage: number
  }>
  monthlyData: Array<{
    month: string
    revenue: number
    orders: number
    customers: number
  }>
  customerSegments: Array<{
    segment: string
    count: number
    percentage: number
    revenue: number
  }>
  recommendedActions: Array<{
    title: string
    description: string
  }>
}

const timePeriods = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' }
]

export default function MarketplaceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend with period parameter
      const response = await apiService.getMarketplaceAnalytics(`?period=${selectedPeriod}`)
      if (response.status === 'success' && response.data) {
        const data = response.data

        // Format the data to match frontend expectations
        const analyticsData: AnalyticsData = {
          period: (data as any).period || selectedPeriod,
          revenue: (data as any).revenue || { total: 0, change: 0, trend: 'up' },
          orders: (data as any).orders || { total: 0, change: 0, trend: 'up' },
          customers: (data as any).customers || { total: 0, change: 0, trend: 'up' },
          views: (data as any).views || { total: 0, change: 0, trend: 'up' },
          topProducts: (data as any).topProducts?.slice(0, 4).map((product: any) => ({
            name: product.name || product.cropName || 'Unknown Product',
            revenue: product.revenue || 0,
            orders: product.orders || 0,
            views: product.views || 0,
            rating: product.rating || 4.0
          })) || [],
          topCategories: (data as any).revenueByCategory?.map((category: any) => ({
            name: category.category,
            revenue: category.revenue,
            percentage: category.percentage
          })) || [],
          monthlyData: (data as any).monthlyTrends?.map((trend: any) => ({
            month: trend.month,
            revenue: trend.revenue,
            orders: trend.orders,
            customers: trend.customers
          })) || [],
          customerSegments: [
            {
              segment: 'New Customers',
              count: (data as any).customerInsights?.newCustomers?.count || 0,
              percentage: (data as any).customerInsights?.newCustomers?.percentage || 0,
              revenue: (data as any).customerInsights?.newCustomers?.revenue || 0
            },
            {
              segment: 'Returning Customers',
              count: (data as any).customerInsights?.returningCustomers?.count || 0,
              percentage: (data as any).customerInsights?.returningCustomers?.percentage || 0,
              revenue: (data as any).customerInsights?.returningCustomers?.revenue || 0
            },
            {
              segment: 'Loyal Customers',
              count: (data as any).customerInsights?.loyalCustomers?.count || 0,
              percentage: (data as any).customerInsights?.loyalCustomers?.percentage || 0,
              revenue: (data as any).customerInsights?.loyalCustomers?.revenue || 0
            }
          ],
          recommendedActions: (data as any).recommendedActions || []
        }

        setAnalytics(analyticsData)
      } else {
        throw new Error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load marketplace analytics. Please try again.",
        variant: "destructive",
      })
      // Set empty data on error
      setAnalytics({
        period: selectedPeriod,
        revenue: { total: 0, change: 0, trend: 'up' },
        orders: { total: 0, change: 0, trend: 'up' },
        customers: { total: 0, change: 0, trend: 'up' },
        views: { total: 0, change: 0, trend: 'up' },
        topProducts: [],
        topCategories: [],
        monthlyData: [],
        customerSegments: [],
        recommendedActions: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" />
    )
  }

  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-success' : 'text-destructive'
  }

  const formatCurrency = (amount: number) => formatCompactCurrency(amount)

  // Loading state
  if (loading) {
    return (
      <DashboardLayout pageTitle="Marketplace Analytics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // No analytics data state
  if (!analytics) {
    return (
      <DashboardLayout pageTitle="Marketplace Analytics">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground">
            Analytics data will appear here once you start receiving orders.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace Analytics">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/marketplace" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Marketplace
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Marketplace Analytics</h1>
            <p className="text-muted-foreground">
              Track your sales performance, customer insights, and market trends
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { getExportService } = await import("@/lib/export-utils")
                  const exportService = getExportService()
                  const rows = [
                    { metric: "Total Revenue", value: analytics?.revenue?.total ?? 0, change: analytics?.revenue?.change ?? 0 },
                    { metric: "Total Orders", value: analytics?.orders?.total ?? 0, change: analytics?.orders?.change ?? 0 },
                    { metric: "Customers", value: analytics?.customers?.total ?? 0, change: analytics?.customers?.change ?? 0 },
                    { metric: "Views", value: analytics?.views?.total ?? 0, change: analytics?.views?.change ?? 0 },
                    ...(analytics?.topProducts || []).map((p: any, i: number) => ({
                      metric: `Top Product ${i + 1}`,
                      value: p.name || p.cropName || "",
                      change: p.revenue ?? p.sales ?? "",
                    })),
                  ]
                  const result = await exportService.exportCustomData(rows, {
                    format: "excel",
                    filename: `grochain-marketplace-analytics-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.xlsx`,
                  })
                  if (!result.success) throw new Error(result.error)
                  toast({ title: "Export ready", description: "Analytics report downloaded." })
                } catch (e: any) {
                  toast({ title: "Export failed", description: e?.message || "Try again", variant: "destructive" })
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4 text-success" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(analytics?.revenue?.total || 0)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics?.revenue?.trend || 'up')}`}>
                {getTrendIcon(analytics?.revenue?.trend || 'up')}
                <span>{analytics?.revenue?.change || 0}%</span>
                <span>vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics?.orders?.total || 0}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics?.orders?.trend || 'up')}`}>
                {getTrendIcon(analytics?.orders?.trend || 'up')}
                <span>{analytics?.orders?.change || 0}%</span>
                <span>vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics?.customers?.total || 0}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics?.customers?.trend || 'up')}`}>
                {getTrendIcon(analytics?.customers?.trend || 'up')}
                <span>{analytics?.customers?.change || 0}%</span>
                <span>vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-warning" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{(analytics?.views?.total || 0).toLocaleString()}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics?.views?.trend || 'up')}`}>
                {getTrendIcon(analytics?.views?.trend || 'up')}
                <span>{analytics?.views?.change || 0}%</span>
                <span>vs last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Award className="h-4 w-4 text-primary" />
                Top Performing Products
              </CardTitle>
              <CardDescription>
                Your best-selling products by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
                              <div className="space-y-4">
                  {(analytics?.topProducts || []).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{product?.name || 'Unknown Product'}</div>
                        <div className="text-sm text-muted-foreground">
                          {product?.orders || 0} orders • {product?.rating || 0} rating
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {formatCurrency(product?.revenue || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product?.views || 0} views
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <PieChart className="h-4 w-4 text-success" />
                Revenue by Category
              </CardTitle>
              <CardDescription>
                Breakdown of revenue across product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
                              <div className="space-y-4">
                  {(analytics?.topCategories || []).map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{category?.name || 'Unknown'}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(category?.revenue || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: `${category?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {category?.percentage || 0}% of total revenue
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Activity className="h-4 w-4 text-accent" />
              Monthly Performance Trends
            </CardTitle>
            <CardDescription>
              Track your performance over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Month</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Customers</th>
                  </tr>
                </thead>
                                  <tbody>
                    {(analytics?.monthlyData || []).map((month, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">{month?.month || 'Unknown'}</td>
                      <td className="py-3 px-4 text-foreground">{formatCurrency(month?.revenue || 0)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{month?.orders || 0}</td>
                      <td className="py-3 px-4 text-muted-foreground">{month?.customers || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Target className="h-4 w-4 text-primary" />
              Customer Insights
            </CardTitle>
            <CardDescription>
              Understand your customer segments and their value
            </CardDescription>
          </CardHeader>
          <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(analytics?.customerSegments || []).map((segment, index) => (
                <div key={index} className="text-center p-4 border border-border rounded-lg">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {segment?.count || 0}
                  </div>
                  <div className="text-sm font-medium text-foreground mb-2">
                    {segment?.segment || 'Unknown Segment'}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {segment?.percentage || 0}% of total customers
                  </div>
                  <div className="text-lg font-semibold text-success">
                    {formatCurrency(segment?.revenue || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total revenue from this segment
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recommended Actions</CardTitle>
            <CardDescription>
              Based on your analytics, here are some suggestions to improve performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <h4 className="font-medium text-foreground">Increase Product Visibility</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your top products are performing well. Consider increasing inventory and promoting them more.
                </p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Customer Retention</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Focus on retaining existing customers as they generate the most revenue.
                </p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-warning" />
                  <h4 className="font-medium text-foreground">Quality Improvement</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  High ratings are driving sales. Maintain quality standards to keep customers happy.
                </p>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <h4 className="font-medium text-foreground">Seasonal Planning</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plan inventory based on seasonal trends to maximize revenue opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
