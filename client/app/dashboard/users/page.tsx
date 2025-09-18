"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UserManagement } from "@/components/dashboard/user-management"

export default function UsersPage() {
  return (
    <DashboardLayout pageTitle="Users Management">
      <UserManagement />
    </DashboardLayout>
  )
}
