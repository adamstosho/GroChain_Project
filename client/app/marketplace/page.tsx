"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  UserCheck, 
  RefreshCw,
  ArrowLeft, 
  Home, 
  Shield, 
  CheckCircle, 
  Sparkles, 
  Activity, 
  Clock 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MarketplaceCard, type MarketplaceProduct } from "@/components/agricultural"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { apiService } from "@/lib/api"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { extractListingsFromResponse } from "@/lib/marketplace-listings"
import { useToast } from "@/hooks/use-toast"
import { useOfflineApi } from "@/hooks/use-offline-api"
import { useAuthStore } from "@/lib/auth"
import { getTokenFromStorage } from "@/lib/auth-storage"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StaggerGrid } from "@/components/motion/stagger-grid"
import { PageContainer } from "@/components/layout/page-container"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

interface BuyerTestimonial {
  id?: string
  testimonial?: string
  location?: string
  buyerType?: string
}

interface BuyerActivityState {
  activeBuyers: number
  todaysTransactions: number
  recentActivity: number
  averageRating: number
  testimonials: BuyerTestimonial[]
}

/** Normalized listing card shape used on the public marketplace page */
interface MarketplaceListingItem {
  id: string
  _id?: string
  name?: string
  category?: string
  description?: string
  price?: number
  unit?: string
  location?: string
  images?: string[]
  rating?: number
  isVerified?: boolean
  farmerName?: string
  farmerId?: string
  farmerAvatar?: string
  quantity?: number
  availableQuantity?: number
  quality?: string
  grade?: string
  organic?: boolean
  harvestDate?: string | number | Date
  certifications?: string[]
  shippingAvailable?: boolean
  shippingCost?: number
  shippingDays?: number
  reviewCount?: number
  qrCode?: string
  tags?: string[]
  variety?: string
  cartQuantity?: number
  createdAt?: unknown
}

function formatLocation(location: unknown): string {
  if (!location) return ""
  if (typeof location === "string") return location
  if (typeof location === "object") {
    const { city, state, country } = location as { city?: string; state?: string; country?: string }
    return [city, state, country].filter(Boolean).join(", ")
  }
  return ""
}

function listingItemId(product: MarketplaceListingItem): string {
  return String(product.id ?? product._id ?? "")
}

function asQuality(value: unknown): MarketplaceProduct["quality"] {
  if (value === "excellent" || value === "good" || value === "fair" || value === "poor") return value
  return "good"
}

function asGrade(value: unknown): MarketplaceProduct["grade"] {
  if (value === "A" || value === "B" || value === "C") return value
  return "A"
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceListingItem[]>([])
  const { isInitialLoading, isRefreshing, begin, finish } = useStableDataFetch()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 400)
  
  const [filters, setFilters] = useState({
    category: "all",
    location: "",
    priceRange: [0, 10000],
    sortBy: "newest",
  })
  
  // Suggestions states
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)
  
  // Greetings state
  const [greeting, setGreeting] = useState("Hello")
  
  const [buyerActivity, setBuyerActivity] = useState<BuyerActivityState>({
    activeBuyers: 0,
    todaysTransactions: 0,
    recentActivity: 0,
    averageRating: 0,
    testimonials: []
  })

  const { addToCart, fetchFavorites, cart } = useBuyerStore()
  const { toast } = useToast()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const { isOffline } = useOfflineApi()
  const router = useRouter()

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  // Auto-suggestions trigger
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const res = await apiService.searchSuggestions(searchQuery)
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          setSuggestions(res.data)
        } else if (Array.isArray(res)) {
          setSuggestions(res)
        }
      } catch (err) {
        console.error("Suggestions fetch error:", err)
      }
    }

    const timer = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Key navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
    } else if (e.key === "Enter") {
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
        e.preventDefault()
        setSearchQuery(suggestions[focusedSuggestionIndex])
        setShowSuggestions(false)
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  // Load favorites on hydration & authentication
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user) {
      const token = typeof window !== 'undefined' ? getTokenFromStorage() : null
      if (token && token !== 'undefined' && token !== 'null' && token.length > 10) {
        fetchFavorites().catch((error) => {
          console.log('❌ Failed to fetch favorites (non-critical):', error.message)
        })
      }
    }
  }, [hasHydrated, isAuthenticated, user, fetchFavorites])

  const fetchProducts = useCallback(async () => {
    const generation = begin()
    try {
      const needsRefresh =
        typeof window !== "undefined" && localStorage.getItem("marketplace_refresh_needed") === "true"

      if (needsRefresh) {
        localStorage.removeItem("marketplace_refresh_needed")
      }

      const params: Record<string, unknown> = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      }

      if (needsRefresh) {
        params._t = Date.now()
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      if (filters.category !== "all") {
        params.category = filters.category
      }

      if (filters.location) {
        params.location = filters.location
      }

      if (filters.priceRange[0] > 0) {
        params.minPrice = filters.priceRange[0]
      }
      if (filters.priceRange[1] < 10000) {
        params.maxPrice = filters.priceRange[1]
      }

      if (filters.sortBy === "price_low") {
        params.sortBy = "basePrice"
        params.sortOrder = "asc"
      } else if (filters.sortBy === "price_high") {
        params.sortBy = "basePrice"
        params.sortOrder = "desc"
      } else if (filters.sortBy === "rating") {
        params.sortBy = "rating"
        params.sortOrder = "desc"
      }

      const response = await apiService.getMarketplaceListings(params)
      const listings = extractListingsFromResponse(response.data ?? response)

      const convertedProducts: MarketplaceListingItem[] = listings.map((listing: Record<string, unknown>) => {
        const farmer = listing.farmer as { name?: string; _id?: string } | undefined
        return {
          id: String(listing._id ?? listing.id ?? ""),
          name: listing.cropName as string | undefined,
          category: listing.category as string | undefined,
          description: listing.description as string | undefined,
          price: listing.basePrice as number | undefined,
          unit: listing.unit as string | undefined,
          location: formatLocation(listing.location),
          images: Array.isArray(listing.images) ? (listing.images as string[]) : [],
          rating: (listing.rating as number | undefined) || 4.5,
          isVerified: true,
          farmerName: farmer?.name || "Local Farmer",
          farmerId: farmer?._id || "unknown",
          quantity: listing.quantity as number | undefined,
          availableQuantity: listing.availableQuantity as number | undefined,
          quality: listing.qualityGrade as string | undefined,
          organic: Boolean(listing.organic),
          tags: Array.isArray(listing.tags) ? (listing.tags as string[]) : [],
          createdAt: listing.createdAt,
        }
      })

      setProducts(convertedProducts)
      finish(generation)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      finish(generation)
      setProducts([])
      toast({
        title: "Unable to load products",
        description: "We couldn't reach the marketplace right now. Please try again shortly.",
        variant: "destructive",
      })
    }
  }, [filters, debouncedSearchQuery, begin, finish, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchBuyerActivity()
  }, [])

  const fetchBuyerActivity = async () => {
    try {
      const response = await apiService.getBuyerActivity()
      if (response && response.status === 'success' && response.data) {
        setBuyerActivity(response.data as BuyerActivityState)
      }
      // Leave the zeroed default state in place if the response is empty/unsuccessful
      // rather than substituting fabricated numbers.
    } catch (error) {
      console.error('Failed to fetch buyer activity:', error)
      // Leave the zeroed default state in place; no fabricated numbers on failure.
    }
  }

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      })
      router.push("/login?redirect=/marketplace")
      return
    }

    try {
      const product = products.find((p) => listingItemId(p) === String(productId))
      if (!product) {
        toast({
          title: "Could not add to cart",
          description: "That listing is no longer in the current results. Refresh and try again.",
          variant: "destructive",
        })
        return
      }

      const stock = Number(product.availableQuantity ?? product.quantity ?? 0)
      if (Number.isFinite(stock) && stock <= 0) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock.",
          variant: "destructive",
        })
        return
      }

      const cartItem = {
        id: String(product.id ?? productId),
        listingId: String(product.id ?? productId),
        cropName: product.name,
        quantity: 1,
        unit: product.unit,
        price: product.price,
        image: product.images?.[0] || "/placeholder.svg",
        farmer: product.farmerName || "Local Farmer",
        category: product.category,
        location: product.location,
        availableQuantity: stock,
      }

      addToCart(cartItem, 1)

      toast({
        title: isOffline ? "Added to cart (offline)" : "Added to cart!",
        description: isOffline
          ? `${product.name} added to cart. Will sync when online.`
          : `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("❌ Failed to add to cart:", error)
      toast({
        title: "Failed to add to cart",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const adjustedProducts = useMemo(() => {
    return products.map(product => {
      const availableQuantity = product.availableQuantity || product.quantity || 0
      const id = listingItemId(product)
      const cartItem = cart.find(item => item.listingId === id || item.id === id)
      const cartQuantity = cartItem ? cartItem.quantity : 0

      return {
        ...product,
        availableQuantity,
        cartQuantity
      }
    })
  }, [products, cart])

  const convertToMarketplaceProduct = (product: MarketplaceListingItem): MarketplaceProduct => {
    return {
      id: String(product.id),
      name: product.name || "",
      cropType: product.category || "Agricultural Product",
      variety: product.variety || "Standard",
      description: product.description || "Fresh agricultural product from verified farmers",
      price: product.price || 0,
      unit: product.unit || "",
      quantity: Number(product.quantity ?? 0) || 0,
      availableQuantity: Number(product.availableQuantity ?? product.quantity ?? 0) || 0,
      quality: asQuality(product.quality),
      grade: asGrade(product.grade),
      organic: product.organic || false,
      harvestDate: new Date(product.harvestDate || Date.now()),
      location: product.location || "",
      farmer: {
        id: product.farmerId || "1",
        name: product.farmerName || "Unknown Farmer",
        avatar: product.farmerAvatar || "",
        rating: product.rating || 4.5,
        verified: product.isVerified || true,
        location: product.location || ""
      },
      images: product.images && product.images.length > 0 
        ? product.images 
        : ["https://images.unsplash.com/photo-1551754655-cd27e38d20f6?auto=format&fit=crop&q=80&w=400"],
      certifications: product.certifications || ["ISO 22000"],
      shipping: {
        available: product.shippingAvailable || true,
        cost: product.shippingCost || 500,
        estimatedDays: product.shippingDays || 3
      },
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || 0,
      qrCode: product.qrCode || `PRODUCT_${Date.now()}`,
      tags: product.tags || [product.category || "", "fresh", "agricultural", "verified"]
    }
  }

  const handleMarketplaceAction = (action: string, productId: string) => {
    switch (action) {
      case "addToCart":
        handleAddToCart(productId)
        break
      case "view":
        router.push(`/marketplace/products/${productId}`)
        break
      case "contact":
        console.log("Contacting farmer for product:", productId)
        toast({
          title: "Contact Request Sent",
          description: "A chat request has been forwarded to the farmer.",
        })
        break
      case "share":
        if (navigator.share) {
          navigator.share({
            title: 'Verified Produce on GroChain',
            text: `Check out this listing on GroChain!`,
            url: window.location.href + `/products/${productId}`
          }).catch(console.error)
        } else {
          navigator.clipboard.writeText(window.location.href + `/products/${productId}`)
          toast({
            title: "Link Copied!",
            description: "Product link copied to clipboard.",
          })
        }
        break
    }
  }

  const hasActiveFilters = useMemo(() => {
    return filters.category !== "all" || 
           filters.location !== "" || 
           filters.priceRange[0] > 0 || 
           filters.priceRange[1] < 10000
  }, [filters])

  return (
    <div className="min-h-screen flex flex-col bg-background antialiased">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-muted via-background to-success/15 py-8">
        <PageContainer>
          
          {/* Breadcrumbs / Back navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-success transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>Back to Dashboard</span>
              </Link>
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-success transition-colors shrink-0">
                <Home className="h-4 w-4 shrink-0" />
                <span>Home</span>
              </Link>
            </div>
            
            <Badge variant="outline" className="self-start sm:self-auto bg-success/10 text-success border-success/50 flex items-center gap-1.5 text-[11px] sm:text-xs shrink-0">
              <Sparkles className="h-3 w-3 text-success fill-success animate-pulse shrink-0" />
              Graded Standard Marketplace
            </Badge>
          </div>

          {/* Premium Hero Banner */}
          <div className="relative overflow-hidden bg-primary text-primary-foreground py-12 px-6 sm:px-12 rounded-2xl shadow-xl mb-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-xs font-semibold text-primary-foreground mb-4 tracking-wider uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                Zero Middlemen & Blockchain Verified
              </div>
              <Display as="h1" variant="hero" className="mb-4 text-primary-foreground">
                {[greeting, user?.name?.trim().split(" ")[0]].filter(Boolean).join(", ")}, welcome to the <span className="underline decoration-secondary decoration-2 underline-offset-4">GroChain Marketplace</span>
              </Display>
              <Text variant="sm" className="mb-6 font-medium text-primary-foreground/90 sm:text-base">
                Source premium, traceably verified farm products directly from certified Nigerian smallholders. Safe escrow payments and integrated cold-chain logistics.
              </Text>

              <div className={layout.gridStats + " border-t border-white/20 pt-5"}>
                <div className="flex flex-col">
                  <Text as="span" variant="stat" className="text-primary-foreground">5,000+</Text>
                  <span className="text-xs text-primary-foreground/70 font-medium">Verified Farmers</span>
                </div>
                <div className="flex flex-col">
                  <Text as="span" variant="stat" className="text-primary-foreground">12,000+</Text>
                  <span className="text-xs text-primary-foreground/70 font-medium">Tons Traced</span>
                </div>
                <div className="flex flex-col">
                  <Text as="span" variant="stat" className="text-primary-foreground">₦0</Text>
                  <span className="text-xs text-primary-foreground/70 font-medium">Broker Commission</span>
                </div>
                <div className="flex flex-col">
                  <Text as="span" variant="stat" className="text-primary-foreground">100%</Text>
                  <span className="text-xs text-primary-foreground/70 font-medium">Escrow Protected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {[
              { id: "all", label: "All Products" },
              { id: "grains", label: "Grains & Cereals" },
              { id: "tubers", label: "Tubers & Roots" },
              { id: "vegetables", label: "Vegetables" },
              { id: "fruits", label: "Fresh Fruits" },
              { id: "legumes", label: "Legumes & Pods" }
            ].map(cat => (
              <Button
                key={cat.id}
                variant={filters.category === cat.id ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                className={`rounded-full px-5 py-1.5 h-auto text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                  filters.category === cat.id 
                    ? "bg-success hover:bg-success-hover text-success-foreground border-none"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Search Inputs & Auto-suggestions */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products, farmers, or locations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                    setFocusedSuggestionIndex(-1)
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10 bg-card border-border focus-visible:ring-success h-11 shadow-sm rounded-xl"
                />
                
                {/* Autocomplete List */}
                {showSuggestions && suggestions.length > 0 && (
                  <Card className="absolute top-12 left-0 right-0 z-50 shadow-lg border border-border/80 rounded-xl overflow-hidden bg-card max-h-60 overflow-y-auto">
                    <CardContent className="p-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(suggestion)
                            setShowSuggestions(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm text-foreground hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-2 ${
                            index === focusedSuggestionIndex ? "bg-primary-soft text-primary font-semibold" : ""
                          }`}
                        >
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-card border-border hover:bg-muted h-11 lg:hidden rounded-xl">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Products</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Category</label>
                        <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="grains">Grains</SelectItem>
                            <SelectItem value="tubers">Tubers</SelectItem>
                            <SelectItem value="vegetables">Vegetables</SelectItem>
                            <SelectItem value="fruits">Fruits</SelectItem>
                            <SelectItem value="legumes">Legumes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Location</label>
                        <Input
                          placeholder="Enter state or city"
                          value={filters.location}
                          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Price Range</label>
                        <div className="space-y-2 mt-2">
                          <Slider
                            value={filters.priceRange}
                            onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                            max={10000}
                            min={0}
                            step={100}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>₦{filters.priceRange[0]}</span>
                            <span>₦{filters.priceRange[1]}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Sort By</label>
                        <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                          <SelectTrigger className="mt-1">
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
              </div>
            </div>
          </div>

          {/* Main Marketplace Grid: Sidebar + Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            
            {/* Desktop Sticky Filters Sidebar */}
            <div className="col-span-1 hidden lg:block h-fit sticky top-24 bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4 text-success" />
                  Filter Options
                </h3>
                {hasActiveFilters && (
                  <button 
                    onClick={() => setFilters({ category: "all", location: "", priceRange: [0, 10000], sortBy: "newest" })}
                    className="text-xs text-success hover:text-success font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {/* Category radio selectors */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                <div className="space-y-2">
                  {[
                    { id: "all", label: "All Products" },
                    { id: "grains", label: "Grains" },
                    { id: "tubers", label: "Tubers & Roots" },
                    { id: "vegetables", label: "Vegetables" },
                    { id: "fruits", label: "Fruits" },
                    { id: "legumes", label: "Legumes" }
                  ].map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer py-0.5">
                      <input 
                        type="radio" 
                        name="desktop-category" 
                        checked={filters.category === cat.id} 
                        onChange={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                        className="text-success focus:ring-success border-border"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="E.g. Lagos, Zaria..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="pl-9 text-xs h-9 border-border focus-visible:ring-success"
                  />
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Price Range</label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                  max={10000}
                  min={0}
                  step={100}
                  className="py-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>₦{filters.priceRange[0]}</span>
                  <span>₦{filters.priceRange[1]}</span>
                </div>
              </div>

              {/* Sort selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="w-full text-xs h-9 border-border">
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

            {/* Listings Column */}
            <div className="col-span-1 lg:col-span-3 space-y-6">
              
              {/* Desktop Sorting Toolbar */}
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-xs sm:text-sm font-semibold text-foreground">
                  Showing <span className="text-success">{products.length}</span> verified results
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-[130px] text-xs h-8 border-border lg:hidden">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price_low">Price: Low-High</SelectItem>
                      <SelectItem value="price_high">Price: High-Low</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border border-border rounded-lg overflow-hidden bg-muted p-0.5">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`h-7 w-7 p-0 rounded-md ${viewMode === "grid" ? "bg-card text-success shadow-sm border border-border" : "text-muted-foreground hover:text-muted-foreground"}`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={`h-7 w-7 p-0 rounded-md ${viewMode === "list" ? "bg-card text-success shadow-sm border border-border" : "text-muted-foreground hover:text-muted-foreground"}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-semibold">Active:</span>
                  {filters.category !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-primary-soft text-primary border border-primary/30 rounded-full font-medium text-[11px]">
                      <span className="capitalize">Category: {filters.category}</span>
                      <button onClick={() => setFilters(prev => ({ ...prev, category: "all" }))} className="text-success hover:text-success font-bold ml-0.5">×</button>
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-primary-soft text-primary border border-primary/30 rounded-full font-medium text-[11px]">
                      <span>Loc: {filters.location}</span>
                      <button onClick={() => setFilters(prev => ({ ...prev, location: "" }))} className="text-success hover:text-success font-bold ml-0.5">×</button>
                    </Badge>
                  )}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-primary-soft text-primary border border-primary/30 rounded-full font-medium text-[11px]">
                      <span>Price: ₦{filters.priceRange[0]} - ₦{filters.priceRange[1]}</span>
                      <button onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 10000] }))} className="text-success hover:text-success font-bold ml-0.5">×</button>
                    </Badge>
                  )}
                  <button 
                    onClick={() => setFilters({ category: "all", location: "", priceRange: [0, 10000], sortBy: "newest" })}
                    className="text-xs text-success hover:text-success hover:underline font-bold ml-1.5"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Products Listings Grid */}
              <div className="relative">
                {isRefreshing && (
                  <div className="absolute right-0 -top-12 z-10 flex items-center gap-2 rounded-md bg-card/95 px-2.5 py-1 text-xs text-success border border-success/10 shadow-sm">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-success" />
                    Syncing database…
                  </div>
                )}
                
                <StaggerGrid
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
                      : "space-y-4"
                  }
                  resetKey={`${viewMode}-${adjustedProducts.map((p) => listingItemId(p)).join(",")}`}
                >
                  {adjustedProducts.map((product) => (
                    <MarketplaceCard
                      key={listingItemId(product)}
                      product={convertToMarketplaceProduct(product)}
                      variant={viewMode === "list" ? "compact" : "default"}
                      onAddToCart={(id) => handleMarketplaceAction("addToCart", id)}
                      onView={(id) => handleMarketplaceAction("view", id)}
                      onContact={(id) => handleMarketplaceAction("contact", id)}
                      onShare={(id) => handleMarketplaceAction("share", id)}
                    />
                  ))}
                </StaggerGrid>
              </div>

              {/* Empty state */}
              {products.length === 0 && !isInitialLoading && !isRefreshing && (
                <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">No products found</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">Try adjusting your filters or keyword to discover other available harvests.</p>
                  <Button 
                    onClick={() => setFilters({ category: "all", location: "", priceRange: [0, 10000], sortBy: "newest" })}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary-soft"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Premium Market Intelligence Section */}
          <div className="border-t border-border pt-10 mt-16 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div>
                <Badge className="bg-success/10 text-success border-none font-semibold mb-2">
                  Live Market Intelligence
                </Badge>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  Real-time Trade Activity & Verified Volume
                </h3>
                <p className="text-muted-foreground text-sm">
                  Transparency metrics and buyer transactions directly sourced from the GroChain ledger.
                </p>
              </div>
              <Button asChild variant="outline" className="border-border hover:bg-muted text-foreground rounded-xl text-xs sm:text-sm">
                <Link href="/marketplace/buyers" className="inline-flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-success" />
                  Show Verified Buyers List
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Live Stats */}
              <Card className="bg-success text-success-foreground shadow-lg border-none overflow-hidden relative rounded-2xl h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-success/10 rounded-full blur-2xl pointer-events-none" />
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wider text-success-foreground uppercase flex items-center gap-2">
                    <Activity className="h-4 w-4 text-success-foreground" />
                    Market Ticker
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="bg-black/15 p-4 rounded-xl border border-white/20">
                    <div className="text-3xl font-bold text-success-foreground mb-0.5">
                      {buyerActivity.activeBuyers}
                    </div>
                    <div className="text-xs text-success-foreground/80 font-semibold">Active Buyers Last 30 Days</div>
                  </div>

                  <div className="bg-black/15 p-4 rounded-xl border border-white/20">
                    <div className="text-3xl font-bold text-success-foreground mb-0.5">
                      {buyerActivity.todaysTransactions}
                    </div>
                    <div className="text-xs text-success-foreground/80 font-semibold">Trades Settled Today</div>
                  </div>

                  <div className="bg-black/15 p-4 rounded-xl border border-white/20">
                    <div className="text-3xl font-bold text-success-foreground mb-0.5">
                      {buyerActivity.averageRating > 0 ? `${buyerActivity.averageRating} ★` : "—"}
                    </div>
                    <div className="text-xs text-success-foreground/80 font-semibold">Average Farmer Quality Score</div>
                  </div>
                </CardContent>
              </Card>

              {/* Column 2: Recently Listed (real data) */}
              <Card className="bg-card border border-border shadow-sm rounded-2xl h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-success" />
                    Recently Listed
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 pt-0">
                  {products.length > 0 ? (
                    <div className="space-y-3.5">
                      {products.slice(0, 4).map((product) => (
                        <div key={product.id} className="flex justify-between items-start text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                          <div className="space-y-0.5 pr-2">
                            <p className="font-semibold text-foreground leading-tight">
                              {product.name} · {product.location}
                            </p>
                            <span className="text-[10px] text-success font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {product.isVerified ? "Verified Listing" : "Listed"}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">
                            ₦{Number(product.price || 0).toLocaleString()}/{product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center">No recent listings yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Column 3: Trust & Testimonials */}
              <Card className="bg-card border border-border shadow-sm rounded-2xl h-full flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-4 w-4 text-success" />
                    Consumer Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every bag of produce bought here contains a QR code linked to the farmer's batch record. Scan it to verify harvest dates, soil health logs, and chemical spray inputs.
                  </p>
                  
                  <div className="p-3 bg-muted border border-border rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 text-success font-bold text-xs">
                      FO
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] sm:text-xs text-muted-foreground italic">
                        "Uncompromising cassava quality directly from the source. The verification logs ensure complete safety compliance for my restaurants."
                      </p>
                      <p className="text-[10px] font-semibold text-foreground">
                        - Food Vendor, Victoria Island
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted border border-border rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 text-success font-bold text-xs">
                      SM
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] sm:text-xs text-muted-foreground italic">
                        "Direct delivery to our distribution center. Bypassing intermediaries reduced our supply cost by 25%."
                      </p>
                      <p className="text-[10px] font-semibold text-foreground">
                        - Procurement, Retail Chain, Abuja
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

        </PageContainer>
      </main>

      <Footer />
    </div>
  )
}
