"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { useAuthStore } from "@/lib/auth"
import { usePriceAlerts } from "@/hooks/use-price-alerts"
import { PriceAlertDialog } from "@/components/dialogs/price-alert-dialog"
import { useExportService } from "@/lib/export-utils"
import {
  Heart,
  Search,
  MapPin,
  Star,
  ShoppingCart,
  Eye,
  Trash2,
  Bell,
  RefreshCw,
  Grid3X3,
  List,
  Plus,
  AlertCircle,
  Users,
  Package,
  Leaf,
  Download
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import Image from "next/image"

interface FavoriteProduct {
  _id: string
  listing: {
    _id: string
    cropName: string
    category: string
    description: string
    basePrice: number
    unit: string
    quantity: number
    availableQuantity: number
    location: {
      city: string
      state: string
    }
    images: string[]
    qualityGrade: string
    organic: boolean
    farmer: {
      _id: string
      name: string
      location: string
    }
    harvest?: {
      batchId: string
      cropType: string
      quality: string
    }
  }
  addedAt: string
  notes?: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { addToCart, removeFromFavorites, fetchFavorites, addToFavorites, profile } = useBuyerStore()
  const { user } = useAuthStore()
  const { hasAlertForProduct, getAlertForProduct, createAlert, updateAlert } = usePriceAlerts()
  const exportService = useExportService()

  // Fetch favorites from backend
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      // Add a small delay to ensure auth state is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        setLoading(true)
        setError(null)

        await fetchFavorites()

        // Get favorites from the store after fetching
        const storeFavorites = useBuyerStore.getState().favorites

        if (Array.isArray(storeFavorites)) {
          setFavorites(storeFavorites)
          setFilteredFavorites(storeFavorites)
        } else {
          setFavorites([])
          setFilteredFavorites([])
        }
      } catch (error: any) {
        // Don't show error toast for authentication issues, just log them
        if (error.message === 'User not authenticated') {
          setFavorites([])
          setFilteredFavorites([])
        } else {
          setError(error.message || 'Failed to load favorites')
          toast({
            title: "Error",
            description: "Failed to load your favorites. Please try again.",
            variant: "destructive"
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [user, fetchFavorites, toast])

  // Update filtered favorites when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFavorites(favorites)
    } else {
      const filtered = favorites.filter(favorite => {
        const product = favorite.listing
        const searchLower = searchQuery.toLowerCase()
        return (
          product.cropName.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.farmer.name.toLowerCase().includes(searchLower) ||
          product.location.city.toLowerCase().includes(searchLower) ||
          product.location.state.toLowerCase().includes(searchLower)
        )
      })
      setFilteredFavorites(filtered)
    }
  }, [searchQuery, favorites])

  const handleAddToCart = async (product: FavoriteProduct) => {
    try {
      // Convert favorite product to cart format
      const cartProduct = {
        _id: product.listing._id,
        listingId: product.listing._id,
        cropName: product.listing.cropName,
        price: product.listing.basePrice,
        unit: product.listing.unit,
        availableQuantity: product.listing.quantity,
        farmer: product.listing.farmer.name,
        location: typeof product.listing.location === 'string'
          ? product.listing.location
          : `${product.listing.location?.city || 'Unknown'}, ${product.listing.location?.state || 'Unknown State'}`,
        image: product.listing.images[0] || "/placeholder.svg"
      }

      addToCart(cartProduct, 1)
      toast({
        title: "Added to cart",
        description: `${product.listing.cropName} has been added to your cart`,
      })
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddToFavorites = async (listingId: string, notes?: string) => {
    try {
      await addToFavorites(listingId, notes)
      toast({
        title: "Added to favorites",
        description: "Product has been added to your favorites",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveFromFavorites = async (favoriteId: string, listingId: string) => {
    try {
      await removeFromFavorites(listingId)
      setFavorites(prev => prev.filter(fav => fav._id !== favoriteId))
      setFilteredFavorites(prev => prev.filter(fav => fav._id !== favoriteId))
      toast({
        title: "Removed from favorites",
        description: "Product has been removed from your favorites",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAlertClick = (product: FavoriteProduct) => {
    const productData = {
      _id: product.listing._id,
      cropName: product.listing.cropName,
      basePrice: product.listing.basePrice,
      images: product.listing.images,
      category: product.listing.category
    }
    setSelectedProduct(productData)
    setAlertDialogOpen(true)
  }

  const handleAlertSuccess = () => {
    // Refresh alerts or show success message
    toast({
      title: "Price alert set up!",
      description: "You'll be notified when the price changes.",
    })
  }

  const handleRefresh = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      await fetchFavorites()

      const storeFavorites = useBuyerStore.getState().favorites
      if (Array.isArray(storeFavorites)) {
        setFavorites(storeFavorites)
        setFilteredFavorites(storeFavorites)
      }

      toast({
        title: "Refreshed",
        description: "Your favorites have been updated",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh favorites. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportFavorites = async () => {
    if (favorites.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any favorites to export yet.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsExporting(true)
      const result = await exportService.exportFavorites({
        format: 'csv',
        filename: `favorites-export-${new Date().toISOString().split('T')[0]}.csv`
      })

      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export favorites. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getQualityGrade = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'excellent':
      case 'premium':
        return 'premium'
      case 'good':
      case 'standard':
        return 'standard'
      case 'fair':
      case 'basic':
        return 'basic'
      default:
        return 'standard'
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="My Favorites">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Loading favorites...</p>
            <p className="text-sm text-muted-foreground">
              {!user ? 'Waiting for authentication...' : 'Fetching your favorites...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="My Favorites">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h3 className="text-lg font-semibold">Error Loading Favorites</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="My Favorites">
      <div className="space-y-6">

        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Favorites</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your saved products, set price alerts, and track price changes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={handleExportFavorites}
                    disabled={isExporting || favorites.length === 0}
                  >
                    <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {favorites.length === 0
                      ? 'No favorites to export'
                      : `Export ${favorites.length} favorites to CSV`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" asChild className="flex-shrink-0">
              <Link href="/dashboard/products">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Browse Products</span>
                <span className="sm:hidden">Browse</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Using Design System */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.length}</div>
              <p className="text-xs text-muted-foreground">
                Products in your favorites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(favorites.map(fav => fav.listing?.farmer?._id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different farmers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organic Products</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {favorites.filter(fav => fav.listing?.organic).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Certified organic items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(favorites.map(fav => fav.listing?.category)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Favorites List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Favorites Management</CardTitle>
                <CardDescription>
                  Organize and manage your favorite products
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredFavorites.length} of {favorites.length} items
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search favorites, products, or farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:max-w-md"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2">
                <div className="text-sm text-muted-foreground sm:hidden">
                  {filteredFavorites.length} item{filteredFavorites.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-8 px-3"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportFavorites}
                          className="h-8 px-3"
                          disabled={isExporting || favorites.length === 0}
                        >
                          <Download className={`h-4 w-4 mr-1 ${isExporting ? 'animate-spin' : ''}`} />
                          Export
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {favorites.length === 0
                            ? 'No favorites to export'
                            : `Export ${favorites.length} favorites to CSV`
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Favorites Grid/List */}
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No matching favorites found' : 'No favorites found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms or clear the search to see all favorites.'
                    : 'You haven\'t added any products to your favorites yet.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/dashboard/products">
                      Browse Products
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                : 'space-y-4'
              }>
                {filteredFavorites.map((product) => (
                  <FavoriteCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    onRemoveFromFavorites={handleRemoveFromFavorites}
                    onAlertClick={handleAlertClick}
                    formatPrice={formatPrice}
                    getQualityGrade={getQualityGrade}
                    hasAlert={hasAlertForProduct(product.listing._id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price Alert Dialog */}
      {selectedProduct && (
        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          product={selectedProduct}
          existingAlert={getAlertForProduct(selectedProduct._id)}
          onSuccess={handleAlertSuccess}
        />
      )}
    </DashboardLayout>
  )
}

interface FavoriteCardProps {
  product: FavoriteProduct
  viewMode: 'grid' | 'list'
  onAddToCart: (product: FavoriteProduct) => void
  onRemoveFromFavorites: (favoriteId: string, listingId: string) => void
  onAlertClick: (product: FavoriteProduct) => void
  formatPrice: (price: number) => string
  getQualityGrade: (quality: string) => string
  hasAlert: boolean
}

function FavoriteCard({
  product,
  viewMode,
  onAddToCart,
  onRemoveFromFavorites,
  onAlertClick,
  formatPrice,
  getQualityGrade,
  hasAlert
}: FavoriteCardProps) {
  const listing = product.listing
  const qualityGrade = getQualityGrade(listing.qualityGrade)

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            {/* Product Image */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={listing.images[0] || "/placeholder.svg"}
                alt={listing.cropName}
                fill
                className="rounded-lg object-cover"
              />
              {listing.organic && (
                <Badge className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1 py-0.5">
                  Organic
                </Badge>
              )}
              {qualityGrade === 'premium' && (
                <Badge className="absolute top-1 right-1 bg-yellow-600 text-white text-[10px] px-1 py-0.5">
                  Premium
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {listing.cropName}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    by {listing.farmer?.name || 'Unknown'}
                  </p>
                  {product.notes && (
                    <p className="text-xs text-blue-600 italic mb-1">
                      Note: {product.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">
                      {formatPrice(listing.basePrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {listing.unit}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFromFavorites(product._id, listing._id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{typeof listing.location === 'string' ? listing.location : `${listing.location?.city || 'Unknown'}, ${listing.location?.state || 'Unknown State'}`}</span>
                </div>
                <div className="text-xs">
                  {listing.quantity} {listing.unit} available
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => onAddToCart(product)}
                  className="h-7 text-xs"
                  size="sm"
                >
                  <ShoppingCart className="h-3 w-3 mr-1.5" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link href={`/dashboard/products/${listing._id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAlertClick(product)}
                >
                  <Bell className={`h-3 w-3 mr-1 ${hasAlert ? 'fill-current' : ''}`} />
                  {hasAlert ? 'Alert Set' : 'Alert'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view - Compact and beautiful design
  return (
    <Card className="group hover:shadow-lg transition-shadow h-full">
      <CardHeader className="p-0">
        <div className="relative h-40 overflow-hidden rounded-t-lg">
          <Image
            src={listing.images[0] || "/placeholder.svg"}
            alt={listing.cropName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {listing.organic && (
              <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                Organic
              </Badge>
            )}
            {qualityGrade === 'premium' && (
              <Badge className="bg-yellow-600 text-white text-[10px] px-1.5 py-0.5">
                Premium
              </Badge>
            )}
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFromFavorites(product._id, listing._id)}
            className="absolute top-1.5 right-1.5 h-6 w-6 p-0 bg-white/90 hover:bg-white text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {/* Price overlay */}
          <div className="absolute bottom-1.5 right-1.5 bg-white/95 backdrop-blur-sm rounded-md px-1.5 py-1">
            <div className="text-sm font-bold text-gray-900">
              {formatPrice(listing.basePrice)}
            </div>
            <div className="text-[10px] text-gray-600 text-center leading-none">
              per {listing.unit}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="space-y-1.5 flex-1">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">
              {listing.cropName}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {listing.farmer?.name || 'Unknown'}
            </p>
            {product.notes && (
              <p className="text-xs text-blue-600 italic line-clamp-1">
                &quot;{product.notes}&quot;
              </p>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {typeof listing.location === 'string' ? listing.location : `${listing.location?.city || 'Unknown'}, ${listing.location?.state || 'Unknown State'}`}
            </span>
          </div>

          {/* Availability */}
          <div className="text-xs text-muted-foreground">
            {listing.availableQuantity || listing.quantity} {listing.unit} available
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1.5 mt-3">
          <Button
            onClick={() => onAddToCart(product)}
            className="w-full h-7 text-xs"
            size="sm"
          >
            <ShoppingCart className="h-3 w-3 mr-1.5" />
            Add to Cart
          </Button>

          <div className="grid grid-cols-2 gap-1">
            <Button variant="outline" size="sm" className="h-6 text-xs" asChild>
              <Link href={`/dashboard/products/${listing._id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onAlertClick(product)}
            >
              <Bell className={`h-3 w-3 mr-1 ${hasAlert ? 'fill-current' : ''}`} />
              {hasAlert ? 'Alert Set' : 'Alert'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
