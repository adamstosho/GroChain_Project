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
  Banknote
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
    <Card className={`hover:shadow-md transition-shadow h-full flex flex-col ${className || ''}`}>
      <CardHeader className="pb-4 px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
              <span className="block break-words" title={shipment.shipmentNumber}>
                {shipment.shipmentNumber}
              </span>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
              <ShipmentStatusBadge status={shipment.status} />
              {shipment.priority !== 'normal' && (
                <Badge 
                  variant={shipment.priority === 'urgent' ? 'destructive' : 'secondary'}
                  className="text-xs flex-shrink-0"
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
              className="flex-shrink-0 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 flex flex-col space-y-4 sm:space-y-5">
        {/* Route Information */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 flex-shrink-0">From:</span>
            <span className="font-medium text-gray-900 text-xs sm:text-sm break-words min-w-0 flex-1" title={`${shipment.origin.city}, ${shipment.origin.state}`}>
              {shipment.origin.city}, {shipment.origin.state}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 flex-shrink-0">To:</span>
            <span className="font-medium text-gray-900 text-xs sm:text-sm break-words min-w-0 flex-1" title={`${shipment.destination.city}, ${shipment.destination.state}`}>
              {shipment.destination.city}, {shipment.destination.state}
            </span>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Items:</span>
            <span className="font-medium text-gray-900 text-xs sm:text-sm">
              {shipment.items.length} item{shipment.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Carrier:</span>
            <span className="font-medium text-gray-900 text-xs sm:text-sm break-words min-w-0 flex-1" title={shipment.carrier}>
              {shipment.carrier}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Est. Delivery:</span>
            <span className={`font-medium text-xs sm:text-sm ${deliveryStatus.color}`}>
              {deliveryStatus.text}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Cost:</span>
            <span className="font-medium text-gray-900 text-xs sm:text-sm">
              {formatPrice(shipment.totalCost)}
            </span>
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="pt-2 border-t border-gray-100 mt-auto space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 flex-shrink-0">Created:</span>
            <span className="text-gray-900">
              {formatDistanceToNow(new Date(shipment.createdAt), { addSuffix: true })}
            </span>
          </div>
          {shipment.trackingNumber && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 flex-shrink-0">Track:</span>
              <span className="font-medium text-gray-900 break-all" title={shipment.trackingNumber}>
                {shipment.trackingNumber}
              </span>
            </div>
          )}
        </div>

        {/* Issues Alert */}
        {shipment.issues && shipment.issues.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-600">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-medium truncate">
                {shipment.issues.length} issue{shipment.issues.length !== 1 ? 's' : ''} reported
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

