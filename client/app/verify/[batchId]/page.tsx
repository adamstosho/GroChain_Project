"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiService } from "@/lib/api"
import { certificateGenerator } from "@/lib/certificate-generator"
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
  Globe,
  Navigation,
  Clock,
  Shield,
  FileText,
  Download,
  ArrowLeft,
  ExternalLink,
  Star,
  Truck,
  AlertTriangle,
  Info
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
      console.log('Verification response:', response)
      
      if (response?.status === 'success' && response?.data) {
        setVerificationData(response.data as any)
        setVerified(true)
      } else {
        throw new Error('Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('This QR code could not be verified. It may be invalid or the product may not be in our system.')
      setVerified(false)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return 'Date not available'
    }
    
    const date = new Date(dateString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
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
      // Fallback to direct PDF generation
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'delayed': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'in_transit': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'delayed': return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Verification</h1>
              <p className="text-gray-600">Verify product authenticity and traceability</p>
            </div>
            
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-800 mb-2">Verification Failed</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/dashboard/scanner">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Scanner
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/marketplace">
                      Browse Products
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Product Verified</h1>
            </div>
            <p className="text-gray-600">This product has been verified and is authentic</p>
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">
                <Shield className="h-5 w-5 mr-2" />
                Authentic Product
              </Badge>
            </div>
          </div>

          {/* Main Verification Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Product Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{verificationData?.cropType}</h3>
                    {verificationData?.variety && (
                      <p className="text-gray-600">Variety: {verificationData.variety}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Batch ID:</span>
                      <span className="font-mono text-sm">{verificationData?.batchId}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="text-sm">{verificationData?.quantity} {verificationData?.unit}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Quality:</span>
                      <span className="text-sm">{verificationData?.quality}</span>
                    </div>
                    
                    {verificationData?.variety && (
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Variety:</span>
                        <span className="text-sm">{verificationData.variety}</span>
                      </div>
                    )}
                    
                    {verificationData?.organic && (
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Organic Certified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Harvest Date:</span>
                    <span className="text-sm">{formatDate(verificationData?.harvestDate || '')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm">
                      {verificationData?.location?.city && verificationData?.location?.city !== 'Unknown' 
                        ? `${verificationData.location.city}, ${verificationData.location.state || 'Nigeria'}`
                        : 'Location not specified'
                      }
                    </span>
                  </div>
                  
                  {verificationData?.price && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-semibold">{formatPrice(verificationData.price)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Verified:</span>
                    <span className="text-sm">{formatDate(verificationData?.timestamp || '')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farmer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Farmer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{verificationData?.farmer?.name || 'Unknown Farmer'}</h3>
                    {verificationData?.farmer?.farmName && verificationData.farmer.farmName !== 'Unknown Farm' && (
                      <p className="text-gray-600">{verificationData.farmer.farmName}</p>
                    )}
                  </div>
                  
                  {verificationData?.farmer?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{verificationData.farmer.phone}</span>
                    </div>
                  )}
                  
                  {verificationData?.farmer?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{verificationData.farmer.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Farm Location:</span>
                  </div>
                  <p className="text-sm">
                    {verificationData?.location?.city && verificationData?.location?.city !== 'Unknown'
                      ? `${verificationData.location.city}, ${verificationData.location.state || 'Nigeria'}`
                      : 'Location not specified'
                    }
                  </p>
                  
                  {verificationData?.location?.coordinates && (
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Coordinates:</span>
                      <span className="text-sm font-mono">
                        {verificationData.location.coordinates.lat.toFixed(6)}, {verificationData.location.coordinates.lng.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Product Images</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verificationData?.images && verificationData.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {verificationData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No product images available for this harvest</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/dashboard/scanner">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scanner
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/marketplace">
                Browse More Products
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadCertificate}
              disabled={downloading || !verificationData}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Generating...' : 'Download Certificate'}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>This verification is powered by GroChain's blockchain technology</p>
            <p>Verification URL: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{verificationData?.verificationUrl}</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}