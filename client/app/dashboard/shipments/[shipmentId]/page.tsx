"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useShipment, useUpdateShipmentStatus, useConfirmDelivery, useReportIssue } from "@/hooks/use-shipments"
import { ShipmentStatusBadge } from "@/components/shipment/shipment-status-badge"
import { ShipmentTrackingTimeline } from "@/components/shipment/shipment-tracking-timeline"
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock,
  Banknote,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Edit,
  Shield,
  Thermometer
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { AiTrustBadge } from "@/components/ai/ai-trust-badge"
import { ShipmentRiskAlert } from "@/components/ai/shipment-risk-alert"
import { useAuth } from "@/hooks/use-auth"

export default function ShipmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const shipmentId = params.shipmentId as string

  const { shipment, loading, error, refreshShipment } = useShipment(shipmentId)
  const { updateStatus, loading: updatingStatus } = useUpdateShipmentStatus()
  const { confirmDelivery, loading: confirmingDelivery } = useConfirmDelivery()
  const { reportIssue, loading: reportingIssue } = useReportIssue()

  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false)
  const [showIssueReport, setShowIssueReport] = useState(false)
  
  // Status update form state
  const [statusForm, setStatusForm] = useState({
    status: '',
    location: '',
    description: ''
  })

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '₦0'
    }
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstimatedDeliveryStatus = () => {
    if (!shipment) return { text: '', color: '' }
    
    const now = new Date()
    const estimated = new Date(shipment.estimatedDelivery)
    const diffDays = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-destructive' }
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-warning' }
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-primary' }
    } else {
      return { text: `In ${diffDays} days`, color: 'text-muted-foreground' }
    }
  }

  const deliveryStatus = getEstimatedDeliveryStatus()

  const handleStatusUpdate = async () => {
    try {
      if (!statusForm.status || !statusForm.location || !statusForm.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
      
      await updateStatus(shipmentId, statusForm)
      setShowStatusUpdate(false)
      setStatusForm({ status: '', location: '', description: '' })
      refreshShipment()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDeliveryConfirm = async (proof: any) => {
    try {
      await confirmDelivery(shipmentId, proof)
      setShowDeliveryConfirm(false)
      refreshShipment()
    } catch (error) {
      console.error('Error confirming delivery:', error)
    }
  }

  const handleIssueReport = async (type: string, description: string) => {
    try {
      await reportIssue(shipmentId, { type: type as any, description })
      setShowIssueReport(false)
      refreshShipment()
    } catch (error) {
      console.error('Error reporting issue:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-3 sm:mb-4"></div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
                <div className="h-32 sm:h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
                <div className="h-32 sm:h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !shipment) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center py-8 sm:py-12 px-4">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Shipment Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 break-words">{error || 'The shipment you are looking for does not exist.'}</p>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center max-w-sm mx-auto">
              <Button onClick={() => router.back()} size="sm" className="w-full xs:w-auto">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full xs:w-auto">
                <Link href="/dashboard/shipments">View All Shipments</Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        {/* Header with Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()} 
              className="bg-white/80 border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {shipment.shipmentNumber}
                </h1>
                <AiTrustBadge userId={(typeof shipment.seller === 'string' ? shipment.seller : (shipment.seller._id || shipment.seller)) as string} className="scale-90" />
              </div>
              <div className="flex items-center gap-2">
                <ShipmentStatusBadge status={shipment.status} />
                <ShipmentRiskAlert shipmentId={shipment._id} className="scale-75 origin-left py-0 border-none bg-transparent" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshShipment}
              className="bg-white/80 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowStatusUpdate(true)}
              className="bg-primary hover:bg-primary/90 shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Interactive Map Visual */}
            <Card className="relative min-h-[300px] overflow-hidden border border-border bg-card shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-secondary/10" aria-hidden />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  Live logistics route
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-full max-w-md space-y-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-mono text-primary">
                    <span>{shipment.origin.city.toUpperCase()}</span>
                    <div className="relative mx-4 flex-1 border-t border-dashed border-primary/40">
                       <Truck className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 animate-bounce text-primary" />
                    </div>
                    <span>{shipment.destination.city.toUpperCase()}</span>
                  </div>
                  
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">
                      GIS tracking active
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Lat: {shipment.origin.coordinates.lat} | Lng: {shipment.origin.coordinates.lng}
                    </p>
                  </div>
                  <div className="animate-pulse text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Syncing real-time shipment updates...
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Items */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Package className="h-5 w-5 text-primary" />
                  Shipment Content
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <div className="space-y-4 pt-4">
                  {shipment.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-3xl transition-all hover:shadow-md">
                      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-inner">
                        <Image
                          src={item.listing.images?.[0] || "/placeholder.svg"}
                          alt={item.listing.cropName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{item.listing.cropName}</h4>
                            <p className="text-xs text-slate-500">Source: {item.listing.farmer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-base">{formatPrice((item.quantity || 0) * (item.price || 0))}</p>
                            <p className="text-xs text-slate-400">{formatPrice(item.price)} per {item.unit}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-white/80 border-slate-200 text-slate-600 text-[10px]">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues */}
            {shipment.issues && shipment.issues.length > 0 && (
              <Card className="border-red-100 shadow-lg shadow-red-500/5">
                <CardHeader className="bg-red-50/50 pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Logistics Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-4 pt-4">
                    {shipment.issues.map((issue, index) => (
                      <div key={index} className="p-4 border border-red-100 rounded-3xl bg-red-50/30">
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 mb-3">
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider h-5">
                            {issue.type}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-[10px] h-5 ${issue.status === 'resolved' ? 'border-success text-success bg-success/5' : 'border-warning text-warning bg-warning/5'}`}
                          >
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2 leading-relaxed">{issue.description}</p>
                        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(issue.reportedAt), { addSuffix: true })}
                        </div>
                        {issue.resolution && (
                          <div className="mt-3 p-3 bg-white rounded-2xl border border-green-100">
                            <p className="text-xs text-green-700 leading-relaxed">
                              <span className="font-bold">RESOLUTION:</span> {issue.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Shipment Details */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Method:</span>
                    </div>
                    <span className="font-medium text-gray-900 capitalize break-words">
                      {shipment.shippingMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Carrier:</span>
                    </div>
                    <span className="font-medium text-gray-900 break-words">{shipment.carrier}</span>
                  </div>
                  {shipment.trackingNumber && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600">Tracking:</span>
                      </div>
                      <span className="font-medium text-gray-900 break-all">{shipment.trackingNumber}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Est. Delivery:</span>
                    </div>
                    <span className={`font-medium ${deliveryStatus.color} break-words`}>
                      {deliveryStatus.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-5 sm:ml-6 break-words">
                    {formatDate(shipment.estimatedDelivery)}
                  </div>
                  {shipment.actualDelivery && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">Delivered:</span>
                      </div>
                      <span className="font-medium text-gray-900 break-words">
                        {formatDate(shipment.actualDelivery)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Shipping:</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatPrice(shipment.shippingCost)}</span>
                  </div>
                  {shipment.insuranceCost > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600">Insurance:</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatPrice(shipment.insuranceCost)}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Total:</span>
                    </div>
                    <span className="text-gray-900">{formatPrice(shipment.totalCost)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Created:</span>
                    </div>
                    <span className="font-medium text-gray-900 break-words">
                      {formatDistanceToNow(new Date(shipment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-5 sm:ml-6 break-words">
                    {formatDate(shipment.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Origin</h4>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p className="font-medium break-words">{shipment.origin.contactPerson}</p>
                    <p className="break-words">{shipment.origin.address}</p>
                    <p className="break-words">{shipment.origin.city}, {shipment.origin.state}</p>
                    <p className="break-words">{shipment.origin.country}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="break-all">{shipment.origin.phone}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Destination</h4>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p className="font-medium break-words">{shipment.destination.contactPerson}</p>
                    <p className="break-words">{shipment.destination.address}</p>
                    <p className="break-words">{shipment.destination.city}, {shipment.destination.state}</p>
                    <p className="break-words">{shipment.destination.country}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="break-all">{shipment.destination.phone}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            {(shipment.temperatureControl || shipment.fragile || shipment.specialInstructions) && (
              <Card>
                <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    Special Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
                  {shipment.temperatureControl && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-gray-600">Temperature Control:</span>
                      </div>
                      <span className="font-medium text-gray-900 break-words">
                        {shipment.temperatureRange?.min}°C - {shipment.temperatureRange?.max}°C
                      </span>
                    </div>
                  )}
                  {shipment.fragile && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-600">Fragile Items</span>
                    </div>
                  )}
                  {shipment.specialInstructions && (
                    <div className="text-xs sm:text-sm">
                      <span className="text-gray-600">Instructions:</span>
                      <p className="text-gray-900 mt-1 break-words">{shipment.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm sm:text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 sm:px-4 pb-3 sm:pb-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowStatusUpdate(true)}
                  disabled={updatingStatus}
                  size="sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Update Status</span>
                  <span className="sm:hidden">Update</span>
                </Button>
                
                {shipment.status === 'out_for_delivery' && (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowDeliveryConfirm(true)}
                    disabled={confirmingDelivery}
                    size="sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">Confirm Delivery</span>
                    <span className="sm:hidden">Confirm</span>
                  </Button>
                )}
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowIssueReport(true)}
                  disabled={reportingIssue}
                  size="sm"
                >
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Report Issue</span>
                  <span className="sm:hidden">Report</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Update Shipment Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
              <Select value={statusForm.status} onValueChange={(value) => setStatusForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-8 sm:h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
              <Input
                id="location"
                value={statusForm.location}
                onChange={(e) => setStatusForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter current location"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                value={statusForm.description}
                onChange={(e) => setStatusForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter status description"
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>
            
            <div className="flex flex-col xs:flex-row justify-end gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setShowStatusUpdate(false)} size="sm" className="w-full xs:w-auto">
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updatingStatus} size="sm" className="w-full xs:w-auto">
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

