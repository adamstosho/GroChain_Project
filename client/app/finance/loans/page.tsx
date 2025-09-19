"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Calendar, Banknote, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { apiService } from "@/lib/api"
import Link from "next/link"

interface Loan {
  id: string
  amount: number
  purpose: string
  interestRate: number
  term: number
  status: "pending" | "approved" | "rejected" | "active" | "completed"
  appliedDate: string
  approvedDate?: string
  monthlyPayment?: number
  remainingBalance?: number
  nextPaymentDate?: string
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchLoans()
  }, [searchQuery, statusFilter])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter === "all" ? "" : statusFilter,
      })

      const response: any = await apiService.getLoanApplications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery,
      })
      const apps = response?.data?.applications || response?.applications || []
      setLoans(apps.map((a: any) => ({
        id: a._id || a.id,
        amount: a.amount,
        purpose: a.purpose,
        interestRate: a.interestRate,
        term: a.term,
        status: a.status === 'submitted' ? 'pending' : a.status,
        appliedDate: a.submittedAt || a.createdAt,
        approvedDate: a.approvedAt,
        monthlyPayment: a.monthlyPayment,
        remainingBalance: a.remainingBalance,
        nextPaymentDate: a.nextPaymentDate,
      })))
    } catch (error) {
      console.error("Failed to fetch loans:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
      case "active":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Loans & Credit</h1>
            <p className="text-gray-600">Manage your loan applications and active loans</p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/finance/loans/apply" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Apply for Loan
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search loans by purpose or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loans List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <Card key={loan.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">₦{loan.amount.toLocaleString()}</h3>
                        <Badge className={getStatusColor(loan.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(loan.status)}
                            {loan.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{loan.purpose}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied: {new Date(loan.appliedDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          {loan.interestRate}% interest
                        </div>
                        <span>{loan.term} months term</span>
                      </div>
                    </div>

                    {loan.status === "active" && (
                      <div className="lg:w-64">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Remaining Balance</span>
                            <span className="font-semibold">₦{loan.remainingBalance?.toLocaleString()}</span>
                          </div>
                          <Progress
                            value={((loan.amount - (loan.remainingBalance || 0)) / loan.amount) * 100}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Monthly: ₦{loan.monthlyPayment?.toLocaleString()}</span>
                            <span>
                              Next: {loan.nextPaymentDate && new Date(loan.nextPaymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/finance/loans/${loan.id}`}>View Details</Link>
                      </Button>
                      {loan.status === "active" && (
                        <Button size="sm" asChild>
                          <Link href={`/finance/loans/${loan.id}/payment`}>Make Payment</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loans.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Banknote className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600 mb-4">Start by applying for your first agricultural loan</p>
            <Button asChild>
              <Link href="/finance/loans/apply">Apply for Loan</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
