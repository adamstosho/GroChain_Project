"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
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
  Shield,
  Scale,
  Banknote,
  MoreHorizontal,
  BarChart3
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

function getHarvestStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-warning/10 text-warning border-warning/10"
    case "approved":
    case "listed":
    case "verified":
      return "bg-success/10 text-success border-success/10"
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/10"
    case "revision_requested":
    case "under_review":
      return "bg-primary/10 text-primary border-primary/10"
    case "shipped":
      return "bg-primary/10 text-primary border-primary/10"
    default:
      return "bg-muted text-foreground border-border"
  }
}

function getHarvestQualityColor(quality: string) {
  switch (quality) {
    case "excellent":
      return "bg-success/10 text-success border-success/10"
    case "good":
      return "bg-primary/10 text-primary border-primary/10"
    case "fair":
      return "bg-warning/10 text-warning border-warning/10"
    case "poor":
      return "bg-destructive/10 text-destructive border-destructive/10"
    default:
      return "bg-muted text-foreground border-border"
  }
}

function FarmerHarvestListingCard({
  harvest,
  variant: _variant = "default",
  onDeleteRequest,
  onExportHarvest,
  selectable = false,
  selected = false,
  onSelectChange,
}: {
  harvest: HarvestData
  variant?: "default" | "detailed"
  onDeleteRequest: (harvest: HarvestData) => void
  onExportHarvest: (harvest: HarvestData) => void
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
}) {
  return (
    <Card className={`group h-full border transition-all duration-200 hover:shadow-lg ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}>
      <div className="relative">
        {selectable && (
          <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectChange?.(checked === true)}
              className="h-5 w-5 border-2 border-white bg-white/90 shadow-sm data-[state=checked]:bg-primary"
              aria-label={`Select ${harvest.cropType} harvest`}
            />
          </div>
        )}
        {harvest.images && harvest.images.length > 0 ? (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <Image
              src={harvest.images[0]}
              alt={harvest.cropType}
              width={400}
              height={225}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-t-lg border-b bg-muted">
            <Leaf className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
          </div>
        )}

        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <Badge className={`${getHarvestStatusColor(harvest.status)} text-xs`}>
            {harvest.status.charAt(0).toUpperCase() + harvest.status.slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
              {harvest.cropType}
            </h3>
            {harvest.variety && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{harvest.variety}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground sm:gap-2">
                <Scale className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Quantity</span>
              </div>
              <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                {harvest.quantity} {harvest.unit}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground sm:gap-2">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Date</span>
              </div>
              <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                {new Date(harvest.harvestDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">
                {typeof harvest.location === "string"
                  ? harvest.location
                  : `${harvest.location?.city || "Unknown"}, ${harvest.location?.state || "Unknown State"}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Badge className={`${getHarvestQualityColor(harvest.quality)} text-xs`} variant="outline">
                Grade {harvest.qualityGrade}
              </Badge>
              {harvest.organic && (
                <Badge
                  className="border-success/10 bg-success/10 text-xs text-success"
                  variant="outline"
                >
                  <Shield className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                  Organic
                </Badge>
              )}
            </div>

            {harvest.price ? (
              <div className="flex items-center gap-1 text-xs font-medium text-success sm:gap-2 sm:text-sm">
                <Banknote className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">₦{harvest.price.toLocaleString()}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t pt-2 sm:pt-3">
            <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">
              <Button size="sm" variant="outline" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                <Link href={`/dashboard/harvests/${harvest._id}`}>
                  <Eye className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                <Link href={`/dashboard/harvests/${harvest._id}/edit`}>
                  <Edit className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              </Button>

              {(harvest.status === "approved" || harvest.status === "verified") && (
                <Button size="sm" variant="outline" asChild className="h-7 px-2 text-xs sm:h-8 sm:px-3">
                  <Link href={`/dashboard/marketplace/new?harvestId=${harvest._id}`}>
                    <Banknote className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">List</span>
                  </Link>
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 flex-shrink-0 p-0 sm:h-8 sm:w-8">
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/harvests/${harvest._id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/harvests/${harvest._id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Harvest
                  </Link>
                </DropdownMenuItem>

                {(harvest.status === "approved" || harvest.status === "verified") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/marketplace/new?harvestId=${harvest._id}`}>
                      <Banknote className="mr-2 h-4 w-4" />
                      List on Marketplace
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/qr-codes/generate?harvestId=${harvest._id}`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportHarvest(harvest)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRequest(harvest)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Harvest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FarmerHarvestsPage() {
  const [harvests, setHarvests] = useState<HarvestData[]>([])
  const { isInitialLoading, isRefreshing, begin, finish } = useStableDataFetch()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cropFilter, setCropFilter] = useState("all")
  const [qualityFilter, setQualityFilter] = useState("all")
  const [organicFilter, setOrganicFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({})
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedHarvests, setSelectedHarvests] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
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
  const toastRef = useRef(toast)
  toastRef.current = toast

  const harvestsInFlightRef = useRef(false)
  const statsInFlightRef = useRef(false)
  const statsLoadedRef = useRef(false)

  const filterKey = useMemo(
    () =>
      [
        statusFilter,
        cropFilter,
        qualityFilter,
        organicFilter,
        sortBy,
        dateRange.from?.toISOString() ?? "",
        dateRange.to?.toISOString() ?? "",
      ].join("|"),
    [
      statusFilter,
      cropFilter,
      qualityFilter,
      organicFilter,
      sortBy,
      dateRange.from,
      dateRange.to,
    ]
  )

  const loadHarvests = useCallback(async () => {
    if (harvestsInFlightRef.current) return
    harvestsInFlightRef.current = true
    const generation = begin()

    try {
      const filters: Record<string, string | number | undefined> = {
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        cropType: cropFilter !== "all" ? cropFilter : undefined,
        quality: qualityFilter !== "all" ? qualityFilter : undefined,
        organic: organicFilter !== "all" ? organicFilter : undefined,
        sortBy: sortBy || "newest",
      }

      if (dateRange.from) {
        filters.fromDate = dateRange.from.toISOString().split("T")[0]
      }
      if (dateRange.to) {
        filters.toDate = dateRange.to.toISOString().split("T")[0]
      }

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key]
      })

      const response: any = await apiService.getHarvests(filters)
      const rawHarvests = response.harvests || response.data?.harvests || []

      const harvestData: HarvestData[] = rawHarvests.map((harvest: any) => ({
        id: harvest._id,
        _id: harvest._id,
        cropType: harvest.cropType,
        variety: harvest.variety || "Standard",
        harvestDate: new Date(harvest.date),
        quantity: harvest.quantity,
        unit: harvest.unit,
        location: harvest.location,
        quality: harvest.quality,
        qualityGrade: harvest.qualityGrade || "B",
        status: harvest.status,
        images: harvest.images || [],
        organic: harvest.organic || false,
        moistureContent: harvest.moistureContent || 15,
        price: harvest.price || 0,
        batchId: harvest.batchId,
        createdAt: harvest.createdAt,
        updatedAt: harvest.updatedAt,
      }))

      if (finish(generation)) {
        setHarvests(harvestData)
      }
    } catch (error) {
      console.error("Failed to fetch harvests:", error)
      finish(generation)
      toastRef.current({
        title: "Error",
        description: "Failed to load harvests. Please try again.",
        variant: "destructive",
      })
      setHarvests((prev) => (prev.length > 0 ? prev : []))
    } finally {
      harvestsInFlightRef.current = false
    }
  }, [
    statusFilter,
    cropFilter,
    qualityFilter,
    organicFilter,
    sortBy,
    dateRange.from,
    dateRange.to,
    begin,
    finish,
  ])

  const loadStats = useCallback(async (force = false) => {
    if (statsInFlightRef.current) return
    if (statsLoadedRef.current && !force) return
    statsInFlightRef.current = true

    try {
      setStatsLoading(true)
      const response: any = await apiService.getHarvestStats()
      const data = response.data || response || {}

      setStats({
        total: data.totalHarvests || 0,
        pending: data.pendingHarvests || 0,
        approved: data.approvedHarvests || 0,
        rejected: data.rejectedHarvests || 0,
        totalQuantity: data.totalQuantity || 0,
        totalValue: data.totalValue || 0,
      })
      statsLoadedRef.current = true
    } catch (error) {
      console.error("Failed to fetch harvest stats:", error)
      setStats((prev) =>
        statsLoadedRef.current
          ? prev
          : {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              totalQuantity: 0,
              totalValue: 0,
            }
      )
    } finally {
      setStatsLoading(false)
      statsInFlightRef.current = false
    }
  }, [])

  const loadHarvestsRef = useRef(loadHarvests)
  loadHarvestsRef.current = loadHarvests
  const loadStatsRef = useRef(loadStats)
  loadStatsRef.current = loadStats

  // Only re-fetch when filters change (not when unrelated state updates)
  useEffect(() => {
    void loadHarvestsRef.current()
  }, [filterKey])

  // Stats once on mount
  useEffect(() => {
    void loadStatsRef.current()
  }, [])




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
      await Promise.all([loadHarvests(), loadStats(true)])
      setShowDeleteDialog(false)
      setSelectedHarvest(null)
    } catch {
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
      setSelectedHarvests(filteredHarvests.map(h => h._id))
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
      setShowBulkDeleteDialog(false)
      setShowBulkActions(false)
      void loadHarvests()
      void loadStats(true)
    } catch {
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
    } catch {
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

  const handleDeleteRequest = useCallback((harvest: HarvestData) => {
    setSelectedHarvest(harvest)
    setShowDeleteDialog(true)
  }, [])

  const handleExportHarvest = useCallback(
    async (harvest: HarvestData) => {
      try {
        const { getExportService } = await import("@/lib/export-utils")
        const exportService = getExportService()
        const result = await exportService.exportCustomData(
          [
            {
              id: harvest._id || harvest.id,
              cropType: harvest.cropType,
              variety: harvest.variety,
              quantity: harvest.quantity,
              unit: harvest.unit,
              harvestDate: harvest.harvestDate,
              quality: harvest.quality,
              status: harvest.status,
              organic: harvest.organic ? "Yes" : "No",
              price: harvest.price || 0,
              location:
                typeof harvest.location === "string"
                  ? harvest.location
                  : `${harvest.location?.city || ""} ${harvest.location?.state || ""}`.trim(),
            },
          ],
          {
            format: "excel",
            filename: `grochain-harvest-${harvest._id || harvest.id}.xlsx`,
          }
        )
        if (!result.success) throw new Error(result.error)
        toast({
          title: "Export Started",
          description: "Harvest data has been downloaded",
        })
      } catch {
        toast({
          title: "Export Failed",
          description: "Failed to export harvest data",
          variant: "destructive",
        })
      }
    },
    [toast]
  )

  const filteredHarvests = harvests.filter(harvest => {
    const matchesSearch = harvest.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof harvest.location === 'string' ? harvest.location.toLowerCase() : `${harvest.location?.city || ''} ${harvest.location?.state || ''}`.toLowerCase()).includes(searchQuery.toLowerCase()) ||
      (harvest.variety && harvest.variety.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || harvest.status === statusFilter
    const matchesCrop = cropFilter === "all" || harvest.cropType === cropFilter

    return matchesSearch && matchesStatus && matchesCrop
  })

  const cropTypes = Array.from(new Set(harvests.map(h => h.cropType)))

  return (
    <DashboardLayout pageTitle="Harvest Management">
      <div className="space-y-6">
        <DashboardPageHeader
          badge="Harvest Tracking Active"
          title="Harvest"
          titleHighlight="Management"
          description="Track and manage your agricultural harvests for better yields and market access."
          actions={
            <>
              <Button
                variant="outline"
                size="lg"
                disabled={isRefreshing}
                onClick={async () => {
                  await Promise.all([loadHarvests(), loadStats(true)])
                }}
                className="group"
              >
                <RefreshCw className={`mr-2 h-4 w-4 transition-transform duration-500 group-hover:rotate-180 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button asChild size="lg">
                <Link href="/dashboard/harvests/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Log New Harvest
                </Link>
              </Button>
            </>
          }
        />

        {/* Stats Overview */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Total Harvests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stats.total}</div>
              )}
              <p className="text-xs text-muted-foreground truncate">All time harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-warning flex-shrink-0" />
                <span className="truncate">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stats.pending}</div>
              )}
              <p className="text-xs text-muted-foreground truncate">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                <span className="truncate">Approved</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stats.approved}</div>
              )}
              <p className="text-xs text-muted-foreground truncate">Verified harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
                <span className="truncate">Rejected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stats.rejected}</div>
              )}
              <p className="text-xs text-muted-foreground truncate">Rejected harvests</p>
            </CardContent>
          </Card>

          <Card className="border border-border h-full">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate">Total Value</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {statsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">₦{(stats.totalValue || 0).toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground truncate">Estimated value</p>
            </CardContent>
          </Card>
        </div>

        {/* Harvest Analytics */}
        <HarvestAnalytics />

        {/* Filters and Search */}
        <Card className="border border-border">
          <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
            <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
              <div className="xs:col-span-2 sm:col-span-2 md:col-span-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search by crop, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
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
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {cropTypes.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md h-8 sm:h-9">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none text-xs sm:text-sm h-full"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none text-xs sm:text-sm h-full"
                >
                  List
                </Button>
              </div>

              <Button
                variant={showBulkActions ? "default" : "outline"}
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm"
                onClick={() => {
                  setShowBulkActions(!showBulkActions)
                  setSelectedHarvests([])
                }}
              >
                {showBulkActions ? "Cancel" : "Select"}
              </Button>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-5">
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={organicFilter} onValueChange={setOrganicFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Organic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Organic &amp; Non-organic</SelectItem>
                  <SelectItem value="true">Organic Only</SelectItem>
                  <SelectItem value="false">Non-organic Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateRange.from ? dateRange.from.toISOString().split("T")[0] : ""}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                aria-label="From date"
              />

              <Input
                type="date"
                value={dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                aria-label="To date"
              />
            </div>

            {showBulkActions && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/10 bg-primary/10 p-2 sm:p-3">
                <Checkbox
                  checked={filteredHarvests.length > 0 && selectedHarvests.length === filteredHarvests.length}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  aria-label="Select all harvests"
                />
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {selectedHarvests.length > 0
                    ? `${selectedHarvests.length} selected`
                    : "Select all"}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs sm:h-8 sm:text-sm"
                    disabled={selectedHarvests.length === 0}
                    onClick={handleBulkExport}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs sm:h-8 sm:text-sm"
                    disabled={selectedHarvests.length === 0}
                    onClick={() => setShowBulkDeleteDialog(true)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Harvests Display */}
        <Tabs defaultValue="all" className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-8 sm:h-9">
            <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">All ({stats.total})</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Pending ({stats.pending})</span>
              <span className="sm:hidden">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Approved ({stats.approved})</span>
              <span className="sm:hidden">Approved</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Rejected ({stats.rejected})</span>
              <span className="sm:hidden">Rejected</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 sm:space-y-4">
            {isInitialLoading && harvests.length === 0 ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border border-border h-full">
                    <div className="h-32 sm:h-40 bg-muted rounded-t-lg"></div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-3"></div>
                      <div className="h-6 sm:h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredHarvests.length > 0 ? (
              <div className="relative">
                {isRefreshing && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    Updating harvests…
                  </div>
                )}
                <div className={viewMode === "grid" ? "grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
                  {filteredHarvests.map((harvest) => (
                    <FarmerHarvestListingCard
                      key={harvest.id}
                      harvest={harvest}
                      variant={viewMode === "list" ? "detailed" : "default"}
                      onDeleteRequest={handleDeleteRequest}
                      onExportHarvest={handleExportHarvest}
                      selectable={showBulkActions}
                      selected={selectedHarvests.includes(harvest._id)}
                      onSelectChange={(checked) => handleSelectHarvest(harvest._id, checked)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="text-center py-6 sm:py-8 border border-border">
                <div className="text-muted-foreground mb-3 sm:mb-4">
                  <Leaf className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-2">No harvests found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {searchQuery || statusFilter !== "all" || cropFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start by logging your first harvest to track your agricultural progress"}
                </p>
                {!searchQuery && statusFilter === "all" && cropFilter === "all" && (
                  <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link href="/dashboard/harvests/new">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
                <FarmerHarvestListingCard
                  key={harvest._id}
                  harvest={harvest}
                  onDeleteRequest={handleDeleteRequest}
                  onExportHarvest={handleExportHarvest}
                  selectable={showBulkActions}
                  selected={selectedHarvests.includes(harvest._id)}
                  onSelectChange={(checked) => handleSelectHarvest(harvest._id, checked)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHarvests.filter(h => h.status === "approved").map((harvest) => (
                <FarmerHarvestListingCard
                  key={harvest._id}
                  harvest={harvest}
                  onDeleteRequest={handleDeleteRequest}
                  onExportHarvest={handleExportHarvest}
                  selectable={showBulkActions}
                  selected={selectedHarvests.includes(harvest._id)}
                  onSelectChange={(checked) => handleSelectHarvest(harvest._id, checked)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHarvests.filter(h => h.status === "rejected").map((harvest) => (
                <FarmerHarvestListingCard
                  key={harvest._id}
                  harvest={harvest}
                  onDeleteRequest={handleDeleteRequest}
                  onExportHarvest={handleExportHarvest}
                  selectable={showBulkActions}
                  selected={selectedHarvests.includes(harvest._id)}
                  onSelectChange={(checked) => handleSelectHarvest(harvest._id, checked)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions & Help */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border">
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
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/qr-codes/generate">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Codes
                </Link>
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
                  } catch {
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

          <Card className="border border-border">
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedHarvests.length} Harvest{selectedHarvests.length > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedHarvests.length} selected harvest{selectedHarvests.length > 1 ? "s" : ""}? This action cannot be undone and will remove all associated data including QR codes and marketplace listings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${selectedHarvests.length} Harvest${selectedHarvests.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}



