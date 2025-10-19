"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Leaf, ShoppingCart, Users, Banknote, Loader2, Heart, CheckCircle, UserPlus, TrendingUp, RefreshCw } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Activity {
  _id: string
  type: "harvest" | "order" | "payment" | "user" | "favorite" | "verification" | "onboarding" | "commission"
  description: string
  timestamp: Date
  user?: string
  metadata?: any
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchActivities = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      console.log('🔄 Fetching recent activities...')
      
      const response = await apiService.getRecentActivities(5)

      if (response.status === 'success') {
        const activityData = Array.isArray(response.data) ? response.data : []
        console.log('✅ Activities data received:', activityData.length, 'activities')
        setActivities(activityData.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        })))
      } else {
        console.warn('⚠️ Activities response not successful:', response)
        setActivities([])
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch activities:', error)

      // Create partner-specific fallback data
      const fallbackActivities: Activity[] = [
        {
          _id: "fallback-1",
          type: "onboarding" as const,
          description: "Welcome to GroChain Partner Dashboard! Start onboarding farmers",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          user: "System",
        },
        {
          _id: "fallback-2",
          type: "verification" as const,
          description: "Your partner account is ready for farmer verification",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          user: "System",
        },
        {
          _id: "fallback-3",
          type: "commission" as const,
          description: "Commission tracking is now active for your partnerships",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          user: "System",
        }
      ]

      setActivities(fallbackActivities as Activity[])

      // Only show toast if component is still mounted
      if (typeof window !== 'undefined') {
        toast({
          title: "Activities temporarily unavailable",
          description: "Recent partner activities will appear here as you onboard farmers and verify harvests",
          variant: "default",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, []) // Remove toast dependency to prevent re-renders

  const handleRefresh = async () => {
    await fetchActivities(true)
    if (typeof window !== 'undefined') {
      toast({
        title: "Activities refreshed",
        description: "Recent activities have been updated",
        variant: "default",
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "harvest":
        return Leaf
      case "order":
        return ShoppingCart
      case "payment":
        return Banknote
      case "user":
        return Users
      case "favorite":
        return Heart
      case "verification":
        return CheckCircle
      case "onboarding":
        return UserPlus
      case "commission":
        return TrendingUp
      default:
        return Leaf
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "harvest":
        return "bg-primary/10 text-primary"
      case "order":
        return "bg-secondary/10 text-secondary"
      case "payment":
        return "bg-success/10 text-success"
      case "user":
        return "bg-accent/10 text-accent"
      case "favorite":
        return "bg-pink-100 text-pink-600"
      case "verification":
        return "bg-green-100 text-green-600"
      case "onboarding":
        return "bg-blue-100 text-blue-600"
      case "commission":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-muted/10 text-muted-foreground"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base lg:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest platform activities</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <ScrollArea className="h-[200px] sm:h-[250px] lg:h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[120px] sm:h-[150px] lg:h-[200px]">
              <div className="text-center">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 animate-spin text-muted-foreground mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">Loading activities...</p>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-[120px] sm:h-[150px] lg:h-[200px]">
              <div className="text-center text-muted-foreground">
                <Leaf className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto mb-2 sm:mb-3 lg:mb-4 opacity-50" />
                <p className="text-xs sm:text-sm lg:text-base">No recent activities</p>
                <p className="text-xs text-muted-foreground mt-1">Activities will appear here as you use the platform</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity._id} className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div
                      className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}
                    >
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base leading-relaxed break-words">{activity.description}</p>
                      <div className="flex flex-col xs:flex-row xs:items-center space-y-1 xs:space-y-0 xs:space-x-2">
                        {activity.user && (
                          <Badge variant="outline" className="text-xs w-fit flex-shrink-0">
                            <span className="truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">
                              {typeof activity.user === 'string' ? activity.user : activity.user?.name || 'Unknown'}
                            </span>
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
