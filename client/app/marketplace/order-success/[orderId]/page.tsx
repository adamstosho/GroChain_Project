"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Package, Truck, Clock, MapPin, Phone, Copy, ArrowRight, ShoppingBag, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import { usePaymentVerification } from "@/hooks/use-payment-verification"
import { ConfettiBurst } from "@/components/motion/confetti-burst"
import { GroChainLoader } from "@/components/ui/grochain-loader"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import Link from "next/link"
import Image from "next/image"
import { Display, Text } from "@/components/ui/typography"
import { PageContainer } from "@/components/layout/page-container"
import { layout } from "@/lib/design-system"

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
  const [celebrate, setCelebrate] = useState(false)

  const orderId = params.orderId as string
  const paymentMethod = searchParams.get('payment_method') || 'paystack'
  const isPaymentPending = paymentMethod === 'bank_transfer' || paymentMethod === 'cash'

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
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Payment verification hook (autoVerify handles the initial + interval verify)
  const { 
    isVerifying, 
    isVerified, 
    error: verificationError
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
          setOrder(response.data as unknown as Order)
          setCelebrate(true)
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
      } catch (error: unknown) {
        console.error('❌ Failed to fetch order details:', error)
        const message = getErrorMessage(error, "Failed to load order details")
        setError(message)
        toast({
          title: "Failed to load order",
          description: getErrorMessage(error, "Please try again later."),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, toast])

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown === 0 && order) {
      router.push(`/dashboard/orders/${orderId}`)
    }
  }, [countdown, order, orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <GroChainLoader message="Loading order confirmation…" variant="inline" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-6">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <Display as="h2" variant="card" className="mb-3">Unable to load order</Display>
            <Text variant="sm" className="mb-6">{error || 'Order not found'}</Text>
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
      <ConfettiBurst active={celebrate && !isPaymentPending} />
      <PageContainer className={`max-w-4xl py-8 ${layout.stackMd}`}>
        {/* Success Header */}
        <StaggerContainer className="text-center mb-8">
          <StaggerItem>
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <CheckCircle className="h-8 w-8 text-success" />
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <Display as="h1" variant="page" className="mb-4">
              {isPaymentPending ? "Order Placed!" : "Payment Successful!"}
            </Display>
          </StaggerItem>

          <StaggerItem>
            <Text variant="lead" className="mb-6 max-w-2xl mx-auto">
            {isPaymentPending
              ? paymentMethod === 'bank_transfer'
                ? "Thank you for your order! Please complete your bank transfer using the details below — your order will be processed once payment is confirmed."
                : "Thank you for your order! Please have the payment ready — you'll pay in cash when your order is delivered."
              : "Thank you for your purchase! Your payment has been processed successfully."}
            </Text>
          </StaggerItem>

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
                  <p className="text-success font-medium">Payment verified successfully!</p>
                </div>
              )}
              {verificationError && (
                <div className="flex items-center justify-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive font-medium">Payment verification failed</p>
                </div>
              )}
            </div>
          )}

          {/* Order Number */}
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption">Order Number</Text>
                <Text as="div" variant="stat" className="text-foreground">{orderNumber}</Text>
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
        </StaggerContainer>

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
                    <Text as="span" variant="price">₦{order.total.toLocaleString()}</Text>
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
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">Order Processing</p>
                    <p className="text-sm text-primary">Your order is being processed and prepared for shipment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">Shipping Updates</p>
                    <p className="text-sm text-primary">You'll receive email and SMS updates about your shipment status. Track your shipment in real-time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
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
            <Button
              size="lg"
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  const response = await apiService.downloadOrderReceipt(orderId)
                  const rec = asRecord(response)
                  const receiptData = rec.data ?? response
                  const { ReceiptGenerator } = await import("@/lib/receipt-generator")
                  await ReceiptGenerator.generatePDF(receiptData as unknown as import("@/lib/receipt-generator").ReceiptData)
                } catch (e: unknown) {
                  toast({
                    title: "Receipt unavailable",
                    description: getErrorMessage(e, "Could not generate receipt yet."),
                    variant: "destructive",
                  })
                }
              }}
            >
              Download Receipt
            </Button>
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
      </PageContainer>
    </div>
  )
}