"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  QrCode,
  Plus,
  Download,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Leaf,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface QRCode {
  id: string
  code: string
  harvestId: string
  cropType: string
  quantity: number
  quality: string
  harvestDate: string
  location: string
  status: 'active' | 'expired' | 'revoked' | 'verified'
  createdAt: string
  lastScanned?: string
  scanCount: number
  metadata: {
    farmerId: string
    farmName: string
    coordinates?: string | { lat: number; lng: number }
    batchNumber: string
    location?: {
      city: string
      state: string
      farmName: string
      coordinates?: { lat: number; lng: number }
    }
  }
}

interface QRStats {
  totalCodes: number
  activeCodes: number
  verifiedCodes: number
  revokedCodes: number
  expiredCodes?: number
  totalScans: number
  totalDownloads?: number
  monthlyGrowth?: number
  monthlyTrend: {
    month: string
    generated: number
    scanned: number
    verified: number
  }[]
}

const qrStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'verified', label: 'Verified' }
]

const statusColors = {
  active: 'bg-success/10 text-success border-success/10',
  expired: 'bg-warning/10 text-warning border-warning/10',
  revoked: 'bg-destructive/10 text-destructive border-destructive/10',
  verified: 'bg-primary/10 text-primary border-primary/10'
}

const statusIcons = {
  active: <CheckCircle className="h-4 w-4 text-success" />,
  expired: <Clock className="h-4 w-4 text-warning" />,
  revoked: <XCircle className="h-4 w-4 text-destructive" />,
  verified: <CheckCircle className="h-4 w-4 text-primary" />
}

export default function QRCodesPage() {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([])
  const [stats, setStats] = useState<QRStats>({
    totalCodes: 0,
    activeCodes: 0,
    verifiedCodes: 0,
    revokedCodes: 0,
    expiredCodes: 0,
    totalScans: 0,
    totalDownloads: 0,
    monthlyGrowth: 0,
    monthlyTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    cropType: 'all',
    search: ''
  })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null)
  const [showQRDetails, setShowQRDetails] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchQRCodes()
  }, [filters, sortBy, sortOrder])

  // Ensure stats are fetched when component mounts
  useEffect(() => {
    fetchStats()
  }, [])

  // Monitor stats changes for debugging
  useEffect(() => {
    console.log("📊 Stats updated - Total:", stats.totalCodes, "Active:", stats.activeCodes, "Downloads:", stats.totalDownloads)
  }, [stats])



  const fetchQRCodes = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching QR codes...")
      console.log("🔧 Filters:", filters)

      // Fetch QR codes from backend
      const qrResponse = await apiService.getQRCodes({
        page: 1,
        limit: 50,
        status: filters.status !== 'all' ? filters.status : undefined,
        cropType: filters.cropType !== 'all' ? filters.cropType : undefined,
        search: filters.search || undefined
      })

      console.log("📱 QR codes API response:", qrResponse)
      console.log("📊 Response status:", qrResponse?.status)
      console.log("📦 Response data type:", typeof qrResponse?.data)

      if (qrResponse?.status === 'success' && qrResponse?.data) {
        const qrCodesData = Array.isArray(qrResponse.data) ? qrResponse.data : []
        console.log("✅ QR codes data:", qrCodesData)

        if (qrCodesData.length === 0) {
          console.log("ℹ️ No QR codes found")
          setQRCodes([])
          // Don't set stats to null, let the stats fetch handle it
          return
        }

        // Format QR codes data to match frontend interface
        const formattedQRCodes: QRCode[] = qrCodesData.map((qr: any) => ({
          id: qr.id || qr._id,
          code: qr.code,
          harvestId: qr.harvestId || qr.harvest,
          cropType: qr.cropType || qr.metadata?.cropType || 'Unknown',
          quantity: qr.quantity || qr.metadata?.quantity || 0,
          quality: qr.quality || qr.metadata?.quality || 'Standard',
          harvestDate: qr.harvestDate || qr.metadata?.harvestDate,
          location: qr.metadata?.location?.city || qr.location || 'Unknown',
          status: qr.status || 'active',
          createdAt: qr.createdAt,
          lastScanned: qr.lastScanned,
          scanCount: qr.scanCount || 0,
          metadata: {
            farmerId: qr.metadata?.farmerId || '',
            farmName: qr.metadata?.location?.farmName || 'Unknown Farm',
            coordinates: qr.metadata?.location?.coordinates || qr.metadata?.coordinates || { lat: 0, lng: 0 },
            batchNumber: qr.metadata?.batchNumber || qr.batchId || '',
            location: qr.metadata?.location || {
              city: qr.metadata?.location?.city || 'Unknown',
              state: qr.metadata?.location?.state || 'Unknown',
              farmName: qr.metadata?.location?.farmName || 'Unknown Farm'
            }
          }
        }))

        setQRCodes(formattedQRCodes)

        // Fetch stats
        await fetchStats()
      } else {
        console.warn("⚠️ QR codes response not in expected format:", qrResponse)
        setQRCodes([])
        // Don't set stats to null, let the stats fetch handle it
      }
    } catch (error) {
      console.error("❌ Failed to fetch QR codes:", error)
      toast({
        title: "Error",
        description: "Failed to load QR code data. Please try again.",
        variant: "destructive"
      })
      setQRCodes([])
      // Don't set stats to null, let the stats fetch handle it
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log("🔄 Fetching QR stats...")
      const statsResponse = await apiService.getQRCodeStats()

      if (statsResponse?.status === 'success' && statsResponse?.data) {
        const statsData = statsResponse.data as any
        const formattedStats: QRStats = {
          totalCodes: statsData.totalCodes || 0,
          activeCodes: statsData.activeCodes || 0,
          verifiedCodes: statsData.verifiedCodes || 0,
          revokedCodes: statsData.revokedCodes || 0,
          totalScans: statsData.totalScans || 0,
          monthlyTrend: Array.isArray(statsData.monthlyTrend) ? statsData.monthlyTrend : [],
          // Add additional stats from backend if available
          expiredCodes: statsData.expiredCodes || 0,
          totalDownloads: statsData.totalDownloads || 0,
          monthlyGrowth: statsData.monthlyGrowth || 0
        }

        setStats(formattedStats)
      } else {
        // Calculate stats from QR codes data if API doesn't provide them
        const calculatedStats: QRStats = {
          totalCodes: qrCodes.length,
          activeCodes: qrCodes.filter(qr => qr.status === 'active').length,
          verifiedCodes: qrCodes.filter(qr => qr.status === 'verified').length,
          revokedCodes: qrCodes.filter(qr => qr.status === 'revoked').length,
          expiredCodes: qrCodes.filter(qr => qr.status === 'expired').length,
          totalScans: qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0),
          totalDownloads: 0, // Not tracked in current data
          monthlyGrowth: 0, // Would need historical data
          monthlyTrend: []
        }
        console.log("⚠️ Using calculated stats:", calculatedStats)
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error("❌ Failed to fetch QR stats:", error)
      // Calculate stats from QR codes data as fallback
      const fallbackStats: QRStats = {
        totalCodes: qrCodes.length,
        activeCodes: qrCodes.filter(qr => qr.status === 'active').length,
        verifiedCodes: qrCodes.filter(qr => qr.status === 'verified').length,
        revokedCodes: qrCodes.filter(qr => qr.status === 'revoked').length,
        expiredCodes: qrCodes.filter(qr => qr.status === 'expired').length,
        totalScans: qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0),
        totalDownloads: 0,
        monthlyGrowth: 0,
        monthlyTrend: []
      }
      setStats(fallbackStats)
    }
  }

  const handleGenerateQR = () => {
    // Navigate to QR generation form
    window.location.href = "/dashboard/qr-codes/generate"
  }

  const handleDownloadQR = async (qrCode: QRCode) => {
    try {
      console.log('📥 Downloading QR code:', qrCode.code)

      const response = await apiService.downloadQRCode(qrCode.id)

      // Get the blob from the response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `${qrCode.code}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Successful",
        description: `QR code ${qrCode.code} has been downloaded.`,
        variant: "default"
      })
    } catch (error) {
      console.error("❌ Download failed:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleViewQRDetails = async (qrCode: QRCode) => {
    try {
      console.log('👁️ Viewing QR code details:', qrCode.code)

      const detailsResponse = await apiService.getQRCodeById(qrCode.id)

      if (detailsResponse?.status === 'success' && detailsResponse?.data) {
        setSelectedQRCode({
          ...qrCode,
          ...detailsResponse.data
        })
        setShowQRDetails(true)
      } else {
        throw new Error('Failed to load QR code details')
      }
    } catch (error) {
      console.error("❌ Failed to load QR details:", error)
      toast({
        title: "Error",
        description: "Failed to load QR code details. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRevokeQR = async (qrCode: QRCode) => {
    try {
      console.log('🚫 Revoking QR code:', qrCode.code)

      const revokeResponse = await apiService.revokeQRCode(qrCode.id)

      if (revokeResponse?.status === 'success') {
        // Update local state
        setQRCodes(prev => prev.map(qr =>
          qr.id === qrCode.id ? { ...qr, status: 'revoked' as const } : qr
        ))

        // Refresh stats
        await fetchStats()

        toast({
          title: "QR Code Revoked",
          description: `QR code ${qrCode.code} has been successfully revoked.`,
          variant: "default"
        })
      } else {
        throw new Error('Revoke operation failed')
      }
    } catch (error) {
      console.error("❌ Revoke failed:", error)
      toast({
        title: "Revoke Failed",
        description: "Failed to revoke QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const filteredQRCodes = qrCodes.filter(qrCode => {
    if (filters.status !== 'all' && qrCode.status !== filters.status) return false
    if (filters.cropType !== 'all' && qrCode.cropType !== filters.cropType) return false
    if (filters.search && !qrCode.code.toLowerCase().includes(filters.search.toLowerCase()) &&
      !qrCode.cropType.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const sortedQRCodes = [...filteredQRCodes].sort((a, b) => {
    let aValue: any = a[sortBy as keyof QRCode]
    let bValue: any = b[sortBy as keyof QRCode]

    if (sortBy === 'createdAt' || sortBy === 'harvestDate' || sortBy === 'lastScanned') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const cropTypes = Array.from(new Set(qrCodes?.map(qr => qr.cropType).filter(Boolean) || []))

  if (loading) {
    return (
      <DashboardLayout pageTitle="QR Codes">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="QR Codes">
      <div className="space-y-4 sm:space-y-6">
        <DashboardPageHeader
          badge="Provenance Tracking Active"
          title="QR"
          titleHighlight="Codes"
          description="Manage and track your harvest QR codes for provenance verification."
          actions={
            <Button onClick={handleGenerateQR} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button>
          }
        />

        {/* QR Code Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalCodes}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">+1 from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.activeCodes}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Ready for scanning</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.verifiedCodes}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Successfully verified</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {stats.totalDownloads || 0}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Download className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent">QR codes downloaded</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.totalScans}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Eye className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">Across all codes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search - Always visible and prominent */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search QR Codes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, crop, or location..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qrStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Crop Type</label>
                <Select value={filters.cropType} onValueChange={(value) => setFilters(prev => ({ ...prev, cropType: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crops</SelectItem>
                    {cropTypes.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes List */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-medium">QR Code Management</CardTitle>
                <CardDescription className="text-sm">
                  {filteredQRCodes.length} QR codes found
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => { fetchQRCodes(); fetchStats(); }}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh Data</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedQRCodes.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No QR Codes Found</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  {filters.status !== 'all' || filters.cropType !== 'all' || filters.search
                    ? "Try adjusting your filters to see more QR codes."
                    : "You don&apos;t have any QR codes yet."}
                </p>
                {!filters.status && !filters.cropType && !filters.search && (
                  <Button onClick={handleGenerateQR} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First QR Code
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block md:hidden space-y-4">
                  {sortedQRCodes.map((qrCode) => (
                    <Card key={qrCode.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <QrCode className="h-4 w-4 text-primary" />
                                <span className="font-mono text-sm font-medium truncate">{qrCode.code}</span>
                              </div>
                              <Badge className={`${statusColors[qrCode.status]} text-xs`} variant="outline">
                                {statusIcons[qrCode.status]}
                                <span className="ml-1 capitalize">{qrCode.status}</span>
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadQR(qrCode)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleViewQRDetails(qrCode)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Leaf className="h-3 w-3" />
                                <span className="font-medium">{qrCode.cropType}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {qrCode.quantity}kg • {qrCode.quality}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">
                                  {qrCode.metadata?.location?.city || qrCode.location || 'Unknown'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {qrCode.metadata?.location?.state || 'Unknown State'}
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{qrCode.scanCount} scans</span>
                              </div>
                              <div>
                                {new Date(qrCode.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {qrCode.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeQR(qrCode)}
                                className="text-destructive hover:text-destructive h-8 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                          <button
                            onClick={() => handleSort('createdAt')}
                            className="flex items-center gap-2 hover:text-foreground"
                          >
                            Generated
                            {sortBy === 'createdAt' && (
                              sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">QR Code</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Harvest Details</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Scans</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedQRCodes.map((qrCode) => (
                        <tr key={qrCode.id} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4">
                            <div className="text-sm text-foreground">
                              {new Date(qrCode.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(qrCode.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-medium">{qrCode.code}</div>
                              <div className="text-xs text-muted-foreground">Batch: {qrCode.metadata.batchNumber}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-success" />
                                <span className="text-sm font-medium">{qrCode.cropType}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {qrCode.quantity}kg • Quality: {qrCode.quality}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Harvest: {qrCode.harvestDate ? new Date(qrCode.harvestDate).toLocaleDateString() : 'Unknown Date'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">
                                  {qrCode.metadata?.location?.city || qrCode.location || 'Unknown'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {qrCode.metadata?.location?.state || 'Unknown State'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusColors[qrCode.status]} variant="outline">
                              {statusIcons[qrCode.status]}
                              <span className="ml-1 capitalize">{qrCode.status}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{qrCode.scanCount}</div>
                              {qrCode.lastScanned && (
                                <div className="text-xs text-muted-foreground">
                                  Last: {new Date(qrCode.lastScanned).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadQR(qrCode)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewQRDetails(qrCode)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {qrCode.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeQR(qrCode)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>



        {/* QR Code Details Modal */}
        {showQRDetails && selectedQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-card rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate mr-4">
                    <span className="hidden sm:inline">QR Code Details - </span>
                    <span className="font-mono text-sm">{selectedQRCode.code}</span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRDetails(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[selectedQRCode.status]}>
                      {statusIcons[selectedQRCode.status]}
                      <span className="ml-1 capitalize">{selectedQRCode.status}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Created: {new Date(selectedQRCode.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQR(selectedQRCode)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {selectedQRCode.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeQR(selectedQRCode)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>

                {/* QR Code Image */}
                {(selectedQRCode as any).qrImage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">QR Code Image</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="p-2 sm:p-4 bg-white border border-border rounded-lg">
                        <Image
                          src={(selectedQRCode as any).qrImage}
                          alt={`QR Code ${selectedQRCode.code}`}
                          width={192}
                          height={192}
                          unoptimized
                          className="w-32 h-32 sm:w-48 sm:h-48"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* QR Code Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Product Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Batch ID:</span>
                        <span>{selectedQRCode.metadata?.batchNumber || (selectedQRCode as any).batchId || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Crop Type:</span>
                        <span>{selectedQRCode.cropType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quantity:</span>
                        <span>{selectedQRCode.quantity} {(selectedQRCode as any).unit || 'kg'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quality:</span>
                        <span>{selectedQRCode.quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Location:</span>
                        <span>{selectedQRCode.metadata?.location?.city || selectedQRCode.location || 'Unknown'}, {selectedQRCode.metadata?.location?.state || 'Unknown State'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Farm:</span>
                        <span>{selectedQRCode.metadata?.location?.farmName || 'Unknown Farm'}</span>
                      </div>
                      {selectedQRCode.harvestDate && (
                        <div className="flex justify-between">
                          <span className="font-medium">Harvest Date:</span>
                          <span>{new Date(selectedQRCode.harvestDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scan Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Scans:</span>
                        <span>{selectedQRCode.scanCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Download Count:</span>
                        <span>{(selectedQRCode as any).downloadCount || 0}</span>
                      </div>
                      {selectedQRCode.lastScanned && (
                        <div className="flex justify-between">
                          <span className="font-medium">Last Scanned:</span>
                          <span>{new Date(selectedQRCode.lastScanned).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span>{new Date(selectedQRCode.createdAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scan History */}
                {(selectedQRCode as any).scans && (selectedQRCode as any).scans.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {(selectedQRCode as any).scans.slice(0, 10).map((scan: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {scan.scannedBy.name || 'Anonymous User'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(scan.scannedAt).toLocaleString()}
                              </div>
                              {scan.deviceInfo && (
                                <div className="text-xs text-muted-foreground">
                                  {scan.deviceInfo.userAgent?.substring(0, 50)}...
                                </div>
                              )}
                            </div>
                            <Badge className={
                              scan.verificationResult === 'success' ? 'bg-success/10 text-success' :
                                scan.verificationResult === 'failed' ? 'bg-destructive/10 text-destructive' :
                                  'bg-warning/10 text-warning'
                            }>
                              {scan.verificationResult}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* QR Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Embedded QR Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
                      {JSON.stringify((selectedQRCode as any).qrData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



