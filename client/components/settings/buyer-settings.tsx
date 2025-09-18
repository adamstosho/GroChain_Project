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
  ShoppingCart,
  Truck,
  Banknote,
  Package,
  Store,
  TrendingUp
} from "lucide-react"

interface BuyerSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    orderUpdates: boolean
    shipmentTracking: boolean
    priceAlerts: boolean
    promotions: boolean
    paymentReminders: boolean
    qualityReports: boolean
    supplierUpdates: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'suppliers'
    showLocation: boolean
    showContact: boolean
    showFinancial: boolean
    showOrderHistory: boolean
    showPreferences: boolean
  }
  purchasing: {
    preferredCropTypes: string[]
    qualityStandards: string[]
    paymentTerms: string[]
    deliveryPreferences: string[]
    autoReorder: boolean
    bulkOrderDiscounts: boolean
    qualityAssurance: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
    timezone: string
    dateFormat: string
    measurementUnit: 'metric' | 'imperial'
    orderNotifications: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    loginNotifications: boolean
    passwordExpiry: number
    biometricAuth: boolean
    paymentVerification: boolean
  }
  data: {
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    retentionPeriod: number
    exportFormat: 'csv' | 'json' | 'pdf'
    syncWithSuppliers: boolean
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

const cropTypes = [
  'Grains', 'Vegetables', 'Fruits', 'Tubers', 'Legumes', 'Oil Seeds',
  'Spices', 'Herbs', 'Nuts', 'Coffee', 'Cocoa', 'Tea'
]

const qualityStandards = [
  'Premium Grade A', 'Standard Grade B', 'Basic Grade C',
  'Organic Certified', 'Fair Trade', 'Local Sourced',
  'Export Quality', 'Processing Grade'
]

const paymentTerms = [
  'Immediate Payment', '7 Days', '14 Days', '30 Days',
  '45 Days', '60 Days', '90 Days', 'Credit Line'
]

const deliveryPreferences = [
  'Same Day', 'Next Day', '2-3 Days', '1 Week',
  'Scheduled Delivery', 'Pickup', 'Express Shipping'
]

export function BuyerSettings() {
  const [settings, setSettings] = useState<BuyerSettings | null>(null)
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
        apiService.get('/api/users/preferences/me'),
        apiService.get('/api/users/settings/me')
      ])

      // Combine and set default values
      const defaultSettings: BuyerSettings = {
        notifications: {
          email: true,
          sms: true,
          push: false,
          orderUpdates: true,
          shipmentTracking: true,
          priceAlerts: true,
          promotions: false,
          paymentReminders: true,
          qualityReports: true,
          supplierUpdates: true
        },
        privacy: {
          profileVisibility: 'suppliers',
          showLocation: true,
          showContact: false,
          showFinancial: false,
          showOrderHistory: true,
          showPreferences: false
        },
        purchasing: {
          preferredCropTypes: ['Grains', 'Vegetables'],
          qualityStandards: ['Premium Grade A', 'Standard Grade B'],
          paymentTerms: ['30 Days', 'Immediate Payment'],
          deliveryPreferences: ['2-3 Days', 'Scheduled Delivery'],
          autoReorder: false,
          bulkOrderDiscounts: true,
          qualityAssurance: true
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          dateFormat: 'DD/MM/YYYY',
          measurementUnit: 'metric',
          orderNotifications: true
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
          passwordExpiry: 90,
          biometricAuth: false,
          paymentVerification: true
        },
        data: {
          autoBackup: true,
          backupFrequency: 'weekly',
          retentionPeriod: 365,
          exportFormat: 'csv',
          syncWithSuppliers: true
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
          purchasing: settings.purchasing,
          preferences: settings.preferences
        }),
        apiService.put('/api/users/settings/me', {
          privacy: settings.privacy,
          security: settings.security,
          data: settings.data
        })
      ])
      
      toast({
        title: "Settings Saved Successfully! 🎉",
        description: "Your purchasing preferences have been updated.",
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
      
      await apiService.post('/api/users/change-password', {
        currentPassword,
        newPassword
      })
      
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
        dataType: 'buyer-data',
        filename: `purchasing-data-${new Date().toISOString().split('T')[0]}.csv`,
        filters: {
          includeOrders: true,
          includePayments: true,
          includeShipments: true
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
          <h1 className="text-3xl font-bold tracking-tight">Buyer Settings</h1>
          <p className="text-muted-foreground">
            Customize your purchasing experience and preferences
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
                <Label htmlFor="order-updates">Order Updates</Label>
                <Switch
                  id="order-updates"
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, orderUpdates: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shipment-tracking">Shipment Tracking</Label>
                <Switch
                  id="shipment-tracking"
                  checked={settings.notifications.shipmentTracking}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, shipmentTracking: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="price-alerts">Price Alerts</Label>
                <Switch
                  id="price-alerts"
                  checked={settings.notifications.priceAlerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, priceAlerts: checked }
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
                  onValueChange={(value: 'public' | 'private' | 'suppliers') =>
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
                    <SelectItem value="suppliers">Suppliers Only</SelectItem>
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
                <Label htmlFor="show-order-history">Show Order History</Label>
                <Switch
                  id="show-order-history"
                  checked={settings.privacy.showOrderHistory}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      privacy: { ...prev.privacy, showOrderHistory: checked }
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

        {/* Purchasing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchasing Preferences
            </CardTitle>
            <CardDescription>Customize your buying experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
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
                    <SelectItem value="metric">Metric (kg, tons)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, tons)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-reorder">Auto Reorder</Label>
                <Switch
                  id="auto-reorder"
                  checked={settings.purchasing.autoReorder}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      purchasing: { ...prev.purchasing, autoReorder: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-discounts">Bulk Order Discounts</Label>
                <Switch
                  id="bulk-discounts"
                  checked={settings.purchasing.bulkOrderDiscounts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      purchasing: { ...prev.purchasing, bulkOrderDiscounts: checked }
                    } : null)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quality-assurance">Quality Assurance</Label>
                <Switch
                  id="quality-assurance"
                  checked={settings.purchasing.qualityAssurance}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      purchasing: { ...prev.purchasing, qualityAssurance: checked }
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
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.preferences.timezone}
                  onValueChange={(value) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, timezone: value }
                    } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
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
          <CardDescription>Manage your purchasing data and exports</CardDescription>
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
                <Label htmlFor="sync-suppliers">Sync with Suppliers</Label>
                <Switch
                  id="sync-suppliers"
                  checked={settings.data.syncWithSuppliers}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, syncWithSuppliers: checked }
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
                {exporting ? "Exporting..." : "Export Purchasing Data"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
