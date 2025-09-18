export interface ShipmentItem {
  listing: {
    _id: string
    cropName: string
    images?: string[]
    farmer: {
      name: string
      email: string
    }
  }
  quantity: number
  unit: string
  price: number
}

export interface ShipmentLocation {
  address: string
  city: string
  state: string
  country: string
  coordinates: {
    lat: number
    lng: number
  }
  contactPerson: string
  phone: string
}

export interface TrackingEvent {
  status: string
  location: string
  description: string
  timestamp: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface ShipmentIssue {
  type: 'damage' | 'delay' | 'loss' | 'quality' | 'other'
  description: string
  reportedAt: string
  reportedBy: string
  status: 'open' | 'investigating' | 'resolved'
  resolution?: string
  resolvedAt?: string
}

export interface DeliveryProof {
  signature?: string
  photo?: string
  notes?: string
  deliveredBy?: string
  deliveryTime?: string
}

export interface ShipmentPackaging {
  type: string
  materials: string[]
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
}

export interface ShipmentInsurance {
  insured: boolean
  insuranceProvider?: string
  policyNumber?: string
  coverageAmount?: number
  premium?: number
}

export interface Shipment {
  _id: string
  shipmentNumber: string
  order: string
  buyer: {
    _id: string
    name: string
    email: string
    phone: string
  }
  seller: {
    _id: string
    name: string
    email: string
    phone: string
  }
  items: ShipmentItem[]
  origin: ShipmentLocation
  destination: ShipmentLocation
  shippingMethod: 'road' | 'rail' | 'air' | 'sea' | 'courier'
  carrier: string
  trackingNumber?: string
  estimatedDelivery: string
  actualDelivery?: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'
  trackingEvents: TrackingEvent[]
  shippingCost: number
  insuranceCost: number
  totalCost: number
  currency: string
  insurance: ShipmentInsurance
  packaging: ShipmentPackaging
  specialInstructions?: string
  temperatureControl: boolean
  temperatureRange?: {
    min: number
    max: number
  }
  fragile: boolean
  deliveryProof?: DeliveryProof
  issues: ShipmentIssue[]
  returnRequested: boolean
  returnReason?: string
  returnStatus: 'none' | 'requested' | 'approved' | 'in_transit' | 'received' | 'processed'
  notes?: string
  tags: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
}

export interface CreateShipmentRequest {
  orderId: string
  shippingMethod: 'road' | 'rail' | 'air' | 'sea' | 'courier'
  carrier: string
  estimatedDelivery: string
  shippingCost: number
  insuranceCost?: number
  packaging?: Partial<ShipmentPackaging>
  specialInstructions?: string
  temperatureControl?: boolean
  temperatureRange?: {
    min: number
    max: number
  }
  fragile?: boolean
}

export interface UpdateShipmentStatusRequest {
  status: string
  location: string
  description: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface ConfirmDeliveryRequest {
  signature?: string
  photo?: string
  notes?: string
  deliveredBy?: string
}

export interface ReportIssueRequest {
  type: 'damage' | 'delay' | 'loss' | 'quality' | 'other'
  description: string
}

export interface ShipmentStats {
  totalShipments: number
  statusBreakdown: Array<{
    _id: string
    count: number
  }>
  delayedShipments: number
  avgDeliveryTime: number
}

export interface ShipmentFilters {
  page?: number
  limit?: number
  status?: string
  shippingMethod?: string
  carrier?: string
  origin?: string
  destination?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

