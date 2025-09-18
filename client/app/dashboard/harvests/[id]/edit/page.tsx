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

  // Validate harvest ID
  if (!harvestId || harvestId === 'undefined' || !params.id) {
    return (
      <DashboardLayout pageTitle="Invalid Harvest ID">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Harvest ID</h2>
                  <p className="text-gray-600 mb-6">The harvest ID provided is not valid.</p>
                  <Button asChild>
                    <Link href="/dashboard/harvests">Return to Harvests</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  useEffect(() => {
    fetchHarvestData()
  }, [harvestId])

  const fetchHarvestData = async () => {
    try {
      setFetching(true)
      const response = await apiService.getHarvestById(harvestId)
      const harvest = (response as any)?.harvest || (response as any)?.data?.harvest || response
      
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

  if (fetching) {
    return (
      <DashboardLayout pageTitle="Loading Harvest...">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-gray-200">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <div>
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Loading Harvest Data</h2>
                  <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch your harvest information...</p>
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
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Harvest</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
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
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
              <Link href={`/dashboard/harvests/${harvestId}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Harvest Details</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Edit Harvest</h1>
              <div className="flex flex-wrap gap-2">
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <Badge variant="outline" className="text-green-700 border-green-200 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Saved {format(lastSaved, 'HH:mm')}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Update your harvest information and details for better accuracy and traceability
            </p>
          </div>
        </div>

        {/* Edit Guidelines */}
        <Card className="border border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-center text-sm sm:text-base font-medium flex items-center justify-center gap-2 text-blue-900">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Edit Guidelines</span>
            </CardTitle>
            <CardDescription className="text-center text-blue-700 text-sm">
              Important information about editing your harvest
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center space-y-2 p-2 sm:p-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <span className="text-amber-600 font-bold text-xs sm:text-sm">!</span>
                </div>
                <h3 className="font-medium text-xs sm:text-sm text-gray-900">Status Changes</h3>
                <p className="text-xs text-gray-600 leading-tight">Editing may affect verification status</p>
              </div>

              <div className="text-center space-y-2 p-2 sm:p-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <span className="text-amber-600 font-bold text-xs sm:text-sm">✓</span>
                </div>
                <h3 className="font-medium text-xs sm:text-sm text-gray-900">Data Accuracy</h3>
                <p className="text-xs text-gray-600 leading-tight">Ensure all information is correct</p>
              </div>

              <div className="text-center space-y-2 p-2 sm:p-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <span className="text-amber-600 font-bold text-xs sm:text-sm">📝</span>
                </div>
                <h3 className="font-medium text-xs sm:text-sm text-gray-900">Audit Trail</h3>
                <p className="text-xs text-gray-600 leading-tight">Changes are logged for transparency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Form */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
              <Edit className="h-4 w-4 text-gray-500" />
              Edit Harvest Information
            </CardTitle>
            <CardDescription className="text-sm">
              Modify the details below to update your harvest. All changes will be tracked for transparency.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
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

        {/* Action Buttons */}
        <Card className="border border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="text-center lg:text-left">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Ready to Update?</h3>
                <p className="text-gray-600 text-sm mt-1">Review your changes and save when ready</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={() => document.querySelector('form')?.requestSubmit()}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Harvest
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
