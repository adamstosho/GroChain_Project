"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/auth"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Users, Plus, Search, Download, TrendingUp, Banknote, CheckCircle, Clock, Bell, Settings, LogOut, Home, BarChart3, FileText, User, ChevronDown, RefreshCw, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { GroChainLogo } from "@/components/ui/grochain-logo"

interface PartnerStats {
  totalFarmers?: number
  activeFarmers?: number
  inactiveFarmers?: number
  pendingApprovals?: number
  monthlyCommission?: number
  monthlyCommissions?: number
  totalCommission?: number
  totalCommissions?: number
  commissionRate?: number
  approvalRate?: number
  conversionRate?: number
  performanceMetrics?: {
    farmersOnboardedThisMonth?: number
    commissionsEarnedThisMonth?: number
    averageCommissionPerFarmer?: number
  }
  partnerInfo?: {
    name?: string
    email?: string
    organization?: string
    status?: string
    joinedAt?: string
  }
}

interface Farmer {
  _id: string
  name: string
  email: string
  phone?: string
  location?: string
  status: "active" | "inactive" | "pending"
  joinedDate?: string
  joinedAt?: string
  totalHarvests?: number
  totalSales?: number
}

export default function PartnersPage() {
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Auth and notifications
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotifications()

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      const [statsResponse, farmersResponse] = await Promise.all([
        api.getPartnerMetrics(),
        api.getPartnerFarmers({ limit: 1000, page: 1 }),
      ])
      setStats(statsResponse.data as any)

      // Handle the correct response structure from backend
      const farmersData = farmersResponse.data
      console.log("Farmers API response:", farmersData)

      if (farmersData && typeof farmersData === 'object' && Array.isArray(farmersData.farmers)) {
        // Backend returns: { data: { farmers: [...], total: X, ... } }
        setFarmers(farmersData.farmers)
      } else if (Array.isArray(farmersData)) {
        // Fallback for direct array response
        setFarmers(farmersData)
      } else {
        console.warn("Farmers data is not in expected format:", farmersData)
        setFarmers([])
      }
    } catch (error) {
      console.error("Failed to fetch partner data:", error)
      // Set empty arrays on error to prevent filter errors
      setFarmers([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredFarmers = (farmers || []).filter((farmer) => {
    if (!farmer || typeof farmer !== 'object') return false

    const matchesSearch =
      (farmer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (farmer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (farmer.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || farmer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExport = async () => {
    try {
      alert('Export functionality temporarily disabled')
      return
      /*
      const response = await api.request('/api/partners/farmers/export', {
        method: 'POST',
        data: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
          format: 'csv'
        }
      })
      */

      /*
      // Create and download CSV file
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `farmers_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      */
    } catch (error) {
      console.error('Export failed:', error)
      // Fallback: export current filtered data
      const csvData = [
        ['Name', 'Email', 'Phone', 'Location', 'Status', 'Joined Date', 'Total Harvests', 'Total Sales'],
        ...filteredFarmers.map(farmer => [
          farmer.name || '',
          farmer.email || '',
          farmer.phone || '',
          farmer.location || '',
          farmer.status || '',
          farmer.joinedDate || farmer.joinedAt ? new Date(farmer.joinedDate || farmer.joinedAt || Date.now()).toLocaleDateString() : '',
          farmer.totalHarvests || 0,
          farmer.totalSales || 0
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `farmers_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  const handleSyncFarmers = async () => {
    try {
      alert('Sync functionality temporarily disabled')
      return
      /*
      const response = await api.request('/api/referrals/sync-partners', {
        method: 'POST'
      })
      */

      /*
      console.log('Sync response:', response.data)
      alert(`Sync completed! ${response.data.message || 'Farmers synchronized successfully'}`)

      // Refresh the data
      await fetchPartnerData()
      */
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Failed to sync farmers. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <GroChainLogo variant="full" size="md" />
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8 ml-10">
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link href="/dashboard/farmers" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Users className="h-4 w-4 mr-2" />
                  Farmers
                </Link>
                <Link href="/dashboard/approvals" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <FileText className="h-4 w-4 mr-2" />
                  Approvals
                </Link>
                <Link href="/dashboard/commissions" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Banknote className="h-4 w-4 mr-2" />
                  Commissions
                </Link>
                <Link href="/dashboard/analytics" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </div>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any)?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">{user?.name || 'Partner'}</span>
                      <span className="text-xs text-gray-500">{user?.email || ''}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="flex items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/farmers" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Farmers
            </Link>
            <Link href="/dashboard/approvals" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Approvals
            </Link>
            <Link href="/dashboard/commissions" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Commissions
            </Link>
            <Link href="/dashboard/analytics" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your farmer network and track performance</p>
          </div>
        </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && typeof stats === 'object' && Object.keys(stats).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFarmers || 0}</div>
              <p className="text-xs text-muted-foreground">{stats.activeFarmers || 0} active farmers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals || 0}</div>
              <p className="text-xs text-muted-foreground">{stats.approvalRate || 0}% approval rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(stats.monthlyCommissions || stats.monthlyCommission || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">₦{(stats.totalCommissions || stats.totalCommission || 0).toLocaleString()} total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvalRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Approval rate</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Content */}
      <Tabs defaultValue="farmers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="farmers">Farmers</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="farmers" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="outline" onClick={handleSyncFarmers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Farmers
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Farmers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Farmers ({filteredFarmers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Contact</th>
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Harvests</th>
                      <th className="text-left py-3 px-4">Sales</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFarmers.map((farmer, index) => (
                      <tr key={farmer._id || farmer.email || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{farmer.name}</p>
                            <p className="text-sm text-gray-500">
                              Joined {farmer.joinedDate || farmer.joinedAt ? new Date(farmer.joinedDate || farmer.joinedAt || Date.now()).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{farmer.email}</p>
                            <p className="text-sm text-gray-500">{farmer.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{typeof farmer.location === 'string' ? farmer.location : `${(farmer.location as any)?.city || 'Unknown'}, ${(farmer.location as any)?.state || 'Unknown State'}`}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              farmer.status === "active"
                                ? "default"
                                : farmer.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {farmer.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{farmer.totalHarvests || 0}</td>
                        <td className="py-3 px-4">₦{(farmer.totalSales || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/partners/farmers/${farmer._id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {/* Pending Harvest Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending Harvest Approvals
              </CardTitle>
              <CardDescription>Review and approve farmer harvests from your onboarded farmers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/approvals">
                      View All Approvals
                    </Link>
                  </Button>
                </div>

                {/* Pending Approvals Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Pending Approvals: {stats?.pendingApprovals || 0}</h3>
                      <p className="text-sm text-blue-700">Farmers are waiting for harvest approval</p>
                    </div>
                  </div>
                </div>

                {/* Recent Pending Approvals */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recent Pending Approvals</h4>
                  <div className="space-y-2">
                    {/* This would be populated from real API data */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Sample Harvest</p>
                          <p className="text-sm text-gray-600">Farmer: Emmanuel Nwosu</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link to full approvals page */}
                <div className="text-center pt-4">
                  <Button asChild>
                    <Link href="/dashboard/approvals">
                      Go to Full Approvals Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Your farmer network performance overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.approvalRate || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Approval Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.activeFarmers || 0}
                    </div>
                    <p className="text-sm text-gray-600">Active Farmers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.totalFarmers ? Math.round(((stats.activeFarmers || 0) / stats.totalFarmers) * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600">Activation Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredFarmers.length}
                    </div>
                    <p className="text-sm text-gray-600">Filtered Results</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href="/dashboard/analytics">
                      View Detailed Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Commission Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Commission Tracking
                </CardTitle>
                <CardDescription>Your earnings and commission breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Commission</span>
                    <span className="text-lg font-bold text-green-600">
                      ₦{(stats?.monthlyCommissions || stats?.monthlyCommission || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Earned</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₦{(stats?.totalCommissions || stats?.totalCommission || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commission Rate</span>
                    <span className="text-lg font-bold text-purple-600">
                      {stats?.commissionRate ? (stats.commissionRate * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/commissions">
                      View Commission Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your farmer network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFarmers.slice(0, 5).map((farmer, index) => (
                  <div key={farmer._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {farmer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{farmer.name}</p>
                        <p className="text-xs text-gray-600">{farmer.location || 'Location N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>
                        {farmer.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {farmer.totalHarvests || 0} harvests
                      </p>
                    </div>
                  </div>
                ))}
                {filteredFarmers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No farmers found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
