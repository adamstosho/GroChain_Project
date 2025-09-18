"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCreateShipment } from "@/hooks/use-shipments"
import { ShipmentCreationForm } from "@/components/shipment/shipment-creation-form"
import { apiService } from "@/lib/api"
import { 
  Package, 
  ArrowLeft,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface Order {
  _id: string
  orderNumber: string
  buyer: {
    name: string
    email: string
    phone: string
  }
  seller: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    listing: {
      _id: string
      cropName: string
      images?: string[]
    }
    quantity: number
    price: number
    unit: string
    total: number
  }>
  total: number
  status: string
  createdAt: string
}

export default function CreateShipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const { createShipment, loading } = useCreateShipment()

  // Get orderId from URL params if provided
  const orderIdFromParams = searchParams.get('orderId')

  useEffect(() => {
    if (orderIdFromParams) {
      setSelectedOrderId(orderIdFromParams)
    }
  }, [orderIdFromParams])

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find(o => o._id === selectedOrderId)
      setSelectedOrder(order || null)
    }
  }, [selectedOrderId, orders])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      console.log("🔄 Fetching farmer orders for shipment creation...")
      
      // Fetch farmer's orders from backend
      const response = await apiService.getFarmerOrders()
      console.log("📋 Farmer Orders API Response:", response)
      
      if (response?.status === 'success' && (response.data as any)?.orders) {
        const ordersData = (response.data as any).orders
        console.log("✅ Farmer orders data:", ordersData)
        
        // Process and format farmer's orders
        const processedOrders = ordersData.map((order: any) => ({
          _id: order._id,
          orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
          buyer: {
            name: order.customer?.name || 'Unknown Customer',
            email: order.customer?.email || '',
            phone: order.customer?.phone || ''
          },
          seller: { _id: '', name: 'You' },
          items: order.products?.map((product: any) => ({
            listing: { 
              _id: product.listingId || '', 
              cropName: product.cropName || 'Unknown Product', 
              images: [] 
            },
            quantity: product.quantity || 0,
            price: product.price || 0,
            unit: product.unit || 'kg',
            total: (product.quantity || 0) * (product.price || 0)
          })) || [],
          total: order.totalAmount || 0,
          subtotal: order.subtotal || order.totalAmount || 0,
          shipping: order.shipping || 0,
          shippingMethod: order.shippingMethod || 'road_standard',
          discount: 0,
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: 'paystack',
          shippingAddress: order.deliveryAddress || {
            street: '',
            city: '',
            state: '',
            country: 'Nigeria',
            postalCode: '',
            phone: ''
          },
          deliveryInstructions: order.notes || '',
          estimatedDelivery: order.expectedDelivery || '',
          actualDelivery: '',
          trackingNumber: '',
          notes: order.notes || '',
          orderDate: order.orderDate || order.createdAt,
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString()
        }))
        
        // Filter orders that are confirmed/paid and ready for shipment creation
        const eligibleOrders = processedOrders.filter((order: any) => 
          ['confirmed', 'paid', 'processing'].includes(order.status) && 
          order.paymentStatus === 'paid'
        )
        
        console.log("📦 Total processed orders:", processedOrders.length)
        console.log("📦 Eligible orders for shipment:", eligibleOrders.length)
        console.log("📦 Order statuses:", processedOrders.map((o: any) => ({ id: o._id, status: o.status, paymentStatus: o.paymentStatus })))
        
        setOrders(eligibleOrders)
      } else {
        throw new Error(response?.message || 'Failed to fetch orders')
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleShipmentCreated = (shipment: any) => {
    console.log("✅ Shipment created successfully:", shipment)
    toast({
      title: "Success",
      description: "Shipment created successfully!",
    })
    router.push(`/dashboard/shipments/${shipment._id}`)
  }

  const formatPrice = (price: number) => {
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
      month: 'short',
      day: 'numeric'
    })
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
              <h1 className="text-3xl font-bold tracking-tight">Create Shipment</h1>
              <p className="text-muted-foreground">
                Create a new shipment for a paid order
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOrders}
            disabled={loadingOrders}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
            Refresh Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Select Order
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Showing paid orders ready for shipment creation
                </p>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Ready for Shipment</h3>
                    <p className="text-gray-600 mb-4">
                      You don't have any paid orders that are ready for shipment creation yet. Orders need to be confirmed and paid before you can create shipments.
                    </p>
                    <div className="space-y-2">
                      <Button asChild variant="outline">
                        <Link href="/dashboard/marketplace/orders">
                          View All Orders
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/dashboard/marketplace">
                          Go to Marketplace
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order._id} value={order._id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{order.orderNumber}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatPrice(order.total)} • {order.status}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedOrder && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{selectedOrder.orderNumber}</h4>
                          <span className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Buyer:</span>
                            <span className="font-medium text-gray-900">{selectedOrder.buyer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Items:</span>
                            <span className="font-medium text-gray-900">
                              {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-gray-900">{formatPrice(selectedOrder.total)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <h5 className="font-medium text-gray-900 mb-2">Order Items:</h5>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 truncate">{item.listing.cropName}</span>
                                <span className="font-medium text-gray-900">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipment Creation Form */}
          <div className="lg:col-span-2">
            {selectedOrderId ? (
              <div>
                <ShipmentCreationForm
                  orderId={selectedOrderId}
                  orderData={selectedOrder}
                  onSuccess={handleShipmentCreated}
                  onCancel={() => router.back()}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Order</h3>
                  <p className="text-gray-600">
                    Please select an order from the list to create a shipment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
