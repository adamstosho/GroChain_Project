"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HarvestForm, type HarvestFormData } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

export default function EditHarvestPage() {
  const router = useRouter()
  const params = useParams()
  const harvestId = params.id as string
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<Partial<HarvestFormData> | undefined>()
  const [fetching, setFetching] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchHarvestData()
  }, [harvestId])

  const fetchHarvestData = async () => {
    try {
      setFetching(true)
      const response = await apiService.getHarvestById(harvestId)
      const harvest = (response as any)?.harvest || (response as any)?.data?.harvest || response
      
      if (harvest) {
        // Map backend data to our form format
        const formData: Partial<HarvestFormData> = {
          cropType: harvest.cropType,
          variety: harvest.variety || "Standard",
          harvestDate: new Date(harvest.date || harvest.harvestDate || Date.now()),
          quantity: harvest.quantity,
          unit: harvest.unit,
          location: harvest.location,
          quality: harvest.quality || "good",
          grade: harvest.qualityGrade || "B",
          organic: harvest.organic || false,
          moistureContent: harvest.moistureContent || 15,
          price: harvest.price || 0,
          notes: harvest.description || "",
          images: harvest.images || [],
          coordinates: harvest.geoLocation ? {
            latitude: harvest.geoLocation.lat,
            longitude: harvest.geoLocation.lng
          } : undefined,
          soilType: harvest.soilType || "loam",
          irrigationType: harvest.irrigationType || "rainfed",
          pestManagement: harvest.pestManagement || "conventional",
          certification: harvest.certification || ""
        }
        setInitialData(formData)
      }
    } catch (error) {
      console.error("Failed to fetch harvest:", error)
      toast({
        title: "Error",
        description: "Failed to load harvest data. Please try again.",
        variant: "destructive"
      })
      router.push("/harvests")
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (data: HarvestFormData) => {
    try {
      setLoading(true)
      
      // Map our form data to backend schema
      const qualityMap: Record<string, string> = { 
        excellent: "excellent", 
        good: "good", 
        fair: "fair", 
        poor: "poor" 
      }
      
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
        quality: qualityMap[data.quality] || "good" as any,
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

      await apiService.updateHarvest(harvestId, payload)
      
      toast({ 
        title: "Harvest updated", 
        description: "Your harvest has been updated successfully." 
      })
      
      router.push(`/harvests/${harvestId}`)
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
    router.push(`/harvests/${harvestId}`)
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading harvest data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/harvests/${harvestId}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Harvest
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <HarvestForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
            mode="edit"
          />
        </div>
      </div>
    </div>
  )
}
