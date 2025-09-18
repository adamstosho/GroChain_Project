"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useBuyerStore, useCartInitialization } from "@/hooks/use-buyer-store"
import Link from "next/link"
import Image from "next/image"

export default function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isLoading
  } = useBuyerStore()

  // Initialize cart from localStorage
  useCartInitialization()

  const [loading, setLoading] = useState(false)
  const [currentProductData, setCurrentProductData] = useState<any>({})

  // Fetch current product data for cart items
  useEffect(() => {
    const fetchCurrentProductData = async () => {
      if (cart.length === 0) return

      try {
        console.log('🔍 Fetching current product data for cart items...')

        // Get unique listing IDs from cart
        const listingIds = [...new Set(cart.map(item => item.listingId))]
        console.log('📋 Cart listing IDs:', listingIds)

        // Fetch current data for these products
        const productPromises = listingIds.map(async (listingId) => {
          try {
            console.log(`🌐 Fetching product data for ID: ${listingId}`)
            const response = await fetch(`http://localhost:5000/api/marketplace/listings/${listingId}`)

            if (response.ok) {
              const data = await response.json()
              console.log(`✅ Product ${listingId} data:`, data)
              return { listingId, data: data.data || data }
            } else {
              console.error(`❌ Failed to fetch product ${listingId}:`, response.status, response.statusText)
              const errorText = await response.text()
              console.error(`❌ Error details:`, errorText)
            }
          } catch (error) {
            console.error(`❌ Network error fetching product ${listingId}:`, error)
          }
          return null
        })

        const results = await Promise.all(productPromises)
        const productData: any = {}

        results.forEach(result => {
          if (result) {
            productData[result.listingId] = result.data
          }
        })

        console.log('📦 Final product data:', productData)
        setCurrentProductData(productData)
      } catch (error) {
        console.error('❌ Failed to fetch current product data:', error)
      }
    }

    fetchCurrentProductData()
  }, [cart])

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 0 // Shipping calculated at checkout
  const tax = 0 // VAT removed
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

  const handleClearCart = () => {
    clearCart()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
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
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-gray-600 mb-4">Add some fresh products to get started</p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="relative h-16 w-16 rounded overflow-hidden">
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

                        <div className="flex-1">
                          <h4 className="font-semibold">{item.cropName}</h4>
                          <p className="text-sm text-gray-600">
                            {typeof item.farmer === 'object' ? item.farmer?.name || 'Unknown Farmer' : item.farmer || 'Unknown Farmer'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {typeof item.location === 'object' ? `${item.location?.city || 'Unknown'}, ${item.location?.state || 'Unknown State'}` : item.location || 'Unknown Location'}
                          </p>
                          {currentProductData[item.listingId] ? (
                            <div className="text-xs text-gray-400 mt-1">
                              {currentProductData[item.listingId].quantity <= 0 ? (
                                <span className="text-red-500 font-medium">Out of Stock</span>
                              ) : (
                                <span>
                                  {currentProductData[item.listingId].quantity} {item.unit} available
                                  {currentProductData[item.listingId].quantity < item.quantity && (
                                    <span className="text-orange-500 ml-1">(Low stock!)</span>
                                  )}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-blue-400 mt-1">
                              Loading current stock...
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (currentProductData[item.listingId]?.quantity || item.availableQuantity)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            ₦{item.price}/{item.unit}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                      <span className="text-gray-600 font-medium">Shipping</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 font-medium">Pending</span>
                        <span className="text-xs text-gray-500">⏳</span>
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
