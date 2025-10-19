"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth"
import { apiService } from "@/lib/api"
import {
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  Save,
  Settings,
  User,
  Globe,
  Moon,
  Sun,
  Lock,
  ShoppingCart,
  Upload,
  Camera
} from "lucide-react"

interface BuyerSettings {
  general: {
    language: string
    timezone: string
    currency: string
    theme: string
  }
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
    orderUpdates: boolean
    marketplaceUpdates: boolean
    priceAlerts: boolean
    newProducts: boolean
    systemUpdates: boolean
  }
  preferences: {
    cropTypes: string[]
    priceRange: {
      min: number
      max: number
    }
    qualityPreferences: string[]
    organicPreference: boolean
  }
  security: {
    twoFactorAuth: boolean
    loginNotifications: boolean
    sessionTimeout: number
  }
  passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  profile: {
    bio: string
    address: string
    city: string
    state: string
    country: string
    postalCode: string
  }
}

export function BuyerSettingsForm() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<BuyerSettings>({
    general: {
      language: 'en',
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      theme: 'auto'
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      inApp: true,
      orderUpdates: true,
      marketplaceUpdates: true,
      priceAlerts: true,
      newProducts: true,
      systemUpdates: true
    },
    preferences: {
      cropTypes: [],
      priceRange: { min: 0, max: 100000 },
      qualityPreferences: [],
      organicPreference: false
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
      sessionTimeout: 60
    },
    passwordData: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    profile: {
      bio: "",
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
      postalCode: ""
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getMySettings()

      if (response.status === 'success') {
        const data = response.data as any

        setSettings({
          general: data.general || settings.general,
          notifications: data.notifications || settings.notifications,
          preferences: data.preferences || settings.preferences,
          security: data.security || settings.security,
          passwordData: settings.passwordData,
          profile: data.profile || {
            bio: user?.profile?.bio || "",
            address: user?.profile?.address || "",
            city: user?.profile?.city || "",
            state: user?.profile?.state || "",
            country: user?.profile?.country || "Nigeria",
            postalCode: user?.profile?.postalCode || ""
          }
        })
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error loading settings",
        description: error.message || "Failed to load settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationToggle = (key: keyof BuyerSettings['notifications']) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    })
  }

  const handleSecurityToggle = (key: keyof BuyerSettings['security']) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [key]: !settings.security[key]
      }
    })
  }

  const handleGeneralSettingChange = (key: keyof BuyerSettings['general'], value: string) => {
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [key]: value
      }
    })
  }

  const handlePreferenceToggle = (key: keyof BuyerSettings['preferences'], value: boolean) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value
      }
    })
  }

  const handleProfileChange = (key: keyof BuyerSettings['profile'], value: string) => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [key]: value
      }
    })
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

      // Validate required settings
      if (!settings.general.language) {
        toast({
          title: "Validation Error",
          description: "Language is required",
          variant: "destructive"
        })
        return
      }

      if (!settings.general.timezone) {
        toast({
          title: "Validation Error",
          description: "Timezone is required",
          variant: "destructive"
        })
        return
      }

      const updateData = {
        general: settings.general,
        notifications: settings.notifications,
        preferences: settings.preferences,
        security: settings.security
      }

      const response = await apiService.updateMySettings(updateData)

      if (response.status === 'success') {
        toast({
          title: "Settings saved",
          description: "Your settings have been updated successfully",
          variant: "default"
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      
      // Handle different types of errors
      let errorMessage = "Failed to save settings. Please try again."
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes('validation')) {
        errorMessage = error.message
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "Session expired. Please log in again."
      }
      
      toast({
        title: "Error saving settings",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (settings.passwordData.newPassword !== settings.passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive"
      })
      return
    }

    if (settings.passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)

      const response = await apiService.changePassword(
        settings.passwordData.currentPassword,
        settings.passwordData.newPassword
      )

      if (response.status === 'success') {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully",
          variant: "default"
        })

        setSettings({
          ...settings,
          passwordData: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }
        })
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: "Error changing password",
        description: error.message || "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true)

      const profileData = {
        profile: {
          ...settings.profile
        }
      }

      const response = await apiService.updateMyProfile(profileData)

      if (response.status === 'success') {
        updateUser(response.data as any)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Buyer Settings
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Loading your settings...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
      {/* Settings Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Buyer Settings
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your profile, preferences, notifications, and security settings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Input
                id="bio"
                value={settings.profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder="Tell us about your business..."
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                value={settings.profile.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                placeholder="Your address"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                value={settings.profile.city}
                onChange={(e) => handleProfileChange('city', e.target.value)}
                placeholder="Your city"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium">State</Label>
              <Input
                id="state"
                value={settings.profile.state}
                onChange={(e) => handleProfileChange('state', e.target.value)}
                placeholder="Your state"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">Country</Label>
              <Input
                id="country"
                value={settings.profile.country}
                onChange={(e) => handleProfileChange('country', e.target.value)}
                placeholder="Your country"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
              <Input
                id="postalCode"
                value={settings.profile.postalCode}
                onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                placeholder="Your postal code"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={isSaving} className="h-9 sm:h-10 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSaving ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            General Settings
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Configure your general application preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">Language</Label>
              <Select
                value={settings.general.language}
                onValueChange={(value) => handleGeneralSettingChange('language', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
              <Select
                value={settings.general.timezone}
                onValueChange={(value) => handleGeneralSettingChange('timezone', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">West Africa Time (WAT)</SelectItem>
                  <SelectItem value="Africa/Accra">Greenwich Mean Time (GMT)</SelectItem>
                  <SelectItem value="Africa/Cairo">Eastern European Time (EET)</SelectItem>
                  <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
              <Select
                value={settings.general.currency}
                onValueChange={(value) => handleGeneralSettingChange('currency', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
              <Select
                value={settings.general.theme}
                onValueChange={(value) => handleGeneralSettingChange('theme', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="h-9 sm:h-10 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium">Communication Channels</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={() => handleNotificationToggle('email')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">SMS Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive updates via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={() => handleNotificationToggle('sms')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Push Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive updates via push notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={() => handleNotificationToggle('push')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">In-App Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive notifications within the app
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.inApp}
                  onCheckedChange={() => handleNotificationToggle('inApp')}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium">Notification Types</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Order Updates</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Notifications about your order status
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={() => handleNotificationToggle('orderUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Marketplace Updates</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Notifications about marketplace activities
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketplaceUpdates}
                  onCheckedChange={() => handleNotificationToggle('marketplaceUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Price Alerts</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Notifications about price changes for your favorites
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.priceAlerts}
                  onCheckedChange={() => handleNotificationToggle('priceAlerts')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">New Products</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Notifications about new products matching your preferences
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.newProducts}
                  onCheckedChange={() => handleNotificationToggle('newProducts')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">System Updates</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Important system announcements and updates
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.systemUpdates}
                  onCheckedChange={() => handleNotificationToggle('systemUpdates')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="h-9 sm:h-10 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSaving ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Buying Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Buying Preferences
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Set your buying preferences and marketplace settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Crop Types</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select the types of crops you're interested in
              </p>
              <div className="flex flex-wrap gap-2">
                {['Maize', 'Rice', 'Cassava', 'Yam', 'Tomato', 'Pepper', 'Onion', 'Potato', 'Sorghum', 'Millet'].map((crop) => (
                  <Button
                    key={crop}
                    variant={settings.preferences.cropTypes.includes(crop) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newCrops = settings.preferences.cropTypes.includes(crop)
                        ? settings.preferences.cropTypes.filter(c => c !== crop)
                        : [...settings.preferences.cropTypes, crop]
                      setSettings({
                        ...settings,
                        preferences: {
                          ...settings.preferences,
                          cropTypes: newCrops
                        }
                      })
                    }}
                    className="h-8 text-xs sm:text-sm"
                  >
                    {crop}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label className="text-sm">Organic Preference</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Prefer organic farming products
                </p>
              </div>
              <Switch
                checked={settings.preferences.organicPreference}
                onCheckedChange={(value) => handlePreferenceToggle('organicPreference', value)}
              />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin" className="text-sm font-medium">Minimum Price Range (₦)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={settings.preferences.priceRange.min}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      priceRange: {
                        ...settings.preferences.priceRange,
                        min: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                  placeholder="0"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax" className="text-sm font-medium">Maximum Price Range (₦)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={settings.preferences.priceRange.max}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      priceRange: {
                        ...settings.preferences.priceRange,
                        max: parseInt(e.target.value) || 100000
                      }
                    }
                  })}
                  placeholder="100000"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="h-9 sm:h-10 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label className="text-sm">Two-Factor Authentication</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add an extra layer of security to your account (Coming Soon)
                </p>
              </div>
              <Switch
                checked={settings.security.twoFactorAuth}
                onCheckedChange={() => handleSecurityToggle('twoFactorAuth')}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label className="text-sm">Login Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Get notified of new login attempts
                </p>
              </div>
              <Switch
                checked={settings.security.loginNotifications}
                onCheckedChange={() => handleSecurityToggle('loginNotifications')}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm sm:text-base font-medium">Session Management</Label>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-sm font-medium">Session Timeout (minutes)</Label>
              <Select
                value={settings.security.sessionTimeout.toString()}
                onValueChange={(value) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    sessionTimeout: parseInt(value)
                  }
                })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="h-9 sm:h-10 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={settings.passwordData.currentPassword}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordData: {
                      ...settings.passwordData,
                      currentPassword: e.target.value
                    }
                  })}
                  placeholder="Enter current password"
                  className="h-9 sm:h-10 text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={settings.passwordData.newPassword}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordData: {
                    ...settings.passwordData,
                    newPassword: e.target.value
                  }
                })}
                placeholder="Enter new password"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={settings.passwordData.confirmPassword}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordData: {
                    ...settings.passwordData,
                    confirmPassword: e.target.value
                  }
                })}
                placeholder="Confirm new password"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button
                onClick={handlePasswordChange}
                disabled={isSaving || !settings.passwordData.currentPassword || !settings.passwordData.newPassword || !settings.passwordData.confirmPassword}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {isSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
