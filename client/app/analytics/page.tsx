"use client"

import { useState, useEffect } from "react"
import { BuyerAnalytics } from "@/components/analytics/buyer-analytics"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <BuyerAnalytics />
      </div>
    </div>
  )
}
