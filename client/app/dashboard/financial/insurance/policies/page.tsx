"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { formatCompactCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Plus,
  Eye,
  FileText,
  Download,
  Search,
  Banknote,
  AlertTriangle,
  TrendingUp,
  Leaf,
  Zap,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface InsurancePolicy {
  id: string
  policyNumber: string
  type: 'crop' | 'livestock' | 'equipment' | 'health' | 'life'
  provider: string
  coverage: {
    amount: number
    currency: string
    details: string
  }
  premium: {
    amount: number
    frequency: 'monthly' | 'quarterly' | 'annually'
    nextDue: string
  }
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'claimed'
  startDate: string
  endDate: string
  crops?: string[]
  livestock?: string[]
  equipment?: string[]
  riskFactors: Array<{
    factor: string
    level: 'low' | 'medium' | 'high'
    description: string
  }>
  claims: Array<{
    id: string
    date: string
    amount: number
    status: 'pending' | 'approved' | 'rejected'
    description: string
  }>
  documents: Array<{
    name: string
    type: string
    url: string
    uploadedAt: string
  }>
}

interface InsuranceStats {
  totalPolicies: number
  activePolicies: number
  totalCoverage: number
  totalPremium: number
  pendingClaims: number
  claimsValue: number
  monthlyTrend: {
    month: string
    policies: number
    coverage: number
    premium: number
  }[]
}

const policyTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'crop', label: 'Crop Insurance' },
  { value: 'livestock', label: 'Livestock Insurance' },
  { value: 'equipment', label: 'Equipment Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'life', label: 'Life Insurance' }
]

const policyStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'claimed', label: 'Claimed' }
]

const riskLevelColors = {
  low: 'bg-success/10 text-success border-success/10',
  medium: 'bg-warning/10 text-warning border-warning/10',
  high: 'bg-destructive/10 text-destructive border-destructive/10'
}

const statusColors = {
  active: 'bg-success/10 text-success border-success/10',
  expired: 'bg-destructive/10 text-destructive border-destructive/10',
  pending: 'bg-warning/10 text-warning border-warning/10',
  cancelled: 'bg-muted text-foreground border-border',
  claimed: 'bg-primary/10 text-primary border-primary/10',
  approved: 'bg-success/10 text-success border-success/10',
  rejected: 'bg-destructive/10 text-destructive border-destructive/10'
}

export default function InsurancePoliciesPage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [stats, setStats] = useState<InsuranceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  })
  const [sortBy, setSortBy] = useState('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPolicies()
  }, [filters, sortBy, sortOrder])

  const fetchPolicies = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend APIs
      const [policiesResponse, dashboardResponse] = await Promise.all([
        apiService.getInsurancePolicies(),
        apiService.getFinancialDashboard()
      ])

      if (policiesResponse.status === 'success' && policiesResponse.data) {
        const policiesData = (policiesResponse.data as any).policies || policiesResponse.data || []

        // Transform backend data (real InsurancePolicy/InsuranceClaim documents) to match frontend interface
        const transformedPolicies: InsurancePolicy[] = policiesData.map((policy: any) => {
          const coverageDetails = policy.coverageDetails || {}
          const detailParts = [
            ...(coverageDetails.crops || []),
            ...(coverageDetails.equipment || []),
            ...(coverageDetails.livestock || [])
          ]

          return {
            id: policy._id || policy.id,
            policyNumber: policy.policyNumber,
            type: policy.type,
            provider: policy.provider,
            coverage: {
              amount: policy.coverageAmount || policy.coverage?.amount || 0,
              currency: policy.currency || 'NGN',
              details: detailParts.length > 0 ? detailParts.join(', ') : 'Insurance coverage'
            },
            premium: {
              amount: policy.premium || policy.premiumAmount || 0,
              frequency: policy.premiumFrequency || 'annually',
              nextDue: policy.nextPremiumDue || policy.nextPaymentDate
            },
            status: policy.status,
            startDate: policy.startDate,
            endDate: policy.endDate,
            crops: coverageDetails.crops || [],
            livestock: coverageDetails.livestock || [],
            equipment: coverageDetails.equipment || [],
            riskFactors: (policy.riskFactors || []).map((factor: any) => ({
              factor: factor.name || factor.factor,
              level: factor.level || 'medium',
              description: factor.description || ''
            })),
            claims: (policy.claims || []).map((claim: any) => ({
              id: claim._id || claim.id,
              date: claim.incidentDate || claim.reportedDate || claim.createdAt,
              amount: claim.claimAmount || claim.estimatedLoss || 0,
              status: claim.status,
              description: claim.description || ''
            })),
            documents: (policy.documents || []).map((doc: any) => ({
              name: doc.name,
              type: doc.type,
              url: doc.url,
              uploadedAt: doc.uploadedAt
            }))
          }
        })

        setPolicies(transformedPolicies)

        // Calculate stats from real data
        const activePolicies = transformedPolicies.filter(p => p.status === 'active')
        const totalCoverage = activePolicies.reduce((sum, policy) => sum + policy.coverage.amount, 0)
        const totalPremium = activePolicies.reduce((sum, policy) => sum + policy.premium.amount, 0)
        const allClaims = transformedPolicies.flatMap(p => p.claims || [])
        const pendingClaims = allClaims.filter(c => c.status === 'pending').length
        const claimsValue = allClaims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0)

        // Group by month for trend analysis
        const monthlyData = transformedPolicies.reduce((acc: any, policy) => {
          const date = new Date(policy.startDate)
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          if (!acc[monthKey]) {
            acc[monthKey] = { policies: 0, coverage: 0, premium: 0 }
          }

          acc[monthKey].policies += 1
          acc[monthKey].coverage += policy.coverage.amount
          acc[monthKey].premium += policy.premium.amount

          return acc
        }, {})

        const monthlyTrend = Object.entries(monthlyData)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([month, data]: [string, any]) => ({
            month,
            policies: data.policies,
            coverage: data.coverage,
            premium: data.premium
          }))

        const stats: InsuranceStats = {
          totalPolicies: transformedPolicies.length,
          activePolicies: activePolicies.length,
          totalCoverage,
          totalPremium,
          pendingClaims,
          claimsValue,
          monthlyTrend
        }

        setStats(stats)
      } else {
        // Fallback to dashboard data if insurance policies API fails
        if (dashboardResponse.status === 'success' && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data as any
          const insurancePolicies = dashboardData.insurancePolicies || []

          const transformedPolicies: InsurancePolicy[] = insurancePolicies.map((policy: any) => ({
            id: policy._id,
            policyNumber: policy.policyNumber,
            type: policy.type,
            provider: policy.provider,
            coverage: {
              amount: policy.coverageAmount,
              currency: 'NGN',
              details: 'Insurance coverage from dashboard data'
            },
            premium: {
              amount: policy.premium,
              frequency: 'annually',
              nextDue: policy.nextPaymentDate
            },
            status: policy.status,
            startDate: policy.startDate,
            endDate: policy.endDate,
            crops: [],
            livestock: [],
            equipment: [],
            riskFactors: [],
            claims: [],
            documents: []
          }))

          setPolicies(transformedPolicies)

          const stats: InsuranceStats = {
            totalPolicies: insurancePolicies.length,
            activePolicies: insurancePolicies.filter((p: any) => p.status === 'active').length,
            totalCoverage: insurancePolicies.reduce((sum: number, p: any) => sum + (p.coverageAmount || 0), 0),
            totalPremium: insurancePolicies.reduce((sum: number, p: any) => sum + (p.premium || 0), 0),
            pendingClaims: 0,
            claimsValue: 0,
            monthlyTrend: []
          }

          setStats(stats)
        }
      }
    } catch (error) {
      console.error("Failed to fetch insurance policies:", error)
      toast({
        title: "Error",
        description: "Failed to load insurance policies. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewPolicy = () => {
    router.push('/dashboard/financial/insurance/compare')
  }

  const handleExport = async () => {
    if (policies.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "You don't have any insurance policies yet.",
        variant: "default"
      })
      return
    }

    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups.')
      }

      const formatCurrency = (amount: number) => `₦${(amount || 0).toLocaleString()}`
      const formatDate = (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'

      const rows = policies.map(policy => `
        <tr>
          <td>${policy.policyNumber}</td>
          <td style="text-transform: capitalize;">${policy.type}</td>
          <td>${policy.provider}</td>
          <td>${formatCurrency(policy.coverage.amount)}</td>
          <td>${formatCurrency(policy.premium.amount)} / ${policy.premium.frequency}</td>
          <td style="text-transform: capitalize;">${policy.status}</td>
          <td>${formatDate(policy.startDate)}</td>
          <td>${formatDate(policy.endDate)}</td>
        </tr>
      `).join('')

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Insurance Policies Report</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Insurance Policies Report</h1>
          <div class="meta">Generated ${formatDate(new Date().toISOString())} &middot; ${policies.length} ${policies.length === 1 ? 'policy' : 'policies'}</div>
          <table>
            <tr>
              <th>Policy Number</th><th>Type</th><th>Provider</th><th>Coverage</th><th>Premium</th><th>Status</th><th>Start</th><th>End</th>
            </tr>
            ${rows}
          </table>
        </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()

      window.setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 400)

      toast({
        title: "Report Ready",
        description: "Your insurance report has been opened for printing/saving as PDF.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to export insurance policies:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export insurance policies. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'crop': return <Leaf className="h-4 w-4 text-success" />
      case 'livestock': return <Shield className="h-4 w-4 text-primary" />
      case 'equipment': return <Zap className="h-4 w-4 text-accent" />
      case 'health': return <Shield className="h-4 w-4 text-success" />
      case 'life': return <Shield className="h-4 w-4 text-destructive" />
      default: return <Shield className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'crop': return 'bg-success/10 text-success border-success/10'
      case 'livestock': return 'bg-primary/10 text-primary border-primary/10'
      case 'equipment': return 'bg-accent/10 text-accent border-accent/10'
      case 'health': return 'bg-success/10 text-success border-success/10'
      case 'life': return 'bg-destructive/10 text-destructive border-destructive/10'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const filteredPolicies = policies.filter(policy => {
    if (filters.type !== 'all' && policy.type !== filters.type) return false
    if (filters.status !== 'all' && policy.status !== filters.status) return false
    if (filters.search && !policy.policyNumber.toLowerCase().includes(filters.search.toLowerCase()) && 
        !policy.provider.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    let aValue: any
    let bValue: any

    if (sortBy === 'premium') {
      aValue = a.premium.amount
      bValue = b.premium.amount
    } else if (sortBy === 'coverageAmount') {
      aValue = a.coverage.amount
      bValue = b.coverage.amount
    } else {
      aValue = a[sortBy as keyof InsurancePolicy]
      bValue = b[sortBy as keyof InsurancePolicy]
    }

    if (sortBy === 'startDate' || sortBy === 'endDate') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <DashboardLayout pageTitle="Insurance Policies">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Insurance Policies">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Insurance Policies</h1>
            <p className="text-muted-foreground">
              Manage your insurance coverage and claims
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handleNewPolicy}>
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </div>
        </div>

        {/* Insurance Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats.totalPolicies}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{stats.activePolicies} active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCompactCurrency(stats.totalCoverage)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Across active policies</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {formatCompactCurrency(stats.totalPremium)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Banknote className="h-4 w-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Total across active policies</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {stats.pendingClaims}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{formatCompactCurrency(stats.claimsValue)} value</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Policy Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policyStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search policies..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startDate">Start Date</SelectItem>
                      <SelectItem value="endDate">End Date</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="coverageAmount">Coverage Amount</SelectItem>
                      <SelectItem value="policyNumber">Policy Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies List */}
        <div className="space-y-4">
          {sortedPolicies.map((policy) => (
            <Card key={policy.id} className="border border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getPolicyTypeIcon(policy.type)}
                      <div>
                        <CardTitle className="text-lg font-medium">{policy.policyNumber}</CardTitle>
                        <CardDescription className="text-base">
                          {policy.provider}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getPolicyTypeColor(policy.type)} variant="outline">
                        {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
                      </Badge>
                      <Badge className={statusColors[policy.status]} variant="outline">
                        {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coverage Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-foreground">Coverage Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Coverage Amount:</span>
                        <span className="text-sm font-medium">{formatCompactCurrency(policy.coverage.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Premium:</span>
                        <span className="text-sm font-medium">{formatCompactCurrency(policy.premium.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Frequency:</span>
                        <span className="text-sm font-medium capitalize">{policy.premium.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Next Due:</span>
                        <span className="text-sm font-medium">
                          {new Date(policy.premium.nextDue).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Policy Period */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-foreground">Policy Period</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Start Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(policy.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">End Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(policy.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Days Remaining:</span>
                        <span className="text-sm font-medium">
                          {Math.ceil((new Date(policy.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-foreground">Risk Assessment</h4>
                    <div className="space-y-2">
                      {policy.riskFactors.slice(0, 3).map((risk, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{risk.factor}</span>
                          <Badge className={riskLevelColors[risk.level]} variant="outline">
                            {risk.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Claims Summary */}
                {policy.claims.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-foreground mb-3">Recent Claims</h4>
                    <div className="space-y-2">
                      {policy.claims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="text-sm font-medium">{claim.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(claim.date).toLocaleDateString()} • ₦{claim.amount.toLocaleString()}
                            </div>
                          </div>
                          <Badge className={statusColors[claim.status]} variant="outline">
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedPolicies.length === 0 && (
          <Card className="border border-border">
            <CardContent className="text-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Policies Found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.type !== 'all' || filters.status !== 'all' || filters.search
                  ? "Try adjusting your filters to see more policies."
                  : "You don't have any insurance policies yet."}
              </p>
              {!filters.type && !filters.status && !filters.search && (
                <Button onClick={handleNewPolicy}>
                  <Plus className="h-4 w-4 mr-2" />
                  Get Your First Policy
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
