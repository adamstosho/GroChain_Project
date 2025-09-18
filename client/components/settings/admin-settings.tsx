"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useExportService } from "@/lib/export-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Settings,
  Globe,
  Shield,
  Download,
  Upload,
  Languages,
  Palette,
  Database,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  RefreshCw,
  Trash2,
  FileText,
  Server,
  Cog,
  Users,
  Database as DatabaseIcon
} from "lucide-react"

interface AdminSettings {
  privacy: {
    profileVisibility: 'public' | 'private' | 'staff'
    showLocation: boolean
    showContact: boolean
    showPermissions: boolean
    showActivityLogs: boolean
    showSystemAccess: boolean
  }
  system: {
    dashboardLayout: string
    reportFormat: string
    dataRefreshRate: string
    sessionTimeout: number
    autoLogout: boolean
    auditLogging: boolean
    performanceMonitoring: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
    timezone: string
    dateFormat: string
    numberFormat: string
    timeFormat: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    loginNotifications: boolean
    passwordExpiry: number
    biometricAuth: boolean
    ipWhitelist: boolean
    deviceManagement: boolean
  }
  data: {
    autoBackup: boolean
    backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    retentionPeriod: number
    exportFormat: 'csv' | 'json' | 'pdf' | 'xml'
    dataArchiving: boolean
    realTimeSync: boolean
  }
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
]

const currencies = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
]

const timezones = [
  'Africa/Lagos',
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Cairo',
  'Africa/Johannesburg'
]

const dateFormats = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY'
]

const dashboardLayouts = [
  'Compact', 'Detailed', 'Minimal', 'Custom', 'Executive',
  'Operational', 'Analytical', 'Developer', 'Security'
]

const reportFormats = [
  'PDF', 'Excel', 'Word', 'PowerPoint', 'Web Dashboard',
  'Printed Report', 'Email Summary', 'API Response'
]

const dataRefreshRates = [
  'Real-time', '30 seconds', '1 minute', '5 minutes',
  '15 minutes', '1 hour', 'Manual'
]

const numberFormats = [
  '1,234.56', '1.234,56', '1 234.56', '1234.56',
  '1,234,567.89', '1.234.567,89'
]

const timeFormats = [
  '12-hour (AM/PM)', '24-hour', 'ISO 8601', 'Custom'
]

export function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const { toast } = useToast()
  const exportService = useExportService()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)

      // Fetch admin settings from API
      let response
      try {
        response = await apiService.getAdminSettings()
      } catch (apiError) {
        console.warn("API call failed, using default settings:", apiError)
        response = null
      }

      // Set default values if API fails or returns invalid data
      const defaultSettings: AdminSettings = {
        privacy: {
          profileVisibility: 'staff',
          showLocation: true,
          showContact: true,
          showPermissions: false,
          showActivityLogs: true,
          showSystemAccess: false
        },
        system: {
          dashboardLayout: 'Detailed',
          reportFormat: 'PDF',
          dataRefreshRate: '5 minutes',
          sessionTimeout: 30,
          autoLogout: true,
          auditLogging: true,
          performanceMonitoring: true
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: '1,234.56',
          timeFormat: '24-hour'
        },
        security: {
          twoFactorEnabled: true,
          sessionTimeout: 30,
          loginNotifications: true,
          passwordExpiry: 90,
          biometricAuth: false,
          ipWhitelist: false,
          deviceManagement: true
        },
        data: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionPeriod: 365,
          exportFormat: 'csv',
          dataArchiving: true,
          realTimeSync: true
        }
      }

      // Use API response or fall back to defaults
      const settingsData = response?.data || defaultSettings

      // Ensure the settings object has the expected structure
      const safeSettings: AdminSettings = {
        privacy: {
          ...defaultSettings.privacy,
          ...(settingsData as any).privacy
        },
        system: {
          ...defaultSettings.system,
          ...(settingsData as any).system
        },
        preferences: {
          ...defaultSettings.preferences,
          ...(settingsData as any).preferences
        },
        security: {
          ...defaultSettings.security,
          ...(settingsData as any).security
        },
        data: {
          ...defaultSettings.data,
          ...(settingsData as any).data
        }
      }

      setSettings(safeSettings)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using default settings.",
        variant: "destructive"
      })

      // Set safe default settings on error
      const safeDefaultSettings: AdminSettings = {
        privacy: {
          profileVisibility: 'staff',
          showLocation: true,
          showContact: true,
          showPermissions: false,
          showActivityLogs: true,
          showSystemAccess: false
        },
        system: {
          dashboardLayout: 'Detailed',
          reportFormat: 'PDF',
          dataRefreshRate: '5 minutes',
          sessionTimeout: 30,
          autoLogout: true,
          auditLogging: true,
          performanceMonitoring: true
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: '1,234.56',
          timeFormat: '24-hour'
        },
        security: {
          twoFactorEnabled: true,
          sessionTimeout: 30,
          loginNotifications: true,
          passwordExpiry: 90,
          biometricAuth: false,
          ipWhitelist: false,
          deviceManagement: true
        },
        data: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionPeriod: 365,
          exportFormat: 'csv',
          dataArchiving: true,
          realTimeSync: true
        }
      }
      setSettings(safeDefaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)

      // Save admin settings to API
      await apiService.updateAdminSettings({
        system: settings?.system || {},
        preferences: settings?.preferences || {},
        security: settings?.security || {},
        data: settings?.data || {}
      })

      toast({
        title: "Settings Saved Successfully! 🎉",
        description: "Your administrative preferences have been updated.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }


  const handleExportData = async () => {
    setExporting(true)
    try {
      await exportService.exportCustomData([], {
        format: (settings?.data?.exportFormat === 'xml' ? 'csv' : settings?.data?.exportFormat) || 'csv',
        dataType: 'admin-data',
        filters: {
          includeUsers: true,
          includeSystemLogs: true,
          includeReports: true
        }
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load settings</p>
          <Button onClick={fetchSettings} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure system-wide administrative preferences and data management
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="self-start md:self-auto w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{saving ? "Saving..." : "Save Settings"}</span>
          <span className="sm:hidden">{saving ? "Saving..." : "Save"}</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Privacy & Security</span>
            </CardTitle>
            <CardDescription>Control your data visibility and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={settings?.privacy?.profileVisibility || 'staff'}
                  onValueChange={(value: 'public' | 'private' | 'staff') =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, profileVisibility: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-location" className="text-sm font-medium cursor-pointer flex-1 mr-4">Show Location</Label>
                <Switch
                  id="show-location"
                  checked={settings?.privacy?.showLocation ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, showLocation: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-activity-logs" className="text-sm font-medium cursor-pointer flex-1 mr-4">Show Activity Logs</Label>
                <Switch
                  id="show-activity-logs"
                  checked={settings?.privacy?.showActivityLogs ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, showActivityLogs: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="two-factor" className="text-sm font-medium cursor-pointer flex-1 mr-4">Two-Factor Authentication</Label>
                <Switch
                  id="two-factor"
                  checked={settings?.security?.twoFactorEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, twoFactorEnabled: checked }
                    } : null)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Server className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">System Preferences</span>
            </CardTitle>
            <CardDescription>Customize your system experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="dashboard-layout">Dashboard Layout</Label>
                <Select
                  value={settings?.system?.dashboardLayout || 'Detailed'}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      system: { ...prev.system, dashboardLayout: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardLayouts.map((layout) => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-refresh-rate">Data Refresh Rate</Label>
                <Select
                  value={settings?.system?.dataRefreshRate || '5 minutes'}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      system: { ...prev.system, dataRefreshRate: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataRefreshRates.map((rate) => (
                      <SelectItem key={rate} value={rate}>
                        {rate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="auto-logout" className="text-sm font-medium cursor-pointer flex-1 mr-4">Auto Logout</Label>
                <Switch
                  id="auto-logout"
                  checked={settings?.system?.autoLogout ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      system: { ...prev.system, autoLogout: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="audit-logging" className="text-sm font-medium cursor-pointer flex-1 mr-4">Audit Logging</Label>
                <Switch
                  id="audit-logging"
                  checked={settings?.system?.auditLogging ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      system: { ...prev.system, auditLogging: checked }
                    } : null)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Language & Region</span>
            </CardTitle>
            <CardDescription>Set your local preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings?.preferences?.language || 'en'}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, language: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings?.preferences?.currency || 'NGN'}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, currency: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-format">Number Format</Label>
                <Select
                  value={settings?.preferences?.numberFormat || '1,234.56'}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, numberFormat: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {numberFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DatabaseIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Data Management</span>
          </CardTitle>
          <CardDescription>Manage your system data and exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="auto-backup" className="text-sm font-medium cursor-pointer flex-1 mr-4">Auto Backup</Label>
                <Switch
                  id="auto-backup"
                  checked={settings?.data?.autoBackup ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, autoBackup: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="data-archiving" className="text-sm font-medium cursor-pointer flex-1 mr-4">Data Archiving</Label>
                <Switch
                  id="data-archiving"
                  checked={settings?.data?.dataArchiving ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, dataArchiving: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="real-time-sync" className="text-sm font-medium cursor-pointer flex-1 mr-4">Real-time Sync</Label>
                <Switch
                  id="real-time-sync"
                  checked={settings?.data?.realTimeSync ?? true}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, realTimeSync: checked }
                    } : null)
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format</Label>
                <Select
                  value={settings?.data?.exportFormat || 'csv'}
                  onValueChange={(value: 'csv' | 'json' | 'pdf' | 'xml') =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, exportFormat: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportData} disabled={exporting} variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export Admin Data"}</span>
                <span className="sm:hidden">{exporting ? "Exporting..." : "Export"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
