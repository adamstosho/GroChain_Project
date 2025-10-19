"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  User,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  MessageSquare,
  BarChart3,
  Clock
} from "lucide-react"
import Link from "next/link"

interface FarmerDetails {
  _id: string
  name: string
  email: string
  phone: string
  location: string
  address?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  role: string
  joinedDate: string
  emailVerified: boolean
  profile?: {
    farmSize?: string
    primaryCrops?: string
    experience?: string
    notes?: string
    bio?: string
  }
  totalHarvests?: number
  totalSales?: number
  partner?: {
    _id: string
    name: string
    email: string
  }
}

interface Harvest {
  _id: string
  cropType: string
  quantity: number
  unit: string
  quality: string
  status: string
  createdAt: string
  estimatedValue?: number
}

interface PerformanceMetrics {
  totalHarvests: number
  totalSales: number
  averageHarvestValue: number
  lastHarvestDate?: string
  cropsGrown: string[]
  performanceRating: 'excellent' | 'good' | 'average' | 'needs_improvement'
}

export default function FarmerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [farmer, setFarmer] = useState<FarmerDetails | null>(null)
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const farmerId = params.id as string

  useEffect(() => {
    if (farmerId) {
      fetchFarmerDetails()
    }
  }, [farmerId])

  const fetchFarmerDetails = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching farmer details for ID:', farmerId)

      // Fetch farmer details with harvests and metrics
      const farmerResponse = await api.getFarmerById(farmerId)
      if (farmerResponse?.status === 'success' && farmerResponse.data) {
        const farmerData = farmerResponse.data
        setFarmer(farmerData)
        console.log('✅ Farmer details loaded:', farmerData.name)

        // Set harvests from response
        if (farmerData.harvests) {
          setHarvests(farmerData.harvests)
          console.log('✅ Harvests loaded:', farmerData.harvests.length)
        }

        // Set performance metrics from response
        if (farmerData.performanceMetrics) {
          setMetrics(farmerData.performanceMetrics)
          console.log('✅ Performance metrics loaded:', farmerData.performanceMetrics)
        }
      } else {
        throw new Error('Farmer not found')
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch farmer details:', error)
      toast({
        title: "Error loading farmer details",
        description: error.message || "Failed to load farmer information",
        variant: "destructive"
      })
      router.push('/dashboard/farmers')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case "inactive":
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPerformanceBadge = (rating: string) => {
    switch (rating) {
      case "excellent":
        return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
      case "good":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>
      case "average":
        return <Badge variant="secondary">Average</Badge>
      case "needs_improvement":
        return <Badge variant="destructive">Needs Improvement</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Farmer Details">
        <div className="space-y-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-48 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!farmer) {
    return (
      <DashboardLayout pageTitle="Farmer Not Found">
        <div className="space-y-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/farmers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Farmers
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Farmer Not Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                The farmer you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/dashboard/farmers">Back to Farmers List</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`${farmer.name} - Farmer Details`}>
      <div className="space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/farmers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Farmers
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{farmer.name}</h1>
              <p className="text-muted-foreground">Farmer Details & Performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(farmer.status)}
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="harvests">Harvests</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </div>
                        <p className="font-medium">{farmer.email}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>Phone</span>
                        </div>
                        <p className="font-medium">{farmer.phone}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>Location</span>
                        </div>
                        <p className="font-medium">{farmer.location}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Joined Date</span>
                        </div>
                        <p className="font-medium">{farmer.joinedDate ? new Date(farmer.joinedDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    {farmer.address && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>Address</span>
                        </div>
                        <p className="font-medium">{farmer.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Farming Information */}
                {farmer.profile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="w-5 h-5" />
                        <span>Farming Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {farmer.profile.farmSize && (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Farm Size</div>
                            <p className="font-medium">{farmer.profile.farmSize}</p>
                          </div>
                        )}
                        {farmer.profile.primaryCrops && (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Primary Crops</div>
                            <p className="font-medium">{farmer.profile.primaryCrops}</p>
                          </div>
                        )}
                        {farmer.profile.experience && (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Experience</div>
                            <p className="font-medium">{farmer.profile.experience}</p>
                          </div>
                        )}
                      </div>
                      {farmer.profile.notes && (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Notes</div>
                          <p className="font-medium">{farmer.profile.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="harvests" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Recent Harvests</span>
                    </CardTitle>
                    <CardDescription>
                      {harvests.length > 0 ? `${harvests.length} harvests recorded` : 'No harvests recorded yet'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {harvests.length > 0 ? (
                      <div className="space-y-4">
                        {harvests.slice(0, 10).map((harvest) => (
                          <div key={harvest._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <p className="font-medium">{harvest.cropType}</p>
                              <p className="text-sm text-muted-foreground">
                                {harvest.quantity} {harvest.unit} • {harvest.quality} quality
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(harvest.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₦{harvest.estimatedValue?.toLocaleString() || '0'}</p>
                              <Badge variant={harvest.status === 'verified' ? 'default' : 'secondary'}>
                                {harvest.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No harvests recorded yet</p>
                        <p className="text-sm text-muted-foreground">Harvests will appear here once recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {metrics && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5" />
                          <span>Performance Overview</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Overall Rating</span>
                          {getPerformanceBadge(metrics.performanceRating)}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Harvests</span>
                            <span className="font-medium">{metrics.totalHarvests}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Sales</span>
                            <span className="font-medium">₦{metrics.totalSales.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Average Value</span>
                            <span className="font-medium">₦{metrics.averageHarvestValue.toLocaleString()}</span>
                          </div>
                          {metrics.lastHarvestDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Last Harvest</span>
                              <span className="font-medium">
                                {new Date(metrics.lastHarvestDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>Crops Grown</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {metrics.cropsGrown.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {metrics.cropsGrown.map((crop, index) => (
                              <Badge key={index} variant="outline">
                                {crop}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No crops recorded yet</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground">Activity will appear here as the farmer uses the platform</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Farmer Avatar & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Farmer Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${farmer.name}`} />
                    <AvatarFallback className="text-lg">{farmer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-semibold">{farmer.name}</h3>
                    <p className="text-sm text-muted-foreground">{farmer.role}</p>
                    {getStatusBadge(farmer.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Partner Information */}
            {farmer.partner && (
              <Card>
                <CardHeader>
                  <CardTitle>Partner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Partner Name</div>
                    <p className="font-medium">{farmer.partner.name}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Partner Email</div>
                    <p className="font-medium">{farmer.partner.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
