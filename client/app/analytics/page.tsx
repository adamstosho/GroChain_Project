"use client"

import { BuyerAnalytics } from "@/components/analytics/buyer-analytics"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10">
      <div className="container mx-auto px-4 py-8">
        <BuyerAnalytics />
      </div>
    </div>
  )
}
