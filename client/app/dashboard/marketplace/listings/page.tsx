"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Banknote,
  MapPin,
  TrendingUp,
  TrendingDown,
  EyeOff,
  Archive,
  ShoppingCart,
  ArrowLeft,
  Upload,
  Star,
  MoreHorizontal,
  Trash2,
  Settings
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Listing {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
  }
  cropName: string
  category: string
  description: string
  basePrice: number
  unit: string
  quantity: number
  availableQuantity: number
  images: string[]
  location: string | {
    city: string
    state: string
    country: string
    coordinates: number[]
  }
  status: 'draft' | 'active' | 'inactive' | 'sold' | 'paused'
  tags: string[]
  qualityGrade: string
  organic: boolean
  harvestDate: string
  expiryDate: string
  views: number
  favorites: number
  orders: number
  rating: number
  reviews: number
  createdAt: string
  updatedAt: string
}

interface ListingStats {
  totalListings: number
  activeListings: number
  draftListings: number
  inactiveListings: number
  totalViews: number
  totalOrders: number
  totalRevenue: number
  averagePrice: number
  topCategory: string
  mostViewedCrop: string
  conversionRate: number
}

export default function MarketplaceListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<ListingStats>({
    totalListings: 0,
    activeListings: 0,
    draftListings: 0,
    inactiveListings: 0,
    totalViews: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averagePrice: 0,
    topCategory: '',
    mostViewedCrop: '',
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showListingDetails, setShowListingDetails] = useState(false)
  const [updatingListing, setUpdatingListing] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    filterListings()
  }, [listings, searchQuery, statusFilter, categoryFilter, priceFilter])

  const fetchListings = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching listings...")

      // Fetch farmer's listings from backend
      const response = await apiService.getFarmerListings()
      console.log("📦 Farmer Listings API Response:", response)

      if (response?.status === 'success' && (response.data as any)?.listings) {
        const listingsData = (response.data as any).listings
        console.log("✅ Farmer listings data:", listingsData)

        // Process farmer's listings
        const processedListings = listingsData.map((listing: any) => ({
          _id: listing._id,
          farmer: listing.farmer || { _id: '', name: 'You', email: '' },
          cropName: listing.cropName || 'Unknown Crop',
          category: listing.category || 'General',
          description: listing.description || '',
          basePrice: listing.basePrice || 0,
          unit: listing.unit || 'kg',
          quantity: listing.quantity || 0,
          availableQuantity: listing.availableQuantity || listing.quantity || 0,
          images: listing.images || [],
          location: listing.location || {
            city: '',
            state: '',
            country: 'Nigeria',
            coordinates: [0, 0]
          },
          status: listing.status || 'active',
          tags: listing.tags || [],
          qualityGrade: listing.qualityGrade || 'Standard',
          organic: listing.organic || false,
          harvestDate: listing.harvestDate || '',
          expiryDate: listing.expiryDate || '',
          views: listing.views || 0,
          favorites: listing.favorites || 0,
          orders: listing.orders || 0,
          rating: listing.rating || 0,
          reviews: listing.reviews || 0,
          createdAt: listing.createdAt || new Date().toISOString(),
          updatedAt: listing.updatedAt || new Date().toISOString()
        }))

        setListings(processedListings)

        // Calculate stats
        calculateStats(processedListings)

      } else {
        console.warn("⚠️ Listings response not in expected format:", response)
        setListings([])
      }

    } catch (error) {
      console.error("❌ Failed to fetch listings:", error)
      toast({
        title: "Error",
        description: "Failed to load listings. Please try again.",
        variant: "destructive"
      })
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (listingsData: Listing[]) => {
    const totalListings = listingsData.length
    const activeListings = listingsData.filter(l => l.status === 'active').length
    const draftListings = listingsData.filter(l => l.status === 'draft').length
    const inactiveListings = listingsData.filter(l => l.status === 'inactive').length

    const totalViews = listingsData.reduce((sum, listing) => sum + (listing.views || 0), 0)
    const totalOrders = listingsData.reduce((sum, listing) => sum + (listing.orders || 0), 0)
    const totalRevenue = listingsData.reduce((sum, listing) => sum + ((listing.orders || 0) * listing.basePrice), 0)

    const averagePrice = totalListings > 0
      ? listingsData.reduce((sum, listing) => sum + listing.basePrice, 0) / totalListings
      : 0

    // Find top category
    const categoryCount = listingsData.reduce((acc, listing) => {
      acc[listing.category] = (acc[listing.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topCategory = Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).reduce((a, b) =>
          categoryCount[a] > categoryCount[b] ? a : b, ''
        )
      : ''

    // Find most viewed crop
    const mostViewedCrop = listingsData.length > 0
      ? listingsData.reduce((prev, current) =>
          (prev.views || 0) > (current.views || 0) ? prev : current
        )?.cropName || ''
      : ''

    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0

    setStats({
      totalListings,
      activeListings,
      draftListings,
      inactiveListings,
      totalViews,
      totalOrders,
      totalRevenue,
      averagePrice,
      topCategory,
      mostViewedCrop,
      conversionRate
    })
  }

  const filterListings = () => {
    let filtered = [...listings]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.farmer.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(listing => listing.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category === categoryFilter)
    }

    // Price filter
    if (priceFilter !== 'all') {
      const priceRanges = {
        'low': [0, 5000],
        'medium': [5000, 20000],
        'high': [20000, 100000],
        'premium': [100000, Infinity]
      }
      const [min, max] = priceRanges[priceFilter as keyof typeof priceRanges] || [0, Infinity]
      filtered = filtered.filter(listing => listing.basePrice >= min && listing.basePrice <= max)
    }

    setFilteredListings(filtered)
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchListings()
      toast({
        title: "Refreshed",
        description: "Listings data has been updated",
      })
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      setUpdatingListing(listingId)
      console.log(`🔄 Updating listing ${listingId} to status: ${newStatus}`)

      await apiService.updateListingStatus(listingId, newStatus)

      // Update local state
      setListings(prev => prev.map(listing =>
        listing._id === listingId
          ? { ...listing, status: newStatus } as Listing
          : listing
      ))

      toast({
        title: "Success",
        description: `Listing status updated to ${newStatus}`,
      })

      // Recalculate stats
      const updatedListings = listings.map(listing =>
        listing._id === listingId
          ? { ...listing, status: newStatus } as Listing
          : listing
      )
      calculateStats(updatedListings)

    } catch (error) {
      console.error("❌ Failed to update listing status:", error)
      toast({
        title: "Error",
        description: "Failed to update listing status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingListing(null)
    }
  }

  const handleUnpublishListing = async (listingId: string) => {
    try {
      setUpdatingListing(listingId)
      console.log(`🔄 Unpublishing listing ${listingId}`)

      await apiService.unpublishListing(listingId)

      // Update local state
      setListings(prev => prev.map(listing =>
        listing._id === listingId
          ? { ...listing, status: 'inactive' as const }
          : listing
      ))

      toast({
        title: "Success",
        description: "Listing unpublished successfully",
      })

      // Recalculate stats
      const updatedListings = listings.map(listing =>
        listing._id === listingId
          ? { ...listing, status: 'inactive' as const }
          : listing
      )
      calculateStats(updatedListings)

    } catch (error) {
      console.error("❌ Failed to unpublish listing:", error)
      toast({
        title: "Error",
        description: "Failed to unpublish listing. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingListing(null)
    }
  }

  const handleViewListingDetails = (listing: Listing) => {
    setSelectedListing(listing)
    setShowListingDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'sold': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategories = () => {
    const categories = Array.from(new Set(listings.map(l => l.category)))
    return categories.filter(cat => cat && cat !== '')
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Marketplace Listings">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace Listings">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Listings Management</h1>
              <p className="text-gray-600">
                Manage your product listings and track their performance
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button asChild>
              <Link href="/dashboard/marketplace/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Total Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
              <p className="text-xs text-gray-500">{stats.activeListings} active</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-500" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Across all listings</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500">{stats.conversionRate.toFixed(1)}% conversion rate</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-500" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.averagePrice)}/unit</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900">{stats.topCategory || 'N/A'}</div>
              <p className="text-xs text-gray-500">Most listed category</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Most Viewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900">{stats.mostViewedCrop || 'N/A'}</div>
              <p className="text-xs text-gray-500">Highest engagement</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{stats.activeListings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Draft:</span>
                  <span className="font-medium">{stats.draftListings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Inactive:</span>
                  <span className="font-medium">{stats.inactiveListings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search listings by crop, category, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getCategories().map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">₦0 - ₦5,000</SelectItem>
                    <SelectItem value="medium">₦5,000 - ₦20,000</SelectItem>
                    <SelectItem value="high">₦20,000 - ₦100,000</SelectItem>
                    <SelectItem value="premium">₦100,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings List */}
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <Card className="text-center py-12 border border-gray-200">
              <div className="text-gray-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {listings.length === 0 ? 'No Listings Yet' : 'No Listings Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {listings.length === 0
                  ? "Create your first listing to start selling your agricultural products."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {listings.length === 0 && (
                <Button asChild>
                  <Link href="/dashboard/marketplace/listings/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            filteredListings.map((listing) => (
              <Card key={listing._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {listing.images && listing.images.length > 0 ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.cropName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {listing.cropName}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getStatusColor(listing.status)}>
                                {listing.status}
                              </Badge>
                              {listing.organic && (
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                  Organic
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                            <span>{listing.category}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{listing.qualityGrade}</span>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{typeof listing.location === 'string' ? listing.location : `${listing.location?.city || 'Unknown'}, ${listing.location?.state || 'Unknown State'}`}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(listing.basePrice)}
                          </div>
                          <div className="text-sm text-gray-600">
                            per {listing.unit}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {listing.description || 'No description provided'}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="h-3 w-3" />
                          <span>{listing.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Star className="h-3 w-3" />
                          <span>{listing.rating || 0} ({listing.reviews || 0} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <ShoppingCart className="h-3 w-3" />
                          <span>{listing.orders || 0} orders</span>
                        </div>
                        <div className="text-gray-600">
                          {listing.availableQuantity}/{listing.quantity} {listing.unit} available
                        </div>
                      </div>

                      {/* Tags */}
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {listing.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {listing.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{listing.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewListingDetails(listing)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link href={`/dashboard/marketplace/listings/${listing._id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>

                      {listing.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnpublishListing(listing._id)}
                          disabled={updatingListing === listing._id}
                          className="w-full sm:w-auto"
                        >
                          {updatingListing === listing._id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <EyeOff className="h-4 w-4 mr-1" />
                          )}
                          Unpublish
                        </Button>
                      )}

                      {listing.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateListingStatus(listing._id, 'active')}
                          disabled={updatingListing === listing._id}
                          className="w-full sm:w-auto"
                        >
                          {updatingListing === listing._id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Listing Details Modal */}
        {showListingDetails && selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {selectedListing.cropName} Details
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowListingDetails(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(selectedListing.status)}>
                      {selectedListing.status}
                    </Badge>
                    {selectedListing.organic && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Organic
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">
                      {formatDate(selectedListing.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/marketplace/listings/${selectedListing._id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>

                {/* Images */}
                {selectedListing.images && selectedListing.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Product Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedListing.images.map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`${selectedListing.cropName} ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Product Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Category:</span>
                        <span>{selectedListing.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quality Grade:</span>
                        <span>{selectedListing.qualityGrade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Price:</span>
                        <span>{formatCurrency(selectedListing.basePrice)} per {selectedListing.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quantity:</span>
                        <span>{selectedListing.availableQuantity}/{selectedListing.quantity} {selectedListing.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Location:</span>
                        <span>{typeof selectedListing.location === 'string' ? selectedListing.location : `${selectedListing.location?.city || 'Unknown'}, ${selectedListing.location?.state || 'Unknown State'}`}</span>
                      </div>
                      {selectedListing.harvestDate && (
                        <div className="flex justify-between">
                          <span className="font-medium">Harvest Date:</span>
                          <span>{formatDate(selectedListing.harvestDate)}</span>
                        </div>
                      )}
                      {selectedListing.expiryDate && (
                        <div className="flex justify-between">
                          <span className="font-medium">Expiry Date:</span>
                          <span>{formatDate(selectedListing.expiryDate)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Views:</span>
                        <span>{selectedListing.views || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Favorites:</span>
                        <span>{selectedListing.favorites || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Orders:</span>
                        <span>{selectedListing.orders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Rating:</span>
                        <span>{selectedListing.rating || 0} ⭐ ({selectedListing.reviews || 0} reviews)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Revenue:</span>
                        <span>{formatCurrency((selectedListing.orders || 0) * selectedListing.basePrice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {selectedListing.description || 'No description provided'}
                    </p>
                  </CardContent>
                </Card>

                {/* Tags */}
                {selectedListing.tags && selectedListing.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedListing.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
