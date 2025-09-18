"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { OnboardingPortal } from "@/components/onboarding/onboarding-portal"

export default function OnboardingPage() {
  return (
    <DashboardLayout pageTitle="Farmer Onboarding Portal">
      <OnboardingPortal />
    </DashboardLayout>
  )
}
