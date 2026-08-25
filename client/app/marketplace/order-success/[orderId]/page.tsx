"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Package, Truck, Clock, MapPin, Phone, Copy, ArrowRight, ShoppingBag, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { usePaymentVerification } from "@/hooks/use-payment-verification"
import Link from "next/link"
import Image from "next/image"

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
  paymentReference?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
    phone: string
  }
  orderNumber?: string
  createdAt: string
  estimatedDelivery?: string
}

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  const orderId = params.orderId as string
  const paymentMethod = searchParams.get('payment_method') || 'paystack'

  // Generate order number if not available
  const orderNumber = order?.orderNumber || `ORD-${orderId?.slice(-6)?.toUpperCase() || 'UNKNOWN'}`

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Payment verification hook
  const { 
    isVerifying, 
    isVerified, 
    error: verificationError, 
    verifyPayment 
  } = usePaymentVerification({
    reference: order?.paymentReference || '',
    orderId: orderId,
    autoVerify: !!order?.paymentReference && order?.paymentStatus !== 'paid',
    verifyInterval: order?.paymentStatus === 'paid' ? 0 : 15000,
  })

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return

      try {
        setLoading(true)
        console.log('📦 Fetching order details for success page:', orderId)

        const response = await apiService.getOrder(orderId)

        if (response && response.status === 'success' && response.data) {
          setOrder(response.data as any)
          console.log('✅ Order details loaded for success page:', response.data)

          // Start countdown for auto-redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
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

  // Trigger payment verification when order is loaded and has payment reference
  useEffect(() => {
    if (order && order.paymentReference && !isVerified && !isVerifying) {
      console.log('🔄 Triggering payment verification for order:', order._id)
      verifyPayment()
    }
  }, [order, isVerified, isVerifying, verifyPayment])

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown === 0 && order) {
      router.push(`/dashboard/orders/${orderId}`)
    }
  }, [countdown, order, orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-success/10 border-t-success mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Loading order confirmation...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your order details.</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-6">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-3">Unable to load order</h2>
            <p className="text-muted-foreground mb-6">{error || 'Order not found'}</p>
          </div>
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/marketplace">Return to Marketplace</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Successful! 🎉
          </h1>

          <p className="text-lg text-muted-foreground mb-6">
            Thank you for your purchase! Your payment has been processed successfully.
          </p>

          {/* Payment Verification Status */}
          {order?.paymentReference && (
            <div className="bg-primary/10 border border-primary/10 rounded-lg p-4 max-w-md mx-auto mb-6">
              {isVerifying && (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/10 border-t-primary"></div>
                  <p className="text-primary font-medium">Verifying payment...</p>
                </div>
              )}
              {isVerified && (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="text-success font-medium">✅ Payment verified successfully!</p>
                </div>
              )}
              {verificationError && (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive font-medium">❌ Payment verification failed</p>
                </div>
              )}
            </div>
          )}

          {/* Order Number */}
          <div className="bg-white border border-border rounded-lg p-6 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-bold text-foreground">{orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(orderNumber, 'Order number')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-success" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.listing.images?.[0] || "/placeholder.svg"}
                        alt={item.listing.cropName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{item.listing.cropName}</h4>
                      <p className="text-sm text-muted-foreground">by {item.listing.farmer.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} {item.unit}</p>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">₦{item.total.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">₦{item.price.toLocaleString()}/{item.unit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator className="my-4" />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground">Subtotal</span>
                    <span className="font-medium">₦{order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.shipping > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-foreground">Shipping</span>
                      <span className="font-medium">₦{order.shipping.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-success font-medium">Shipping</span>
                      <span className="text-success font-medium">FREE</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between py-2 bg-success/10 rounded-lg px-4">
                    <span className="font-bold text-lg text-foreground">Total</span>
                    <span className="font-bold text-xl text-success">₦{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Delivery Address
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-1">
                    <p className="font-medium text-foreground">{order.shippingAddress.street}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Delivery Timeline
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-success/10 text-success border-success/10"
                    >
                      {order.status === 'paid' ? 'Processing' : order.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">Estimated delivery:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.estimatedDelivery
                          ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : '3-5 business days'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-primary/10 border-primary/10">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">Order Processing</p>
                    <p className="text-sm text-primary">Your order is being processed and prepared for shipment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">Shipping Updates</p>
                    <p className="text-sm text-primary">You'll receive email and SMS updates about your shipment status. Track your shipment in real-time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Truck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">Delivery</p>
                    <p className="text-sm text-primary">Your order will be delivered to the address provided.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-redirect Notice */}
          <Card className="bg-warning/10 border-warning/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <p className="text-warning font-medium">
                    Auto-redirecting to order details in <strong className="text-warning">{countdown}</strong> seconds...
                  </p>
                </div>
                <p className="text-sm text-warning">
                  Or click the button below to view your order details now.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="flex items-center gap-2">
              <Link href={`/dashboard/orders/${orderId}`}>
                <Package className="h-4 w-4" />
                View Order Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
              <Link href="/marketplace">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}