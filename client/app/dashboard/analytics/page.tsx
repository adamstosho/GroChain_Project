"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FarmerAnalytics } from "@/components/analytics/farmer-analytics"
import { BuyerAnalytics } from "@/components/analytics/buyer-analytics"
import { PartnerAnalytics } from "@/components/analytics/partner-analytics"
import { AdminAnalytics } from "@/components/analytics/admin-analytics"

export default function AnalyticsPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Analytics Dashboard">
        <div className="flex h-screen bg-background">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-lg font-medium">Loading analytics...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  const renderAnalytics = () => {
    switch (user.role) {
      case "farmer":
        return <FarmerAnalytics />
      case "buyer":
        return <BuyerAnalytics />
      case "partner":
        return <PartnerAnalytics />
      case "admin":
        return <AdminAnalytics />
      default:
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Invalid Role</h3>
              <p className="text-gray-600">Your role does not have access to analytics.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <DashboardLayout pageTitle="Analytics Dashboard">
      {renderAnalytics()}
    </DashboardLayout>
  )
}
