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
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  commissionRate: number
  commission?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  activeReferrals: number
  completedReferrals: number
  conversionRate: number
  monthlyGrowth: number
  averageCommission: number
  statusBreakdown: Array<{
    _id: string
    count: number
  }>
  performanceData: Array<{
    month: string
    referrals: number
    completed: number
    conversion: number
  }>
}

export interface ReferralFilters {
  page?: number
  limit?: number
  status?: string
  farmerId?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateReferralData {
  farmerId: string
  commissionRate: number
  notes?: string
}

export interface UpdateReferralData {
  status?: string
  commissionRate?: number
  notes?: string
}
