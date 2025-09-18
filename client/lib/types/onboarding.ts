export interface FarmerOnboarding {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
    phone: string
    location?: string
    state?: string
    lga?: string
    village?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    farmSize?: number
    farmSizeUnit?: 'hectares' | 'acres'
    primaryCrops?: string[]
    farmingExperience?: 'beginner' | 'intermediate' | 'expert'
    educationLevel?: 'none' | 'primary' | 'secondary' | 'tertiary'
    householdSize?: number
    annualIncome?: number
    incomeSource?: 'farming' | 'mixed' | 'other'
  }
  documents: {
    idCard?: string
    landDocument?: string
    bankStatement?: string
    passportPhoto?: string
  }
  training: {
    completedModules: string[]
    currentModule?: string
    progress: number
    certificates: string[]
    lastTrainingDate?: Date
  }
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'on_hold'
  stage: 'registration' | 'documentation' | 'training' | 'verification' | 'activation'
  assignedPartner: string
  assignedAgent?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  notes: string[]
  nextFollowUp?: Date
  priority: 'low' | 'medium' | 'high'
  estimatedCompletionDate?: Date
}

export interface OnboardingStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  rejected: number
  onHold: number
  thisWeek: number
  thisMonth: number
  averageCompletionTime: number
  successRate: number
  regionalDistribution: {
    [state: string]: number
  }
  cropDistribution: {
    [crop: string]: number
  }
}

export interface OnboardingFilters {
  page?: number
  limit?: number
  status?: string
  stage?: string
  state?: string
  cropType?: string
  priority?: string
  assignedAgent?: string
  dateRange?: {
    start: Date
    end: Date
  }
  searchTerm?: string
}

export interface OnboardingTemplate {
  _id: string
  name: string
  type: 'sms' | 'email' | 'whatsapp'
  subject?: string
  content: string
  variables: string[]
  category: 'welcome' | 'reminder' | 'training' | 'verification' | 'completion'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OnboardingWorkflow {
  _id: string
  name: string
  stages: {
    name: string
    order: number
    required: boolean
    estimatedDuration: number
    actions: string[]
    dependencies: string[]
  }[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OnboardingProgress {
  farmerId: string
  currentStage: string
  completedStages: string[]
  pendingStages: string[]
  stageProgress: {
    [stage: string]: {
      status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
      startedAt?: Date
      completedAt?: Date
      notes: string[]
      documents: string[]
    }
  }
  overallProgress: number
  estimatedCompletionDate?: Date
  blockers: string[]
  nextActions: string[]
}

export interface BulkOnboardingResult {
  total: number
  successful: number
  failed: number
  errors: {
    row: number
    field: string
    message: string
    value?: any
  }[]
  warnings: {
    row: number
    field: string
    message: string
    suggestion: string
  }[]
  summary: {
    newFarmers: number
    updatedFarmers: number
    skippedFarmers: number
  }
}

export interface OnboardingMetrics {
  totalOnboarded: number
  monthlyGrowth: number
  regionalCoverage: number
  averageTimeToComplete: number
  trainingCompletionRate: number
  documentVerificationRate: number
  farmerRetentionRate: number
  partnerPerformance: {
    [partnerId: string]: {
      totalOnboarded: number
      successRate: number
      averageTime: number
      qualityScore: number
    }
  }
}
