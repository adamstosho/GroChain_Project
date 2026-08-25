"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HarvestForm, type HarvestFormData } from "@/components/agricultural"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Leaf, Edit, Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

export default function EditHarvestPage() {
  const router = useRouter()
  const params = useParams()
  const harvestId = params.id as string
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<Partial<HarvestFormData> | undefined>()
  const [fetching, setFetching] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (harvestId && harvestId !== 'undefined' && params.id) {
      fetchHarvestData()
    }
  }, [harvestId])

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Pre-fetch is done via useEffect
  
  const fetchHarvestData = async () => {
    try {
      setFetching(true)
      const response = await apiService.getHarvestById(harvestId)
      const harvest = (response as { harvest?: any; data?: { harvest?: any } })?.harvest || 
                      (response as { harvest?: any; data?: { harvest?: any } })?.data?.harvest || 
                      response as any

      if (harvest) {
        // Map backend data to our form format with better type safety
        const formData: Partial<HarvestFormData> = {
          cropType: harvest.cropType || "",
          variety: harvest.variety || "Standard",
          harvestDate: harvest.date || harvest.harvestDate
            ? new Date(harvest.date || harvest.harvestDate)
            : new Date(),
          quantity: typeof harvest.quantity === 'number' ? harvest.quantity : 0,
          unit: harvest.unit || "kg",
          location: harvest.location || "",
          quality: harvest.quality || "good",
          grade: harvest.qualityGrade || "B",
          organic: Boolean(harvest.organic),
          moistureContent: typeof harvest.moistureContent === 'number'
            ? harvest.moistureContent
            : 15,
          price: typeof harvest.price === 'number' ? harvest.price : 0,
          notes: harvest.description || harvest.notes || "",
          images: Array.isArray(harvest.images) ? harvest.images : [],
          coordinates: harvest.geoLocation || harvest.coordinates ? {
            latitude: harvest.geoLocation?.lat || harvest.coordinates?.latitude || 0,
            longitude: harvest.geoLocation?.lng || harvest.coordinates?.longitude || 0
          } : undefined,
          soilType: harvest.soilType || "loam",
          irrigationType: harvest.irrigationType || "rainfed",
          pestManagement: harvest.pestManagement || "conventional"
        }
        setInitialData(formData)
      } else {
        setError("Harvest not found")
        toast({
          title: "Harvest Not Found",
          description: "The harvest you're trying to edit doesn't exist.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch harvest:", error)
      setError("Failed to load harvest data")
      toast({
        title: "Error",
        description: "Failed to load harvest data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFetching(false)
    }
  }

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

      // Update harvest via API
      const response = await apiService.updateHarvest(harvestId, payload)

      if (response.status === 'success') {
        setHasUnsavedChanges(false)
        setLastSaved(new Date())

        toast({
          title: "Harvest Updated Successfully! ✨",
          description: "Your harvest information has been updated and saved.",
          variant: "default"
        })

        // Redirect to harvest detail page after a short delay
        setTimeout(() => {
          router.push(`/dashboard/harvests/${harvestId}`)
        }, 1500)
      } else {
        throw new Error(response.message || 'Failed to update harvest')
      }
    } catch (error) {
      console.error("Failed to update harvest:", error)
      toast({
        title: "Failed to update harvest",
        description: (error as any)?.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave without saving?"
      )
      if (!confirmLeave) return
    }
    router.push(`/dashboard/harvests/${harvestId}`)
  }

  // Track form changes for unsaved changes warning
  const handleFormChange = () => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true)
    }
  }



  if (fetching) {
    return (
      <DashboardLayout pageTitle="Loading Harvest...">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-border">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <div>
                  <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">Loading Harvest Data</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Please wait while we fetch your harvest information...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Error">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-destructive/10 bg-destructive/10">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Error Loading Harvest</h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/harvests">Back to Harvests</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Edit Harvest">
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground h-9 px-2 -ml-2">
              <Link href={`/dashboard/harvests/${harvestId}`} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Harvest Details</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Edit Harvest</h1>
              <div className="flex flex-wrap gap-2">
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/10 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <Badge variant="outline" className="text-success border-success/10 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Saved {format(lastSaved, 'HH:mm')}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Modify the on-chain logged harvest attributes. All updates are recorded in the audit logs.
            </p>
          </div>
        </div>

        {/* Harvest Form */}
        <Card className="border border-border shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <HarvestForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onFormChange={handleFormChange}
              isLoading={loading}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
