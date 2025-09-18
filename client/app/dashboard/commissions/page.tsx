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
  Filter,
  Calendar,
  BarChart3,
  Wallet,
  RefreshCw,
  Search,
  MoreHorizontal,
  Eye,
  Edit
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
  metadata?: any
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
    processPayout,
    updateCommissionStatus,
    pendingCommissions,
    approvedCommissions,
    paidCommissions,
    totalPendingAmount,
    totalPaidAmount,
    updateFilters
  } = useCommission()

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<any>(null)
  const { toast } = useToast()
  const exportService = useExportService()

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

  const handleViewDetails = (commission: any) => {
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
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update commission status",
        variant: "destructive",
      })
    }
  }

  const exportCommissions = async () => {
    await exportService.exportCustomData(commissions, {
      format: 'csv',
      dataType: 'commissions',
      filename: `commissions-report-${new Date().toISOString().split('T')[0]}.csv`
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Commission Management">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Commission Management</h1>
              <p className="text-muted-foreground">Track your earnings and manage payouts</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(summary?.summary.totalAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Real data from database
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalPendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.0%</div>
              <p className="text-xs text-muted-foreground">
                Standard commission rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCommissions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total commission transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>Find specific commissions or filter by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by farmer name, order number, or crop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[140px]">
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
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Overview</CardTitle>
            <CardDescription>Your earnings breakdown and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Earnings Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Earned</span>
                    <span className="font-medium">₦{(summary?.summary.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paid Out</span>
                    <span className="font-medium">₦{(summary?.summary.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-medium text-yellow-600">₦{(summary?.summary.pendingAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Commission</span>
                    <span className="font-medium">₦{(stats?.averageCommission || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Last payout information removed - not available in current data structure */}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Monthly Performance</h3>
                <div className="space-y-3">
                  {stats?.monthlyBreakdown && stats.monthlyBreakdown.length > 0 ? (
                    stats.monthlyBreakdown.slice(0, 6).map((month, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{new Date(month._id.year, month._id.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span>₦{month.totalAmount.toLocaleString()}</span>
                        </div>
                        <Progress value={(month.totalAmount / (stats.totalAmount || 1)) * 100} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No monthly data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Details</CardTitle>
            <CardDescription>View and manage your commission transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  {filteredCommissions.slice(0, 10).map((commission) => (
                    <div key={commission._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {commission.listing?.cropName || 'Unknown Crop'} • {new Date(commission.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
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
                    <div className="text-center py-8">
                      <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No commissions found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-4">
                  {pendingCommissions.map((commission) => (
                    <div key={commission._id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {commission.listing?.cropName || 'Unknown Crop'} • {new Date(commission.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-medium">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {(commission.rate * 100).toFixed(1)}% commission
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(commission._id, 'approved')}
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
                  ))}
                  
                  {pendingCommissions.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending commissions</p>
                      <p className="text-sm text-muted-foreground">All your commissions have been processed</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                  {paidCommissions.map((commission) => (
                    <div key={commission._id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{commission.farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'} • ₦{commission.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {commission.listing?.cropName || 'Unknown Crop'} • Paid on {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-medium">₦{commission.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
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
                    <div className="text-center py-8">
                      <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No payment history</p>
                      <p className="text-sm text-muted-foreground">Your commission payments will appear here</p>
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
