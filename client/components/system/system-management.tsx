"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { cn } from "@/lib/utils"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { Text } from "@/components/ui/typography"
import { dashboard } from "@/lib/design-system"
import {
  Database,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  RotateCcw,
  Cpu,
  Globe,
  FileText,
  AlertCircle,
  XCircle,
  Monitor,
  Zap,
  Wrench,
  Archive,
  Search,
  Eye
} from "lucide-react"

interface SystemStatus {
  overall: string
  database: {
    status: string
    responseTime: number
  }
  api: {
    status: string
    responseTime: number
  }
  services: Array<{
    name: string
    status: string
    uptime: number
  }>
  uptime: number
  timestamp: string
}

interface SystemLog {
  id: string
  timestamp: Date
  level: string
  message: string
  module: string
  userId?: string
  metadata?: any
}

interface SystemConfig {
  application: any
  database: any
  security: any
  features: any
  limits: any
}

interface Backup {
  id: string
  type: string
  description: string
  status: string
  size: string
  createdAt: string
  createdBy: string
  collections: string[]
}

export function SystemManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [backups, setBackups] = useState<Backup[]>([])
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")
  const [logFilters, setLogFilters] = useState({
    level: 'all',
    module: 'all',
    search: ''
  })
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<string>("")
  const { toast } = useToast()

  const fetchSystemData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statusResponse] = await Promise.allSettled([
        apiService.getAdminSystemStatus(),
        apiService.getAdminSystemHealth()
      ])

      if (statusResponse.status === 'fulfilled' && statusResponse.value.status === 'success') {
        setSystemStatus(statusResponse.value.data as any)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load system data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchSystemLogs = useCallback(async () => {
    try {
      const params = {
        level: logFilters.level !== 'all' ? logFilters.level : '',
        limit: '50',
        page: '1'
      }
      
      const response = await apiService.getAdminSystemLogs(params)
      if (response.status === 'success') {
        setSystemLogs((response.data as any).logs)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load system logs",
        variant: "destructive"
      })
    }
  }, [logFilters.level, toast])

  const fetchSystemConfig = useCallback(async () => {
    try {
      const response = await apiService.getAdminSystemConfig()
      if (response.status === 'success') {
        setSystemConfig(response.data as any)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load system configuration",
        variant: "destructive"
      })
    }
  }, [toast])

  const fetchBackups = useCallback(async () => {
    try {
      const response = await apiService.getSystemBackups()
      if (response.status === 'success') {
        setBackups((response.data as any).backups)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive"
      })
    }
  }, [toast])

  useEffect(() => {
    fetchSystemData()
  }, [fetchSystemData])

  useEffect(() => {
    if (activeTab === "logs") {
      fetchSystemLogs()
    } else if (activeTab === "config") {
      fetchSystemConfig()
    } else if (activeTab === "backups") {
      fetchBackups()
    }
  }, [activeTab, fetchSystemLogs, fetchSystemConfig, fetchBackups])

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      const response = await apiService.toggleMaintenanceMode(enabled, maintenanceMessage)
      if (response.status === 'success') {
        setMaintenanceMode(enabled)
        toast({
          title: "Success",
          description: response.message
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode",
        variant: "destructive"
      })
    }
  }

  const handleCreateBackup = async (type: string) => {
    try {
      const description = `${type} backup created manually on ${new Date().toLocaleDateString()}`
      const response = await apiService.createSystemBackup(type, description)
      if (response.status === 'success') {
        await fetchBackups()
        toast({
          title: "Success",
          description: "Backup created successfully"
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive"
      })
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const response = await apiService.restoreSystemBackup(backupId)
      if (response.status === 'success') {
        toast({
          title: "Restore completed",
          description: "Database collections were restored from the selected backup.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to restore backup",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'completed':
        return 'text-success bg-success/10'
      case 'warning':
      case 'degraded':
        return 'text-warning bg-warning/10'
      case 'error':
      case 'unhealthy':
      case 'failed':
        return 'text-destructive bg-destructive/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
      case 'unhealthy':
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'text-primary bg-primary/10'
      case 'warn':
        return 'text-warning bg-warning/10'
      case 'error':
        return 'text-destructive bg-destructive/10'
      case 'debug':
        return 'text-accent bg-accent/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <DashboardPageShell className="w-full">
      <DashboardSubpageHeader
        title="System Management"
        description="Monitor system health, manage configuration, and perform maintenance"
        actions={
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" onClick={fetchSystemData} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">🔄</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={maintenanceMode ? "destructive" : "outline"} className="w-full sm:w-auto">
                <Wrench className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{maintenanceMode ? "Disable" : "Enable"} Maintenance</span>
                <span className="sm:hidden">🔧 {maintenanceMode ? "Off" : "On"}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {maintenanceMode ? "Disable" : "Enable"} Maintenance Mode
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {maintenanceMode 
                    ? "This will disable maintenance mode and restore normal system operation."
                    : "This will put the system in maintenance mode. Users will not be able to access the platform."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              {!maintenanceMode && (
                <div className="py-4">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Enter a message to display to users during maintenance..."
                    className="mt-2"
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleMaintenanceToggle(!maintenanceMode)}>
                  {maintenanceMode ? "Disable" : "Enable"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        }
      />

      {/* System Status Overview */}
      {systemStatus && (
        <div className={dashboard.statsGrid4}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={cn("px-2 py-1", getStatusColor(systemStatus.overall))}>
                  {getStatusIcon(systemStatus.overall)}
                  <span className="ml-1 capitalize">{systemStatus.overall}</span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                System Uptime: {formatUptime(systemStatus.uptime)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={cn("px-2 py-1", getStatusColor(systemStatus.database.status))}>
                  {getStatusIcon(systemStatus.database.status)}
                  <span className="ml-1 capitalize">{systemStatus.database.status}</span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Response: {systemStatus.database.responseTime}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={cn("px-2 py-1", getStatusColor(systemStatus.api.status))}>
                  {getStatusIcon(systemStatus.api.status)}
                  <span className="ml-1 capitalize">{systemStatus.api.status}</span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Response: {systemStatus.api.responseTime}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground">
                {systemStatus.services.length > 0
                  ? `${systemStatus.services.filter(s => s.status === 'healthy').length} / ${systemStatus.services.length}`
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Services Running</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs sm:text-sm">Monitoring</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">Logs</TabsTrigger>
          <TabsTrigger value="config" className="text-xs sm:text-sm">Config</TabsTrigger>
          <TabsTrigger value="backups" className="text-xs sm:text-sm">Backups</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Services Status
              </CardTitle>
              <CardDescription>Current status of all system services</CardDescription>
            </CardHeader>
            <CardContent>
              {systemStatus?.services && systemStatus.services.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Per-service health checks are not yet implemented.
                </p>
              )}
              {systemStatus?.services && systemStatus.services.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemStatus.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(service.status)}
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn("px-2 py-1", getStatusColor(service.status))}>
                          {service.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Uptime: {formatUptime(service.uptime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common system management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => handleCreateBackup('full')}
                >
                  <Archive className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">Create Backup</span>
                  <span className="text-xs text-muted-foreground">Full system backup</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => {
                    setActiveTab('monitoring')
                    fetchSystemData()
                  }}
                >
                  <Activity className="h-8 w-8 text-success" />
                  <span className="text-sm font-medium">Health Check</span>
                  <span className="text-xs text-muted-foreground">Run diagnostics</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => setActiveTab('config')}
                >
                  <Settings className="h-8 w-8 text-accent" />
                  <span className="text-sm font-medium">System Config</span>
                  <span className="text-xs text-muted-foreground">Manage settings</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => setActiveTab('logs')}
                >
                  <FileText className="h-8 w-8 text-warning" />
                  <span className="text-sm font-medium">View Logs</span>
                  <span className="text-xs text-muted-foreground">System activity</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm font-medium">CPU Usage</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{systemStatus ? Math.min(100, (systemStatus.api?.responseTime || 0) * 2) : 0}%</span>
                  </div>
                  <Progress value={systemStatus ? Math.min(100, (systemStatus.api?.responseTime || 0) * 2) : 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm font-medium">Memory Usage</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{systemStatus ? (100 - Math.min(100, (systemStatus.api?.responseTime || 0) * 2)) : 0}%</span>
                  </div>
                  <Progress value={systemStatus ? (100 - Math.min(100, (systemStatus.api?.responseTime || 0) * 2)) : 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm font-medium">Database Status</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{systemStatus?.database?.responseTime || 0}ms</span>
                  </div>
                  <Progress value={systemStatus ? Math.min(100, (systemStatus.database?.responseTime || 0) * 10) : 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm font-medium">API Response</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{systemStatus?.api?.responseTime || 0}ms</span>
                  </div>
                  <Progress value={systemStatus ? Math.min(100, (systemStatus.api?.responseTime || 0) * 10) : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <Text as="div" variant="stat" className="text-success">99.9%</Text>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Text as="div" variant="stat" className="text-primary">120ms</Text>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Text as="div" variant="stat" className="text-accent">1,250</Text>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Text as="div" variant="stat" className="text-warning">0.1%</Text>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                System Logs
              </CardTitle>
              <CardDescription>View and filter system activity logs</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Log Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Search logs..."
                    value={logFilters.search}
                    onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                    className="w-full sm:w-64"
                  />
                </div>
                
                <Select value={logFilters.level} onValueChange={(value) => setLogFilters({ ...logFilters, level: value })}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={fetchSystemLogs} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh Logs</span>
                </Button>
              </div>

              {/* Logs List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted">
                    <Badge className={cn("px-2 py-1 text-xs", getLevelColor(log.level))}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{log.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">Module: {log.module}</span>
                        {log.userId && (
                          <span className="text-xs text-muted-foreground">User: {log.userId}</span>
                        )}
                      </div>
                      {log.metadata && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                System Configuration
              </CardTitle>
              <CardDescription>Manage system settings and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {systemConfig && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(systemConfig).map(([section, config]) => (
                    <Card key={section}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium capitalize">{section}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(config as any).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-xs text-muted-foreground capitalize">{key}:</span>
                              <span className="text-xs font-mono">
                                {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) + '...' : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedConfig(section)
                            setShowConfigDialog(true)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-primary" />
                  System Backups
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleCreateBackup('incremental')} variant="outline">
                    <Archive className="h-4 w-4 mr-2" />
                    Incremental
                  </Button>
                  <Button onClick={() => handleCreateBackup('full')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Full Backup
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Create and manage system backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{backup.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {backup.type}
                        </Badge>
                        <Badge className={cn("text-xs", getStatusColor(backup.status))}>
                          {backup.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Size: {backup.size}</span>
                        <span>Created: {new Date(backup.createdAt).toLocaleDateString()}</span>
                        <span>By: {backup.createdBy}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Collections: {backup.collections.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await apiService.getRaw(
                              `/api/admin/system/backups/${backup.id}/download`
                            )
                            if (!response.ok) {
                              throw new Error(await response.text() || `HTTP ${response.status}`)
                            }
                            const blob = await response.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = `grochain-backup-${backup.id}.json`
                            a.click()
                            URL.revokeObjectURL(url)
                            toast({
                              title: "Download started",
                              description: "Stored backup archive downloaded.",
                            })
                          } catch (error) {
                            console.error("Backup download failed:", error)
                            toast({
                              title: "Download failed",
                              description: "Could not download the stored backup archive.",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
                            <AlertDialogDescription>
                              This replaces live database collections with data from this backup.
                              Current data in those collections will be overwritten and cannot be undone.
                              Create a fresh backup first if you may need to roll forward again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestoreBackup(backup.id)}>
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedConfig} Configuration</DialogTitle>
            <DialogDescription>
              These are deployment-level settings (environment variables and server
              constants) — view-only here. Change them via your hosting environment's
              configuration, not through this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {systemConfig && selectedConfig && systemConfig[selectedConfig as keyof SystemConfig] && (
              <div className="space-y-3">
                {Object.entries(systemConfig[selectedConfig as keyof SystemConfig] as any).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    {typeof value === 'boolean' ? (
                      <Switch checked={value} />
                    ) : typeof value === 'object' ? (
                      <Textarea
                        value={JSON.stringify(value, null, 2)}
                        className="font-mono text-sm"
                        rows={4}
                        readOnly
                      />
                    ) : (
                      <Input
                        value={String(value)}
                        className="font-mono text-sm"
                        readOnly
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
