"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Eye,
  Clock,
  DollarSign
} from "lucide-react"
import { Shipment } from "@/types/shipment"
import { ShipmentStatusBadge } from "./shipment-status-badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ShipmentCardProps {
  shipment: Shipment
  onViewDetails?: (shipmentId: string) => void
  showActions?: boolean
  className?: string
}

export function ShipmentCard({ 
  shipment, 
  onViewDetails, 
  showActions = true,
  className 
}: ShipmentCardProps) {
  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '₦0'
    }
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getEstimatedDeliveryStatus = () => {
    const now = new Date()
    const estimated = new Date(shipment.estimatedDelivery)
    const diffDays = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-red-600' }
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600' }
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-blue-600' }
    } else {
      return { text: `In ${diffDays} days`, color: 'text-gray-600' }
    }
  }

  const deliveryStatus = getEstimatedDeliveryStatus()

  return (
    <Card className={`hover:shadow-md transition-shadow ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {shipment.shipmentNumber}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <ShipmentStatusBadge status={shipment.status} />
              {shipment.priority !== 'normal' && (
                <Badge 
                  variant={shipment.priority === 'urgent' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {shipment.priority}
                </Badge>
              )}
            </div>
          </div>
          {showActions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(shipment._id)}
              className="flex-shrink-0"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Route Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">From:</span>
            <span className="font-medium text-gray-900">
              {shipment.origin.city}, {shipment.origin.state}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">To:</span>
            <span className="font-medium text-gray-900">
              {shipment.destination.city}, {shipment.destination.state}
            </span>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Items:</span>
              <span className="font-medium text-gray-900">
                {shipment.items.length} item{shipment.items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Carrier:</span>
              <span className="font-medium text-gray-900 truncate">
                {shipment.carrier}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Est. Delivery:</span>
              <span className={`font-medium ${deliveryStatus.color}`}>
                {deliveryStatus.text}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium text-gray-900">
                {formatPrice(shipment.totalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">
                {formatDistanceToNow(new Date(shipment.createdAt), { addSuffix: true })}
              </span>
            </div>
            {shipment.trackingNumber && (
              <Badge variant="outline" className="text-xs">
                Track: {shipment.trackingNumber}
              </Badge>
            )}
          </div>
        </div>

        {/* Issues Alert */}
        {shipment.issues && shipment.issues.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Package className="h-4 w-4" />
              <span className="font-medium">
                {shipment.issues.length} issue{shipment.issues.length !== 1 ? 's' : ''} reported
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

