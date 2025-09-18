"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Eye, ShoppingCart } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface MarketplaceProduct {
  id: string
  name: string
  category: string
  description: string
  price: number
  unit: string
  location: string
  images: string[]
  rating: number
  farmerName: string
  farmerId: string
  quantity: number
  availableQuantity: number
  quality: string
  organic: boolean
  tags: string[]
  createdAt: string
  qrCode?: string
}

export function MarketplacePreview() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMarketplaceListings({
        limit: 6,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      const listings = (response.data as any)?.listings || []

      // Convert backend format to frontend format
      const convertedProducts = listings.slice(0, 6).map((listing: any) => ({
        id: listing._id,
        name: listing.cropName,
        category: listing.category,
        description: listing.description,
        price: listing.basePrice,
        unit: listing.unit,
        location: listing.location,
        images: listing.images || [],
        rating: listing.rating || 4.5,
        farmerName: listing.farmer?.name || 'Local Farmer',
        farmerId: listing.farmer?._id || 'unknown',
        quantity: listing.quantity,
        availableQuantity: listing.availableQuantity,
        quality: listing.qualityGrade,
        organic: listing.organic,
        tags: listing.tags || [],
        createdAt: listing.createdAt,
        qrCode: listing.qrCode
      }))

      setProducts(convertedProducts)
    } catch (error) {
      console.error("Failed to fetch featured products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (productId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    toast({
      title: "Redirecting to Marketplace",
      description: "Please visit the marketplace to add items to cart.",
    })
    router.push('/marketplace')
  }

  const handleViewProduct = (productId: string) => {
    router.push(`/marketplace/products/${productId}`)
  }

  const handleTestQR = (product: MarketplaceProduct) => {
    const qrCode = product.qrCode || (product as any).qrCode
    if (typeof qrCode === 'string' && qrCode.trim()) {
      router.push(`/verify/${qrCode}`)
    } else {
      toast({
        title: "QR Code Not Available",
        description: "This product doesn't have a QR code yet.",
        variant: "destructive",
      })
    }
  }

  return (
    <section id="marketplace" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Fresh Products from Verified Farmers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Discover high-quality agricultural products directly from trusted farmers.
            Browse, verify authenticity, and purchase with confidence.
          </p>
          <Button asChild size="lg">
            <Link href="/marketplace">
              View All Products
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-1/4" />
                </CardContent>
              </Card>
            ))
          ) : (
            products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={typeof product.name === 'string' ? product.name : 'Fresh agricultural product'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-400 text-sm">No Image</div>
                    </div>
                  )}

                  {/* Quality Badge */}
                  {product.quality && (
                    <Badge className="absolute top-2 left-2 bg-green-600">
                      {product.quality}
                    </Badge>
                  )}

                  {/* Organic Badge */}
                  {product.organic && (
                    <Badge className="absolute top-2 right-2 bg-yellow-600">
                      Organic
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Name & Category */}
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                      {typeof product.name === 'string' ? product.name : 'Unnamed Product'}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {typeof product.category === 'string' ? product.category : 'Agricultural Product'}
                    </p>
                  </div>

                  {/* Farmer Info */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm text-gray-600">by</span>
                    <span className="text-sm font-medium text-gray-900">
                      {typeof product.farmerName === 'string'
                        ? product.farmerName
                        : typeof product.farmerName === 'object' && product.farmerName
                        ? (product.farmerName as any).name || 'Local Farmer'
                        : 'Local Farmer'
                      }
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {typeof product.location === 'string'
                        ? product.location
                        : typeof product.location === 'object' && product.location
                        ? `${(product.location as any).city || ''}, ${(product.location as any).state || ''}`.replace(/^, |, $/, '').trim() || 'Location N/A'
                        : 'Location N/A'
                      }
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {typeof product.rating === 'number' ? product.rating.toFixed(1) : '4.5'} ({Math.floor(Math.random() * 50) + 10} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ₦{typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">
                        per {typeof product.unit === 'string' ? product.unit : 'unit'}
                      </span>
                    </div>

                    {/* Available Quantity */}
                    <Badge variant="outline">
                      {typeof product.availableQuantity === 'number' ? product.availableQuantity : 0} {typeof product.unit === 'string' ? product.unit : 'units'} available
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 space-y-2">
                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProduct(product.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestQR(product)}
                      disabled={!product.qrCode && !(product as any).qrCode}
                    >
                      QR
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {isAuthenticated ? 'Add to Cart' : 'Login to Buy'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* View All Products CTA */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Explore More Products
            </h3>
            <p className="text-gray-600 mb-6">
              Discover thousands of fresh agricultural products from verified farmers across Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/marketplace">
                  Browse Marketplace
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/register">
                  Join as Farmer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
