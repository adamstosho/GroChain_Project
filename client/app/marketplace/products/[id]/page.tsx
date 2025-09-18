"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Star, MapPin, Calendar, Shield, Heart, ShoppingCart, MessageCircle, Share2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiService } from "@/lib/api"
import { useBuyerStore, useCartInitialization } from "@/hooks/use-buyer-store"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewList } from "@/components/reviews/review-list"
import type { Product, Review } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

export default function ProductDetailPage() {
  const params = useParams()
  const { addToCart } = useBuyerStore()
  const { user } = useAuthStore()

  // Initialize cart from localStorage
  useCartInitialization()
  const { toast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userOrders, setUserOrders] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchReviews()
      if (user) {
        fetchUserOrders()
      }
    }
  }, [params.id, user])

  const fetchProduct = async () => {
    try {
      const response = await apiService.getListing(params.id as string)
      const listing = response.data as any
      
      // Convert Listing to Product format for consistency
      const productData = {
        _id: listing._id,
        cropName: listing.cropName,
        name: listing.cropName, // For compatibility
        category: listing.category,
        variety: listing.variety,
        description: listing.description,
        basePrice: listing.basePrice,
        price: listing.basePrice, // For compatibility
        unit: listing.unit,
        quantity: listing.quantity,
        availableQuantity: listing.availableQuantity,
        location: listing.location,
        images: listing.images || [],
        tags: listing.tags || [],
        status: listing.status,
        views: listing.views || 0,
        rating: listing.rating || 0,
        reviewCount: listing.reviewCount || 0,
        organic: listing.organic || false,
        qualityGrade: listing.qualityGrade || 'standard',
        certifications: listing.certifications || [],
        farmer: listing.farmer,
        harvest: listing.harvest,
        harvestDate: listing.harvest?.harvestDate || listing.createdAt,
        isVerified: listing.farmer?.emailVerified || false,
        isOrganic: listing.organic || false,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      }
      
      setProduct(productData as any)
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await apiService.getListingReviews(params.id as string)
      const reviewsData = response.data || response
      setReviews((reviewsData as any).reviews || [])
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      setReviews([])
    }
  }

  const fetchUserOrders = async () => {
    try {
      const response = await apiService.getOrders()
      const orders = (response.data as any)?.orders || (response as any).orders || []
      // Filter orders for this specific listing that are delivered
      const relevantOrders = orders.filter((order: any) => 
        order.items?.some((item: any) => item.listing === params.id) && 
        order.status === 'delivered'
      )
      setUserOrders(relevantOrders)
    } catch (error) {
      console.error("Failed to fetch user orders:", error)
      setUserOrders([])
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    fetchReviews() // Refresh reviews
  }

  const canReview = user && userOrders.length > 0

  const handleAddToCart = async () => {
    if (!product) {
      toast({
        title: "Error",
        description: "Product information not available",
        variant: "destructive"
      })
      return
    }

    try {
      setAddingToCart(true)

      // Prepare cart item data with proper structure
      const cartItem = {
        id: product._id,
        listingId: product._id, // Ensure listingId is set correctly
        cropName: product.cropName,
        quantity: quantity,
        unit: product.unit,
        price: product.basePrice,
        total: (product.basePrice || 0) * quantity,
        farmer: (product as any).farmer?.name || 'Unknown Farmer',
        location: (product as any).location,
        image: (product as any).images?.[0] || "/placeholder.svg",
        availableQuantity: (product as any).availableQuantity || (product as any).quantity || 0
      }

      // Add to cart using buyer store
      addToCart(cartItem, quantity)

      toast({
        title: "Added to Cart",
        description: `${product.cropName} has been added to your cart`,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/marketplace" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src={product.images?.[0] || "/placeholder.svg?height=400&width=600&query=fresh agricultural product"}
                alt={typeof (product as any).name === 'string' ? (product as any).name : 'Fresh agricultural product'}
                fill
                className="object-cover"
              />
              {(product as any).isVerified && (
                <Badge className="absolute top-4 left-4 bg-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Product
                </Badge>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image: any, index: number) => (
                  <div key={index} className="relative h-20 rounded overflow-hidden">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${typeof product.name === 'string' ? product.name : 'Product'} view ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {typeof (product as any).name === 'string' ? (product as any).name : 'Unnamed Product'}
                </h1>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{(product as any).rating || 4.5}</span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
                <Badge variant="outline">
                  {typeof product.category === 'string' ? product.category : 'Uncategorized'}
                </Badge>
              </div>

              <p className="text-gray-600 text-lg">
                {typeof product.description === 'string' ? product.description : 'No description available.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">
                {typeof (product as any).location === 'string'
                  ? (product as any).location
                  : typeof (product as any).location === 'object' && (product as any).location
                  ? `${(product as any).location.city || ''}, ${(product as any).location.state || ''}`.replace(/^, |, $/, '').trim() || 'Location N/A'
                  : 'Location N/A'
                }
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">
                Harvested: {new Date((product as any).harvestDate || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <div className="border-t border-b py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-green-600">₦{product.price}</span>
                  <span className="text-gray-500 ml-2">per {product.unit}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="font-semibold">
                    {product.quantity} {product.unit}s
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button variant="ghost" size="sm" onClick={() => setQuantity(quantity + 1)}>
                    +
                  </Button>
                </div>

                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !product}
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart - ₦{(product?.basePrice * quantity).toLocaleString()}
                    </>
                  )}
                </Button>

                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Farmer
                </Button>
              </div>
            </div>

            {/* Farmer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Farmer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={product.farmer?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {typeof product.farmer?.name === 'string' ? product.farmer.name.charAt(0) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {typeof product.farmer?.name === 'string' ? product.farmer.name : 'Unknown Farmer'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {product.farmer?.location
                        ? typeof product.farmer.location === 'string'
                          ? product.farmer.location
                          : typeof product.farmer.location === 'object' && product.farmer.location
                          ? `${product.farmer.location.city || ''}, ${product.farmer.location.state || ''}`.replace(/^, |, $/, '').trim() || 'Location N/A'
                          : 'Location N/A'
                        : 'Location N/A'
                      }
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.farmer?.rating || 4.8} rating</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Tabs */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="traceability">Traceability</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {/* Write Review Button */}
            {canReview && (
              <div className="flex justify-end">
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                    </DialogHeader>
                    <ReviewForm
                      listingId={params.id as string}
                      listingName={product?.cropName || 'Product'}
                      farmerName={typeof product?.farmer?.name === 'string' ? product.farmer.name : 'Farmer'}
                      orderId={userOrders[0]?._id}
                      onReviewSubmitted={handleReviewSubmitted}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Reviews List */}
            <ReviewList listingId={params.id as string} />
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Category:</dt>
                        <dd>{typeof product.category === 'string' ? product.category : 'Uncategorized'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Unit:</dt>
                        <dd>{typeof product.unit === 'string' ? product.unit : 'unit'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Origin:</dt>
                        <dd>
                          {typeof product.location === 'string'
                            ? product.location
                            : typeof product.location === 'object' && product.location
                            ? `${product.location.city || ''}, ${product.location.state || ''}`.replace(/^, |, $/, '').trim() || 'Location N/A'
                            : 'Location N/A'
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Quality Assurance</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Verified:</dt>
                        <dd>{product.isVerified ? "Yes" : "No"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Organic:</dt>
                        <dd>{product.isOrganic ? "Yes" : "No"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Quality Grade:</dt>
                        <dd className="capitalize">{product.qualityGrade}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Available Stock:</dt>
                        <dd>{product.availableQuantity} {product.unit}s</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traceability">
            <Card>
              <CardHeader>
                <CardTitle>Product Traceability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Farm Registration</h4>
                      <p className="text-sm text-gray-600">
                        Farm verified and registered in the system
                        {product.farmer?.emailVerified && (
                          <span className="ml-2 text-green-600">✓ Verified</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {product.harvest && (
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Harvest Logged</h4>
                        <p className="text-sm text-gray-600">
                          Harvest details recorded with batch ID: {product.harvest.batchId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Harvest Date: {new Date(product.harvest.harvestDate || product.harvestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Quality Verification</h4>
                      <p className="text-sm text-gray-600">
                        Product quality grade: {product.qualityGrade}
                        {product.organic && <span className="ml-2 text-green-600">✓ Organic Certified</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="h-8 w-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold">Marketplace Listing</h4>
                      <p className="text-sm text-gray-600">
                        Product listed on marketplace for buyers
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Listed: {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {product.certifications && product.certifications.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.certifications.map((cert: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
