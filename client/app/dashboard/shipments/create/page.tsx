"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ShipmentCreationForm } from "@/components/shipment/shipment-creation-form"
import { apiService } from "@/lib/api"
import { 
  Package, 
  ArrowLeft,
  ShoppingCart,
  User,
  Banknote,
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
    _id: string
    name: string
    email?: string
    phone?: string
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
  subtotal?: number
  shipping?: number
  shippingMethod?: string
  discount?: number
  status: string
  paymentStatus?: string
  paymentMethod?: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    phone: string
  }
  deliveryInstructions?: string
  estimatedDelivery?: string
  actualDelivery?: string
  trackingNumber?: string
  notes?: string
  orderDate?: string
  createdAt: string
  updatedAt?: string
}

function CreateShipmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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
      
      if (response?.status === 'success' && response.data) {
        const data = response.data as any
        const ordersData = data.orders || []
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
            quantity: Number(product.quantity || 0),
            price: Number(product.price || 0),
            unit: product.unit || 'kg',
            total: Number(product.quantity || 0) * Number(product.price || 0)
          })) || [],
          total: order.total ?? order.totalAmount ?? 0,
          subtotal: order.subtotal || order.total || order.totalAmount || 0,
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
        const eligibleOrders = processedOrders.filter((order: Order) => 
          ['confirmed', 'paid', 'processing'].includes(order.status) && 
          order.paymentStatus === 'paid'
        )
        
        console.log("📦 Total processed orders:", processedOrders.length)
        console.log("📦 Eligible orders for shipment:", eligibleOrders.length)
        console.log("📦 Order statuses:", processedOrders.map((o: Order) => ({ id: o._id, status: o.status, paymentStatus: o.paymentStatus })))
        
        setOrders(eligibleOrders)
      } else {
        throw new Error(response?.message || 'Failed to fetch orders')
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleShipmentCreated = (shipment: Record<string, unknown>) => {
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
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        {/* Premium Header */}
        <div className="bg-background/40 backdrop-blur-md p-6 rounded-3xl border border-border/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()} 
              className="bg-background/80 border-border hover:bg-muted shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">Create Shipment</h1>
              <p className="text-muted-foreground font-medium">Initialize fulfillment for your paid farmer orders</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="bg-background/80 border-border hover:bg-muted text-foreground shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
            Refresh Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Order Selection */}
          <div className="xl:col-span-1">
            <Card className="border border-border">
              <CardHeader className="pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Select Order
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Showing paid orders ready for shipment creation
                </p>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                {loadingOrders ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-4 sm:py-6 lg:py-8">
                    <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">No Orders Ready for Shipment</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      You don't have any paid orders that are ready for shipment creation yet. Orders need to be confirmed and paid before you can create shipments.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link href="/dashboard/marketplace/orders">
                          <span className="hidden sm:inline">View All Orders</span>
                          <span className="sm:hidden">View Orders</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link href="/dashboard/marketplace">
                          <span className="hidden sm:inline">Go to Marketplace</span>
                          <span className="sm:hidden">Marketplace</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Select an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order._id} value={order._id}>
                            <div className="flex items-center justify-between w-full min-w-0">
                              <span className="truncate">{order.orderNumber}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground ml-2 flex-shrink-0">
                                {formatPrice(order.total)} • {order.status}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedOrder && (
                      <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{selectedOrder.orderNumber}</h4>
                          <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground flex-shrink-0">Buyer:</span>
                            <span className="font-medium text-foreground truncate">{selectedOrder.buyer.name}</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground flex-shrink-0">Items:</span>
                            <span className="font-medium text-foreground">
                              {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground flex-shrink-0">Total:</span>
                            <span className="font-medium text-foreground">{formatPrice(selectedOrder.total)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border">
                          <h5 className="font-medium text-foreground mb-2 text-xs sm:text-sm">Order Items:</h5>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground truncate min-w-0 flex-1">{item.listing.cropName}</span>
                                <span className="font-medium text-foreground flex-shrink-0 ml-2">
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
          <div className="xl:col-span-2">
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
              <Card className="border border-border">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">Select an Order</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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

export default function CreateShipmentPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Create Shipment</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="h-64 sm:h-72 lg:h-80 bg-muted rounded animate-pulse" />
            <div className="xl:col-span-2 h-64 sm:h-72 lg:h-80 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    }>
      <CreateShipmentContent />
    </Suspense>
  )
}
