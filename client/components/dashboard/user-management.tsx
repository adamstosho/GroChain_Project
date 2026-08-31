"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Text } from "@/components/ui/typography"
import { dashboard } from "@/lib/design-system"
import { apiService } from "@/lib/api"
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  User,
  Building,
  ShoppingCart,
  Download,
  Upload,
  RefreshCw,
  Plus,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react"
import { getErrorMessage, asRecord } from "@/lib/error-utils"

interface User {
  _id: string
  name: string  // Backend uses 'name' not 'firstName'/'lastName'
  email: string
  role: 'farmer' | 'buyer' | 'partner' | 'admin'
  status: 'active' | 'suspended' | 'inactive'  // Backend uses 'active', 'inactive', 'suspended'
  emailVerified: boolean
  phone?: string
  location?: string
  createdAt: string
  lastLogin?: string
  totalHarvests?: number
  totalOrders?: number
  totalRevenue?: number
  avatar?: string
  address?: string
  state?: string
  city?: string
  country?: string
  bvn?: string
  bankAccount?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  isActive?: boolean
  verificationStatus?: string
  documents?: Array<Record<string, unknown>>
  preferences?: Record<string, unknown>
  settings?: Record<string, unknown>
}

interface UserFilters {
  search: string
  role: 'all' | 'farmer' | 'buyer' | 'partner' | 'admin'
  status: 'all' | 'active' | 'suspended' | 'inactive'  // Match backend status values
  emailVerified: 'all' | 'verified' | 'unverified'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  suspendedUsers: number
  farmers: number
  buyers: number
  partners: number
  admins: number
  verifiedUsers: number
  unverifiedUsers: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    emailVerified: 'all',
    dateRange: 'all'
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [usersPerPage] = useState(20)
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    farmers: 0,
    buyers: 0,
    partners: 0,
    admins: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiService.getAdminUsers({
        page: currentPage,
        limit: usersPerPage,
        sort: 'createdAt',
        order: 'desc'
      })
      
      if (response.status === 'success') {
        const payload = asRecord(response.data)
        const usersData = Array.isArray(payload.users) ? (payload.users as User[]) : []
        setUsers(usersData)
        calculateStats(usersData)

        const paginationData = asRecord(payload.pagination)
        if (Object.keys(paginationData).length > 0) {
          setTotalPages(Number(paginationData.pages) || 1)
        }
      } else {
        throw new Error(response.message || 'Failed to fetch users')
      }
    } catch (error: unknown) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to fetch users. Please try again."),
        variant: "destructive"
      })
      // Set empty data on error
      setUsers([])
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        suspendedUsers: 0,
        farmers: 0,
        buyers: 0,
        partners: 0,
        admins: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, usersPerPage, toast])

  const calculateStats = (usersData: User[]) => {
    const stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(u => u.status === 'active').length,
      pendingUsers: usersData.filter(u => u.status === 'inactive').length,
      suspendedUsers: usersData.filter(u => u.status === 'suspended').length,
      farmers: usersData.filter(u => u.role === 'farmer').length,
      buyers: usersData.filter(u => u.role === 'buyer').length,
      partners: usersData.filter(u => u.role === 'partner').length,
      admins: usersData.filter(u => u.role === 'admin').length,
      verifiedUsers: usersData.filter(u => u.emailVerified).length,
      unverifiedUsers: usersData.filter(u => !u.emailVerified).length
    }
    setStats(stats)
  }

  const applyFilters = useCallback(() => {
    let filtered = [...users]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone?.includes(filters.search)
      )
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status)
    }

    // Email verification filter
    if (filters.emailVerified && filters.emailVerified !== 'all') {
      filtered = filtered.filter(user => 
        filters.emailVerified === 'verified' ? user.emailVerified : !user.emailVerified
      )
    }

    // Tab filter
    if (activeTab === 'farmers') {
      filtered = filtered.filter(user => user.role === 'farmer')
    } else if (activeTab === 'buyers') {
      filtered = filtered.filter(user => user.role === 'buyer')
    } else if (activeTab === 'partners') {
      filtered = filtered.filter(user => user.role === 'partner')
    } else if (activeTab === 'admins') {
      filtered = filtered.filter(user => user.role === 'admin')
    }

    setFilteredUsers(filtered)
  }, [users, filters, activeTab])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive"
      })
      return
    }

    try {
      // Perform bulk actions on selected users
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'activate':
            return apiService.activateAdminUser(userId)
          case 'suspend':
            return apiService.suspendAdminUser(userId)
          case 'delete':
            return apiService.deleteAdminUser(userId)
          case 'verify':
            return apiService.verifyAdminUser(userId)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      
      let message = ''
      switch (action) {
        case 'activate':
          message = `${selectedUsers.length} users activated successfully`
          break
        case 'suspend':
          message = `${selectedUsers.length} users suspended successfully`
          break
        case 'delete':
          message = `${selectedUsers.length} users deleted successfully`
          break
        case 'verify':
          message = `${selectedUsers.length} users verified successfully`
          break
      }

      toast({
        title: "Success",
        description: message,
        variant: "default"
      })

      setSelectedUsers([])
      fetchUsers() // Refresh the list
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to perform bulk action. Please try again."),
        variant: "destructive"
      })
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      let message = ''

      switch (action) {
        case 'activate':
          await apiService.activateAdminUser(userId)
          message = 'User activated successfully'
          break
        case 'suspend':
          await apiService.suspendAdminUser(userId)
          message = 'User suspended successfully'
          break
        case 'delete':
          await apiService.deleteAdminUser(userId)
          message = 'User deleted successfully'
          break
        case 'verify':
          await apiService.verifyAdminUser(userId)
          message = 'User verified successfully'
          break
        default:
          throw new Error('Invalid action')
      }

      toast({
        title: "Success",
        description: message,
        variant: "default"
      })

      fetchUsers() // Refresh the list
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to perform action. Please try again."),
        variant: "destructive"
      })
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
    setIsUserModalOpen(false) // Close the view modal
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      // Call the API to update the user
      await apiService.updateAdminUser(editingUser._id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status,
        location: editingUser.location,
        emailVerified: editingUser.emailVerified
      })

      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "default"
      })
      
      setIsEditModalOpen(false)
      setEditingUser(null)
      fetchUsers() // Refresh the list
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update user"),
        variant: "destructive"
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'farmer':
        return <User className="h-4 w-4 text-success" />
      case 'buyer':
        return <ShoppingCart className="h-4 w-4 text-primary" />
      case 'partner':
        return <Building className="h-4 w-4 text-accent" />
      case 'admin':
        return <Shield className="h-4 w-4 text-destructive" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/10"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'suspended':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/10"><Ban className="h-3 w-3 mr-1" />Suspended</Badge>
      case 'inactive':
        return <Badge className="bg-warning/10 text-warning border-warning/10"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>
      case 'verified':
        return <Badge className="bg-primary/10 text-primary border-primary/10"><UserCheck className="h-3 w-3 mr-1" />Verified</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      farmer: 'bg-success/10 text-success border-success/10',
      buyer: 'bg-primary/10 text-primary border-primary/10',
      partner: 'bg-accent/10 text-accent border-accent/10',
      admin: 'bg-destructive/10 text-destructive border-destructive/10'
    }
    return <Badge className={colors[role as keyof typeof colors] || 'bg-muted text-foreground border-border'}>{role}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <DashboardPageShell>
      <DashboardSubpageHeader
        title="Users Management"
        description="Manage all platform users, roles, and permissions"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { getExportService } = await import("@/lib/export-utils")
                  const exportService = getExportService()
                  const result = await exportService.exportUsers({ format: "excel" })
                  if (!result.success) {
                    await exportService.exportCustomData(
                      filteredUsers.map((u) => ({
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: u.status,
                        phone: u.phone || "",
                        emailVerified: u.emailVerified,
                        createdAt: u.createdAt,
                      })),
                      { format: "csv", filename: `grochain-users-${new Date().toISOString().slice(0, 10)}.csv` }
                    )
                  }
                  toast({ title: "Export ready", description: "Users file downloaded." })
                } catch (e: unknown) {
                  toast({ title: "Export failed", description: getErrorMessage(e, "Try again"), variant: "destructive" })
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className={dashboard.statsGrid4}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.totalUsers}</Text>
            <div className="text-sm text-muted-foreground mt-1">All platform users</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.activeUsers}</Text>
            <div className="text-sm text-muted-foreground mt-1">Currently active</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2 text-warning" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.pendingUsers}</Text>
            <div className="text-sm text-muted-foreground mt-1">Awaiting approval</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Ban className="h-4 w-4 mr-2 text-destructive" />
              Suspended Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.suspendedUsers}</Text>
            <div className="text-sm text-muted-foreground mt-1">Account suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className={dashboard.statsGrid4}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <User className="h-4 w-4 mr-2 text-success" />
              Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.farmers}</Text>
            <div className="text-sm text-muted-foreground mt-1">Agricultural producers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-primary" />
              Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.buyers}</Text>
            <div className="text-sm text-muted-foreground mt-1">Product purchasers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Building className="h-4 w-4 mr-2 text-accent" />
              Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.partners}</Text>
            <div className="text-sm text-muted-foreground mt-1">Business partners</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Shield className="h-4 w-4 mr-2 text-destructive" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text as="div" variant="stat" className="text-foreground">{stats.admins}</Text>
            <div className="text-sm text-muted-foreground mt-1">System administrators</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
          <CardDescription>Find specific users using filters and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value as UserFilters['role'] })}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="farmer">Farmers</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="partner">Partners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value as UserFilters['status'] })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.emailVerified} onValueChange={(value) => setFilters({ ...filters, emailVerified: value as UserFilters['emailVerified'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Email Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value as UserFilters['dateRange'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} user(s) selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('suspend')}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('verify')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-muted/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2.5">All Users</TabsTrigger>
              <TabsTrigger value="farmers" className="text-xs sm:text-sm py-2.5">Farmers</TabsTrigger>
              <TabsTrigger value="buyers" className="text-xs sm:text-sm py-2.5">Buyers</TabsTrigger>
              <TabsTrigger value="partners" className="text-xs sm:text-sm py-2.5">Partners</TabsTrigger>
              <TabsTrigger value="admins" className="text-xs sm:text-sm py-2.5">Admins</TabsTrigger>
            </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Users List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(filteredUsers.map(u => u._id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Location
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Last Login
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-muted">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user._id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user._id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              {getRoleIcon(user.role)}
                            </div>
                            <div className="ml-3 lg:ml-4 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {user.name}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-muted-foreground truncate">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-foreground hidden md:table-cell">
                          <div className="truncate max-w-[120px]">
                            {user.location || user.city || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1 lg:space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'suspend')}
                                className="text-warning hover:text-warning h-8 w-8 p-0"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'activate')}
                                className="text-success hover:text-success h-8 w-8 p-0"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user._id, 'delete')}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search criteria.
                  </p>
                  <Button variant="outline" onClick={() => setFilters({
                    search: '',
                    role: 'all',
                    status: 'all',
                    emailVerified: 'all',
                    dateRange: 'all'
                  })}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || loading}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages || loading}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">User Details</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 sm:space-y-6">
              {/* User Basic Info */}
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    {selectedUser.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate break-all">{selectedUser.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-xs sm:text-sm break-all">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-xs sm:text-sm truncate">{selectedUser.location || selectedUser.city || 'N/A'}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Email Verified</Label>
                  <p className="text-xs sm:text-sm">
                    {selectedUser.emailVerified ? (
                      <Badge className="bg-success/10 text-success text-xs">Verified</Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive text-xs">Unverified</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Joined</Label>
                  <p className="text-xs sm:text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Last Login</Label>
                  <p className="text-xs sm:text-sm">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</Label>
                  <p className="text-xs sm:text-sm">
                    {selectedUser.totalRevenue ? formatCurrency(selectedUser.totalRevenue) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-3 sm:pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => selectedUser && handleEditUser(selectedUser)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Edit User</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update user information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 sm:space-y-6">
              {/* User Basic Info */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs sm:text-sm">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-xs sm:text-sm">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-xs sm:text-sm">Role</Label>
                    <Select
                      value={editingUser.role}
                      onValueChange={(value) => setEditingUser({ ...editingUser, role: value as User['role'] })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="farmer">Farmer</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-xs sm:text-sm">Status</Label>
                    <Select
                      value={editingUser.status}
                      onValueChange={(value) => setEditingUser({ ...editingUser, status: value as User['status'] })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location" className="text-xs sm:text-sm">Location</Label>
                  <Input
                    id="edit-location"
                    value={editingUser.location || editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-emailVerified"
                    checked={editingUser.emailVerified}
                    onCheckedChange={(checked) => setEditingUser({ ...editingUser, emailVerified: checked as boolean })}
                  />
                  <Label htmlFor="edit-emailVerified" className="text-xs sm:text-sm cursor-pointer">
                    Email Verified
                  </Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
