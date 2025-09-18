"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, QrCode, Package, Download, Copy, Share2, Smartphone, Printer, FileText, Info, CheckCircle, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface HarvestData {
  _id: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  harvestDate: string
  location: string
  status: string
  batchId?: string
}

interface QRCodeFormData {
  harvestId: string
  cropType: string
  quantity: number
  unit: string
  location: string
  harvestDate: string
  includeMetadata: boolean
  metadata: {
    organic: boolean
    irrigationType: string
    soilType: string
    pestManagement: string
    certification: string
    notes: string
  }
  qrCodeType: 'harvest' | 'shipment' | 'product'
  expiryDate?: string
  customBatchId?: string
}

export default function GenerateQRCodePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [harvests, setHarvests] = useState<HarvestData[]>([])
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestData | null>(null)
  const [generatedQR, setGeneratedQR] = useState<any>(null)
  const [formData, setFormData] = useState<QRCodeFormData>({
    harvestId: '',
    cropType: '',
    quantity: 0,
    unit: '',
    location: '',
    harvestDate: '',
    includeMetadata: true,
    metadata: {
      organic: false,
      irrigationType: '',
      soilType: '',
      pestManagement: '',
      certification: '',
      notes: ''
    },
    qrCodeType: 'harvest',
    expiryDate: '',
    customBatchId: ''
  })
  
  const { toast } = useToast()

  useEffect(() => {
    fetchHarvests()
  }, [])

  const fetchHarvests = async () => {
    try {
      const response: any = await apiService.getHarvests({ limit: 100 })
      const harvestData = response.harvests || response.data?.harvests || []
      const approvedHarvests = harvestData.filter((h: HarvestData) => h.status === 'approved' || h.status === 'listed')
      setHarvests(approvedHarvests)
    } catch (error) {
      console.error("Failed to fetch harvests:", error)
      toast({
        title: "Error",
        description: "Failed to load harvests. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleHarvestSelect = (harvest: HarvestData) => {
    setSelectedHarvest(harvest)
    setFormData(prev => ({
      ...prev,
      harvestId: harvest._id,
      cropType: harvest.cropType,
      quantity: harvest.quantity,
      unit: harvest.unit,
      location: harvest.location,
      harvestDate: harvest.harvestDate,
      customBatchId: harvest.batchId || `BATCH_${harvest._id.slice(-6)}`
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHarvest) {
      toast({
        title: "Error",
        description: "Please select a harvest first.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        type: formData.qrCodeType,
        itemId: selectedHarvest._id,
        metadata: formData.includeMetadata ? {
          ...formData.metadata,
          harvestId: selectedHarvest._id,
          batchId: formData.customBatchId,
          cropType: formData.cropType,
          quantity: formData.quantity,
          unit: formData.unit,
          location: formData.location,
          harvestDate: formData.harvestDate,
          expiryDate: formData.expiryDate
        } : {
          harvestId: selectedHarvest._id,
          batchId: formData.customBatchId,
          cropType: formData.cropType,
          quantity: formData.quantity,
          unit: formData.unit,
          location: formData.location,
          harvestDate: formData.harvestDate
        }
      }

      const response = await apiService.generateQRCodeForHarvest(selectedHarvest._id, formData.includeMetadata ? formData.metadata : undefined)
      setGeneratedQR(response)
      
      toast({ 
        title: "QR Code Generated Successfully! 🎉", 
        description: "Your QR code is ready for download and use.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      toast({ 
        title: "Failed to generate QR code", 
        description: (error as any)?.message || "Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: 'png' | 'svg' | 'pdf' = 'png') => {
    if (!generatedQR) return
    
    try {
      await apiService.downloadQRCode(generatedQR._id)
      toast({
        title: "Download Started",
        description: `QR code downloaded as ${format.toUpperCase()}`,
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to download QR code:", error)
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCopyLink = () => {
    if (!generatedQR) return
    
    const link = `${window.location.origin}/verify/${generatedQR.batchId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "QR code verification link copied to clipboard",
      variant: "default"
    })
  }

  return (
    <DashboardLayout pageTitle="Generate QR Code">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/qr-codes" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to QR Codes
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Generate QR Code</h1>
            <p className="text-gray-600">
              Create unique QR codes for your agricultural products to enable traceability
            </p>
          </div>
        </div>

        {/* Harvest Selection */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Package className="h-4 w-4 text-gray-500" />
              Select Harvest
            </CardTitle>
            <CardDescription>
              Choose an approved or listed harvest to generate a QR code for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {harvests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Harvests</h3>
                <p className="text-gray-600 mb-4">
                  You need approved or listed harvests to generate QR codes. Please log a harvest first.
                </p>
                <Button asChild>
                  <Link href="/dashboard/harvests/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Log New Harvest
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {harvests.map((harvest) => (
                  <Card 
                    key={harvest._id} 
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      selectedHarvest?._id === harvest._id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleHarvestSelect(harvest)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{harvest.cropType}</h3>
                          {selectedHarvest?._id === harvest._id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {harvest.variety && (
                          <p className="text-sm text-gray-600">{harvest.variety}</p>
                        )}
                        <div className="text-sm text-gray-600">
                          {harvest.quantity} {harvest.unit}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(harvest.harvestDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {typeof harvest.location === 'string' ? harvest.location : `${(harvest.location as any)?.city || 'Unknown'}, ${(harvest.location as any)?.state || 'Unknown State'}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Configuration Form */}
        {selectedHarvest && (
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <QrCode className="h-4 w-4 text-gray-500" />
                QR Code Configuration
              </CardTitle>
              <CardDescription>
                Configure your QR code settings and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrCodeType">QR Code Type *</Label>
                    <Select 
                      value={formData.qrCodeType} 
                      onValueChange={(value: 'harvest' | 'shipment' | 'product') => 
                        setFormData(prev => ({ ...prev, qrCodeType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harvest">Harvest QR Code</SelectItem>
                        <SelectItem value="shipment">Shipment QR Code</SelectItem>
                        <SelectItem value="product">Product QR Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customBatchId">Custom Batch ID</Label>
                    <Input
                      id="customBatchId"
                      value={formData.customBatchId}
                      onChange={(e) => setFormData(prev => ({ ...prev, customBatchId: e.target.value }))}
                      placeholder="e.g., BATCH_001_2024"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty for no expiration
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={formData.includeMetadata}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, includeMetadata: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeMetadata" className="text-sm font-medium">
                    Include detailed metadata in QR code
                  </Label>
                </div>

                {formData.includeMetadata && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Additional Metadata</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organic">Organic Certification</Label>
                        <Select 
                          value={formData.metadata.organic ? 'yes' : 'no'} 
                          onValueChange={(value) => 
                            setFormData(prev => ({ 
                              ...prev, 
                              metadata: { ...prev.metadata, organic: value === 'yes' }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="irrigationType">Irrigation Type</Label>
                        <Input
                          id="irrigationType"
                          value={formData.metadata.irrigationType}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, irrigationType: e.target.value }
                          }))}
                          placeholder="e.g., Drip, Sprinkler, Flood"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="soilType">Soil Type</Label>
                        <Input
                          id="soilType"
                          value={formData.metadata.soilType}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, soilType: e.target.value }
                          }))}
                          placeholder="e.g., Loamy, Sandy, Clay"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pestManagement">Pest Management</Label>
                        <Input
                          id="pestManagement"
                          value={formData.metadata.pestManagement}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, pestManagement: e.target.value }
                          }))}
                          placeholder="e.g., Organic, Integrated, Chemical"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="certification">Certifications</Label>
                      <Input
                        id="certification"
                        value={formData.metadata.certification}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, certification: e.target.value }
                        }))}
                        placeholder="e.g., GAP, Organic, Fair Trade"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.metadata.notes}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, notes: e.target.value }
                        }))}
                        placeholder="Any additional information about this harvest..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => router.push("/dashboard/qr-codes")} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate QR Code"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Generated QR Code Display */}
        {generatedQR && (
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                QR Code Generated Successfully!
              </CardTitle>
              <CardDescription>
                Your QR code is ready. Download it in your preferred format or share the verification link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Display */}
                <div className="space-y-4">
                  <div className="text-center">
                    {generatedQR.qrData ? (
                      <div className="inline-block p-4 bg-white border rounded-lg">
                        <img 
                          src={generatedQR.qrData} 
                          alt="Generated QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                        <QrCode className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="font-medium text-gray-900">Batch ID: {generatedQR.batchId}</p>
                    <p className="text-sm text-gray-600">Scan to verify authenticity</p>
                  </div>
                </div>

                {/* Download & Share Options */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Download Options</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownload('png')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as PNG
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownload('svg')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as SVG
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownload('pdf')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download as PDF
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Share Options</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Verification Link
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={`/verify/${generatedQR.batchId}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Verification Page
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-base font-medium">QR Code Benefits</CardTitle>
            <CardDescription className="text-center">
              Why QR codes are essential for modern agriculture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-sm text-gray-900">Easy Verification</h3>
                <p className="text-xs text-gray-600">Anyone can scan to verify product authenticity</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-medium text-sm text-gray-900">Product Traceability</h3>
                <p className="text-xs text-gray-600">Track your products from farm to market</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto">
                  <Printer className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-sm text-gray-900">Multiple Formats</h3>
                <p className="text-xs text-gray-600">Download as PNG, SVG, or PDF for various uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
