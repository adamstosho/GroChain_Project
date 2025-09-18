"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload"

interface BuyerProfileData {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  location: string
  profile: {
    avatar: string
    bio: string
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    coordinates: {
      lat: number
      lng: number
    }
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
  settings: {
    language: string
    timezone: string
    currency: string
    theme: string
    notifications: boolean
    marketing: boolean
  }
  stats: {
    totalHarvests: number
    totalListings: number
    totalOrders: number
    totalRevenue: number
    lastActive: Date
  }
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
    harvestUpdates: boolean
    marketplaceUpdates: boolean
    financialUpdates: boolean
    systemUpdates: boolean
  }
}

export function BuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<BuyerProfileData>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getProfile()
      console.log('Buyer profile response:', response)

      if (response && response.data) {
        setProfile(response.data as any)
        setEditData(response.data as any)
      } else {
        console.log('No profile data in response')
        toast({
          title: "Warning",
          description: "Profile data not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error)
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await apiService.updateProfile(editData as any)
      await fetchProfile()
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

  const handleCancel = () => {
    if (profile) {
      setEditData(profile)
    }
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
      if (!prev) return prev
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any || {}),
          [field]: value
        }
      }
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No profile data found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyer Profile</h1>
          <p className="text-muted-foreground">
            Manage your business profile and preferences
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

      {/* Profile Picture Upload */}
      <div className="flex justify-center">
        <ProfilePictureUpload
          currentAvatar={profile.profile?.avatar}
          onAvatarChange={(avatarUrl: string) => {
            if (profile) {
              const updatedProfile = {
                ...profile,
                profile: {
                  ...profile.profile,
                  avatar: avatarUrl
                }
              }
              setProfile(updatedProfile)
              setEditData(updatedProfile)
            }
          }}
          size="lg"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.name || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.phone || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={editData.location || ""}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.location || "Not specified"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Additional profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editData.profile?.bio || ""}
                  onChange={(e) => handleNestedChange("profile", "bio", e.target.value)}
                  placeholder="Tell us about your business..."
                />
              ) : (
                <p className="text-sm">{profile.profile?.bio || "No bio added"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={editData.profile?.address || ""}
                  onChange={(e) => handleNestedChange("profile", "address", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.profile?.address || "Not specified"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={editData.profile?.city || ""}
                    onChange={(e) => handleNestedChange("profile", "city", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{profile.profile?.city || "Not specified"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={editData.profile?.state || ""}
                    onChange={(e) => handleNestedChange("profile", "state", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{profile.profile?.state || "Not specified"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Business Preferences</CardTitle>
            <CardDescription>Your product and location preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Crop Types</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['maize', 'rice', 'cassava', 'yam', 'sorghum', 'millet', 'beans', 'vegetables', 'fruits'].map((crop) => (
                    <label key={crop} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.preferences?.cropTypes?.includes(crop) || false}
                        onChange={(e) => {
                          const current = editData.preferences?.cropTypes || []
                          if (e.target.checked) {
                            handleNestedChange("preferences", "cropTypes", [...current, crop])
                          } else {
                            handleNestedChange("preferences", "cropTypes", current.filter(c => c !== crop))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{crop}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences?.cropTypes?.map((crop) => (
                    <Badge key={crop} variant="secondary" className="capitalize">
                      {crop}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No preferences set</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preferred Locations</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['Lagos', 'Oyo', 'Kano', 'Kaduna', 'Katsina', 'Jigawa', 'Zamfara', 'Sokoto', 'Kebbi', 'Niger'].map((location) => (
                    <label key={location} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.preferences?.locations?.includes(location) || false}
                        onChange={(e) => {
                          const current = editData.preferences?.locations || []
                          if (e.target.checked) {
                            handleNestedChange("preferences", "locations", [...current, location])
                          } else {
                            handleNestedChange("preferences", "locations", current.filter(l => l !== location))
                          }
                        }}
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences?.locations?.map((location) => (
                    <Badge key={location} variant="outline">
                      {location}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No locations set</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Price Range (₦)</Label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Min</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      value={editData.preferences?.priceRange?.min || ""}
                      onChange={(e) => handleNestedChange("preferences", "priceRange", {
                        ...editData.preferences?.priceRange,
                        min: Number(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Max</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      value={editData.preferences?.priceRange?.max || ""}
                      onChange={(e) => handleNestedChange("preferences", "priceRange", {
                        ...editData.preferences?.priceRange,
                        min: editData.preferences?.priceRange?.min || 0,
                        max: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm">
                  {profile.preferences?.priceRange?.min && profile.preferences?.priceRange?.max
                    ? `₦${profile.preferences.priceRange.min.toLocaleString()} - ₦${profile.preferences.priceRange.max.toLocaleString()}`
                    : "Not specified"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quality Preferences</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['premium', 'standard', 'basic'].map((quality) => (
                    <label key={quality} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.preferences?.qualityPreferences?.includes(quality) || false}
                        onChange={(e) => {
                          const current = editData.preferences?.qualityPreferences || []
                          if (e.target.checked) {
                            handleNestedChange("preferences", "qualityPreferences", [...current, quality])
                          } else {
                            handleNestedChange("preferences", "qualityPreferences", current.filter(q => q !== quality))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{quality}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences?.qualityPreferences?.map((quality) => (
                    <Badge key={quality} variant="secondary" className="capitalize">
                      {quality}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No preferences set</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Organic Preference</Label>
              {isEditing ? (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.preferences?.organicPreference || false}
                    onChange={(e) => handleNestedChange("preferences", "organicPreference", e.target.checked)}
                  />
                  <span className="text-sm">Prefer organic products</span>
                </label>
              ) : (
                <p className="text-sm">
                  {profile.preferences?.organicPreference ? "Yes" : "No"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Business Statistics</CardTitle>
            <CardDescription>Your activity summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.stats?.totalOrders || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ₦{(profile.stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.stats?.totalListings || 0}
                </p>
                <p className="text-sm text-muted-foreground">Products Viewed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.stats?.totalHarvests || 0}
                </p>
                <p className="text-sm text-muted-foreground">Harvests Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">General Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.email || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "email", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Email Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.sms || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "sms", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">SMS Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.push || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "push", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Push Notifications</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Business Updates</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.harvestUpdates || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "harvestUpdates", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Harvest Updates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.marketplaceUpdates || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "marketplaceUpdates", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Marketplace Updates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.notificationPreferences?.financialUpdates || false}
                    onChange={(e) => handleNestedChange("notificationPreferences", "financialUpdates", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Financial Updates</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
