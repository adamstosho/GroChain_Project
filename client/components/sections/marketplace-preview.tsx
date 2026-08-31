"use client"

import { useState, useEffect, useCallback } from "react"
import { useStableDataFetch } from "@/hooks/use-stable-data-fetch"
import { extractListingsFromResponse } from "@/lib/marketplace-listings"
import { asRecord } from "@/lib/error-utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Eye, ShoppingCart } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { ScrollStagger, StaggerItem } from "@/components/motion/stagger-container"
import { MarketingSection } from "@/components/layout/marketing-section"
import { SectionHeader, Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

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
  const { isInitialLoading, begin, finish } = useStableDataFetch()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()

  const fetchFeaturedProducts = useCallback(async () => {
    const generation = begin()
    try {
      const response = await apiService.getMarketplaceListings({
        limit: 6,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      const listings = extractListingsFromResponse(response.data ?? response)

      // Convert backend format to frontend format
      const convertedProducts = listings.slice(0, 6).map((listing) => {
        const farmer = asRecord(listing.farmer)
        const loc = listing.location
        let location = "Location N/A"
        if (typeof loc === "string") {
          location = loc
        } else if (loc && typeof loc === "object") {
          const rec = asRecord(loc)
          location = `${typeof rec.city === "string" ? rec.city : ""}, ${typeof rec.state === "string" ? rec.state : ""}`.replace(/^, |, $/, "").trim() || "Location N/A"
        }
        return {
        id: typeof listing._id === "string" ? listing._id : String(listing.id ?? ""),
        name: typeof listing.cropName === "string" ? listing.cropName : "",
        category: typeof listing.category === "string" ? listing.category : "",
        description: typeof listing.description === "string" ? listing.description : "",
        price: typeof listing.basePrice === "number" ? listing.basePrice : 0,
        unit: typeof listing.unit === "string" ? listing.unit : "",
        location,
        images: Array.isArray(listing.images) ? listing.images.filter((img): img is string => typeof img === "string") : [],
        rating: typeof listing.rating === "number" ? listing.rating : 4.5,
        farmerName: typeof farmer.name === "string" ? farmer.name : "Local Farmer",
        farmerId: typeof farmer._id === "string" ? farmer._id : "unknown",
        quantity: typeof listing.quantity === "number" ? listing.quantity : 0,
        availableQuantity: typeof listing.availableQuantity === "number" ? listing.availableQuantity : 0,
        quality: typeof listing.qualityGrade === "string" ? listing.qualityGrade : "",
        organic: Boolean(listing.organic),
        tags: Array.isArray(listing.tags) ? listing.tags.filter((tag): tag is string => typeof tag === "string") : [],
        createdAt: typeof listing.createdAt === "string" ? listing.createdAt : "",
        qrCode: typeof listing.qrCode === "string" ? listing.qrCode : undefined,
      }
      })

      setProducts(convertedProducts)
      finish(generation)
    } catch (error) {
      console.error("Failed to fetch featured products:", error)
      finish(generation)
      setProducts((prev) => (prev.length > 0 ? prev : []))
    }
  }, [begin, finish])

  useEffect(() => {
    fetchFeaturedProducts()
  }, [fetchFeaturedProducts])

  const handleAddToCart = () => {
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
    const qrCode = product.qrCode
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
    <MarketingSection id="marketplace" className="bg-muted/40">
        <ScrollReveal>
          <SectionHeader
            badge={<Badge variant="secondary">Marketplace</Badge>}
            title="Produce from verified farmers"
            description="Listings show origin, grade, and a QR code so a buyer can check a batch before they pay."
          />
          <div className="-mt-8 mb-12 text-center sm:mb-14">
            <Button asChild size="lg">
              <Link href="/marketplace">View All Products</Link>
            </Button>
          </div>
        </ScrollReveal>

        {/* Products Grid */}
        {isInitialLoading && products.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <ScrollStagger className={`${layout.gridCards} mb-8`}>
            {products.map((product) => (
              <StaggerItem key={product.id}>
              <Card className="overflow-hidden h-full border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/15 hover:-translate-y-1">
                {/* Product Image */}
                <div className="relative h-48 bg-muted">
                  {product.images && product.images.length > 0 ? (
                    <SafeImage
                      src={product.images[0]}
                      alt={typeof product.name === 'string' ? product.name : 'Fresh agricultural product'}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground text-sm">No Image</div>
                    </div>
                  )}

                  {/* Quality Badge */}
                  {product.quality && (
                    <Badge className="absolute top-2 left-2 bg-success">
                      {product.quality}
                    </Badge>
                  )}

                  {/* Organic Badge */}
                  {product.organic && (
                    <Badge className="absolute top-2 right-2 bg-warning">
                      Organic
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Name & Category */}
                  <div className="mb-2">
                    <Display as="h3" variant="card" className="line-clamp-1">
                      {typeof product.name === 'string' ? product.name : 'Unnamed Product'}
                    </Display>
                    <p className="text-sm text-muted-foreground capitalize">
                      {typeof product.category === 'string' ? product.category : 'Agricultural Product'}
                    </p>
                  </div>

                  {/* Farmer Info */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm text-muted-foreground">by</span>
                    <span className="text-sm font-medium text-foreground">
                      {typeof product.farmerName === 'string'
                        ? product.farmerName
                        : 'Local Farmer'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {typeof product.location === 'string'
                        ? product.location
                        : 'Location N/A'}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm text-muted-foreground">
                      {typeof product.rating === "number" ? product.rating.toFixed(1) : "—"}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Text as="span" variant="price" className="text-success">
                        ₦{typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                      </Text>
                      <span className="text-sm text-muted-foreground ml-1">
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
                      disabled={!product.qrCode}
                    >
                      QR
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart()}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {isAuthenticated ? 'Add to Cart' : 'Login to Buy'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              </StaggerItem>
            ))}
          </ScrollStagger>
        ) : (
          <ScrollReveal>
          <Card className="mb-8 border-dashed border-border/60 bg-card/50">
            <CardContent className="p-10 text-center space-y-3">
              <Display as="h3" variant="card">No listings on the public market yet</Display>
              <Text variant="sm" className="mx-auto max-w-xl">
                When farmers publish harvests, they will show up here with origin, grade, and a QR code to scan. Until
                then you can open the marketplace or register to list the first batches.
              </Text>
            </CardContent>
          </Card>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.1}>
        <div className="text-center">
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-8 sm:p-10">
            <Display as="h3" variant="card" className="mb-2">
              {products.length > 0 ? "See the full marketplace" : "List or browse produce"}
            </Display>
            <Text variant="sm" className="mb-6">
              {products.length > 0
                ? "Open the marketplace for the full catalogue, or register to sell your own harvest."
                : "Farmers list batches with a QR trail. Buyers browse and verify before they buy."}
            </Text>
            <div className={layout.actionsRow + " justify-center"}>
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
        </ScrollReveal>
    </MarketingSection>
  )
}
