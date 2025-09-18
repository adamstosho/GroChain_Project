"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useReferrals } from "@/hooks/use-referrals"
import { useExportService } from "@/lib/export-utils"
import { useAuthStore } from "@/lib/auth"
import { ReferralDialog } from "@/components/dialogs/referral-dialog"
import { ReferralStatusDialog } from "@/components/dialogs/referral-status-dialog"
import { 
  Users, 
  TrendingUp, 
  UserPlus, 
  Target, 
  Download,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ReferralsPage() {
  const {
    referrals,
    stats,
    isLoading,
    isRefreshing,
    refreshData,
    createReferral,
    updateReferral,
    deleteReferral,
    pendingReferrals,
    activeReferrals,
    completedReferrals,
    updateFilters
  } = useReferrals()

  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const exportService = useExportService()

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         referral.farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateReferral = () => {
    setShowCreateDialog(true)
  }

  const handleEditReferral = (referral: any) => {
    setSelectedReferral(referral)
    setShowCreateDialog(true)
  }

  const handleUpdateStatus = (referral: any) => {
    setSelectedReferral(referral)
    setShowStatusDialog(true)
  }

  const handleDeleteReferral = async (referral: any) => {
    if (window.confirm(`Are you sure you want to delete the referral for ${referral.farmer.name}?`)) {
      try {
        await deleteReferral(referral._id)
      } catch (error) {
        console.error("Failed to delete referral:", error)
      }
    }
  }

  const handleExportReferrals = async () => {
    await exportService.exportCustomData(referrals, {
      format: 'csv',
      dataType: 'referrals',
      filename: `referrals-report-${new Date().toISOString().split('T')[0]}.csv`
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Referral Management">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Referral Management</h1>
              <p className="text-muted-foreground">Manage farmer referrals and track performance</p>
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
    <DashboardLayout pageTitle="Referral Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Referral Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">Manage farmer referrals and track performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportReferrals} className="md:size-default">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" onClick={handleCreateReferral} className="md:size-default">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Referral</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeReferrals || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Success rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats?.monthlyGrowth || 0}</div>
              <p className="text-xs text-muted-foreground">
                New referrals this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>Find specific referrals or filter by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by farmer name or email..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="md:size-default">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
            <CardDescription>View and manage your farmer referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
                <TabsTrigger value="active" className="text-xs md:text-sm">Active</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs md:text-sm">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  {filteredReferrals.slice(0, 10).map((referral) => (
                    <div key={referral._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{referral.farmer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {referral.farmer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Referred on {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                        <div className="text-left md:text-right">
                          <p className="text-sm text-muted-foreground">
                            Commission: {(referral.commissionRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-32 md:max-w-none">
                            {referral.notes || 'No notes'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between md:justify-end space-x-2">
                          <Badge 
                            variant={
                              referral.status === 'completed' ? 'default' : 
                              referral.status === 'active' ? 'secondary' :
                              referral.status === 'pending' ? 'outline' : 'destructive'
                            } 
                            className="text-xs"
                          >
                            {referral.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditReferral(referral)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(referral)}>
                                <Target className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteReferral(referral)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals found</p>
                      <p className="text-sm text-muted-foreground">Start by adding your first farmer referral</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-4">
                  {pendingReferrals.map((referral) => (
                    <div key={referral._id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Target className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.farmer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.farmer.email} • {referral.farmer.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pending since {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(referral)}
                        >
                          Activate
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReferral(referral)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteReferral(referral)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {pendingReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending referrals</p>
                      <p className="text-sm text-muted-foreground">All your referrals are active or completed</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <div className="space-y-4">
                  {activeReferrals.map((referral) => (
                    <div key={referral._id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.farmer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.farmer.email} • {referral.farmer.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Active since {new Date(referral.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Commission Rate: {(referral.commissionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(referral)}
                        >
                          Complete
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReferral(referral)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteReferral(referral)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {activeReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active referrals</p>
                      <p className="text-sm text-muted-foreground">Activate pending referrals to see them here</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                <div className="space-y-4">
                  {completedReferrals.map((referral) => (
                    <div key={referral._id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.farmer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.farmer.email} • {referral.farmer.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Completed on {new Date(referral.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Commission Rate: {(referral.commissionRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Commission: ₦{referral.commission?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReferral(referral)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(referral)}>
                              <Target className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteReferral(referral)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {completedReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed referrals</p>
                      <p className="text-sm text-muted-foreground">Complete active referrals to see them here</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Track your referral performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Referral Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Referrals</span>
                    <span className="font-medium">{stats?.totalReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-medium text-yellow-600">{stats?.pendingReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="font-medium text-blue-600">{stats?.activeReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-600">{stats?.completedReferrals || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Conversion Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{stats?.conversionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Growth</span>
                    <span className="font-medium text-green-600">+{stats?.monthlyGrowth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Commission</span>
                    <span className="font-medium">₦{stats?.averageCommission?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <ReferralDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open)
            if (!open) {
              setSelectedReferral(null)
            }
          }}
          referral={selectedReferral}
        />

        <ReferralStatusDialog
          open={showStatusDialog}
          onOpenChange={(open) => {
            setShowStatusDialog(open)
            if (!open) {
              setSelectedReferral(null)
            }
          }}
          referral={selectedReferral}
        />
      </div>
    </DashboardLayout>
  )
}
