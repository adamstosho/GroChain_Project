"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Package, 
  Users, 
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Filter
} from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie } from "recharts"
import { cn } from "@/lib/utils"

interface AnalyticsMetric {
  title: string
  value: string | number
  change: number
  changeType: "increase" | "decrease"
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface AnalyticsDashboardProps {
  className?: string
  timeRange?: "7d" | "30d" | "90d" | "1y"
  onTimeRangeChange?: (range: string) => void
  onExport?: () => void
}

const mockMetrics: AnalyticsMetric[] = [
  {
    title: "Total Revenue",
    value: "₦12.5M",
    change: 12.5,
    changeType: "increase",
    icon: Banknote,
    color: "text-green-600"
  },
  {
    title: "Harvest Volume",
    value: "2,847 tons",
    change: 8.2,
    changeType: "increase",
    icon: Package,
    color: "text-blue-600"
  },
  {
    title: "Active Farmers",
    value: "1,234",
    change: 3.1,
    changeType: "increase",
    icon: Users,
    color: "text-purple-600"
  },
  {
    title: "Market Orders",
    value: "456",
    change: 2.4,
    changeType: "decrease",
    icon: TrendingUp,
    color: "text-orange-600"
  }
]

const mockRevenueData: ChartData[] = [
  { name: "Jan", value: 1200000, revenue: 1200000, orders: 45, farmers: 89 },
  { name: "Feb", value: 1350000, revenue: 1350000, orders: 52, farmers: 94 },
  { name: "Mar", value: 980000, revenue: 980000, orders: 38, farmers: 87 },
  { name: "Apr", value: 1450000, revenue: 1450000, orders: 58, farmers: 102 },
  { name: "May", value: 1680000, revenue: 1680000, orders: 65, farmers: 115 },
  { name: "Jun", value: 1890000, revenue: 1890000, orders: 72, farmers: 128 },
  { name: "Jul", value: 2100000, revenue: 2100000, orders: 78, farmers: 135 },
  { name: "Aug", value: 1950000, revenue: 1950000, orders: 71, farmers: 129 }
]

const mockCropDistribution: ChartData[] = [
  { name: "Rice", value: 35, color: "#22c55e" },
  { name: "Maize", value: 25, color: "#f59e0b" },
  { name: "Cassava", value: 20, color: "#8b5cf6" },
  { name: "Yam", value: 15, color: "#ef4444" },
  { name: "Others", value: 5, color: "#6b7280" }
]

const mockRegionalData: ChartData[] = [
  { name: "Kano", value: 450, region: "Kano", volume: 450, revenue: 3200000, farmers: 156 },
  { name: "Kaduna", value: 380, region: "Kaduna", volume: 380, revenue: 2800000, farmers: 134 },
  { name: "Katsina", value: 320, region: "Katsina", volume: 320, revenue: 2400000, farmers: 112 },
  { name: "Jigawa", value: 280, region: "Jigawa", volume: 280, revenue: 2100000, farmers: 98 },
  { name: "Zamfara", value: 240, region: "Zamfara", volume: 240, revenue: 1800000, farmers: 87 },
  { name: "Sokoto", value: 200, region: "Sokoto", volume: 200, revenue: 1500000, farmers: 76 }
]

const mockQualityMetrics = {
  excellent: 45,
  good: 35,
  fair: 15,
  poor: 5
}

export function AnalyticsDashboard({ 
  className,
  timeRange = "30d",
  onTimeRangeChange,
  onExport
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue")
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000)
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your agricultural platform performance and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
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
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.changeType === "increase" ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                {metric.change}% from last period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crops">Crop Analysis</TabsTrigger>
          <TabsTrigger value="regional">Regional Data</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue & Performance Trends
              </CardTitle>
              <CardDescription>
                Monthly revenue, orders, and farmer growth over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.1}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Orders"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="farmers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Farmers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Performing Crop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Rice</div>
                <p className="text-xs text-muted-foreground">
                  35% of total volume • ₦4.4M revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Best Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Kano</div>
                <p className="text-xs text-muted-foreground">
                  450 tons • ₦3.2M revenue • 156 farmers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">85%</div>
                <p className="text-xs text-muted-foreground">
                  80% excellent/good • 15% fair • 5% poor
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crops" className="space-y-6">
          {/* Crop Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={mockCropDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockCropDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} tons`, 'Volume']} />
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockCropDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Market Share']} />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
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
                Volume, revenue, and farmer distribution by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockRegionalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis yAxisId="left" tickFormatter={(value) => formatNumber(value)} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="volume" fill="#3b82f6" name="Volume (tons)" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#22c55e" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Table */}
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
                      <th className="text-left p-2 font-medium">Volume (tons)</th>
                      <th className="text-left p-2 font-medium">Revenue</th>
                      <th className="text-left p-2 font-medium">Farmers</th>
                      <th className="text-left p-2 font-medium">Avg. Revenue/Farmer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRegionalData.map((region) => (
                      <tr key={region.region} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{region.region}</td>
                        <td className="p-2">{formatNumber(region.volume)}</td>
                        <td className="p-2">{formatCurrency(region.revenue)}</td>
                        <td className="p-2">{region.farmers}</td>
                        <td className="p-2">{formatCurrency(region.revenue / region.farmers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
                <div className="space-y-4">
                  {Object.entries(mockQualityMetrics).map(([quality, percentage]) => (
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Quality Trends
                </CardTitle>
                <CardDescription>
                  Quality improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Quality Score']} />
                    <Line
                      type="monotone"
                      dataKey="quality"
                      stroke="#22c55e"
                      strokeWidth={2}
                      data={[
                        { name: "Jan", quality: 78 },
                        { name: "Feb", quality: 81 },
                        { name: "Mar", quality: 79 },
                        { name: "Apr", quality: 83 },
                        { name: "May", quality: 85 },
                        { name: "Jun", quality: 87 },
                        { name: "Jul", quality: 89 },
                        { name: "Aug", quality: 91 }
                      ]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
