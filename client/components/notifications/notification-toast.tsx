"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notification } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface NotificationToastProps {
  notification: Notification
  onClose: (id: string) => void
  onAction?: (url: string) => void
  index?: number
}

export function NotificationToast({
  notification,
  onClose,
  onAction,
  index = 0
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-dismiss after duration based on priority
  useEffect(() => {
    const duration = notification.priority === 'urgent' ? 5000 : 4000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(notification.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [notification.id, notification.priority, onClose])

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case "success":
        return "border-l-green-500"
      case "warning":
        return "border-l-yellow-500"
      case "error":
        return "border-l-red-500"
      default:
        return "border-l-blue-500"
    }
  }

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'ring-2 ring-red-300 shadow-lg'
      case 'high':
        return 'ring-1 ring-orange-300 shadow-md'
      case 'low':
        return 'opacity-90'
      default:
        return ''
    }
  }

  if (!isVisible) return null

  return (
    <Card
      className={cn(
        "fixed top-4 right-4 z-50 w-80 shadow-lg border-l-4 bg-background border transition-all duration-300",
        getBorderColor(),
        getPriorityStyles(),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      style={{
        transform: `translateY(${index * 8}px)`,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {notification.title}
              </h4>
              {notification.priority === 'urgent' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            {notification.category && (
              <span className="inline-block px-2 py-1 text-xs bg-muted rounded-full capitalize">
                {notification.category}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(notification.id), 300)
            }}
            className="flex-shrink-0 h-6 w-6 rounded-md border border-transparent hover:border-border flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Action button */}
        {notification.actionUrl && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onAction) {
                  onAction(notification.actionUrl!)
                } else {
                  window.location.href = notification.actionUrl!
                }
                setIsVisible(false)
                setTimeout(() => onClose(notification.id), 300)
              }}
              className="w-full"
            >
              View Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

interface NotificationContainerProps {
  children: React.ReactNode
}

export function NotificationContainer({ children }: NotificationContainerProps) {
  const [activeToasts, setActiveToasts] = useState<Notification[]>([])

  // This component is now simplified since the main notification system
  // handles real-time updates through WebSocket and shows toasts via the toast system
  // This container can be used for additional notification UI components if needed

  const handleToastClose = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      {children}
      {/* This container can be used for additional notification UI if needed */}
      <div className="fixed top-0 right-0 z-50 space-y-2 p-4 pointer-events-none">
        {activeToasts.map((notification, index) => (
          <div key={`toast-${notification.id}`} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClose={handleToastClose}
              index={index}
            />
          </div>
        ))}
      </div>
    </>
  )
}
