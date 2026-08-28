"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  AlertTriangle,
} from "lucide-react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef } from "react"
import { TrackingEvent } from "@/types/shipment"
import { formatDistanceToNow } from "date-fns"
import { motionDuration, motionEasing } from "@/lib/motion"

interface ShipmentTrackingTimelineProps {
  trackingEvents: TrackingEvent[]
  currentStatus: string
  className?: string
}

export function ShipmentTrackingTimeline({
  trackingEvents,
  currentStatus: _currentStatus,
  className,
}: ShipmentTrackingTimelineProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  const getEventIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock
      case "confirmed":
        return CheckCircle
      case "in_transit":
        return Truck
      case "out_for_delivery":
        return Package
      case "delivered":
        return CheckCircle
      case "failed":
        return AlertTriangle
      default:
        return Clock
    }
  }

  const getEventColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-warning"
      case "confirmed":
        return "text-primary"
      case "in_transit":
        return "text-accent"
      case "out_for_delivery":
        return "text-warning"
      case "delivered":
        return "text-success"
      case "failed":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getEventBgColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10"
      case "confirmed":
        return "bg-primary/10"
      case "in_transit":
        return "bg-accent/10"
      case "out_for_delivery":
        return "bg-warning/10"
      case "delivered":
        return "bg-success/10"
      case "failed":
        return "bg-destructive/10"
      default:
        return "bg-muted"
    }
  }

  if (!trackingEvents || trackingEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Tracking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tracking events available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedEvents = [...trackingEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Tracking Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={ref} className="relative space-y-4">
          {/* Vertical progress line */}
          <div
            className="absolute left-5 top-2 bottom-2 w-px bg-border"
            aria-hidden
          />

          {sortedEvents.map((event, index) => {
            const Icon = getEventIcon(event.status)
            const isLatest = index === 0
            const delay = prefersReduced ? 0 : Math.min(index, 8) * 0.08

            return (
              <motion.div
                key={`${event.timestamp}-${event.status}-${index}`}
                className="relative flex items-start gap-4"
                initial={prefersReduced ? false : { opacity: 0, x: -12 }}
                animate={
                  inView || prefersReduced
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -12 }
                }
                transition={{
                  duration: motionDuration.base,
                  delay,
                  ease: motionEasing.entrance,
                }}
              >
                <motion.div
                  className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isLatest ? getEventBgColor(event.status) : "bg-muted"
                  }`}
                  initial={prefersReduced ? false : { scale: 0.6 }}
                  animate={
                    inView || prefersReduced ? { scale: 1 } : { scale: 0.6 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 22,
                    delay: delay + 0.05,
                  }}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isLatest ? getEventColor(event.status) : "text-muted-foreground"
                    }`}
                  />
                </motion.div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{event.location}</h4>
                    {isLatest && (
                      <Badge variant="secondary" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>

                  <p
                    className={`text-sm ${
                      isLatest ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {event.coordinates && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {event.coordinates.lat.toFixed(4)}, {event.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
