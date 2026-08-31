"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileSectionCard } from "@/components/profile/profile-section-card"
import { ProfileField } from "@/components/profile/profile-field"
import { ProfileStat, ProfileStatGrid } from "@/components/profile/profile-stat"
import {
  User,
  MapPin,
  AlertCircle,
  Banknote,
  ShoppingCart,
  Heart,
  Building,
  ShoppingBag,
  SlidersHorizontal,
  Mail,
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
    lastActive: string
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
  createdAt: string
  updatedAt: string
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

const EMPTY_PREFS: BuyerProfile["preferences"] = {
  cropTypes: [],
  priceRange: { min: 0, max: 100000 },
  qualityPreferences: [],
  organicPreference: false,
}

function withBuyerPrefs(
  profile: BuyerProfile,
  patch: Partial<BuyerProfile["preferences"]>
): BuyerProfile {
  return {
    ...profile,
    preferences: {
      ...EMPTY_PREFS,
      ...profile.preferences,
      ...patch,
    },
  }
}

function mapBuyerProfile(profileData: unknown): BuyerProfile {
  const data = asRecord(profileData)
  const profile = asRecord(data.profile)
  const stats = asRecord(data.stats)
  const preferences = asRecord(data.preferences)
  const priceRange = asRecord(preferences.priceRange)
  return {
    _id: asString(data._id),
    name: asString(data.name),
    email: asString(data.email),
    phone: asString(data.phone),
    role: "buyer",
    status: data.status === "inactive" || data.status === "suspended" ? data.status : "active",
    company: asString(data.company),
    businessType: asString(data.businessType),
    address: {
      street: asString(profile.address),
      city: asString(profile.city),
      state: asString(profile.state),
      postalCode: asString(profile.postalCode),
      country: asString(profile.country, "Nigeria"),
    },
    website: asString(data.website),
    bio: asString(profile.bio),
    avatar: asString(profile.avatar),
    stats: {
      totalOrders: asNumber(stats.totalOrders),
      totalSpent: asNumber(stats.totalSpent),
      favoriteProducts: asNumber(stats.favoriteProducts),
      lastActive: asString(stats.lastActive, new Date().toISOString()),
    },
    preferences: {
      cropTypes: asStringList(preferences.cropTypes),
      priceRange: {
        min: asNumber(priceRange.min, 0),
        max: asNumber(priceRange.max, 100000),
      },
      qualityPreferences: asStringList(preferences.qualityPreferences),
      organicPreference: Boolean(preferences.organicPreference),
    },
    createdAt: asString(data.createdAt),
    updatedAt: asString(data.updatedAt),
  }
}

const CROP_OPTIONS = ['Maize', 'Rice', 'Cassava', 'Yam', 'Tomato', 'Pepper', 'Onion', 'Potato', 'Sorghum', 'Millet']
const QUALITY_OPTIONS = ['Premium', 'Standard', 'Organic', 'Fair Trade', 'Local']

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

export function BuyerProfileForm() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<BuyerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getMyProfile()

      if (response.status === 'success' && response.data) {
        setProfile(mapBuyerProfile(response.data))
      } else {
        throw new Error('Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error loading profile",
        description: getErrorMessage(error, "Failed to load profile data"),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
        const mapped = mapBuyerProfile(response.data)
        setProfile(mapped)
        updateUser({
          name: mapped.name,
          email: mapped.email,
          phone: mapped.phone,
          profile: {
            bio: mapped.bio,
            avatar: mapped.avatar,
            address: mapped.address.street,
            city: mapped.address.city,
            state: mapped.address.state,
            country: mapped.address.country,
            postalCode: mapped.address.postalCode,
          }
        })

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "default"
        })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)

      // Handle different types of errors
      let errorMessage = getErrorMessage(error, "Failed to save profile. Please try again.")

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (errorMessage.includes('validation')) {
        // keep API validation message
      } else if (errorMessage.includes('unauthorized')) {
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
      setProfile({ ...profile, avatar: newAvatarUrl })
      updateUser({
        profile: {
          ...user?.profile,
          avatar: newAvatarUrl
        }
      })
    }
  }

  if (isLoading) return <ProfileSkeleton />

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Profile not found</h3>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
          We couldn't load your profile information. Check your connection and try again.
        </p>
        <Button variant="outline" onClick={fetchProfile}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileHero
        name={profile.name}
        subtitle={<>Buyer{profile.company && ` • ${profile.company}`}</>}
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
              Buyer since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : 'N/A'}
            </Badge>
          </>
        }
        stats={
          <ProfileStatGrid>
            <ProfileStat icon={ShoppingCart} label="Orders" value={profile.stats?.totalOrders || 0} />
            <ProfileStat icon={Banknote} label="Total Spent" value={`₦${(profile.stats?.totalSpent || 0).toLocaleString()}`} colorClassName="bg-success/10 text-success" />
            <ProfileStat icon={Heart} label="Favorites" value={profile.stats?.favoriteProducts || 0} colorClassName="bg-accent/10 text-accent" />
            <ProfileStat icon={Building} label="Last Active" value={profile.stats?.lastActive ? new Date(profile.stats.lastActive).toLocaleDateString() : 'N/A'} colorClassName="bg-warning/10 text-warning" />
          </ProfileStatGrid>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProfileSectionCard icon={User} title="Personal Information" description="Your name and business details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <ProfileField label="Full Name" value={profile.name || ''} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, name: v })} />
            <ProfileField label="Email Address" value={profile.email || ''} isEditing={isEditing} locked icon={Mail} />
            <ProfileField label="Phone Number" value={profile.phone || ''} isEditing={isEditing} required
              onChange={(v) => setProfile({ ...profile, phone: v })} />
            <ProfileField label="Company Name" value={profile.company || ''} isEditing={isEditing} placeholder="Your company name"
              onChange={(v) => setProfile({ ...profile, company: v })} />
            <ProfileField label="Business Type" value={profile.businessType || ''} isEditing={isEditing} placeholder="e.g. Restaurant, Retail, Export"
              onChange={(v) => setProfile({ ...profile, businessType: v })} />
            <ProfileField label="Website" value={profile.website || ''} isEditing={isEditing} placeholder="https://example.com"
              onChange={(v) => setProfile({ ...profile, website: v })} />
          </div>
          <ProfileField label="Bio" value={profile.bio || ''} isEditing={isEditing} type="textarea"
            placeholder="Tell us about your business..." emptyText="No bio added yet"
            onChange={(v) => setProfile({ ...profile, bio: v })} />
        </ProfileSectionCard>

        <ProfileSectionCard icon={MapPin} title="Address" description="Where we can reach you" iconClassName="bg-secondary/15 text-secondary-foreground">
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
      </div>

      <ProfileSectionCard icon={ShoppingBag} title="Buying Preferences" description="Helps sellers surface produce you'll actually want" iconClassName="bg-accent/15 text-accent">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferred Crop Types</p>
          {isEditing ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {CROP_OPTIONS.map((crop) => {
                const active = (profile.preferences?.cropTypes || []).includes(crop)
                return (
                  <Badge
                    key={crop}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none px-3 py-1.5 text-xs font-medium"
                    onClick={() => {
                      const current = profile.preferences?.cropTypes || []
                      const newCrops = active ? current.filter(c => c !== crop) : [...current, crop]
                      setProfile(withBuyerPrefs(profile, { cropTypes: newCrops }))
                    }}
                  >
                    {crop}
                  </Badge>
                )
              })}
            </div>
          ) : (profile.preferences?.cropTypes || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.preferences.cropTypes.map((c) => (
                <Badge key={c} variant="secondary" className="font-normal">{c}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">No crop preferences set</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <ProfileField label="Minimum Price Range (₦)" value={String(profile.preferences?.priceRange?.min ?? 0)} isEditing={isEditing} type="number"
            onChange={(v) => setProfile(withBuyerPrefs(profile, { priceRange: { ...(profile.preferences?.priceRange || { min: 0, max: 100000 }), min: parseInt(v) || 0 } }))} />
          <ProfileField label="Maximum Price Range (₦)" value={String(profile.preferences?.priceRange?.max ?? 100000)} isEditing={isEditing} type="number"
            onChange={(v) => setProfile(withBuyerPrefs(profile, { priceRange: { ...(profile.preferences?.priceRange || { min: 0, max: 100000 }), max: parseInt(v) || 100000 } }))} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3" /> Quality Preferences
          </p>
          {isEditing ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUALITY_OPTIONS.map((quality) => {
                const active = (profile.preferences?.qualityPreferences || []).includes(quality)
                return (
                  <Badge
                    key={quality}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none px-3 py-1.5 text-xs font-medium"
                    onClick={() => {
                      const current = profile.preferences?.qualityPreferences || []
                      const newQualities = active ? current.filter(q => q !== quality) : [...current, quality]
                      setProfile(withBuyerPrefs(profile, { qualityPreferences: newQualities }))
                    }}
                  >
                    {quality}
                  </Badge>
                )
              })}
            </div>
          ) : (profile.preferences?.qualityPreferences || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.preferences.qualityPreferences.map((q) => (
                <Badge key={q} variant="secondary" className="font-normal">{q}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">No quality preferences set</p>
          )}
        </div>
      </ProfileSectionCard>
    </div>
  )
}
