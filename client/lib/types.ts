export interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: "farmer" | "partner" | "admin" | "buyer"
  status: "active" | "inactive" | "suspended"
  partner?: string
  emailVerified: boolean
  phoneVerified: boolean
  location?: string
  gender?: string
  age?: number
  education?: string
  suspensionReason?: string
  suspendedAt?: Date
  pushToken?: string
  notificationPreferences: NotificationPreferences
  profile?: UserProfile
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  avatar?: string
  bio?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  marketing: boolean
  orderUpdates: boolean
  harvestUpdates: boolean
  paymentUpdates: boolean
  weatherAlerts: boolean
}

export interface Review {
  id: string
  user: {
    name: string
    avatar?: string
  }
  rating: number
  comment: string
  createdAt: string
}

export interface Harvest {
  _id: string
  farmer: string
  cropType: string
  quantity: number
  date: Date
  geoLocation: { lat: number; lng: number }
  batchId: string
  qrData: string
  status: "pending" | "verified" | "rejected" | "approved"
  verifiedBy?: string
  verifiedAt?: Date
  rejectionReason?: string
  quality: "excellent" | "good" | "fair" | "poor"
  description?: string
  unit: string
  location: string
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  _id: string
  cropName?: string
  category: string
  variety?: string
  description?: string
  basePrice?: number
  unit: string
  seasonality: string[]
  qualityGrade: "premium" | "standard" | "basic"
  organic: boolean
  certifications: string[]
  storageLife: number
  nutritionalValue?: NutritionalInfo
  farmingPractices: string[]
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface NutritionalInfo {
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber: number
  vitamins: Record<string, number>
  minerals: Record<string, number>
}

export interface Listing {
  _id: string
  farmer: string
  harvest: string
  product: Product
  price: number
  quantity: number
  availableQuantity: number
  description: string
  images: string[]
  status: "active" | "inactive" | "sold_out"
  location: string
  geoLocation: { lat: number; lng: number }
  qualityGrade: string
  organic: boolean
  certifications: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  _id: string
  buyer: string
  listing: string
  quantity: number
  totalAmount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "completed" | "failed" | "refunded"
  deliveryAddress: Address
  trackingNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  coordinates?: { lat: number; lng: number }
}

export interface Transaction {
  _id: string
  type: "payment" | "commission" | "refund" | "withdrawal" | "platform_fee"
  status: "pending" | "completed" | "failed" | "cancelled"
  amount: number
  currency: string
  reference: string
  description: string
  userId: string
  partnerId?: string
  orderId?: string
  paymentProvider: string
  paymentProviderReference: string
  metadata: Record<string, any>
  processedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface WeatherData {
  location: string
  coordinates: { lat: number; lng: number }
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
  }
  forecast: Array<{
    date: Date
    temperature: { min: number; max: number }
    humidity: number
    precipitation: number
    description: string
    icon: string
  }>
  agriculturalInsights: {
    plantingRecommendations: string[]
    harvestingRecommendations: string[]
    irrigationAdvice: string
    pestWarnings: string[]
  }
}

export interface ApiResponse<T = any> {
  success?: boolean
  status?: 'success' | 'error'
  message?: string
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface DashboardStats {
  totalUsers?: number
  totalHarvests: number
  totalOrders?: number
  totalRevenue?: number
  monthlyRevenue?: number
  pendingApprovals: number
  activeListings: number
  recentActivity?: Activity[]
}

export interface Activity {
  _id: string
  type: "harvest" | "order" | "payment" | "user" | "listing"
  description: string
  user: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface CreditScore {
  farmerId: string
  score: number
  factors: {
    paymentHistory: number
    harvestConsistency: number
    businessStability: number
    marketReputation: number
  }
  recommendations: string[]
  lastUpdated: Date
}

export interface LoanApplication {
  _id: string
  farmer: string
  amount: number
  purpose: string
  status: "pending" | "approved" | "rejected" | "disbursed" | "repaid"
  interestRate: number
  term: number // in months
  collateral?: string
  guarantor?: string
  documents: string[]
  createdAt: Date
  updatedAt: Date
}
