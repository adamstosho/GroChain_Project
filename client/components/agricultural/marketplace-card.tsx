"use client"

import { useState, type MouseEvent } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Heart,
  ShoppingCart,
  Star,
  MapPin,
  Leaf,
  Scale,
  Shield,
  Eye,
  QrCode,
  Share2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useBuyerStore } from "@/hooks/use-buyer-store"
import { useToast } from "@/hooks/use-toast"

export interface MarketplaceProduct {
  id: string
  name: string
  cropType: string
  variety: string
  description: string
  price: number
  originalPrice?: number
  unit: string
  quantity: number
  availableQuantity: number
  quality: "excellent" | "good" | "fair" | "poor"
  grade: "A" | "B" | "C"
  organic: boolean
  harvestDate: Date
  location: string
  farmer: {
    id: string
    name: string
    avatar?: string
    rating: number
    verified: boolean
    location: string
  }
  images: string[]
  certifications: string[]
  shipping: {
    available: boolean
    cost: number
    estimatedDays: number
  }
  rating: number
  reviewCount: number
  qrCode: string
  tags: string[]
}

interface MarketplaceCardProps {
  product: MarketplaceProduct
  onAddToCart?: (productId: string) => void
  onAddToWishlist?: (productId: string) => void
  onView?: (productId: string) => void
  onContact?: (farmerId: string) => void
  onShare?: (productId: string) => void
  variant?: "default" | "compact" | "detailed"
  className?: string
}

const gradeColors = {
  A: "bg-warning text-warning-foreground",
  B: "bg-primary text-primary-foreground",
  C: "bg-secondary text-secondary-foreground"
}

export function MarketplaceCard({
  product,
  onAddToCart,
  onAddToWishlist,
  onView,
  onContact,
  onShare,
  variant = "default",
  className
}: MarketplaceCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const { favorites, addToFavorites, removeFromFavorites } = useBuyerStore()
  const { toast } = useToast()

  // Check if product is in favorites
  const isWishlisted = Array.isArray(favorites) && favorites.some((fav: any) => fav.listingId === product.id || fav._id === product.id)



  const handleWishlist = async () => {
    if (isProcessing) return // Prevent multiple clicks

    try {
      setIsProcessing(true)

      if (isWishlisted) {
        // Remove from favorites
        await removeFromFavorites(product.id)
        toast({
          title: "Removed from favorites",
          description: `${product.name} has been removed from your favorites.`,
        })
      } else {
        // Add to favorites
        await addToFavorites(product.id)
        toast({
          title: "Added to favorites!",
          description: `${product.name} has been added to your favorites.`,
        })
        onAddToWishlist?.(product.id)
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddToCart = (event?: MouseEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (onAddToCart) {
      onAddToCart(String(product.id))
    }
  }

  const handleView = () => {
    if (onView) {
      onView(product.id)
    }
  }

  const handleContact = () => {
    if (onContact) {
      onContact(typeof product.farmer.id === 'string' ? product.farmer.id : 'unknown')
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(product.id)
    }
  }

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer overflow-hidden h-full", className)}>
        <CardContent className="p-3 h-full">
          <div className="flex flex-col h-full">
            {/* Image and badges */}
            <div className="relative mb-3">
              <Image
                src={product.images[0]}
                alt={product.name}
                width={300}
                height={80}
                className="w-full h-20 object-cover rounded-lg"
              />
              {product.organic && (
                <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                  Organic
                </Badge>
              )}
              <Badge className={cn("absolute top-1 right-1 text-[10px] px-1.5 py-0.5", gradeColors[product.grade])}>
                Grade {product.grade}
              </Badge>
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold text-sm line-clamp-1">
                  {typeof product.name === 'string' ? product.name : 'Unnamed Product'}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  by {typeof product.farmer.name === 'string' ? product.farmer.name : 'Unknown Farmer'}
                </p>
              </div>

              {/* Location */}
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {typeof product.location === 'string' ? product.location.split(',')[0] : (product.location as any)?.city || 'Unknown'}
                </span>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary">₦{product.price.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">per {product.unit}</span>
                </div>
                {product.availableQuantity <= 0 ? (
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs bg-secondary flex-shrink-0"
                    disabled
                  >
                    Out
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 bg-primary hover:bg-primary-hover flex-shrink-0"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200 group overflow-hidden w-full border border-border hover:border-primary/30 bg-card", className)}>
      {/* Product Image */}
      <div className="relative aspect-[5/3] sm:aspect-[4/3] overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 space-y-1 z-10">
          <Badge className={cn("text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 backdrop-blur-md bg-opacity-95 font-semibold shadow-sm border border-white/10", gradeColors[product.grade])}>
            Grade {product.grade}
          </Badge>
          {product.organic && (
            <Badge className="bg-success text-success-foreground text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 font-semibold flex items-center shadow-sm border border-success/25">
              <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              Organic
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 font-semibold shadow-sm border border-destructive/25">
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white hover:text-destructive text-muted-foreground shadow-md rounded-full transition-transform hover:scale-105"
            onClick={handleWishlist}
            disabled={isProcessing}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isWishlisted ? "fill-destructive text-destructive" : "")} />
          </Button>
          {product.qrCode && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/95 hover:bg-white text-success hover:text-success shadow-md rounded-full transition-transform hover:scale-105"
              onClick={() => router.push(`/verify/${product.qrCode}`)}
              title="Verify Traceability"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          )}
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/95 hover:bg-white hover:text-primary text-muted-foreground shadow-md rounded-full transition-transform hover:scale-105"
              onClick={(event: MouseEvent) => {
                event.preventDefault()
                event.stopPropagation()
                handleShare()
              }}
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2 sm:space-y-2.5 overflow-hidden">
        {/* Product Info */}
        <div className="space-y-0.5">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 flex items-center gap-1 text-foreground group-hover:text-primary transition-colors">
            {product.name}
            {product.farmer.verified && (
              <span title="Verified Supply Chain" className="flex-shrink-0">
                <Shield className="h-3.5 w-3.5 text-success fill-success/50" />
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{product.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 min-w-0 flex-1 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-success truncate">
              ₦{product.price.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">/{product.unit}</span>
            {discount > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through flex-shrink-0">
                ₦{product.originalPrice!.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-semibold text-foreground">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs text-muted-foreground border-t border-border pt-2">
          <div className="flex items-center gap-1 min-w-0">
            <Scale className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{product.availableQuantity} {product.unit} left</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{typeof product.location === 'string' ? product.location.split(',')[0] : (product.location as any)?.city || 'Unknown'}</span>
          </div>
        </div>

        {/* Low Stock Gauge */}
        {product.availableQuantity > 0 && product.availableQuantity < 150 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-semibold text-warning">
              <span className="flex items-center gap-0.5">Low Stock</span>
              <span>{Math.round((product.availableQuantity / (product.quantity || 150)) * 100)}%</span>
            </div>
            <div className="w-full bg-warning/10 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-warning h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, Math.min(100, (product.availableQuantity / (product.quantity || 150)) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Farmer Info */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Avatar className="h-5 w-5 flex-shrink-0 border border-border">
              <AvatarFallback className="bg-success/10 text-success text-[10px] font-bold">
                {typeof product.farmer.name === 'string' ? product.farmer.name.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-medium text-foreground truncate block">
                {typeof product.farmer.name === 'string' ? product.farmer.name : 'Unknown Farmer'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] flex-shrink-0 text-muted-foreground border-border hover:bg-muted" onClick={handleContact}>
            <span className="hidden sm:inline">Contact</span>
            <span className="sm:hidden">Call</span>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-2 border-t border-border overflow-hidden">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] sm:text-xs min-w-0 hover:bg-muted border-border text-foreground" onClick={handleView}>
            <Eye className="h-3 w-3 mr-1 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">View</span>
          </Button>
          {product.availableQuantity <= 0 ? (
            <Button size="sm" className="flex-1 h-7 text-[10px] sm:text-xs bg-secondary text-secondary-foreground min-w-0" disabled>
              <ShoppingCart className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Sold Out</span>
            </Button>
          ) : (
            <Button size="sm" className="flex-1 h-7 text-[10px] sm:text-xs bg-success hover:bg-success-hover text-success-foreground min-w-0 font-medium" onClick={handleAddToCart}>
              <ShoppingCart className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Add to Cart</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
