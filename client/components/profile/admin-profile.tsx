"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileSectionCard } from "@/components/profile/profile-section-card"
import { ProfileField } from "@/components/profile/profile-field"
import { ProfileStat } from "@/components/profile/profile-stat"
import {
  User,
  Shield,
  Activity,
  Key,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Mail,
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
  }
  contactInfo: {
    workPhone: string
    extension: string
    emergencyContact: string
    emergencyPhone: string
  }
  performanceMetrics: {
    totalUsersManaged: number
  }
  isActive: boolean
  lastActivity: string
  createdAt: string
  updatedAt: string
}

interface ActivityLog {
  id: string
  action: string
  description: string
  timestamp: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failed' | 'warning'
}

interface SecuritySettings {
  lastPasswordChange: string
  lastLogin: string
}

function AdminProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-24 sm:h-32 animate-pulse bg-muted" />
        <div className="px-4 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col items-center gap-3 sm:-mt-14 sm:flex-row sm:items-end sm:gap-5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-background bg-muted animate-pulse" />
            <div className="space-y-2 pb-1 text-center sm:text-left">
              <div className="h-6 w-40 sm:w-56 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 sm:w-36 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-9 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
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
  const { toast } = useToast()

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your profile",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    fetchProfileData()
  }, [hasHydrated, isAuthenticated, user?.role])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)

      const [profileResponse, activityResponse, securityResponse] = await Promise.allSettled([
        apiService.getAdminProfile(),
        apiService.get('/api/admin/profile/activity'),
        apiService.get('/api/admin/profile/security')
      ])

      if (profileResponse.status === 'fulfilled') {
        const profileData = profileResponse.value.data as AdminProfileData
        setProfile(profileData)
        setEditData(profileData)
      } else {
        throw profileResponse.reason
      }

      if (activityResponse.status === 'fulfilled') {
        setActivityLogs((activityResponse.value.data as any)?.logs || [])
      } else {
        setActivityLogs([])
      }

      if (securityResponse.status === 'fulfilled') {
        setSecuritySettings(securityResponse.value.data as SecuritySettings)
      } else {
        setSecuritySettings(null)
      }
    } catch (error: any) {
      console.error('Error fetching admin profile data:', error)

      if (error.status === 401 || error.message?.includes('Unauthorized') || error.message?.includes('No token')) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your profile.",
          variant: "destructive",
        })
        return
      }

      if (error.status === 403 || error.message?.includes('Forbidden')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this admin profile.",
          variant: "destructive",
        })
        return
      }

      if (error.status === 404) {
        toast({
          title: "Profile Not Found",
          description: "Admin profile not found. Please contact support.",
          variant: "destructive",
        })
        return
      }

      if (error.message?.includes('Network error') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Error Loading Profile",
        description: error.message || "Failed to load profile data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const payload = {
        name: editData.name,
        phone: editData.phone,
        adminProfile: {
          employeeId: editData.employeeId,
          department: editData.department,
          position: editData.position,
          officeAddress: editData.officeLocation?.address,
          officeCity: editData.officeLocation?.city,
          officeState: editData.officeLocation?.state,
          workPhone: editData.contactInfo?.workPhone,
          extension: editData.contactInfo?.extension,
          emergencyContact: editData.contactInfo?.emergencyContact,
          emergencyPhone: editData.contactInfo?.emergencyPhone
        }
      }
      await apiService.updateAdminProfile(payload)
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

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : prev)
    updateUserAvatar(newAvatarUrl)
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

  // Show loading skeleton while auth store is hydrating or data is loading
  if (!hasHydrated || isLoading) {
    return <AdminProfileSkeleton />
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Profile Unavailable</h3>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">Unable to load profile information</p>
        <Button onClick={() => fetchProfileData()} disabled={isLoading} size="sm">
          {isLoading ? "Loading..." : "Try Again"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileHero
        name={profile.name || 'Admin User'}
        subtitle={<>{profile.position || 'System Administrator'}{profile.department && ` • ${profile.department}`}</>}
        avatar={profile.avatar}
        isEditing={isEditing}
        isSaving={isLoading}
        onToggleEdit={() => (isEditing ? handleCancel() : setIsEditing(true))}
        onSave={handleSave}
        onAvatarUpdate={handleAvatarUpdate}
        isAdmin
        badges={
          <>
            <Badge variant={profile.isActive ? 'default' : 'secondary'} className="text-xs">
              {profile.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="text-xs">{profile.employeeId}</Badge>
          </>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1">
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
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <ProfileSectionCard icon={User} title="Basic Information" description="Your personal contact details">
              <ProfileField label="Full Name" value={editData.name || profile.name || ''} isEditing={isEditing}
                onChange={(v) => handleInputChange("name", v)} />
              <ProfileField label="Email" value={profile.email} isEditing={isEditing} locked icon={Mail} />
              <ProfileField label="Phone" value={editData.phone || profile.phone || ''} isEditing={isEditing} placeholder="Add phone number"
                onChange={(v) => handleInputChange("phone", v)} />
            </ProfileSectionCard>

            <ProfileSectionCard icon={Briefcase} title="Work Information" description="Your role within the platform" iconClassName="bg-accent/15 text-accent">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <ProfileField label="Department" value={editData.department || profile.department || ''} isEditing={isEditing}
                  onChange={(v) => handleInputChange("department", v)} />
                <ProfileField label="Position" value={editData.position || profile.position || ''} isEditing={isEditing}
                  onChange={(v) => handleInputChange("position", v)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Access Level</p>
                <Badge variant="secondary" className="capitalize">{profile.accessLevel}</Badge>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.permissions?.map((permission) => (
                    <Badge key={permission} variant="outline" className="capitalize text-xs font-normal">
                      {permission.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard icon={MapPin} title="Office Location" description="Your work location details" iconClassName="bg-secondary/15 text-secondary-foreground">
              <ProfileField label="Address" value={editData.officeLocation?.address || ''} isEditing={isEditing} type="textarea" rows={2}
                onChange={(v) => handleNestedChange("officeLocation", "address", v)} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <ProfileField label="City" value={editData.officeLocation?.city || ''} isEditing={isEditing}
                  onChange={(v) => handleNestedChange("officeLocation", "city", v)} />
                <ProfileField label="State" value={editData.officeLocation?.state || ''} isEditing={isEditing}
                  onChange={(v) => handleNestedChange("officeLocation", "state", v)} />
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard icon={Phone} title="Contact Information" description="Your work contact details" iconClassName="bg-success/15 text-success">
              <ProfileField label="Work Phone" value={editData.contactInfo?.workPhone || ''} isEditing={isEditing} placeholder="Add work phone"
                onChange={(v) => handleNestedChange("contactInfo", "workPhone", v)} />
              <ProfileField label="Extension" value={editData.contactInfo?.extension || ''} isEditing={isEditing} emptyText="N/A"
                onChange={(v) => handleNestedChange("contactInfo", "extension", v)} />
              <ProfileField label="Emergency Contact" value={editData.contactInfo?.emergencyContact || ''} isEditing={isEditing} placeholder="Add emergency contact"
                onChange={(v) => handleNestedChange("contactInfo", "emergencyContact", v)} />
              <ProfileField label="Emergency Phone" value={editData.contactInfo?.emergencyPhone || ''} isEditing={isEditing} placeholder="Add emergency phone"
                onChange={(v) => handleNestedChange("contactInfo", "emergencyPhone", v)} />
            </ProfileSectionCard>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <ProfileSectionCard icon={Users} title="Platform Overview" description="Live platform-wide stats">
              <ProfileStat icon={Users} label="Total Platform Users" value={profile.performanceMetrics?.totalUsersManaged ?? 0} />
            </ProfileSectionCard>

            <Card className="border border-border">
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Settings className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Notification & system preferences</p>
                    <p className="text-xs text-muted-foreground">Manage those from the dedicated Settings page</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings">
                    Go to Settings <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <ProfileSectionCard icon={Key} title="Password Management" description="Change your account password">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Password</p>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Password</p>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm New Password</p>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
                Change Password
              </Button>
            </ProfileSectionCard>

            <ProfileSectionCard icon={Shield} title="Account Security" description="Recent account security activity" iconClassName="bg-accent/15 text-accent">
              {securitySettings?.lastPasswordChange && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Password Change</p>
                  <p className="text-sm">{new Date(securitySettings.lastPasswordChange).toLocaleDateString()}</p>
                </div>
              )}

              {securitySettings?.lastLogin && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Login</p>
                  <p className="text-sm">{new Date(securitySettings.lastLogin).toLocaleString()}</p>
                </div>
              )}
            </ProfileSectionCard>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4 sm:space-y-6">
          <ProfileSectionCard icon={Activity} title="Activity Log" description="Recent administrative activities and system access">
            {activityLogs.length > 0 ? (
              <div className="space-y-2.5">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      log.status === 'success' ? 'bg-success/10 text-success' :
                      log.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {log.status === 'success' ? <CheckCircle className="h-4 w-4" /> :
                       log.status === 'failed' ? <AlertCircle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No activity logs found</p>
              </div>
            )}
          </ProfileSectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
