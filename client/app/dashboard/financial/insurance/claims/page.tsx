"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Banknote,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  Upload,
  MapPin,
  Crop,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Zap
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
  documents: string[]
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
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800'
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

  useEffect(() => {
    fetchClaimsData()
  }, [])

  const fetchClaimsData = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockClaims: InsuranceClaim[] = [
        {
          id: '1',
          policyNumber: 'INS-2024-001',
          claimType: 'crop_damage',
          description: 'Heavy rainfall caused flooding in maize field, resulting in 40% crop loss',
          incidentDate: '2024-01-15',
          reportedDate: '2024-01-16',
          estimatedLoss: 150000,
          status: 'approved',
          claimAmount: 120000,
          paidAmount: 120000,
          documents: ['Photos', 'Weather Report', 'Damage Assessment'],
          location: 'North Field, Plot A',
          weatherConditions: 'Heavy rainfall, flooding',
          adjusterNotes: 'Claim approved based on weather reports and damage assessment',
          decisionDate: '2024-01-25'
        },
        {
          id: '2',
          policyNumber: 'INS-2024-002',
          claimType: 'equipment_damage',
          description: 'Tractor engine failure during harvest season',
          incidentDate: '2024-01-20',
          reportedDate: '2024-01-21',
          estimatedLoss: 80000,
          status: 'under_review',
          claimAmount: 65000,
          documents: ['Repair Estimate', 'Photos', 'Service History'],
          location: 'Main Farm',
          weatherConditions: 'Normal conditions'
        },
        {
          id: '3',
          policyNumber: 'INS-2024-003',
          claimType: 'natural_disaster',
          description: 'Drought conditions affecting cassava yield',
          incidentDate: '2024-01-10',
          reportedDate: '2024-01-12',
          estimatedLoss: 200000,
          status: 'pending',
          claimAmount: 160000,
          documents: ['Weather Data', 'Yield Comparison', 'Photos'],
          location: 'South Field, Plot B',
          weatherConditions: 'Extended drought, high temperatures'
        }
      ]

      const mockStats: ClaimStats = {
        totalClaims: 3,
        pendingClaims: 1,
        approvedClaims: 1,
        totalClaimed: 345000,
        totalPaid: 120000,
        averageProcessingTime: 7.5
      }

      setClaims(mockClaims)
      setStats(mockStats)
    } catch (error) {
      console.error("Failed to fetch claims data:", error)
      toast({
        title: "Error",
        description: "Failed to load claims data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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
      // Mock submission - replace with actual API call
      const claim: InsuranceClaim = {
        id: Date.now().toString(),
        policyNumber: newClaim.policyNumber,
        claimType: newClaim.claimType as any,
        description: newClaim.description,
        incidentDate: newClaim.incidentDate,
        reportedDate: new Date().toISOString().split('T')[0],
        estimatedLoss: newClaim.estimatedLoss,
        status: 'pending',
        claimAmount: newClaim.estimatedLoss * 0.8, // 80% of estimated loss
        documents: [],
        location: newClaim.location,
        weatherConditions: newClaim.weatherConditions
      }

      setClaims(prev => [claim, ...prev])
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
        title: "Claim Submitted! 🎉",
        description: "Your insurance claim has been submitted and is under review.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to submit claim:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit claim. Please try again.",
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

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 1000).toFixed(0)}K`
  }

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Insurance Claims">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Insurance Claims</h1>
            <p className="text-gray-600">
              Submit and track your insurance claims for farm protection
            </p>
          </div>
          
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
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalClaims}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.pendingClaims} pending
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Claimed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalClaimed)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.approvedClaims} approved
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {((stats.totalPaid / stats.totalClaimed) * 100).toFixed(1)}% of claimed
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.averageProcessingTime} days</div>
                <div className="text-sm text-gray-600 mt-1">
                  Time to decision
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Claim Form */}
        {showNewClaimForm && (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Plus className="h-4 w-4 text-blue-500" />
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
                      placeholder="e.g., INS-2024-001"
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
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Recent Claims
                  </CardTitle>
                  <CardDescription>Latest insurance claims and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claims.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
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
                          <div className="text-xs text-gray-500">
                            {formatCurrency(claim.estimatedLoss)} • {formatDate(claim.incidentDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDate(claim.reportedDate)}</div>
                          <div className="text-xs text-gray-500">
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
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <TrendingUp className="h-4 w-4 text-green-500" />
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
                        <div key={type.value} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getClaimTypeIcon(type.value)}
                            <div>
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-gray-500">{typeClaims.length} claims</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatCurrency(totalAmount)}</div>
                            <div className="text-xs text-gray-500">Total claimed</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                <CardDescription>Common insurance-related tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => setShowNewClaimForm(true)} className="h-auto p-4 flex-col gap-2">
                    <Plus className="h-6 w-6 text-blue-500" />
                    <span>Submit Claim</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Download className="h-6 w-6 text-green-500" />
                    <span>Download Forms</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Eye className="h-6 w-6 text-purple-500" />
                    <span>View Policies</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">All Claims</h3>
                <p className="text-sm text-gray-600">Track all your insurance claims and their progress</p>
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
                  <Card key={claim.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[claim.status]}>
                              {getStatusIcon(claim.status)}
                              {claim.status.replace('_', ' ').charAt(0).toUpperCase() + claim.status.replace('_', ' ').slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Policy: {claim.policyNumber}
                            </span>
                            <span className="text-sm text-gray-500">
                              Incident: {formatDate(claim.incidentDate)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getClaimTypeIcon(claim.claimType)}
                            <h4 className="font-medium text-gray-900">
                              {claimTypes.find(ct => ct.value === claim.claimType)?.label}
                            </h4>
                          </div>
                          
                          <p className="text-sm text-gray-600">{claim.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Estimated Loss:</span>
                              <div className="font-medium">{formatCurrency(claim.estimatedLoss)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Claim Amount:</span>
                              <div className="font-medium">{formatCurrency(claim.claimAmount)}</div>
                            </div>
                            {claim.paidAmount && (
                              <div>
                                <span className="text-gray-500">Paid Amount:</span>
                                <div className="font-medium text-green-600">{formatCurrency(claim.paidAmount)}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <div className="font-medium">{claim.location}</div>
                            </div>
                          </div>
                          
                          {claim.weatherConditions && (
                            <div className="text-sm">
                              <span className="text-gray-500">Weather:</span>
                              <span className="ml-2 font-medium">{claim.weatherConditions}</span>
                            </div>
                          )}
                          
                          {claim.adjusterNotes && (
                            <div className="text-sm">
                              <span className="text-gray-500">Notes:</span>
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
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {claims.filter(claim => statusFilter === 'all' || claim.status === statusFilter).length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
                    <p className="text-gray-600 mb-4">
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
      </div>
    </DashboardLayout>
  )
}
