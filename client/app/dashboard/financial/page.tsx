"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  TrendingUp,
  Shield,
  Target,
  Banknote,
  PiggyBank,
  Calculator,
  Plus,
  Eye,
  Download,
  Calendar,
  MapPin,
  Activity,
  Users,
  Building,
  Clock,
  Info,
  FileText
} from "lucide-react"
import Link from "next/link"

interface FinancialOverview {
  creditScore: number
  totalEarnings: number
  pendingPayments: number
  activeLoans: number
  insurancePolicies: number
  totalSavings: number
  financialGoals: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface RecentTransaction {
  _id: string
  type: 'income' | 'expense' | 'loan' | 'insurance'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
}

interface ActiveLoan {
  _id: string
  amount: number
  purpose: string
  duration: number
  interestRate: number
  status: string
  monthlyPayment: number
  remainingBalance: number
  nextPaymentDate: string
}

interface InsurancePolicy {
  _id: string
  type: string
  provider: string
  policyNumber: string
  coverageAmount: number
  premium: number
  startDate: string
  endDate: string
  status: string
}

export default function FinancialServicesPage() {
  const [overview, setOverview] = useState<FinancialOverview>({
    creditScore: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    activeLoans: 0,
    insurancePolicies: 0,
    totalSavings: 0,
    financialGoals: 0,
    riskLevel: 'medium'
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const { toast } = useToast()

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from backend
      const [financialResponse, farmerAnalytics] = await Promise.all([
        apiService.getFinancialDashboard(),
        apiService.getFarmerAnalytics().catch(() => ({ data: {} }))
      ])

      if (financialResponse.status === 'success' && financialResponse.data) {
        const data = financialResponse.data

        // Transform the data to match frontend interface
        const overviewData: FinancialOverview = {
          creditScore: (data as any).overview?.creditScore || 0,
          totalEarnings: (farmerAnalytics.data as any)?.totalRevenue || (data as any).overview?.totalEarnings || 0,
          pendingPayments: (data as any).overview?.pendingPayments || 0,
          activeLoans: (data as any).overview?.activeLoans || 0,
          insurancePolicies: (data as any).overview?.insurancePolicies || 0,
          totalSavings: (data as any).overview?.totalSavings || 0,
          financialGoals: (data as any).overview?.financialGoals || 0,
          riskLevel: (data as any).overview?.riskLevel || 'medium'
        }

        // Transform transactions
        const transactionsData: RecentTransaction[] = ((data as any).recentTransactions || []).map((transaction: any) => ({
          _id: transaction._id,
          type: transaction.type === 'payment' || transaction.type === 'commission' ? 'income' :
                transaction.type === 'withdrawal' ? 'expense' : transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          status: transaction.status
        }))

        // Transform active loans
        const loansData: ActiveLoan[] = ((data as any).activeLoans || []).map((loan: any) => ({
          _id: loan._id,
          amount: loan.amount,
          purpose: loan.purpose,
          duration: loan.duration,
          interestRate: loan.interestRate,
          status: loan.status,
          monthlyPayment: loan.monthlyPayment,
          remainingBalance: loan.remainingBalance,
          nextPaymentDate: loan.nextPaymentDate
        }))

        // Transform insurance policies
        const policiesData: InsurancePolicy[] = ((data as any).insurancePolicies || []).map((policy: any) => ({
          _id: policy._id,
          type: policy.type,
          provider: policy.provider,
          policyNumber: policy.policyNumber,
          coverageAmount: policy.coverageAmount,
          premium: policy.premium,
          startDate: policy.startDate,
          endDate: policy.endDate,
          status: policy.status
        }))

        setOverview(overviewData)
        setRecentTransactions(transactionsData)
        setActiveLoans(loansData)
        setInsurancePolicies(policiesData)
      } else {
        throw new Error('Failed to fetch financial data')
      }
    } catch (error: any) {
      console.error('Error fetching financial data:', error)
      toast({
        title: "Error loading financial data",
        description: error.message || "Failed to load financial dashboard data",
        variant: "destructive",
      })

      // Set empty data on error
      setOverview({
        creditScore: 0,
        totalEarnings: 0,
        pendingPayments: 0,
        activeLoans: 0,
        insurancePolicies: 0,
        totalSavings: 0,
        financialGoals: 0,
        riskLevel: 'medium'
      })
      setRecentTransactions([])
      setActiveLoans([])
      setInsurancePolicies([])
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'expense': return <Banknote className="h-4 w-4 text-red-500" />
      case 'loan': return <CreditCard className="h-4 w-4 text-blue-500" />
      case 'insurance': return <Shield className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return 'text-emerald-600'
      case 'expense': return 'text-red-600'
      case 'loan': return 'text-blue-600'
      case 'insurance': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Financial Services">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="h-6 sm:h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Financial Services">
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Financial Services</h1>
            <p className="text-sm sm:text-base text-gray-600 break-words">
              Manage your finances, loans, insurance, and financial goals
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" asChild size="sm" className="w-full xs:w-auto">
              <Link href="/dashboard/financial/loans/apply">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Apply for Loan</span>
                <span className="sm:hidden">Apply Loan</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full xs:w-auto">
              <Link href="/dashboard/financial/insurance/compare">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Get Insurance</span>
                <span className="sm:hidden">Insurance</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">Total Earnings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                ₦{(overview.totalEarnings / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">Total Savings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                ₦{(overview.totalSavings / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500">Current savings</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">Active Loans</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{overview.activeLoans}</div>
              <p className="text-xs text-gray-500">Current loans</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span className="truncate">Insurance Policies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{overview.insurancePolicies}</div>
              <p className="text-xs text-gray-500">Active policies</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-0">
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm py-2 sm:py-0">
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="loans" className="text-xs sm:text-sm py-2 sm:py-0">
              <span className="hidden sm:inline">Loans</span>
              <span className="sm:hidden">Loans</span>
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs sm:text-sm py-2 sm:py-0">
              <span className="hidden sm:inline">Insurance</span>
              <span className="sm:hidden">Insurance</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Credit Score & Risk Assessment */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                    <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="break-words">Credit Score & Risk Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Credit Score:</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{overview.creditScore}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Risk Level:</span>
                    <Badge className={getRiskLevelColor(overview.riskLevel)}>
                      {overview.riskLevel.charAt(0).toUpperCase() + overview.riskLevel.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Financial Goals:</span>
                    <span className="font-medium text-gray-900">{overview.financialGoals}</span>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">View Full Report</span>
                      <span className="sm:hidden">View Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                    <Calculator className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
                  <Button variant="outline" className="w-full justify-start" asChild size="sm">
                    <Link href="/dashboard/financial/loans/apply">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Apply for Loan</span>
                      <span className="sm:hidden">Apply Loan</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild size="sm">
                    <Link href="/dashboard/financial/insurance/compare">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Compare Insurance</span>
                      <span className="sm:hidden">Insurance</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild size="sm">
                    <Link href="/dashboard/financial/goals">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Set Financial Goals</span>
                      <span className="sm:hidden">Goals</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">Download Statement</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pending Payments */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  Pending Payments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm break-words">
                  You have ₦{overview.pendingPayments.toLocaleString()} in pending payments
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Next payment due in 5 days
                  </div>
                  <Button size="sm" className="w-full sm:w-auto">
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-3 sm:space-y-4">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                  <Activity className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  Recent Transactions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your latest financial activities
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-2 sm:space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm sm:text-base break-words">{transaction.description}</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <div className={`font-medium text-sm sm:text-base ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'expense' ? '-' : '+'}₦{transaction.amount.toLocaleString()}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 sm:pt-4">
                  <Button variant="outline" className="w-full" size="sm">
                    <span className="hidden sm:inline">View All Transactions</span>
                    <span className="sm:hidden">View All</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-3 sm:space-y-4">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                  <CreditCard className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  Active Loans
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage your current loan obligations
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-3 sm:space-y-4">
                  {activeLoans.map((loan) => (
                    <div key={loan._id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base break-words">{loan.purpose}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">Loan #{loan._id}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">
                          {loan.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <div className="font-medium break-words">₦{loan.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Monthly Payment:</span>
                          <div className="font-medium break-words">₦{loan.monthlyPayment.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining:</span>
                          <div className="font-medium break-words">₦{loan.remainingBalance.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Next Payment:</span>
                          <div className="font-medium break-words">
                            {new Date(loan.nextPaymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 pt-3">
                        <Button variant="outline" size="sm" className="w-full xs:w-auto">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                        <Button size="sm" className="w-full xs:w-auto">
                          <Banknote className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Make Payment</span>
                          <span className="sm:hidden">Pay</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 sm:pt-4">
                  <Button asChild className="w-full" size="sm">
                    <Link href="/dashboard/financial/loans/apply">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Apply for New Loan</span>
                      <span className="sm:hidden">Apply Loan</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-3 sm:space-y-4">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Insurance Policies
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your active insurance coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-3 sm:space-y-4">
                  {insurancePolicies.map((policy) => (
                    <div key={policy._id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base break-words">{policy.type}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">{policy.provider}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit">
                          {policy.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Policy #:</span>
                          <div className="font-medium break-all">{policy.policyNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Coverage:</span>
                          <div className="font-medium break-words">₦{policy.coverageAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Premium:</span>
                          <div className="font-medium break-words">₦{policy.premium.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Expires:</span>
                          <div className="font-medium break-words">
                            {new Date(policy.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 pt-3">
                        <Button variant="outline" size="sm" className="w-full xs:w-auto">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">View Policy</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button size="sm" className="w-full xs:w-auto">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">File Claim</span>
                          <span className="sm:hidden">Claim</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 sm:pt-4">
                  <Button asChild className="w-full" size="sm">
                    <Link href="/dashboard/financial/insurance/compare">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Get More Insurance</span>
                      <span className="sm:hidden">Get Insurance</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help & Resources */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Get support and learn more about our financial services
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 border border-gray-200 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Financial Advisor</h4>
                <p className="text-xs sm:text-sm text-gray-600">Get personalized financial advice</p>
              </div>
              <div className="text-center p-3 sm:p-4 border border-gray-200 rounded-lg">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Documentation</h4>
                <p className="text-xs sm:text-sm text-gray-600">Access forms and guides</p>
              </div>
              <div className="text-center p-3 sm:p-4 border border-gray-200 rounded-lg sm:col-span-2 lg:col-span-1">
                <Building className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Partner Banks</h4>
                <p className="text-xs sm:text-sm text-gray-600">Connect with our banking partners</p>
              </div>
            </div>
            <div className="flex justify-center pt-3 sm:pt-4">
              <Button variant="outline" size="sm">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Contact Support</span>
                <span className="sm:hidden">Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}



