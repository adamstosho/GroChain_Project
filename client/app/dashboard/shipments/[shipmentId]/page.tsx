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
  DollarSign,
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

export default function ShipmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
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
      return { text: 'Overdue', color: 'text-red-600' }
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600' }
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-blue-600' }
    } else {
      return { text: `In ${diffDays} days`, color: 'text-gray-600' }
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
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
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
        <div className="space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Shipment Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The shipment you are looking for does not exist.'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild variant="outline">
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{shipment.shipmentNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShipmentStatusBadge status={shipment.status} />
                {shipment.priority !== 'normal' && (
                  <Badge 
                    variant={shipment.priority === 'urgent' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {shipment.priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshShipment}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowStatusUpdate(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline */}
            <ShipmentTrackingTimeline 
              trackingEvents={shipment.trackingEvents}
              currentStatus={shipment.status}
            />

            {/* Shipment Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Shipment Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipment.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                          src={item.listing.images?.[0] || "/placeholder.svg"}
                          alt={item.listing.cropName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{item.listing.cropName}</h4>
                        <p className="text-sm text-gray-600">by {item.listing.farmer.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-500">Qty: {item.quantity} {item.unit}</p>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatPrice((item.quantity || 0) * (item.price || 0))}</p>
                            <p className="text-sm text-gray-500">{formatPrice(item.price)}/{item.unit}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues */}
            {shipment.issues && shipment.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Reported Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shipment.issues.map((issue, index) => (
                      <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive" className="text-xs">
                            {issue.type}
                          </Badge>
                          <Badge 
                            variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{issue.description}</p>
                        <div className="text-xs text-gray-500">
                          Reported {formatDistanceToNow(new Date(issue.reportedAt), { addSuffix: true })}
                        </div>
                        {issue.resolution && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-800">
                              <strong>Resolution:</strong> {issue.resolution}
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
          <div className="space-y-6">
            {/* Shipment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {shipment.shippingMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Carrier:</span>
                    <span className="font-medium text-gray-900">{shipment.carrier}</span>
                  </div>
                  {shipment.trackingNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Tracking:</span>
                      <span className="font-medium text-gray-900">{shipment.trackingNumber}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className={`font-medium ${deliveryStatus.color}`}>
                      {deliveryStatus.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {formatDate(shipment.estimatedDelivery)}
                  </div>
                  {shipment.actualDelivery && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Delivered:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(shipment.actualDelivery)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium text-gray-900">{formatPrice(shipment.shippingCost)}</span>
                  </div>
                  {shipment.insuranceCost > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-medium text-gray-900">{formatPrice(shipment.insuranceCost)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Total:</span>
                    <span className="text-gray-900">{formatPrice(shipment.totalCost)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">
                      {formatDistanceToNow(new Date(shipment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {formatDate(shipment.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Origin</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{shipment.origin.contactPerson}</p>
                    <p>{shipment.origin.address}</p>
                    <p>{shipment.origin.city}, {shipment.origin.state}</p>
                    <p>{shipment.origin.country}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3" />
                      <span>{shipment.origin.phone}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Destination</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{shipment.destination.contactPerson}</p>
                    <p>{shipment.destination.address}</p>
                    <p>{shipment.destination.city}, {shipment.destination.state}</p>
                    <p>{shipment.destination.country}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3" />
                      <span>{shipment.destination.phone}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            {(shipment.temperatureControl || shipment.fragile || shipment.specialInstructions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Special Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shipment.temperatureControl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Temperature Control:</span>
                      <span className="font-medium text-gray-900">
                        {shipment.temperatureRange?.min}°C - {shipment.temperatureRange?.max}°C
                      </span>
                    </div>
                  )}
                  {shipment.fragile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Fragile Items</span>
                    </div>
                  )}
                  {shipment.specialInstructions && (
                    <div className="text-sm">
                      <span className="text-gray-600">Instructions:</span>
                      <p className="text-gray-900 mt-1">{shipment.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowStatusUpdate(true)}
                  disabled={updatingStatus}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                
                {shipment.status === 'out_for_delivery' && (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowDeliveryConfirm(true)}
                    disabled={confirmingDelivery}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Delivery
                  </Button>
                )}
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowIssueReport(true)}
                  disabled={reportingIssue}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusForm.status} onValueChange={(value) => setStatusForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={statusForm.location}
                onChange={(e) => setStatusForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter current location"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={statusForm.description}
                onChange={(e) => setStatusForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter status description"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updatingStatus}>
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

