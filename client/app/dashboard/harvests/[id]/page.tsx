"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, AlertCircle, QrCode, Download, Share2, Eye, Package, Calendar, MapPin, Scale, CheckCircle2, Navigation } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface HarvestDetail {
  _id: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  date: string
  location: string | { city?: string; state?: string }
  quality: string
  qualityGrade?: string
  status: string
  batchId?: string
  price?: number
  images?: string[]
  qrCode?: string
  qrCodeData?: any
  organic?: boolean
  description?: string
  moistureContent?: number
  agriculturalData?: {
    soilType?: string
    irrigationMethod?: string
    pestControl?: string
  }
  qualityMetrics?: {
    moistureContent?: number
    sizeGrade?: string
  }
  sustainability?: {
    organicCertified?: boolean
  }
  geoLocation?: {
    lat: number
    lng: number
  }
  createdAt?: string
  updatedAt?: string
}

export default function HarvestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const harvestId = params.id as string
  const [harvest, setHarvest] = useState<HarvestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchHarvestData()
  }, [harvestId])

  const fetchHarvestData = async () => {
    try {
      setLoading(true)
      const response = await apiService.getHarvestById(harvestId)
      const harvestData = (response as any)?.harvest || (response as any)?.data?.harvest || response
      setHarvest(harvestData)
    } catch (error) {
      console.error("Failed to fetch harvest:", error)
      toast({
        title: "Error",
        description: "Failed to load harvest data. Please try again.",
        variant: "destructive"
      })
      router.push("/dashboard/harvests")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16">
              <div className="text-center space-y-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Harvest Details</h2>
                  <p className="text-gray-600">Please wait while we fetch your harvest information...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  if (!harvest) {
    return (
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16">
              <div className="space-y-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h2 className="text-2xl font-semibold text-gray-900">Harvest Not Found</h2>
                <p className="text-gray-600">The harvest you're looking for doesn't exist or has been removed.</p>
                <Button asChild>
                  <Link href="/dashboard/harvests">Back to Harvests</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date not available'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Date not available'
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'listed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/harvests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Harvests
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{harvest.cropType} Harvest</h1>
            <p className="text-gray-600">Batch ID: {harvest.batchId || 'N/A'}</p>
          </div>
        </div>

        {/* QR Code Button */}
        {(harvest.qrCode || harvest.qrCodeData) && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                {harvest.qrCode ? 'View QR Code' : 'QR Code Generated'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Harvest QR Code
                </DialogTitle>
                <DialogDescription>
                  Scan this QR code to verify harvest authenticity
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    {harvest.qrCode ? (
                      <Image
                        src={harvest.qrCode}
                        alt="Harvest QR Code"
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    ) : harvest.qrCodeData ? (
                      <div className="w-[200px] h-[200px] bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center p-4">
                          <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">QR Code Generated</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Batch: {harvest.qrCodeData.batchId}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-[200px] h-[200px] bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center p-4">
                          <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Generating QR Code...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!harvest.qrCode}
                    onClick={() => {
                      if (harvest.qrCode) {
                        const link = document.createElement('a')
                        link.href = harvest.qrCode
                        link.download = `harvest-qr-${harvest.batchId}.png`
                        link.click()
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      // Construct the proper verification URL
                      const verificationUrl = `${window.location.origin}/verify/${harvest.batchId}`
                      
                      const shareData = {
                        title: 'GroChain Harvest Verification',
                        text: `Verify this ${harvest.cropType} harvest - Batch ${harvest.batchId}`,
                        url: verificationUrl
                      }

                      try {
                        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                          await navigator.share(shareData)
                        } else {
                          // Fallback: copy URL to clipboard
                          await navigator.clipboard.writeText(verificationUrl)
                          toast({
                            title: "Link Copied",
                            description: "Harvest verification link copied to clipboard",
                          })
                        }
                      } catch (error) {
                        console.error('Share error:', error)
                        // Fallback to clipboard if share fails
                        try {
                          await navigator.clipboard.writeText(verificationUrl)
                          toast({
                            title: "Link Copied",
                            description: "Harvest verification link copied to clipboard",
                          })
                        } catch (clipboardError) {
                          console.error('Clipboard error:', clipboardError)
                          toast({
                            title: "Error",
                            description: "Unable to share or copy link",
                            variant: "destructive"
                          })
                        }
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="default"
                    onClick={() => window.open(`/verify/${harvest.batchId}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Test Verification
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Harvest Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Harvest Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Crop Type</label>
                <p className="text-lg font-semibold">{harvest.cropType}</p>
                {harvest.variety && (
                  <p className="text-sm text-gray-600">Variety: {harvest.variety}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Quantity</label>
                <p className="text-lg font-semibold">{harvest.quantity} {harvest.unit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Quality</label>
                <Badge className={`${getQualityColor(harvest.quality)} font-medium capitalize`}>
                  {harvest.quality}
                </Badge>
                {harvest.qualityGrade && (
                  <p className="text-sm text-gray-600 mt-1">Grade: {harvest.qualityGrade}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <Badge className={`${getStatusColor(harvest.status)} font-medium capitalize`}>
                  {harvest.status}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Harvest Date</label>
              <p className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {formatDate(harvest.date)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {typeof harvest.location === 'string' ? harvest.location : harvest.location ? `${harvest.location.city || 'Unknown'}, ${harvest.location.state || 'Unknown State'}` : 'Location not specified'}
              </p>
            </div>

            {harvest.geoLocation && (
              <div>
                <label className="text-sm font-medium text-gray-600">Coordinates</label>
                <p className="flex items-center gap-2 mt-1 font-mono text-sm">
                  <Navigation className="h-4 w-4" />
                  {harvest.geoLocation.lat.toFixed(6)}, {harvest.geoLocation.lng.toFixed(6)}
                </p>
              </div>
            )}

            {harvest.price && (
              <div>
                <label className="text-sm font-medium text-gray-600">Price</label>
                <p className="text-lg font-semibold">₦{harvest.price.toLocaleString()} per {harvest.unit}</p>
              </div>
            )}

            {(harvest.moistureContent || harvest.qualityMetrics?.moistureContent) && (
              <div>
                <label className="text-sm font-medium text-gray-600">Moisture Content</label>
                <p className="mt-1">{harvest.moistureContent || harvest.qualityMetrics?.moistureContent}%</p>
              </div>
            )}

            {harvest.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1">{harvest.description}</p>
              </div>
            )}

            {harvest.organic || harvest.sustainability?.organicCertified ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Organic Certified</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Agricultural Data */}
        {harvest.agriculturalData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Agricultural Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {harvest.agriculturalData.soilType && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Soil Type</label>
                  <p className="mt-1 capitalize">{harvest.agriculturalData.soilType}</p>
                </div>
              )}

              {harvest.agriculturalData.irrigationMethod && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Irrigation Method</label>
                  <p className="mt-1 capitalize">{harvest.agriculturalData.irrigationMethod}</p>
                </div>
              )}

              {harvest.agriculturalData.pestControl && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Pest Control</label>
                  <p className="mt-1 capitalize">{harvest.agriculturalData.pestControl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Images */}
      {harvest.images && harvest.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Product Images ({harvest.images.length})
            </CardTitle>
            <CardDescription>
              Visual verification of the harvested produce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {harvest.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                    <Image
                      src={image}
                      alt={`Harvest image ${index + 1}`}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => {
                        // Open image in new tab for full view
                        window.open(image, '_blank')
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/harvests/${harvestId}/edit`}>
                Edit Harvest
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/marketplace/new">
                List on Marketplace
              </Link>
            </Button>
            <Button variant="default" asChild>
              <Link href="/dashboard/analytics">
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
