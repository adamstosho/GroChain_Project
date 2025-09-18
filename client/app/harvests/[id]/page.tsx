"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Scale, QrCode, Download, Share2, Edit, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Harvest } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import QRCode from "qrcode"

export default function HarvestDetailPage() {
  const params = useParams()
  const [harvest, setHarvest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const { toast } = useToast()
  const [listingOpen, setListingOpen] = useState(false)
  const [price, setPrice] = useState("")
  const [listingDesc, setListingDesc] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchHarvest()
      generateQRCode()
    }
  }, [params.id])

  const fetchHarvest = async () => {
    try {
      const response = await apiService.getHarvestProvenance(String(params.id))
      const h = (response as any)?.provenance || (response as any)?.data?.provenance || (response as any)?.data || response
      setHarvest(h)
    } catch (error) {
      console.error("Failed to fetch harvest:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    try {
      const batchId = (harvest as any)?.batchId || String(params.id)
      const url = `${window.location.origin}/verify/${batchId}`
      const qrUrl = await QRCode.toDataURL(url)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "verified":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "listed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleListOnMarketplace = async () => {
    try {
      const price = Number(prompt("Enter listing price (NGN):", "0"))
      if (!price || isNaN(price) || price <= 0) return
      await apiService.createListingFromHarvest(String(params.id), price)
      setHarvest((prev: any) => (prev ? { ...prev, status: "listed" } : null))
      toast({ title: "Listing created", description: "Your harvest is now listed on the marketplace." })
    } catch (error) {
      console.error("Failed to list on marketplace:", error)
      toast({ title: "Failed to create listing", description: (error as any)?.message || "Try again.", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!harvest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Harvest not found</h2>
          <p className="text-gray-600 mb-4">The harvest you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/harvests">Back to Harvests</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/harvests" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Harvests
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{harvest?.cropType}</h1>
                    <p className="text-gray-600">Batch #{harvest?.batchId || harvest?.batchNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(harvest?.status)}>{harvest?.status}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/harvests/${harvest?._id || harvest?.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{harvest?.quantity}</p>
                      <p className="text-sm text-gray-500">{harvest?.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">{new Date(harvest.harvestDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Harvest Date</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold">{typeof harvest?.location === 'string' ? harvest.location : harvest?.location ? `${harvest.location.city || 'Unknown'}, ${harvest.location.state || 'Unknown State'}` : 'Location not specified'}</p>
                      <p className="text-sm text-gray-500">Location</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            {harvest?.images && harvest.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Harvest Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {harvest.images.map((image: string, index: number) => (
                      <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                        <Image
                          src={image || "/placeholder.svg?height=200&width=300&query=agricultural harvest"}
                          alt={`${harvest?.cropType} harvest ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="traceability">Traceability</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Harvest Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Basic Information</h4>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Variety:</dt>
                            <dd>{harvest?.variety || "Not specified"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Quality Grade:</dt>
                            <dd>{harvest?.quality || harvest?.qualityGrade}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Farm Size:</dt>
                            <dd>{harvest?.farmSize ? `${harvest.farmSize} hectares` : "Not specified"}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Status Information</h4>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Created:</dt>
                            <dd>{harvest?.createdAt ? new Date(harvest.createdAt).toLocaleDateString() : ""}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Last Updated:</dt>
                            <dd>{harvest?.updatedAt ? new Date(harvest.updatedAt).toLocaleDateString() : ""}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    {harvest?.description && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-gray-600">{harvest.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verification">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {harvest?.status === "verified" ? (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-800">Verified</h4>
                            <p className="text-sm text-green-600">This harvest has been verified by our partners</p>
                          </div>
                        </div>
                      ) : harvest?.status === "rejected" ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                          <XCircle className="h-6 w-6 text-red-600" />
                          <div>
                            <h4 className="font-semibold text-red-800">Rejected</h4>
                            <p className="text-sm text-red-600">This harvest did not meet verification requirements</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                          <div className="h-6 w-6 bg-yellow-600 rounded-full animate-pulse"></div>
                          <div>
                            <h4 className="font-semibold text-yellow-800">Pending Verification</h4>
                            <p className="text-sm text-yellow-600">Waiting for partner verification</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="traceability">
                <Card>
                  <CardHeader>
                    <CardTitle>Traceability Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                        <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">Harvest Logged</h4>
                          <p className="text-sm text-gray-600">{new Date(harvest.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      {harvest?.status !== "pending" && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            2
                          </div>
                          <div>
                            <h4 className="font-semibold">Verification Process</h4>
                            <p className="text-sm text-gray-600">Quality and authenticity verified</p>
                          </div>
                        </div>
                      )}

                      {harvest?.status === "listed" && (
                        <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                          <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            3
                          </div>
                          <div>
                            <h4 className="font-semibold">Listed on Marketplace</h4>
                            <p className="text-sm text-gray-600">Available for purchase by buyers</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {qrCodeUrl && (
                  <div className="space-y-4">
                    <Image
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="Harvest QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                    <p className="text-sm text-gray-600">Scan to verify harvest authenticity</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = qrCodeUrl
                        link.download = `harvest-${harvest?.batchId || harvest?.batchNumber}.png`
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {harvest?.status === "approved" && (
                  <Button className="w-full" onClick={() => setListingOpen(true)}>
                    List on Marketplace
                  </Button>
                )}
                <Button variant="outline" className="w-full bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Harvest
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/harvests/${harvest.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    {/* Listing Dialog */}
    <Dialog key="listing" open={listingOpen} onOpenChange={setListingOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Price (NGN)</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Description (optional)</label>
            <Input value={listingDesc} onChange={(e) => setListingDesc(e.target.value)} placeholder="Short description" />
          </div>
          <Button
            className="w-full"
            disabled={!price || Number(price) <= 0}
            onClick={async () => {
              try {
                await apiService.createListingFromHarvest(String(params.id), Number(price), listingDesc || undefined)
                setListingOpen(false)
                setHarvest((prev: any) => (prev ? { ...prev, status: "listed" } : prev))
                toast({ title: "Listing created", description: "Your harvest is now listed on the marketplace." })
              } catch (err: any) {
                toast({ title: "Failed to create listing", description: err?.message || "Try again.", variant: "destructive" })
              }
            }}
          >
            Create Listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
