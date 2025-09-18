"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard as CreditCardIcon,
  Building2,
  Phone,
  RefreshCw
} from "lucide-react"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("transactions")
  const { profile } = useBuyerStore()
  const { toast } = useToast()

  // State for API data
  const [transactions, setTransactions] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch transaction history
        console.log('📊 Fetching transaction history...')
        const transactionResponse = await apiService.getTransactionHistory()
        console.log('✅ Transaction response:', transactionResponse)

        if (transactionResponse?.status === 'success' && (transactionResponse?.data as any)?.transactions) {
          setTransactions((transactionResponse.data as any).transactions)
        } else if ((transactionResponse?.data as any)?.transactions) {
          // Handle direct data structure
          setTransactions((transactionResponse.data as any).transactions)
        } else {
          console.warn('⚠️ No transaction data found in response:', transactionResponse)
          setTransactions([])
        }

        // Fetch orders for billing
        console.log('📦 Fetching orders...')
        const ordersResponse = await apiService.getUserOrders()
        console.log('✅ Orders response:', ordersResponse)

        if (ordersResponse?.status === 'success' && ordersResponse?.data) {
          // Handle the structured response from backend
          const ordersData = (ordersResponse.data as any).orders || []
          setOrders(ordersData)
        } else if (Array.isArray(ordersResponse)) {
          // Handle direct array response
          setOrders(ordersResponse)
        } else {
          console.warn('⚠️ No orders data found in response:', ordersResponse)
          setOrders([])
        }

        // Fetch payment methods
        console.log('💳 Fetching payment methods...')
        setPaymentMethodsLoading(true)
        const paymentMethodsResponse = await apiService.getPaymentMethods()
        console.log('✅ Payment methods response:', paymentMethodsResponse)

        if (paymentMethodsResponse?.status === 'success' && paymentMethodsResponse?.data) {
          setPaymentMethods(paymentMethodsResponse.data as any)
        } else if (Array.isArray(paymentMethodsResponse)) {
          // Handle direct array response
          setPaymentMethods(paymentMethodsResponse)
        } else {
          console.warn('⚠️ No payment methods data found in response:', paymentMethodsResponse)
          setPaymentMethods([])
        }
        setPaymentMethodsLoading(false)

      } catch (err: any) {
        console.error('❌ Error fetching payment data:', err)
        setError(err.message || 'Failed to load payment data')
        toast({
          title: "Error loading data",
          description: err.message || "Failed to load payment information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Refresh data function
  const refreshData = async () => {
    try {
      setLoading(true)
      setPaymentMethodsLoading(true)
      setError(null)

      const [transactionResponse, ordersResponse, paymentMethodsResponse] = await Promise.all([
        apiService.getTransactionHistory(),
        apiService.getUserOrders(),
        apiService.getPaymentMethods()
      ])

      if (transactionResponse?.success && (transactionResponse?.data as any)?.transactions) {
        setTransactions((transactionResponse.data as any).transactions)
      }

      if (ordersResponse?.success && ordersResponse?.data) {
        let ordersData = []
        if ((ordersResponse.data as any)?.data?.orders) {
          ordersData = (ordersResponse.data as any).data.orders
        } else if ((ordersResponse.data as any)?.orders) {
          ordersData = (ordersResponse.data as any).orders
        } else if (Array.isArray(ordersResponse.data)) {
          ordersData = ordersResponse.data as any
        }
        setOrders(ordersData)
      }

      if (paymentMethodsResponse?.success && paymentMethodsResponse?.data) {
        setPaymentMethods(paymentMethodsResponse.data as any)
      }

      toast({
        title: "Data refreshed",
        description: "Payment information has been updated",
      })
    } catch (err: any) {
      console.error('❌ Error refreshing data:', err)
      setError(err.message || 'Failed to refresh data')
      toast({
        title: "Refresh failed",
        description: err.message || "Failed to refresh payment data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setPaymentMethodsLoading(false)
    }
  }

  // Convert orders to billing format
  const billingHistory = orders.map((order, index) => ({
    _id: order._id || `order_${index}`,
    invoiceNumber: `INV_${order.orderNumber || order._id?.slice(-6) || index}`,
    orderNumber: order.orderNumber || order._id?.slice(-6) || `ORD_${index}`,
    amount: order.total || order.amount || 0,
    status: order.paymentStatus === 'paid' ? 'paid' :
            order.paymentStatus === 'pending' ? 'pending' :
            order.status === 'completed' ? 'paid' : 'pending',
    dueDate: order.createdAt ? new Date(Date.parse(order.createdAt) + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    issuedDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : null,
    items: order.items?.map((item: any) => ({
      name: item.listing?.cropName || item.product?.cropName || item.cropName || 'Product',
      quantity: `${item.quantity || 0}${item.unit || 'kg'}`,
      price: item.price || 0,
      total: (item.quantity || 0) * (item.price || 0)
    })) || []
  }))

  // Convert refund transactions to refund format
  const refunds = transactions
    .filter(t => t.type === 'refund')
    .map((transaction, index) => ({
      _id: transaction._id || `refund_${index}`,
      refundNumber: `REF_${transaction.reference || transaction._id?.slice(-6) || index}`,
      orderNumber: transaction.orderId || `ORD_${index}`,
      amount: transaction.amount || 0,
      reason: transaction.description || 'Refund request',
      status: transaction.status === 'successful' ? 'approved' :
              transaction.status === 'pending' ? 'pending' : 'approved',
      requestedDate: transaction.createdAt || transaction.date,
      processedDate: transaction.status === 'successful' ? transaction.createdAt : null,
      method: transaction.method || 'card',
      description: transaction.description || 'Refund processed'
    }))

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCardIcon className="h-8 w-8 text-blue-600" />
      case "bank_account":
        return <Building2 className="h-8 w-8 text-green-600" />
      case "mobile_money":
        return <Phone className="h-8 w-8 text-orange-600" />
      default:
        return <Banknote className="h-8 w-8 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
      case "paid":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "refunded":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "successful":
      case "paid":
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "refunded":
        return <ArrowDownRight className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const calculateStats = () => {
    const totalTransactions = transactions.length
    const successfulTransactions = transactions.filter(t => t.status === "successful" || t.status === "completed" || t.status === "paid").length
    const pendingTransactions = transactions.filter(t => t.status === "pending").length
    const failedTransactions = transactions.filter(t => t.status === "failed").length
    const totalAmount = transactions
      .filter(t => t.status === "successful" || t.status === "completed" || t.status === "paid")
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    return {
      total: totalTransactions,
      successful: successfulTransactions,
      pending: pendingTransactions,
      failed: failedTransactions,
      totalAmount
    }
  }

  const stats = calculateStats()

  return (
    <DashboardLayout pageTitle="Payment Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground">
              Manage your payment methods, view transactions, and handle billing
            </p>
            {error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                ⚠️ {error}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="mt-6">
            <div className="space-y-4">
              {paymentMethodsLoading ? (
                // Loading skeletons for payment methods
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-14" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No payment methods found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first payment method to start making purchases.
                  </p>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Payment Method</Button>
                </div>
              ) : (
                paymentMethods.map((method) => (
                <Card key={method._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTypeIcon(method.type)}
                        <div>
                          <h4 className="font-semibold text-foreground">{method.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {method.type === 'card' ? `**** **** **** ${method.details.last4}` : 
                               method.type === 'bank_account' ? `Bank: ${method.details.bankName} - ****${method.details.accountNumber?.slice(-4)}` :
                             method.type === 'mobile_money' ? `Phone: ${method.details.phoneNumber}` : ''}
                          </p>
                            {method.lastUsed && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last used: {formatDate(method.lastUsed)}
                              </p>
                            )}
                          </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          {method.isVerified && <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Verified</Badge>}
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
              {paymentMethods.length > 0 && (
              <Button className="w-full"><Plus className="h-4 w-4 mr-2" />Add New Method</Button>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Successful</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input placeholder="Search transactions..." className="max-w-sm" />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No transactions found</h3>
                  <p className="text-sm text-muted-foreground">
                    Your transaction history will appear here once you make purchases.
                  </p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <Card key={transaction._id || transaction.reference || `txn-${Math.random()}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">
                              {transaction.description || `Transaction ${transaction.reference || ''}`}
                            </h4>
                          <p className="text-sm text-muted-foreground">
                              {transaction.reference || transaction._id} • {transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatPrice(transaction.amount || 0)}
                          </p>
                          <Badge className={getStatusColor(transaction.status || 'pending')}>
                            {transaction.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-6">
            {/* Billing Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Orders</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold">{billingHistory.length}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Paid</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {billingHistory.filter(b => b.status === 'paid').length}
                  </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-yellow-600">
                    {billingHistory.filter(b => b.status === 'pending').length}
                  </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Billing History */}
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons for billing
                Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-7 w-24" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <div className="flex items-center space-x-2 pt-4 border-t">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-28" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No orders found</h3>
                  <p className="text-sm text-muted-foreground">
                    Your order history will appear here once you make purchases.
                  </p>
                </div>
              ) : (
                billingHistory.map((invoice) => (
                <Card key={invoice._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                          <h4 className="font-semibold text-foreground">Order #{invoice.orderNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                            Invoice: {invoice.invoiceNumber} • {invoice.issuedDate ? `Issued: ${formatDate(invoice.issuedDate)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{formatPrice(invoice.amount)}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                    
                      {/* Order Items */}
                    <div className="border-t pt-4">
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2">
                              <span className="text-sm">{item.name || 'Product'} ({item.quantity || 0})</span>
                              <span className="text-sm font-medium">{formatPrice(item.total || item.price || 0)}</span>
                        </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">No items details available</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                          View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="mt-6">
            {/* Refund Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Refunds</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold">{refunds.length}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {refunds.filter(r => r.status === 'approved').length}
                  </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                  <p className="text-2xl font-bold text-yellow-600">
                    {refunds.filter(r => r.status === 'pending').length}
                  </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Refunds List */}
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons for refunds
                Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-7 w-24" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                      <div className="mb-4 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <div className="flex items-center space-x-2 pt-4 border-t">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : refunds.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowDownRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No refunds found</h3>
                  <p className="text-sm text-muted-foreground">
                    Your refund history will appear here when refunds are processed.
                  </p>
                </div>
              ) : (
                refunds.map((refund) => (
                <Card key={refund._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-foreground">Refund #{refund.refundNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                            Order: {refund.orderNumber} • Requested: {refund.requestedDate ? formatDate(refund.requestedDate) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{formatPrice(refund.amount)}</p>
                        <Badge className={getStatusColor(refund.status)}>
                          {refund.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Reason:</p>
                      <p className="text-sm font-medium">{refund.reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">{refund.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                      {refund.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Update Request
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
