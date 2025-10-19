"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useReferrals } from "@/hooks/use-referrals"
import { useAuthStore } from "@/lib/auth"
import { ReferralDialog } from "@/components/dialogs/referral-dialog"
import { ReferralStatusDialog } from "@/components/dialogs/referral-status-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  TrendingUp, 
  Target, 
  Download,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReferralsContent() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<any>(null)

  // Backend integration hooks
  const {
    referrals,
    stats,
    isLoading,
    isRefreshing,
    refreshData,
    createReferral,
    updateReferral,
    deleteReferral,
    updateFilters,
    getReferralStatusColor,
    getReferralStatusIcon,
    formatCurrency,
    formatDate
  } = useReferrals()

  const { user } = useAuthStore()
  const { toast } = useToast()

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update filters when status changes
  useEffect(() => {
    if (mounted) {
      updateFilters({
        status: statusFilter === "all" ? undefined : statusFilter
      })
    }
  }, [statusFilter, updateFilters, mounted])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading referrals...</p>
        </div>
      </div>
    )
  }

  // Filter referrals with null safety and search
  const filteredReferrals = referrals.filter((referral: any) => {
    const farmerName = referral.farmer?.name || ''
    const farmerEmail = referral.farmer?.email || ''
    
    const matchesSearch = farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Event handlers
  const handleCreateReferral = () => {
    setShowCreateDialog(true)
  }

  const handleUpdateStatus = (referral: any) => {
    setSelectedReferral(referral)
    setShowStatusDialog(true)
  }

  const handleDeleteReferral = async (referral: any) => {
    const farmerName = referral.farmer?.name || 'Unknown Farmer'
    if (window.confirm(`Are you sure you want to delete the referral for ${farmerName}?`)) {
      try {
        await deleteReferral(referral._id)
        toast({
          title: "Referral deleted",
          description: "Referral has been removed successfully",
        })
      } catch (error: any) {
        toast({
          title: "Deletion failed",
          description: error.message || "Failed to delete referral",
          variant: "destructive"
        })
      }
    }
  }

  const handleExport = async () => {
    try {
      if (filteredReferrals.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no referrals to export",
          variant: "destructive"
        })
        return
      }

      // Export referrals as CSV
      const csvData = filteredReferrals.map((referral: any) => ({
        'Farmer Name': referral.farmer?.name || 'Unknown',
        'Email': referral.farmer?.email || 'No email',
        'Phone': referral.farmer?.phone || 'No phone',
        'Status': referral.status,
        'Commission Rate': `${(referral.commissionRate * 100).toFixed(1)}%`,
        'Commission': referral.commission ? formatCurrency(referral.commission) : 'N/A',
        'Created Date': formatDate(referral.createdAt),
        'Notes': referral.notes || ''
      }))
      
      // Create CSV content
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Exported ${filteredReferrals.length} referrals`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export failed",
        description: "Failed to export referrals. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = () => {
    refreshData()
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Referral Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage farmer referrals and track performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-gray-200">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="border border-gray-200">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Referral Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage farmer referrals and track performance
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={filteredReferrals.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleCreateReferral}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Referral
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stats?.totalReferrals || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats?.monthlyGrowth || 0}% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stats?.activeReferrals || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Currently active</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stats?.conversionRate || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Success rate</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    +{stats?.monthlyGrowth || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">New referrals this month</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>Find specific referrals or filter by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by farmer name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Referrals List */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Referral Details</CardTitle>
                <CardDescription>View and manage your farmer referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || statusFilter !== "all" 
                        ? "No referrals match your current filters." 
                        : "You haven't created any referrals yet."}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button onClick={handleCreateReferral} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Referral
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReferrals.map((referral: any) => (
                      <div
                        key={referral._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4 sm:gap-2"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {referral.farmer?.name || 'Unknown Farmer'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {referral.farmer?.email || 'No email'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Referred on {formatDate(referral.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`${getReferralStatusColor(referral.status)} text-xs sm:text-sm`}
                          >
                            {getReferralStatusIcon(referral.status)} {referral.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(referral)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteReferral(referral)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                <CardDescription>Track your referral performance over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Referrals</span>
                    <span className="font-bold">{stats?.totalReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="font-bold text-yellow-600">{stats?.pendingReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active</span>
                    <span className="font-bold text-blue-600">{stats?.activeReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="font-bold text-green-600">{stats?.completedReferrals || 0}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="font-bold text-green-600">{stats?.conversionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Monthly Growth</span>
                      <span className="font-bold text-blue-600">+{stats?.monthlyGrowth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Commission</span>
                      <span className="font-bold">{formatCurrency(stats?.averageCommission || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ReferralDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateSuccess={() => {
          setShowCreateDialog(false)
          refreshData()
        }}
      />

      <ReferralStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        referral={selectedReferral}
        onUpdateSuccess={() => {
          setShowStatusDialog(false)
          setSelectedReferral(null)
          refreshData()
        }}
      />
    </DashboardLayout>
  )
}
