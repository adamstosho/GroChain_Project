"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display, Text } from "@/components/ui/typography"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import { useToast } from "@/hooks/use-toast"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  ShoppingCart,
  Calendar,
  Leaf,
  User,
  Package,
  Truck,
  Shield,
  RefreshCw,
  Minus,
  Plus
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProductDetail {
  _id: string
  cropName?: string
  name?: string // Alternative field name
  category?: string
  description?: string
  basePrice?: number
  price?: number // Alternative field name
  quantity?: number
  unit?: string
  availableQuantity?: number
  location?: {
    city?: string
    state?: string
    country?: string
  }
  images?: string[]
  tags?: string[]
  status?: 'active' | 'inactive' | 'sold_out'
  createdAt?: string
  updatedAt?: string
  farmer?: {
    _id?: string
    name?: string // API might use different field names
    firstName?: string
    lastName?: string
    phoneNumber?: string
    email?: string
    farmLocation?: string
  }
  harvestDate?: string
  qualityGrade?: string
  organic?: boolean
  certification?: string[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { addToCart, fetchFavorites, addToFavorites, removeFromFavorites, cart } = useBuyerStore()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const productId = params.productId as string

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching product details for ID:', productId)

      // Get the specific product details using the dedicated API endpoint
      const response = await apiService.getProductDetails(productId)

      console.log('📦 Product detail response:', response)

      // The API response structure might be different
      // Let's check both response.data and response.data.data
      const dataRec = asRecord(response.data)
      const productData = (dataRec.data && typeof dataRec.data === "object" ? dataRec.data : response.data) as ProductDetail

      if (productData && productData._id) {
        console.log('✅ Product found:', productData.cropName || productData.name)
        setProduct(productData)

        // Check if product is in favorites
        try {
          console.log('🔍 Product detail: Fetching favorites...')
          // Use the new API method that handles user ID automatically
          const userFavorites = await apiService.getFavorites()
          console.log('📦 Product detail: Favorites response:', userFavorites)

          // Handle the new API response structure: { status: 'success', data: { favorites: [...] } }
          let favoritesData: unknown[] = []
          const favPayload = asRecord(userFavorites.data)
          const favRoot = asRecord(userFavorites)
          if (Array.isArray(favPayload.favorites)) {
            favoritesData = favPayload.favorites
          } else if (Array.isArray(userFavorites.data)) {
            favoritesData = userFavorites.data
          } else if (Array.isArray(favRoot.favorites)) {
            favoritesData = favRoot.favorites
          }

          console.log('📋 Product detail: Favorites data structure:', favoritesData)
          console.log('📋 Product detail: Is array?', Array.isArray(favoritesData))

          if (Array.isArray(favoritesData)) {
            const isFav = favoritesData.some((fav) => {
              const rec = asRecord(fav)
              const listing = asRecord(rec.listing)
              return rec.listingId === productId ||
                listing._id === productId ||
                rec._id === productId
            })
            setIsFavorite(isFav || false)
            console.log('💝 Product detail: Favorites status:', isFav, 'Favorites count:', favoritesData.length)
          } else {
            console.warn('⚠️ Product detail: Favorites data is not an array:', typeof favoritesData)
            setIsFavorite(false)
          }
        } catch (favError: unknown) {
          console.error('❌ Product detail: Could not fetch favorites:', favError)
          const favRec = asRecord(favError)
          console.error('Error details:', asRecord(favRec.response).data || getErrorMessage(favError))
          // Don't show error for favorites - it's not critical functionality
          setIsFavorite(false)
        }
      } else {
        console.error('❌ Product data not found in response:', response)
        setError("Product not found")
      }
    } catch (err: unknown) {
      console.error('❌ Failed to fetch product detail:', err)

      // More detailed error logging
      const errRec = asRecord(err)
      const response = asRecord(errRec.response)
      const responseData = asRecord(response.data)
      if (errRec.response) {
        console.error('Error response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        })
        const status = typeof response.status === "number" ? response.status : "unknown"
        setError(`Server Error (${status}): ${typeof responseData.message === "string" ? responseData.message : getErrorMessage(err)}`)
      } else if (errRec.request) {
        console.error('Network error - no response received:', errRec.request)
        setError("Network error: Unable to connect to server. Please ensure the backend server is running.")
      } else {
        console.error('Request setup error:', getErrorMessage(err))
        setError(getErrorMessage(err, "Failed to load product details"))
      }
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProductDetail()
    fetchFavorites()
  }, [productId, fetchProductDetail, fetchFavorites])

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setIsAddingToCart(true)

      // Create a properly formatted cart item that matches the expected structure
      const cartItem = {
        id: product._id,
        listingId: product._id,
        cropName: product.cropName || product.name || 'Unknown Product',
        quantity: quantity,
        unit: product.unit || 'unit',
        price: product.basePrice || product.price || 0,
        total: (product.basePrice || product.price || 0) * quantity,
        farmer: product.farmer?.name || `${product.farmer?.firstName || ''} ${product.farmer?.lastName || ''}`.trim() || 'Unknown Farmer',
        location: product.location ? `${product.location.city || 'Unknown'}, ${product.location.state || 'Unknown'}` : 'Unknown Location',
        image: (product.images && product.images.length > 0) ? product.images[0] : "/placeholder.svg",
        availableQuantity: product.availableQuantity || 0
      }

      await addToCart(cartItem, quantity)

      toast({
        title: "Added to Cart",
        description: `${quantity} ${product.unit || 'unit'} of ${product.cropName || product.name || 'product'} added to your cart`,
      })

      // Update quantity to show current cart state
      const existingCartItem = cart.find(item => item.id === product._id)
      if (existingCartItem) {
        setQuantity(existingCartItem.quantity + quantity)
      }
    } catch (error: unknown) {
      console.error('Failed to add to cart:', error)
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to add item to cart"),
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!product) return

    try {
      if (isFavorite) {
        // Use the buyer store method which handles user ID properly
        await removeFromFavorites(product._id)
        setIsFavorite(false)
        toast({
          title: "Removed from Favorites",
          description: `${product.cropName || product.name || 'Product'} removed from your favorites`,
        })
      } else {
        // Use the buyer store method which handles user ID properly
        await addToFavorites(product._id, `Interested in ${product.cropName || product.name || 'product'}`)
        setIsFavorite(true)
        toast({
          title: "Added to Favorites",
          description: `${product.cropName || product.name || 'Product'} added to your favorites`,
        })
      }
    } catch (error: unknown) {
      console.error('Failed to toggle favorite:', error)
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update favorites"),
        variant: "destructive",
      })
    }
  }

  const incrementQuantity = () => {
    if (product && quantity < (product.availableQuantity || 0)) {
      setQuantity(prev => prev + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Skeleton className="w-full h-96 rounded-lg mb-4" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-20 h-20 rounded" />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <Display as="h1" variant="page" className="mb-2">
                {error || "Product Not Found"}
              </Display>
              <p className="text-muted-foreground">
                The product you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/dashboard/products">
                  Browse Products
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const cartItem = cart.find(item => item.id === product._id)
  const currentCartQuantity = cartItem ? cartItem.quantity : 0

  return (
    <DashboardLayout>
      <DashboardPageShell className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={(product.images && product.images.length > 0) ? product.images[selectedImage] : "/placeholder.svg"}
                  alt={product.cropName || 'Product image'}
                  fill
                  className="object-cover"
                  priority
                />
                {product.status !== 'active' && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="text-sm">
                      {product.status === 'sold_out' ? 'Sold Out' : 'Inactive'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${selectedImage === index ? 'border-success' : 'border-border'
                        }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.cropName} ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Display as="h1" variant="page" className="mb-2">
                      {product.cropName || product.name || 'Product Name'}
                    </Display>
                    <div className="flex items-center gap-2 mb-2">
                      {product.category && <Badge variant="secondary">{product.category}</Badge>}
                      {product.qualityGrade && (
                        <Badge variant="outline">{product.qualityGrade}</Badge>
                      )}
                      {product.organic && (
                        <Badge variant="outline" className="text-success border-success">
                          <Leaf className="h-3 w-3 mr-1" />
                          Organic
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                    className={isFavorite ? "text-destructive" : "text-muted-foreground"}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? 'text-warning fill-current' : 'text-muted-foreground'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(0 reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <Text as="span" variant="price" className="text-success">
                  ₦{(product.basePrice || product.price || 0).toLocaleString()}
                </Text>
                <span className="text-lg text-muted-foreground">
                  per {product.unit || 'unit'}
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {(product.availableQuantity || 0).toLocaleString()} {product.unit || 'unit'} available
                </span>
                {currentCartQuantity > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {currentCartQuantity} in cart
                  </Badge>
                )}
              </div>

              {/* Location */}
              {product.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {product.location.city || 'Unknown City'}, {product.location.state || 'Unknown State'}
                    {product.location.country && `, ${product.location.country}`}
                  </span>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 min-w-12 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={incrementQuantity}
                      disabled={quantity >= (product.availableQuantity || 0)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Max: {product.availableQuantity || 0}
                  </span>
                </div>

                {/* Total Price */}
                <div className="text-lg font-semibold">
                  Total: ₦{((product.basePrice || product.price || 0) * quantity).toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.status !== 'active' || (product.availableQuantity || 0) === 0}
                  className="flex-1"
                  size="lg"
                >
                  {isAddingToCart ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>

              {/* Farmer Information */}
              {product.farmer && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Farmer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="font-medium">
                      {product.farmer.name || `${product.farmer.firstName || ''} ${product.farmer.lastName || ''}`.trim() || 'Unknown Farmer'}
                    </div>
                    {product.farmer.farmLocation && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {product.farmer.farmLocation}
                      </div>
                    )}
                    {product.farmer.phoneNumber && (
                      <div className="text-sm text-muted-foreground">
                        Phone: {product.farmer.phoneNumber}
                      </div>
                    )}
                    {product.farmer.email && (
                      <div className="text-sm text-muted-foreground">
                        Email: {product.farmer.email}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Product Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || `Fresh ${product.cropName || product.name || 'product'} harvested and ready for delivery. This product meets quality standards and is sourced directly from verified farmers.`}
                  </p>
                </div>

                {product.harvestDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Harvested on: {new Date(product.harvestDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {product.certification && product.certification.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success" />
                    <span className="text-sm">
                      Certifications: {product.certification.join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="font-medium">Fast Delivery</h3>
                    <p className="text-sm text-muted-foreground">Delivered within 24-48 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">Quality Assured</h3>
                    <p className="text-sm text-muted-foreground">Verified and tested products</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Leaf className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="font-medium">Fresh Produce</h3>
                    <p className="text-sm text-muted-foreground">Direct from farm to you</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
