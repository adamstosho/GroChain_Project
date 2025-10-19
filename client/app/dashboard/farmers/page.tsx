"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useFarmers } from "@/hooks/use-farmers"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Upload
} from "lucide-react"
import Link from "next/link"

interface Farmer {
  _id: string
  name: string
  email: string
  phone: string
  location: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  joinedDate: string
  totalHarvests?: number
  totalSales?: number
}

export default function FarmersPage() {
  const {
    farmers,
    filteredFarmers,
    isLoading,
    filters,
    pagination,
    stats,
    updateFilters,
    addFarmer,
    updateFarmer,
    deleteFarmer,
    refreshData,
    exportFarmers,
    activeFarmers,
    inactiveFarmers,
    suspendedFarmers,
    totalFarmers,
    totalActiveFarmers
  } = useFarmers()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Update filters when local state changes
    try {
      updateFilters({
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        location: locationFilter !== 'all' ? locationFilter : undefined
      })
      setHasError(false)
    } catch (error) {
      console.error('Error updating filters:', error)
      setHasError(true)
      toast({
        title: "Error updating filters",
        description: "Failed to update search filters. Please try again.",
        variant: "destructive"
      })
    }
  }, [searchTerm, statusFilter, locationFilter, updateFilters, toast])

  // Functions now handled by the useFarmers hook

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs"><CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />Active</Badge>
      case "inactive":
        return <Badge variant="secondary" className="text-xs"><AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive" className="text-xs"><XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />Suspended</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  // Use backend pagination - farmers are already paginated
  const paginatedFarmers = filteredFarmers

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Farmers Management">
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Farmers Management</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your partner farmers</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-1 sm:pb-2">
                  <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                  <div className="h-6 sm:h-8 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3">
                  <div className="h-4 sm:h-6 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (hasError) {
    return (
      <DashboardLayout pageTitle="Farmers Management">
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Farmers Management</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your partner farmers</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Error Loading Farmers</h3>
              <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
                We encountered an error while loading your farmers data. Please try refreshing the page.
              </p>
              <Button 
                onClick={() => {
                  setHasError(false)
                  window.location.reload()
                }}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                <span>Retry</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Farmers Management">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Farmers Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your partner farmers and track their performance</p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full xs:w-auto">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Exp</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => exportFarmers('csv')}
                  className="cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportFarmers('excel')}
                  className="cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full xs:w-auto">
              <Link href="/dashboard/farmers/bulk">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Bulk</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full xs:w-auto">
              <Link href="/dashboard/farmers/add">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Farmer</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2 min-w-0 flex-1">Total Farmers</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.totalFarmers}</div>
              <p className="text-xs text-muted-foreground">
                Real data from database
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2 min-w-0 flex-1">Active Farmers</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.activeFarmers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stats.totalFarmers > 0 ? Math.round((stats.activeFarmers / stats.totalFarmers) * 100) : 0}%</span> active rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2 min-w-0 flex-1">Inactive Farmers</CardTitle>
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.inactiveFarmers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-600">{stats.totalFarmers > 0 ? Math.round((stats.inactiveFarmers / stats.totalFarmers) * 100) : 0}%</span> of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2 min-w-0 flex-1">Suspended Farmers</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.suspendedFarmers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">{stats.totalFarmers > 0 ? Math.round((stats.suspendedFarmers / stats.totalFarmers) * 100) : 0}%</span> of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg truncate">Search & Filters</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate">Find specific farmers or filter by criteria</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
              <div className="relative xs:col-span-2 lg:col-span-1">
                <Search className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Abuja">Abuja</SelectItem>
                  <SelectItem value="Kano">Kano</SelectItem>
                  <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                  <SelectItem value="Ibadan">Ibadan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Farmers List */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg truncate">Farmers List</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate">
              Showing {paginatedFarmers.length} of {pagination.totalItems} farmers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {paginatedFarmers.length > 0 ? (
                paginatedFarmers.map((farmer) => (
                  <div key={farmer._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 lg:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-3 lg:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${farmer.name}`} />
                        <AvatarFallback className="text-xs sm:text-sm">{farmer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 sm:space-x-2">
                          <p className="font-medium text-xs sm:text-sm lg:text-base truncate">{farmer.name}</p>
                          {getStatusBadge(farmer.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1 min-w-0">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate text-xs">{farmer.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 min-w-0">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate text-xs">{farmer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate text-xs">{farmer.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 lg:gap-4 text-xs text-muted-foreground">
                          <span>Joined: {farmer.joinedDate ? new Date(farmer.joinedDate).toLocaleDateString() : 'N/A'}</span>
                          {farmer.totalHarvests !== undefined && (
                            <>
                              <span>Harvests: {farmer.totalHarvests}</span>
                              <span>Sales: ₦{farmer.totalSales?.toLocaleString() || '0'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 sm:h-8 sm:w-8 lg:h-9 lg:w-auto lg:p-2">
                        <Link href={`/dashboard/farmers/${farmer._id}`}>
                          <span className="hidden lg:inline">View Details</span>
                          <span className="lg:hidden">👁️</span>
                        </Link>
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 sm:h-8 sm:w-8">
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-[400px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Farmer Actions</DialogTitle>
                            <DialogDescription className="text-sm">Choose an action for {farmer.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Send Message
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              View Performance
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Schedule Training
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : null}
              
              {paginatedFarmers.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">No farmers found</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3 sm:gap-0 mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground text-center xs:text-left">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </p>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: pagination.currentPage - 1 })}
                    disabled={pagination.currentPage === 1}
                    className="h-7 sm:h-8 w-16 sm:w-auto text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">←</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: pagination.currentPage + 1 })}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="h-7 sm:h-8 w-16 sm:w-auto text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">→</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}