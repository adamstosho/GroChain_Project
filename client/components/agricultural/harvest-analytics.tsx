"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  Banknote,
  Leaf,
  BarChart3,
  PieChart,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package
} from "lucide-react"
import { apiService } from "@/lib/api"

interface HarvestAnalytics {
  totalHarvests: number
  totalQuantity: number
  totalValue: number
  averageQuality: string
  topCrop: string
  monthlyTrend: Array<{
    month: string
    harvests: number
    quantity: number
    value: number
  }>
  cropDistribution: Array<{
    crop: string
    quantity: number
    percentage: number
    color: string
  }>
  qualityDistribution: Array<{
    quality: string
    count: number
    percentage: number
  }>
  seasonalInsights: {
    bestSeason: string
    peakMonth: string
    yieldPrediction: number
    recommendations: string[]
  }
  performanceMetrics: {
    yieldEfficiency: number
    qualityConsistency: number
    marketReadiness: number
    growthRate: number
  }
}

interface HarvestAnalyticsProps {
  farmerId?: string
  className?: string
}

export function HarvestAnalytics({ farmerId, className }: HarvestAnalyticsProps) {
  const [analytics, setAnalytics] = useState<HarvestAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("12months")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, farmerId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch analytics data from API
      const response = await apiService.getHarvestAnalytics({
        timeRange,
        farmerId
      })

      console.log("Analytics API Response:", response)

      // Handle different response structures
      let analyticsData
      if (response?.status === 'success' && response?.data) {
        analyticsData = response.data
      } else if ((response as any)?.data?.data) {
        analyticsData = (response as any).data.data
      } else if ((response as any)?.data) {
        analyticsData = (response as any).data
      } else {
        analyticsData = response
      }

      console.log("Processed Analytics Data:", analyticsData)

      if (analyticsData && typeof analyticsData === 'object') {
        // Transform monthly trend data to ensure proper format
        const processedMonthlyTrend = (analyticsData.monthlyTrend || []).map((item: any) => ({
          month: item.month ? new Date(item.month).toLocaleDateString('en-US', { month: 'short' }) : item.month || 'Unknown',
          harvests: item.harvests || 0,
          quantity: item.quantity || 0,
          value: item.value || 0
        }))

        // Ensure all required fields are present with fallbacks
        const processedAnalytics = {
          totalHarvests: analyticsData.totalHarvests || 0,
          totalQuantity: analyticsData.totalQuantity || 0,
          totalValue: analyticsData.totalValue || 0,
          averageQuality: analyticsData.averageQuality || 'poor',
          topCrop: analyticsData.topCrop || 'N/A',
          monthlyTrend: processedMonthlyTrend,
          cropDistribution: analyticsData.cropDistribution || [],
          qualityDistribution: analyticsData.qualityDistribution || [],
          seasonalInsights: analyticsData.seasonalInsights || {
            bestSeason: 'N/A',
            peakMonth: 'N/A',
            yieldPrediction: 0,
            recommendations: ['No data available yet']
          },
          performanceMetrics: analyticsData.performanceMetrics || {
            yieldEfficiency: 0,
            qualityConsistency: 0,
            marketReadiness: 0,
            growthRate: 0
          }
        }

        setAnalytics(processedAnalytics)
      } else {
        throw new Error('Invalid analytics data structure')
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to load harvest analytics')

      // Only set fallback data if we have no data at all
      if (!analytics) {
        setAnalytics({
          totalHarvests: 0,
          totalQuantity: 0,
          totalValue: 0,
          averageQuality: "poor",
          topCrop: "N/A",
          monthlyTrend: [],
          cropDistribution: [],
          qualityDistribution: [],
          seasonalInsights: {
            bestSeason: "N/A",
            peakMonth: "N/A",
            yieldPrediction: 0,
            recommendations: ["No harvest data available yet"]
          },
          performanceMetrics: {
            yieldEfficiency: 0,
            qualityConsistency: 0,
            marketReadiness: 0,
            growthRate: 0
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
          <p className="text-muted-foreground">{error || 'Unable to fetch harvest analytics data'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Harvest Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your farming performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
            <SelectItem value="24months">Last 2 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Harvests</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalHarvests)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+{analytics.performanceMetrics.growthRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalQuantity)}kg</p>
              </div>
              <Scale className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Avg: {analytics.totalHarvests > 0 ? Math.round(analytics.totalQuantity / analytics.totalHarvests) : 0}kg per harvest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
              </div>
              <Banknote className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Avg: {analytics.totalHarvests > 0 ? formatCurrency(analytics.totalValue / analytics.totalHarvests) : formatCurrency(0)} per harvest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Quality</p>
                <p className="text-2xl font-bold capitalize">{analytics.averageQuality}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Top crop: {analytics.topCrop}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Your farming efficiency and market readiness scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Yield Efficiency</span>
                <span className="text-sm text-muted-foreground">{analytics.performanceMetrics.yieldEfficiency}%</span>
              </div>
              <Progress value={analytics.performanceMetrics.yieldEfficiency} className="h-2" />
              <p className="text-xs text-muted-foreground">Compared to regional average</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Consistency</span>
                <span className="text-sm text-muted-foreground">{analytics.performanceMetrics.qualityConsistency}%</span>
              </div>
              <Progress value={analytics.performanceMetrics.qualityConsistency} className="h-2" />
              <p className="text-xs text-muted-foreground">Harvest quality stability</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Readiness</span>
                <span className="text-sm text-muted-foreground">{analytics.performanceMetrics.marketReadiness}%</span>
              </div>
              <Progress value={analytics.performanceMetrics.marketReadiness} className="h-2" />
              <p className="text-xs text-muted-foreground">Time to market readiness</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Growth Rate</span>
                <span className="text-sm text-muted-foreground">+{analytics.performanceMetrics.growthRate}%</span>
              </div>
              <Progress value={analytics.performanceMetrics.growthRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Year-over-year growth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="crops">Crop Distribution</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
          <TabsTrigger value="insights">Seasonal Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Harvest Trends</CardTitle>
              <CardDescription>Your harvest performance over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.monthlyTrend.length > 0 ? (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {analytics.monthlyTrend.map((month, index) => (
                    <div key={month.month} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-blue-500 rounded-t w-full mb-2 transition-all hover:bg-blue-600"
                        style={{
                          height: Math.max(...analytics.monthlyTrend.map(m => m.harvests)) > 0
                            ? `${(month.harvests / Math.max(...analytics.monthlyTrend.map(m => m.harvests))) * 200}px`
                            : '4px'
                        }}
                        title={`${month.harvests} harvests, ${month.quantity}kg, ${formatCurrency(month.value)}`}
                      />
                      <span className="text-xs text-muted-foreground">{month.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No monthly data available</p>
                    <p className="text-sm text-muted-foreground">Start logging harvests to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crop Distribution</CardTitle>
              <CardDescription>Breakdown of your harvest by crop type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.cropDistribution.length > 0 ? (
                <div className="space-y-4">
                  {analytics.cropDistribution.map((crop) => (
                    <div key={crop.crop} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: crop.color }}
                        />
                        <span className="font-medium">{crop.crop}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(crop.quantity)}kg ({crop.percentage}%)
                        </span>
                        <div className="w-24">
                          <Progress value={crop.percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No crop distribution data available</p>
                  <p className="text-sm text-muted-foreground">Log harvests with different crop types to see distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Distribution</CardTitle>
              <CardDescription>Analysis of your harvest quality grades</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.qualityDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analytics.qualityDistribution.map((quality) => (
                    <div key={quality.quality} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{quality.quality}</span>
                        <Badge variant={quality.quality === 'excellent' ? 'default' : 'secondary'}>
                          {quality.count} harvests
                        </Badge>
                      </div>
                      <Progress value={quality.percentage} className="h-3" />
                      <p className="text-sm text-muted-foreground">{quality.percentage}% of total harvests</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No quality data available</p>
                  <p className="text-sm text-muted-foreground">Quality assessments will appear here once harvests are logged</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Seasonal Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Best Season</p>
                    <p className="text-lg font-bold text-green-700">{analytics.seasonalInsights.bestSeason}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Peak Month</p>
                    <p className="text-lg font-bold text-blue-700">{analytics.seasonalInsights.peakMonth}</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Yield Prediction</p>
                  <p className="text-2xl font-bold text-purple-700">{formatNumber(analytics.seasonalInsights.yieldPrediction)}kg</p>
                  <p className="text-xs text-purple-600">Next season estimate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.seasonalInsights.recommendations && analytics.seasonalInsights.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.seasonalInsights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recommendations available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
