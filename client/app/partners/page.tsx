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
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Users, Search, Download, TrendingUp, Banknote, CheckCircle, Clock, Settings, LogOut, Home, BarChart3, FileText, User, ChevronDown, RefreshCw, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { GroChainLogo } from "@/components/ui/grochain-logo"
import { Display, Text } from "@/components/ui/typography"
import { PageContainer } from "@/components/layout/page-container"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { dashboard } from "@/lib/design-system"

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

  // Auth
  const { user, logout } = useAuthStore()

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
      const { getExportService } = await import("@/lib/export-utils")
      const exportService = getExportService()
      const rows = filteredFarmers.map((farmer) => ({
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        location: farmer.location,
        status: farmer.status,
        joinedDate: farmer.joinedDate ? new Date(farmer.joinedDate).toLocaleDateString() : "N/A",
        totalHarvests: farmer.totalHarvests || 0,
        totalSales: farmer.totalSales || 0,
      }))
      const result = await exportService.exportCustomData(rows, {
        format: "excel",
        filename: `grochain-partner-farmers-${new Date().toISOString().slice(0, 10)}.xlsx`,
      })
      if (!result.success) {
        // CSV fallback
        const csv = [
          "Name,Email,Phone,Location,Status,Joined Date,Total Harvests,Total Sales",
          ...rows.map((r) =>
            [r.name, r.email, r.phone, r.location, r.status, r.joinedDate, r.totalHarvests, r.totalSales]
              .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
              .join(",")
          ),
        ].join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `grochain-partner-farmers-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    }
  }

  const handleExportApprovals = async () => {
    try {
      const { getExportService } = await import("@/lib/export-utils")
      const exportService = getExportService()
      const result = await exportService.exportHarvestApprovals({ format: "csv" })
      if (!result.success) throw new Error(result.error)
    } catch (error) {
      console.error("Approvals export failed:", error)
      alert("Failed to export approvals. Please try again.")
    }
  }

  const handleSyncFarmers = async () => {
    try {
      const response = await api.syncPartnerFarmers()
      const message =
        (response as any)?.message ||
        (response as any)?.data?.message ||
        "Farmers synchronized successfully"
      alert(`Sync completed! ${message}`)
      await fetchPartnerData()
    } catch (error) {
      console.error("Sync failed:", error)
      alert("Failed to sync farmers. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className={dashboard.statsGrid4}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b">
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
                      <span className="text-sm font-medium text-foreground">{user?.name || 'Partner'}</span>
                      <span className="text-xs text-muted-foreground">{user?.email || ''}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                  <DropdownMenuItem onClick={() => logout()} className="flex items-center text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t bg-card">
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
      <PageContainer variant="dashboard">
        <DashboardSubpageHeader
          title="Partner Dashboard"
          description="Manage your farmer network and track performance"
          className="mb-8"
        />

      {/* Stats Cards */}
      {loading ? (
        <div className={dashboard.statsGrid4}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && typeof stats === 'object' && Object.keys(stats).length > 0 ? (
        <div className={dashboard.statsGrid4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Text as="div" variant="stat">{stats.totalFarmers || 0}</Text>
              <p className="text-xs text-muted-foreground">{stats.activeFarmers || 0} active farmers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Text as="div" variant="stat">{stats.pendingApprovals || 0}</Text>
              <p className="text-xs text-muted-foreground">{stats.approvalRate || 0}% approval rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Text as="div" variant="stat">₦{(stats.monthlyCommissions || stats.monthlyCommission || 0).toLocaleString()}</Text>
              <p className="text-xs text-muted-foreground">₦{(stats.totalCommissions || stats.totalCommission || 0).toLocaleString()} total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Text as="div" variant="stat">{stats.approvalRate || 0}%</Text>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-success"
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
                      <tr key={farmer._id || farmer.email || index} className="border-b hover:bg-muted">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{farmer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined {farmer.joinedDate || farmer.joinedAt ? new Date(farmer.joinedDate || farmer.joinedAt || Date.now()).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{farmer.email}</p>
                            <p className="text-sm text-muted-foreground">{farmer.phone || 'N/A'}</p>
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
                            <Link href={`/dashboard/farmers/${farmer._id}`}>View</Link>
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
                  <Button variant="outline" size="sm" onClick={handleExportApprovals}>
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
                <div className="bg-primary/10 border border-primary/10 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-primary" />
                    <div>
                      <Display as="h3" variant="sub" className="text-primary">Pending Approvals: {stats?.pendingApprovals || 0}</Display>
                      <p className="text-sm text-primary">Farmers are waiting for harvest approval</p>
                    </div>
                  </div>
                </div>

                {/* Recent Pending Approvals */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Recent Pending Approvals</h4>
                  <div className="space-y-2">
                    {/* This would be populated from real API data */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">Sample Harvest</p>
                          <p className="text-sm text-muted-foreground">Farmer: Emmanuel Nwosu</p>
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
                    <Text as="div" variant="stat" className="text-success">
                      {stats?.approvalRate || 0}%
                    </Text>
                    <p className="text-sm text-muted-foreground">Approval Rate</p>
                  </div>
                  <div className="text-center">
                    <Text as="div" variant="stat" className="text-primary">
                      {stats?.activeFarmers || 0}
                    </Text>
                    <p className="text-sm text-muted-foreground">Active Farmers</p>
                  </div>
                  <div className="text-center">
                    <Text as="div" variant="stat" className="text-warning">
                      {stats?.totalFarmers ? Math.round(((stats.activeFarmers || 0) / stats.totalFarmers) * 100) : 0}%
                    </Text>
                    <p className="text-sm text-muted-foreground">Activation Rate</p>
                  </div>
                  <div className="text-center">
                    <Text as="div" variant="stat" className="text-accent">
                      {filteredFarmers.length}
                    </Text>
                    <p className="text-sm text-muted-foreground">Filtered Results</p>
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
                    <span className="text-lg font-bold text-success">
                      ₦{(stats?.monthlyCommissions || stats?.monthlyCommission || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Earned</span>
                    <span className="text-lg font-bold text-primary">
                      ₦{(stats?.totalCommissions || stats?.totalCommission || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commission Rate</span>
                    <span className="text-lg font-bold text-accent">
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
                  <div key={farmer._id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {farmer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{farmer.name}</p>
                        <p className="text-xs text-muted-foreground">{farmer.location || 'Location N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>
                        {farmer.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {farmer.totalHarvests || 0} harvests
                      </p>
                    </div>
                  </div>
                ))}
                {filteredFarmers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No farmers found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </PageContainer>
    </div>
  )
}
