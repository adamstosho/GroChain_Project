// Partner-specific TypeScript interfaces

// Partner Dashboard Types
export interface PartnerDashboardData {
  totalFarmers: number
  activeFarmers: number
  pendingApprovals: number
  monthlyCommission: number
  totalCommission: number
  approvalRate: number
  recentActivity: PartnerActivity[]
}

export interface PartnerActivity {
  type: 'farmer_onboarded' | 'commission_paid' | 'harvest_approved'
  farmer?: string
  amount?: number
  timestamp: string
  description: string
}

// Farmer Management Types
export interface PartnerFarmer {
  _id: string
  name: string
  email: string
  phone: string
  location: string
  status: 'active' | 'inactive' | 'pending'
  joinedDate: string
  lastActivity?: string
  totalHarvests: number
  totalSales: number
  totalCommissions?: number
  performance?: {
    completionRate: number
    averageRating: number
    onTimeDelivery: number
  }
}

export interface PartnerFarmersResponse {
  farmers: PartnerFarmer[]
  total: number
  page: number
  pages: number
}

// Metrics Types
export interface PartnerMetrics {
  totalFarmers: number
  activeFarmers: number
  inactiveFarmers: number
  pendingFarmers: number
  totalCommissions: number
  monthlyCommissions: number
  commissionRate: number
  approvalRate: number
  conversionRate: number
  performanceMetrics: {
    farmersOnboardedThisMonth: number
    commissionsEarnedThisMonth: number
    averageCommissionPerFarmer: number
    farmerRetentionRate?: number
    averageOnboardingTime?: number
  }
}

// Commission Types
export interface PartnerCommission {
  summary: {
    totalEarned: number
    commissionRate: number
    pendingAmount: number
    paidAmount: number
    availableForPayout: number
    lastPayout?: string
    nextPayoutDate?: string
  }
  monthlyBreakdown: Array<{
    month: string
    amount: number
    transactions?: number
    status?: string
  }>
  recentPayments: Array<{
    id: string
    amount: number
    method: string
    status: string
    paidAt: string
    reference: string
  }>
}

export interface Commission {
  _id: string
  partner: string
  farmer: {
    _id: string
    name: string
    email: string
  }
  order: {
    _id: string
    orderNumber: string
    total: number
  }
  listing: {
    _id: string
    cropName: string
    price: number
  }
  amount: number
  rate: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  orderAmount: number
  orderDate: string
  paidAt?: string
  notes?: string
}

export interface CommissionsResponse {
  commissions: Commission[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  summary: {
    totalCommissions: number
    pendingCommissions: number
    paidCommissions: number
    totalAmount: number
    pendingAmount: number
    paidAmount: number
  }
}

// Commission Payout Types
export interface CommissionPayoutRequest {
  commissionIds: string[]
  payoutMethod: 'bank_transfer' | 'mobile_money' | 'wallet'
  payoutDetails: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    bankCode?: string
    mobileNumber?: string
    network?: string
  }
  notes?: string
}

export interface CommissionPayoutResponse {
  payoutId: string
  totalAmount: number
  commissionCount: number
  payoutMethod: string
  status: 'processing' | 'completed' | 'failed'
  reference: string
  createdAt: string
  completedAt?: string
  estimatedCompletion?: string
  commissions: Array<{
    id: string
    amount: number
    farmer: string
  }>
}

// Referral Management Types
export interface Referral {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
    region: string
  }
  partner: {
    _id: string
    name: string
    type: string
    contactEmail: string
  }
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
  referralCode: string
  referralDate: string
  activationDate?: string
  completionDate?: string
  commissionRate: number
  commission: number
  commissionStatus: 'pending' | 'calculated' | 'paid' | 'cancelled'
  commissionPaidAt?: string
  performanceMetrics: {
    totalTransactions: number
    totalValue: number
    averageOrderValue: number
    customerRetention: number
    lastActivity?: string
  }
  notes?: string
  communicationHistory: Array<{
    type: 'sms' | 'email' | 'call' | 'visit' | 'other'
    date: string
    summary: string
    outcome?: string
  }>
  followUpRequired: boolean
  followUpDate?: string
  followUpNotes?: string
  expiresAt: string
  isRenewable: boolean
  tags?: string[]
  category?: string
}

export interface ReferralsResponse {
  docs: Referral[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  completedReferrals: number
  pendingReferrals: number
  expiredReferrals: number
  conversionRate: number
  totalCommissionEarned: number
  averageCommissionPerReferral: number
  statusBreakdown: {
    pending: number
    active: number
    completed: number
    cancelled: number
    expired: number
  }
  monthlyTrends: Array<{
    month: string
    newReferrals: number
    activations: number
    completions: number
    commission: number
  }>
  performanceMetrics: {
    averageActivationTime: number
    averageCompletionTime: number
    retentionRate: number
    highPerformers: number
  }
  lastUpdated: string
}

// Bulk Onboarding Types
export interface BulkOnboardRequest {
  csvFile: File
}

export interface BulkOnboardResponse {
  uploadId: string
  totalRows: number
  successfulRows: number
  failedRows: number
  processingTime: number
  errors: Array<{
    row: number
    field?: string
    error: string
    data?: any
  }>
  successfulFarmers: Array<{
    id: string
    name: string
    email: string
    status: string
  }>
}

export interface BulkOnboardStatusResponse {
  uploadId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  totalRows: number
  successfulRows: number
  failedRows: number
  createdAt: string
  completedAt?: string
  results: {
    successful: Array<{
      id: string
      name: string
      email: string
    }>
    failed: Array<{
      row: number
      error: string
    }>
  }
}

// Analytics Types
export interface PartnerAnalytics {
  period: string
  currentPeriod: {
    startDate: string
    endDate: string
  }
  previousPeriod: {
    startDate: string
    endDate: string
  }
  metrics: {
    farmers: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    commissions: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    referrals: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    conversionRate: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
  }
  charts: {
    farmerGrowth: Array<{
      date: string
      count: number
    }>
    commissionTrends: Array<{
      date: string
      amount: number
    }>
    referralConversion: Array<{
      date: string
      rate: number
    }>
  }
  topPerformers: {
    farmers: Array<{
      id: string
      name: string
      totalSales: number
      totalCommission: number
      performance: number
    }>
    regions: Array<{
      region: string
      farmers: number
      totalSales: number
      totalCommission: number
    }>
  }
}

// Filter and Search Types
export interface FarmerFilters {
  page?: number
  limit?: number
  status?: 'active' | 'inactive' | 'pending'
  search?: string
  sortBy?: 'name' | 'email' | 'joinedAt' | 'status' | 'totalSales'
  sortOrder?: 'asc' | 'desc'
}

export interface CommissionFilters {
  page?: number
  limit?: number
  status?: 'pending' | 'approved' | 'paid' | 'cancelled'
  farmerId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  sortBy?: 'createdAt' | 'amount' | 'status' | 'paidAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ReferralFilters {
  page?: number
  limit?: number
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
  farmerId?: string
  sortBy?: 'createdAt' | 'commission' | 'status' | 'expiresAt'
  sortOrder?: 'asc' | 'desc'
}

// Error Types
export interface ApiError {
  status: 'error'
  message: string
  code?: string
  details?: {
    field?: string
    value?: any
    constraint?: string
  }
  timestamp?: string
}

// Success Response Types
export interface ApiSuccess<T = any> {
  status: 'success'
  data: T
  message?: string
}

// Generic API Response
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Pagination Meta
export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// All interfaces are already exported above
