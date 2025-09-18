"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useNotificationContext } from "./notification-provider"

export function NotificationDemo() {
  const { connected, unreadCount } = useNotificationContext()
  const [loading, setLoading] = useState(false)

  const createTestNotification = async (type: string, category: string) => {
    setLoading(true)
    try {
      await api.post('/api/notifications/test', {
        type,
        category,
        title: `Test ${type} notification`,
        message: `This is a test ${type} notification for ${category} category`,
        priority: type === 'error' ? 'urgent' : 'normal'
      })
    } catch (error) {
      console.error('Failed to create test notification:', error)
    } finally {
      setLoading(false)
    }
  }

  const testNotifications = [
    { type: 'info', category: 'system', label: 'System Info' },
    { type: 'success', category: 'harvest', label: 'Harvest Success' },
    { type: 'warning', category: 'marketplace', label: 'Market Warning' },
    { type: 'error', category: 'financial', label: 'Payment Error' },
  ]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Notification Demo
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="secondary">
              {unreadCount} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Click buttons below to test real-time notifications. They will appear as toast notifications and in the notification bell.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {testNotifications.map(({ type, category, label }) => (
            <Button
              key={`${type}-${category}`}
              variant="outline"
              size="sm"
              onClick={() => createTestNotification(type, category)}
              disabled={loading || !connected}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Features:</strong>
            <br />• Real-time WebSocket notifications
            <br />• Browser notification support
            <br />• Toast notifications overlay
            <br />• Notification bell with dropdown
            <br />• Role-based notifications
            <br />• Mobile responsive
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
