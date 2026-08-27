"use client"

import { useState } from "react"
import { Bell, CheckCheck, ExternalLink, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotificationContext } from "@/components/notifications/notification-provider"
import { NotificationDeliveryBadges } from "@/components/notifications/notification-delivery-badges"

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    connected,
    markAsRead,
    markAllAsRead,
  } = useNotificationContext()

  const [isOpen, setIsOpen] = useState(false)

  const displayNotifications = notifications || []

  const getNotificationIcon = (type: string) => {
    const className = "h-4 w-4"
    switch (type) {
      case "success":
        return <CheckCircle2 className={`${className} text-success`} />
      case "warning":
        return <AlertTriangle className={`${className} text-warning`} />
      case "error":
        return <XCircle className={`${className} text-destructive`} />
      default:
        return <Info className={`${className} text-primary`} />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead([notification.id])
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
      setIsOpen(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className={`flex items-center gap-1 text-xs ${connected ? 'text-success' : 'text-destructive'}`}>
                  {connected ? (
                    <>
                      <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                      Connected
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-destructive rounded-full"></div>
                      {error ? 'Error' : 'Disconnected'}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mt-2">
                {error}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-2 hover:bg-primary-soft cursor-pointer transition-colors ${
                        !notification.isRead ? "bg-primary-soft" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-xs font-medium ${
                                !notification.isRead ? "text-foreground" : "text-muted-foreground"
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <NotificationDeliveryBadges
                                  channels={notification.channels}
                                  deliveryStatus={notification.deliveryStatus}
                                  compact
                                />
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {notification.actionUrl && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {displayNotifications.length > 0 && (
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => {
                    window.location.href = '/notifications'
                    setIsOpen(false)
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
