"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, ShoppingCart, ArrowLeft, Home } from "lucide-react"
import { apiService } from "@/lib/api"
import Link from "next/link"

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
    if (activity.includes('today')) return 'bg-green-100 text-green-800 border-green-200'
    if (activity.includes('yesterday')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (activity.includes('week')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buyer directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Buyers Directory</h1>
          <p className="text-gray-600 text-sm">Discover verified buyers actively purchasing from our marketplace</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{buyerActivity.activeBuyers || buyers.length}</div>
                <div className="text-sm text-gray-600">Active Buyers</div>
                <div className="text-xs text-gray-500">Last 30 days</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{buyerActivity.todaysTransactions}</div>
                <div className="text-sm text-gray-600">Transactions Today</div>
                <div className="text-xs text-gray-500">Successful purchases</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {buyerActivity.averageRating ? `${buyerActivity.averageRating}★` : '—'}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
                <div className="text-xs text-gray-500">From verified buyers</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buyers Grid */}
        {buyers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Buyers Yet</h3>
              <p className="text-gray-600">
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
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{buyer.location}</span>
                </div>

                {/* Orders */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
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
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Join Our Growing Marketplace
              </h3>
              <p className="text-gray-600 mb-4">
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
      </div>
    </div>
  )
}

