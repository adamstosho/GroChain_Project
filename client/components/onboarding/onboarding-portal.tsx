"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  MapPin,
  Leaf,
  Download,
  Plus
} from "lucide-react"
import { useOnboarding } from "@/hooks/use-onboarding"
import { OnboardingOverview } from "./onboarding-overview"
import { OnboardingList } from "./onboarding-list"
import { OnboardingTemplates } from "./onboarding-templates"
import { OnboardingWorkflow } from "./onboarding-workflow"
import { OnboardingAnalytics } from "./onboarding-analytics"
import Link from "next/link"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display, Text } from "@/components/ui/typography"
import { dashboard, textStyles } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface OnboardingPortalProps {
  className?: string
}

export function OnboardingPortal({ className }: OnboardingPortalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { stats, isLoading, error, refreshData, exportData } = useOnboarding()

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium text-destructive">Error Loading Onboarding Data</h3>
            <p className="text-destructive">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={refreshData} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !stats) {
    return (
      <DashboardPageShell className={className}>
        {/* Loading Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-64 animate-pulse" />
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 bg-muted rounded w-24 animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className={dashboard.statsGrid4}>
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

        {/* Loading Distribution Cards */}
        <div className={dashboard.contentGrid}>
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                </div>
                <div className="h-4 bg-muted rounded w-48 animate-pulse mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                      <div className="h-6 bg-muted rounded w-12 animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Main Content */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-muted rounded w-full animate-pulse" />
          </CardContent>
        </Card>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Display as="h2" variant="page">Farmer Onboarding Portal</Display>
          <Text variant="sm">
            Manage farmer onboarding process, track progress, and ensure successful integration
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/farmers/add">
              <Plus className="w-4 h-4 mr-2" />
              Add Farmer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={dashboard.statsGrid4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={textStyles.cardTitleSm}>Total Onboardings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat">{stats.total}</Text>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+{stats.thisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={textStyles.cardTitleSm}>In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat">{stats.inProgress}</Text>
            <p className="text-xs text-muted-foreground">
              {stats.inProgress > 0 ? "Active onboardings" : "All caught up"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={textStyles.cardTitleSm}>Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat">{stats.successRate}%</Text>
            <p className="text-xs text-muted-foreground">
              {stats.averageCompletionTime} days avg completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={textStyles.cardTitleSm}>Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat">{stats.pending}</Text>
            <p className="text-xs text-muted-foreground">
              {stats.pending > 0 ? "Requires attention" : "All processed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Regional and Crop Distribution */}
      <div className={dashboard.contentGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={cn(textStyles.cardTitle, "flex items-center gap-2")}>
              <MapPin className="h-4 w-4" />
              Regional Distribution
            </CardTitle>
            <CardDescription>Farmer onboarding by state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.regionalDistribution).map(([state, count]) => (
                <div key={state} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{state}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={cn(textStyles.cardTitle, "flex items-center gap-2")}>
              <Leaf className="h-4 w-4" />
              Crop Distribution
            </CardTitle>
            <CardDescription>Primary crops of onboarded farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.cropDistribution).map(([crop, count]) => (
                <div key={crop} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{crop}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className={textStyles.cardTitle}>Onboarding Management</CardTitle>
          <CardDescription>
            Manage all aspects of the farmer onboarding process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="list" className="text-xs sm:text-sm">All Onboardings</TabsTrigger>
              <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
              <TabsTrigger value="workflow" className="text-xs sm:text-sm">Workflow</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <OnboardingOverview />
            </TabsContent>

            <TabsContent value="list" className="space-y-4 mt-6">
              <OnboardingList />
            </TabsContent>

            <TabsContent value="templates" className="space-y-4 mt-6">
              <OnboardingTemplates />
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4 mt-6">
              <OnboardingWorkflow />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-6">
              <OnboardingAnalytics />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardPageShell>
  )
}
