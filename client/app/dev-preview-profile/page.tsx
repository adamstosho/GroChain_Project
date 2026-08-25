"use client"

/**
 * TEMPORARY visual QA harness for the redesigned profile pages.
 * Mocks auth + apiService so all four role variants can be inspected
 * without a live backend/DB or real credentials. Delete before shipping.
 */

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/auth"
import { apiService } from "@/lib/api"
import { ProfileForm } from "@/components/profile/profile-form"
import { BuyerProfileForm } from "@/components/profile/buyer-profile-form"
import { AdminProfile } from "@/components/profile/admin-profile"

type Role = "farmer" | "partner" | "buyer" | "admin"

const now = new Date().toISOString()

const FARMER_FIXTURE = {
  _id: "farmer1",
  name: "Ngozi Eze",
  email: "ngozi.eze@example.com",
  phone: "+2348012345678",
  role: "farmer",
  status: "active",
  location: "Ibadan, Oyo State",
  gender: "female",
  age: 34,
  education: "Secondary School",
  profile: {
    avatar: "",
    bio: "Third-generation cassava and maize farmer working a 6.5 hectare plot just outside Ibadan. Focused on organic practices and steady supply for local markets.",
    address: "12 Ogunlana Street",
    city: "Ibadan",
    state: "Oyo",
    country: "Nigeria",
    postalCode: "200001",
    farmSize: "6.5",
    experience: "12",
    certifications: ["Organic", "GAP Certified"],
  },
  preferences: { cropTypes: ["Maize", "Cassava", "Tomatoes"] },
  stats: { totalHarvests: 24, totalListings: 9, totalOrders: 41, totalRevenue: 1245000, lastActive: now },
  recentHarvests: [
    { cropType: "Maize", quantity: 850, qualityGrade: "Grade A", status: "approved", createdAt: now },
    { cropType: "Cassava", quantity: 1200, qualityGrade: "Grade B", status: "pending", createdAt: now },
  ],
  createdAt: "2023-03-11T00:00:00.000Z",
  updatedAt: now,
}

const PARTNER_FIXTURE = {
  _id: "partner1",
  name: "Adaeze Okoro",
  email: "adaeze.okoro@agrilink.ng",
  phone: "+2348023456789",
  role: "partner",
  status: "active",
  profile: { avatar: "", address: "45 Allen Avenue", city: "Ikeja", state: "Lagos", country: "Nigeria", postalCode: "100001" },
  partner: {
    organization: "AgriLink Cooperative",
    type: "cooperative",
    website: "https://agrilink.ng",
    description: "A farmer cooperative supporting over 300 smallholder farmers across South-West Nigeria with training, inputs financing, and market access.",
    logo: "",
    contactPerson: { name: "Adaeze Okoro", position: "Programs Lead", phone: "+2348023456789", email: "adaeze.okoro@agrilink.ng" },
    services: ["training", "extension", "finance"],
    coverageAreas: ["Lagos", "Ogun", "Oyo"],
    certifications: ["ISO 9001"],
  },
  createdAt: "2022-08-01T00:00:00.000Z",
  updatedAt: now,
}

const BUYER_FIXTURE = {
  _id: "buyer1",
  name: "Chinedu Obi",
  email: "chinedu.obi@freshmart.ng",
  phone: "+2348034567890",
  role: "buyer",
  status: "active",
  company: "FreshMart Foods",
  businessType: "Retail",
  website: "https://freshmart.ng",
  profile: {
    avatar: "",
    bio: "Sourcing fresh produce for a chain of 12 grocery stores across Lagos.",
    address: "8 Marina Road",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    postalCode: "101241",
  },
  preferences: {
    cropTypes: ["Tomato", "Pepper", "Onion"],
    priceRange: { min: 5000, max: 250000 },
    qualityPreferences: ["Premium", "Organic"],
    organicPreference: true,
  },
  stats: { totalOrders: 63, totalSpent: 4830000, favoriteProducts: 18, lastActive: now },
  createdAt: "2021-11-20T00:00:00.000Z",
  updatedAt: now,
}

const ADMIN_FIXTURE = {
  _id: "admin1",
  name: "Tolu Bankole",
  email: "tolu.bankole@grochain.africa",
  phone: "+2348045678901",
  location: "Lagos, Nigeria",
  avatar: "",
  employeeId: "ADM-4F21A9",
  department: "Operations",
  position: "Platform Operations Manager",
  accessLevel: "admin",
  permissions: ["user_management", "system_configuration", "data_management", "security_settings"],
  officeLocation: { address: "14 Admiralty Way", city: "Lekki", state: "Lagos" },
  contactInfo: { workPhone: "+2348045678901", extension: "204", emergencyContact: "Ifeoma Bankole", emergencyPhone: "+2348056789012" },
  performanceMetrics: { totalUsersManaged: 3482 },
  isActive: true,
  lastActivity: now,
  createdAt: "2021-05-14T00:00:00.000Z",
  updatedAt: now,
}

const ADMIN_ACTIVITY_FIXTURE = {
  logs: [
    { id: "login_1", action: "Login", description: "Successfully logged into admin dashboard", timestamp: now, ipAddress: "System", userAgent: "Web Browser", status: "success" },
    { id: "created_1", action: "Account Created", description: "Admin account was created", timestamp: "2021-05-14T00:00:00.000Z", ipAddress: "System", userAgent: "Web Browser", status: "success" },
  ],
}

const ADMIN_SECURITY_FIXTURE = { lastPasswordChange: "2025-01-10T00:00:00.000Z", lastLogin: now }

function applyRole(role: Role) {
  const base = { isAuthenticated: true, hasHydrated: true, token: "preview-token" as any }

  if (role === "farmer") {
    useAuthStore.setState({ ...base, user: { role: "farmer", name: FARMER_FIXTURE.name, profile: FARMER_FIXTURE.profile } as any })
    ;(apiService as any).getMyProfile = async () => ({ status: "success", data: FARMER_FIXTURE })
    ;(apiService as any).getFarmerAnalytics = async () => ({ status: "success", data: {} })
  } else if (role === "partner") {
    useAuthStore.setState({ ...base, user: { role: "partner", name: PARTNER_FIXTURE.name, profile: PARTNER_FIXTURE.profile } as any })
    ;(apiService as any).getMyProfile = async () => ({ status: "success", data: PARTNER_FIXTURE })
  } else if (role === "buyer") {
    useAuthStore.setState({ ...base, user: { role: "buyer", name: BUYER_FIXTURE.name, profile: BUYER_FIXTURE.profile } as any })
    ;(apiService as any).getMyProfile = async () => ({ status: "success", data: BUYER_FIXTURE })
  } else if (role === "admin") {
    useAuthStore.setState({ ...base, user: { role: "admin", name: ADMIN_FIXTURE.name, profile: { avatar: "" } } as any })
    ;(apiService as any).getAdminProfile = async () => ({ status: "success", data: ADMIN_FIXTURE })
    ;(apiService as any).get = async (url: string) => {
      if (url.includes("activity")) return { status: "success", data: ADMIN_ACTIVITY_FIXTURE }
      if (url.includes("security")) return { status: "success", data: ADMIN_SECURITY_FIXTURE }
      return { status: "success", data: {} }
    }
  }
}

export default function DevPreviewProfilePage() {
  const [role, setRole] = useState<Role>("farmer")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    applyRole(role)
    // Defer mounting the real profile component until the mocks are in place,
    // otherwise its own mount-time fetch races the real (unmocked) apiService.
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [role])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex gap-2 border-b border-border bg-card p-3">
        {(["farmer", "partner", "buyer", "admin"] as Role[]).map((r) => (
          <button
            key={r}
            data-role={r}
            onClick={() => setRole(r)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium capitalize ${
              role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div key={role} className="mx-auto max-w-6xl p-4 sm:p-8">
        {ready ? (role === "admin" ? <AdminProfile /> : role === "buyer" ? <BuyerProfileForm /> : <ProfileForm />) : null}
      </div>
    </div>
  )
}
