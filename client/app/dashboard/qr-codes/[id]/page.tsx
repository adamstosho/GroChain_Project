"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  QrCode, 
  Download, 
  Copy, 
  ExternalLink, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Package, 
  Activity, 
  Eye, 
  Smartphone, 
  Printer, 
  FileText,
  Share2,
  RefreshCw,
  BarChart3,
  History,
  Info
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"

interface QRCodeData {
  _id: string
  batchId: string
  harvestId: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  generatedAt: string
  lastScanned?: string
  scanCount: number
  status: 'active' | 'expired' | 'revoked'
  qrData?: string
  image?: string
  location: string
  farmerName?: string
  metadata?: Record<string, any>
  scanHistory?: ScanRecord[]
}

interface ScanRecord {
  id: string
  timestamp: string
  location?: string
  device?: string
  userAgent?: string
  ipAddress?: string
  isValid: boolean
  verificationResult?: any
}

export default function QRCodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qrCodeId = params.id as string
  
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  const { toast } = useToast()

  useEffect(() => {
    if (qrCodeId) {
      fetchQRCodeDetails()
    }
  }, [qrCodeId])

  const fetchQRCodeDetails = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching QR code details for:', qrCodeId)

      const response = await apiService.getQRCodeById(qrCodeId)
      console.log('📱 QR code detail response:', response)

      if (response?.status === 'success' && response?.data) {
        const qrData = response.data
        console.log('✅ QR code data:', qrData)

        // Format the data to match the interface
        const formattedQRCode: QRCodeData = {
          _id: (qrData as any).id,
          batchId: (qrData as any).batchId,
          harvestId: (qrData as any).harvestId,
          cropType: (qrData as any).cropType,
          variety: (qrData as any).metadata?.variety,
          quantity: (qrData as any).quantity,
          unit: (qrData as any).unit || 'kg',
          generatedAt: (qrData as any).createdAt,
          lastScanned: (qrData as any).lastScanned,
          scanCount: (qrData as any).scanCount,
          status: (qrData as any).status,
          qrData: (qrData as any).qrData,
          image: (qrData as any).qrImage,
          location: (qrData as any).location,
          farmerName: (qrData as any).metadata?.farmName,
          metadata: (qrData as any).metadata,
          scanHistory: (qrData as any).scans?.map((scan: any) => ({
            id: scan._id,
            timestamp: scan.scannedAt,
            location: scan.scannedBy?.location,
            device: scan.deviceInfo?.userAgent?.substring(0, 50),
            userAgent: scan.deviceInfo?.userAgent,
            ipAddress: scan.deviceInfo?.ipAddress,
            isValid: scan.verificationResult === 'success',
            verificationResult: scan.verificationResult
          }))
        }

        setQrCode(formattedQRCode)
      } else {
        throw new Error('QR code not found')
      }
    } catch (error) {
      console.error("❌ Failed to fetch QR code details:", error)
      toast({
        title: "Error",
        description: "Failed to load QR code details. Please try again.",
        variant: "destructive"
      })
      router.push("/dashboard/qr-codes")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!qrCode) return

    try {
      setDeleting(true)
      console.log("🗑️ Deleting QR code:", qrCode._id)

      const deleteResponse = await apiService.deleteQRCode(qrCode._id)

      if (deleteResponse?.status === 'success') {
        toast({
          title: "Success",
          description: "QR code deleted successfully",
          variant: "default"
        })
        router.push("/dashboard/qr-codes")
      } else {
        throw new Error('Delete operation failed')
      }
    } catch (error) {
      console.error("❌ Failed to delete QR code:", error)
      toast({
        title: "Error",
        description: "Failed to delete QR code. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleRevoke = async () => {
    if (!qrCode) return
    
    try {
      await apiService.revokeQRCode(qrCode._id)
      toast({
        title: "Success",
        description: "QR code revoked successfully",
        variant: "default"
      })
      fetchQRCodeDetails()
    } catch (error) {
      console.error("Failed to revoke QR code:", error)
      toast({
        title: "Error",
        description: "Failed to revoke QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (format: 'png' | 'svg' | 'pdf' = 'png') => {
    if (!qrCode) return
    
    try {
      await apiService.downloadQRCode(qrCode._id)
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
    if (!qrCode) return
    
    const link = `${window.location.origin}/verify/${qrCode.batchId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "QR code verification link copied to clipboard",
      variant: "default"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "expired":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "revoked":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Loading QR Code...">
        <Card className="border border-gray-200">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Loading QR Code Data</h2>
                <p className="text-gray-600">Please wait while we fetch your QR code information...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!qrCode) {
    return (
      <DashboardLayout pageTitle="QR Code Not Found">
        <Card className="border border-gray-200">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">QR Code Not Found</h2>
                <p className="text-gray-600 mb-4">The QR code you're looking for doesn't exist or has been removed.</p>
                <Button asChild>
                  <Link href="/dashboard/qr-codes">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to QR Codes
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`QR Code: ${qrCode.batchId}`}>
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
            <h1 className="text-2xl font-semibold text-gray-900">QR Code Details</h1>
            <p className="text-gray-600">
              Comprehensive information about your QR code and its usage
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/verify/${qrCode.batchId}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify Online
              </Link>
            </Button>
            <Button onClick={() => handleDownload('png')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* QR Code Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Display */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {qrCode.image ? (
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <img 
                    src={qrCode.image} 
                    alt={`QR Code for ${qrCode.cropType}`} 
                    className="w-48 h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
              )}
              <div className="mt-4 space-y-2">
                <p className="font-medium text-gray-900">{qrCode.batchId}</p>
                <Badge className={getStatusColor(qrCode.status)}>
                  {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Crop:</span>
                <span className="font-medium text-gray-900">{qrCode.cropType}</span>
              </div>
              {qrCode.variety && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Variety:</span>
                  <span className="font-medium text-gray-900">{qrCode.variety}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-900">{qrCode.quantity} {qrCode.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">{typeof qrCode.location === 'string' ? qrCode.location : `${(qrCode.location as any)?.city || 'Unknown'}, ${(qrCode.location as any)?.state || 'Unknown State'}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Generated:</span>
                <span className="font-medium text-gray-900">
                  {new Date(qrCode.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Total Scans:</span>
                <span className="font-medium text-gray-900">{qrCode.scanCount}</span>
              </div>
              {qrCode.lastScanned && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Last Scanned:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(qrCode.lastScanned).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={getStatusColor(qrCode.status)}>
                  {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Detailed Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="scans">Scan History</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Product Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Crop Type:</span>
                        <span className="font-medium">{qrCode.cropType}</span>
                      </div>
                      {qrCode.variety && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Variety:</span>
                          <span className="font-medium">{qrCode.variety}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{qrCode.quantity} {qrCode.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{typeof qrCode.location === 'string' ? qrCode.location : `${(qrCode.location as any)?.city || 'Unknown'}, ${(qrCode.location as any)?.state || 'Unknown State'}`}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">QR Code Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch ID:</span>
                        <span className="font-medium font-mono">{qrCode.batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generated:</span>
                        <span className="font-medium">
                          {new Date(qrCode.generatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(qrCode.status)}>
                          {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Scans:</span>
                        <span className="font-medium">{qrCode.scanCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                {qrCode.metadata ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(qrCode.metadata).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-sm text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Metadata Available</h3>
                    <p className="text-gray-600">
                      This QR code doesn't have additional metadata attached.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scans" className="space-y-4">
                {qrCode.scanHistory && qrCode.scanHistory.length > 0 ? (
                  <div className="space-y-3">
                    {qrCode.scanHistory.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${scan.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {new Date(scan.timestamp).toLocaleString()}
                            </p>
                            {scan.location && (
                              <p className="text-xs text-gray-600">{typeof scan.location === 'string' ? scan.location : `${(scan.location as any)?.city || 'Unknown'}, ${(scan.location as any)?.state || 'Unknown State'}`}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={scan.isValid ? "default" : "destructive"}>
                            {scan.isValid ? "Valid" : "Invalid"}
                          </Badge>
                          {scan.device && (
                            <p className="text-xs text-gray-500 mt-1">{scan.device}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Scan History</h3>
                    <p className="text-gray-600">
                      This QR code hasn't been scanned yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Download Options</h3>
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

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Management Actions</h3>
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
                        <Link href={`/verify/${qrCode.batchId}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Verification Page
                        </Link>
                      </Button>
                      {qrCode.status === 'active' && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-amber-600"
                          onClick={handleRevoke}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Revoke QR Code
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-red-600"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/qr-codes/generate">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate New QR Code
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Verification Link
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleDownload('png')}>
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Need Help?</CardTitle>
              <CardDescription>Get support and access resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/qr-codes">
                  <QrCode className="h-4 w-4 mr-2" />
                  Manage QR Codes
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/harvests">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Harvests
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete QR Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this QR code? This action cannot be undone and will remove all associated data including scan history and verification records.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete QR Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
