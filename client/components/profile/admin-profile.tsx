"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { 
  User, 
  Shield, 
  Activity, 
  Bell, 
  Camera, 
  Key, 
  Settings, 
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Eye,
  EyeOff
} from "lucide-react"

interface AdminProfileData {
  _id: string
  name: string
  email: string
  phone: string
  location?: string
  avatar?: string
  employeeId: string
  department: string
  position: string
  accessLevel: string
  permissions: string[]
  officeLocation: {
    address: string
    city: string
    state: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  contactInfo: {
    workPhone: string
    extension: string
    emergencyContact: string
    emergencyPhone: string
  }
  preferences: {
    preferredCommunicationMethod: string
    preferredReportFormat: string
    dashboardLayout: string
    notificationPreferences: string[]
  }
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    twoFactorAuth: boolean
    sessionTimeout: number
    privacyLevel: string
  }
  verificationStatus: string
  verificationDocuments: Array<{
    type: string
    url: string
    verified: boolean
    uploadedAt: Date
  }>
  performanceMetrics: {
    totalUsersManaged: number
    totalReportsGenerated: number
    averageResponseTime: number
    systemUptime: number
    userSatisfaction: number
  }
  isActive: boolean
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

interface ActivityLog {
  id: string
  action: string
  description: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  status: 'success' | 'failed' | 'warning'
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  lastPasswordChange: Date
  passwordExpiry: Date
  loginAttempts: number
  lastLogin: Date
  trustedDevices: Array<{
    id: string
    name: string
    lastUsed: Date
    location: string
  }>
}

export function AdminProfile() {
  const { user, isAuthenticated, hasHydrated, updateUserAvatar } = useAuthStore()
  const [profile, setProfile] = useState<AdminProfileData | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<AdminProfileData>>({})
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [avatarKey, setAvatarKey] = useState(Date.now()) // For cache busting
  const { toast } = useToast()

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role === 'admin') {
      fetchProfileData()
    } else if (hasHydrated && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your profile",
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (hasHydrated && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }, [hasHydrated, isAuthenticated, user?.role])

  // Also fetch profile data when user data becomes available
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user && user.role === 'admin' && !profile) {
      fetchProfileData()
    }
  }, [hasHydrated, isAuthenticated, user, profile])

  // Initialize profile with user data if profile is empty
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user && user.role === 'admin' && (!profile || !profile.name)) {
      const initialProfile: AdminProfileData = {
        _id: user._id || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        avatar: user.profile?.avatar || '',
        employeeId: `ADM-${user._id?.toString().slice(-6) || '000000'}`,
        department: 'IT',
        position: 'System Administrator',
        accessLevel: 'admin',
        permissions: ['user_management', 'system_configuration', 'data_management', 'security_settings'],
        officeLocation: {
          address: user.location || 'Remote work',
          city: 'Lagos',
          state: 'Lagos State',
          coordinates: {
            latitude: 6.5244,
            longitude: 3.3792
          }
        },
        contactInfo: {
          workPhone: user.phone || '',
          extension: '',
          emergencyContact: '',
          emergencyPhone: ''
        },
        preferences: {
          preferredCommunicationMethod: 'email',
          preferredReportFormat: 'pdf',
          dashboardLayout: 'detailed',
          notificationPreferences: ['system_alerts', 'user_management']
        },
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: false,
          twoFactorAuth: true,
          sessionTimeout: 30,
          privacyLevel: 'staff'
        },
        verificationStatus: 'verified',
        verificationDocuments: [],
        performanceMetrics: {
          totalUsersManaged: 25,
          totalReportsGenerated: 12,
          averageResponseTime: 145,
          systemUptime: 99.2,
          userSatisfaction: 4.5
        },
        isActive: true,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setProfile(initialProfile)
      setEditData(initialProfile)
    }
  }, [hasHydrated, isAuthenticated, user, profile])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)

      console.log('Fetching admin profile data...')

      // Check authentication before making requests
      if (!isAuthenticated || !user || user.role !== 'admin') {
        throw new Error('User not authenticated or not an admin')
      }

      // Get all data in parallel for better performance
      const [profileResponse, activityResponse, securityResponse] = await Promise.allSettled([
        apiService.getAdminProfile(),
        apiService.get('/api/admin/profile/activity'),
        apiService.get('/api/admin/profile/security')
      ])

      // Handle profile data
      if (profileResponse.status === 'fulfilled') {
        let profileData: AdminProfileData

        // Check if data is nested under 'profile' key (from user endpoint)
        // or directly in 'data' (from admin endpoint)
        const responseData = profileResponse.value.data as any
        if (responseData && typeof responseData === 'object' && responseData.profile) {
          profileData = responseData.profile
        } else {
          profileData = responseData
        }

        console.log('Profile data loaded:', {
          name: profileData?.name,
          email: profileData?.email,
          phone: profileData?.phone
        })

        setProfile(profileData)
        setEditData(profileData)
      } else {
        console.error('❌ Profile fetch failed:', profileResponse.reason)
        throw profileResponse.reason
      }

      // Handle activity logs (optional)
      if (activityResponse.status === 'fulfilled') {
        setActivityLogs(activityResponse.value.data?.logs || [])
      } else {
        console.warn('Could not load activity logs:', activityResponse.reason)
        setActivityLogs([]) // Set empty array if failed
      }

      // Handle security settings (optional)
      if (securityResponse.status === 'fulfilled') {
        setSecuritySettings(securityResponse.value.data)
      } else {
        console.warn('Could not load security settings:', securityResponse.reason)
        setSecuritySettings(null) // Set null if failed
      }

    } catch (error: any) {
      console.error('Error fetching profile data:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        endpoint: error.endpoint
      })

      // Check if it's an authentication error
      if (error.status === 401 || error.message?.includes('Unauthorized') || error.message?.includes('No token')) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your profile.",
          variant: "destructive",
        })
        return
      }

      // Check if it's a forbidden error (not admin)
      if (error.status === 403 || error.message?.includes('Forbidden')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this admin profile.",
          variant: "destructive",
        })
        return
      }

      // Check if it's a not found error
      if (error.status === 404) {
        toast({
          title: "Profile Not Found",
          description: "Admin profile not found. Please contact support.",
          variant: "destructive",
        })
        return
      }

      // Check if it's a network error
      if (error.message?.includes('Network error') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection.",
          variant: "destructive",
        })
        return
      }

      // Check if it's a server error
      if (error.status >= 500) {
        toast({
          title: "Server Error",
          description: "Server is experiencing issues. Please try again later.",
          variant: "destructive",
        })
        return
      }

      // Generic error with more details
      const errorMessage = error.message || "Failed to load profile data. Please try again."
      toast({
        title: "Error Loading Profile",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await apiService.updateAdminProfile(editData)
      await fetchProfileData()
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await apiService.post('/api/admin/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsLoading(true)

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file",
          variant: "destructive",
        })
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await apiService.uploadAvatar(formData, true)

      // Check if the response was successful
      if (response && response.status === 'success') {
        console.log('Avatar uploaded successfully')

        // Update the avatar key to bust cache
        const newAvatarKey = Date.now()
        setAvatarKey(newAvatarKey)

        // Update the profile state immediately with the new avatar URL
        setProfile(prevProfile => {
          if (!prevProfile) return prevProfile
          return {
            ...prevProfile,
            avatar: response.data.avatar
          } as AdminProfileData
        })

        // Also update editData to keep it in sync
        setEditData(prevEditData => ({
          ...prevEditData,
          avatar: response.data.avatar
        }))

        // Update the auth store avatar so it reflects in sidebar and header
        updateUserAvatar(response.data.avatar)


        // Fetch updated profile data from server to ensure consistency
        await fetchProfileData()

        toast({
          title: "Success",
          description: "Avatar updated successfully",
        })
      } else {
        throw new Error(response?.message || 'Failed to upload avatar')
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData(profile || {})
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditData(prev => {
      const current = prev || {}
      const parentObj = (current[parent as keyof typeof current] as object) || {}
      return {
        ...current,
        [parent]: {
          ...parentObj,
          [field]: value
        }
      }
    })
  }

  // Show loading spinner while auth store is hydrating or data is loading
  if (!hasHydrated || isLoading) {
    return <LoadingSpinner />
  }

  // Show error message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access your profile</p>
        </div>
      </div>
    )
  }

  // Show error message if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page</p>
        </div>
      </div>
    )
  }

        // Show error message if no profile data
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Unavailable</h3>
          <p className="text-muted-foreground mb-4">Unable to load profile information</p>
          <Button
            onClick={() => fetchProfileData()}
            className="mt-2"
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? "Loading..." : "Try Again"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">
            Manage your administrative profile and system access
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isLoading}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage
                  src={profile.avatar ? `${profile.avatar}?t=${avatarKey}` : undefined}
                  alt={profile.name}
                  onError={(e) => {
                    console.error('Avatar failed to load')
                  }}
                  onLoad={() => {
                    console.log('Avatar loaded successfully')
                  }}
                />
                <AvatarFallback className="text-sm sm:text-lg">
                  {profile.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 h-6 w-6 sm:h-8 sm:w-8 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold truncate">{profile.name || 'Admin User'}</h2>
              <p className="text-muted-foreground text-sm sm:text-base truncate">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="profile" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Auth</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your employment and role details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <p className="text-sm font-medium">
                    {profile && profile.name ? profile.name : (user?.name || "Loading...")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm font-medium">
                    {profile && profile.email ? profile.email : (user?.email || "Loading...")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile && profile.phone ? profile.phone : (user?.phone || "Add phone number")}
                    </p>
                  )}
                </div>



              </CardContent>
            </Card>

            {/* Office Location */}
            <Card>
              <CardHeader>
                <CardTitle>Office Location</CardTitle>
                <CardDescription>Your work location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={editData.officeLocation?.address || ""}
                      onChange={(e) => handleNestedChange("officeLocation", "address", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{profile?.officeLocation?.address || profile?.location || "Remote work"}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={editData.officeLocation?.city || ""}
                        onChange={(e) => handleNestedChange("officeLocation", "city", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm">{profile?.officeLocation?.city || "Lagos"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        value={editData.officeLocation?.state || ""}
                        onChange={(e) => handleNestedChange("officeLocation", "state", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm">{profile?.officeLocation?.state || "Lagos State"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Your work contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workPhone">Work Phone</Label>
                  {isEditing ? (
                    <Input
                      id="workPhone"
                      value={editData.contactInfo?.workPhone || ""}
                      onChange={(e) => handleNestedChange("contactInfo", "workPhone", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{profile?.contactInfo?.workPhone || profile?.phone || "Add work phone"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extension">Extension</Label>
                  {isEditing ? (
                    <Input
                      id="extension"
                      value={editData.contactInfo?.extension || ""}
                      onChange={(e) => handleNestedChange("contactInfo", "extension", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{profile.contactInfo?.extension || "N/A"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContact"
                      value={editData.contactInfo?.emergencyContact || ""}
                      onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{profile.contactInfo?.emergencyContact || "Add emergency contact"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyPhone"
                      value={editData.contactInfo?.emergencyPhone || ""}
                      onChange={(e) => handleNestedChange("contactInfo", "emergencyPhone", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{profile.contactInfo?.emergencyPhone || "Add emergency phone"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Your administrative performance statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {profile?.performanceMetrics?.totalUsersManaged || 25}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Users Managed</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {profile?.performanceMetrics?.totalReportsGenerated || 12}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Reports Generated</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {profile?.performanceMetrics?.averageResponseTime || 145}ms
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {profile?.performanceMetrics?.systemUptime || 99.2}%
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">System Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Password Management</span>
                </CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Two-Factor Authentication</span>
                </CardTitle>
                <CardDescription>Secure your account with 2FA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => {
                      // Handle 2FA toggle
                      toast({
                        title: "2FA Update",
                        description: checked ? "2FA enabled" : "2FA disabled",
                      })
                    }}
                  />
                </div>

                {securitySettings?.lastPasswordChange && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Last Password Change</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(securitySettings.lastPasswordChange).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {securitySettings?.lastLogin && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(securitySettings.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trusted Devices */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Trusted Devices</CardTitle>
                <CardDescription>Manage devices that can access your account</CardDescription>
              </CardHeader>
              <CardContent>
                {securitySettings?.trustedDevices && securitySettings.trustedDevices.length > 0 ? (
                  <div className="space-y-3">
                    {securitySettings.trustedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Last used: {new Date(device.lastUsed).toLocaleDateString()} • {device.location}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No trusted devices found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Activity Log</span>
              </CardTitle>
              <CardDescription>Recent administrative activities and system access</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        log.status === 'success' ? 'bg-green-100 text-green-600' :
                        log.status === 'failed' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {log.status === 'success' ? <CheckCircle className="h-4 w-4" /> :
                         log.status === 'failed' ? <AlertCircle className="h-4 w-4" /> :
                         <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">{log.action}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activity logs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={editData.settings?.emailNotifications || false}
                    onCheckedChange={(checked) => handleNestedChange("settings", "emailNotifications", checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={editData.settings?.smsNotifications || false}
                    onCheckedChange={(checked) => handleNestedChange("settings", "smsNotifications", checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={editData.settings?.pushNotifications || false}
                    onCheckedChange={(checked) => handleNestedChange("settings", "pushNotifications", checked)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>
                <div className="grid gap-3">
                  {[
                    'System Alerts',
                    'User Management',
                    'Security Events',
                    'Report Generation'
                  ].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type.toLowerCase().replace(' ', '-')}
                        checked={editData.preferences?.notificationPreferences?.includes(type.toLowerCase().replace(' ', '_')) || false}
                        onChange={(e) => {
                          const current = editData.preferences?.notificationPreferences || []
                          if (e.target.checked) {
                            handleNestedChange("preferences", "notificationPreferences", [...current, type.toLowerCase().replace(' ', '_')])
                          } else {
                            handleNestedChange("preferences", "notificationPreferences", current.filter(p => p !== type.toLowerCase().replace(' ', '_')))
                          }
                        }}
                        disabled={!isEditing}
                        className="rounded"
                      />
                      <Label htmlFor={type.toLowerCase().replace(' ', '-')}>{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>Configure your system preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredCommunicationMethod">Preferred Communication</Label>
                  {isEditing ? (
                    <Select
                      value={editData.preferences?.preferredCommunicationMethod || ""}
                      onValueChange={(value) => handleNestedChange("preferences", "preferredCommunicationMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.preferredCommunicationMethod?.replace('_', ' ') || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredReportFormat">Report Format</Label>
                  {isEditing ? (
                    <Select
                      value={editData.preferences?.preferredReportFormat || ""}
                      onValueChange={(value) => handleNestedChange("preferences", "preferredReportFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.preferredReportFormat?.replace('_', ' ') || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                  {isEditing ? (
                    <Select
                      value={editData.preferences?.dashboardLayout || ""}
                      onValueChange={(value) => handleNestedChange("preferences", "dashboardLayout", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm capitalize">{profile.preferences?.dashboardLayout || "Not specified"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  {isEditing ? (
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={editData.settings?.sessionTimeout || ""}
                      onChange={(e) => handleNestedChange("settings", "sessionTimeout", Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-sm">{profile.settings?.sessionTimeout || "Not specified"} minutes</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions & Access</CardTitle>
                <CardDescription>Your system access permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>System Permissions</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {[
                        'user_management',
                        'system_configuration',
                        'data_management',
                        'security_settings'
                      ].map((permission) => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editData.permissions?.includes(permission) || false}
                            onChange={(e) => {
                              const current = editData.permissions || []
                              if (e.target.checked) {
                                handleInputChange("permissions", [...current, permission])
                              } else {
                                handleInputChange("permissions", current.filter(p => p !== permission))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.permissions?.map((permission) => (
                        <Badge key={permission} variant="secondary" className="capitalize">
                          {permission.replace('_', ' ')}
                        </Badge>
                      )) || <p className="text-sm text-muted-foreground">No permissions specified</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

