"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useExportService } from "@/lib/export-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save, Bell, Shield, Globe, Lock, Download } from "lucide-react"

interface FarmerSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    harvest: boolean
    weather: boolean
    marketAlerts: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'partners'
    showLocation: boolean
    showFarmDetails: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
    timezone: string
    measurementUnit: 'metric' | 'imperial'
  }
  security: {
    twoFactorEnabled: boolean
    loginNotifications: boolean
  }
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ha', name: 'Hausa' }
]

const currencies = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
]

const timezones = [
  'Africa/Lagos',
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Cairo'
]

export function FarmerSettings() {
  const [settings, setSettings] = useState<FarmerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [exporting, setExporting] = useState(false)

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
        apiService.get('/api/users/preferences/me'),
        apiService.get('/api/users/settings/me')
      ])

      // Set default values
      const defaultSettings: FarmerSettings = {
        notifications: {
          email: true,
          sms: true,
          push: false,
          harvest: true,
          weather: true,
          marketAlerts: true
        },
        privacy: {
          profileVisibility: 'partners',
          showLocation: true,
          showFarmDetails: true
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          measurementUnit: 'metric'
        },
        security: {
          twoFactorEnabled: false,
          loginNotifications: true
        }
      }

      // Merge with API response
      const mergedSettings = {
        ...defaultSettings,
        ...preferencesResponse?.data,
        ...settingsResponse?.data
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
        apiService.put('/api/users/preferences/me', {
          notifications: settings.notifications,
          preferences: settings.preferences
        }),
        apiService.put('/api/users/settings/me', {
          privacy: settings.privacy,
          security: settings.security
        })
      ])
      
      toast({
        title: "Settings Saved!",
        description: "Your preferences have been updated successfully.",
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
      
      await apiService.post('/api/users/change-password', {
        currentPassword,
        newPassword
      })
      
      toast({
        title: "Password Changed!",
        description: "Your password has been updated successfully.",
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
        format: 'csv',
        dataType: 'farmer-data',
        filename: `farming-data-${new Date().toISOString().split('T')[0]}.csv`
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
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and security
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
                <Label htmlFor="harvest-reminders">Harvest Reminders</Label>
                <Switch
                  id="harvest-reminders"
                  checked={settings.notifications.harvest}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, harvest: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weather-alerts">Weather Alerts</Label>
                <Switch
                  id="weather-alerts"
                  checked={settings.notifications.weather}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, weather: checked }
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
                  onValueChange={(value: 'public' | 'private' | 'partners') =>
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
                    <SelectItem value="partners">Partners Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-location">Show Farm Location</Label>
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
                        {lang.name}
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
                <Label htmlFor="measurement-unit">Measurement Unit</Label>
                <Select
                  value={settings.preferences.measurementUnit}
                  onValueChange={(value: 'metric' | 'imperial') =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, measurementUnit: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, ha)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, acres)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>Export your farming data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Download your farming data including harvests, marketplace activity, and financial records.
              </p>
              <Button onClick={handleExportData} disabled={exporting} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export Farming Data"}
              </Button>
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
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
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
    </div>
  )
}
