"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { useAuthStore } from "@/lib/auth"
import { getTokenFromStorage } from "@/lib/auth-storage"
import { ArrowLeft, CreditCard, MapPin, Phone, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { getErrorMessage } from "@/lib/error-utils"
import type { Order as ApiOrder } from "@/lib/types"
import { processOrderPayment, loadPaystackScript } from "@/lib/paystack"
import { processFlutterwaveOrderPayment, loadFlutterwaveScript } from "@/lib/flutterwave"
import { calculateShippingCost, unitToKg, SHIPPING_METHODS, type ShippingLocation } from "@/lib/shipping-calculator"
import Link from "next/link"
import Image from "next/image"

// Listing location is stored as a free-text string like "City, State, Country".
// Falls back to "Unknown" rather than a specific city so shipping estimates
// don't silently misrepresent a farmer's real location.
function parseSellerLocation(location: unknown): ShippingLocation {
  if (typeof location === "string" && location.trim()) {
    const parts = location.split(",").map(part => part.trim())
    return {
      city: parts[0] || "Unknown City",
      state: parts[1] || "Unknown State",
      country: parts[2] || "Nigeria",
    }
  }
  if (location && typeof location === "object") {
    const loc = location as { city?: string; state?: string; country?: string }
    return {
      city: loc.city || "Unknown City",
      state: loc.state || "Unknown State",
      country: loc.country || "Nigeria",
    }
  }
  return { city: "Unknown City", state: "Unknown State", country: "Nigeria" }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, clearCart, hasHydrated, setHasHydrated } = useBuyerStore()
  const { user } = useAuthStore()

  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("paystack")
  const [shippingMethod, setShippingMethod] = useState("road_standard")
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    notes: "",
  })
  const [mounted, setMounted] = useState(false)
  // Reused across retries (cancel/fail/script-error then "Place Order" again) so a single
  // checkout attempt can't pile up multiple unpaid orders for the same cart.
  // Ref is the source of truth (survives double-click before React re-renders).
  const pendingOrderRef = useRef<{ id: string; signature: string } | null>(null)
  const processingRef = useRef(false)
  const creatingOrderRef = useRef(false)

  // Handle hydration and cart initialization
  useEffect(() => {
    setMounted(true)
    if (useBuyerStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }

    const token = getTokenFromStorage()
    if (!token || token === 'undefined') {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      })
      router.push('/login?redirect=/marketplace/checkout')
    }
  }, [router, toast, setHasHydrated])

  // Pre-fill user data when available
  useEffect(() => {
    if (user && mounted) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }))
    }
  }, [user, mounted])

  // Ensure payment scripts are loaded
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      
      // Load Paystack script
      loadPaystackScript()
        .catch(error => {
          console.warn('⚠️ Paystack script loading failed:', error.message)
        })

      // Load Flutterwave script
      loadFlutterwaveScript()
        .catch(error => {
          console.warn('⚠️ Flutterwave script loading failed:', error.message)
        })
    }
  }, [mounted])

  // Redirect if cart is empty (only on client after mount)
  useEffect(() => {
    if (mounted && hasHydrated && cart.length === 0) {
      router.push('/marketplace')
    }
  }, [cart, router, mounted, hasHydrated])

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }))
  }

  const getOrderSignature = () =>
    JSON.stringify({
      cart: cart.map((item) => ({ id: item.listingId || item.id, qty: item.quantity, price: item.price })),
      shippingInfo,
      shippingMethod,
      paymentMethod,
    })

  // Stable key for the same cart/shipping/payment across tabs and retries.
  // Server scopes uniqueness per buyer, so the hash alone is enough.
  const buildIdempotencyKey = async (signature: string) => {
    const input = `${user?.id || user?._id || 'anon'}:${signature}`
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
        const hex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        return `ord_${hex.slice(0, 48)}`
      }
    } catch {
      // fall through to sync hash
    }
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i)
      hash |= 0
    }
    return `ord_${Math.abs(hash).toString(36)}_${input.length}`
  }

  // Creates an order, or reuses the one from a previous attempt in this same session if
  // nothing about the cart/shipping/payment method has changed since — avoids leaving a
  // trail of duplicate unpaid orders when a user cancels/fails and retries.
  // Also sends Idempotency-Key so multi-tab / concurrent creates return the same order.
  const getOrCreateOrder = async (orderData: Partial<ApiOrder> & Record<string, unknown>) => {
    const signature = getOrderSignature()
    const existing = pendingOrderRef.current
    if (existing && existing.signature === signature) {
      return { _id: existing.id }
    }

    // Another create is already in flight for this session — wait briefly for it
    // rather than opening a second unpaid order.
    if (creatingOrderRef.current) {
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 50))
        const waited = pendingOrderRef.current
        if (waited && waited.signature === signature) {
          return { _id: waited.id }
        }
        if (!creatingOrderRef.current) break
      }
      const afterWait = pendingOrderRef.current
      if (afterWait && afterWait.signature === signature) {
        return { _id: afterWait.id }
      }
      // Still in flight after wait — do not start a second create
      if (creatingOrderRef.current) {
        throw new Error('Order creation already in progress. Please wait a moment and try again.')
      }
    }

    creatingOrderRef.current = true
    try {
      const again = pendingOrderRef.current
      if (again && again.signature === signature) {
        return { _id: again.id }
      }

      const idempotencyKey = await buildIdempotencyKey(signature)
      const orderResponse = await apiService.createOrder(orderData, { idempotencyKey })
      if (!orderResponse || orderResponse.status !== 'success' || !orderResponse.data) {
        throw new Error(orderResponse?.message || 'Failed to create order')
      }

      const order = orderResponse.data
      pendingOrderRef.current = { id: order._id, signature }
      return order
    } finally {
      creatingOrderRef.current = false
    }
  }

  const clearPendingOrder = () => {
    pendingOrderRef.current = null
  }

  const handlePlaceOrder = async () => {
    if (processingRef.current) return
    processingRef.current = true
    try {
      setProcessing(true)

      // Validate cart data
      if (!cart || cart.length === 0) {
        throw new Error('Your cart is empty. Please add items before checkout.')
      }

      // Validate cart items have required fields
      for (const item of cart) {
        if (!item.listingId && !item.id) {
          throw new Error('Some cart items are missing required information. Please refresh and try again.')
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Invalid quantity in cart. Please check your items.')
        }
        if (!item.price || item.price <= 0) {
          throw new Error('Invalid price in cart. Please refresh and try again.')
        }
      }

      // Validate required shipping information
      if (!shippingInfo.fullName || !shippingInfo.phone ||
          !shippingInfo.address || !shippingInfo.city || !shippingInfo.state) {
        throw new Error('Please fill in all required shipping information fields.')
      }

      // Validate phone format (basic validation for Nigerian numbers)
      const phoneRegex = /^(\+234|0)[789]\d{9}$/
      if (!phoneRegex.test(shippingInfo.phone)) {
        throw new Error('Please enter a valid Nigerian phone number.')
      }

      // Basic validation - just check that fields are not empty
      if (!shippingInfo.address.trim()) {
        throw new Error('Please enter your address.')
      }
      
      if (!shippingInfo.city.trim()) {
        throw new Error('Please enter your city.')
      }
      
      if (!shippingInfo.state.trim()) {
        throw new Error('Please enter your state.')
      }

      // Handle different payment methods
      if (paymentMethod === 'paystack') {
        await handlePaystackPayment()
      } else if (paymentMethod === 'flutterwave') {
        await handleFlutterwavePayment()
      } else if (paymentMethod === 'bank_transfer') {
        await handleBankTransferOrder()
      } else if (paymentMethod === 'cash') {
        await handleCashOnDeliveryOrder()
      } else {
        throw new Error('Please select a valid payment method.')
      }

    } catch (error: unknown) {
      console.error("Failed to place order:", error)
      toast({
        title: "Failed to place order",
        description: getErrorMessage(error, "Please try again later."),
        variant: "destructive",
      })
    } finally {
      processingRef.current = false
      setProcessing(false)
    }
  }

  const handleFlutterwavePayment = async () => {
    try {
      // First, create the order
      const orderData = {
        items: cart.map((item) => ({
          listing: item.listingId || item.id,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        shippingAddress: {
          street: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: "Nigeria",
          phone: shippingInfo.phone
        },
        deliveryInstructions: shippingInfo.notes,
        paymentMethod: paymentMethod,
        notes: shippingInfo.notes,
        shipping: shipping, // Include calculated shipping cost
        shippingMethod: shippingMethod // Include selected shipping method
      }


      const order = await getOrCreateOrder(orderData)

      // Now initialize Flutterwave payment

      const paymentResult = await processFlutterwaveOrderPayment(
        order._id,
        total, // Use the calculated total
        shippingInfo.email,
        // Success callback
        async () => {
          toast({
            title: "Payment successful!",
            description: "Your payment has been processed. Redirecting to order confirmation...",
          })

          // Clear cart after successful payment
          clearCart()
          clearPendingOrder()

          // Force refresh of marketplace products by clearing cache
          try {
            // Clear any cached product data
            if (typeof window !== 'undefined') {
              // Force a hard refresh of the marketplace page data
              localStorage.setItem('marketplace_refresh_needed', 'true')
            }
          } catch {
            // ignore — refresh flag is best-effort
          }


          // Redirect to order success page first
          setTimeout(() => {
            router.push(`/marketplace/order-success/${order._id}`)
          }, 2000)
        },
        // Close callback
        () => {
          toast({
            title: "Payment cancelled",
            description: "You cancelled the payment. Your order has been saved and you can pay later.",
            variant: "destructive",
          })
        }
      )

      // Handle payment result
      if (paymentResult.status === 'failed') {
        throw new Error('Flutterwave payment failed. Please try again.')
      }

    } catch (error: unknown) {
      console.error('❌ Flutterwave payment error:', error)
      throw error
    }
  }

  const handlePaystackPayment = async () => {
    try {
      // First, create the order
      const orderData = {
        items: cart.map((item) => ({
          listing: item.listingId || item.id,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        shippingAddress: {
          street: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: "Nigeria",
          phone: shippingInfo.phone
        },
        deliveryInstructions: shippingInfo.notes,
        paymentMethod: paymentMethod,
        notes: shippingInfo.notes,
        shipping: shipping, // Include calculated shipping cost
        shippingMethod: shippingMethod // Include selected shipping method
      }


      const order = await getOrCreateOrder(orderData)

      // Now initialize Paystack payment

      const paymentResult = await processOrderPayment(
        order._id,
        total, // Use the calculated total
        shippingInfo.email,
        // Success callback
        async () => {
          toast({
            title: "Payment successful!",
            description: "Your payment has been processed. Redirecting to order confirmation...",
          })

          // Clear cart after successful payment
          clearCart()
          clearPendingOrder()

          // Force refresh of marketplace products by clearing cache
          try {
            // Clear any cached product data
            if (typeof window !== 'undefined') {
              // Force a hard refresh of the marketplace page data
              localStorage.setItem('marketplace_refresh_needed', 'true')
            }
          } catch {
            // ignore — refresh flag is best-effort
          }


          // Redirect to order success page first
          setTimeout(() => {
            router.push(`/marketplace/order-success/${order._id}`)
          }, 2000)
        },
        // Close callback
        () => {
          toast({
            title: "Payment cancelled",
            description: "You cancelled the payment. Your order has been saved and you can pay later.",
            variant: "destructive",
          })
        }
      )

      // Handle payment result
      if (paymentResult.status === 'failed') {
        throw new Error('Payment failed. Please try again.')
      }

    } catch (error: unknown) {
      console.error('❌ Paystack payment error:', error)
      throw error
    }
  }

  const handleBankTransferOrder = async () => {
    const orderData = {
      items: cart.map((item) => ({
        listing: item.listingId || item.id,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit
      })),
      shippingAddress: {
        street: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: "Nigeria",
        phone: shippingInfo.phone
      },
      deliveryInstructions: shippingInfo.notes,
      paymentMethod: paymentMethod,
      notes: shippingInfo.notes,
      shipping,
      shippingMethod
    }

    // Same reuse path as card checkout — prevents duplicate unpaid orders on retry/double-click
    const order = await getOrCreateOrder(orderData)

    toast({
      title: "Order created successfully!",
      description: "Please make bank transfer to the provided account details. Your order will be processed once payment is confirmed.",
    })

    clearCart()
    clearPendingOrder()
    router.push(`/marketplace/order-success/${order._id}?payment_method=bank_transfer`)
  }

  const handleCashOnDeliveryOrder = async () => {
    const orderData = {
      items: cart.map((item) => ({
        listing: item.listingId || item.id,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit
      })),
      shippingAddress: {
        street: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: "Nigeria",
        phone: shippingInfo.phone
      },
      deliveryInstructions: shippingInfo.notes,
      paymentMethod: paymentMethod,
      notes: shippingInfo.notes,
      shipping,
      shippingMethod
    }

    const order = await getOrCreateOrder(orderData)

    toast({
      title: "Order created successfully!",
      description: "You will pay cash upon delivery. Your order will be processed shortly.",
    })

    clearCart()
    clearPendingOrder()
    router.push(`/marketplace/order-success/${order._id}?payment_method=cash`)
  }

  // Calculate totals (matching backend calculations)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Real physical weight, converting each item's actual unit (bags, tons,
  // kg, etc.) to kg — a "bag" and a "piece" are not both 1kg, so this must
  // match the backend's per-item unit conversion, not just sum quantities.
  const cartWeightKg = cart.reduce((sum, item) => sum + unitToKg(item.quantity, item.unit), 0)

  // Calculate shipping cost based on location and method
  const calculateShippingCostForOrder = () => {
    if (!shippingInfo.city || !shippingInfo.state || cart.length === 0) {
      return 0
    }

    // Derive the seller's origin from the first cart item's actual listing
    // location rather than assuming a single city — sellers list from across Nigeria.
    const sellerLocation: ShippingLocation = parseSellerLocation(cart[0]?.location)

    const buyerLocation: ShippingLocation = {
      city: shippingInfo.city,
      state: shippingInfo.state,
      country: "Nigeria"
    }

    const shippingCalculation = calculateShippingCost(
      sellerLocation,
      buyerLocation,
      cartWeightKg,
      shippingMethod
    )

    return shippingCalculation.totalCost
  }

  const shipping = calculateShippingCostForOrder()
  const tax = 0 // VAT removed
  const total = subtotal + shipping

  // Show loading state only after component has mounted and cart is empty
  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10" suppressHydrationWarning>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted animate-pulse rounded"></div>
              <div className="h-96 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10" suppressHydrationWarning>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-muted animate-pulse rounded"></div>
                <div className="h-48 bg-muted animate-pulse rounded"></div>
                <div className="h-32 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="h-96 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/marketplace/cart" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground block">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-11 px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors"
                    />
                    {user?.name && (
                      <p className="text-xs text-success mt-1">
                        Using your registered name
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      readOnly
                      className="w-full h-11 px-4 py-3 bg-muted border border-border rounded-md cursor-not-allowed text-muted-foreground"
                      placeholder="Your registered email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Using your registered email address
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground block">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full h-11 px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors"
                  />
                  {user?.phone && (
                    <p className="text-xs text-success mt-1">
                      Using your registered phone number
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-foreground block">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter your full address"
                    className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-foreground block">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter your city"
                      className="w-full h-11 px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-foreground block">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="Enter your state"
                      className="w-full h-11 px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-foreground block">
                    Delivery Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={shippingInfo.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any special delivery instructions"
                    className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-success focus:border-success transition-colors resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  {SHIPPING_METHODS.map((method) => {
                    const sellerLocation = parseSellerLocation(cart[0]?.location)
                    const methodCost = calculateShippingCost(
                      sellerLocation,
                      { city: shippingInfo.city || sellerLocation.city, state: shippingInfo.state || sellerLocation.state, country: "Nigeria" },
                      cartWeightKg,
                      method.id
                    )

                    return (
                      <div key={method.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-muted-foreground">{methodCost.estimatedDays} day{methodCost.estimatedDays > 1 ? 's' : ''} delivery</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-success">₦{methodCost.totalCost.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">~{methodCost.distance}km</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                {shippingInfo.city && shippingInfo.state && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/10 rounded-md">
                    <p className="text-sm text-primary">
                      <strong>Shipping Estimate:</strong><br/>
                      From: {parseSellerLocation(cart[0]?.location).city}, {parseSellerLocation(cart[0]?.location).state}<br/>
                      To: {shippingInfo.city}, {shippingInfo.state}<br/>
                      Weight: {cartWeightKg.toLocaleString()}kg<br/>
                      Est. road distance: ~{calculateShippingCost(
                        parseSellerLocation(cart[0]?.location),
                        { city: shippingInfo.city, state: shippingInfo.state, country: "Nigeria" },
                        cartWeightKg,
                        shippingMethod
                      ).distance}km
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Paystack (Recommended)</p>
                          <p className="text-sm text-muted-foreground">Pay securely with card, bank transfer, or USSD</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <RadioGroupItem value="flutterwave" id="flutterwave" />
                    <Label htmlFor="flutterwave" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">Flutterwave</p>
                          <p className="text-sm text-muted-foreground">Pay with card, mobile money, or bank transfer</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Direct Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">Transfer directly to our account</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded overflow-hidden">
                        <Image
                          src={
                            item.image || "/placeholder.svg?height=48&width=48&query=agricultural product"
                          }
                          alt={item.cropName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.cropName}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} {item.unit}</p>
                      </div>
                      <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>

                  {/* Estimated shipping cost — the backend recomputes the
                      authoritative charge from the same model at order
                      creation, so this may shift slightly by a few naira. */}
                  <div className="flex justify-between">
                    <span>Shipping (estimated)</span>
                    <span>₦{shipping.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT</span>
                    <span>₦{tax.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={processing || !mounted || (mounted && cart.length === 0) || !shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
