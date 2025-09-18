export interface HarvestApproval {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
    location: string
    avatar?: string
  }
  harvest: {
    _id: string
    cropType: string
    quantity: number
    unit: string
    harvestDate: Date
    qualityScore?: number
    photos: string[]
    description: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  qualityAssessment?: {
    overallScore: number
    appearance: number
    freshness: number
    size: number
    cleanliness: number
    notes: string
  }
  rejectionReason?: string
  approvalNotes?: string
  priority: 'low' | 'medium' | 'high'
  estimatedValue: number
  location: string
}

export interface ApprovalStats {
  total: number
  pending: number
  approved: number
  rejected: number
  underReview: number
  averageQualityScore: number
  totalValue: number
  weeklyTrend: number
}

export interface ApprovalFilters {
  status?: string
  priority?: string
  cropType?: string
  location?: string
  dateRange?: {
    start: Date
    end: Date
  }
  searchTerm?: string
}

export interface QualityAssessment {
  overallScore: number
  appearance: number
  freshness: number
  size: number
  cleanliness: number
  notes: string
}

export interface ApprovalAction {
  approvalId: string
  action: 'approve' | 'reject' | 'review'
  notes?: string
  reason?: string
  qualityAssessment?: QualityAssessment
}

export interface BatchApprovalAction {
  approvalIds: string[]
  action: 'approve' | 'reject'
  notes?: string
  reason?: string
}

export interface ApprovalHistory {
  _id: string
  approvalId: string
  action: string
  performedBy: string
  performedAt: Date
  notes?: string
  previousStatus?: string
  newStatus: string
}

export interface ApprovalMetrics {
  totalProcessed: number
  averageProcessingTime: number
  qualityScoreDistribution: {
    excellent: number
    good: number
    average: number
    poor: number
  }
  topRejectionReasons: Array<{
    reason: string
    count: number
  }>
  farmerPerformance: Array<{
    farmerId: string
    farmerName: string
    approvalRate: number
    averageQualityScore: number
    totalSubmissions: number
  }>
}
