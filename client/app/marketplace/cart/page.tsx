"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { apiService } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"

export default function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    hasHydrated,
    setHasHydrated,
  } = useBuyerStore()

  const [currentProductData, setCurrentProductData] = useState<any>({})

  useEffect(() => {
    if (useBuyerStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
  }, [setHasHydrated])

  useEffect(() => {
    const fetchCurrentProductData = async () => {
      if (cart.length === 0) return

      try {
        const listingIds = [...new Set(cart.map((item) => item.listingId).filter(Boolean))]
        const results = await Promise.all(
          listingIds.map(async (listingId) => {
            try {
              const response = await apiService.getListing(String(listingId))
              return { listingId, data: (response as any).data || response }
            } catch (error) {
              console.error(`Failed to fetch product ${listingId}:`, error)
              return null
            }
          })
        )

        const productData: any = {}
        results.forEach((result) => {
          if (result) productData[result.listingId] = result.data
        })
        setCurrentProductData(productData)
      } catch (error) {
        console.error("Failed to fetch current product data:", error)
      }
    }

    fetchCurrentProductData()
  }, [cart])

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 0 // VAT removed
  const total = subtotal + shipping

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateCartQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId)
  }

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/marketplace" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Shopping Cart ({cart.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground mb-4">Add some fresh products to get started</p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const farmerName =
                        typeof item.farmer === "object"
                          ? item.farmer?.name || "Unknown Farmer"
                          : item.farmer || "Unknown Farmer"
                      const locationLabel =
                        typeof item.location === "object"
                          ? `${item.location?.city || "Unknown"}, ${item.location?.state || "Unknown State"}`
                          : item.location || "Unknown Location"
                      const stock = currentProductData[item.listingId]

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded sm:h-16 sm:w-16">
                              <Image
                                src={
                                  item.image ||
                                  "/placeholder.svg?height=64&width=64&query=agricultural product"
                                }
                                alt={item.cropName}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold truncate">{item.cropName}</h4>
                              <p className="text-sm text-muted-foreground truncate">{farmerName}</p>
                              <p className="text-sm text-muted-foreground truncate">{locationLabel}</p>
                              {stock ? (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {stock.quantity <= 0 ? (
                                    <span className="font-medium text-destructive">Out of Stock</span>
                                  ) : (
                                    <span>
                                      {stock.quantity} {item.unit} available
                                      {stock.quantity < item.quantity && (
                                        <span className="ml-1 text-warning">(Low stock!)</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-primary">Loading current stock...</div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 shrink-0 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={
                                  item.quantity >=
                                  (currentProductData[item.listingId]?.quantity || item.availableQuantity)
                                }
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold whitespace-nowrap">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground whitespace-nowrap">
                                ₦{item.price}/{item.unit}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                              aria-label={`Remove ${item.cropName} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>

                  {/* Only show shipping when there's a cost */}
                  {shipping > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₦{shipping.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Show pending shipping indicator */}
                  {shipping === 0 && subtotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Shipping</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground font-medium">Pending</span>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/marketplace/checkout">Proceed to Checkout</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
