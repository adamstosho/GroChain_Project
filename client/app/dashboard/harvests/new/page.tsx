"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HarvestForm, type HarvestFormData } from "@/components/agricultural"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useOfflineApi } from "@/hooks/use-offline-api"
import { ArrowLeft, Leaf } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewHarvestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { createHarvest, isOffline } = useOfflineApi()

  const handleSubmit = async (data: HarvestFormData) => {
    try {
      setLoading(true)

      // Map our form data to backend schema
      const payload = {
        cropType: data.cropType,
        variety: data.variety,
        quantity: data.quantity,
        date: data.harvestDate,
        geoLocation: {
          lat: data.coordinates?.latitude || 6.5244,
          lng: data.coordinates?.longitude || 3.3792
        },
        unit: data.unit,
        location: data.location,
        description: data.notes || "",
        quality: data.quality as "excellent" | "good" | "fair" | "poor",
        qualityGrade: data.grade,
        organic: data.organic,
        moistureContent: data.moistureContent,
        price: data.price,
        images: data.images || [],
        // Additional fields from our form
        soilType: data.soilType,
        irrigationType: data.irrigationType,
        pestManagement: data.pestManagement,
        certification: data.certification
      }

      // Use offline-aware API
      const result = await createHarvest(payload)

      if (result.success && !result.queued) {
        // Only navigate if successfully saved to server
        const created = result.data?.harvest || result.data
        const id = created?._id || created?.id

        if (id) {
          router.push(`/dashboard/harvests/${id}`)
        } else {
          router.push('/dashboard/harvests')
        }
      } else if (result.queued) {
        // If queued, just go back to harvests list
        router.push('/dashboard/harvests')
      }
    } catch (error) {
      console.error("Failed to create harvest:", error)
      toast({
        title: "Failed to log harvest",
        description: (error as any)?.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/harvests")
  }

  return (
    <DashboardLayout pageTitle="Log New Harvest">
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground h-9 px-2 -ml-2">
              <Link href="/dashboard/harvests" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Harvests</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Log New Harvest</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Record details of your crop yield on the blockchain ledger for transparency and verification
            </p>
          </div>
        </div>

        {/* Harvest Form */}
        <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <HarvestForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={loading}
              mode="create"
            />
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border border-slate-100 bg-slate-50/50 shadow-none rounded-2xl">
          <CardContent className="p-4 sm:p-6 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Need Assistance Logging?</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-normal">
                If you have questions about quality standards, grading criteria, or moisture readings, 
                our cooperative agronomy experts are available to guide you.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" asChild size="sm" className="h-9 text-xs font-semibold bg-white border-slate-200">
                <Link href="/dashboard/analytics">
                  View Analytics Hub
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm" className="h-9 text-xs font-semibold bg-white border-slate-200">
                <Link href="/dashboard/qr-codes">
                  Manage Active QRs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
