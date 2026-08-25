"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileSectionCard } from "@/components/profile/profile-section-card"
import { ProfileField, ProfileTagField } from "@/components/profile/profile-field"
import { ProfileStat, ProfileStatGrid } from "@/components/profile/profile-stat"
import {
  User,
  MapPin,
  Building2,
  AlertCircle,
  Banknote,
  ShoppingCart,
  Activity,
  Sprout,
  Contact,
  Wrench,
  Package,
  Mail,
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
  createdAt: string
  updatedAt: string
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
    lastActive: string
  }
  recentHarvests: any[]
  createdAt: string
  updatedAt: string
}

const ORGANIZATION_TYPE_OPTIONS = [
  { value: "cooperative", label: "Cooperative" },
  { value: "ngo", label: "NGO" },
  { value: "extension_agency", label: "Extension Agency" },
  { value: "market_association", label: "Market Association" },
  { value: "other", label: "Other" },
]

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]

const SERVICE_OPTIONS = ["Training", "Extension", "Marketing", "Finance", "Technology"]

export function ProfileForm() {
  const { user } = useAuthStore()

  if (user?.role === "farmer") {
    return <FarmerProfileView />
  }

  return <PartnerProfileView />
}

function ProfileSkeleton() {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 sm:h-20 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-1">Profile not found</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm">
        We couldn't load your profile information. Check your connection and try again.
      </p>
      <Button variant="outline" onClick={onRetry}>Try Again</Button>
    </div>
  )
}

// Partner Profile View
function PartnerProfileView() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
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
        const partnerProfile: PartnerProfile = {
          _id: profileData._id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          organization: profileData.partner?.organization || '',
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
          logo: profileData.partner?.logo || profileData.profile?.avatar || '',
          contactPerson: {
            name: profileData.partner?.contactPerson?.name || profileData.name || '',
            position: profileData.partner?.contactPerson?.position || '',
            phone: profileData.partner?.contactPerson?.phone || profileData.phone || '',
            email: profileData.partner?.contactPerson?.email || profileData.email || ''
          },
          services: profileData.partner?.services || [],
          coverageAreas: profileData.partner?.coverageAreas || [],
          certifications: profileData.partner?.certifications || [],
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt
        }
        setProfile(partnerProfile)
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

    if (!profile.name?.trim()) {
      toast({ title: "Validation Error", description: "Full name is required", variant: "destructive" })
      return
    }
    if (!profile.phone?.trim()) {
      toast({ title: "Validation Error", description: "Phone number is required", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)

      const updateData = {
        name: profile.name,
        phone: profile.phone,
        profile: {
          avatar: profile.logo,
          address: profile.address?.street,
          city: profile.address?.city,
          state: profile.address?.state,
          country: profile.address?.country,
          postalCode: profile.address?.postalCode
        },
        partner: {
          organization: profile.organization,
          organizationType: profile.organizationType,
          website: profile.website,
          description: profile.description,
          logo: profile.logo,
          contactPerson: profile.contactPerson,
          services: profile.services,
          coverageAreas: profile.coverageAreas,
          certifications: profile.certifications
        }
      }

      const response = await apiService.updateMyProfile(updateData)

      if (response.status === 'success' && response.data) {
        const updatedData = response.data as any
        const updatedProfile: PartnerProfile = {
          _id: updatedData._id,
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          role: updatedData.role,
          status: updatedData.status,
          organization: updatedData.partner?.organization || '',
          organizationType: updatedData.partner?.type || 'cooperative',
          address: {
            street: updatedData.profile?.address || '',
            city: updatedData.profile?.city || '',
            state: updatedData.profile?.state || '',
            postalCode: updatedData.profile?.postalCode || '',
            country: updatedData.profile?.country || 'Nigeria'
          },
          website: updatedData.partner?.website || '',
          description: updatedData.partner?.description || '',
          logo: updatedData.partner?.logo || updatedData.profile?.avatar || '',
          contactPerson: {
            name: updatedData.partner?.contactPerson?.name || updatedData.name || '',
            position: updatedData.partner?.contactPerson?.position || '',
            phone: updatedData.partner?.contactPerson?.phone || updatedData.phone || '',
            email: updatedData.partner?.contactPerson?.email || updatedData.email || ''
          },
          services: updatedData.partner?.services || [],
          coverageAreas: updatedData.partner?.coverageAreas || [],
          certifications: updatedData.partner?.certifications || [],
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt
        }

        setProfile(updatedProfile)
        updateUser({
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          profile: updatedData.profile
        })

        toast({ title: "Profile updated", description: "Your profile has been updated successfully" })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error saving profile",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (!profile) return
    setProfile({ ...profile, logo: newAvatarUrl })
    updateUser({ profile: { ...user?.profile, avatar: newAvatarUrl } })
  }

  if (isLoading) return <ProfileSkeleton />
  if (!profile) return <ProfileErrorState onRetry={fetchProfile} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileHero
        name={profile.name}
        subtitle={
          <>
            {profile.organization || 'No organization'}
            {profile.organizationType && ` • ${profile.organizationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
          </>
        }
        avatar={profile.logo}
        isEditing={isEditing}
        isSaving={isSaving}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onAvatarUpdate={handleAvatarUpdate}
        badges={
          <>
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {profile.status || 'unknown'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Partner since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : 'N/A'}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProfileSectionCard icon={User} title="Personal Information" description="Your name and contact details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Full Name" value={profile.name} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, name: v })} />
            <ProfileField label="Email Address" value={profile.email} isEditing={isEditing} locked icon={Mail} />
            <ProfileField label="Phone Number" value={profile.phone} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, phone: v })} />
            <ProfileField label="Website" value={profile.website || ''} isEditing={isEditing} placeholder="https://example.com"
              onChange={(v) => setProfile({ ...profile, website: v })} />
          </div>
          <ProfileField label="Description" value={profile.description || ''} isEditing={isEditing} type="textarea"
            placeholder="Tell us about your organization..." emptyText="No description added yet"
            onChange={(v) => setProfile({ ...profile, description: v })} />
        </ProfileSectionCard>

        <ProfileSectionCard icon={MapPin} title="Address" description="Where your organization is based" iconClassName="bg-secondary/15 text-secondary-foreground">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Street Address" value={profile.address?.street || ''} isEditing={isEditing} className="sm:col-span-2"
              onChange={(v) => setProfile({ ...profile, address: { ...profile.address, street: v } })} />
            <ProfileField label="City" value={profile.address?.city || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, address: { ...profile.address, city: v } })} />
            <ProfileField label="State" value={profile.address?.state || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, address: { ...profile.address, state: v } })} />
            <ProfileField label="Postal Code" value={profile.address?.postalCode || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, address: { ...profile.address, postalCode: v } })} />
            <ProfileField label="Country" value={profile.address?.country || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, address: { ...profile.address, country: v } })} />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard icon={Building2} title="Organization Details" description="How you're registered on GroChain" iconClassName="bg-accent/15 text-accent">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Organization Name" value={profile.organization || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, organization: v })} />
            <ProfileField label="Organization Type" value={profile.organizationType || ''} isEditing={isEditing}
              type="select" options={ORGANIZATION_TYPE_OPTIONS}
              onChange={(v) => setProfile({ ...profile, organizationType: v as PartnerProfile['organizationType'] })} />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard icon={Contact} title="Contact Person" description="Primary point of contact" iconClassName="bg-success/15 text-success">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Name" value={profile.contactPerson?.name || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, contactPerson: { ...profile.contactPerson, name: v } })} />
            <ProfileField label="Position" value={profile.contactPerson?.position || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, contactPerson: { ...profile.contactPerson, position: v } })} />
            <ProfileField label="Phone" value={profile.contactPerson?.phone || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, contactPerson: { ...profile.contactPerson, phone: v } })} />
            <ProfileField label="Email" value={profile.contactPerson?.email || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, contactPerson: { ...profile.contactPerson, email: v } })} />
          </div>
        </ProfileSectionCard>
      </div>

      <ProfileSectionCard icon={Wrench} title="Services & Coverage" description="What you offer and where you operate" className="lg:col-span-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services Offered</p>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SERVICE_OPTIONS.map((service) => {
                  const key = service.toLowerCase()
                  const active = (profile.services || []).includes(key)
                  return (
                    <Badge
                      key={service}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer select-none px-3 py-1.5 text-xs font-medium"
                      onClick={() => {
                        const newServices = active
                          ? (profile.services || []).filter((s) => s !== key)
                          : [...(profile.services || []), key]
                        setProfile({ ...profile, services: newServices })
                      }}
                    >
                      {service}
                    </Badge>
                  )
                })}
              </div>
            ) : (profile.services || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.services.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal capitalize">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">No services specified</p>
            )}
          </div>

          <ProfileTagField label="Coverage Areas" values={profile.coverageAreas || []} isEditing={isEditing}
            placeholder="Enter coverage areas separated by commas"
            onChange={(v) => setProfile({ ...profile, coverageAreas: v })} />
        </div>

        <ProfileTagField label="Certifications" values={profile.certifications || []} isEditing={isEditing}
          placeholder="e.g. ISO 9001, Fair Trade"
          onChange={(v) => setProfile({ ...profile, certifications: v })} />
      </ProfileSectionCard>
    </div>
  )
}

// Farmer Profile View
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

  const mapFarmerProfile = (profileData: any): FarmerProfile => ({
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
      totalHarvests: profileData.stats?.totalHarvests || 0,
      totalListings: profileData.stats?.totalListings || 0,
      totalOrders: profileData.stats?.totalOrders || 0,
      totalRevenue: profileData.stats?.totalRevenue || 0,
      lastActive: profileData.stats?.lastActive || new Date().toISOString()
    },
    recentHarvests: profileData.recentHarvests || [],
    createdAt: profileData.createdAt,
    updatedAt: profileData.updatedAt
  })

  const fetchFarmerProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getMyProfile()

      if (response.status === 'success' && response.data) {
        setProfile(mapFarmerProfile(response.data))
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

    if (!profile.name?.trim()) {
      toast({ title: "Validation Error", description: "Full name is required", variant: "destructive" })
      return
    }
    if (!profile.phone?.trim()) {
      toast({ title: "Validation Error", description: "Phone number is required", variant: "destructive" })
      return
    }

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
        setProfile(mapFarmerProfile(response.data))
        updateUser({
          name: (response.data as any).name,
          email: (response.data as any).email,
          phone: (response.data as any).phone,
          profile: (response.data as any).profile
        })

        toast({ title: "Profile updated", description: "Your farmer profile has been updated successfully" })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating farmer profile:', error)
      toast({
        title: "Error saving profile",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (!profile) return
    setProfile({ ...profile, avatar: newAvatarUrl })
    updateUser({ profile: { ...user?.profile, avatar: newAvatarUrl } })
  }

  if (isLoading) return <ProfileSkeleton />
  if (!profile) return <ProfileErrorState onRetry={fetchFarmerProfile} />

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileHero
        name={profile.name}
        subtitle={`Farmer • ${profile.location || 'Location not set'}`}
        avatar={profile.avatar}
        isEditing={isEditing}
        isSaving={isSaving}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onAvatarUpdate={handleAvatarUpdate}
        badges={
          <>
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {profile.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Farmer since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : 'N/A'}
            </Badge>
          </>
        }
        stats={
          <ProfileStatGrid>
            <ProfileStat icon={Package} label="Harvests" value={profile.stats?.totalHarvests || 0} colorClassName="bg-success/10 text-success" />
            <ProfileStat icon={Banknote} label="Revenue" value={`₦${(profile.stats?.totalRevenue || 0).toLocaleString()}`} />
            <ProfileStat icon={ShoppingCart} label="Listings" value={profile.stats?.totalListings || 0} colorClassName="bg-accent/10 text-accent" />
            <ProfileStat icon={Activity} label="Orders" value={profile.stats?.totalOrders || 0} colorClassName="bg-warning/10 text-warning" />
          </ProfileStatGrid>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProfileSectionCard icon={User} title="Personal Information" description="Your basic details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Full Name" value={profile.name || ''} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, name: v })} />
            <ProfileField label="Email" value={profile.email || ''} isEditing={isEditing} locked icon={Mail} />
            <ProfileField label="Phone" value={profile.phone || ''} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, phone: v })} />
            <ProfileField label="Age" value={profile.age || ''} isEditing={isEditing} type="number"
              onChange={(v) => setProfile({ ...profile, age: v })} />
            <ProfileField label="Gender" value={profile.gender || ''} isEditing={isEditing} type="select"
              options={GENDER_OPTIONS} placeholder="Select gender"
              onChange={(v) => setProfile({ ...profile, gender: v })} />
            <ProfileField label="Education" value={profile.education || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, education: v })} />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard icon={Sprout} title="Farm Information" description="Details about your farming operation" iconClassName="bg-success/15 text-success">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Farm Size (hectares)" value={profile.farmSize || ''} isEditing={isEditing} placeholder="e.g. 5.5"
              onChange={(v) => setProfile({ ...profile, farmSize: v })} />
            <ProfileField label="Farming Experience (years)" value={profile.experience || ''} isEditing={isEditing} placeholder="e.g. 10"
              onChange={(v) => setProfile({ ...profile, experience: v })} />
          </div>
          <ProfileTagField label="Primary Crops" values={profile.primaryCrops || []} isEditing={isEditing}
            placeholder="e.g. Maize, Cassava, Tomatoes"
            onChange={(v) => setProfile({ ...profile, primaryCrops: v })} />
          <ProfileTagField label="Certifications" values={profile.certifications || []} isEditing={isEditing}
            placeholder="e.g. Organic, Fair Trade"
            onChange={(v) => setProfile({ ...profile, certifications: v })} />
        </ProfileSectionCard>

        <ProfileSectionCard icon={MapPin} title="Address" description="Where your farm is located" iconClassName="bg-secondary/15 text-secondary-foreground">
          <ProfileField label="Street Address" value={profile.address || ''} isEditing={isEditing} placeholder="Enter your full address"
            onChange={(v) => setProfile({ ...profile, address: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="City" value={profile.city || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, city: v })} />
            <ProfileField label="State" value={profile.state || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, state: v })} />
            <ProfileField label="Country" value={profile.country || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, country: v })} />
            <ProfileField label="Postal Code" value={profile.postalCode || ''} isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, postalCode: v })} />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard icon={User} title="Bio" description="Tell us about yourself and your farming journey" iconClassName="bg-accent/15 text-accent">
          <ProfileField label="About" value={profile.bio || ''} isEditing={isEditing} type="textarea" rows={5}
            placeholder="Tell us about yourself and your farming experience..." emptyText="No bio added yet"
            onChange={(v) => setProfile({ ...profile, bio: v })} />
        </ProfileSectionCard>
      </div>

      {profile.recentHarvests && profile.recentHarvests.length > 0 && (
        <ProfileSectionCard icon={Activity} title="Recent Harvests" description="Your latest harvest activity">
          <div className="space-y-2.5">
            {profile.recentHarvests.slice(0, 3).map((harvest: any, index: number) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{harvest.cropType}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {harvest.quantity}kg • {harvest.qualityGrade} • {new Date(harvest.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={harvest.status === 'approved' ? 'default' : 'secondary'} className="shrink-0 ml-2">
                  {harvest.status}
                </Badge>
              </div>
            ))}
          </div>
        </ProfileSectionCard>
      )}
    </div>
  )
}
