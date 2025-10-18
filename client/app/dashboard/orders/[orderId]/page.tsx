"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Package, Truck, CheckCircle, Clock, CreditCard, MapPin, Phone, Mail, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import { ShipmentTrackingWidget } from "@/components/shipment/shipment-tracking-widget"

interface OrderItem {
  listing: {
    _id: string
    cropName: string
    images?: string[]
    farmer: {
      name: string
      email: string
    }
  }
  quantity: number
  price: number
  unit: string
  total: number
}

interface Order {
  _id: string
  buyer: {
    name: string
    email: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
    phone: string
  }
  deliveryInstructions?: string
  createdAt: string
  updatedAt: string
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)

  const orderId = params.orderId as string
  const paymentMethod = searchParams.get('payment_method')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return

      try {
        setLoading(true)
        console.log('📦 Fetching order details for:', orderId)

        const response = await apiService.getOrder(orderId)

        if (response && response.status === 'success' && response.data) {
          setOrder(response.data as any)
          console.log('✅ Order details loaded:', response.data)
          console.log('📦 Order shipping data:', {
            shipping: response.data.shipping,
            shippingMethod: response.data.shippingMethod,
            subtotal: response.data.subtotal,
            total: response.data.total
          })
        } else {
          throw new Error(response?.message || 'Failed to fetch order details')
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch order details:', error)
        setError(error.message || 'Failed to load order details')
        toast({
          title: "Failed to load order",
          description: error.message || "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, toast])

  // Auto-sync order status when coming back from payment or when order remains pending
  useEffect(() => {
    if (!orderId) return
    if (syncing) return

    const fromPayment = searchParams.get('from_payment') === 'true'
    const paymentRef = searchParams.get('payment_ref')
    const shouldSync = fromPayment || !!paymentRef || (order && order.paymentStatus === 'pending')

    if (!shouldSync || hasSynced) return

    const syncNow = async () => {
      try {
        setSyncing(true)
        console.log('🔄 Syncing order status for order:', orderId)
        
        try {
          const syncRes = await apiService.syncOrderStatus(orderId)
          console.log('✅ Sync response:', syncRes)
        } catch (syncError) {
          console.log('⚠️ Sync endpoint failed, continuing with refetch:', syncError)
          // Don't fail completely if sync endpoint has issues
        }

        // Always try to refetch order details to get latest status
        const refreshed = await apiService.getOrder(orderId)
        if (refreshed && refreshed.status === 'success' && refreshed.data) {
          setOrder(refreshed.data as any)
          if ((refreshed.data as any).paymentStatus === 'paid' || (refreshed.data as any).status === 'paid') {
            toast({
              title: 'Payment Confirmed',
              description: 'Your order has been marked as paid.',
            })
          }
        }
      } catch (e) {
        console.log('ℹ️ Order sync process failed:', e)
      } finally {
        setSyncing(false)
        setHasSynced(true)
      }
    }

    // Small delay to allow backend/webhook to finish if just returned from payment
    const delay = fromPayment ? 1200 : 0
    const timer = setTimeout(syncNow, delay)
    return () => clearTimeout(timer)
  }, [orderId, order, searchParams, syncing, hasSynced, toast])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <Package className="h-4 w-4" />
      case 'paid': return <CreditCard className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
                <div className="h-32 sm:h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-red-600 text-base sm:text-lg">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <p className="text-gray-600 text-sm sm:text-base">
              {error || "We couldn't find the order you're looking for."}
            </p>
            <Button onClick={() => router.push('/dashboard/orders')} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              View All Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-full overflow-hidden">
        <Button variant="ghost" asChild className="mb-4 sm:mb-6 h-8 sm:h-9 text-xs sm:text-sm">
          <Link href="/dashboard/orders" className="flex items-center gap-1 sm:gap-2">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">Order #{order._id.slice(-8)}</span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Badge className={`${getStatusColor(order.status)} text-xs`}>
                      <span className="hidden sm:inline">{getStatusIcon(order.status)}</span>
                      <span className="sm:ml-1">{order.status}</span>
                    </Badge>
                    <Badge className={`${getPaymentStatusColor(order.paymentStatus)} text-xs`}>
                      <span className="hidden sm:inline"><CreditCard className="h-3 w-3 mr-1" /></span>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{order.paymentMethod}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.listing.images?.[0] || "/placeholder.svg?height=64&width=64&query=agricultural product"}
                        alt={item.listing.cropName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h4 className="font-medium text-sm sm:text-base truncate">{item.listing.cropName}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">by {item.listing.farmer.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Qty: {item.quantity} {item.unit} × ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="font-medium text-sm sm:text-base">₦{(item.total).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bank Transfer Instructions (if applicable) */}
            {paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-orange-800 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Bank Transfer Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Bank Details:</h4>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span>Bank Name:</span>
                        <span className="font-mono break-all">Access Bank</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span>Account Name:</span>
                        <span className="font-mono break-all">GroChain Nigeria Ltd</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span>Account Number:</span>
                        <span className="font-mono break-all">1234567890</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span>Amount:</span>
                        <span className="font-mono font-bold break-all">₦{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Important:</strong> Please include your order number #{order._id.slice(-8)} in the transfer description.
                      Your order will be processed once payment is confirmed (usually within 1-2 business days).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary & Shipping */}
          <div className="space-y-4 sm:space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span className="font-medium">₦{order.subtotal.toLocaleString()}</span>
                </div>

                {/* Show shipping cost */}
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="truncate">Shipping {order.shippingMethod ? `(${order.shippingMethod.replace('_', ' ')})` : ''}</span>
                  <span className="font-medium">₦{(order.shipping || 0).toLocaleString()}</span>
                </div>

                <Separator />
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>₦{order.total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{order.buyer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{order.buyer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{order.shippingAddress.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm sm:text-base">
                    <p className="break-words">{order.shippingAddress.street}</p>
                    <p className="break-words">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p className="break-words">{order.shippingAddress.country}</p>
                  </div>
                </div>
                {order.deliveryInstructions && (
                  <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium mb-1">Delivery Instructions:</p>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{order.deliveryInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipment Tracking */}
            {order.status === 'shipped' || order.status === 'delivered' ? (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    Shipment Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ShipmentTrackingWidget orderId={orderId} />
                </CardContent>
              </Card>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              {order.paymentStatus === 'pending' && order.paymentMethod === 'paystack' && (
                <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm" onClick={() => {
                  // TODO: Implement retry payment
                  toast({
                    title: "Payment retry",
                    description: "Payment retry functionality will be implemented soon.",
                  })
                }}>
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Retry Payment
                </Button>
              )}

              <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm" asChild>
                <Link href="/dashboard/orders">
                  View All Orders
                </Link>
              </Button>

              <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm" asChild>
                <Link href="/marketplace">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
