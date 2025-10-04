"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  ShoppingCart,
  Star,
  MapPin,
  Leaf,
  Scale,
  Calendar,
  Shield,
  Eye,
  MessageCircle,
  Share2,
  QrCode
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

const qualityColors = {
  excellent: "bg-success text-success-foreground",
  good: "bg-primary text-primary-foreground",
  fair: "bg-warning text-warning-foreground",
  poor: "bg-destructive text-destructive-foreground"
}

const gradeColors = {
  A: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
  B: "bg-gradient-to-r from-blue-400 to-blue-600 text-white",
  C: "bg-gradient-to-r from-gray-400 to-gray-600 text-white"
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
  const [showQR, setShowQR] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { favorites, addToFavorites, removeFromFavorites, fetchFavorites } = useBuyerStore()
  const { toast } = useToast()

  // Check if product is in favorites
  const isWishlisted = Array.isArray(favorites) && favorites.some((fav: any) => fav.listingId === product.id || fav._id === product.id)

  // Load favorites on component mount
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

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

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id)
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
              <img
                src={product.images[0]}
                alt={product.name}
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
                    className="h-7 px-2 text-xs bg-gray-500 flex-shrink-0"
                    disabled
                  >
                    Out
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 bg-primary hover:bg-primary/90 flex-shrink-0"
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
    <Card className={cn("hover:shadow-md transition-all duration-200 group overflow-hidden w-full", className)}>
      {/* Product Image */}
      <div className="relative aspect-[5/3] sm:aspect-[4/3] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          <Badge className={cn("text-xs px-2 py-1", gradeColors[product.grade])}>
            Grade {product.grade}
          </Badge>
          {product.organic && (
            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1">
              <Leaf className="h-3 w-3 mr-1" />
              Organic
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
            onClick={handleWishlist}
            disabled={isProcessing}
          >
            <Heart className={cn("h-3 w-3 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500")} />
          </Button>
        </div>
      </div>

      <div className="p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 overflow-hidden">
        {/* Product Info */}
        <div className="space-y-0.5">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{product.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-sm sm:text-base font-bold text-primary truncate">
              ₦{product.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">/{product.unit}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground hidden sm:grid">
          <div className="flex items-center gap-1 min-w-0">
            <Scale className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{product.availableQuantity} {product.unit}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{typeof product.location === 'string' ? product.location : `${(product.location as any)?.city || 'Unknown'}`}</span>
          </div>
        </div>

        {/* Farmer Info */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Avatar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {typeof product.farmer.name === 'string' ? product.farmer.name.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium truncate block">
                  {typeof product.farmer.name === 'string' ? product.farmer.name : 'Unknown Farmer'}
                </span>
                {product.farmer.verified && typeof product.farmer.verified === 'boolean' && (
                  <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-5 sm:h-6 px-1.5 sm:px-2 text-xs flex-shrink-0" onClick={handleContact}>
            <span className="hidden sm:inline">Contact</span>
            <span className="sm:hidden">Call</span>
          </Button>
        </div>


        {/* Actions */}
        <div className="flex gap-1 pt-1 border-t overflow-hidden">
          <Button variant="outline" size="sm" className="flex-1 h-5 sm:h-6 text-xs min-w-0" onClick={handleView}>
            <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">View</span>
          </Button>
          {product.availableQuantity <= 0 ? (
            <Button size="sm" className="flex-1 h-5 sm:h-6 text-xs bg-gray-500 min-w-0" disabled>
              <ShoppingCart className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate hidden sm:inline">Sold Out</span>
              <span className="truncate sm:hidden">Out</span>
            </Button>
          ) : (
            <Button size="sm" className="flex-1 h-5 sm:h-6 text-xs bg-primary hover:bg-primary/90 min-w-0" onClick={handleAddToCart}>
              <ShoppingCart className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate hidden sm:inline">Add to Cart</span>
              <span className="truncate sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
