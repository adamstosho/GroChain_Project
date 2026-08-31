"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { apiService } from "@/lib/api"
import { asRecord } from "@/lib/error-utils"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  QrCode, 
  Download, 
  Copy, 
  ExternalLink, 
  Trash2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Package, 
  Activity, 
  FileText,
  BarChart3,
  History,
  Info
} from "lucide-react"
import Link from "next/link"
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
  metadata?: Record<string, unknown>
  scanHistory?: ScanRecord[]
}

interface ScanRecord {
  id: string
  timestamp: string
  location?: string | { city?: string; state?: string }
  device?: string
  userAgent?: string
  ipAddress?: string
  isValid: boolean
  verificationResult?: unknown
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback
}

function formatPlace(location: unknown): string {
  if (typeof location === "string") return location
  const loc = asRecord(location)
  const city = typeof loc.city === "string" ? loc.city : "Unknown"
  const state = typeof loc.state === "string" ? loc.state : "Unknown State"
  return `${city}, ${state}`
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

  const fetchQRCodeDetails = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching QR code details for:', qrCodeId)

      const response = await apiService.getQRCodeById(qrCodeId)
      console.log('📱 QR code detail response:', response)

      if (response?.status === 'success' && response?.data) {
        const qrData = response.data
        const qr = asRecord(qrData)
        const metadata = asRecord(qr.metadata)
        const scans = Array.isArray(qr.scans) ? qr.scans : []
        console.log('✅ QR code data:', qrData)

        // Format the data to match the interface
        const formattedQRCode: QRCodeData = {
          _id: asString(qr.id),
          batchId: asString(qr.batchId),
          harvestId: asString(qr.harvestId),
          cropType: asString(qr.cropType),
          variety: typeof metadata.variety === "string" ? metadata.variety : undefined,
          quantity: asNumber(qr.quantity),
          unit: asString(qr.unit, "kg"),
          generatedAt: asString(qr.createdAt),
          lastScanned: typeof qr.lastScanned === "string" ? qr.lastScanned : undefined,
          scanCount: asNumber(qr.scanCount),
          status: (asString(qr.status) as QRCodeData["status"]),
          qrData: typeof qr.qrData === "string" ? qr.qrData : undefined,
          image: typeof qr.qrImage === "string" ? qr.qrImage : undefined,
          location: typeof qr.location === "string" ? qr.location : formatPlace(qr.location),
          farmerName: typeof metadata.farmName === "string" ? metadata.farmName : undefined,
          metadata,
          scanHistory: scans.map((scanRaw) => {
            const scan = asRecord(scanRaw)
            const scannedBy = asRecord(scan.scannedBy)
            const deviceInfo = asRecord(scan.deviceInfo)
            const userAgent = typeof deviceInfo.userAgent === "string" ? deviceInfo.userAgent : undefined
            return {
              id: asString(scan._id),
              timestamp: asString(scan.scannedAt),
              location: scannedBy.location as ScanRecord["location"],
              device: userAgent?.substring(0, 50),
              userAgent,
              ipAddress: typeof deviceInfo.ipAddress === "string" ? deviceInfo.ipAddress : undefined,
              isValid: scan.verificationResult === "success",
              verificationResult: scan.verificationResult
            }
          })
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
  }, [qrCodeId, router, toast])

  useEffect(() => {
    if (qrCodeId) {
      fetchQRCodeDetails()
    }
  }, [qrCodeId, fetchQRCodeDetails])

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
      const response = await apiService.downloadQRCode(qrCode._id)
      const { saveQrDownload } = await import("@/lib/qr-download")
      await saveQrDownload(response, qrCode.batchId || qrCode._id, format)
      toast({
        title: "Download Started",
        description: `QR code saved as ${format.toUpperCase()}`,
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
        return "bg-success/10 text-success border-success/10"
      case "expired":
        return "bg-warning/10 text-warning border-warning/10"
      case "revoked":
        return "bg-destructive/10 text-destructive border-destructive/10"
      default:
        return "bg-muted text-foreground border-border"
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Loading QR Code...">
        <Card className="border border-border">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <div>
                <h2 className="text-xl font-medium text-foreground mb-2">Loading QR Code Data</h2>
                <p className="text-muted-foreground">Please wait while we fetch your QR code information...</p>
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
        <Card className="border border-border">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-xl font-medium text-foreground mb-2">QR Code Not Found</h2>
                <p className="text-muted-foreground mb-4">The QR code you're looking for doesn't exist or has been removed.</p>
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
      <DashboardPageShell>
        <Button variant="ghost" asChild className="w-fit text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/qr-codes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to QR Codes
          </Link>
        </Button>

        <DashboardSubpageHeader
          title="QR Code Details"
          description="Comprehensive information about your QR code and its usage"
          actions={
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
          }
        />

        {/* QR Code Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Display */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {qrCode.image ? (
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <Image
                    src={qrCode.image}
                    alt={`QR Code for ${qrCode.cropType}`}
                    width={192}
                    height={192}
                    unoptimized
                    className="w-48 h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              <div className="mt-4 space-y-2">
                <p className="font-medium text-foreground">{qrCode.batchId}</p>
                <Badge className={getStatusColor(qrCode.status)}>
                  {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Crop:</span>
                <span className="font-medium text-foreground">{qrCode.cropType}</span>
              </div>
              {qrCode.variety && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Variety:</span>
                  <span className="font-medium text-foreground">{qrCode.variety}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Quantity:</span>
                <span className="font-medium text-foreground">{qrCode.quantity} {qrCode.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="font-medium text-foreground">{formatPlace(qrCode.location)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Generated:</span>
                <span className="font-medium text-foreground">
                  {new Date(qrCode.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Scans:</span>
                <span className="font-medium text-foreground">{qrCode.scanCount}</span>
              </div>
              {qrCode.lastScanned && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Scanned:</span>
                  <span className="font-medium text-foreground">
                    {new Date(qrCode.lastScanned).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(qrCode.status)}>
                  {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Detailed Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="scans">Scan History</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Product Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crop Type:</span>
                        <span className="font-medium">{qrCode.cropType}</span>
                      </div>
                      {qrCode.variety && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Variety:</span>
                          <span className="font-medium">{qrCode.variety}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{qrCode.quantity} {qrCode.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{formatPlace(qrCode.location)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">QR Code Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Batch ID:</span>
                        <span className="font-medium font-mono">{qrCode.batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Generated:</span>
                        <span className="font-medium">
                          {new Date(qrCode.generatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(qrCode.status)}>
                          {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Scans:</span>
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
                        <Label className="text-sm font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-sm text-foreground">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Metadata Available</h3>
                    <p className="text-muted-foreground">
                      This QR code doesn't have additional metadata attached.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scans" className="space-y-4">
                {qrCode.scanHistory && qrCode.scanHistory.length > 0 ? (
                  <div className="space-y-3">
                    {qrCode.scanHistory.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${scan.isValid ? 'bg-success' : 'bg-destructive'}`} />
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {new Date(scan.timestamp).toLocaleString()}
                            </p>
                            {scan.location && (
                              <p className="text-xs text-muted-foreground">{formatPlace(scan.location)}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={scan.isValid ? "default" : "destructive"}>
                            {scan.isValid ? "Valid" : "Invalid"}
                          </Badge>
                          {scan.device && (
                            <p className="text-xs text-muted-foreground mt-1">{scan.device}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Scan History</h3>
                    <p className="text-muted-foreground">
                      This QR code hasn't been scanned yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Download Options</h3>
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
                    <h3 className="font-medium text-foreground">Management Actions</h3>
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
                          className="w-full justify-start text-warning"
                          onClick={handleRevoke}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Revoke QR Code
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-destructive"
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
          <Card className="border border-border">
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

          <Card className="border border-border">
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
      </DashboardPageShell>

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
