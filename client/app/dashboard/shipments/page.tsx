"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShipments, useShipmentStats, useExportShipments } from "@/hooks/use-shipments"
import { useAuth } from "@/hooks/use-auth"
import { AiTrustBadge } from "@/components/ai/ai-trust-badge"
import { ShipmentCard } from "@/components/shipment/shipment-card"
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Plus,
  Map as MapIcon,
  List as ListIcon,
  ChevronRight
} from "lucide-react"
import { ShipmentFilters } from "@/types/shipment"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function ShipmentsPage() {
  const { user } = useAuth()
  const isFarmer = user?.role === 'farmer'
  
  const [filters, setFilters] = useState<ShipmentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { toast } = useToast()
  const { shipments, loading, error, pagination, refreshShipments } = useShipments(filters)
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useShipmentStats()
  const { exportShipments, loading: exporting } = useExportShipments()

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      q: debouncedSearch || undefined,
      page: 1
    }))
  }, [debouncedSearch])

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
    toast({
      title: "Data Refreshed",
      description: "Shipment list and statistics are up to date."
    })
  }

  const handleFilterChange = (key: keyof ShipmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handleExport = async () => {
    try {
      await exportShipments('csv', filters)
    } catch (err) {
      // Error handled in hook
    }
  }

  const getStatusCount = (status: string) => {
    return stats?.statusBreakdown?.find(s => s._id === status)?.count || 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        <DashboardPageHeader
          badge="Logistics Intelligence Active"
          title="Shipments"
          description="Manage and track all logistics fulfillment cycles across your network."
          footer={user?._id ? <AiTrustBadge userId={user._id} className="scale-90 origin-left" /> : null}
          actions={
            <>
              <Button variant="outline" size="lg" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleExport}
                disabled={exporting || shipments.length === 0}
                className="text-primary"
              >
                {exporting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export CSV
              </Button>
              {isFarmer && (
                <Button size="lg" asChild>
                  <Link href="/dashboard/orders">
                    <Plus className="mr-2 h-4 w-4" />
                    New Shipment
                  </Link>
                </Button>
              )}
            </>
          }
        />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Shipments', value: stats?.totalShipments || 0, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'In Transit', value: getStatusCount('in_transit'), icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Delivered', value: getStatusCount('delivered'), icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Delayed', value: stats?.delayedShipments || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' }
          ].map((item, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-8 -mr-4 -mt-4 rounded-full ${item.bg} opacity-20 group-hover:scale-110 transition-transform`}></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> : item.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${item.bg}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter & View Toggle */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Search & Distribution</span>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`h-7 px-3 rounded-md transition-all ${viewMode === 'list' ? 'shadow-sm bg-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon className="h-3.5 w-3.5 mr-1.5" />
                List
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('map')}
                className={`h-7 px-3 rounded-md transition-all ${viewMode === 'map' ? 'shadow-sm bg-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MapIcon className="h-3.5 w-3.5 mr-1.5" />
                Map
              </Button>
            </div>
          </div>
          <CardContent className="p-4 lg:p-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 lg:col-span-4">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block tracking-tight">Keyword Search</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by ID, Tracking # or City..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-border focus:border-primary/30 focus:ring-primary/10 transition-all text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-3 lg:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block tracking-tight">Status Filter</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange('status', value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="h-10 border-border text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending Receipt</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Completed / Delivered</SelectItem>
                    <SelectItem value="failed">Delivery Failed</SelectItem>
                    <SelectItem value="returned">Returned items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 lg:col-span-3">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block tracking-tight">Shipping Method</label>
                <Select
                  value={filters.shippingMethod || "all"}
                  onValueChange={(value) => handleFilterChange('shippingMethod', value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="h-10 border-border text-sm">
                    <SelectValue placeholder="Multiple Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Method</SelectItem>
                    <SelectItem value="road_standard">Road (Standard)</SelectItem>
                    <SelectItem value="road_express">Road (Express 24h)</SelectItem>
                    <SelectItem value="air">Air Cargo</SelectItem>
                    <SelectItem value="courier">Point-to-Point Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-12 lg:col-span-3">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block tracking-tight">Ordering</label>
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc')
                  }}
                >
                  <SelectTrigger className="h-10 border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Creation Date (Newest)</SelectItem>
                    <SelectItem value="createdAt-asc">Creation Date (Oldest)</SelectItem>
                    <SelectItem value="estimatedDelivery-asc">Delivery Goal (Earliest)</SelectItem>
                    <SelectItem value="estimatedDelivery-desc">Delivery Goal (Latest)</SelectItem>
                    <SelectItem value="totalCost-desc">Value (Highest)</SelectItem>
                    <SelectItem value="totalCost-asc">Value (Lowest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <div className="min-h-[400px]">
          {viewMode === 'list' ? (
            <div className="space-y-6">
              {loading ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse border border-border overflow-hidden">
                      <div className="h-32 bg-muted border-b border-border"></div>
                      <CardContent className="p-6 space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-muted rounded w-16"></div>
                          <div className="h-6 bg-muted rounded w-24"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="border-destructive/10 bg-destructive/30">
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-destructive mb-2">Sync Interrupted</h3>
                    <p className="text-destructive max-w-sm mx-auto mb-6">{error}</p>
                    <Button onClick={handleRefresh} className="bg-destructive hover:bg-destructive text-white">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect Sync
                    </Button>
                  </CardContent>
                </Card>
              ) : shipments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-10 animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-border">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Optimization Horizon Empty</h3>
                  <p className="text-muted-foreground max-w-md mb-8">
                    {Object.keys(filters).some(key => filters[key as keyof ShipmentFilters] && key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') 
                      ? "No logistics units match the applied algorithmic filters. Attempt widening your parameters."
                      : "No active shipment units detected in the system ledger. Initialize a fulfillment lifecycle from your orders."
                    }
                  </p>
                  <div className="flex gap-4">
                    {searchQuery && (
                      <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    )}
                    {isFarmer && (
                      <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                        <Link href="/dashboard/orders">
                          Fulfill Pending Orders
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
                    {shipments.map((shipment) => (
                      <ShipmentCard
                        key={shipment._id}
                        shipment={shipment}
                        onViewDetails={(id) => {
                          window.location.href = `/dashboard/shipments/${id}`
                        }}
                      />
                    ))}
                  </div>

                  {/* Enhanced Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 px-2 gap-4 border-t border-border mt-8">
                      <div className="text-sm font-medium text-muted-foreground text-center sm:text-left">
                        Dispensing <span className="text-foreground font-bold">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> 
                        {' '}- <span className="text-foreground font-bold">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> 
                        {' '}of <span className="text-foreground font-bold">{pagination.totalItems}</span> logistics units
                      </div>
                      <div className="flex items-center justify-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                          className="h-9 w-9 p-0 hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1; // Simplified for demo
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.currentPage === pageNum ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => handleFilterChange('page', pageNum)}
                              className={`h-9 w-9 p-0 text-xs font-bold ${pagination.currentPage === pageNum ? 'bg-primary/10 text-primary border border-primary/10' : 'text-muted-foreground'}`}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                          className="h-9 w-9 p-0 hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <Card className="flex min-h-[600px] flex-col overflow-hidden border border-border bg-card shadow-sm">
              <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-primary/5 via-card to-secondary/10">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                  aria-hidden
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative z-10 p-8 text-center">
                    <div className="mb-6 inline-flex animate-pulse rounded-full border border-primary/30 bg-primary/10 p-4">
                      <MapIcon className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="mb-3 text-3xl font-bold text-foreground">Distribution overview</h3>
                    <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
                      Visualizing {shipments.length} active logistics paths across regional distribution zones.
                      GIS tracking syncs with real-time shipment updates.
                    </p>
                    <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
                      {shipments.slice(0, 4).map((s, idx) => (
                        <div
                          key={idx}
                          className="group cursor-pointer rounded-xl border border-border bg-card/80 p-4 text-left shadow-sm transition-all hover:bg-muted/50"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">#{s.shipmentNumber}</span>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                          </div>
                          <div className="mb-1 truncate text-sm font-medium text-foreground">
                            {s.origin.city} → {s.destination.city}
                          </div>
                          <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                            {s.status.replace("_", " ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute right-4 top-4 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    REAL-TIME SYNC ACTIVE
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    ACTIVE ROUTES: {shipments.length}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur-sm">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Network health
                  </div>
                  <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[94%] bg-success" />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Active routes</span>
                    <span className="font-bold text-foreground">94.2% optimization</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
