"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useCommission } from "@/hooks/use-commission"
import { useToast } from "@/hooks/use-toast"
import { useExportService } from "@/lib/export-utils"
import { 
  Banknote, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  BarChart3,
  Wallet,
  RefreshCw,
  Search,
  MoreHorizontal,
  Eye
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CommissionDetailsDialog } from "@/components/dialogs/commission-details-dialog"
import { CommissionPayoutDialog } from "@/components/dialogs/commission-payout-dialog"

interface Commission {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
  }
  order: {
    _id: string
    orderNumber: string
    total: number
    status: string
  }
  listing: {
    _id: string
    cropName: string
    price: number
  }
  amount: number
  rate: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  orderAmount: number
  orderDate: Date
  paidAt?: Date
  withdrawalId?: string
  notes?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

interface CommissionSummary {
  totalEarned: number
  commissionRate: number
  pendingAmount: number
  paidAmount: number
  lastPayout?: Date
  monthlyEarnings: number[]
  totalTransactions: number
  averageCommission: number
}

export default function CommissionsPage() {
  const {
    commissions,
    summary,
    stats,
    isLoading,
    isRefreshing,
    refreshData,
    updateCommissionStatus,
    pendingCommissions,
    paidCommissions,
    totalPendingAmount
  } = useCommission()

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const { toast } = useToast()
  const exportService = useExportService()

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Filter commissions based on search and filters
  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.listing?.cropName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "paid":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleRequestPayout = () => {
    if (totalPendingAmount === 0) {
      toast({
        title: "No pending commissions",
        description: "You have no pending commissions to withdraw",
        variant: "destructive",
      })
      return
    }
    setShowPayoutDialog(true)
  }

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission)
    setShowDetailsDialog(true)
  }

  const handleUpdateStatus = async (commissionId: string, newStatus: string) => {
    try {
      await updateCommissionStatus(commissionId, { status: newStatus })
      toast({
        title: "Status updated",
        description: `Commission status updated to ${newStatus}`,
      })
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update commission status",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      await exportCommissions()
      toast({
        title: "Export successful",
        description: "Commission data has been exported",
      })
    } catch (error: unknown) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export commissions",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    refreshData()
  }

  const exportCommissions = async () => {
    await exportService.exportCustomData(commissions, {
      format: 'csv',
      dataType: 'commissions',
      filename: `commissions-report-${new Date().toISOString().split('T')[0]}.csv`
    })
  }


  return (
    <DashboardLayout pageTitle="Commission Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Commission Management</h1>
            <p className="text-muted-foreground">Track your earnings and manage payouts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCommissions}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handleRequestPayout} disabled={totalPendingAmount === 0}>
              <Wallet className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </div>

        {/* Stats Cards - Real Data Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earned</CardTitle>
              <Banknote className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₦{(summary?.summary?.totalAmount || stats?.totalAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₦{(totalPendingAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting payout
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commission Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">2.0%</div>
              <p className="text-xs text-gray-500 mt-1">
                Standard rate
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats?.totalCommissions || commissions?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Commission transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>Find specific commissions or filter by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by farmer name, order number, or crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="w-full sm:w-auto">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Overview */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Commission Overview</CardTitle>
            <CardDescription>Your earnings breakdown and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Earnings Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Total Earned</span>
                    <span className="font-semibold text-gray-900">₦{(summary?.summary?.totalAmount || stats?.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Paid Out</span>
                    <span className="font-semibold text-gray-900">₦{(summary?.summary?.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">₦{(summary?.summary?.pendingAmount || totalPendingAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Average Commission</span>
                    <span className="font-semibold text-gray-900">₦{(stats?.averageCommission || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Monthly Performance</h3>
                <div className="space-y-3">
                  {stats?.monthlyBreakdown && stats.monthlyBreakdown.length > 0 ? (
                    stats.monthlyBreakdown.slice(0, 6).map((month, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {new Date(month._id.year, month._id.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                          <span className="font-medium text-gray-900">₦{month.totalAmount.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(month.totalAmount / (stats.totalAmount || 1)) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No monthly data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Tabs */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Commission Details</CardTitle>
            <CardDescription>View and manage your commission transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
                <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  {(filteredCommissions || []).slice(0, 10).map((commission) => (
                    <div key={commission._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4 sm:gap-2">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Banknote className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-gray-600 truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.listing?.cropName || 'Unknown Crop'} • {new Date(commission.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {(commission.rate * 100).toFixed(1)}% commission
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(commission.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(commission)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {commission.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(commission._id, 'approved')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {commission.status === 'approved' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(commission._id, 'paid')}>
                                  <Banknote className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredCommissions.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <Banknote className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm || statusFilter !== "all" 
                          ? "No commissions match your current filters." 
                          : "You haven't earned any commissions yet."}
                      </p>
                      {(searchTerm || statusFilter !== "all") && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                          }}
                          className="text-sm"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-4">
                  {(pendingCommissions || []).map((commission) => (
                    <div key={commission._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors gap-4 sm:gap-2">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-gray-600 truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.listing?.cropName || 'Unknown Crop'} • {new Date(commission.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {(commission.rate * 100).toFixed(1)}% commission
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStatus(commission._id, 'approved')}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            Approve
                          </Button>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(commission)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(commission._id, 'cancelled')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {pendingCommissions.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending commissions</h3>
                      <p className="text-sm text-gray-500">All your commissions have been processed</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                  {(paidCommissions || []).map((commission) => (
                    <div key={commission._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors gap-4 sm:gap-2">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-gray-600 truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.listing?.cropName || 'Unknown Crop'} • Paid on {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {(commission.rate * 100).toFixed(1)}% commission
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(commission)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('Download receipt')}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {paidCommissions.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <Banknote className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
                      <p className="text-sm text-gray-500">Your commission payments will appear here</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common commission management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={handleRequestPayout}>
                <Wallet className="h-6 w-6" />
                <span>Request Payout</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={exportCommissions}>
                <Download className="h-6 w-6" />
                <span>Export Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={refreshData} disabled={isRefreshing}>
                <RefreshCw className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CommissionDetailsDialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open)
            if (!open) {
              setSelectedCommission(null)
            }
          }}
          commission={selectedCommission}
        />

        <CommissionPayoutDialog
          open={showPayoutDialog}
          onOpenChange={(open) => {
            setShowPayoutDialog(open)
          }}
          pendingCommissions={pendingCommissions}
          totalAmount={totalPendingAmount}
        />
      </div>
    </DashboardLayout>
  )
}
