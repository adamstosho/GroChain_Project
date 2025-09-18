"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { apiService } from "@/lib/api"
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
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
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  TrendingUp,
  Banknote,
  Package,
  Settings,
  MoreVertical
} from "lucide-react"
import Link from "next/link"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'farmer' | 'buyer' | 'partner' | 'admin'
  status: 'active' | 'suspended' | 'pending' | 'verified'
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
  documents?: any[]
  preferences?: any
  settings?: any
}

interface UserFilters {
  search: string
  role: 'all' | 'farmer' | 'buyer' | 'partner' | 'admin'
  status: 'all' | 'active' | 'suspended' | 'pending' | 'verified'
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
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAdminUsers({
        page: currentPage,
        limit: usersPerPage,
        sort: 'createdAt',
        order: 'desc'
      })
      
      if (response.status === 'success') {
        const usersData = (response.data as any)?.users || []
        setUsers(usersData)
        calculateStats(usersData)
      } else {
        throw new Error(response.message || 'Failed to fetch users')
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users. Please try again.",
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
  }

  const calculateStats = (usersData: User[]) => {
    const stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(u => u.status === 'active').length,
      pendingUsers: usersData.filter(u => u.status === 'pending').length,
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

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
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
  }

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      let response
      let message = ''
      
      switch (action) {
        case 'activate':
          response = await apiService.activateAdminUser(userId)
          message = 'User activated successfully'
          break
        case 'suspend':
          response = await apiService.suspendAdminUser(userId)
          message = 'User suspended successfully'
          break
        case 'delete':
          response = await apiService.deleteAdminUser(userId)
          message = 'User deleted successfully'
          break
        case 'verify':
          response = await apiService.verifyAdminUser(userId)
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'farmer':
        return <User className="h-4 w-4 text-green-600" />
      case 'buyer':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case 'partner':
        return <Building className="h-4 w-4 text-purple-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Ban className="h-3 w-3 mr-1" />Suspended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><UserCheck className="h-3 w-3 mr-1" />Verified</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      farmer: 'bg-green-100 text-green-800 border-green-200',
      buyer: 'bg-blue-100 text-blue-800 border-blue-200',
      partner: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-red-100 text-red-800 border-red-200'
    }
    return <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>{role}</Badge>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage all platform users, roles, and permissions</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600 mt-1">All platform users</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Currently active</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Awaiting approval</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Ban className="h-4 w-4 mr-2 text-red-600" />
              Suspended Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.suspendedUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Account suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <User className="h-4 w-4 mr-2 text-green-600" />
              Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.farmers}</div>
            <div className="text-sm text-gray-600 mt-1">Agricultural producers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
              Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.buyers}</div>
            <div className="text-sm text-gray-600 mt-1">Product purchasers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Building className="h-4 w-4 mr-2 text-purple-600" />
              Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.partners}</div>
            <div className="text-sm text-gray-600 mt-1">Business partners</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-600" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.admins}</div>
            <div className="text-sm text-gray-600 mt-1">System administrators</div>
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
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
                <span className="text-sm text-gray-600">
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
                  className="text-red-600 hover:text-red-700"
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="farmers">Farmers</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Users List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b">
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
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Location
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Last Login
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
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
                            <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              {getRoleIcon(user.role)}
                            </div>
                            <div className="ml-3 lg:ml-4 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 truncate">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-400 truncate">{user.phone}</div>
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
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          <div className="truncate max-w-[120px]">
                            {user.location || user.city || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'suspend')}
                                className="text-yellow-600 hover:text-yellow-700 h-8 w-8 p-0"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'activate')}
                                className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user._id, 'delete')}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p className="text-sm">{selectedUser.location || selectedUser.city || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Email Verified</Label>
                  <p className="text-sm">
                    {selectedUser.emailVerified ? (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Unverified</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Joined</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                  <p className="text-sm">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Total Revenue</Label>
                  <p className="text-sm">
                    {selectedUser.totalRevenue ? formatCurrency(selectedUser.totalRevenue) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
