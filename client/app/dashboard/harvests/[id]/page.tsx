"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  AlertCircle, 
  QrCode, 
  Download, 
  Share2, 
  Eye, 
  Package, 
  Calendar, 
  MapPin, 
  Scale, 
  CheckCircle2, 
  Navigation,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
  Activity,
  Droplet,
  Info,
  Edit,
  Loader2,
  Camera
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
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
  const [sharing, setSharing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (harvestId) {
      fetchHarvestData()
    }
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
        description: "Failed to load harvest data. Please check your network connection.",
        variant: "destructive"
      })
      router.push("/dashboard/harvests")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getQualityBadge = (quality: string) => {
    const q = quality.toLowerCase()
    if (q === 'excellent') return <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200 font-semibold px-2.5 py-0.5 capitalize">Excellent Grade</Badge>
    if (q === 'good') return <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 font-semibold px-2.5 py-0.5 capitalize">Good Grade</Badge>
    if (q === 'fair') return <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200 font-semibold px-2.5 py-0.5 capitalize">Fair Grade</Badge>
    return <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 font-semibold px-2.5 py-0.5 capitalize">{quality}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'approved' || s === 'verified') {
      return (
        <Badge className="bg-emerald-500 text-white font-bold px-3 py-1 gap-1 border-none shadow-sm rounded-full">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Verified Batch</span>
        </Badge>
      )
    }
    if (s === 'listed') {
      return (
        <Badge className="bg-blue-500 text-white font-bold px-3 py-1 gap-1 border-none shadow-sm rounded-full">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Listed Market</span>
        </Badge>
      )
    }
    if (s === 'rejected') {
      return (
        <Badge className="bg-rose-500 text-white font-bold px-3 py-1 gap-1 border-none shadow-sm rounded-full">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Rejected Batch</span>
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500 text-white font-bold px-3 py-1 gap-1 border-none shadow-sm rounded-full">
        <Clock className="h-3.5 w-3.5 animate-pulse" />
        <span>Pending Review</span>
      </Badge>
    )
  }

  const handleShare = async () => {
    if (!harvest) return
    const verificationUrl = `${window.location.origin}/verify/${harvest.batchId}`
    const shareData = {
      title: 'GroChain Harvest Provenance Record',
      text: `Verify authenticity of ${harvest.cropType} - Batch ${harvest.batchId}`,
      url: verificationUrl
    }

    try {
      setSharing(true)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(verificationUrl)
        toast({
          title: "Link Copied",
          description: "Cryptographic verification link copied to clipboard.",
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSharing(false)
    }
  }

  const handleDownloadQR = () => {
    if (!harvest?.qrCode) return
    const link = document.createElement('a')
    link.href = harvest.qrCode
    link.download = `grochain-qr-${harvest.batchId}.png`
    link.click()
    toast({
      title: "QR Code Downloaded",
      description: "Successfully saved QR image to files.",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading batch passport details...</p>
        </div>
      </div>
    )
  }

  if (!harvest) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Record Not Found</h2>
        <p className="text-sm text-slate-500">The harvest record you are looking for is missing or invalid.</p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/harvests">Back to Registry</Link>
        </Button>
      </div>
    )
  }

  const isApproved = harvest.status.toLowerCase() === 'approved' || harvest.status.toLowerCase() === 'verified'
  const isListed = harvest.status.toLowerCase() === 'listed'

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-4">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Button variant="ghost" asChild className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/harvests" className="flex items-center gap-1 text-xs font-semibold">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Registry</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{harvest.cropType} Batch</h1>
            {getStatusBadge(harvest.status)}
          </div>
          <p className="text-xs font-mono text-muted-foreground">BATCH ID: {harvest.batchId || harvest._id}</p>
        </div>

        {/* Dynamic CTA Header Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <Button variant="outline" asChild size="sm" className="h-9 text-xs border-slate-200">
            <Link href={`/dashboard/harvests/${harvest._id}/edit`} className="flex items-center gap-1.5">
              <Edit className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit Attributes</span>
            </Link>
          </Button>

          {isApproved && (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs shadow-md shadow-emerald-600/10">
              <Link href={`/dashboard/marketplace/new?harvestId=${harvest._id}`} className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span>List on Marketplace</span>
              </Link>
            </Button>
          )}

          {isListed && (
            <Button variant="secondary" asChild size="sm" className="h-9 text-xs">
              <Link href="/dashboard/marketplace" className="flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                <span>View Listing</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main Details & Traceability Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Harvest Overview & Visual Specs (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Produce Details Card */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/40 border-b border-slate-100 px-4 sm:px-6 py-4">
              <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                Produce Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Variety</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{harvest.variety || "Standard Variety"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Batch Yield</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{harvest.quantity.toLocaleString()} {harvest.unit}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Quality Rating</span>
                  <div className="pt-0.5">{getQualityBadge(harvest.quality)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Harvest Date</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{formatDate(harvest.date)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Moisture Content</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{harvest.moistureContent ?? harvest.qualityMetrics?.moistureContent ?? "N/A"}%</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Base Price</span>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700 font-mono">
                    {harvest.price ? `₦${harvest.price.toLocaleString()}/${harvest.unit}` : "Not Set"}
                  </span>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Location Specification with GPS Badge */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Origin & Geolocation</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {typeof harvest.location === 'string' ? harvest.location : 'Origin Recorded'}
                    </span>
                  </div>
                  {harvest.geoLocation && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-white border border-emerald-100 rounded-lg px-2.5 py-1 font-mono shadow-sm self-start sm:self-auto">
                      <Navigation className="h-3 w-3" />
                      <span>{harvest.geoLocation.lat.toFixed(6)}, {harvest.geoLocation.lng.toFixed(6)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks/Notes */}
              {harvest.description && (
                <div className="space-y-2">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Traceability Notes</span>
                  <p className="text-xs text-slate-600 bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 leading-relaxed">
                    {harvest.description}
                  </p>
                </div>
              )}

              {/* Sustainability Indicators */}
              {(harvest.organic || harvest.sustainability?.organicCertified) && (
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3.5 flex items-start gap-2.5">
                  <Shield className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-emerald-950">Certified Organic Produce</h5>
                    <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">This crop batch complies with strict chemical-free agroecology rules. On-chain validation logged.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Photographs Card */}
          {harvest.images && harvest.images.length > 0 && (
            <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/40 border-b border-slate-100 px-4 sm:px-6 py-4">
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-600" />
                  Crop Photographs ({harvest.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {harvest.images.map((image, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 hover:border-emerald-500 transition-colors shadow-sm bg-slate-50 group">
                      <Image
                        src={image}
                        alt={`Snapshot ${idx + 1}`}
                        fill
                        className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                        onClick={() => window.open(image, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <Eye className="h-5 w-5 text-white filter drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agronomic Conditions Card */}
          {harvest.agriculturalData && (
            <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/40 border-b border-slate-100 px-4 sm:px-6 py-4">
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Environmental & Agronomic Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Soil Type</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 block capitalize">{harvest.agriculturalData.soilType || "N/A"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Water Supply</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 block capitalize">{harvest.agriculturalData.irrigationMethod || "Rainfed"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pest Strategy</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 block capitalize">{harvest.agriculturalData.pestControl || "Manual/Organic"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: On-Chain Traceability & QR Passport (Col-span 1) */}
        <div className="space-y-6">
          
          {/* Visual QR Passport Card */}
          {(harvest.qrCode || harvest.qrCodeData) && (
            <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/40 border-b border-slate-100 px-4 sm:px-5 py-4">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  Authenticity QR Badge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 text-center space-y-4">
                <div className="inline-block p-3 border-2 border-slate-100 bg-white rounded-2xl shadow-sm">
                  {harvest.qrCode ? (
                    <Image
                      src={harvest.qrCode}
                      alt="Batch Authenticity QR"
                      width={160}
                      height={160}
                      className="rounded-lg w-40 h-40 mx-auto"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-slate-50 flex flex-col items-center justify-center rounded-lg border">
                      <QrCode className="h-8 w-8 text-slate-300 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">QR Synchronized</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Cryptographic Identity Badge</h4>
                  <p className="text-[11px] text-slate-500 leading-snug px-2">Buyers scan this QR code directly to verify provenance parameters on the public verify site.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadQR} className="h-9 text-xs border-slate-200">
                    <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    <span>Save QR</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing} className="h-9 text-xs border-slate-200">
                    <Share2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    <span>{sharing ? "Sharing..." : "Share URL"}</span>
                  </Button>
                </div>

                <Button variant="secondary" className="w-full text-xs h-9 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => window.open(`/verify/${harvest.batchId}`, '_blank')}>
                  <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  <span>Public Portal Demo</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* On-Chain Verification Timeline */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/40 border-b border-slate-100 px-4 sm:px-5 py-4">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                On-Chain Audit Trails
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="relative border-l border-slate-200 pl-4 space-y-6">
                
                {/* Milestone 1: Harvest Logged */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-emerald-600 text-white rounded-full p-0.5 border-4 border-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Batch Logged On-Chain</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(harvest.createdAt || harvest.date)}</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-tight">Farmer compiled crop volume and verified GPS yield origin.</p>
                  </div>
                </div>

                {/* Milestone 2: Quality Inspection */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-emerald-600 text-white rounded-full p-0.5 border-4 border-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Quality Verified</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automatic validation analysis</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-tight">Grade {harvest.qualityGrade || "B"} certification matching moisture standards check.</p>
                  </div>
                </div>

                {/* Milestone 3: Administrative Inspection */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[21px] top-0.5 rounded-full p-0.5 border-4 border-white",
                    isApproved || isListed
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-500 text-white animate-pulse"
                  )}>
                    {isApproved || isListed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Administrative Check</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Audit checklist approval</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                      {isApproved || isListed
                        ? "Batch inspection approved. Released for commercial trading."
                        : "Awaiting administrative review validation from cooperative auditor."}
                    </p>
                  </div>
                </div>

                {/* Milestone 4: Marketplace listing */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[21px] top-0.5 rounded-full p-0.5 border-4 border-white",
                    isListed
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  )}>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Public Marketplace</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{isListed ? "Active Live Listing" : "Listing Pending"}</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                      {isListed
                        ? `Listed on marketplace. Available for verified escrow purchase.`
                        : "Ready to list. Tap the Marketplace CTA button to go live."}
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
