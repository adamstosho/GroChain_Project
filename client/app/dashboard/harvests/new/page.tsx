"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HarvestForm, type HarvestFormData } from "@/components/agricultural"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display } from "@/components/ui/typography"
import { useToast } from "@/hooks/use-toast"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import type { Harvest } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewHarvestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { guard, reset } = useSubmitOnce()
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `harvest-${Date.now()}`,
  )

  const handleSubmit = async (data: HarvestFormData & { images?: string[] }) => {
    if (!guard()) return

    try {
      setLoading(true)

      if (!data.coordinates) {
        throw new Error("Missing farm GPS coordinates — please detect your location before submitting.")
      }

      // Map our form data to backend schema
      const payload = {
        cropType: data.cropType,
        variety: data.variety,
        quantity: data.quantity,
        date: data.harvestDate,
        geoLocation: {
          lat: data.coordinates.latitude,
          lng: data.coordinates.longitude
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

      const response = await apiService.createHarvest(payload as Partial<Harvest>, {
        idempotencyKey: idempotencyKeyRef.current,
      })
      const rec = asRecord(response)
      const nested = asRecord(rec.data)
      const created = asRecord(rec.harvest ?? nested.harvest ?? rec.data ?? response)

      sessionStorage.removeItem("harvest-form-draft")

      const id = (typeof created._id === "string" ? created._id : undefined)
        || (typeof created.id === "string" ? created.id : undefined)
      toast({
        title: "Harvest logged successfully",
        description: "Your harvest batch has been recorded.",
      })

      if (id) {
        router.push(`/dashboard/harvests/${id}`)
      } else {
        router.push('/dashboard/harvests')
      }
    } catch (error) {
      console.error("Failed to create harvest:", error)
      toast({
        title: "Failed to log harvest",
        description: getErrorMessage(error, "Please check your connection and try again."),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      reset()
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/harvests")
  }

  return (
    <DashboardLayout pageTitle="Log New Harvest">
      <DashboardPageShell className="max-w-5xl mx-auto px-2 sm:px-4">
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

          <DashboardSubpageHeader
            title="Log New Harvest"
            description="Record details of your crop yield on GroChain for transparency and verification"
          />
        </div>

        {/* Harvest Form */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden rounded-2xl">
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
        <Card className="border border-border bg-muted/50 shadow-none rounded-2xl">
          <CardContent className="p-4 sm:p-6 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-2">
              <Display as="h3" variant="sub">Need Assistance Logging?</Display>
              <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
                If you have questions about quality standards, grading criteria, or moisture readings, 
                our cooperative agronomy experts are available to guide you.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" asChild size="sm" className="h-9 text-xs font-semibold bg-card border-border">
                <Link href="/dashboard/analytics">
                  View Analytics Hub
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm" className="h-9 text-xs font-semibold bg-card border-border">
                <Link href="/dashboard/qr-codes">
                  Manage Active QRs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
