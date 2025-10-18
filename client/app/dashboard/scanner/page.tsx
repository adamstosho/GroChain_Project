"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import QrScanner from 'qr-scanner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import QRGenerator from "@/components/qr-generator"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Package,
  Clock,
  Info,
  Scan,
  Shield,
  FileText,
  MapPin,
  Truck,
  Star,
  Eye,
  History,
  Upload,
  Loader2,
  ExternalLink,
  User,
  Calendar,
  Leaf,
  Award,
  Globe,
  Phone,
  Mail,
  Building,
  Navigation,
  Zap,
  AlertCircle,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ScannedProduct {
  _id: string
  batchId: string
  cropType: string
  variety?: string
  harvestDate: string
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
  status: string
  verified: boolean
  scannedAt: Date
  message?: string
  images?: string[]
  organic?: boolean
  price?: number
  verificationUrl?: string
  timestamp?: string
}

interface ScanHistoryItem {
  _id: string
  batchId: string
  cropType: string
  variety?: string
  verified: boolean
  scannedAt: Date
  location?: string
  farmer?: string
  quantity?: number
  unit?: string
  quality?: string
  status?: string
  message?: string
  images?: string[]
  organic?: boolean
  price?: number
}

interface ScanStats {
  totalScans: number
  verifiedScans: number
  failedScans: number
  uniqueProducts: number
  lastScanDate?: Date
}

export default function QRScannerPage() {
  const [activeTab, setActiveTab] = useState<string>("scanner")
  const [scanning, setScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [scannedData, setScannedData] = useState<string>("")
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScannedProduct | null>(null)
  const [scanStats, setScanStats] = useState<ScanStats>({
    totalScans: 0,
    verifiedScans: 0,
    failedScans: 0,
    uniqueProducts: 0
  })
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [lastScanError, setLastScanError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadScanHistory()
    checkCameraPermission()
    return () => {
      stopCamera()
    }
  }, [])

  const loadScanHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('grochain-scan-history')
      if (saved) {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          scannedAt: new Date(item.scannedAt)
        }))
        setScanHistory(history)
        calculateStats(history)
      }
    } catch (error) {
      console.error('Error loading scan history:', error)
    }
  }, [])

  const calculateStats = (history: ScanHistoryItem[]) => {
    const stats = {
      totalScans: history.length,
      verifiedScans: history.filter(item => item.verified).length,
      failedScans: history.filter(item => !item.verified).length,
      uniqueProducts: new Set(history.map(item => item.batchId)).size,
      lastScanDate: history.length > 0 ? history[0].scannedAt : undefined
    }
    setScanStats(stats)
  }

  const saveScanHistory = useCallback((newItem: ScanHistoryItem) => {
    try {
      const updatedHistory = [newItem, ...scanHistory]
      setScanHistory(updatedHistory)
      localStorage.setItem('grochain-scan-history', JSON.stringify(updatedHistory))
      calculateStats(updatedHistory)
    } catch (error) {
      console.error('Error saving scan history:', error)
    }
  }, [scanHistory])

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(result.state === 'granted' ? 'granted' : 'denied')
    } catch (error) {
      setCameraPermission('denied')
    }
  }

  const startCamera = async () => {
    try {
      setLastScanError(null)
      setScanning(true)
      
      // Request camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
        setCameraPermission('granted')
        streamRef.current = stream
        
        // Start QR code detection
        await startQRDetection()
      } catch (permissionError) {
        console.error('Camera permission error:', permissionError)
        setCameraPermission('denied')
        setLastScanError('Camera access denied. Please allow camera access to scan QR codes.')
        setScanning(false)
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to scan QR codes",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraPermission('denied')
      setLastScanError('Failed to start camera. Please check your device permissions.')
      setScanning(false)
      toast({
        title: "Camera error",
        description: "Failed to start camera. Please check your device permissions.",
        variant: "destructive"
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      // Stop QR scanner if it exists
      if ((videoRef.current as any).qrScanner) {
        (videoRef.current as any).qrScanner.stop()
        (videoRef.current as any).qrScanner.destroy()
        ;(videoRef.current as any).qrScanner = null
      }
      videoRef.current.srcObject = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setScanning(false)
  }

  const startQRDetection = async () => {
    if (!videoRef.current) return
    
    try {
      // Set the video source to the camera stream
      if (streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        await videoRef.current.play()
      }
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data)
          processScannedData(result.data)
          qrScanner.stop()
          stopCamera()
        },
        {
          onDecodeError: (error) => {
            // Silently handle decode errors - they're very common
            // console.log('QR decode error:', error)
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
          maxScansPerSecond: 5,
        }
      )
      
      // Store the scanner instance for cleanup
      ;(videoRef.current as any).qrScanner = qrScanner
      
      await qrScanner.start()
      console.log('QR Scanner started successfully')
    } catch (error) {
      console.error('QR Scanner start error:', error)
      setLastScanError('Failed to start QR scanner. Please check camera permissions.')
      setScanning(false)
      setCameraPermission('denied')
      toast({
        title: "QR Scanner Error",
        description: "Failed to start QR scanner. Please check camera permissions.",
        variant: "destructive"
      })
    }
  }

  const handleManualInput = async () => {
    if (scannedData.trim()) {
      await processScannedData(scannedData.trim())
    } else {
      toast({
        title: "No data entered",
        description: "Please enter a QR code or tracking number",
        variant: "destructive"
      })
    }
  }

  const processScannedData = async (data: string) => {
    setLoading(true)
    setCurrentScan(null)
    setLastScanError(null)
    
    try {
      console.log('🔍 Processing scanned data:', data)
      
      // Try to verify as QR code first
      try {
        const response = await apiService.verifyQRCode(data)
        console.log('✅ QR verification response:', response)
        
        if (response?.status === 'success' && response?.data) {
          const verificationData = response.data
          const scannedProduct: ScannedProduct = {
            _id: Date.now().toString(),
            batchId: verificationData.batchId,
            cropType: verificationData.cropType,
            variety: (verificationData as any).variety,
            harvestDate: verificationData.harvestDate,
            quantity: verificationData.quantity,
            unit: verificationData.unit,
            quality: verificationData.quality,
            location: verificationData.location,
            farmer: verificationData.farmer as any,
            status: verificationData.status,
            verified: true,
            scannedAt: new Date(),
            message: verificationData.message || 'Product verified successfully'
          }
          
          setCurrentScan(scannedProduct)
          
          // Save to history
          const historyItem: ScanHistoryItem = {
            _id: Date.now().toString(),
            batchId: verificationData.batchId,
            cropType: verificationData.cropType,
            variety: (verificationData as any).variety,
            verified: true,
            scannedAt: new Date(),
            location: typeof verificationData.location === 'string' 
              ? verificationData.location 
              : `${verificationData.location?.city || 'Unknown'}, ${verificationData.location?.state || 'Unknown State'}`,
            farmer: (verificationData.farmer as any)?.name || 'Unknown Farmer',
            quantity: verificationData.quantity,
            unit: verificationData.unit,
            quality: verificationData.quality,
            status: verificationData.status,
            message: verificationData.message || 'Product verified successfully'
          }
          
          saveScanHistory(historyItem)
          
          toast({
            title: "Product verified successfully",
            description: `${verificationData.cropType} from batch ${verificationData.batchId} has been verified`,
          })
        } else {
          throw new Error('Verification failed')
        }
      } catch (verifyError: any) {
        console.log('❌ QR verification failed:', verifyError)
        
        // Extract meaningful error message
        let errorMessage = 'This QR code or tracking number was not found in our system'
        if (verifyError?.message) {
          if (verifyError.message.includes('404') || verifyError.message.includes('not found')) {
            errorMessage = 'This QR code or tracking number was not found in our system'
          } else if (verifyError.message.includes('Network error')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.'
          } else if (verifyError.message.includes('Server error')) {
            errorMessage = 'Server error occurred. Please try again later.'
          } else {
            errorMessage = verifyError.message
          }
        }
        
        // Create a failed verification entry
        const failedItem: ScanHistoryItem = {
          _id: Date.now().toString(),
          batchId: data,
          cropType: 'Unknown Product',
          verified: false,
          scannedAt: new Date(),
          message: errorMessage
        }
        
        saveScanHistory(failedItem)
        setLastScanError(errorMessage)
        
        toast({
          title: "Verification failed",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Error processing scanned data:', error)
      setLastScanError('An error occurred while processing the scan')
      
      toast({
        title: "Scan failed",
        description: "An error occurred while processing the scan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const filteredHistory = scanHistory.filter(item => {
    if (!searchQuery) return true
    return item.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (item.farmer && item.farmer.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const exportHistory = () => {
    const dataStr = JSON.stringify(scanHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grochain-scan-history-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "History exported",
      description: "Your scan history has been downloaded",
    })
  }

  return (
    <DashboardLayout pageTitle="QR Scanner">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">QR Scanner</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Scan QR codes to verify product authenticity and track shipments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportHistory} 
              disabled={scanHistory.length === 0}
              className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </Button>
            <Button size="sm" asChild className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
              <Link href="/dashboard/marketplace">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Browse
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Scan className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Scans</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{scanStats.totalScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Verified</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{scanStats.verifiedScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Failed</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{scanStats.failedScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Unique Products</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{scanStats.uniqueProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Scanner Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="scanner" className="text-xs sm:text-sm">Scanner</TabsTrigger>
            <TabsTrigger value="manual" className="text-xs sm:text-sm">Manual</TabsTrigger>
            <TabsTrigger value="generator" className="text-xs sm:text-sm">Generator</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
          </TabsList>

          {/* QR Scanner Tab */}
          <TabsContent value="scanner" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span>Camera Scanner</span>
                  {scanning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullScreen(!showFullScreen)}
                      className="h-7 sm:h-8 text-xs sm:text-sm"
                    >
                      {showFullScreen ? <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Use your device camera to scan QR codes on products and shipments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {/* Camera Permission Status */}
                {cameraPermission === 'denied' && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-red-800 text-sm sm:text-base">Camera access denied</p>
                        <p className="text-xs sm:text-sm text-red-600 mt-1">
                          Please enable camera access in your browser settings to use the scanner
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Scan Error */}
                {lastScanError && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-red-800 text-sm sm:text-base">Scan Error</p>
                        <p className="text-xs sm:text-sm text-red-600 mt-1 break-words">{lastScanError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                  {!scanning ? (
                    <Button 
                      onClick={startCamera} 
                      disabled={cameraPermission === 'denied'} 
                      size="lg"
                      className="h-9 sm:h-10 text-sm sm:text-base"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopCamera} 
                      variant="outline" 
                      size="lg"
                      className="h-9 sm:h-10 text-sm sm:text-base"
                    >
                      <CameraOff className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Stop Camera
                    </Button>
                  )}
                </div>

                {/* Camera View */}
                {scanning && (
                  <div className={`relative ${showFullScreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
                    {showFullScreen && (
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFullScreen(false)}
                          className="bg-white/90 hover:bg-white h-7 sm:h-8 text-xs sm:text-sm"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className={`${showFullScreen 
                        ? 'w-full h-full object-cover' 
                        : 'w-full max-w-xs sm:max-w-md mx-auto rounded-lg border-2 border-primary'
                      }`}
                    />
                    {!showFullScreen && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-white border-dashed w-32 h-32 sm:w-48 sm:h-48 rounded-lg flex items-center justify-center">
                          <QrCode className="h-8 w-8 sm:h-16 sm:w-16 text-white opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scanner Instructions */}
                {!scanning && (
                  <div className="text-center p-4 sm:p-6 bg-muted/50 rounded-lg">
                    <QrCode className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Ready to Scan</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                      Click "Start Camera" to begin scanning QR codes
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>All scans are verified for authenticity</span>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="text-center p-4 sm:p-6">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg font-medium">Processing scan...</p>
                    <p className="text-sm sm:text-base text-muted-foreground">Verifying product information</p>
                  </div>
                )}

                {/* Current Scan Result */}
                {currentScan && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <CardTitle className="text-green-800 text-sm sm:text-base">Product Verified</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Crop Type: </span>
                          <span className="font-medium break-words">{currentScan.cropType}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Batch ID: </span>
                          <span className="font-mono break-all">{currentScan.batchId}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Quantity: </span>
                          <span className="break-words">{currentScan.quantity} {currentScan.unit}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Quality: </span>
                          <span className="break-words">{currentScan.quality}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Harvest Date: </span>
                          <span className="break-words">{new Date(currentScan.harvestDate).toLocaleDateString()}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Location: </span>
                          <span className="break-words">
                            {typeof currentScan.location === 'string' 
                              ? currentScan.location 
                              : `${currentScan.location?.city || 'Unknown'}, ${currentScan.location?.state || 'Unknown State'}`
                            }
                          </span>
                        </div>
                        {currentScan.farmer && (
                          <div className="min-w-0 sm:col-span-2">
                            <span className="text-muted-foreground">Farmer: </span>
                            <span className="break-words">{currentScan.farmer.name}</span>
                          </div>
                        )}
                        {currentScan.price && (
                          <div className="min-w-0 sm:col-span-2">
                            <span className="text-muted-foreground">Price: </span>
                            <span className="break-words">{formatPrice(currentScan.price)}</span>
                          </div>
                        )}
                      </div>
                      {currentScan.message && (
                        <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-blue-800 break-words">{currentScan.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Manual Input</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Enter QR codes or tracking numbers manually if you can't scan them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <label htmlFor="manual-input" className="text-xs sm:text-sm font-medium">
                    QR Code or Tracking Number
                  </label>
                  <Input
                    id="manual-input"
                    placeholder="Enter QR code or tracking number..."
                    value={scannedData}
                    onChange={(e) => setScannedData(e.target.value)}
                    className="font-mono h-9 sm:h-10 text-xs sm:text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Button 
                    onClick={handleManualInput} 
                    disabled={!scannedData.trim() || loading} 
                    size="lg"
                    className="h-9 sm:h-10 text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    Verify & Track
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setScannedData("")}
                    className="h-9 sm:h-10 text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    Clear
                  </Button>
                </div>

                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-blue-800 min-w-0 flex-1">
                      <p className="font-medium">Manual Input Tips:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Enter the complete batch ID or QR code</li>
                        <li>• The system will verify authenticity automatically</li>
                        <li>• All verified scans are saved to your history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Generator Tab */}
          <TabsContent value="generator" className="mt-4 sm:mt-6">
            <QRGenerator onQRGenerated={(qrData) => {
              setScannedData(qrData)
              setActiveTab("manual")
            }} />
          </TabsContent>

          {/* Scan History Tab */}
          <TabsContent value="history" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Scan History</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  View all your previous scans and verifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Search */}
                <div className="mb-4 sm:mb-6">
                  <Input
                    placeholder="Search scan history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:max-w-md h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                {/* History List */}
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <History className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No scan history</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                      Start scanning QR codes to build your history
                    </p>
                    <Button onClick={() => setActiveTab("scanner")} className="h-8 sm:h-9 text-xs sm:text-sm">
                      <Scan className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Start Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredHistory.map((item) => (
                      <Card key={item._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.cropType}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground break-all">
                                Batch: {item.batchId}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${item.verified ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                {item.verified ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {item.verified ? 'Verified' : 'Failed'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                            {item.quantity && (
                              <div className="min-w-0">
                                <span className="text-muted-foreground">Quantity: </span>
                                <span className="break-words">{item.quantity} {item.unit}</span>
                              </div>
                            )}
                            {item.quality && (
                              <div className="min-w-0">
                                <span className="text-muted-foreground">Quality: </span>
                                <span className="break-words">{item.quality}</span>
                              </div>
                            )}
                            {item.location && (
                              <div className="min-w-0 sm:col-span-2">
                                <span className="text-muted-foreground">Location: </span>
                                <span className="break-words">{typeof item.location === 'object' && item.location ? `${(item.location as any)?.city || 'Unknown'}, ${(item.location as any)?.state || 'Unknown State'}` : item.location}</span>
                              </div>
                            )}
                            <div className="min-w-0 sm:col-span-2">
                              <span className="text-muted-foreground">Scanned: </span>
                              <span className="break-words">{formatDate(item.scannedAt)}</span>
                            </div>
                          </div>

                          {item.message && (
                            <div className="mb-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs sm:text-sm text-muted-foreground break-words">{item.message}</p>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <Button variant="outline" size="sm" asChild className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
                              <Link href={`/verify/${item.batchId}`}>
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                View Details
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Certificate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}