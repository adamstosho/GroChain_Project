"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useExportService } from "@/lib/export-utils"
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Eye,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Minus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  User,
  Package,
  Shield
} from "lucide-react"

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer' | 'refund'
  category: string
  amount: number
  currency: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  reference: string
  source: 'marketplace' | 'loan' | 'insurance' | 'transfer' | 'other'
  metadata?: {
    harvestId?: string
    buyerName?: string
    cropType?: string
    quantity?: number
    location?: string
  }
}

interface TransactionStats {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  transactionCount: number
  pendingAmount: number
  monthlyTrend: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
}

const transactionTypes = [
  { value: 'all', label: 'All Transactions' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'refund', label: 'Refunds' }
]

const transactionSources = [
  { value: 'all', label: 'All Sources' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'loan', label: 'Loans' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'other', label: 'Other' }
]

const transactionStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'all',
    source: 'all',
    status: 'all',
    dateRange: '30d',
    search: ''
  })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const { toast } = useToast()
  const exportService = useExportService()

  useEffect(() => {
    fetchTransactions()
  }, [filters, sortBy, sortOrder, currentPage])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend APIs
      const [transactionHistoryResponse, financialDashboardResponse] = await Promise.all([
        apiService.getTransactionHistory(),
        apiService.getFinancialDashboard()
      ])

      if (transactionHistoryResponse.status === 'success' && transactionHistoryResponse.data) {
        const transactionsData = (transactionHistoryResponse.data as any).transactions || []

        // Transform transactions data
        const transformedTransactions: Transaction[] = transactionsData.map((txn: any) => ({
          id: txn._id || txn.id,
          type: txn.type === 'payment' || txn.type === 'commission' ? 'income' :
                txn.type === 'withdrawal' ? 'expense' : txn.type,
          category: txn.category || txn.type,
          amount: txn.amount,
          currency: txn.currency || 'NGN',
          description: txn.description,
          date: txn.createdAt || txn.date,
          status: txn.status,
          reference: txn.reference,
          source: txn.source || (txn.type === 'payment' ? 'marketplace' :
                   txn.type === 'commission' ? 'marketplace' :
                   txn.type === 'withdrawal' ? 'other' : 'other'),
          metadata: txn.metadata || {}
        }))

        setTransactions(transformedTransactions)

        // Calculate stats from real data
        const incomeTransactions = transformedTransactions.filter(t => t.type === 'income' && t.status === 'completed')
        const expenseTransactions = transformedTransactions.filter(t => t.type === 'expense' && t.status === 'completed')
        const pendingTransactions = transformedTransactions.filter(t => t.status === 'pending')

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
        const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0)

        // Group by month for trend analysis
        const monthlyData = transformedTransactions.reduce((acc: any, txn) => {
          const date = new Date(txn.date)
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          if (!acc[monthKey]) {
            acc[monthKey] = { income: 0, expenses: 0, net: 0 }
          }

          if (txn.type === 'income' && txn.status === 'completed') {
            acc[monthKey].income += txn.amount
          } else if (txn.type === 'expense' && txn.status === 'completed') {
            acc[monthKey].expenses += txn.amount
          }

          acc[monthKey].net = acc[monthKey].income - acc[monthKey].expenses

          return acc
        }, {})

        const monthlyTrend = Object.entries(monthlyData)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([month, data]: [string, any]) => ({
            month,
            income: data.income,
            expenses: data.expenses,
            net: data.net
          }))

        const stats: TransactionStats = {
          totalIncome,
          totalExpenses,
          netAmount: totalIncome - totalExpenses,
          transactionCount: transformedTransactions.length,
          pendingAmount,
          monthlyTrend
        }

        setStats(stats)
      } else {
        // Fallback to dashboard data if transaction history fails
        if (financialDashboardResponse.status === 'success' && financialDashboardResponse.data) {
          const dashboardData = financialDashboardResponse.data
          const recentTransactions = (dashboardData as any).recentTransactions || []

          const transformedTransactions: Transaction[] = recentTransactions.map((txn: any) => ({
            id: txn._id,
            type: txn.type === 'payment' || txn.type === 'commission' ? 'income' :
                  txn.type === 'withdrawal' ? 'expense' : txn.type,
            category: txn.type,
            amount: txn.amount,
            currency: 'NGN',
            description: txn.description,
            date: txn.date,
            status: txn.status,
            reference: `TXN-${txn._id}`,
            source: txn.type === 'payment' ? 'marketplace' : 'other',
            metadata: {}
          }))

          setTransactions(transformedTransactions)

          // Basic stats from dashboard
          const stats: TransactionStats = {
            totalIncome: (dashboardData as any).overview?.totalEarnings || 0,
            totalExpenses: 0, // Not available in dashboard
            netAmount: (dashboardData as any).overview?.totalEarnings || 0,
            transactionCount: recentTransactions.length,
            pendingAmount: (dashboardData as any).overview?.pendingPayments || 0,
            monthlyTrend: []
          }

          setStats(stats)
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    await exportService.exportTransactions(filters, 'csv')
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
      case 'expense': return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'transfer': return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      case 'refund': return <ArrowDownLeft className="h-4 w-4 text-purple-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'marketplace': return <Package className="h-4 w-4 text-blue-500" />
      case 'loan': return <CreditCard className="h-4 w-4 text-green-500" />
      case 'insurance': return <Shield className="h-4 w-4 text-purple-500" />
      case 'transfer': return <ArrowUpRight className="h-4 w-4 text-indigo-500" />
      default: return <Banknote className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false
    if (filters.source !== 'all' && transaction.source !== filters.source) return false
    if (filters.status !== 'all' && transaction.status !== filters.status) return false
    if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Transaction]
    let bValue: any = b[sortBy as keyof Transaction]
    
    if (sortBy === 'date') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)

  if (loading) {
    return (
      <DashboardLayout pageTitle="Transactions">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <DashboardLayout pageTitle="Transactions">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            <p className="text-gray-600">
              View and manage your financial transaction history
            </p>
          </div>
          
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Transaction Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ₦{(stats.totalIncome / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600">+12.5% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₦{(stats.totalExpenses / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">-8.2% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Net Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₦{(stats.netAmount / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600">+18.7% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  ₦{(stats.pendingAmount / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600">1 transaction pending</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-medium">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
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
                    {transactionStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Transaction History</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transactions found
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Date
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        Amount
                        {sortBy === 'amount' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <Badge variant="outline" className="capitalize">
                            {transaction.type}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          {transaction.metadata && (
                            <div className="text-xs text-gray-500 mt-1">
                              {transaction.metadata.cropType && `${transaction.metadata.cropType} - ${transaction.metadata.quantity}kg`}
                              {transaction.metadata.buyerName && ` • Buyer: ${transaction.metadata.buyerName}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(transaction.source)}
                          <span className="text-sm text-gray-600 capitalize">
                            {transaction.source}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{transaction.currency}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(transaction.status)} variant="outline">
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
