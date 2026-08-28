"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, ShoppingCart, ArrowLeft, Home } from "lucide-react"
import { apiService } from "@/lib/api"
import Link from "next/link"
import { Display, Text } from "@/components/ui/typography"
import { PageContainer } from "@/components/layout/page-container"
import { dashboard, layout } from "@/lib/design-system"

interface BuyerActivity {
  activeBuyers: number
  todaysTransactions: number
  averageRating?: number
  testimonials: Array<Record<string, unknown>>
}

interface BuyerProfile {
  id: string
  name: string
  businessType: string
  location: string
  avatar?: string
  totalOrders: number
  joinedDate: string
  recentActivity: string
  specialties: string[]
}

export default function BuyersDirectoryPage() {
  const [buyers, setBuyers] = useState<BuyerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [buyerActivity, setBuyerActivity] = useState<BuyerActivity>({
    activeBuyers: 0,
    todaysTransactions: 0,
    testimonials: []
  })

  useEffect(() => {
    fetchBuyerActivity()
    fetchTopBuyers()
  }, [])

  const fetchBuyerActivity = async () => {
    try {
      const response = await apiService.getBuyerActivity()
      if (response.status === 'success' && response.data) {
        setBuyerActivity({
          activeBuyers: Number((response.data as BuyerActivity).activeBuyers) || 0,
          todaysTransactions: Number((response.data as BuyerActivity).todaysTransactions) || 0,
          averageRating: (response.data as BuyerActivity).averageRating,
          testimonials: (response.data as BuyerActivity).testimonials ?? [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch buyer activity:', error)
    }
  }

  const fetchTopBuyers = async () => {
    try {
      const response = await apiService.getTopBuyers()
      if (response.status === 'success' && Array.isArray(response.data)) {
        setBuyers(response.data as BuyerProfile[])
      }
    } catch (error) {
      console.error('Failed to fetch buyers directory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityColor = (activity: string) => {
    if (activity.includes('today')) return 'bg-success/10 text-success border-success/10'
    if (activity.includes('yesterday')) return 'bg-primary/10 text-primary border-primary/10'
    if (activity.includes('week')) return 'bg-warning/10 text-warning border-warning/10'
    return 'bg-muted text-foreground border-border'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading buyer directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <PageContainer variant="dashboard" className="py-6">
        {/* Header */}
        <div className={layout.stackSm + " mb-6"}>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
          </div>
          <Display as="h1" variant="page" className="mb-2">Active Buyers Directory</Display>
          <Text variant="sm">Discover verified buyers actively purchasing from our marketplace</Text>
        </div>

        {/* Stats Overview */}
        <div className={dashboard.statsGrid4 + " mb-6"}>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Text as="div" variant="stat" className="text-success">{buyerActivity.activeBuyers || buyers.length}</Text>
                <Text variant="sm">Active Buyers</Text>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Text as="div" variant="stat" className="text-primary">{buyerActivity.todaysTransactions}</Text>
                <Text variant="sm">Transactions Today</Text>
                <div className="text-xs text-muted-foreground">Successful purchases</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Text as="div" variant="stat" className="text-accent">
                  {buyerActivity.averageRating ? `${buyerActivity.averageRating}★` : '—'}
                </Text>
                <Text variant="sm">Average Rating</Text>
                <div className="text-xs text-muted-foreground">From verified buyers</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buyers Grid */}
        {buyers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Display as="h3" variant="sub" className="mb-2">No Active Buyers Yet</Display>
              <p className="text-muted-foreground">
                Once buyers start purchasing from the marketplace, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyers.map((buyer) => (
            <Card key={buyer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={buyer.avatar} />
                      <AvatarFallback className="bg-primary/10">
                        {buyer.name.split(' ').map(word => word[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base line-clamp-1">{buyer.name}</CardTitle>
                      <CardDescription className="text-sm">{buyer.businessType}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{buyer.location}</span>
                </div>

                {/* Orders */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{buyer.totalOrders} orders</span>
                  </div>
                </div>

                {/* Activity Status */}
                <Badge className={`${getActivityColor(buyer.recentActivity)} text-xs`}>
                  {buyer.recentActivity}
                </Badge>

                {/* Specialties */}
                {buyer.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {buyer.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/10">
            <CardContent className="p-6">
              <Display as="h3" variant="sub" className="mb-2">
                Join Our Growing Marketplace
              </Display>
              <p className="text-muted-foreground mb-4">
                List your products and connect with these active buyers today.
                {buyers.length} verified buyers are waiting to purchase from farmers like you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/register">
                    Register as Farmer
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/marketplace">
                    Browse Marketplace
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  )
}

