"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Text } from "@/components/ui/typography"
import { dashboard } from "@/lib/design-system"
import { apiService } from "@/lib/api"
import { formatCompactCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Eye,
  RefreshCw,
  Upload,
  Crop,
  CloudRain
} from "lucide-react"
import Link from "next/link"

interface InsuranceClaim {
  id: string
  policyNumber: string
  claimType: 'crop_damage' | 'equipment_damage' | 'livestock_loss' | 'natural_disaster' | 'theft' | 'other'
  description: string
  incidentDate: string
  reportedDate: string
  estimatedLoss: number
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid'
  claimAmount: number
  paidAmount?: number
  documents: Array<{ name: string; url?: string; type?: string; uploadedAt?: string }>
  location: string
  weatherConditions?: string
  adjusterNotes?: string
  decisionDate?: string
}

interface ClaimStats {
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  totalClaimed: number
  totalPaid: number
  averageProcessingTime: number
}

const claimTypes = [
  { value: 'crop_damage', label: 'Crop Damage', icon: Crop },
  { value: 'equipment_damage', label: 'Equipment Damage', icon: TrendingUp },
  { value: 'livestock_loss', label: 'Livestock Loss', icon: TrendingUp },
  { value: 'natural_disaster', label: 'Natural Disaster', icon: CloudRain },
  { value: 'theft', label: 'Theft', icon: AlertCircle },
  { value: 'other', label: 'Other', icon: FileText }
]

const statusColors = {
  pending: 'bg-warning/10 text-warning',
  under_review: 'bg-primary/10 text-primary',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  paid: 'bg-success/10 text-success'
}

const statusIcons = {
  pending: Clock,
  under_review: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  paid: CheckCircle
}

export default function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewClaimForm, setShowNewClaimForm] = useState(false)
  const [newClaim, setNewClaim] = useState({
    policyNumber: '',
    claimType: '',
    description: '',
    incidentDate: '',
    estimatedLoss: 0,
    location: '',
    weatherConditions: ''
  })
  const { toast } = useToast()

  const fetchClaimsData = useCallback(async () => {
    try {
      setLoading(true)

      const response = await apiService.getInsuranceClaims()

      if (response.status === 'success' && response.data) {
        const responseData = response.data as any
        const claimsData = responseData.claims || []

        const transformedClaims: InsuranceClaim[] = claimsData.map((claim: any) => ({
          id: claim._id || claim.id,
          policyNumber: claim.policy?.policyNumber || 'N/A',
          claimType: claim.claimType,
          description: claim.description,
          incidentDate: claim.incidentDate,
          reportedDate: claim.reportedDate,
          estimatedLoss: claim.estimatedLoss || 0,
          status: claim.status,
          claimAmount: claim.claimAmount || 0,
          paidAmount: claim.paidAmount || undefined,
          documents: (claim.documents || []).map((doc: any) =>
            typeof doc === 'string' ? { name: doc } : doc
          ),
          location: claim.location || '',
          weatherConditions: claim.weatherConditions,
          adjusterNotes: claim.adjusterNotes,
          decisionDate: claim.decisionDate
        }))

        setClaims(transformedClaims)

        const statsData = responseData.stats || {}
        setStats({
          totalClaims: statsData.totalClaims ?? transformedClaims.length,
          pendingClaims: statsData.pendingClaims ?? 0,
          approvedClaims: statsData.approvedClaims ?? 0,
          totalClaimed: statsData.totalClaimed ?? 0,
          totalPaid: statsData.totalPaid ?? 0,
          averageProcessingTime: statsData.averageProcessingTime ?? 0
        })
      } else {
        throw new Error(response.message || 'Failed to fetch insurance claims')
      }
    } catch (error) {
      console.error("Failed to fetch claims data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load claims data. Please try again.",
        variant: "destructive"
      })
      setClaims([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchClaimsData()
  }, [fetchClaimsData])

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClaim.policyNumber || !newClaim.claimType || !newClaim.description || !newClaim.incidentDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiService.createInsuranceClaim({
        policyNumber: newClaim.policyNumber,
        claimType: newClaim.claimType,
        description: newClaim.description,
        incidentDate: newClaim.incidentDate,
        estimatedLoss: newClaim.estimatedLoss,
        location: newClaim.location,
        weatherConditions: newClaim.weatherConditions || undefined
      })

      if (response.status !== 'success' || !response.data) {
        throw new Error(response.message || 'Failed to submit claim')
      }

      // Refetch so the list and stats reflect what was actually persisted
      await fetchClaimsData()

      setShowNewClaimForm(false)
      setNewClaim({
        policyNumber: '',
        claimType: '',
        description: '',
        incidentDate: '',
        estimatedLoss: 0,
        location: '',
        weatherConditions: ''
      })

      toast({
        title: "Claim Submitted",
        description: "Your insurance claim has been submitted and is under review.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to submit claim:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit claim. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = async () => {
    await fetchClaimsData()
    toast({
      title: "Refreshed",
      description: "Claims data has been updated.",
      variant: "default"
    })
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || Clock
    return <IconComponent className="h-4 w-4" />
  }

  const getClaimTypeIcon = (type: string) => {
    const claimType = claimTypes.find(ct => ct.value === type)
    if (claimType) {
      const IconComponent = claimType.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => formatCompactCurrency(amount)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Insurance Claims">
        <DashboardPageShell>
          <div className={dashboard.statsGrid4}>
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
        </DashboardPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Insurance Claims">
      <DashboardPageShell>
        <DashboardSubpageHeader
          title="Insurance Claims"
          description="Submit and track your insurance claims for farm protection"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowNewClaimForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Claim
              </Button>
            </div>
          }
        />

        {/* Key Metrics */}
        {stats && (
          <div className={dashboard.statsGrid4}>
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <Text as="div" variant="stat" className="text-foreground">{stats.totalClaims}</Text>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.pendingClaims} pending
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Claimed</CardTitle>
              </CardHeader>
              <CardContent>
                <Text as="div" variant="stat" className="text-foreground">{formatCurrency(stats.totalClaimed)}</Text>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.approvedClaims} approved
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <Text as="div" variant="stat" className="text-foreground">{formatCurrency(stats.totalPaid)}</Text>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalClaimed > 0 ? ((stats.totalPaid / stats.totalClaimed) * 100).toFixed(1) : '0'}% of claimed
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <Text as="div" variant="stat" className="text-foreground">{stats.averageProcessingTime} days</Text>
                <div className="text-sm text-muted-foreground mt-1">
                  Time to decision
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Claim Form */}
        {showNewClaimForm && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Plus className="h-4 w-4 text-primary" />
                Submit New Insurance Claim
              </CardTitle>
              <CardDescription>
                Provide details about your claim for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number *</Label>
                    <Input
                      id="policyNumber"
                      value={newClaim.policyNumber}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, policyNumber: e.target.value }))}
                      placeholder={`e.g., INS-${new Date().getFullYear()}-001`}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="claimType">Claim Type *</Label>
                    <Select 
                      value={newClaim.claimType} 
                      onValueChange={(value) => setNewClaim(prev => ({ ...prev, claimType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {claimTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {getClaimTypeIcon(type.value)}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate">Incident Date *</Label>
                    <Input
                      id="incidentDate"
                      type="date"
                      value={newClaim.incidentDate}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, incidentDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedLoss">Estimated Loss (NGN) *</Label>
                    <Input
                      id="estimatedLoss"
                      type="number"
                      value={newClaim.estimatedLoss}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, estimatedLoss: Number(e.target.value) }))}
                      placeholder="e.g., 100000"
                      min="1000"
                      step="1000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description of Incident *</Label>
                  <Textarea
                    id="description"
                    value={newClaim.description}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what happened, when it occurred, and the extent of the damage..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={newClaim.location}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., North Field, Plot A"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weatherConditions">Weather Conditions</Label>
                    <Input
                      id="weatherConditions"
                      value={newClaim.weatherConditions}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, weatherConditions: e.target.value }))}
                      placeholder="e.g., Heavy rainfall, flooding"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowNewClaimForm(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Claim
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="claims">All Claims</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Claims */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <FileText className="h-4 w-4 text-primary" />
                    Recent Claims
                  </CardTitle>
                  <CardDescription>Latest insurance claims and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claims.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[claim.status]}>
                              {getStatusIcon(claim.status)}
                              {claim.status.replace('_', ' ').charAt(0).toUpperCase() + claim.status.replace('_', ' ').slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium mt-1">
                            {claimTypes.find(ct => ct.value === claim.claimType)?.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(claim.estimatedLoss)} • {formatDate(claim.incidentDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDate(claim.reportedDate)}</div>
                          <div className="text-xs text-muted-foreground">
                            {claim.status === 'approved' && claim.decisionDate && 
                              `Approved: ${formatDate(claim.decisionDate)}`
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => setShowNewClaimForm(true)} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit New Claim
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Claims by Type */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Claims by Type
                  </CardTitle>
                  <CardDescription>Distribution of claims by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claimTypes.map((type) => {
                      const typeClaims = claims.filter(c => c.claimType === type.value)
                      const totalAmount = typeClaims.reduce((sum, c) => sum + c.estimatedLoss, 0)
                      
                      if (typeClaims.length === 0) return null
                      
                      return (
                        <div key={type.value} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getClaimTypeIcon(type.value)}
                            <div>
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{typeClaims.length} claims</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatCurrency(totalAmount)}</div>
                            <div className="text-xs text-muted-foreground">Total claimed</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                <CardDescription>Common insurance-related tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => setShowNewClaimForm(true)} className="h-auto p-4 flex-col gap-2">
                    <Plus className="h-6 w-6 text-primary" />
                    <span>Submit Claim</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                    onClick={async () => {
                      const { getExportService } = await import("@/lib/export-utils")
                      const exportService = getExportService()
                      const rows = claims.map((c) => ({
                        id: c.id,
                        claimType: c.claimType,
                        amount: c.claimAmount,
                        status: c.status,
                        location: c.location,
                        description: c.description,
                        reportedDate: c.reportedDate,
                        paidAmount: c.paidAmount,
                      }))
                      await exportService.exportCustomData(rows, {
                        format: "excel",
                        filename: `grochain-insurance-claims-${new Date().toISOString().slice(0, 10)}.xlsx`,
                      })
                    }}
                  >
                    <Download className="h-6 w-6 text-success" />
                    <span>Export Claims</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                    <Link href="/dashboard/financial/insurance/policies">
                      <Eye className="h-6 w-6 text-accent" />
                      <span>View Policies</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg font-medium text-foreground">All Claims</h3>
                <p className="text-sm text-muted-foreground">Track all your insurance claims and their progress</p>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {claims
                .filter(claim => statusFilter === 'all' || claim.status === statusFilter)
                .map((claim) => (
                  <Card key={claim.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[claim.status]}>
                              {getStatusIcon(claim.status)}
                              {claim.status.replace('_', ' ').charAt(0).toUpperCase() + claim.status.replace('_', ' ').slice(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Policy: {claim.policyNumber}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Incident: {formatDate(claim.incidentDate)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getClaimTypeIcon(claim.claimType)}
                            <h4 className="font-medium text-foreground">
                              {claimTypes.find(ct => ct.value === claim.claimType)?.label}
                            </h4>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{claim.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Estimated Loss:</span>
                              <div className="font-medium">{formatCurrency(claim.estimatedLoss)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Claim Amount:</span>
                              <div className="font-medium">{formatCurrency(claim.claimAmount)}</div>
                            </div>
                            {claim.paidAmount && (
                              <div>
                                <span className="text-muted-foreground">Paid Amount:</span>
                                <div className="font-medium text-success">{formatCurrency(claim.paidAmount)}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <div className="font-medium">{claim.location}</div>
                            </div>
                          </div>
                          
                          {claim.weatherConditions && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Weather:</span>
                              <span className="ml-2 font-medium">{claim.weatherConditions}</span>
                            </div>
                          )}
                          
                          {claim.adjusterNotes && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Notes:</span>
                              <span className="ml-2 font-medium">{claim.adjusterNotes}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Docs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { getExportService } = await import("@/lib/export-utils")
                              const exportService = getExportService()
                              await exportService.exportCustomData(
                                [
                                  {
                                    id: claim.id,
                                    policyNumber: claim.policyNumber,
                                    claimType: claim.claimType,
                                    description: claim.description,
                                    claimAmount: claim.claimAmount,
                                    status: claim.status,
                                    location: claim.location,
                                    reportedDate: claim.reportedDate,
                                    paidAmount: claim.paidAmount || "",
                                  },
                                ],
                                {
                                  format: "excel",
                                  filename: `grochain-claim-${claim.id}.xlsx`,
                                }
                              )
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {claims.filter(claim => statusFilter === 'all' || claim.status === statusFilter).length === 0 && (
                <Card className="border border-border">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No claims found</h3>
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === 'all' 
                        ? "You haven't submitted any insurance claims yet."
                        : `No claims with status "${statusFilter.replace('_', ' ')}" found.`
                      }
                    </p>
                    <Button onClick={() => setShowNewClaimForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Your First Claim
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
