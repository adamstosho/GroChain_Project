"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  MapPin,
  Scale,
  Leaf,
  QrCode,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export interface HarvestData {
  id: string
  farmerName: string
  cropType: string
  variety: string
  harvestDate: Date
  quantity: number
  unit: string
  location: string
  quality: "excellent" | "good" | "fair" | "poor"
  status: "pending" | "approved" | "rejected" | "shipped" | "verified" | "listed"
  qrCode: string
  price: number
  organic: boolean
  moistureContent: number
  grade: "A" | "B" | "C"
  images?: string[]
  batchId?: string
  createdAt?: string
  updatedAt?: string
}

interface HarvestCardProps {
  harvest: HarvestData
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  variant?: "default" | "compact" | "detailed"
  className?: string
}

const qualityColors = {
  excellent: "bg-success text-success-foreground",
  good: "bg-primary text-primary-foreground",
  fair: "bg-warning text-warning-foreground",
  poor: "bg-destructive text-destructive-foreground"
}

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  listed: "bg-purple-50 text-purple-700 border-purple-200"
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: AlertCircle,
  shipped: Truck,
  verified: CheckCircle,
  listed: Package
}

export function HarvestCard({ 
  harvest, 
  onView, 
  onEdit, 
  onApprove, 
  onReject,
  variant = "default",
  className 
}: HarvestCardProps) {
  const [showQR, setShowQR] = useState(false)
  const StatusIcon = statusIcons[harvest.status]

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{harvest.cropType}</h4>
                <p className="text-xs text-muted-foreground">{harvest.farmerName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={cn("text-xs", statusColors[harvest.status])}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {harvest.status}
              </Badge>
              <p className="text-sm font-medium mt-1">₦{harvest.price.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              {harvest.cropType} - {harvest.variety}
            </CardTitle>
            <CardDescription className="text-sm">
              Harvested by {harvest.farmerName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {harvest.organic && (
              <Badge variant="secondary" className="text-xs">
                Organic
              </Badge>
            )}
            <Badge className={cn("text-xs", qualityColors[harvest.quality])}>
              Grade {harvest.grade}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Scale className="h-4 w-4 mr-2" />
              Quantity
            </div>
            <p className="font-semibold">{harvest.quantity} {harvest.unit}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Harvest Date
            </div>
            <p className="font-semibold">
              {harvest.harvestDate instanceof Date && !isNaN(harvest.harvestDate.getTime())
                ? harvest.harvestDate.toLocaleDateString()
                : new Date(harvest.harvestDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          {typeof harvest.location === 'string' ? harvest.location : `${(harvest.location as any)?.city || 'Unknown'}, ${(harvest.location as any)?.state || 'Unknown State'}`}
        </div>

        {/* Quality Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Moisture Content</span>
            <span className="font-medium">{harvest.moistureContent}%</span>
          </div>
          <Progress value={harvest.moistureContent} className="h-2" />
        </div>

        {/* Harvest Images */}
        {harvest.images && harvest.images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Harvest Photos ({harvest.images.length})
              </span>
              {harvest.images.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => onView && onView(harvest.id)}
                >
                  View All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {/* Show only the first image in the card */}
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={harvest.images[0]}
                  alt={`Harvest ${harvest.cropType}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to harvest placeholder if image fails to load
                    const img = e.currentTarget as HTMLImageElement
                    img.src = '/placeholder-harvest.jpg'
                  }}
                />
                {harvest.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    +{harvest.images.length - 1} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge className={cn("px-3 py-1", statusColors[harvest.status])}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {harvest.status.charAt(0).toUpperCase() + harvest.status.slice(1)}
          </Badge>
          <p className="text-lg font-bold text-primary">
            ₦{harvest.price.toLocaleString()}
          </p>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
            className="text-xs"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQR ? "Hide QR" : "Show QR"}
          </Button>
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(harvest.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {harvest.status === "pending" && (
            <>
              {onApprove && (
                <Button size="sm" onClick={() => onApprove(harvest.id)}>
                  Approve
                </Button>
              )}
              {onReject && (
                <Button variant="destructive" size="sm" onClick={() => onReject(harvest.id)}>
                  Reject
                </Button>
              )}
            </>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(harvest.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardFooter>

      {/* QR Code Modal */}
      {showQR && (
        <div className="p-4 border-t bg-muted/30">
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg border">
              <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scan to verify harvest authenticity
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
