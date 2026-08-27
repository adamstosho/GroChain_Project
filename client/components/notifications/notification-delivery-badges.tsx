"use client"

import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { NotificationChannel, NotificationDeliveryStatus } from '@/hooks/use-notifications'

const CHANNEL_META = {
  in_app: { label: 'In-app', icon: Bell },
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  push: { label: 'Push', icon: Smartphone }
} as const

function channelState(
  type: keyof typeof CHANNEL_META,
  channels?: NotificationChannel[],
  deliveryStatus?: NotificationDeliveryStatus
) {
  const channel = channels?.find((c) => c.type === type)
  if (!channel) {
    return { status: 'none' as const, detail: 'Not requested' }
  }
  if (channel.error) {
    return { status: 'failed' as const, detail: channel.error }
  }
  if (channel.sent) {
    return {
      status: 'sent' as const,
      detail: channel.sentAt
        ? `Delivered ${new Date(channel.sentAt).toLocaleString()}`
        : 'Delivered'
    }
  }
  if (type === 'in_app' && deliveryStatus?.websocket) {
    return { status: 'sent' as const, detail: 'Delivered via live connection' }
  }
  if (type === 'email' && deliveryStatus?.email) {
    return { status: 'sent' as const, detail: 'Email sent' }
  }
  return { status: 'pending' as const, detail: 'Pending delivery' }
}

const variantForStatus = (status: 'sent' | 'failed' | 'pending' | 'none') => {
  switch (status) {
    case 'sent':
      return 'default' as const
    case 'failed':
      return 'destructive' as const
    case 'pending':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

interface NotificationDeliveryBadgesProps {
  channels?: NotificationChannel[]
  deliveryStatus?: NotificationDeliveryStatus
  compact?: boolean
}

export function NotificationDeliveryBadges({
  channels,
  deliveryStatus,
  compact = false
}: NotificationDeliveryBadgesProps) {
  const types = (['in_app', 'email'] as const).filter(
    (type) => channels?.some((c) => c.type === type) || type === 'in_app' || type === 'email'
  )

  if (!channels?.length) {
    return (
      <Badge variant="outline" className="text-xs">
        In-app
      </Badge>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`flex flex-wrap gap-1 ${compact ? '' : 'mt-2'}`}>
        {types.map((type) => {
          const meta = CHANNEL_META[type]
          const Icon = meta.icon
          const { status, detail } = channelState(type, channels, deliveryStatus)
          const label =
            status === 'sent'
              ? meta.label
              : status === 'failed'
                ? `${meta.label} failed`
                : status === 'pending'
                  ? `${meta.label} pending`
                  : meta.label

          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Badge
                  variant={variantForStatus(status)}
                  className={`text-xs gap-1 ${status === 'sent' ? 'bg-success/15 text-success border-success/30 hover:bg-success/20' : ''}`}
                >
                  <Icon className="h-3 w-3" />
                  {!compact && label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p className="font-medium">{meta.label}</p>
                <p className="text-muted-foreground">{detail}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
