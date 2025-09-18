"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Leaf, ShoppingCart, Users, Banknote, Loader2, Heart } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Activity {
  _id: string
  type: "harvest" | "order" | "payment" | "user" | "favorite"
  description: string
  timestamp: Date
  user?: string
  metadata?: any
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
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

        // Create user-specific fallback data instead of generic mock data
        const fallbackActivities: Activity[] = [
          {
            _id: "fallback-1",
            type: "order" as const,
            description: "Welcome to GroChain! Start browsing fresh produce",
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            user: "System",
          },
          {
            _id: "fallback-2",
            type: "payment" as const,
            description: "Your account is ready for purchases",
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            user: "System",
          }
        ]

        setActivities(fallbackActivities as Activity[])

        // Only show toast if component is still mounted
        if (typeof window !== 'undefined') {
          toast({
            title: "Activities temporarily unavailable",
            description: "Recent activities will appear here as you use the platform",
            variant: "default",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, []) // Remove toast dependency to prevent re-renders

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
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform activities</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center text-muted-foreground">
                <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No recent activities</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity._id} className="flex items-start space-x-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center space-x-2">
                        {activity.user && (
                          <Badge variant="outline" className="text-xs">
                            {typeof activity.user === 'string' ? activity.user : activity.user?.name || 'Unknown'}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
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
