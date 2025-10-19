"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import {
  User,
  MapPin,
  Save,
  Edit,
  Camera,
  AlertCircle,
  Banknote,
  ShoppingCart,
  Activity,
  Building
} from "lucide-react"

interface BuyerProfile {
  _id: string
  name: string
  email: string
  phone: string
  role: "buyer"
  status: "active" | "inactive" | "suspended"
  company?: string
  businessType?: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  website?: string
  bio?: string
  avatar?: string
  stats: {
    totalOrders: number
    totalSpent: number
    favoriteProducts: number
    lastActive: Date
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
  createdAt: Date
  updatedAt: Date
}

export function BuyerProfileForm() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<BuyerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getMyProfile()

      if (response.status === 'success' && response.data) {
        const profileData = response.data as any
        
        const buyerProfile: BuyerProfile = {
          _id: profileData._id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          company: profileData.company || '',
          businessType: profileData.businessType || '',
          address: {
            street: profileData.profile?.address || '',
            city: profileData.profile?.city || '',
            state: profileData.profile?.state || '',
            postalCode: profileData.profile?.postalCode || '',
            country: profileData.profile?.country || 'Nigeria'
          },
          website: profileData.website || '',
          bio: profileData.profile?.bio || '',
          avatar: profileData.profile?.avatar || '',
          stats: {
            totalOrders: profileData.stats?.totalOrders || 0,
            totalSpent: profileData.stats?.totalSpent || 0,
            favoriteProducts: profileData.stats?.favoriteProducts || 0,
            lastActive: profileData.stats?.lastActive || new Date()
          },
          preferences: {
            cropTypes: profileData.preferences?.cropTypes || [],
            priceRange: {
              min: profileData.preferences?.priceRange?.min || 0,
              max: profileData.preferences?.priceRange?.max || 100000
            },
            qualityPreferences: profileData.preferences?.qualityPreferences || [],
            organicPreference: profileData.preferences?.organicPreference || false
          },
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt
        }
        setProfile(buyerProfile)
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

      const updateData = {
        name: profile.name,
        phone: profile.phone,
        company: profile.company,
        businessType: profile.businessType,
        website: profile.website,
        profile: {
          bio: profile.bio || '',
          avatar: profile.avatar || '',
          address: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          country: profile.address?.country || 'Nigeria',
          postalCode: profile.address?.postalCode || ''
        },
        preferences: profile.preferences || {}
      }

      const response = await apiService.updateMyProfile(updateData)

      if (response.status === 'success' && response.data) {
        setProfile(response.data as any)
        updateUser({
          name: (response.data as any).name,
          email: (response.data as any).email,
          phone: (response.data as any).phone,
          profile: (response.data as any).profile
        })

        // Also update localStorage to ensure persistence
        const currentUser = JSON.parse(localStorage.getItem('zustand-auth-store') || '{}')
        if (currentUser.state?.user) {
          currentUser.state.user = {
            ...currentUser.state.user,
            name: (response.data as any).name,
            email: (response.data as any).email,
            phone: (response.data as any).phone,
            profile: (response.data as any).profile
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
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
        {/* Profile Header Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:items-center lg:space-y-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 sm:h-8 bg-muted rounded w-48 sm:w-64 animate-pulse" />
                <div className="h-4 sm:h-5 bg-muted rounded w-32 sm:w-40 animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="h-9 sm:h-10 bg-muted rounded w-full sm:w-20 animate-pulse" />
                <div className="h-9 sm:h-10 bg-muted rounded w-full sm:w-16 animate-pulse" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 bg-muted rounded animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 bg-muted rounded w-16 sm:w-20 animate-pulse" />
                    <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form Skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 sm:h-6 bg-muted rounded w-40 sm:w-48 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24 sm:w-32 animate-pulse" />
                  <div className="h-9 sm:h-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-16 animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:items-center lg:space-y-0">
            <AvatarUpload
              currentAvatar={profile.avatar}
              userName={profile.name}
              onAvatarUpdate={handleAvatarUpdate}
              disabled={!isEditing}
              size="lg"
            />
            <div className="flex-1 space-y-2">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{profile.name}</CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg">
                Buyer {profile.company && `• ${profile.company}`}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {profile.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Buyer since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : 'N/A'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Buyer Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{profile.stats?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Spent</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">₦{(profile.stats?.totalSpent || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Favorites</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{profile.stats?.favoriteProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Last Active</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {profile.stats?.lastActive ? new Date(profile.stats.lastActive).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  disabled // Email should not be editable
                  className="h-9 sm:h-10 text-sm bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company Name</Label>
              <Input
                id="company"
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                disabled={!isEditing}
                placeholder="Your company name"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-sm font-medium">Business Type</Label>
              <Input
                id="businessType"
                value={profile.businessType || ''}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g. Restaurant, Retail, Export"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <Input
                id="website"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              placeholder="Tell us about your business..."
              rows={3}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
              <Input
                id="street"
                value={(profile.address?.street) || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  address: { ...(profile.address || {}), street: e.target.value }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                value={(profile.address?.city) || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  address: { ...(profile.address || {}), city: e.target.value }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium">State</Label>
              <Input
                id="state"
                value={(profile.address?.state) || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  address: { ...(profile.address || {}), state: e.target.value }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
              <Input
                id="postalCode"
                value={(profile.address?.postalCode) || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  address: { ...(profile.address || {}), postalCode: e.target.value }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="country" className="text-sm font-medium">Country</Label>
              <Input
                id="country"
                value={(profile.address?.country) || ''}
                onChange={(e) => setProfile({
                  ...profile,
                  address: { ...(profile.address || {}), country: e.target.value }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Crop Types</Label>
            <div className="flex flex-wrap gap-2">
              {['Maize', 'Rice', 'Cassava', 'Yam', 'Tomato', 'Pepper', 'Onion', 'Potato', 'Sorghum', 'Millet'].map((crop) => (
                <Button
                  key={crop}
                  variant={((profile.preferences?.cropTypes) || []).includes(crop) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isEditing) return
                    const currentCrops = profile.preferences?.cropTypes || []
                    const newCrops = currentCrops.includes(crop)
                      ? currentCrops.filter(c => c !== crop)
                      : [...currentCrops, crop]
                    setProfile({
                      ...profile,
                      preferences: {
                        ...(profile.preferences || {}),
                        cropTypes: newCrops
                      }
                    })
                  }}
                  disabled={!isEditing}
                  className="h-8 text-xs sm:text-sm"
                >
                  {crop}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceMin" className="text-sm font-medium">Minimum Price Range (₦)</Label>
              <Input
                id="priceMin"
                type="number"
                value={(profile.preferences?.priceRange?.min) || 0}
                onChange={(e) => setProfile({
                  ...profile,
                  preferences: {
                    ...(profile.preferences || {}),
                    priceRange: {
                      ...(profile.preferences?.priceRange || {}),
                      min: parseInt(e.target.value) || 0
                    }
                  }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceMax" className="text-sm font-medium">Maximum Price Range (₦)</Label>
              <Input
                id="priceMax"
                type="number"
                value={(profile.preferences?.priceRange?.max) || 100000}
                onChange={(e) => setProfile({
                  ...profile,
                  preferences: {
                    ...(profile.preferences || {}),
                    priceRange: {
                      ...(profile.preferences?.priceRange || {}),
                      max: parseInt(e.target.value) || 100000
                    }
                  }
                })}
                disabled={!isEditing}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Quality Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {['Premium', 'Standard', 'Organic', 'Fair Trade', 'Local'].map((quality) => (
                <Button
                  key={quality}
                  variant={((profile.preferences?.qualityPreferences) || []).includes(quality) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isEditing) return
                    const currentQualities = profile.preferences?.qualityPreferences || []
                    const newQualities = currentQualities.includes(quality)
                      ? currentQualities.filter(q => q !== quality)
                      : [...currentQualities, quality]
                    setProfile({
                      ...profile,
                      preferences: {
                        ...(profile.preferences || {}),
                        qualityPreferences: newQualities
                      }
                    })
                  }}
                  disabled={!isEditing}
                  className="h-8 text-xs sm:text-sm"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
