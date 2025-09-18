"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  BarChart3,
  Download,
  Filter
} from "lucide-react"
import { useOnboarding } from "@/hooks/use-onboarding"

export function OnboardingAnalytics() {
  const { stats, onboardings } = useOnboarding()

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Analytics Data</h3>
            <p className="text-muted-foreground">Analytics will appear as you onboard farmers</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate trends
  const weeklyGrowth = stats.thisWeek > 0 ? ((stats.thisWeek / stats.total) * 100).toFixed(1) : 0
  const monthlyGrowth = stats.thisMonth > 0 ? ((stats.thisMonth / stats.total) * 100).toFixed(1) : 0

  // Regional performance
  const regionalPerformance = Object.entries(stats.regionalDistribution)
    .map(([state, count]) => ({ state, count, percentage: (count / stats.total) * 100 }))
    .sort((a, b) => b.count - a.count)

  // Crop performance
  const cropPerformance = Object.entries(stats.cropDistribution)
    .map(([crop, count]) => ({ crop, count, percentage: (count / stats.total) * 100 }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Onboarding Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed insights into your farmer onboarding performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Onboardings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.thisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 85% • Current: {stats.successRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionTime} days</div>
            <p className="text-xs text-muted-foreground">
              Target: 30 days • Current: {stats.averageCompletionTime} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{weeklyGrowth}%</span> from total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Regional Performance
            </CardTitle>
            <CardDescription>Farmer onboarding by state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regionalPerformance.map(({ state, count, percentage }) => (
                <div key={state} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm font-medium">{state}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{count}</span>
                    <Badge variant="outline" className="text-xs">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Onboarding activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-blue-600">{stats.thisWeek}</span>
                  <Badge variant="outline" className="text-xs">
                    +{weeklyGrowth}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Month</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">{stats.thisMonth}</span>
                  <Badge variant="outline" className="text-xs">
                    +{monthlyGrowth}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Crop Performance
          </CardTitle>
          <CardDescription>Most popular crops among onboarded farmers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cropPerformance.slice(0, 6).map(({ crop, count, percentage }) => (
              <div key={crop} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{crop}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% of total onboardings
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key findings and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Good regional coverage across {Object.keys(stats.regionalDistribution).length} states</li>
                  <li>• Diverse crop portfolio with {Object.keys(stats.cropDistribution).length} crop types</li>
                  <li>• Consistent weekly onboarding activity</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• {stats.pending} farmers pending review</li>
                  <li>• {stats.onHold} onboardings currently on hold</li>
                  <li>• Average completion time: {stats.averageCompletionTime} days</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Focus on reducing pending reviews to improve success rate</li>
                <li>• Implement automated reminders for farmers in training stage</li>
                <li>• Consider expanding to new regions for growth</li>
                <li>• Optimize workflow to reduce average completion time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
