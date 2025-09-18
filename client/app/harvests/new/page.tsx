"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HarvestForm, type HarvestFormData } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewHarvestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

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

      const response = await apiService.createHarvest(payload)
      const created = (response as any)?.harvest || (response as any)?.data?.harvest || (response as any)
      const id = created?._id || created?.id
      
      toast({ 
        title: "Harvest logged", 
        description: "Your harvest has been created successfully." 
      })
      
      router.push(id ? `/harvests/${id}` : "/harvests")
    } catch (error) {
      console.error("Failed to create harvest:", error)
      toast({ 
        title: "Failed to create harvest", 
        description: (error as any)?.message || "Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/harvests")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/harvests" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Harvests
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <HarvestForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}
