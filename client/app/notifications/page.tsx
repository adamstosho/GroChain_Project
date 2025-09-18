"use client"

import { Suspense, useState } from 'react'
import { Bell, Settings, RefreshCw, ArrowLeft, Home, ChevronRight, Grid3X3, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { NotificationProvider, useNotificationContext } from '@/components/notifications/notification-provider'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'

function NotificationsContent() {
  const { unreadCount, connected, fetchNotifications } = useNotificationContext()
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { user } = useAuthStore()

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchNotifications()
      toast({
        title: "Notifications Refreshed",
        description: "Your notifications have been updated",
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to refresh notifications:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              <Link 
                href="/dashboard" 
                className="flex items-center text-gray-600 hover:text-primary transition-colors duration-200"
              >
                <Home className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="flex items-center text-primary font-medium">
                <Bell className="h-4 w-4 mr-1" />
                Notifications
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Back</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <Link href="/dashboard">
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Dashboard</span>
                </Link>
              </Button>

              {user?.role && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Link href={`/dashboard/${user.role === 'buyer' ? 'products' : user.role === 'farmer' ? 'harvests' : user.role === 'partner' ? 'farmers' : 'users'}`}>
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline capitalize">{user.role} Panel</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              {/* Title Section */}
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Stay updated with your latest activities and system notifications
                  </p>
                </div>
              </div>

              {/* Status and Actions Section */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {connected ? 'Real-time' : 'Offline'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-1.5 text-xs sm:text-sm"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>

                  {/* Unread Count Badge */}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs sm:text-sm px-2 py-1">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <Tabs defaultValue="list" className="w-full">
              <div className="border-b border-gray-200 px-4 sm:px-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                  <TabsTrigger 
                    value="list" 
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Notifications</span>
                    <span className="xs:hidden">Notifs</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0.5 ml-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Settings</span>
                    <span className="xs:hidden">Config</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-0">
                  <NotificationList />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-0">
                  <NotificationSettings />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-12 p-0"
          asChild
        >
          <Link href="/dashboard">
            <Menu className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <NotificationProvider>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading notifications...</span>
            </div>
          </div>
        </div>
      }>
        <NotificationsContent />
      </Suspense>
    </NotificationProvider>
  )
}
