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
  MapPin,
  Wheat,
  Banknote,
  Upload,
  Camera
} from "lucide-react"

interface FarmerSettings {
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
    harvestUpdates: boolean
    marketplaceUpdates: boolean
    financialUpdates: boolean
    systemUpdates: boolean
    weatherAlerts: boolean
    approvalNotifications: boolean
  }
  preferences: {
    cropTypes: string[]
    locations: string[]
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

export function SettingsForm() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<FarmerSettings>({
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
      harvestUpdates: true,
      marketplaceUpdates: true,
      financialUpdates: true,
      systemUpdates: true,
      weatherAlerts: true,
      approvalNotifications: true
    },
    preferences: {
      cropTypes: [],
      locations: [],
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      console.log('Loading settings...')
      const response = await apiService.getMySettings()
      console.log('Settings response:', response)

      if (response.status === 'success') {
        const data = response.data
        console.log('Settings data:', data)

        setSettings({
          general: (data as any).general || settings.general,
          notifications: (data as any).notifications || settings.notifications,
          preferences: (data as any).preferences || settings.preferences,
          security: (data as any).security || settings.security,
          passwordData: settings.passwordData,
          profile: (data as any).profile || {
            bio: user?.profile?.bio || "",
            address: user?.profile?.address || "",
            city: user?.profile?.city || "",
            state: user?.profile?.state || "",
            country: user?.profile?.country || "Nigeria",
            postalCode: user?.profile?.postalCode || "",
            avatar: user?.profile?.avatar || null
          }
        })

        console.log('Settings state updated with profile:', (data as any).profile)
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

  const handleNotificationToggle = (key: keyof FarmerSettings['notifications']) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    })
  }

  const handleSecurityToggle = (key: keyof FarmerSettings['security']) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [key]: !settings.security[key]
      }
    })
  }

  const handleGeneralSettingChange = (key: keyof FarmerSettings['general'], value: string) => {
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [key]: value
      }
    })
  }

  const handlePreferenceToggle = (key: keyof FarmerSettings['preferences'], value: boolean) => {
    if (key === 'organicPreference') {
      setSettings({
        ...settings,
        preferences: {
          ...settings.preferences,
          [key]: value
        }
      })
    }
  }

  const handleProfileChange = (key: keyof FarmerSettings['profile'], value: string) => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [key]: value
      }
    })
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

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
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save settings",
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

        // Clear password fields
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
        // Update user in auth store
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

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      setIsSaving(true)
      console.log('Starting avatar upload...')

      // Upload avatar using the API service
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      const response = await apiService.uploadAvatar(formData)
      console.log('Avatar upload response:', response)

      if (response.status === 'success') {
        // Update the auth store with the new avatar
        const avatarUrl = response.data?.avatarUrl
        console.log('New avatar URL:', avatarUrl)

        if (avatarUrl && user) {
          const updatedUser = {
            ...user,
            profile: {
              ...user.profile,
              avatar: avatarUrl
            }
          }
          console.log('Updating user in auth store:', updatedUser)
          updateUser(updatedUser)
        }

        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully",
          variant: "default"
        })

        // Clear the file and preview
        setAvatarFile(null)
        setAvatarPreview(null)

        // Refresh settings to show updated avatar
        await loadSettings()
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error uploading avatar",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Farmer Settings
            </CardTitle>
            <CardDescription>
              Loading your settings...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Farmer Settings
          </CardTitle>
          <CardDescription>
            Manage your profile, preferences, notifications, and security settings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profile?.avatar ? (
                    <img
                      src={user.profile.avatar.startsWith('http')
                        ? `${user.profile.avatar}?t=${Date.now()}`
                        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/users/avatar/${user.profile.avatar}?t=${Date.now()}`
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                      key={`${user.profile.avatar}-${Date.now()}`} // Force re-render when avatar changes
                      onError={(e) => {
                        console.error('Avatar failed to load:', e.currentTarget.src)
                        const target = e.currentTarget as HTMLImageElement

                        // If it's already a Cloudinary URL, don't try fallback
                        if (user?.profile?.avatar?.startsWith('http') && target.src.includes('cloudinary')) {
                          console.log('Cloudinary URL failed, no fallback available')
                          return
                        }

                        // Try fallback to direct static URL if it's not already a full URL
                        if (!user?.profile?.avatar?.startsWith('http') && !target.src.includes('/api/users/avatar/')) {
                          const fallbackSrc = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/users/avatar/${user?.profile?.avatar}?t=${Date.now()}`
                          console.log('Trying fallback URL:', fallbackSrc)
                          target.src = fallbackSrc
                        }
                      }}
                      onLoad={() => {
                        console.log('Avatar loaded successfully:', user?.profile?.avatar)
                      }}
                    />
                  ) : null}
                  {!avatarPreview && !user?.profile?.avatar && (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                  {/* Hidden fallback avatar for error cases */}
                  <div className="avatar-fallback absolute inset-0 w-full h-full rounded-full bg-gray-200 flex items-center justify-center hidden">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a new profile picture
                </p>
                {avatarFile && (
                  <Button onClick={handleAvatarUpload} disabled={isSaving} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    {isSaving ? 'Uploading...' : 'Upload Avatar'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={settings.profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.profile.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                placeholder="Your address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.profile.city}
                onChange={(e) => handleProfileChange('city', e.target.value)}
                placeholder="Your city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={settings.profile.state}
                onChange={(e) => handleProfileChange('state', e.target.value)}
                placeholder="Your state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={settings.profile.country}
                onChange={(e) => handleProfileChange('country', e.target.value)}
                placeholder="Your country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={settings.profile.postalCode}
                onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                placeholder="Your postal code"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure your general application preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.general.language}
                onValueChange={(value) => handleGeneralSettingChange('language', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.general.timezone}
                onValueChange={(value) => handleGeneralSettingChange('timezone', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.general.currency}
                onValueChange={(value) => handleGeneralSettingChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.general.theme}
                onValueChange={(value) => handleGeneralSettingChange('theme', value)}
              >
                <SelectTrigger>
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
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Communication Channels</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={() => handleNotificationToggle('email')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={() => handleNotificationToggle('sms')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via push notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={() => handleNotificationToggle('push')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
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
            <Label className="text-base font-medium">Notification Types</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Harvest Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about harvest submissions and approvals
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.harvestUpdates}
                  onCheckedChange={() => handleNotificationToggle('harvestUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketplace Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about marketplace activities
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketplaceUpdates}
                  onCheckedChange={() => handleNotificationToggle('marketplaceUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Financial Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about payments and commissions
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.financialUpdates}
                  onCheckedChange={() => handleNotificationToggle('financialUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weather Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Weather-related notifications and alerts
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weatherAlerts}
                  onCheckedChange={() => handleNotificationToggle('weatherAlerts')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Approval Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about pending approvals
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.approvalNotifications}
                  onCheckedChange={() => handleNotificationToggle('approvalNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">
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
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
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
              <div className="space-y-0.5">
                <Label>Login Notifications</Label>
                <p className="text-sm text-muted-foreground">
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
            <Label className="text-base font-medium">Session Management</Label>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
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
                <SelectTrigger>
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
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Farmer Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wheat className="h-5 w-5 mr-2" />
            Farming Preferences
          </CardTitle>
          <CardDescription>
            Set your farming preferences and marketplace settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Crop Types</Label>
              <p className="text-sm text-muted-foreground">
                Select the types of crops you typically grow
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
                  >
                    {crop}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Organic Farming</Label>
                <p className="text-sm text-muted-foreground">
                  Prefer organic farming products and practices
                </p>
              </div>
              <Switch
                checked={settings.preferences.organicPreference}
                onCheckedChange={(value) => handlePreferenceToggle('organicPreference', value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin">Minimum Price Range</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">Maximum Price Range</Label>
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
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handlePasswordChange}
                disabled={isSaving || !settings.passwordData.currentPassword || !settings.passwordData.newPassword || !settings.passwordData.confirmPassword}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
