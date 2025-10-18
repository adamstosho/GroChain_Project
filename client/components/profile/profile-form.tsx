"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import {
  User,
  MapPin,
  Building,
  Save,
  Edit,
  Camera,
  AlertCircle,
  Banknote,
  ShoppingCart,
  Activity
} from "lucide-react"

interface PartnerProfile {
  _id: string
  name: string
  email: string
  phone: string
  role: "partner"
  status: "active" | "inactive" | "suspended"
  organization: string
  organizationType: "cooperative" | "ngo" | "extension_agency" | "market_association" | "other"
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  website?: string
  description?: string
  logo?: string
  contactPerson: {
    name: string
    position: string
    phone: string
    email: string
  }
  services: string[]
  coverageAreas: string[]
  certifications: string[]
  createdAt: Date
  updatedAt: Date
}

interface FarmerProfile {
  _id: string
  name: string
  email: string
  phone: string
  role: "farmer"
  status: "active" | "inactive" | "suspended"
  location: string
  gender: string
  age: string
  education: string
  farmSize: string
  primaryCrops: string[]
  experience: string
  certifications: string[]
  bio: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  avatar: string
  stats: {
    totalHarvests: number
    totalListings: number
    totalOrders: number
    totalRevenue: number
    lastActive: Date
  }
  recentHarvests: any[]
  createdAt: Date
  updatedAt: Date
}

export function ProfileForm() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<PartnerProfile | FarmerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)

      // Fetch real profile data from API
      const response = await apiService.getMyProfile()

      if (response.status === 'success' && response.data) {
        const profileData = response.data as any

        // Handle different user roles
        if (user?.role === 'farmer') {
          // For farmers, create a farmer-specific profile structure
          const farmerProfile = {
            _id: profileData._id,
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            role: profileData.role,
            status: profileData.status,
            // Farmer-specific fields
            location: profileData.location || '',
            gender: profileData.gender || '',
            age: profileData.age || '',
            education: profileData.education || '',
            farmSize: profileData.profile?.farmSize || '',
            primaryCrops: profileData.preferences?.cropTypes || [],
            experience: profileData.profile?.experience || '',
            certifications: profileData.profile?.certifications || [],
            bio: profileData.profile?.bio || '',
            address: profileData.profile?.address || '',
            city: profileData.profile?.city || '',
            state: profileData.profile?.state || '',
            country: profileData.profile?.country || 'Nigeria',
            postalCode: profileData.profile?.postalCode || '',
            avatar: profileData.profile?.avatar || '',
            stats: profileData.stats || {
              totalHarvests: 0,
              totalListings: 0,
              totalOrders: 0,
              totalRevenue: 0,
              lastActive: new Date()
            },
            recentHarvests: profileData.recentHarvests || [],
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt
          }
          setProfile(farmerProfile as any)
        } else if (user?.role === 'partner') {
          // For partners, use the existing partner structure
          const partnerProfile: PartnerProfile = {
            _id: profileData._id,
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            role: profileData.role,
            status: profileData.status,
            organization: profileData.partner?.name || '',
            organizationType: profileData.partner?.type || 'cooperative',
            address: {
              street: profileData.profile?.address || '',
              city: profileData.profile?.city || '',
              state: profileData.profile?.state || '',
              postalCode: profileData.profile?.postalCode || '',
              country: profileData.profile?.country || 'Nigeria'
            },
            website: profileData.partner?.website || '',
            description: profileData.partner?.description || '',
            logo: profileData.partner?.logo || '',
            contactPerson: {
              name: profileData.name,
              position: profileData.partner?.contactPerson?.position || '',
              phone: profileData.phone,
              email: profileData.email
            },
            services: profileData.partner?.services || [],
            coverageAreas: profileData.partner?.coverageAreas || [],
            certifications: profileData.partner?.certifications || [],
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt
          }
          setProfile(partnerProfile)
        } else {
          // For other user types, use a generic structure
          setProfile(profileData as any)
        }
      } else {
        throw new Error('Failed to fetch profile data')
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error loading profile",
        description: error.message || "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setIsSaving(true)

      // Validate required fields
      if (!profile.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Full name is required",
          variant: "destructive"
        })
        return
      }

      if (!profile.phone?.trim()) {
        toast({
          title: "Validation Error", 
          description: "Phone number is required",
          variant: "destructive"
        })
        return
      }

      // Prepare update data based on user role
      let updateData: any = {}

      if (user?.role === 'farmer' && 'location' in profile) {
        const farmerProfile = profile as FarmerProfile
        updateData = {
          name: farmerProfile.name,
          phone: farmerProfile.phone,
          location: farmerProfile.location,
          gender: farmerProfile.gender,
          age: parseInt(farmerProfile.age) || undefined,
          education: farmerProfile.education,
          profile: {
            bio: farmerProfile.bio,
            address: farmerProfile.address,
            city: farmerProfile.city,
            state: farmerProfile.state,
            country: farmerProfile.country,
            postalCode: farmerProfile.postalCode,
            avatar: farmerProfile.avatar,
            farmSize: farmerProfile.farmSize,
            experience: farmerProfile.experience,
            certifications: farmerProfile.certifications
          },
          preferences: {
            cropTypes: farmerProfile.primaryCrops
          }
        }
      } else if (user?.role === 'partner' && 'organization' in profile) {
        const partnerProfile = profile as PartnerProfile
        updateData = {
          name: partnerProfile.name,
          phone: partnerProfile.phone,
          company: partnerProfile.organization, // Partner organization as company
          businessType: partnerProfile.organizationType,
          website: partnerProfile.website,
          profile: {
            bio: partnerProfile.description,
            address: partnerProfile.address?.street,
            city: partnerProfile.address?.city,
            state: partnerProfile.address?.state,
            country: partnerProfile.address?.country,
            postalCode: partnerProfile.address?.postalCode,
            avatar: partnerProfile.logo // Partner logo as avatar
          }
        }
      }

      // Update profile via API
      const response = await apiService.updateMyProfile(updateData)

      if (response.status === 'success' && response.data) {
        // For partners, preserve the logo/avatar mapping
        const updatedProfile = response.data as any
        if (user?.role === 'partner' && (profile as any).logo) {
          updatedProfile.profile = {
            ...updatedProfile.profile,
            avatar: (profile as any).logo // Ensure logo is preserved as avatar
          }
        }

        // Update local state with the response
        setProfile(updatedProfile)

        // Update auth store if needed
        updateUser({
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          profile: updatedProfile.profile
        })

        // Also update localStorage to ensure persistence
        const currentUser = JSON.parse(localStorage.getItem('zustand-auth-store') || '{}')
        if (currentUser.state?.user) {
          currentUser.state.user = {
            ...currentUser.state.user,
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            profile: updatedProfile.profile
          }
          localStorage.setItem('zustand-auth-store', JSON.stringify(currentUser))
        }

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "default"
        })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      
      // Handle different types of errors
      let errorMessage = "Failed to save profile. Please try again."
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes('validation')) {
        errorMessage = error.message
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "Session expired. Please log in again."
      }
      
      toast({
        title: "Error saving profile",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (profile) {
      // Update local profile state - handle both farmer and partner profiles
      if (user?.role === 'partner') {
        setProfile({ ...profile, logo: newAvatarUrl } as any)
      } else {
        setProfile({ ...profile, avatar: newAvatarUrl } as any)
      }

      // Update auth store to sync avatar across the app
      updateUser({
        profile: {
          ...user?.profile,
          avatar: newAvatarUrl
        }
      })

      // Also update localStorage to ensure persistence across page refreshes
      const currentUser = JSON.parse(localStorage.getItem('zustand-auth-store') || '{}')
      if (currentUser.state?.user) {
        currentUser.state.user.profile = {
          ...currentUser.state.user.profile,
          avatar: newAvatarUrl
        }
        localStorage.setItem('zustand-auth-store', JSON.stringify(currentUser))
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Profile not found</h3>
        <p className="text-muted-foreground">Unable to load your profile information.</p>
      </div>
    )
  }

  // Render different layouts for different user roles
  if (user?.role === 'farmer') {
    return <FarmerProfileView />
  }

  // Type guard to ensure we're working with a PartnerProfile
  if (profile.role !== 'partner') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Invalid profile type</h3>
        <p className="text-muted-foreground">This profile is not configured for partners.</p>
      </div>
    )
  }

  // Now TypeScript knows profile is PartnerProfile
  const partnerProfile = profile as PartnerProfile

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-6">
            <AvatarUpload
              currentAvatar={partnerProfile.logo}
              userName={partnerProfile.name}
              onAvatarUpdate={handleAvatarUpdate}
              disabled={!isEditing}
              size="lg"
            />
            <div className="flex-1">
              <CardTitle className="text-2xl">{partnerProfile.name}</CardTitle>
              <CardDescription className="text-lg">
                {partnerProfile.organization || 'No organization'} {partnerProfile.organizationType && `• ${partnerProfile.organizationType.replace('_', ' ')}`}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={partnerProfile.status === 'active' ? 'default' : 'secondary'}>
                  {partnerProfile.status || 'unknown'}
                </Badge>
                <Badge variant="outline">
                  Partner since {partnerProfile.createdAt ? new Date(partnerProfile.createdAt).getFullYear() : 'N/A'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none h-9 sm:h-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{isEditing ? 'Cancel' : 'Edit'}</span>
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none h-9 sm:h-10"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={partnerProfile.name}
                onChange={(e) => setProfile({ ...partnerProfile, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={partnerProfile.email}
                onChange={(e) => setProfile({ ...partnerProfile, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={partnerProfile.phone}
                onChange={(e) => setProfile({ ...partnerProfile, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={partnerProfile.website || ''}
                onChange={(e) => setProfile({ ...partnerProfile, website: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={partnerProfile.description || ''}
              onChange={(e) => setProfile({ ...partnerProfile, description: e.target.value })}
              disabled={!isEditing}
              placeholder="Tell us about your organization..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
                             <Input
                 id="street"
                 value={profile.address?.street || ''}
                 onChange={(e) => setProfile({
                   ...profile,
                   address: { ...profile.address, street: e.target.value }
                 })}
                 disabled={!isEditing}
               />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
                             <Input
                 id="city"
                 value={profile.address?.city || ''}
                 onChange={(e) => setProfile({
                   ...profile,
                   address: { ...profile.address, city: e.target.value }
                 })}
                 disabled={!isEditing}
               />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
                             <Input
                 id="state"
                 value={profile.address?.state || ''}
                 onChange={(e) => setProfile({
                   ...profile,
                   address: { ...profile.address, state: e.target.value }
                 })}
                 disabled={!isEditing}
               />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
                             <Input
                 id="postalCode"
                 value={profile.address?.postalCode || ''}
                 onChange={(e) => setProfile({
                   ...profile,
                   address: { ...profile.address, postalCode: e.target.value }
                 })}
                 disabled={!isEditing}
               />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                value={profile.organization || ''}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type</Label>
              <Select
                value={profile.organizationType || ''}
                onValueChange={(value: any) => setProfile({ ...profile, organizationType: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cooperative">Cooperative</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="extension_agency">Extension Agency</SelectItem>
                  <SelectItem value="market_association">Market Association</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Contact Person</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  value={profile.contactPerson?.name || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    contactPerson: { ...profile.contactPerson, name: e.target.value }
                  })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPosition">Position</Label>
                <Input
                  id="contactPosition"
                  value={profile.contactPerson?.position || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    contactPerson: { ...profile.contactPerson, position: e.target.value }
                  })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  value={profile.contactPerson?.phone || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    contactPerson: { ...profile.contactPerson, phone: e.target.value }
                  })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactPerson?.email || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    contactPerson: { ...profile.contactPerson, email: e.target.value }
                  })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Services & Coverage</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="space-y-2">
                  {['Training', 'Extension', 'Marketing', 'Finance', 'Technology'].map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={service}
                        checked={(profile.services || []).includes(service.toLowerCase())}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...(profile.services || []), service.toLowerCase()]
                            : (profile.services || []).filter(s => s !== service.toLowerCase())
                          setProfile({ ...profile, services: newServices })
                        }}
                        disabled={!isEditing}
                      />
                      <Label htmlFor={service}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Coverage Areas</Label>
                <Textarea
                  value={(profile.coverageAreas || []).join(', ')}
                  onChange={(e) => setProfile({
                    ...profile,
                    coverageAreas: e.target.value.split(',').map(area => area.trim()).filter(Boolean)
                  })}
                  disabled={!isEditing}
                  placeholder="Enter coverage areas separated by commas"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Farmer Profile View Component
function FarmerProfileView() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchFarmerProfile()
  }, [])

  const fetchFarmerProfile = async () => {
    try {
      setIsLoading(true)
      
      // Fetch both profile and analytics data in parallel
      const [profileResponse, analyticsResponse] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getFarmerAnalytics().catch(() => ({ data: {} }))
      ])

      if (profileResponse.status === 'success' && profileResponse.data) {
        const profileData = profileResponse.data as any
        const analyticsData = analyticsResponse.data || {}
        
        const farmerProfile: FarmerProfile = {
          _id: profileData._id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          location: profileData.location || '',
          gender: profileData.gender || '',
          age: profileData.age?.toString() || '',
          education: profileData.education || '',
          farmSize: profileData.profile?.farmSize || '',
          primaryCrops: profileData.preferences?.cropTypes || [],
          experience: profileData.profile?.experience || '',
          certifications: profileData.profile?.certifications || [],
          bio: profileData.profile?.bio || '',
          address: profileData.profile?.address || '',
          city: profileData.profile?.city || '',
          state: profileData.profile?.state || '',
          country: profileData.profile?.country || 'Nigeria',
          postalCode: profileData.profile?.postalCode || '',
          avatar: profileData.profile?.avatar || '',
          stats: {
            totalHarvests: (analyticsData as any).totalHarvests || profileData.stats?.totalHarvests || 0,
            totalListings: (analyticsData as any).totalListings || profileData.stats?.totalListings || 0,
            totalOrders: (analyticsData as any).totalOrders || profileData.stats?.totalOrders || 0,
            totalRevenue: (analyticsData as any).totalRevenue || profileData.stats?.totalRevenue || 0,
            lastActive: profileData.stats?.lastActive || new Date()
          },
          recentHarvests: profileData.recentHarvests || [],
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt
        }
        setProfile(farmerProfile)
      } else {
        throw new Error('Failed to fetch farmer profile')
      }
    } catch (error: any) {
      console.error('Error fetching farmer profile:', error)
      toast({
        title: "Error loading profile",
        description: error.message || "Failed to load farmer profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setIsSaving(true)
      const updateData = {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        gender: profile.gender,
        age: parseInt(profile.age) || undefined,
        education: profile.education,
        profile: {
          bio: profile.bio,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          postalCode: profile.postalCode,
          avatar: profile.avatar,
          farmSize: profile.farmSize,
          experience: profile.experience,
          certifications: profile.certifications
        },
        preferences: {
          cropTypes: profile.primaryCrops
        }
      }

      const response = await apiService.updateMyProfile(updateData)

      if (response.status === 'success' && response.data) {
        setProfile(response.data as any)
        updateUser({
          name: (response.data as any).name,
          email: (response.data as any).email,
          phone: (response.data as any).phone
        })

        toast({
          title: "Profile updated",
          description: "Your farmer profile has been updated successfully",
          variant: "default"
        })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating farmer profile:', error)
      
      // Handle different types of errors
      let errorMessage = "Failed to save profile. Please try again."
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes('validation')) {
        errorMessage = error.message
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "Session expired. Please log in again."
      }
      
      toast({
        title: "Error saving profile",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (profile) {
      // Update local profile state
      setProfile({ ...profile, avatar: newAvatarUrl })

      // Update auth store to sync avatar across the app
      updateUser({
        profile: {
          ...user?.profile,
          avatar: newAvatarUrl
        }
      })

      // Also update localStorage to ensure persistence across page refreshes
      const currentUser = JSON.parse(localStorage.getItem('zustand-auth-store') || '{}')
      if (currentUser.state?.user) {
        currentUser.state.user.profile = {
          ...currentUser.state.user.profile,
          avatar: newAvatarUrl
        }
        localStorage.setItem('zustand-auth-store', JSON.stringify(currentUser))
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Loading farmer profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Profile not found</h3>
        <p className="text-muted-foreground">Unable to load your farmer profile information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Farmer Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-6">
            <AvatarUpload
              currentAvatar={profile.avatar}
              userName={profile.name}
              onAvatarUpdate={handleAvatarUpdate}
              disabled={!isEditing}
              size="lg"
            />
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription className="text-lg">
                Farmer • {profile.location || 'Location not set'}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                  {profile.status}
                </Badge>
                <Badge variant="outline">
                  Farmer since {new Date(profile.createdAt).getFullYear()}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none h-9 sm:h-10"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{isEditing ? 'Cancel' : 'Edit'}</span>
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none h-9 sm:h-10"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Farmer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Harvests</p>
                <p className="text-2xl font-bold">{profile.stats.totalHarvests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Banknote className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₦{profile.stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold">{profile.stats.totalListings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{profile.stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmer Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={profile.email || ''}
                  disabled // Email should not be editable
                  className="h-9 sm:h-10 bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Age</Label>
                <Input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <Select
                  value={profile.gender || ''}
                  onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Education</Label>
                <Input
                  value={profile.education || ''}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farm Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Farm Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Farm Size (hectares)</Label>
              <Input
                value={profile.farmSize || ''}
                onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g. 5.5"
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Crops</Label>
              <Input
                value={(profile.primaryCrops || []).join(', ')}
                onChange={(e) => setProfile({
                  ...profile,
                  primaryCrops: e.target.value.split(',').map(crop => crop.trim()).filter(crop => crop)
                })}
                disabled={!isEditing}
                placeholder="e.g. Maize, Cassava, Tomatoes"
                className="h-9 sm:h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Farming Experience (years)</Label>
                <Input
                  value={profile.experience || ''}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. 10"
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Input
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. Ibadan, Oyo State"
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Certifications</Label>
              <Input
                value={(profile.certifications || []).join(', ')}
                onChange={(e) => setProfile({
                  ...profile,
                  certifications: e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert)
                })}
                disabled={!isEditing}
                placeholder="e.g. Organic, Fair Trade"
                className="h-9 sm:h-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Address</Label>
            <Input
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={!isEditing}
              className="h-9 sm:h-10"
              placeholder="Enter your full address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">City</Label>
              <Input
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={!isEditing}
                className="h-9 sm:h-10"
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">State</Label>
              <Input
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                disabled={!isEditing}
                className="h-9 sm:h-10"
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Country</Label>
              <Input
                value={profile.country || ''}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                disabled={!isEditing}
                className="h-9 sm:h-10"
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Postal Code</Label>
              <Input
                value={profile.postalCode || ''}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                disabled={!isEditing}
                className="h-9 sm:h-10"
                placeholder="Postal Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Bio
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Tell us about yourself and your farming experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            disabled={!isEditing}
            placeholder="Tell us about yourself and your farming experience..."
            rows={4}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Recent Harvests */}
      {profile.recentHarvests && profile.recentHarvests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Harvests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.recentHarvests.slice(0, 3).map((harvest: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{harvest.cropType}</p>
                    <p className="text-sm text-muted-foreground">
                      {harvest.quantity}kg • {harvest.qualityGrade} • {new Date(harvest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={harvest.status === 'approved' ? 'default' : 'secondary'}>
                    {harvest.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
