"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAnalytics } from "@/hooks/use-analytics"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Banknote, 
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Target,
  Award,
  Activity,
  Globe,
  PieChart,
  LineChart,
  BarChart,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year' | 'custom'>('6months')
  const [selectedLocation, setSelectedLocation] = useState("all")
  
  const { 
    data, 
    isLoading, 
    error, 
    filters, 
    setFilters, 
    refreshData, 
    exportData, 
    generateReport,
    clearCache 
  } = useAnalytics({
    timeRange,
    location: selectedLocation === 'all' ? undefined : selectedLocation
  })

  const handleTimeRangeChange = (value: string) => {
    const newTimeRange = value as typeof timeRange
    setTimeRange(newTimeRange)
    setFilters({ ...filters, timeRange: newTimeRange })
  }

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value)
    setFilters({ 
      ...filters, 
      location: value === 'all' ? undefined : value 
    })
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    await exportData(format)
  }

  const handleGenerateReport = async () => {
    await generateReport({
      type: 'overview',
      format: 'pdf',
      includeCharts: true,
      includeInsights: true
    })
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600"
    if (growth < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getPerformanceBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Award className="w-3 h-3 mr-1" />Excellent</Badge>
      case "good":
        return <Badge variant="secondary"><Target className="w-3 h-3 mr-1" />Good</Badge>
      case "average":
        return <Badge variant="outline"><Activity className="w-3 h-3 mr-1" />Average</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-medium text-red-900">Error Loading Analytics</h3>
            <p className="text-red-700">{error}</p>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
              <div className="h-10 bg-muted rounded w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-8 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Mock Data Indicator */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Demo Mode: Showing sample analytics data. Connect to backend for real-time data.
          </span>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into your partner performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="lagos">Lagos</SelectItem>
              <SelectItem value="abuja">Abuja</SelectItem>
              <SelectItem value="kano">Kano</SelectItem>
              <SelectItem value="ondo">Ondo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleGenerateReport}>
            <Eye className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalFarmers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={getGrowthColor(data.overview.monthlyGrowth)}>
                {getGrowthIcon(data.overview.monthlyGrowth)}
                {data.overview.monthlyGrowth}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(data.overview.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              <span className={getGrowthColor(data.overview.monthlyGrowth)}>
                {getGrowthIcon(data.overview.monthlyGrowth)}
                {data.overview.monthlyGrowth}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Quality performance score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{data.overview.averageCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per farmer transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Farmer growth and commission trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.monthlyMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {metric.farmers} farmers
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ₦{(metric.revenue / 1000).toFixed(0)}K
                        </span>
                        <Badge variant={metric.growth > 10 ? "default" : "secondary"}>
                          {metric.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeof performer.location === 'string' ? performer.location : `${(performer.location as any)?.city || 'Unknown'}, ${(performer.location as any)?.state || 'Unknown State'}`} • {performer.totalHarvests} harvests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₦{performer.totalEarnings.toLocaleString()}
                        </p>
                        <Badge variant="outline">
                          {performer.performance}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Retention Rate</p>
                  <Progress value={data.performance.performanceMetrics.farmerRetentionRate} />
                  <p className="text-xs text-muted-foreground">
                    {data.performance.performanceMetrics.farmerRetentionRate}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Commission Growth</p>
                  <Progress value={data.performance.performanceMetrics.commissionGrowth} />
                  <p className="text-xs text-muted-foreground">
                    {data.performance.performanceMetrics.commissionGrowth}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quality Score</p>
                  <Progress value={data.performance.performanceMetrics.qualityScore} />
                  <p className="text-xs text-muted-foreground">
                    {data.performance.performanceMetrics.qualityScore}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Response Time</p>
                  <Progress value={100 - (data.performance.performanceMetrics.averageResponseTime * 20)} />
                  <p className="text-xs text-muted-foreground">
                    {data.performance.performanceMetrics.averageResponseTime} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Monthly Metrics Table */}
                <div>
                  <h4 className="font-medium mb-3">Monthly Breakdown</h4>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-5 gap-4 p-3 bg-muted/50 font-medium text-sm">
                      <span>Month</span>
                      <span>Farmers</span>
                      <span>Commissions</span>
                      <span>Revenue</span>
                      <span>Growth</span>
                    </div>
                    {data.performance.monthlyMetrics.map((metric, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 p-3 border-t">
                        <span className="font-medium">{metric.month}</span>
                        <span>{metric.farmers}</span>
                        <span>{metric.commissions}</span>
                        <span>₦{(metric.revenue / 1000).toFixed(0)}K</span>
                        <span className={getGrowthColor(metric.growth)}>
                          {metric.growth}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Farmer and revenue distribution by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.geographic.locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.farmers} farmers • {location.commissions} commissions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{(location.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-sm text-muted-foreground">
                        {location.percentage}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>Performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3">Farmer Growth Trend</h4>
                    <div className="space-y-2">
                      {data.trends.farmerGrowth.map((value, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{data.trends.timeLabels[index]}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Revenue Trend</h4>
                    <div className="space-y-2">
                      {data.trends.revenueTrends.map((value, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{data.trends.timeLabels[index]}</span>
                          <span className="font-medium">₦{(value / 1000).toFixed(0)}K</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actionable Insights</CardTitle>
              <CardDescription>Key recommendations and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 h-2 w-2 rounded-full ${
                        insight.type === 'positive' ? 'bg-green-500' :
                        insight.type === 'negative' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs">
                          <span className="text-muted-foreground">
                            Impact: <span className="font-medium">{insight.impact}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Priority: <span className="font-medium">{insight.priority}</span>
                          </span>
                        </div>
                        <p className="text-sm font-medium text-green-700 mt-2">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
