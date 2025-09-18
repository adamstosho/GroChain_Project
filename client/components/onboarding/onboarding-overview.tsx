"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Target
} from "lucide-react"
import { useOnboarding } from "@/hooks/use-onboarding"

export function OnboardingOverview() {
  const { onboardings, stats, workflow } = useOnboarding()

  // Get recent onboardings (last 5)
  const recentOnboardings = onboardings.slice(0, 5)

  // Calculate stage distribution
  const stageDistribution = onboardings.reduce((acc, onboarding) => {
    acc[onboarding.stage] = (acc[onboarding.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get next actions for pending onboardings
  const getNextActions = (stage: string) => {
    switch (stage) {
      case 'registration':
        return ['Collect documents', 'Verify contact info', 'Assign agent']
      case 'documentation':
        return ['Review documents', 'Request missing items', 'Schedule training']
      case 'training':
        return ['Monitor progress', 'Schedule verification', 'Prepare activation']
      case 'verification':
        return ['Complete verification', 'Finalize docs', 'Prepare activation']
      case 'activation':
        return ['Create account', 'Send welcome package', 'Begin monitoring']
      default:
        return ['Review status', 'Determine next steps']
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common onboarding tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Add New Farmer</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Bulk Upload</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Target className="h-6 w-6 mb-2" />
              <span>Set Follow-ups</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stage Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Stages</CardTitle>
            <CardDescription>Current distribution across workflow stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflow?.stages.map((stage) => {
                const count = stageDistribution[stage.name] || 0
                const percentage = stats ? (count / stats.total) * 100 : 0
                
                return (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{stage.name}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Estimated duration: {stage.estimatedDuration} day{stage.estimatedDuration !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key onboarding performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-lg font-bold text-green-600">{stats?.successRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Completion Time</span>
                <span className="text-lg font-bold">{stats?.averageCompletionTime} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <span className="text-lg font-bold text-blue-600">{stats?.thisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-lg font-bold text-blue-600">{stats?.thisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Onboardings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Onboardings</CardTitle>
          <CardDescription>Latest farmer onboarding activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOnboardings.map((onboarding) => (
              <div key={onboarding._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{onboarding.farmer.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {typeof onboarding.farmer.location === 'string' ? onboarding.farmer.location : `${(onboarding.farmer.location as any)?.city || 'Unknown'}, ${(onboarding.farmer.location as any)?.state || 'Unknown State'}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {onboarding.farmer.primaryCrops.slice(0, 2).join(', ')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {onboarding.farmer.farmSize} {onboarding.farmer.farmSizeUnit}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    {onboarding.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {onboarding.status === 'in_progress' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                    {onboarding.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {onboarding.status === 'on_hold' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    <Badge variant="outline" className="text-xs capitalize">
                      {onboarding.stage}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(onboarding.createdAt).toLocaleDateString()}
                  </p>
                  {onboarding.nextFollowUp && (
                    <p className="text-xs text-blue-600">
                      Follow-up: {new Date(onboarding.nextFollowUp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {recentOnboardings.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent onboardings</p>
                <p className="text-sm text-muted-foreground">Start onboarding your first farmer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Follow-ups</CardTitle>
          <CardDescription>Farmers requiring attention in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {onboardings
              .filter(o => o.nextFollowUp && new Date(o.nextFollowUp) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
              .slice(0, 5)
              .map((onboarding) => (
                <div key={onboarding._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-medium">{onboarding.farmer.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {typeof onboarding.farmer.location === 'string' ? onboarding.farmer.location : `${(onboarding.farmer.location as any)?.city || 'Unknown'}, ${(onboarding.farmer.location as any)?.state || 'Unknown State'}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(onboarding.nextFollowUp!).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {onboarding.stage} stage
                    </p>
                  </div>
                </div>
              ))}
            
            {onboardings.filter(o => o.nextFollowUp && new Date(o.nextFollowUp) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming follow-ups</p>
                <p className="text-xs text-muted-foreground">All farmers are on track</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
