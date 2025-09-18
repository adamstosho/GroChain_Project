"use client"

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, MessageSquare, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotificationContext } from './notification-provider'
import { useToast } from '@/hooks/use-toast'

interface NotificationPreferences {
  websocket: boolean
  email: boolean
  sms: boolean
  push: boolean
  categories: Record<string, boolean>
  priorityThreshold: 'low' | 'normal' | 'high' | 'urgent'
}

const NOTIFICATION_CATEGORIES = [
  { key: 'harvest', label: 'Harvest Updates', description: 'Notifications about harvest approvals, rejections, and updates' },
  { key: 'marketplace', label: 'Marketplace Activity', description: 'Notifications about product listings, sales, and marketplace updates' },
  { key: 'financial', label: 'Financial Transactions', description: 'Notifications about payments, loans, and financial activities' },
  { key: 'system', label: 'System Notifications', description: 'Important system updates and maintenance notifications' },
  { key: 'weather', label: 'Weather Alerts', description: 'Weather-related alerts and agricultural insights' }
]

/**
 * WebSocket Configuration Notes:
 *
 * To configure WebSocket connections for real-time notifications:
 *
 * 1. Set the WebSocket server URL:
 *    NEXT_PUBLIC_WS_URL=ws://your-server.com
 *
 * 2. Disable WebSocket if needed (falls back to polling):
 *    NEXT_PUBLIC_DISABLE_WEBSOCKET=true
 *
 * 3. Default values:
 *    - WebSocket URL: ws://localhost:3001
 *    - WebSocket enabled by default
 */

export function NotificationSettings() {
  const { updateNotificationPreferences, getNotificationPreferences, requestNotificationPermission } = useNotificationContext()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    websocket: true,
    email: true,
    sms: false,
    push: true,
    categories: {
      harvest: true,
      marketplace: true,
      financial: true,
      system: true,
      weather: false
    },
    priorityThreshold: 'normal'
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const data = await getNotificationPreferences()
      if (data) {
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateNotificationPreferences(preferences)
      if (success) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated successfully",
          variant: "success"
        })
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePushPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setPreferences(prev => ({ ...prev, push: true }))
      toast({
        title: "Permission Granted",
        description: "Push notifications are now enabled",
        variant: "success"
      })
    } else {
      setPreferences(prev => ({ ...prev, push: false }))
      toast({
        title: "Permission Denied",
        description: "Push notifications require browser permission",
        variant: "destructive"
      })
    }
  }

  const updateCategory = (category: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading preferences...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications across different channels and categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Delivery Methods</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="websocket" className="text-sm font-medium">
                    Real-time Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Instant notifications in the app
                  </p>
                </div>
              </div>
              <Switch
                id="websocket"
                checked={preferences.websocket}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, websocket: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, email: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="sms" className="text-sm font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS (urgent only)
                  </p>
                </div>
              </div>
              <Switch
                id="sms"
                checked={preferences.sms}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, sms: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <Label htmlFor="push" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Browser push notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="push"
                  checked={preferences.push}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, push: checked }))
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePushPermission}
                  className="text-xs"
                >
                  Grant Permission
                </Button>
              </div>
            </div>
          </div>

          {/* Priority Threshold */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Notification Priority</h3>
            <div className="flex items-center gap-3">
              <Label htmlFor="priority" className="text-sm font-medium min-w-fit">
                Minimum Priority Level:
              </Label>
              <Select
                value={preferences.priorityThreshold}
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                  setPreferences(prev => ({ ...prev, priorityThreshold: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Only receive notifications at or above this priority level
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Categories</h3>

            {NOTIFICATION_CATEGORIES.map((category) => (
              <div key={category.key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor={category.key} className="text-sm font-medium">
                    {category.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Switch
                  id={category.key}
                  checked={preferences.categories[category.key] ?? true}
                  onCheckedChange={(checked) => updateCategory(category.key, checked)}
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

