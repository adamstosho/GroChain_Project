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
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PartnerProfileData {
  _id: string
  partner: string
  organizationName: string
  organizationType: string
  organizationSize: string
  organizationLocation: {
    address: string
    city: string
    state: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  primaryServices: string[]
  targetRegions: string[]
  annualBudget: number
  fundingSource: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  preferences: {
    preferredCommunicationMethod: string
    preferredMeetingFrequency: string
    preferredReportFormat: string
    targetFarmerCount: number
    targetCropTypes: string[]
  }
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    autoApproval: boolean
    privacyLevel: string
  }
  verificationStatus: string
  verificationDocuments: Array<{
    type: string
    url: string
    verified: boolean
    uploadedAt: Date
  }>
  referredBy: string
  referralDate: Date
  performanceMetrics: {
    totalFarmersSupported: number
    totalProjects: number
    successRate: number
    averageFarmerIncome: number
    communityImpact: number
  }
  isActive: boolean
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export function PartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<PartnerProfileData>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getPartnerProfile()
      setProfile(response.data as PartnerProfileData)
      setEditData(response.data as PartnerProfileData)
    } catch (error) {
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
      await apiService.updatePartnerProfile(editData)
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
          <h1 className="text-3xl font-bold tracking-tight">Partner Profile</h1>
          <p className="text-muted-foreground">
            Manage your organization profile and preferences
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              {isEditing ? (
                <Input
                  id="organizationName"
                  value={editData.organizationName || ""}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.organizationName || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type</Label>
              {isEditing ? (
                <select
                  id="organizationType"
                  className="w-full p-2 border rounded-md"
                  value={editData.organizationType || ""}
                  onChange={(e) => handleInputChange("organizationType", e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="ngo">NGO</option>
                  <option value="government">Government Agency</option>
                  <option value="private_sector">Private Sector</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="foundation">Foundation</option>
                  <option value="research_institute">Research Institute</option>
                  <option value="university">University</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-sm capitalize">{profile.organizationType?.replace('_', ' ') || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationSize">Organization Size</Label>
              {isEditing ? (
                <select
                  id="organizationSize"
                  className="w-full p-2 border rounded-md"
                  value={editData.organizationSize || ""}
                  onChange={(e) => handleInputChange("organizationSize", e.target.value)}
                >
                  <option value="">Select size</option>
                  <option value="small">Small (1-10 employees)</option>
                  <option value="medium">Medium (11-50 employees)</option>
                  <option value="large">Large (51-200 employees)</option>
                  <option value="enterprise">Enterprise (200+ employees)</option>
                </select>
              ) : (
                <p className="text-sm capitalize">{profile.organizationSize || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualBudget">Annual Budget (₦)</Label>
              {isEditing ? (
                <Input
                  id="annualBudget"
                  type="number"
                  value={editData.annualBudget || ""}
                  onChange={(e) => handleInputChange("annualBudget", Number(e.target.value))}
                />
              ) : (
                <p className="text-sm">
                  {profile.annualBudget ? `₦${profile.annualBudget.toLocaleString()}` : "Not specified"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingSource">Funding Source</Label>
              {isEditing ? (
                <select
                  id="fundingSource"
                  className="w-full p-2 border rounded-md"
                  value={editData.fundingSource || ""}
                  onChange={(e) => handleInputChange("fundingSource", e.target.value)}
                >
                  <option value="">Select source</option>
                  <option value="government">Government</option>
                  <option value="donor_agencies">Donor Agencies</option>
                  <option value="private_foundations">Private Foundations</option>
                  <option value="corporate_social_responsibility">Corporate Social Responsibility</option>
                  <option value="membership_dues">Membership Dues</option>
                  <option value="grants">Grants</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-sm capitalize">
                  {profile.fundingSource?.replace('_', ' ') || "Not specified"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Your organization location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={editData.organizationLocation?.address || ""}
                  onChange={(e) => handleNestedChange("organizationLocation", "address", e.target.value)}
                />
              ) : (
                <p className="text-sm">{profile.organizationLocation?.address || "Not specified"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={editData.organizationLocation?.city || ""}
                    onChange={(e) => handleNestedChange("organizationLocation", "city", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{profile.organizationLocation?.city || "Not specified"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={editData.organizationLocation?.state || ""}
                    onChange={(e) => handleNestedChange("organizationLocation", "state", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{profile.organizationLocation?.state || "Not specified"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services and Target Regions */}
        <Card>
          <CardHeader>
            <CardTitle>Services & Target Regions</CardTitle>
            <CardDescription>Your primary services and target areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Services</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['training', 'financial_support', 'market_access', 'technology_transfer', 'capacity_building', 'research', 'advocacy', 'logistics', 'quality_assurance', 'extension_services'].map((service) => (
                    <label key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.primaryServices?.includes(service) || false}
                        onChange={(e) => {
                          const current = editData.primaryServices || []
                          if (e.target.checked) {
                            handleInputChange("primaryServices", [...current, service])
                          } else {
                            handleInputChange("primaryServices", current.filter(s => s !== service))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.primaryServices?.map((service) => (
                    <Badge key={service} variant="secondary" className="capitalize">
                      {service.replace('_', ' ')}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No services specified</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Target Regions</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {['north_central', 'north_east', 'north_west', 'south_east', 'south_south', 'south_west'].map((region) => (
                    <label key={region} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editData.targetRegions?.includes(region) || false}
                        onChange={(e) => {
                          const current = editData.targetRegions || []
                          if (e.target.checked) {
                            handleInputChange("targetRegions", [...current, region])
                          } else {
                            handleInputChange("targetRegions", current.filter(r => r !== region))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{region.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.targetRegions?.map((region) => (
                    <Badge key={region} variant="outline" className="capitalize">
                      {region.replace('_', ' ')}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">No regions specified</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetFarmerCount">Target Farmer Count</Label>
              {isEditing ? (
                <Input
                  id="targetFarmerCount"
                  type="number"
                  value={editData.preferences?.targetFarmerCount || ""}
                  onChange={(e) => handleNestedChange("preferences", "targetFarmerCount", Number(e.target.value))}
                />
              ) : (
                <p className="text-sm">
                  {profile.preferences?.targetFarmerCount || "Not specified"} farmers
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
            <CardDescription>Your banking details for transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              {isEditing ? (
                <Input
                  id="bankName"
                  value={editData.bankAccount?.bankName || ""}
                  onChange={(e) => handleNestedChange("bankAccount", "bankName", e.target.value)}
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
            <CardDescription>Your organization impact statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.totalFarmersSupported || 0}
                </p>
                <p className="text-sm text-muted-foreground">Farmers Supported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.totalProjects || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile.performanceMetrics?.successRate || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ₦{(profile.performanceMetrics?.averageFarmerIncome || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Avg Farmer Income</p>
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
                      <span className="text-sm capitalize">{doc.type}</span>
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

      {/* Preferences and Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences & Settings</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Communication Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Communication Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={editData.settings?.emailNotifications || false}
                    onChange={(e) => handleNestedChange("settings", "emailNotifications", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={editData.settings?.smsNotifications || false}
                    onChange={(e) => handleNestedChange("settings", "smsNotifications", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={editData.settings?.pushNotifications || false}
                    onChange={(e) => handleNestedChange("settings", "pushNotifications", e.target.checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                </div>
              </div>
            </div>

            {/* Operational Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operational Preferences</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="preferredCommunicationMethod">Preferred Communication</Label>
                  {isEditing ? (
                    <select
                      id="preferredCommunicationMethod"
                      className="w-full p-2 border rounded-md"
                      value={editData.preferences?.preferredCommunicationMethod || ""}
                      onChange={(e) => handleNestedChange("preferences", "preferredCommunicationMethod", e.target.value)}
                    >
                      <option value="">Select method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="video_call">Video Call</option>
                      <option value="in_person">In Person</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.preferredCommunicationMethod?.replace('_', ' ') || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredMeetingFrequency">Meeting Frequency</Label>
                  {isEditing ? (
                    <select
                      id="preferredMeetingFrequency"
                      className="w-full p-2 border rounded-md"
                      value={editData.preferences?.preferredMeetingFrequency || ""}
                      onChange={(e) => handleNestedChange("preferences", "preferredMeetingFrequency", e.target.value)}
                    >
                      <option value="">Select frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="as_needed">As Needed</option>
                    </select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.preferredMeetingFrequency?.replace('_', ' ') || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredReportFormat">Report Format</Label>
                  {isEditing ? (
                    <select
                      id="preferredReportFormat"
                      className="w-full p-2 border rounded-md"
                      value={editData.preferences?.preferredReportFormat || ""}
                      onChange={(e) => handleNestedChange("preferences", "preferredReportFormat", e.target.value)}
                    >
                      <option value="">Select format</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="word">Word</option>
                      <option value="powerpoint">PowerPoint</option>
                      <option value="web_dashboard">Web Dashboard</option>
                    </select>
                  ) : (
                    <p className="text-sm capitalize">
                      {profile.preferences?.preferredReportFormat?.replace('_', ' ') || "Not specified"}
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

