"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Banknote,
  Calendar,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Calculator,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  term: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
  submittedDate: string
  decisionDate?: string
  monthlyPayment: number
  interestRate: number
  description: string
  collateral?: string
  documents: string[]
}

interface ActiveLoan {
  id: string
  applicationId: string
  amount: number
  remainingBalance: number
  monthlyPayment: number
  nextPaymentDate: string
  totalPayments: number
  remainingPayments: number
  interestRate: number
  startDate: string
  endDate: string
  status: 'active' | 'overdue' | 'completed'
}

interface LoanStats {
  totalApplications: number
  approvedLoans: number
  totalBorrowed: number
  totalRepaid: number
  activeLoans: number
  averageInterestRate: number
  totalMonthlyPayments: number
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800'
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  active: TrendingUp,
  completed: CheckCircle,
  overdue: AlertCircle
}

export default function LoansPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
  const [stats, setStats] = useState<LoanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchLoansData()
  }, [])

  const fetchLoansData = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend APIs
      const [applicationsResponse, financialDashboardResponse] = await Promise.all([
        apiService.getLoanApplications(),
        apiService.getFinancialDashboard()
      ])

      if (applicationsResponse.status === 'success' && applicationsResponse.data) {
        const applicationsData = (applicationsResponse.data as any).applications || applicationsResponse.data || []

        // Transform applications data
        const transformedApplications: LoanApplication[] = applicationsData.map((app: any) => ({
          id: app._id || app.id,
          amount: app.amount || app.loanAmount,
          purpose: app.purpose,
          term: app.term || app.duration,
          status: app.status,
          submittedDate: app.submittedAt || app.createdAt,
          decisionDate: app.approvedAt,
          monthlyPayment: app.monthlyPayment || (app.amount && app.term ? Math.round(app.amount / app.term) : 0),
          interestRate: app.interestRate || 15,
          description: app.description || '',
          collateral: app.collateral || '',
          documents: app.documents || []
        }))

        setApplications(transformedApplications)
      }

      if (financialDashboardResponse.status === 'success' && financialDashboardResponse.data) {
        const dashboardData = financialDashboardResponse.data

        // Transform active loans data
        const transformedActiveLoans: ActiveLoan[] = ((dashboardData as any).activeLoans || []).map((loan: any) => ({
          id: loan._id,
          applicationId: loan.applicationId || loan._id,
          amount: loan.amount,
          remainingBalance: loan.remainingBalance,
          monthlyPayment: loan.monthlyPayment,
          nextPaymentDate: loan.nextPaymentDate,
          totalPayments: loan.totalPayments || 0,
          remainingPayments: loan.remainingPayments || 0,
          interestRate: loan.interestRate,
          startDate: loan.startDate || loan.createdAt,
          endDate: loan.endDate,
          status: loan.status
        }))

        // Calculate stats from real data
        const stats: LoanStats = {
          totalApplications: (applicationsResponse.data as any)?.applications?.length || 0,
          approvedLoans: (applicationsResponse.data as any)?.applications?.filter((app: any) => app.status === 'approved').length || 0,
          totalBorrowed: transformedActiveLoans.reduce((sum, loan) => sum + loan.amount, 0),
          totalRepaid: transformedActiveLoans.reduce((sum, loan) => sum + (loan.amount - loan.remainingBalance), 0),
          activeLoans: transformedActiveLoans.length,
          averageInterestRate: transformedActiveLoans.length > 0
            ? transformedActiveLoans.reduce((sum, loan) => sum + loan.interestRate, 0) / transformedActiveLoans.length
            : 0,
          totalMonthlyPayments: transformedActiveLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0)
        }

        setActiveLoans(transformedActiveLoans)
        setStats(stats)
      }
    } catch (error) {
      console.error("Failed to fetch loans data:", error)
      toast({
        title: "Error",
        description: "Failed to load loans data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchLoansData()
    toast({
      title: "Refreshed",
      description: "Loans data has been updated.",
      variant: "default"
    })
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || Clock
    return <IconComponent className="h-4 w-4" />
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
      <DashboardLayout pageTitle="Loans">
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
    <DashboardLayout pageTitle="Loans">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Loan Management</h1>
            <p className="text-gray-600">
              Track your loan applications and manage active loans
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/dashboard/financial/loans/apply">
                <Plus className="h-4 w-4 mr-2" />
                Apply for Loan
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.approvedLoans} approved
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Borrowed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBorrowed)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.activeLoans} active loans
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Repaid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRepaid)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {((stats.totalRepaid / stats.totalBorrowed) * 100).toFixed(1)}% of total
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMonthlyPayments)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.averageInterestRate}% avg rate
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="active">Active Loans</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Latest loan applications and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[app.status]}>
                              {getStatusIcon(app.status)}
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium mt-1">{app.purpose}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(app.amount)} • {app.term} months
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDate(app.submittedDate)}</div>
                          <div className="text-xs text-gray-500">
                            {app.status === 'approved' && app.decisionDate && 
                              `Approved: ${formatDate(app.decisionDate)}`
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/dashboard/financial/loans/apply">
                        <Plus className="h-4 w-4 mr-2" />
                        Apply for New Loan
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Loans Summary */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    Active Loans Summary
                  </CardTitle>
                  <CardDescription>Current loan obligations and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeLoans.length > 0 ? (
                    <div className="space-y-3">
                      {activeLoans.map((loan) => (
                        <div key={loan.id} className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium">Loan #{loan.id}</div>
                            <Badge className={statusColors[loan.status]}>
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remaining Balance:</span>
                              <span className="font-medium">{formatCurrency(loan.remainingBalance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Monthly Payment:</span>
                              <span className="font-medium">{formatCurrency(loan.monthlyPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Next Payment:</span>
                              <span className="font-medium">{formatDate(loan.nextPaymentDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No active loans</p>
                      <p className="text-xs text-gray-500 mt-1">Apply for a loan to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                <CardDescription>Common loan-related tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                    <Link href="/dashboard/financial/loans/apply">
                      <Plus className="h-6 w-6 text-blue-500" />
                      <span>Apply for Loan</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Calculator className="h-6 w-6 text-green-500" />
                    <span>Loan Calculator</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Download className="h-6 w-6 text-purple-500" />
                    <span>Download Statement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Loan Applications</h3>
                <p className="text-sm text-gray-600">Track all your loan applications and their status</p>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {applications
                .filter(app => statusFilter === 'all' || app.status === statusFilter)
                .map((app) => (
                  <Card key={app.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[app.status]}>
                              {getStatusIcon(app.status)}
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Submitted: {formatDate(app.submittedDate)}
                            </span>
                            {app.decisionDate && (
                              <span className="text-sm text-gray-500">
                                Decision: {formatDate(app.decisionDate)}
                              </span>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">{app.purpose}</h4>
                            <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <div className="font-medium">{formatCurrency(app.amount)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Term:</span>
                              <div className="font-medium">{app.term} months</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Monthly Payment:</span>
                              <div className="font-medium">{formatCurrency(app.monthlyPayment)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Interest Rate:</span>
                              <div className="font-medium">{app.interestRate}%</div>
                            </div>
                          </div>
                          
                          {app.collateral && (
                            <div className="text-sm">
                              <span className="text-gray-500">Collateral:</span>
                              <span className="ml-2 font-medium">{app.collateral}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {app.status === 'approved' && (
                            <Button size="sm">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Accept Loan
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600 mb-4">
                      {statusFilter === 'all' 
                        ? "You haven't submitted any loan applications yet."
                        : `No applications with status "${statusFilter}" found.`
                      }
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/financial/loans/apply">
                        <Plus className="h-4 w-4 mr-2" />
                        Apply for Your First Loan
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Active Loans Tab */}
          <TabsContent value="active" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Active Loans</h3>
              <p className="text-sm text-gray-600">Manage your current loan obligations and payments</p>
            </div>

            {activeLoans.length > 0 ? (
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <Card key={loan.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[loan.status]}>
                              {getStatusIcon(loan.status)}
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">Loan #{loan.id}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-gray-500">Original Amount:</span>
                              <div className="font-medium">{formatCurrency(loan.amount)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Remaining Balance:</span>
                              <div className="font-medium text-lg">{formatCurrency(loan.remainingBalance)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Monthly Payment:</span>
                              <div className="font-medium">{formatCurrency(loan.monthlyPayment)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Interest Rate:</span>
                              <div className="font-medium">{loan.interestRate}%</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-gray-500">Next Payment:</span>
                              <div className="font-medium">{formatDate(loan.nextPaymentDate)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Payments Made:</span>
                              <div className="font-medium">{loan.totalPayments}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Remaining Payments:</span>
                              <div className="font-medium">{loan.remainingPayments}</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">End Date:</span>
                              <div className="font-medium">{formatDate(loan.endDate)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button size="sm">
                            <Banknote className="h-4 w-4 mr-2" />
                            Make Payment
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Statement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Loans</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any active loans at the moment.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/financial/loans/apply">
                      <Plus className="h-4 w-4 mr-2" />
                      Apply for a Loan
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
