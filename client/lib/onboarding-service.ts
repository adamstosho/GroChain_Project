import {
  FarmerOnboarding,
  OnboardingStats,
  OnboardingFilters,
  OnboardingTemplate,
  OnboardingWorkflow,
  BulkOnboardingResult
} from './types/onboarding'
import { apiService } from './api'
import { asRecord, getErrorStatus } from './error-utils'

function asStringListItem(item: unknown, nameKey: string, idKey: string): string {
  const rec = asRecord(item)
  const name = rec[nameKey]
  const id = rec[idKey]
  if (typeof name === 'string' && name) return name
  if (typeof id === 'string' && id) return id
  if (typeof item === 'string') return item
  return String(item)
}

function noteContent(n: unknown): string {
  if (typeof n === 'string') return n
  const rec = asRecord(n)
  return typeof rec.content === 'string' ? rec.content : ''
}

function docUrl(value: unknown): string | undefined {
  const url = asRecord(value).url
  return typeof url === 'string' ? url : undefined
}

function mapOnboarding(raw: unknown): FarmerOnboarding {
  const rec = asRecord(raw)
  const farmerRaw = rec.farmer
  const farmerDoc = farmerRaw && typeof farmerRaw === 'object' && !Array.isArray(farmerRaw) ? asRecord(farmerRaw) : {}
  const farmerId = typeof farmerRaw === 'string' ? farmerRaw : farmerDoc._id
  const partnerRec = asRecord(rec.assignedPartner)
  const agentRec = asRecord(rec.assignedAgent)
  const location = asRecord(rec.location)
  const documents = asRecord(rec.documents)
  const training = asRecord(rec.training)
  const currentModule = asRecord(training.currentModule)
  const completedModules = Array.isArray(training.completedModules) ? training.completedModules : []
  const certificates = Array.isArray(training.certificates) ? training.certificates : []
  const notes = Array.isArray(rec.notes) ? rec.notes : []

  return {
    _id: typeof rec._id === 'string' ? rec._id : String(rec._id ?? ''),
    farmer: {
      _id: typeof farmerId === 'string' ? farmerId : undefined,
      name: typeof farmerDoc.name === 'string' ? farmerDoc.name : 'Unknown',
      email: typeof farmerDoc.email === 'string' ? farmerDoc.email : '',
      phone: typeof farmerDoc.phone === 'string' ? farmerDoc.phone : '',
      location: typeof farmerDoc.location === 'string' ? farmerDoc.location : undefined,
      state: typeof location.state === 'string' ? location.state : undefined,
      lga: typeof location.lga === 'string' ? location.lga : undefined,
      village: typeof location.village === 'string' ? location.village : undefined,
      coordinates: location.coordinates as FarmerOnboarding['farmer']['coordinates'],
      farmSize: typeof farmerDoc.farmSize === 'number' ? farmerDoc.farmSize : undefined,
      farmSizeUnit: farmerDoc.farmSizeUnit as FarmerOnboarding['farmer']['farmSizeUnit'],
      primaryCrops: Array.isArray(farmerDoc.primaryCrops) ? farmerDoc.primaryCrops.filter((c): c is string => typeof c === 'string') : undefined,
      farmingExperience: farmerDoc.farmingExperience as FarmerOnboarding['farmer']['farmingExperience'],
      educationLevel: farmerDoc.educationLevel as FarmerOnboarding['farmer']['educationLevel'],
      householdSize: typeof farmerDoc.householdSize === 'number' ? farmerDoc.householdSize : undefined,
      annualIncome: typeof farmerDoc.annualIncome === 'number' ? farmerDoc.annualIncome : undefined,
      incomeSource: farmerDoc.incomeSource as FarmerOnboarding['farmer']['incomeSource']
    },
    documents: {
      idCard: docUrl(documents.idCard),
      landDocument: docUrl(documents.landDocument),
      bankStatement: docUrl(documents.bankStatement),
      passportPhoto: docUrl(documents.passportPhoto)
    },
    training: {
      completedModules: completedModules.map((m) => asStringListItem(m, 'moduleName', 'moduleId')),
      currentModule:
        typeof currentModule.moduleName === 'string' && currentModule.moduleName
          ? currentModule.moduleName
          : typeof currentModule.moduleId === 'string' && currentModule.moduleId
            ? currentModule.moduleId
            : undefined,
      progress: typeof currentModule.progress === 'number' ? currentModule.progress : 0,
      certificates: certificates.map((c) => asStringListItem(c, 'moduleName', 'certificateUrl')),
      lastTrainingDate: training.lastTrainingDate as Date | undefined
    },
    status: rec.status as FarmerOnboarding['status'],
    stage: rec.stage as FarmerOnboarding['stage'],
    assignedPartner: typeof rec.assignedPartner === 'string'
      ? rec.assignedPartner
      : (typeof partnerRec._id === 'string' ? partnerRec._id : ''),
    assignedAgent: typeof rec.assignedAgent === 'string'
      ? rec.assignedAgent
      : (typeof agentRec._id === 'string' ? agentRec._id : undefined),
    createdAt: rec.createdAt as Date,
    updatedAt: rec.updatedAt as Date,
    completedAt: rec.actualCompletionDate as Date | undefined,
    notes: notes.map(noteContent),
    nextFollowUp: rec.nextFollowUp as Date | undefined,
    priority: rec.priority as FarmerOnboarding['priority'],
    estimatedCompletionDate: rec.estimatedCompletionDate as Date | undefined
  }
}

export class OnboardingService {
  private static instance: OnboardingService
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService()
    }
    return OnboardingService.instance
  }

  private getCacheKey(key: string): string {
    return `onboarding-${key}`
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(this.getCacheKey(key), { data, timestamp: Date.now() })
  }

  private getCache(key: string): unknown | null {
    const cached = this.cache.get(this.getCacheKey(key))
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  clearCache(): void {
    this.cache.clear()
  }

  // Get all onboarding records with filters (real API call)
  async getOnboardings(filters: OnboardingFilters = {}): Promise<FarmerOnboarding[]> {
    const cacheKey = `onboardings-${JSON.stringify(filters)}`
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached as FarmerOnboarding[]
    }

    try {
      const response = await apiService.getOnboardings({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        stage: filters.stage,
        priority: filters.priority,
        state: filters.state,
        assignedAgent: filters.assignedAgent,
        searchTerm: filters.searchTerm,
        dateRange: filters.dateRange
      })

      const raw = response.data?.onboardings || []
      const onboardings = raw.map(mapOnboarding)

      this.setCache(cacheKey, onboardings)
      return onboardings
    } catch (error) {
      console.error('Error fetching onboardings:', error)
      throw error
    }
  }

  // Get onboarding statistics (real API call)
  async getOnboardingStats(): Promise<OnboardingStats> {
    const cacheKey = 'stats'
    const cached = this.getCache(cacheKey)

    if (cached) {
      return cached as OnboardingStats
    }

    try {
      const response = await apiService.getOnboardingStats()
      const data = response.data
      if (!data) {
        throw new Error('No onboarding stats data received from server')
      }
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching onboarding stats:', error)
      throw error
    }
  }

  // Get onboarding by ID (real API call)
  async getOnboardingById(id: string): Promise<FarmerOnboarding | null> {
    try {
      const response = await apiService.getOnboardingById(id)
      return response.data ? mapOnboarding(response.data) : null
    } catch (error: unknown) {
      if (getErrorStatus(error) === 404) {
        return null
      }
      console.error('Error fetching onboarding by ID:', error)
      throw error
    }
  }

  // Create new onboarding (real API call)
  async createOnboarding(onboardingData: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> {
    try {
      const farmerId = onboardingData.farmer?._id
      if (!farmerId) {
        throw new Error('farmer._id is required to create an onboarding record')
      }
      if (!onboardingData.assignedPartner) {
        throw new Error('assignedPartner is required to create an onboarding record')
      }

      const location = onboardingData.farmer
        ? {
            state: onboardingData.farmer.state,
            lga: onboardingData.farmer.lga,
            village: onboardingData.farmer.village,
            coordinates: onboardingData.farmer.coordinates
          }
        : undefined

      const response = await apiService.createOnboarding({
        farmerId,
        assignedPartner: onboardingData.assignedPartner,
        assignedAgent: onboardingData.assignedAgent,
        priority: onboardingData.priority,
        notes: onboardingData.notes?.[0],
        estimatedCompletionDate: onboardingData.estimatedCompletionDate
          ? new Date(onboardingData.estimatedCompletionDate).toISOString()
          : undefined,
        location
      })

      if (!response.data) {
        throw new Error('No data received from server after creating onboarding')
      }

      this.clearCache()
      return mapOnboarding(response.data)
    } catch (error) {
      console.error('Error creating onboarding:', error)
      throw error
    }
  }

  // Update onboarding (real API call)
  async updateOnboarding(id: string, updateData: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> {
    try {
      const response = await apiService.updateOnboarding(id, updateData)
      if (!response.data) {
        throw new Error('No data received from server after updating onboarding')
      }
      this.clearCache()
      return mapOnboarding(response.data)
    } catch (error) {
      console.error('Error updating onboarding:', error)
      throw error
    }
  }

  // Update onboarding stage (real API call)
  async updateOnboardingStage(id: string, stage: string, notes?: string): Promise<FarmerOnboarding> {
    try {
      const response = await apiService.updateOnboardingStage(id, { stage, notes })
      if (!response.data) {
        throw new Error('No data received from server after updating onboarding stage')
      }
      this.clearCache()
      return mapOnboarding(response.data)
    } catch (error) {
      console.error('Error updating onboarding stage:', error)
      throw error
    }
  }

  // Delete onboarding (real API call)
  async deleteOnboarding(id: string): Promise<void> {
    try {
      await apiService.deleteOnboarding(id)
      this.clearCache()
    } catch (error) {
      console.error('Error deleting onboarding:', error)
      throw error
    }
  }

  // Get onboarding communication templates.
  // TODO: backend/routes/onboarding.routes.js has no endpoint for communication
  // templates (no GET /api/onboarding/templates or equivalent exists anywhere in
  // backend/routes/). Returning an honest empty list rather than fabricating
  // templates until a real endpoint is added.
  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    console.warn('[onboarding-service] getOnboardingTemplates: no backend endpoint exists yet - returning empty list')
    return []
  }

  // Get onboarding workflow definition.
  // TODO: backend/routes/onboarding.routes.js has no endpoint for the workflow
  // definition (no GET /api/onboarding/workflow or equivalent exists). Returning
  // null (an honest "not found") rather than fabricating a workflow. The
  // OnboardingWorkflow component already renders a proper "No Workflow Found"
  // empty state for this case.
  async getOnboardingWorkflow(): Promise<OnboardingWorkflow | null> {
    console.warn('[onboarding-service] getOnboardingWorkflow: no backend endpoint exists yet - returning null')
    return null
  }

  // Process bulk onboarding from a CSV file.
  // TODO: There is no backend endpoint that bulk-creates/updates Onboarding
  // pipeline records (stage/documents/training) from an uploaded CSV file.
  // - POST /api/onboarding/bulk-update (bulkUpdateOnboardings) takes JSON
  //   { onboardingIds, updates } for existing records - not a file upload.
  // - POST /api/partners/upload-csv (bulkUploadFarmersCSV) is a *different*
  //   flow: it creates brand-new farmer User accounts for a partner
  //   (see app/partners/bulk-onboard/page.tsx), not Onboarding pipeline records.
  // Wiring this to either endpoint would misrepresent what actually happens, so
  // this throws a clear "not implemented" error instead of faking success.
  async processBulkOnboarding(_file: File): Promise<BulkOnboardingResult> {
    console.error('[onboarding-service] processBulkOnboarding: no matching backend endpoint exists for CSV bulk onboarding of Onboarding pipeline records')
    throw new Error(
      'Bulk CSV onboarding is not yet supported by the backend. No endpoint exists to create/update onboarding pipeline records from a CSV file.'
    )
  }

  // Send a templated communication (SMS/email/WhatsApp) to a farmer.
  // TODO: No backend endpoint accepts (templateId, farmerId, variables) to send
  // a templated communication. backend/routes/notification.routes.js only has
  // generic user notifications (harvest/marketplace/transaction/test) - none of
  // which match this template-based onboarding communication flow. Throwing
  // rather than silently returning `true` as the old mock implementation did.
  async sendCommunication(_templateId: string, _farmerId: string, _variables: Record<string, string>): Promise<boolean> {
    console.error('[onboarding-service] sendCommunication: no matching backend endpoint exists for template-based communications')
    throw new Error(
      'Sending onboarding communications is not yet supported by the backend. No endpoint exists for template-based farmer communications.'
    )
  }

  // Get onboarding progress for a farmer (real API call)
  async getOnboardingProgress(farmerId: string): Promise<Record<string, unknown> | undefined> {
    try {
      const response = await apiService.getOnboardingProgress(farmerId)
      return response.data
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      throw error
    }
  }

  // Bulk update existing onboarding records (real API call)
  async bulkUpdateOnboardings(onboardingIds: string[], updates: Record<string, unknown>): Promise<{ modifiedCount: number; matchedCount: number }> {
    try {
      const response = await apiService.bulkUpdateOnboardings({ onboardingIds, updates })
      this.clearCache()
      return response.data || { modifiedCount: 0, matchedCount: 0 }
    } catch (error) {
      console.error('Error bulk updating onboardings:', error)
      throw error
    }
  }

  // Export onboarding data (real API call)
  async exportOnboardingData(filters: OnboardingFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      return await apiService.exportOnboardings(filters as Record<string, unknown>, format)
    } catch (error) {
      console.error('Error exporting onboarding data:', error)
      throw error
    }
  }
}

export const onboardingService = OnboardingService.getInstance()
