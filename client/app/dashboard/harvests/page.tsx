"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { HarvestAnalytics } from "@/components/agricultural/harvest-analytics"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Leaf,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  QrCode,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Star,
  Thermometer,
  Shield,
  Scale,
  Banknote,
  MoreHorizontal,
  BarChart3,
  FileText,
  Activity
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface HarvestData {
  id: string
  _id: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  harvestDate: Date
  location: string | { city?: string; state?: string }
  quality: string
  qualityGrade: string
  status: string
  description?: string
  images?: string[]
  organic?: boolean
  moistureContent?: number
  price?: number
  soilType?: string
  irrigationType?: string
  pestManagement?: string
  certification?: string
  batchId?: string
  createdAt: string
  updatedAt: string
}

export default function FarmerHarvestsPage() {
  const [harvests, setHarvests] = useState<HarvestData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cropFilter, setCropFilter] = useState("all")
  const [qualityFilter, setQualityFilter] = useState("all")
  const [organicFilter, setOrganicFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({})
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedHarvests, setSelectedHarvests] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalQuantity: 0,
    totalValue: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchHarvests()
    fetchStats()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        fetchHarvests()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, cropFilter, qualityFilter, organicFilter, sortBy, dateRange])

  const fetchHarvests = async () => {
    try {
      setLoading(true)

      // Build filter parameters
      const filters: any = {
        limit: 50,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        cropType: cropFilter !== "all" ? cropFilter : undefined,
        quality: qualityFilter !== "all" ? qualityFilter : undefined,
        organic: organicFilter !== "all" ? organicFilter : undefined,
        sortBy: sortBy || "newest"
      }

      if (dateRange.from) {
        filters.fromDate = dateRange.from.toISOString().split('T')[0]
      }
      if (dateRange.to) {
        filters.toDate = dateRange.to.toISOString().split('T')[0]
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key]
      })

      console.log("Fetching harvests with filters:", filters)
      const response: any = await apiService.getHarvests(filters)
      const rawHarvests = response.harvests || response.data?.harvests || []

      // Map the data to match the harvest card component expectations
      const harvestData = rawHarvests.map((harvest: any) => ({
        id: harvest._id,
        _id: harvest._id, // Also include _id for consistency
        farmerName: 'You', // Since this is the farmer's own harvests
        cropType: harvest.cropType,
        variety: harvest.variety || 'Standard',
        harvestDate: new Date(harvest.date),
        quantity: harvest.quantity,
        unit: harvest.unit,
        location: harvest.location,
        quality: harvest.quality,
        grade: harvest.qualityGrade || 'B',
        status: harvest.status,
        qrCode: harvest.qrData || '',
        price: harvest.price || 0,
        organic: harvest.organic || false,
        moistureContent: harvest.moistureContent || 15,
        images: harvest.images || [],
        batchId: harvest.batchId,
        createdAt: harvest.createdAt,
        updatedAt: harvest.updatedAt
      }))

      setHarvests(harvestData)

      // Update stats after fetching harvests
      await fetchStats()

      // Update pagination if available
      if (response.pagination) {
        // Handle pagination data
      }
    } catch (error) {
      console.error("Failed to fetch harvests:", error)
      toast({
        title: "Error",
        description: "Failed to load harvests. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      console.log("🔄 Fetching harvest stats...")

      const response: any = await apiService.getHarvestStats()
      console.log("📊 Raw Stats API Response:", response)

      // Handle nested data structure: response.data
      let statsData
      if (response?.status === 'success' && response?.data) {
        statsData = response.data
        console.log("✅ Found stats in response.data")
      } else if (response?.data) {
        statsData = response.data
        console.log("✅ Found stats in response.data (direct)")
      } else {
        statsData = response
        console.log("⚠️ Using response directly as stats data")
      }

      console.log("🔍 Parsed stats data:", statsData)
      console.log("📈 Individual values:",
        "total:", statsData?.totalHarvests,
        "pending:", statsData?.pendingHarvests,
        "approved:", statsData?.approvedHarvests,
        "rejected:", statsData?.rejectedHarvests,
        "quantity:", statsData?.totalQuantity,
        "value:", statsData?.totalValue
      )

      const newStats = {
        total: statsData?.totalHarvests || 0,
        pending: statsData?.pendingHarvests || 0,
        approved: statsData?.approvedHarvests || 0,
        rejected: statsData?.rejectedHarvests || 0,
        totalQuantity: statsData?.totalQuantity || 0,
        totalValue: statsData?.totalValue || 0
      }

      console.log("💾 Setting new stats state:", newStats)
      setStats(newStats)

      // Force a re-render by updating state again after a delay
      setTimeout(() => {
        console.log("🔄 Forcing stats re-render")
        setStats(prev => ({ ...prev }))
      }, 100)

    } catch (error) {
      console.error("❌ Failed to fetch stats:", error)
      console.error("❌ Error details:", {
        message: (error as any).message,
        stack: (error as any).stack,
        name: (error as any).name
      })

      // Try to get more details about the error
      if ((error as any).response) {
        console.error("❌ Response error:", (error as any).response.status, (error as any).response.data)
      }

      // Set default values if API fails
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalQuantity: 0,
        totalValue: 0
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedHarvest) return

    try {
      setDeleting(true)
      await apiService.deleteHarvest(selectedHarvest._id)
      toast({
        title: "Success",
        description: "Harvest deleted successfully",
        variant: "default"
      })
      // Refresh both harvests and stats
      await Promise.all([fetchHarvests(), fetchStats()])
      setShowDeleteDialog(false)
      setSelectedHarvest(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete harvest",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSelectHarvest = (harvestId: string, checked: boolean) => {
    if (checked) {
      setSelectedHarvests(prev => [...prev, harvestId])
    } else {
      setSelectedHarvests(prev => prev.filter(id => id !== harvestId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHarvests(harvests.map(h => h._id))
    } else {
      setSelectedHarvests([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedHarvests.length === 0) return

    try {
      setDeleting(true)
      // Delete all selected harvests
      await Promise.all(selectedHarvests.map(id => apiService.deleteHarvest(id)))

      toast({
        title: "Success",
        description: `Deleted ${selectedHarvests.length} harvest${selectedHarvests.length > 1 ? 's' : ''} successfully`,
        variant: "default"
      })

      setSelectedHarvests([])
      fetchHarvests()
      fetchStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected harvests",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkExport = async () => {
    try {
      const exportData = harvests.filter(h => selectedHarvests.includes(h._id))
      const csvContent = convertToCSV(exportData)

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `harvests-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast({
        title: "Success",
        description: "Harvest data exported successfully",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export harvest data",
        variant: "destructive"
      })
    }
  }

  const convertToCSV = (data: HarvestData[]) => {
    const headers = ['Crop Type', 'Variety', 'Quantity', 'Unit', 'Harvest Date', 'Location', 'Quality', 'Status', 'Organic', 'Price']
    const csvRows = [
      headers.join(','),
      ...data.map(harvest => [
        harvest.cropType,
        harvest.variety || '',
        harvest.quantity,
        harvest.unit,
        harvest.harvestDate,
        `"${typeof harvest.location === 'string' ? harvest.location : `${harvest.location?.city || 'Unknown'}, ${harvest.location?.state || 'Unknown State'}`}"`,
        harvest.quality,
        harvest.status,
        harvest.organic ? 'Yes' : 'No',
        harvest.price || 0
      ].join(','))
    ]
    return csvRows.join('\n')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "good":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "fair":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "poor":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const filteredHarvests = harvests.filter(harvest => {
    const matchesSearch = harvest.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (typeof harvest.location === 'string' ? harvest.location.toLowerCase() : `${harvest.location?.city || ''} ${harvest.location?.state || ''}`.toLowerCase()).includes(searchQuery.toLowerCase()) ||
                         (harvest.variety && harvest.variety.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || harvest.status === statusFilter
    const matchesCrop = cropFilter === "all" || harvest.cropType === cropFilter
    
    return matchesSearch && matchesStatus && matchesCrop
  })

  const cropTypes = Array.from(new Set(harvests.map(h => h.cropType)))

  const HarvestCard = ({ harvest, variant = "default" }: { harvest: HarvestData; variant?: "default" | "detailed" }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200">
      <div className="relative">
        {harvest.images && harvest.images.length > 0 ? (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <Image
              src={harvest.images[0]}
              alt={harvest.cropType}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg flex items-center justify-center border-b">
            <Leaf className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(harvest.status)}>
            {harvest.status.charAt(0).toUpperCase() + harvest.status.slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {harvest.cropType}
            </h3>
            {harvest.variety && (
              <p className="text-sm text-gray-600">{harvest.variety}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Scale className="h-3 w-3" />
                <span>Quantity</span>
              </div>
              <p className="font-medium text-gray-900">
                {harvest.quantity} {harvest.unit}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Date</span>
              </div>
              <p className="font-medium text-gray-900">
                {new Date(harvest.harvestDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{typeof harvest.location === 'string' ? harvest.location : `${harvest.location?.city || 'Unknown'}, ${harvest.location?.state || 'Unknown State'}`}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getQualityColor(harvest.quality)} variant="outline">
                Grade {harvest.qualityGrade}
              </Badge>
              {harvest.organic && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  Organic
                </Badge>
              )}
            </div>

            {harvest.price && (
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <Banknote className="h-3 w-3" />
                ₦{harvest.price.toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/harvests/${harvest._id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Link>
              </Button>
                             <Button size="sm" variant="outline" asChild>
                 <Link href={`/dashboard/harvests/${harvest._id}/edit`}>
                   <Edit className="h-3 w-3 mr-1" />
                   Edit
                 </Link>
               </Button>
               
               {/* List on Marketplace Button - Only show for approved harvests */}
               {harvest.status === "approved" && (
                 <Button size="sm" variant="outline" asChild>
                   <Link href={`/dashboard/marketplace/new?harvestId=${harvest._id}`}>
                     <Banknote className="h-3 w-3 mr-1" />
                     List
                   </Link>
                 </Button>
               )}
             </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/harvests/${harvest._id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                                 <DropdownMenuItem asChild>
                   <Link href={`/dashboard/harvests/${harvest._id}/edit`}>
                     <Edit className="h-4 w-4 mr-2" />
                     Edit Harvest
                   </Link>
                 </DropdownMenuItem>
                 
                 {/* List on Marketplace - Only show for approved harvests */}
                 {harvest.status === "approved" && (
                   <DropdownMenuItem asChild>
                     <Link href={`/dashboard/marketplace/new?harvestId=${harvest._id}`}>
                       <Banknote className="h-4 w-4 mr-2" />
                       List on Marketplace
                     </Link>
                   </DropdownMenuItem>
                 )}
                 
                 <DropdownMenuItem>
                   <QrCode className="h-4 w-4 mr-2" />
                   Generate QR Code
                 </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    setSelectedHarvest(harvest)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Harvest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout pageTitle="Harvest Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Harvest Management</h1>
            <p className="text-gray-600">
              Track and manage your agricultural harvests for better yields and market access
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/dashboard/harvests/new">
                <Plus className="h-4 w-4 mr-2" />
                Log New Harvest
              </Link>
            </Button>
            <Button variant="outline" onClick={async () => {
              await Promise.all([fetchHarvests(), fetchStats()])
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                Total Harvests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              )}
              <p className="text-xs text-gray-500">All time harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              )}
              <p className="text-xs text-gray-500">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              )}
              <p className="text-xs text-gray-500">Verified harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
              )}
              <p className="text-xs text-gray-500">Rejected harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">₦{(stats.totalValue || 0).toLocaleString()}</div>
              )}
              <p className="text-xs text-gray-500">Estimated value</p>
            </CardContent>
          </Card>
        </div>

        {/* Harvest Analytics */}
        <HarvestAnalytics />

        {/* Filters and Search */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by crop, location, or variety..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {cropTypes.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvests Display */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border border-gray-200">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredHarvests.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredHarvests.map((harvest) => (
                  <HarvestCard
                    key={harvest.id}
                    harvest={harvest}
                    variant={viewMode === "list" ? "detailed" : "default"}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 border border-gray-200">
                <div className="text-gray-400 mb-4">
                  <Leaf className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No harvests found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== "all" || cropFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Start by logging your first harvest to track your agricultural progress"}
                </p>
                {!searchQuery && statusFilter === "all" && cropFilter === "all" && (
                  <Button asChild>
                    <Link href="/dashboard/harvests/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Your First Harvest
                    </Link>
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHarvests.filter(h => h.status === "pending").map((harvest) => (
                <HarvestCard
                  key={harvest._id}
                  harvest={harvest}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHarvests.filter(h => h.status === "approved").map((harvest) => (
                <HarvestCard
                  key={harvest._id}
                  harvest={harvest}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHarvests.filter(h => h.status === "rejected").map((harvest) => (
                <HarvestCard
                  key={harvest._id}
                  harvest={harvest}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions & Help */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/harvests/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Harvest
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Codes
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    await apiService.exportHarvests({
                      format: 'json',
                      status: statusFilter !== 'all' ? statusFilter : undefined,
                      cropType: cropFilter !== 'all' ? cropFilter : undefined
                    })
                    toast({
                      title: "Export Started",
                      description: "Your harvest data export has been downloaded",
                    })
                  } catch (error) {
                    toast({
                      title: "Export Failed",
                      description: "Failed to export harvest data",
                      variant: "destructive"
                    })
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
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
                <Link href="/dashboard/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/qr-codes">
                  <QrCode className="h-4 w-4 mr-2" />
                  Manage QR Codes
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/financial">
                  <Banknote className="h-4 w-4 mr-2" />
                  Financial Services
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
            <DialogTitle>Delete Harvest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this harvest? This action cannot be undone and will remove all associated data including QR codes and marketplace listings.
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
              {deleting ? "Deleting..." : "Delete Harvest"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}



