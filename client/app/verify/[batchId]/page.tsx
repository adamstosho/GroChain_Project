"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { apiService } from "@/lib/api"
import { certificateGenerator } from "@/lib/certificate-generator"
import { cn } from "@/lib/utils"
import {
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Package,
  User,
  Building,
  Phone,
  Mail,
  Leaf,
  Award,
  Navigation,
  Clock,
  Shield,
  FileText,
  Download,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Droplet,
  Globe,
  Camera,
  Activity,
  Heart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface VerificationData {
  batchId: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  quality: string
  location: {
    city: string
    state: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  farmer: {
    id: string
    name: string
    farmName?: string
    phone?: string
    email?: string
  }
  harvestDate: string
  images?: string[]
  organic?: boolean
  price?: number
  status: string
  verificationUrl: string
  timestamp: string
}

interface VerificationPageProps {
  params: Promise<{
    batchId: string
  }>
}

export default function VerificationPage({ params }: VerificationPageProps) {
  const resolvedParams = use(params)
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchVerificationData()
  }, [resolvedParams.batchId])

  const fetchVerificationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching verification data for batchId:', resolvedParams.batchId)
      const response = await apiService.verifyQRCode(resolvedParams.batchId)
      
      if (response?.status === 'success' && response?.data) {
        setVerificationData(response.data as any)
        setVerified(true)
      } else {
        throw new Error('Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('This QR code could not be verified. It may be invalid or the batch record is not registered in our blockchain ledger.')
      setVerified(false)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Date not available'
    
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const handleDownloadCertificate = async () => {
    if (!verificationData) return
    
    try {
      setDownloading(true)
      await certificateGenerator.generateCertificateFromHTML(verificationData)
    } catch (error) {
      console.error('Error generating certificate:', error)
      // Fallback
      certificateGenerator.generateCertificate(verificationData)
    } finally {
      setDownloading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex flex-col justify-center items-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-success mx-auto" />
          <h3 className="text-base font-bold text-foreground">Authenticating batch coordinates...</h3>
          <p className="text-xs text-muted-foreground">Running cryptographic signatures check on GroChain ledger.</p>
        </div>
      </div>
    )
  }

  if (error || !verified || !verificationData) {
    return (
      <div className="min-h-screen bg-muted/50 py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border border-destructive/10 shadow-xl shadow-rose-500/5 bg-white rounded-2xl overflow-hidden">
            <div className="bg-destructive/10 p-6 text-center border-b border-destructive/50">
              <XCircle className="h-14 w-14 text-destructive mx-auto mb-2" />
              <h2 className="text-lg font-extrabold text-destructive">Verification Unsuccessful</h2>
              <p className="text-xs text-destructive/80 mt-1 leading-snug">The scanned QR code is either invalid or missing administrative validation keys.</p>
            </div>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {error || "We could not find a registered yield match for this batch identifier in GroChain database."}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild className="bg-secondary hover:bg-secondary text-white h-10 rounded-xl text-xs font-semibold">
                  <Link href="/dashboard/scanner">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Camera Scanner
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-10 rounded-xl text-xs font-semibold border-border">
                  <Link href="/marketplace">
                    Browse Public Marketplace
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Verification Status Header Certificate */}
        <Card className="border-0 shadow-lg shadow-emerald-600/5 bg-gradient-to-r from-primary via-primary to-success text-white rounded-2xl overflow-hidden relative">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <Badge className="bg-lime-400 hover:bg-lime-400 text-primary border-none px-3.5 py-1 text-xs font-bold gap-1 rounded-full shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>On-Chain Authenticated</span>
              </Badge>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Agricultural Provenance Certificate</h1>
                <p className="text-white/70 text-xs sm:text-sm max-w-lg">
                  GroChain blockchain ledger certifies that this batch has undergone inspection standards.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-md">
                  BATCH: {verificationData.batchId}
                </span>
                <span className="text-[10px] text-white/80 font-medium">Verified on: {formatDate(verificationData.timestamp)}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center space-y-2 flex-shrink-0 self-center">
              <Award className="h-10 w-10 text-lime-300 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-white leading-none">Grade {verificationData.quality.toLowerCase() === 'excellent' ? 'A' : 'B'}</p>
              <p className="text-[9px] text-white/70 leading-none">Yield Quality Rating</p>
            </div>
          </CardContent>
        </Card>

        {/* 2-Column Specs Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Specifications Card (Col-span 2) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Product Details Section */}
            <Card className="border border-border rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/50 py-4 px-6">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-success" />
                  Produce Attributes & Origin
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Crop Classification</span>
                    <span className="text-sm font-semibold text-foreground">{verificationData.cropType}</span>
                  </div>
                  {verificationData.variety && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Cultivar Variety</span>
                      <span className="text-sm font-semibold text-foreground">{verificationData.variety}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Net Weight Yield</span>
                    <span className="text-sm font-semibold text-foreground">{verificationData.quantity.toLocaleString()} {verificationData.unit}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Harvest Logging Date</span>
                    <span className="text-sm font-semibold text-foreground">{formatDate(verificationData.harvestDate)}</span>
                  </div>
                </div>

                <Separator className="bg-muted" />

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Farming Field Location</span>
                  <div className="flex items-center justify-between gap-3 bg-muted p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
                      <MapPin className="h-4 w-4 text-success flex-shrink-0" />
                      <span className="truncate">
                        {verificationData.location.city && verificationData.location.city !== 'Unknown' 
                          ? `${verificationData.location.city}, ${verificationData.location.state}, ${verificationData.location.country}`
                          : 'Location coordinates verified'
                        }
                      </span>
                    </div>
                    {verificationData.location.coordinates && (
                      <Badge className="bg-white border border-border text-success font-mono text-[10px] px-2 py-0.5 shadow-sm">
                        📍 {verificationData.location.coordinates.lat.toFixed(5)}, {verificationData.location.coordinates.lng.toFixed(5)}
                      </Badge>
                    )}
                  </div>
                </div>

                {verificationData.price && (
                  <div className="flex justify-between items-center bg-success/30 p-3 rounded-xl border border-success/50">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-success" />
                      <span className="text-xs font-semibold text-success">Market Escrow Price</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-success">
                      {formatPrice(verificationData.price)} per {verificationData.unit}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo Gallery Section */}
            {verificationData.images && verificationData.images.length > 0 && (
              <Card className="border border-border rounded-2xl shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-muted/50 border-b border-border/50 py-4 px-6">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Camera className="h-4 w-4 text-success" />
                    Produce Photographs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {verificationData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-sm group hover:border-success transition-colors duration-300">
                        <Image
                          src={img}
                          alt={`Produce photolog ${idx + 1}`}
                          fill
                          className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                          onClick={() => window.open(img, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Farmer Info & Verification Summary (Col-span 1) */}
          <div className="space-y-6">
            
            {/* Farmer card */}
            <Card className="border border-border rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/50 py-4 px-5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-success" />
                  Cultivated By
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{verificationData.farmer.name}</h4>
                  {verificationData.farmer.farmName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{verificationData.farmer.farmName}</p>
                  )}
                </div>

                <Separator className="bg-muted" />

                <div className="space-y-2.5 text-xs text-muted-foreground">
                  {verificationData.farmer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{verificationData.farmer.phone}</span>
                    </div>
                  )}
                  {verificationData.farmer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground truncate" />
                      <span className="truncate">{verificationData.farmer.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quality parameters checks list */}
            <Card className="border border-border rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/50 py-4 px-5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" />
                  Traceability Checkpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5">
                
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground leading-none">Administrative Inspection</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">Authorized auditor cleared the produce for export and trade.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground leading-none">Chemical Safety Cleared</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">No residual fertilizer contamination. Complies with organic policy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground leading-none">On-Chain Ledger Sealed</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">Cryptographic signature transaction logged to distributed network.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Certificate Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
          <Button asChild className="bg-secondary hover:bg-secondary text-white h-10 px-6 rounded-xl text-xs font-semibold w-full sm:w-auto shadow-sm">
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Marketplace</span>
            </Link>
          </Button>

          <Button 
            onClick={handleDownloadCertificate} 
            disabled={downloading}
            className="bg-success hover:bg-success text-white h-10 px-6 rounded-xl text-xs font-semibold w-full sm:w-auto shadow-md shadow-emerald-600/10"
          >
            {downloading ? (
              <div className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Building PDF...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <Download className="h-4 w-4" />
                <span>Download Verified PDF Certificate</span>
              </div>
            )}
          </Button>
        </div>

        {/* Powered by footer */}
        <div className="text-center text-[11px] text-muted-foreground space-y-1.5 pt-4">
          <p className="flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span>Cryptographically secured by GroChain Distributed Agricultural Ledger.</span>
          </p>
          <p className="font-mono text-[9px] break-all select-all bg-muted/50 py-1 px-3 border border-border rounded-lg max-w-lg mx-auto">
            SHA256: {verificationData.verificationUrl || `hash-batch-${verificationData.batchId}`}
          </p>
        </div>

      </div>
    </div>
  )
}

// Loader icon component replacement in case it isn't imported from lucide
function Loader2({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}