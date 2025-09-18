"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface FarmerProfileData {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
    region: string
  }
  farmName: string
  farmSize: number
  farmLocation: {
    address: string
    city: string
    state: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  primaryCrops: string[]
  farmingExperience: number
  farmingMethod: string
  irrigationType: string
  annualIncome: number
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  preferences: {
    language: string
    notifications: {
      sms: boolean
      email: boolean
      push: boolean
    }
    marketPreferences: {
      preferredBuyers: string[]
      preferredPaymentMethods: string[]
      preferredDeliveryMethods: string[]
    }
  }
  settings: {
    privacy: {
      profileVisibility: string
      dataSharing: boolean
    }
    business: {
      autoAcceptOrders: boolean
      minimumOrderAmount: number
      maxDeliveryDistance: number
    }
  }
  verificationStatus: string
  verificationDocuments: Array<{
    type: string
    url: string
    verified: boolean
    verifiedAt: Date
    verifiedBy: string
  }>
  referredBy: string
  referralDate: Date
  performanceMetrics: {
    totalHarvests: number
    totalSales: number
    averageRating: number
    onTimeDelivery: number
    qualityScore: number
  }
  isActive: boolean
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export function FarmerProfile() {
  const [profile, setProfile] = useState<FarmerProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<FarmerProfileData>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getFarmerProfile()
      console.log('Farmer profile response:', response)
      
      if (response && response.data) {
        setProfile(response.data as FarmerProfileData)
        setEditData(response.data as FarmerProfileData)
      } else {
        console.log('No profile data in response')
        toast({
          title: "Warning",
          description: "Profile data not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching farmer profile:', error)
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
      await apiService.updateFarmerProfile(editData)
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
    setEditData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditData(prev => {
      if (!prev) return prev
      const parentValue = prev[parent as keyof typeof prev]
      return {
        ...prev,
        [parent]: {
          ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
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
          <h1 className="text-3xl font-bold tracking-tight">Farmer Profile</h1>
          <p className="text-muted-foreground">
            Manage your farming profile and preferences
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
              <p className="text-sm text-muted-foreground">{profile.farmer?.name || "Not specified"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <p className="text-sm text-muted-foreground">{profile.farmer?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <p className="text-sm text-muted-foreground">{profile.farmer?.phone || "Not specified"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <p className="text-sm text-muted-foreground">{profile.farmer?.region || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Farm Information */}
        <Card>
          <CardHeader>
            <CardTitle>Farm Information</CardTitle>
            <CardDescription>Your farm details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              {isEditing ? (
                <Input
                  id="farmName"
                  value={editData.farmName || ""}
                  onChange={(e) => handleInputChange("farmName", e.target.value)}
                  placeholder="Enter your farm name"
                />
              ) : (
                <p className="text-sm">{profile.farmName || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmSize">Farm Size (hectares)</Label>
              {isEditing ? (
                <Input
                  id="farmSize"
                  type="number"
                  value={editData.farmSize || ""}
                  onChange={(e) => handleInputChange("farmSize", Number(e.target.value))}
                  placeholder="0.0"
                />
              ) : (
                <p className="text-sm">{profile.farmSize || "Not specified"} hectares</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmingExperience">Years of Experience</Label>
              {isEditing ? (
                <Input
                  id="farmingExperience"
                  type="number"
                  value={editData.farmingExperience || ""}
                  onChange={(e) => handleInputChange("farmingExperience", Number(e.target.value))}
                  placeholder="0"
                />
              ) : (
                <p className="text-sm">{profile.farmingExperience || "Not specified"} years</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmingMethod">Farming Method</Label>
              {isEditing ? (
                <select
                  id="farmingMethod"
                  className="w-full p-2 border rounded-md"
                  value={editData.farmingMethod || ""}
                  onChange={(e) => handleInputChange("farmingMethod", e.target.value)}
                >
                  <option value="">Select method</option>
                  <option value="traditional">Traditional</option>
                  <option value="modern">Modern</option>
                  <option value="organic">Organic</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-sm capitalize">{profile.farmingMethod || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="irrigationType">Irrigation Type</Label>
              {isEditing ? (
                <select
                  id="irrigationType"
                  className="w-full p-2 border rounded-md"
                  value={editData.irrigationType || ""}
                  onChange={(e) => handleInputChange("irrigationType", e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="rainfed">Rainfed</option>
                  <option value="manual">Manual</option>
                  <option value="drip">Drip</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-sm capitalize">{profile.irrigationType || "Not specified"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm Location */}
        <Card>
          <CardHeader>
            <CardTitle>Farm Location</CardTitle>
            <CardDescription>Your farm location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={editData.farmLocation?.address || ""}
                  onChange={(e) => handleNestedChange("farmLocation", "address", e.target.value)}
                  placeholder="Enter your farm address"
                />
              ) : (
                <p className="text-sm">{profile.farmLocation?.address || "Not specified"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={editData.farmLocation?.city || ""}
                    onChange={(e) => handleNestedChange("farmLocation", "city", e.target.value)}
                    placeholder="City"
                  />
                ) : (
                  <p className="text-sm">{profile.farmLocation?.city || "Not specified"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={editData.farmLocation?.state || ""}
                    onChange={(e) => handleNestedChange("farmLocation", "state", e.target.value)}
                    placeholder="State"
                  />
                ) : (
                  <p className="text-sm">{profile.farmLocation?.state || "Not specified"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crops and Production */}
        <Card>
          <CardHeader>
            <CardTitle>Crops & Production</CardTitle>
            <CardDescription>Your primary crops and production details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Crops</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['maize', 'rice', 'cassava', 'yam', 'sorghum', 'millet', 'beans', 'vegetables', 'fruits'].map((crop) => (
                    <label key={crop} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.primaryCrops?.includes(crop) || false}
                        onChange={(e) => {
                          const current = editData.primaryCrops || []
                          if (e.target.checked) {
                            handleInputChange("primaryCrops", [...current, crop])
                          } else {
                            handleInputChange("primaryCrops", current.filter(c => c !== crop))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{crop}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.primaryCrops?.map((crop) => (
                    <Badge key={crop} variant="secondary" className="capitalize">
                      {crop}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No crops specified</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualIncome">Annual Income (₦)</Label>
              {isEditing ? (
                <Input
                  id="annualIncome"
                  type="number"
                  value={editData.annualIncome || ""}
                  onChange={(e) => handleInputChange("annualIncome", Number(e.target.value))}
                  placeholder="0"
                />
              ) : (
                <p className="text-sm">
                  {profile.annualIncome ? `₦${profile.annualIncome.toLocaleString()}` : "Not specified"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
            <CardDescription>Your banking details for payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              {isEditing ? (
                <Input
                  id="bankName"
                  value={editData.bankAccount?.bankName || ""}
                  onChange={(e) => handleNestedChange("bankAccount", "bankName", e.target.value)}
                  placeholder="Enter bank name"
                />
              ) : (
                <p className="text-sm">{profile.bankAccount?.bankName || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              {isEditing ? (
                <Input
                  id="accountNumber"
                  value={editData.bankAccount?.accountNumber || ""}
                  onChange={(e) => handleNestedChange("bankAccount", "accountNumber", e.target.value)}
                  placeholder="Enter account number"
                />
              ) : (
                <p className="text-sm">{profile.bankAccount?.accountNumber || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              {isEditing ? (
                <Input
                  id="accountName"
                  value={editData.bankAccount?.accountName || ""}
                  onChange={(e) => handleNestedChange("bankAccount", "accountName", e.target.value)}
                  placeholder="Enter account name"
                />
              ) : (
                <p className="text-sm">{profile.bankAccount?.accountName || "Not specified"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your farming performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.totalHarvests || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Harvests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ₦{(profile.performanceMetrics?.totalSales || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.averageRating || 0}/5
                </p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.onTimeDelivery || 0}%
                </p>
                <p className="text-sm text-muted-foreground">On-Time Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Your account verification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  profile.verificationStatus === "verified" ? "default" :
                  profile.verificationStatus === "pending" ? "secondary" : "destructive"
                }
              >
                {profile.verificationStatus?.charAt(0).toUpperCase() + profile.verificationStatus?.slice(1) || "Pending"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {profile.verificationStatus === "verified" ? "✓ Verified" :
                 profile.verificationStatus === "pending" ? "⏳ Pending Review" : "❌ Rejected"}
              </span>
            </div>

            {profile.verificationDocuments && profile.verificationDocuments.length > 0 && (
              <div className="space-y-2">
                <Label>Verification Documents</Label>
                <div className="space-y-2">
                  {profile.verificationDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm capitalize">{doc.type?.replace('_', ' ')}</span>
                      <Badge variant={doc.verified ? "default" : "secondary"}>
                        {doc.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>Manage your business preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  {isEditing ? (
                    <select
                      id="profileVisibility"
                      className="w-full p-2 border rounded-md"
                      value={editData.settings?.privacy?.profileVisibility || ""}
                      onChange={(e) => handleNestedChange("settings", "privacy", {
                        ...editData.settings?.privacy,
                        profileVisibility: e.target.value
                      })}
                    >
                      <option value="">Select visibility</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="partners">Partners Only</option>
                    </select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.settings?.privacy?.profileVisibility || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data Sharing</Label>
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.settings?.privacy?.dataSharing || false}
                        onChange={(e) => handleNestedChange("settings", "privacy", {
                          ...editData.settings?.privacy,
                          dataSharing: e.target.checked
                        })}
                      />
                      <span className="text-sm">Allow data sharing with partners</span>
                    </label>
                  ) : (
                    <p className="text-sm">
                      {profile.settings?.privacy?.dataSharing ? "Yes" : "No"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Preferences</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Auto-Accept Orders</Label>
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.settings?.business?.autoAcceptOrders || false}
                        onChange={(e) => handleNestedChange("settings", "business", {
                          ...editData.settings?.business,
                          autoAcceptOrders: e.target.checked
                        })}
                      />
                      <span className="text-sm">Automatically accept orders</span>
                    </label>
                  ) : (
                    <p className="text-sm">
                      {profile.settings?.business?.autoAcceptOrders ? "Yes" : "No"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumOrderAmount">Minimum Order Amount (₦)</Label>
                  {isEditing ? (
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      value={editData.settings?.business?.minimumOrderAmount || ""}
                      onChange={(e) => handleNestedChange("settings", "business", {
                        ...editData.settings?.business,
                        minimumOrderAmount: Number(e.target.value)
                      })}
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.settings?.business?.minimumOrderAmount ? `₦${profile.settings.business.minimumOrderAmount.toLocaleString()}` : "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDeliveryDistance">Max Delivery Distance (km)</Label>
                  {isEditing ? (
                    <Input
                      id="maxDeliveryDistance"
                      type="number"
                      value={editData.settings?.business?.maxDeliveryDistance || ""}
                      onChange={(e) => handleNestedChange("settings", "business", {
                        ...editData.settings?.business,
                        maxDeliveryDistance: Number(e.target.value)
                      })}
                      placeholder="50"
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.settings?.business?.maxDeliveryDistance || "Not specified"} km
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    checked={editData.preferences?.notifications?.email || false}
                    onChange={(e) => handleNestedChange("preferences", "notifications", {
                      ...editData.preferences?.notifications,
                      email: e.target.checked
                    })}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Email Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.preferences?.notifications?.sms || false}
                    onChange={(e) => handleNestedChange("preferences", "notifications", {
                      ...editData.preferences?.notifications,
                      sms: e.target.checked
                    })}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">SMS Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.preferences?.notifications?.push || false}
                    onChange={(e) => handleNestedChange("preferences", "notifications", {
                      ...editData.preferences?.notifications,
                      push: e.target.checked
                    })}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">Push Notifications</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Language Preference</h3>
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  {isEditing ? (
                    <select
                      id="language"
                      className="w-full p-2 border rounded-md"
                      value={editData.preferences?.language || ""}
                      onChange={(e) => handleNestedChange("preferences", "language", e.target.value)}
                    >
                      <option value="">Select language</option>
                      <option value="english">English</option>
                      <option value="hausa">Hausa</option>
                      <option value="yoruba">Yoruba</option>
                      <option value="igbo">Igbo</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.language || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
