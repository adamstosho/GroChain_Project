"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShipments, useShipmentStats } from "@/hooks/use-shipments"
import { ShipmentCard } from "@/components/shipment/shipment-card"
import { 
  Package, 
  Search, 
  Filter, 
  Plus,
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { ShipmentFilters } from "@/types/shipment"
import Link from "next/link"

export default function ShipmentsPage() {
  const [filters, setFilters] = useState<ShipmentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { toast } = useToast()
  const { shipments, loading, error, pagination, refreshShipments } = useShipments(filters)
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useShipmentStats()

  // Refresh stats when shipments change
  useEffect(() => {
    if (shipments.length > 0) {
      refreshStats()
    }
  }, [shipments.length, refreshStats])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      refreshShipments(),
      refreshStats()
    ])
    setIsRefreshing(false)
  }

  const handleFilterChange = (key: keyof ShipmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Implement search functionality if needed
  }

  const getStatusCount = (status: string) => {
    return stats?.statusBreakdown?.find(s => s._id === status)?.count || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_transit': return 'bg-purple-100 text-purple-800'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Shipments</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track all shipments
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full xs:w-auto"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button asChild size="sm" className="w-full xs:w-auto">
              <Link href="/dashboard/shipments/create">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Create Shipment</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200 h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded"></div>
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-2"></div>
                      <div className="h-5 sm:h-6 bg-gray-200 rounded w-8 sm:w-12"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : statsError ? (
          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">Error Loading Stats</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{statsError}</p>
              <Button onClick={refreshStats} size="sm" className="w-full sm:w-auto">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : stats ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Card className="border border-gray-200 h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Shipments</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{stats.totalShipments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Delivered</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{getStatusCount('delivered')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">In Transit</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{getStatusCount('in_transit')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Delayed</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{stats.delayedShipments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">No Stats Available</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Unable to load shipment statistics</p>
              <Button onClick={refreshStats} size="sm" className="w-full sm:w-auto">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Refresh Stats
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
              <div className="xs:col-span-2 sm:col-span-2 md:col-span-1 space-y-2">
                <label className="text-xs sm:text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search shipments..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange('status', value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Shipping Method</label>
                <Select
                  value={filters.shippingMethod || "all"}
                  onValueChange={(value) => handleFilterChange('shippingMethod', value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="sea">Sea</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Sort By</label>
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc')
                  }}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="estimatedDelivery-asc">Delivery Date (Earliest)</SelectItem>
                    <SelectItem value="estimatedDelivery-desc">Delivery Date (Latest)</SelectItem>
                    <SelectItem value="totalCost-desc">Cost (Highest)</SelectItem>
                    <SelectItem value="totalCost-asc">Cost (Lowest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border border-gray-200 h-full">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border border-gray-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">Error Loading Shipments</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{error}</p>
                <Button onClick={handleRefresh} size="sm" className="w-full sm:w-auto">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : shipments.length === 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">No Shipments Found</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {Object.keys(filters).some(key => filters[key as keyof ShipmentFilters]) 
                    ? "No shipments match your current filters."
                    : "You haven't created any shipments yet."
                  }
                </p>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href="/dashboard/shipments/create">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Create Your First Shipment
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
                {shipments.map((shipment) => (
                  <ShipmentCard
                    key={shipment._id}
                    shipment={shipment}
                    onViewDetails={(id) => {
                      // Navigate to shipment details
                      window.location.href = `/dashboard/shipments/${id}`
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} shipments
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    <span className="text-xs sm:text-sm text-gray-700 px-2">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
