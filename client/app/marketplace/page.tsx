"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Grid, List, MapPin, Star, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MarketplaceCard, type MarketplaceProduct } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import { useBuyerStore, useCartInitialization } from "@/hooks/use-buyer-store"
import { useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth"
import type { Product } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    category: "all",
    location: "",
    priceRange: [0, 10000],
    sortBy: "newest",
  })

  const { addToCart, fetchFavorites, cart } = useBuyerStore()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  // Initialize cart from localStorage
  useCartInitialization()

  // Load favorites on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites()
    }
  }, [isAuthenticated, fetchFavorites])

  // Check for refresh flag and update products if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const needsRefresh = localStorage.getItem('marketplace_refresh_needed')
      console.log('🔍 Checking for marketplace refresh flag:', needsRefresh)

      if (needsRefresh === 'true') {
        console.log('🔄 Refreshing marketplace products after checkout...')
        console.log('📦 Current products before refresh:', products.length)

        localStorage.removeItem('marketplace_refresh_needed')
        console.log('✅ Refresh flag cleared')

        fetchProducts().then(() => {
          console.log('✅ Products refreshed successfully')
        }).catch((error) => {
          console.error('❌ Failed to refresh products:', error)
        })
      }
    }
  }, [])

  // Debug cart and products
  useEffect(() => {
    console.log('🔍 Debug Info:', {
      cartLength: cart.length,
      productsLength: products.length,
      cartItems: cart.map(item => ({
        id: item.id,
        listingId: item.listingId,
        quantity: item.quantity,
        name: item.cropName
      })),
      sampleProduct: products.length > 0 ? {
        id: (products[0] as any).id,
        name: (products[0] as any).name,
        quantity: (products[0] as any).quantity,
        availableQuantity: (products[0] as any).availableQuantity
      } : null
    })
  }, [cart, products])

  useEffect(() => {
    // Fetch products for all users (no authentication required)
    fetchProducts()
  }, [filters, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Check if we need to refresh due to recent order completion
      const needsRefresh = typeof window !== 'undefined' && 
        localStorage.getItem('marketplace_refresh_needed') === 'true'
      
      if (needsRefresh) {
        console.log('🔄 Refreshing products due to recent order completion')
        localStorage.removeItem('marketplace_refresh_needed')
      }

      // Map frontend filters to backend parameters
      const params: any = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // Add cache buster if refresh needed
      if (needsRefresh) {
        params._t = Date.now()
      }

      // Add search query
      if (searchQuery) {
        params.search = searchQuery
      }

      // Add category filter
      if (filters.category !== 'all') {
        params.category = filters.category
      }

      // Add location filter
      if (filters.location) {
        params.location = filters.location
      }

      // Add price filters
      if (filters.priceRange[0] > 0) {
        params.minPrice = filters.priceRange[0]
      }
      if (filters.priceRange[1] < 10000) {
        params.maxPrice = filters.priceRange[1]
      }

      // Add sorting
      if (filters.sortBy === 'price_low') {
        params.sortBy = 'basePrice'
        params.sortOrder = 'asc'
      } else if (filters.sortBy === 'price_high') {
        params.sortBy = 'basePrice'
        params.sortOrder = 'desc'
      } else if (filters.sortBy === 'rating') {
        params.sortBy = 'rating'
        params.sortOrder = 'desc'
      }

      const response = await apiService.getMarketplaceListings(params)
      const listings = (response.data as any)?.listings || []

      // Debug backend response
      console.log('🔍 Backend listings:', listings.map((listing: any) => ({
        _id: listing._id,
        cropName: listing.cropName,
        quantity: listing.quantity,
        availableQuantity: listing.availableQuantity,
        status: listing.status
      })))

      // Convert backend listing format to frontend product format
      const convertedProducts = listings.map((listing: any) => ({
        id: listing._id,
        name: listing.cropName,
        category: listing.category,
        description: listing.description,
        price: listing.basePrice,
        unit: listing.unit,
        location: listing.location,
        images: listing.images || [],
        rating: listing.rating || 4.5,
        isVerified: true,
        farmerName: listing.farmer?.name || 'Local Farmer',
        farmerId: listing.farmer?._id || 'unknown',
        quantity: listing.quantity,
        availableQuantity: listing.availableQuantity,
        quality: listing.qualityGrade,
        organic: listing.organic,
        tags: listing.tags || [],
        createdAt: listing.createdAt
      }))

      setProducts(convertedProducts)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    try {
      // Find the product in the current products list
      const product = products.find(p => (p as any).id === productId)
      if (product) {
        // Check if product has available quantity
        if ((product as any).availableQuantity <= 0) {
          toast({
            title: "Out of Stock",
            description: "This product is currently out of stock.",
            variant: "destructive",
          })
          return
        }

        // Use buyer store to add to cart with proper format
        const cartItem = {
          id: (product as any).id,
          listingId: (product as any).id,
          cropName: (product as any).name,
          quantity: 1,
          unit: (product as any).unit,
          price: (product as any).price,
          image: (product as any).images?.[0] || "/placeholder.svg",
          farmer: (product as any).farmer,
          category: (product as any).category,
          location: (product as any).location,
          availableQuantity: (product as any).availableQuantity
        }

        await addToCart(cartItem, 1)

        toast({
          title: "Added to cart!",
          description: `${(product as any).name} has been added to your cart.`,
        })

        // Note: We don't refresh products here because quantities are calculated
        // on the frontend based on cart items. Backend quantities are only
        // updated when orders are completed.

        console.log("✅ Product added to cart successfully:", {
          cartItemId: cartItem.id,
          cartItemListingId: cartItem.listingId,
          productId: (product as any).id,
          productName: (product as any).name,
          currentCart: cart.map(c => ({ id: c.id, listingId: c.listingId, quantity: c.quantity }))
        })
      } else {
        toast({
          title: "Product not found",
          description: "The product you're trying to add is no longer available.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Failed to add to cart:", error)
      toast({
        title: "Failed to add to cart",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  // Favorites are now handled directly in the MarketplaceCard component
  // using the buyer store, so we don't need this function anymore

  // Use actual product quantities from database (no frontend calculation)
  const adjustedProducts = useMemo(() => {
    return products.map(product => {
      // Use the actual available quantity from the database
      const availableQuantity = (product as any).availableQuantity || (product as any).quantity || (product as any).stockQuantity || 0
      
      // Find cart item for display purposes only (not for quantity calculation)
      const cartItem = cart.find(item =>
        item.listingId === (product as any).id ||
        item.id === (product as any).id ||
        item.listingId === (product as any)._id ||
        item.id === product._id
      )
      const cartQuantity = cartItem ? cartItem.quantity : 0

      // Debug quantity display for this product
      console.log(`🔢 Product quantity for ${(product as any).name}:`, {
        productId: (product as any).id,
        availableQuantity,
        cartQuantity,
        cartItemFound: !!cartItem
      })

      return {
        ...product,
        availableQuantity: availableQuantity,
        cartQuantity: cartQuantity
      }
    })
  }, [products, cart])

  // Convert Product type to MarketplaceProduct type for our component
  const convertToMarketplaceProduct = (product: Product): MarketplaceProduct => {
    return {
      id: String((product as any).id),
      name: (product as any).name,
      cropType: (product as any).category || "Agricultural Product",
      variety: (product as any).variety || "Standard",
      description: product.description || "Fresh agricultural product from verified farmers",
      price: (product as any).price,
      unit: (product as any).unit,
      quantity: (product as any).quantity || 100,
      availableQuantity: (product as any).availableQuantity || 100,
      quality: (product as any).quality || "good",
      grade: (product as any).grade || "B",
      organic: (product as any).organic || false,
      harvestDate: new Date((product as any).harvestDate || Date.now()),
      location: (product as any).location,
      farmer: {
        id: (product as any).farmerId || "1",
        name: (product as any).farmerName || "Unknown Farmer",
        avatar: (product as any).farmerAvatar || "",
        rating: (product as any).rating || 4.5,
        verified: (product as any).isVerified || true,
        location: (product as any).location
      },
      images: (product as any).images && (product as any).images.length > 0 
        ? product.images 
        : ["/placeholder.svg?height=200&width=300&query=fresh agricultural product"],
      certifications: (product as any).certifications || ["ISO 22000"],
      shipping: {
        available: (product as any).shippingAvailable || true,
        cost: (product as any).shippingCost || 500,
        estimatedDays: (product as any).shippingDays || 3
      },
      rating: (product as any).rating || 4.5,
      reviewCount: (product as any).reviewCount || 0,
      qrCode: (product as any).qrCode || `PRODUCT_${Date.now()}`,
      tags: (product as any).tags || [product.category, "fresh", "agricultural", "verified"]
    }
  }

  const handleMarketplaceAction = (action: string, productId: string) => {
    switch (action) {
      case "addToCart":
        handleAddToCart(productId)
        break
      case "addToWishlist":
        // Favorites are now handled directly in MarketplaceCard component
        break
      case "view":
        // Navigate to product detail page
        router.push(`/marketplace/products/${productId}`)
        break
      case "contact":
        // Handle contact logic
        console.log("Contacting farmer for:", productId)
        break
      case "share":
        // Handle share logic
        console.log("Sharing product:", productId)
        break
    }
  }

  // Show loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-600 text-sm">Discover fresh, verified agricultural products from trusted farmers</p>

        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products, farmers, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white border-gray-200">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="grains">Grains</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="fruits">Fruits</SelectItem>
                          <SelectItem value="tubers">Tubers</SelectItem>
                          <SelectItem value="legumes">Legumes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        placeholder="Enter location"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="space-y-2">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                          max={10000}
                          min={0}
                          step={100}
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>₦{filters.priceRange[0]}</span>
                          <span>₦{filters.priceRange[1]}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="price_low">Price: Low to High</SelectItem>
                          <SelectItem value="price_high">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex border rounded-lg bg-white">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white">
                <div className="aspect-[3/2] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
                : "space-y-3"
            }
          >
            {adjustedProducts.map((product) => (
              <MarketplaceCard
                key={(product as any).id || (product as any)._id}
                product={convertToMarketplaceProduct(product)}
                variant={viewMode === "list" ? "compact" : "default"}
                onAddToCart={(id) => handleMarketplaceAction("addToCart", id)}
                onAddToWishlist={(id) => handleMarketplaceAction("addToWishlist", id)}
                onView={(id) => handleMarketplaceAction("view", id)}
                onContact={(id) => handleMarketplaceAction("contact", id)}
                onShare={(id) => handleMarketplaceAction("share", id)}
              />
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
