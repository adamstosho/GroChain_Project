"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Settings,
  Edit,
  Plus
} from "lucide-react"
import { useOnboarding } from "@/hooks/use-onboarding"

export function OnboardingWorkflow() {
  const { workflow, onboardings } = useOnboarding()

  if (!workflow) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Workflow Found</h3>
            <p className="text-muted-foreground">Create an onboarding workflow to get started</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate stage statistics
  const stageStats = workflow.stages.map(stage => {
    const count = onboardings.filter(o => o.stage === stage.name).length
    const percentage = onboardings.length > 0 ? (count / onboardings.length) * 100 : 0
    return { ...stage, count, percentage }
  })

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{workflow.name}</h3>
          <p className="text-sm text-muted-foreground">
            Standard farmer onboarding process with {workflow.stages.length} stages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Workflow
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Workflow Stages */}
      <div className="space-y-6">
        {stageStats.map((stage, index) => (
          <Card key={stage.name} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <CardTitle className="text-base capitalize">{stage.name}</CardTitle>
                    <CardDescription>
                      {stage.required ? 'Required' : 'Optional'} • {stage.estimatedDuration} day{stage.estimatedDuration !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{stage.count} farmers</Badge>
                  <Badge variant="secondary">{Math.round(stage.percentage)}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Required Actions:</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {stage.actions.map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dependencies */}
                {stage.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Dependencies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {stage.dependencies.map((dependency) => (
                        <Badge key={dependency} variant="outline" className="text-xs">
                          {dependency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stage Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.count} of {onboardings.length} farmers
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Arrow to next stage */}
            {index < stageStats.length - 1 && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Workflow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Summary</CardTitle>
          <CardDescription>Overall onboarding process statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{workflow.stages.length}</div>
              <p className="text-sm text-muted-foreground">Total Stages</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workflow.stages.filter(s => s.required).length}
              </div>
              <p className="text-sm text-muted-foreground">Required Stages</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {workflow.stages.reduce((sum, stage) => sum + stage.estimatedDuration, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Duration (days)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
