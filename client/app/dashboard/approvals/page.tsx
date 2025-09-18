"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ApprovalsDashboard } from "@/components/approvals/approvals-dashboard"

export default function ApprovalsPage() {
  return (
    <DashboardLayout pageTitle="Harvest Approvals">
      <ApprovalsDashboard />
    </DashboardLayout>
  )
}
