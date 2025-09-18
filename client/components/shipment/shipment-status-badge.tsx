"use client"

import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  AlertTriangle, 
  RotateCcw,
  XCircle
} from "lucide-react"

interface ShipmentStatusBadgeProps {
  status: string
  className?: string
}

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'confirmed':
        return {
          icon: CheckCircle,
          label: 'Confirmed',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'in_transit':
        return {
          icon: Truck,
          label: 'In Transit',
          variant: 'default' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        }
      case 'out_for_delivery':
        return {
          icon: Package,
          label: 'Out for Delivery',
          variant: 'default' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        }
      case 'delivered':
        return {
          icon: CheckCircle,
          label: 'Delivered',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'failed':
        return {
          icon: XCircle,
          label: 'Failed',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'returned':
        return {
          icon: RotateCcw,
          label: 'Returned',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          icon: AlertTriangle,
          label: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

