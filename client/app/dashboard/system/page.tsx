"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SystemManagement } from "@/components/system/system-management"

export default function SystemPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="System Management">
        <div className="flex h-screen bg-background">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-lg font-medium">Loading system management...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  // Only render SystemManagement for admin users
  if (user.role !== 'admin') {
    return (
      <DashboardLayout pageTitle="System Management">
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to access system management.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="System Management">
      <SystemManagement />
    </DashboardLayout>
  )
}
