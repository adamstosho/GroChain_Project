"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShipments } from "@/hooks/use-shipments"
import { apiService } from "@/lib/api"
import { ShipmentStatusBadge } from "./shipment-status-badge"
import { ShipmentTrackingTimeline } from "./shipment-tracking-timeline"
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock,
  Eye,
  RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ShipmentTrackingWidgetProps {
  orderId: string
  className?: string
}

export function ShipmentTrackingWidget({ orderId, className }: ShipmentTrackingWidgetProps) {
  const [shipment, setShipment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchShipmentForOrder()
  }, [orderId])

  const fetchShipmentForOrder = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      // Fetch shipments for this order using API service
      const response = await apiService.get(`/shipments?order=${orderId}`)
      
      if (response.status === 'success' && response.data.shipments.length > 0) {
        setShipment(response.data.shipments[0])
        if (isRefresh) {
          toast({
            title: "Updated",
            description: "Shipment status refreshed",
          })
        }
      }
    } catch (err: any) {
      console.error('Error fetching shipment:', err)
      setError(err.message || 'Failed to fetch shipment')
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleRefresh = () => {
    fetchShipmentForOrder(true)
  }

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
    if (!shipment) return { text: '', color: '' }
    
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

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shipment Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchShipmentForOrder} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!shipment) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipment Yet</h3>
          <p className="text-gray-600 mb-4">
            This order hasn't been shipped yet. The seller will create a shipment once the order is confirmed.
          </p>
        </CardContent>
      </Card>
    )
  }

  const deliveryStatus = getEstimatedDeliveryStatus()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Shipment Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            <ShipmentStatusBadge status={shipment.status} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/shipments/${shipment._id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipment Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Shipment:</span>
              <span className="font-medium text-gray-900">{shipment.shipmentNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Carrier:</span>
              <span className="font-medium text-gray-900">{shipment.carrier}</span>
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
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {formatDistanceToNow(new Date(shipment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">From:</span>
              <span className="font-medium text-gray-900">
                {shipment.origin.city}, {shipment.origin.state}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">To:</span>
              <span className="font-medium text-gray-900">
                {shipment.destination.city}, {shipment.destination.state}
              </span>
            </div>
          </div>
        </div>

        {/* Latest Tracking Event */}
        {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Latest Update</h4>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900">{shipment.trackingEvents[0].location}</h5>
                <p className="text-sm text-gray-600">{shipment.trackingEvents[0].description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(shipment.trackingEvents[0].timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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

