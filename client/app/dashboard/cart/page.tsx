"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display } from "@/components/ui/typography"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, hasHydrated, setHasHydrated } = useBuyerStore()
  const router = useRouter()

  useEffect(() => {
    if (useBuyerStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
  }, [setHasHydrated])

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.total ?? item.price * item.quantity), 0)
  const shipping = 0 // Shipping calculated at checkout
  const tax = 0 // VAT removed
  const total = subtotal + shipping

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      return
    }

    // Navigate to checkout page
    router.push('/marketplace/checkout')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!hasHydrated) {
    return (
      <DashboardLayout pageTitle="Shopping Cart">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="h-16 w-16 bg-muted animate-pulse rounded-full mb-4" />
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </div>
      </DashboardLayout>
    )
  }

  if (cart.length === 0) {
    return (
      <DashboardLayout pageTitle="Shopping Cart">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <Display as="h2" variant="card" className="mb-2">Your cart is empty</Display>
          <p className="text-muted-foreground mb-6">
            Start shopping to add products to your cart
          </p>
          <Button asChild>
            <Link href="/dashboard/products">
              Browse Products
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Shopping Cart">
      <DashboardPageShell>
        <DashboardPageHeader
          badge="Cart Active"
          title="Shopping"
          titleHighlight="Cart"
          description="Review your items and proceed to checkout."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {cart.map((item) => {
              const farmerName =
                typeof item.farmer === "object"
                  ? item.farmer?.name || "Unknown Farmer"
                  : item.farmer || "Unknown Farmer"
              const locationLabel =
                typeof item.location === "object"
                  ? `${item.location?.city || "Unknown"}, ${item.location?.state || "Unknown State"}`
                  : item.location || "Unknown Location"
              const lineTotal = item.total ?? item.price * item.quantity

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.cropName}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {item.cropName}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              Farmer: {farmerName}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              Location: {locationLabel}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                              {formatPrice(item.price)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              per {item.unit}
                            </div>
                          </div>
                        </div>

                        {/* Quantity + line total */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1
                                  updateCartQuantity(
                                    item.id,
                                    Math.max(1, Math.min(value, item.availableQuantity))
                                  )
                                }}
                                className="h-8 w-12 sm:w-16 shrink-0 text-center px-1"
                                min="1"
                                max={item.availableQuantity}
                                aria-label="Quantity"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.availableQuantity}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              of {item.availableQuantity} {item.unit} available
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <div className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                              {formatPrice(lineTotal)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                              aria-label={`Remove ${item.cropName} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 min-w-0">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0">Items ({totalItems})</span>
                    <span className="text-right whitespace-nowrap">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0">Shipping</span>
                    <span className="text-right whitespace-nowrap">{shipping === 0 ? 'Pending' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="shrink-0">Tax</span>
                    <span className="text-right whitespace-nowrap">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between gap-3 font-semibold">
                      <span className="shrink-0">Total</span>
                      <span className="text-lg text-primary text-right whitespace-nowrap">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                </Button>

                <div className="text-center">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/dashboard/products">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardPageShell>
    </DashboardLayout>
  )
}

