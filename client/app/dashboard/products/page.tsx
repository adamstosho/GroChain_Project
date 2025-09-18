"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useBuyerStore, useCartInitialization } from "@/hooks/use-buyer-store"
import { useAuthStore } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import {
  Package,
  Search,
  Filter,
  MapPin,
  Star,
  Heart,
  ShoppingCart,
  Eye,
  Calendar,
  Leaf,
  TrendingUp,
  RefreshCw,
  Grid3X3,
  List,
  SlidersHorizontal
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProductListing {
  _id: string
  cropName: string
  category: string
  description: string
  basePrice: number
  quantity: number
  unit: string
  availableQuantity: number
  location: {
    city: string
    state: string
  }
  images: string[]
  tags: string[]
  status: 'active' | 'inactive' | 'sold_out'
  createdAt: string
  views: number
  orders: number
  rating: number
  reviews: number
  farmer: {
    name: string
    rating: number
    verified: boolean
  }
  organic: boolean
  qualityGrade: 'premium' | 'standard' | 'basic'
}

interface ProductFilters {
  category: "all" | "Grains" | "Tubers" | "Vegetables" | "Legumes" | "Fruits"
  location: "all" | "Lagos" | "Kano" | "Kaduna" | "Oyo" | "Katsina" | "Niger" | "Plateau"
  priceRange: "all" | "0-1000" | "1000-5000" | "5000-10000" | "10000-50000" | "50000-100000"
  quality: "all" | "premium" | "standard" | "basic"
  organic: boolean
  sortBy: "newest" | "price-low" | "price-high" | "rating" | "popular"
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListing[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductListing[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<ProductFilters>({
    category: "all",
    location: "all",
    priceRange: "all",
    quality: "all",
    organic: false,
    sortBy: "newest"
  })
  const [favoriteProcessing, setFavoriteProcessing] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const { addToCart, addToFavorites, removeFromFavorites, fetchFavorites, cart, favorites } = useBuyerStore()
  const { user } = useAuthStore()

  // Initialize cart from localStorage
  useCartInitialization()

  // Load favorites on component mount
  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user, fetchFavorites])

  // Centralized favorite handler to prevent race conditions
  const handleFavoriteToggle = async (productId: string, productName: string) => {
    // Prevent multiple operations on the same product
    if (favoriteProcessing.has(productId)) {
      console.log('Operation already in progress for product:', productId)
      return
    }

    try {
      // Add to processing set
      setFavoriteProcessing(prev => new Set(prev).add(productId))

      // Check if product is currently favorited
      const isCurrentlyFavorited = Array.isArray(favorites) && favorites.some((fav: any) => {
        const listingId = fav.listingId || fav.listing?._id || fav.listing
        return listingId === productId
      })

      console.log('Toggling favorite for product:', productId, 'Currently favorited:', isCurrentlyFavorited)

      if (isCurrentlyFavorited) {
        // Remove from favorites
        await removeFromFavorites(productId)
        toast({
          title: "Removed from favorites",
          description: `${productName} has been removed from your favorites.`,
        })
      } else {
        // Add to favorites
        await addToFavorites(productId)
        toast({
          title: "Added to favorites!",
          description: `${productName} has been added to your favorites.`,
        })
      }

      // Refresh favorites once after the operation
      await fetchFavorites()
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Remove from processing set
      setFavoriteProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Check for refresh flag and update products if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const needsRefresh = localStorage.getItem('marketplace_refresh_needed')
      if (needsRefresh === 'true') {
        console.log('🔄 Refreshing dashboard products after checkout...')
        localStorage.removeItem('marketplace_refresh_needed')
        fetchProducts()
      }
    }
  }, [])

  useEffect(() => {
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
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // Add cache buster if refresh needed
      if (needsRefresh) {
        params._t = Date.now()
      }

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      // Add category filter
      if (filters.category && filters.category !== "all") {
        params.category = filters.category.toLowerCase()
      }

      // Add location filter
      if (filters.location && filters.location !== "all") {
        params.location = filters.location
      }

      // Add price filters
      if (filters.priceRange && filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split('-').map(Number)
        if (min > 0) params.minPrice = min
        if (max && max < 100000) params.maxPrice = max
      }

      // Add quality filter
      if (filters.quality && filters.quality !== "all") {
        params.qualityGrade = filters.quality
      }

      // Add organic filter
      if (filters.organic) {
        params.organic = true
      }

      // Add sorting
      switch (filters.sortBy) {
        case 'price-low':
          params.sortBy = 'basePrice'
          params.sortOrder = 'asc'
          break
        case 'price-high':
          params.sortBy = 'basePrice'
          params.sortOrder = 'desc'
          break
        case 'rating':
          params.sortBy = 'rating'
          params.sortOrder = 'desc'
          break
        case 'popular':
          params.sortBy = 'views'
          params.sortOrder = 'desc'
          break
        case 'newest':
        default:
          params.sortBy = 'createdAt'
          params.sortOrder = 'desc'
          break
      }

      console.log('🔄 Fetching products with params:', params)

      const response = await apiService.getMarketplaceListings(params)
      const listings = (response.data as any)?.listings || []

      console.log('📦 Received listings:', listings.length)
      console.log('📦 First listing sample:', listings[0])

      // Convert backend listing format to frontend product format
      const convertedProducts: ProductListing[] = listings.map((listing: any) => ({
        _id: listing._id,
        cropName: listing.cropName,
        category: listing.category || 'Agricultural Product',
        description: listing.description || `${listing.cropName} - Fresh agricultural product`,
        basePrice: listing.basePrice,
        quantity: listing.quantity,
        unit: listing.unit || 'kg',
        availableQuantity: listing.availableQuantity,
        location: typeof listing.location === 'string' ? listing.location : listing.location,
        images: listing.images || ["/placeholder.svg"],
        tags: listing.tags || [],
        status: listing.status || 'active',
        createdAt: listing.createdAt,
        views: listing.views || 0,
        orders: listing.orders || 0,
        rating: listing.rating || 4.5,
        reviews: listing.reviewCount || 0,
        farmer: {
          name: listing.farmer?.name || 'Local Farmer',
          rating: listing.farmer?.rating || 4.5,
          verified: listing.farmer?.emailVerified || false,
        },
        organic: listing.organic || false,
        qualityGrade: listing.qualityGrade || 'standard'
      }))

      setProducts(convertedProducts)
      setFilteredProducts(convertedProducts)

    } catch (error: any) {
      console.error("❌ Failed to fetch products:", error)
      toast({
        title: "Error loading products",
        description: error.message || "Failed to load products. Please try again.",
        variant: "destructive",
      })
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  // No client-side filtering needed since we filter on the backend
  // The filteredProducts are set directly from the API response

  const handleAddToCart = async (product: ProductListing) => {
    try {
      // Validate product data before processing
      if (!product || !product._id || !product.cropName) {
        throw new Error('Invalid product data')
      }

      // Check if product has available quantity
      if (product.availableQuantity <= 0) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock.",
          variant: "destructive",
        })
        return
      }

      // Convert ProductListing to the format expected by the buyer store
      const cartItem = {
        id: product._id,
        listingId: product._id,
        cropName: product.cropName || 'Unknown Product',
        quantity: 1,
        unit: product.unit || 'kg',
        price: product.basePrice || 0,
        total: product.basePrice || 0,
        farmer: product.farmer?.name || 'Unknown Farmer',
        location: typeof product.location === 'string'
          ? product.location
          : `${product.location?.city || 'Unknown'}, ${product.location?.state || 'Unknown State'}`,
        image: (product.images && product.images.length > 0) ? product.images[0] : "/placeholder.svg",
        availableQuantity: product.availableQuantity || 0
      }

      // Add to cart through the buyer store
      await addToCart(cartItem, 1)

      toast({
        title: "Added to cart",
        description: `${product.cropName} has been added to your cart`,
      })

      // Note: We don't refresh products here because quantities are calculated
      // on the frontend based on cart items. Backend quantities are only
      // updated when orders are completed.
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Favorites are now handled directly in the ProductCard component
  // using the buyer store, so we don't need this function anymore

  // Use actual product quantities from database (no frontend calculation)
  const adjustedProducts = useMemo(() => {
    return filteredProducts.map(product => {
      // Use the actual available quantity from the database
      const availableQuantity = product.availableQuantity || (product as any).stockQuantity || product.quantity || 0
      
      // Find cart item for display purposes only (not for quantity calculation)
      const cartItem = cart.find(item =>
        item.listingId === product._id ||
        item.id === product._id ||
        item.listingId === (product as any).id ||
        item.id === (product as any).id
      )
      const cartQuantity = cartItem ? cartItem.quantity : 0

      console.log('🔍 Dashboard product quantity:', {
        productId: product._id,
        productName: product.cropName,
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
  }, [filteredProducts, cart])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      case 'standard': return 'bg-blue-500 text-white'
      case 'basic': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Browse Products">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Browse Products">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse Products</h1>
            <p className="text-muted-foreground">
              Discover fresh agricultural products from verified farmers across Nigeria
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SlidersHorizontal className="h-5 w-5" />
              <span>Search & Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for products, categories, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Grains">Grains</SelectItem>
                  <SelectItem value="Tubers">Tubers</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Legumes">Legumes</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Kano">Kano</SelectItem>
                  <SelectItem value="Kaduna">Kaduna</SelectItem>
                  <SelectItem value="Oyo">Oyo</SelectItem>
                  <SelectItem value="Katsina">Katsina</SelectItem>
                  <SelectItem value="Niger">Niger</SelectItem>
                  <SelectItem value="Plateau">Plateau</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priceRange} onValueChange={(value) => setFilters({ ...filters, priceRange: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-1000">₦0 - ₦1,000</SelectItem>
                  <SelectItem value="1000-5000">₦1,000 - ₦5,000</SelectItem>
                  <SelectItem value="5000-10000">₦5,000 - ₦10,000</SelectItem>
                  <SelectItem value="10000-50000">₦10,000 - ₦50,000</SelectItem>
                  <SelectItem value="50000-100000">₦50,000+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.quality} onValueChange={(value) => setFilters({ ...filters, quality: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Qualities</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    category: "all",
                    location: "all",
                    priceRange: "all",
                    quality: "all",
                    organic: false,
                    sortBy: "newest"
                  })
                  setSearchQuery("")
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            {/* Organic Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="organic"
                checked={filters.organic}
                onChange={(e) => setFilters({ ...filters, organic: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="organic" className="text-sm font-medium">
                Organic products only
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} products
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {filters.organic ? 'Organic Only' : 'All Products'}
            </Badge>
            {filters.category && filters.category !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {filters.category}
              </Badge>
            )}
            {filters.location && filters.location !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {filters.location}
              </Badge>
            )}
            {filters.quality && filters.quality !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {filters.quality}
              </Badge>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filters.category !== "all" || filters.location !== "all" || filters.quality !== "all" || filters.organic
                  ? "No products found"
                  : "No products available"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || filters.category !== "all" || filters.location !== "all" || filters.quality !== "all" || filters.organic
                  ? "Try adjusting your search criteria or filters to find more products."
                  : "There are currently no products available in the marketplace."}
              </p>
              {(searchQuery || filters.category !== "all" || filters.location !== "all" || filters.quality !== "all" || filters.organic) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    category: "all",
                    location: "all",
                    priceRange: "all",
                    quality: "all",
                    organic: false,
                    sortBy: "newest"
                  })}
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
            {adjustedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                viewMode={viewMode}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleFavoriteToggle}
                formatPrice={formatPrice}
                getQualityColor={getQualityColor}
                favorites={favorites}
                isProcessing={favoriteProcessing.has(product._id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

interface ProductCardProps {
  product: ProductListing
  viewMode: 'grid' | 'list'
  onAddToCart: (product: ProductListing) => void
  onToggleFavorite: (productId: string, productName: string) => Promise<void>
  formatPrice: (price: number) => string
  getQualityColor: (quality: string) => string
  favorites: any[]
  isProcessing: boolean
}

function ProductCard({
  product,
  viewMode,
  onAddToCart,
  onToggleFavorite,
  formatPrice,
  getQualityColor,
  favorites,
  isProcessing
}: ProductCardProps) {
  const { toast } = useToast()

  // Check if product is in favorites - improved detection
  const isWishlisted = Array.isArray(favorites) && favorites.some((fav: any) => {
    // Check both possible ID fields and handle different data structures
    const listingId = fav.listingId || fav.listing?._id || fav.listing
    const productId = product._id
    const isMatch = listingId === productId
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Favorite check:', {
        productId,
        listingId,
        isMatch,
        favorite: fav
      })
    }
    
    return isMatch
  })

  // Simple handler that calls the centralized function with debouncing
  const handleWishlist = () => {
    if (isProcessing) {
      console.log('Click ignored - operation in progress')
      return
    }
    onToggleFavorite(product._id, product.cropName)
  }
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            {/* Product Image */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.cropName}
                fill
                className="rounded-lg object-cover"
              />
              {product.organic && (
                <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                  Organic
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {product.cropName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Badge className={getQualityColor(product.qualityGrade)}>
                    {product.qualityGrade}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWishlist}
                    className="h-8 w-8 p-0"
                    disabled={isProcessing}
                    title={isWishlisted ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isProcessing ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
                    ) : (
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-all duration-200", 
                          isWishlisted 
                            ? "fill-red-500 text-red-500 scale-110" 
                            : "text-gray-600 hover:text-red-500 hover:scale-105"
                        )} 
                      />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{typeof product.location === 'string' ? product.location : `${product.location?.city || 'Unknown'}, ${product.location?.state || 'Unknown State'}`}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{product.views} views</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviews})</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Farmer: </span>
                    <span className="font-medium">{product.farmer.name}</span>
                    {product.farmer.verified && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {formatPrice(product.basePrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {product.unit} • {product.availableQuantity} {product.unit} available
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-4">
                {product.availableQuantity <= 0 ? (
                  <Button
                    className="flex-1 bg-gray-500"
                    size="sm"
                    disabled
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Out of Stock
                  </Button>
                ) : (
                  <Button
                    onClick={() => onAddToCart(product)}
                    className="flex-1"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/products/${product._id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
      <CardHeader className="p-3 pb-2">
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={product.images[0] || "/placeholder.svg"}
              alt={product.cropName}
              width={300}
              height={225}
              className="h-full w-full object-cover"
            />
          </div>
          {product.organic && (
            <Badge className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] px-1.5 py-0.5">
              Organic
            </Badge>
          )}
          <Badge className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 ${getQualityColor(product.qualityGrade)}`}>
            {product.qualityGrade}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          <div>
            <h3 className="font-semibold text-sm text-foreground line-clamp-1">
              {product.cropName}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {typeof product.location === 'string' ? (product.location as string).split(',')[0] : (product.location as any)?.city || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-xs">{product.rating}</span>
              <span className="text-muted-foreground text-xs">({product.reviews})</span>
            </div>
          </div>

          <div className="text-xs">
            <span className="text-muted-foreground">by </span>
            <span className="font-medium">{product.farmer.name}</span>
            {product.farmer.verified && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                Verified
              </Badge>
            )}
          </div>

          <div className="text-center py-1">
            <div className="text-lg font-bold text-primary">
              {formatPrice(product.basePrice)}
            </div>
            <div className="text-xs text-muted-foreground">
              per {product.unit} • {product.availableQuantity} {product.unit} available
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center space-x-2">
            {product.availableQuantity <= 0 ? (
              <Button
                className="flex-1 h-8 text-xs bg-gray-500"
                size="sm"
                disabled
              >
                <ShoppingCart className="h-3 w-3 mr-1.5" />
                Out of Stock
              </Button>
            ) : (
              <Button
                onClick={() => onAddToCart(product)}
                className="flex-1 h-8 text-xs"
                size="sm"
              >
                <ShoppingCart className="h-3 w-3 mr-1.5" />
                Add to Cart
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWishlist}
              className="h-8 w-8 p-0"
              disabled={isProcessing}
              title={isWishlisted ? "Remove from favorites" : "Add to favorites"}
            >
              {isProcessing ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
              ) : (
                <Heart 
                  className={cn(
                    "h-3 w-3 transition-all duration-200", 
                    isWishlisted 
                      ? "fill-red-500 text-red-500 scale-110" 
                      : "text-gray-600 hover:text-red-500 hover:scale-105"
                  )} 
                />
              )}
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="w-full h-7 text-xs" asChild>
            <Link href={`/dashboard/products/${product._id}`}>
              <Eye className="h-3 w-3 mr-1.5" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
