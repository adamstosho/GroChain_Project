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
  Bell,
  Globe,
  Shield,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Mail,
  Calendar,
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
  CreditCard,
  UserCheck,
  BellOff,
  BellRing,
  Users,
  Building,
  Handshake,
  Target,
  BarChart3,
  FileSpreadsheet
} from "lucide-react"

interface PartnerSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    farmerUpdates: boolean
    projectUpdates: boolean
    financialReports: boolean
    trainingReminders: boolean
    meetingSchedules: boolean
    grantOpportunities: boolean
    complianceAlerts: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'farmers'
    showLocation: boolean
    showContact: boolean
    showFinancial: boolean
    showFarmerCount: boolean
    showProjectDetails: boolean
  }
  operational: {
    preferredCommunicationMethod: string
    meetingFrequency: string
    reportFormat: string
    targetRegions: string[]
    autoApproval: boolean
    qualityMonitoring: boolean
    performanceTracking: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
    timezone: string
    dateFormat: string
    dashboardLayout: string
    reportFrequency: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    loginNotifications: boolean
    passwordExpiry: number
    biometricAuth: boolean
    dataEncryption: boolean
  }
  data: {
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    retentionPeriod: number
    exportFormat: 'csv' | 'json' | 'pdf'
    syncWithFarmers: boolean
    dataSharing: boolean
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

const communicationMethods = [
  'Email', 'Phone', 'Video Call', 'In Person', 'WhatsApp',
  'SMS', 'Portal', 'Social Media'
]

const meetingFrequencies = [
  'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'As Needed',
  'Annual', 'Seasonal'
]

const reportFormats = [
  'PDF', 'Excel', 'Word', 'PowerPoint', 'Web Dashboard',
  'Printed Report', 'Email Summary'
]

const dashboardLayouts = [
  'Compact', 'Detailed', 'Minimal', 'Custom', 'Executive',
  'Operational', 'Analytical'
]

const reportFrequencies = [
  'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually',
  'On Demand', 'Real-time'
]

export function PartnerSettings() {
  const [settings, setSettings] = useState<PartnerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
      
      // Fetch user preferences and settings from API
      const [preferencesResponse, settingsResponse] = await Promise.all([
        apiService.getMyPreferences(),
        apiService.getMySettings()
      ])

      // Combine and set default values
      const defaultSettings: PartnerSettings = {
        notifications: {
          email: true,
          sms: true,
          push: false,
          farmerUpdates: true,
          projectUpdates: true,
          financialReports: true,
          trainingReminders: true,
          meetingSchedules: true,
          grantOpportunities: true,
          complianceAlerts: true
        },
        privacy: {
          profileVisibility: 'farmers',
          showLocation: true,
          showContact: true,
          showFinancial: false,
          showFarmerCount: true,
          showProjectDetails: false
        },
        operational: {
          preferredCommunicationMethod: 'Email',
          meetingFrequency: 'Monthly',
          reportFormat: 'PDF',
          targetRegions: ['South West', 'North Central'],
          autoApproval: false,
          qualityMonitoring: true,
          performanceTracking: true
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          dateFormat: 'DD/MM/YYYY',
          dashboardLayout: 'Detailed',
          reportFrequency: 'Monthly'
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
          passwordExpiry: 90,
          biometricAuth: false,
          dataEncryption: true
        },
        data: {
          autoBackup: true,
          backupFrequency: 'weekly',
          retentionPeriod: 365,
          exportFormat: 'csv',
          syncWithFarmers: true,
          dataSharing: true
        }
      }

      // Merge with API response
      const mergedSettings = {
        ...defaultSettings,
        ...(preferencesResponse?.data as any || {}),
        ...(settingsResponse?.data as any || {})
      }

      setSettings(mergedSettings)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      
      // Save settings to API
      await Promise.all([
        apiService.updateMyPreferences({
          notifications: settings.notifications,
          operational: settings.operational,
          preferences: settings.preferences
        } as any),
        apiService.updateMySettings({
          privacy: settings.privacy,
          security: settings.security,
          data: settings.data
        })
      ])
      
      toast({
        title: "Settings Saved Successfully! 🎉",
        description: "Your operational preferences have been updated.",
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      await apiService.changePassword(currentPassword, newPassword)
      
      toast({
        title: "Password Changed Successfully! 🔐",
        description: "Your password has been updated.",
        variant: "default"
      })
      
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Failed to change password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
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
        format: settings?.data?.exportFormat || 'csv',
        dataType: 'partner-data',
        filename: `partner-data-${new Date().toISOString().split('T')[0]}.csv`,
        filters: {
          includeFarmers: true,
          includeProjects: true,
          includeReports: true
        }
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Settings</h1>
          <p className="text-muted-foreground">
            Customize your organizational operations and preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <Switch
                  id="sms-notifications"
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, sms: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    } : null)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="farmer-updates">Farmer Updates</Label>
                <Switch
                  id="farmer-updates"
                  checked={settings.notifications.farmerUpdates}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, farmerUpdates: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="project-updates">Project Updates</Label>
                <Switch
                  id="project-updates"
                  checked={settings.notifications.projectUpdates}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, projectUpdates: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="grant-opportunities">Grant Opportunities</Label>
                <Switch
                  id="grant-opportunities"
                  checked={settings.notifications.grantOpportunities}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, grantOpportunities: checked }
                    } : null)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your data visibility and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value: 'public' | 'private' | 'farmers') =>
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
                    <SelectItem value="farmers">Farmers Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-location">Show Location</Label>
                <Switch
                  id="show-location"
                  checked={settings.privacy.showLocation}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, showLocation: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-farmer-count">Show Farmer Count</Label>
                <Switch
                  id="show-farmer-count"
                  checked={settings.privacy.showFarmerCount}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, showFarmerCount: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <Switch
                  id="two-factor"
                  checked={settings.security.twoFactorEnabled}
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

        {/* Operational Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Operational Preferences
            </CardTitle>
            <CardDescription>Customize your organizational operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="communication-method">Preferred Communication</Label>
                <Select
                  value={settings.operational.preferredCommunicationMethod}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      operational: { ...prev.operational, preferredCommunicationMethod: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {communicationMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-frequency">Meeting Frequency</Label>
                <Select
                  value={settings.operational.meetingFrequency}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      operational: { ...prev.operational, meetingFrequency: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingFrequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-approval">Auto Approval</Label>
                <Switch
                  id="auto-approval"
                  checked={settings.operational.autoApproval}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      operational: { ...prev.operational, autoApproval: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quality-monitoring">Quality Monitoring</Label>
                <Switch
                  id="quality-monitoring"
                  checked={settings.operational.qualityMonitoring}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      operational: { ...prev.operational, qualityMonitoring: checked }
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
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>Set your local preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.preferences.language}
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
                  value={settings.preferences.currency}
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
                <Label htmlFor="dashboard-layout">Dashboard Layout</Label>
                <Select
                  value={settings.preferences.dashboardLayout}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, dashboardLayout: value }
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
            <Lock className="mr-2 h-4 w-4" />
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your organizational data and exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-backup">Auto Backup</Label>
                <Switch
                  id="auto-backup"
                  checked={settings.data.autoBackup}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, autoBackup: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sync-farmers">Sync with Farmers</Label>
                <Switch
                  id="sync-farmers"
                  checked={settings.data.syncWithFarmers}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, syncWithFarmers: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="data-sharing">Data Sharing</Label>
                <Switch
                  id="data-sharing"
                  checked={settings.data.dataSharing}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, dataSharing: checked }
                    } : null)
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format</Label>
                <Select
                  value={settings.data.exportFormat}
                  onValueChange={(value: 'csv' | 'json' | 'pdf') =>
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
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportData} disabled={exporting} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export Partner Data"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
