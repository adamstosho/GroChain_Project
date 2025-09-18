import { 
  FarmerOnboarding, 
  OnboardingStats, 
  OnboardingFilters, 
  OnboardingTemplate,
  OnboardingWorkflow,
  BulkOnboardingResult
} from './types/onboarding'
import { mockOnboardings, mockOnboardingStats, mockOnboardingTemplates, mockOnboardingWorkflow } from './mock-data/onboarding'

export class OnboardingService {
  private static instance: OnboardingService
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
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

  private setCache(key: string, data: any): void {
    this.cache.set(this.getCacheKey(key), { data, timestamp: Date.now() })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(this.getCacheKey(key))
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  clearCache(): void {
    this.cache.clear()
  }

  // Get all onboarding records with filters
  async getOnboardings(filters: OnboardingFilters = {}): Promise<FarmerOnboarding[]> {
    const cacheKey = `onboardings-${JSON.stringify(filters)}`
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // For now, use mock data - replace with actual API call
      let filteredOnboardings = [...mockOnboardings]
      
      // Apply filters
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        filteredOnboardings = filteredOnboardings.filter(onboarding =>
          onboarding.farmer.name.toLowerCase().includes(searchTerm) ||
          onboarding.farmer.email.toLowerCase().includes(searchTerm) ||
          onboarding.farmer.location?.toLowerCase().includes(searchTerm) ||
          onboarding.farmer.primaryCrops?.some(crop => crop.toLowerCase().includes(searchTerm))
        )
      }
      
      if (filters.status && filters.status !== 'all') {
        filteredOnboardings = filteredOnboardings.filter(onboarding => onboarding.status === filters.status)
      }
      
      if (filters.stage && filters.stage !== 'all') {
        filteredOnboardings = filteredOnboardings.filter(onboarding => onboarding.stage === filters.stage)
      }
      
      if (filters.state && filters.state !== 'all') {
        filteredOnboardings = filteredOnboardings.filter(onboarding => onboarding.farmer.state === filters.state)
      }
      
      if (filters.priority && filters.priority !== 'all') {
        filteredOnboardings = filteredOnboardings.filter(onboarding => onboarding.priority === filters.priority)
      }
      
      if (filters.assignedAgent && filters.assignedAgent !== 'all') {
        filteredOnboardings = filteredOnboardings.filter(onboarding => onboarding.assignedAgent === filters.assignedAgent)
      }
      
      if (filters.dateRange) {
        filteredOnboardings = filteredOnboardings.filter(onboarding => {
          const createdDate = new Date(onboarding.createdAt)
          return createdDate >= filters.dateRange!.start && createdDate <= filters.dateRange!.end
        })
      }
      
      this.setCache(cacheKey, filteredOnboardings)
      return filteredOnboardings
    } catch (error) {
      console.error('Error fetching onboardings:', error)
      throw error
    }
  }

  // Get onboarding statistics
  async getOnboardingStats(): Promise<OnboardingStats> {
    const cacheKey = 'stats'
    const cached = this.getCache(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // For now, use mock data - replace with actual API call
      this.setCache(cacheKey, mockOnboardingStats)
      return mockOnboardingStats
    } catch (error) {
      console.error('Error fetching onboarding stats:', error)
      throw error
    }
  }

  // Get onboarding by ID
  async getOnboardingById(id: string): Promise<FarmerOnboarding | null> {
    try {
      // For now, use mock data - replace with actual API call
      const onboarding = mockOnboardings.find(o => o._id === id)
      return onboarding || null
    } catch (error) {
      console.error('Error fetching onboarding by ID:', error)
      throw error
    }
  }

  // Create new onboarding
  async createOnboarding(onboardingData: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> {
    try {
      // For now, simulate creation - replace with actual API call
      const newOnboarding: FarmerOnboarding = {
        _id: Date.now().toString(),
        farmer: onboardingData.farmer!,
        documents: onboardingData.documents || {},
        training: {
          completedModules: [],
          progress: 0,
          certificates: []
        },
        status: 'pending',
        stage: 'registration',
        assignedPartner: onboardingData.assignedPartner!,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: [],
        priority: 'medium'
      }
      
      // Add to mock data
      mockOnboardings.push(newOnboarding)
      this.clearCache() // Clear cache after creation
      
      return newOnboarding
    } catch (error) {
      console.error('Error creating onboarding:', error)
      throw error
    }
  }

  // Update onboarding
  async updateOnboarding(id: string, updateData: Partial<FarmerOnboarding>): Promise<FarmerOnboarding> {
    try {
      // For now, simulate update - replace with actual API call
      const onboardingIndex = mockOnboardings.findIndex(o => o._id === id)
      if (onboardingIndex === -1) {
        throw new Error('Onboarding not found')
      }
      
      const updatedOnboarding = {
        ...mockOnboardings[onboardingIndex],
        ...updateData,
        updatedAt: new Date()
      }
      
      mockOnboardings[onboardingIndex] = updatedOnboarding
      this.clearCache() // Clear cache after update
      
      return updatedOnboarding
    } catch (error) {
      console.error('Error updating onboarding:', error)
      throw error
    }
  }

  // Update onboarding stage
  async updateOnboardingStage(id: string, stage: string, notes?: string): Promise<FarmerOnboarding> {
    try {
      const onboarding = await this.getOnboardingById(id)
      if (!onboarding) {
        throw new Error('Onboarding not found')
      }
      
      const updateData: Partial<FarmerOnboarding> = {
        stage: stage as any,
        updatedAt: new Date()
      }
      
      if (notes) {
        updateData.notes = [...(onboarding.notes || []), notes]
      }
      
      return await this.updateOnboarding(id, updateData)
    } catch (error) {
      console.error('Error updating onboarding stage:', error)
      throw error
    }
  }

  // Get onboarding templates
  async getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    try {
      // For now, use mock data - replace with actual API call
      return mockOnboardingTemplates
    } catch (error) {
      console.error('Error fetching onboarding templates:', error)
      throw error
    }
  }

  // Get onboarding workflow
  async getOnboardingWorkflow(): Promise<OnboardingWorkflow> {
    try {
      // For now, use mock data - replace with actual API call
      return mockOnboardingWorkflow
    } catch (error) {
      console.error('Error fetching onboarding workflow:', error)
      throw error
    }
  }

  // Process bulk onboarding
  async processBulkOnboarding(file: File): Promise<BulkOnboardingResult> {
    try {
      // For now, simulate bulk processing - replace with actual API call
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      const data = lines.slice(1).filter(line => line.trim())
      
      let successful = 0
      let failed = 0
      const errors: any[] = []
      const warnings: any[] = []
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const values = row.split(',')
        
        try {
          // Validate required fields
          if (values.length < headers.length) {
            errors.push({
              row: i + 2,
              field: 'general',
              message: 'Insufficient data columns',
              value: row
            })
            failed++
            continue
          }
          
          // Simulate successful processing
          successful++
        } catch (error) {
          errors.push({
            row: i + 2,
            field: 'general',
            message: 'Processing error',
            value: row
          })
          failed++
        }
      }
      
      const result: BulkOnboardingResult = {
        total: data.length,
        successful,
        failed,
        errors,
        warnings,
        summary: {
          newFarmers: successful,
          updatedFarmers: 0,
          skippedFarmers: 0
        }
      }
      
      return result
    } catch (error) {
      console.error('Error processing bulk onboarding:', error)
      throw error
    }
  }

  // Send communication using template
  async sendCommunication(templateId: string, farmerId: string, variables: Record<string, string>): Promise<boolean> {
    try {
      // For now, simulate sending - replace with actual API call
      console.log(`Sending communication using template ${templateId} to farmer ${farmerId}`)
      console.log('Variables:', variables)
      
      // Simulate success
      return true
    } catch (error) {
      console.error('Error sending communication:', error)
      throw error
    }
  }

  // Get onboarding progress
  async getOnboardingProgress(farmerId: string): Promise<any> {
    try {
      const onboarding = await this.getOnboardingById(farmerId)
      if (!onboarding) {
        throw new Error('Onboarding not found')
      }
      
      // Calculate progress based on stage
      const stages = ['registration', 'documentation', 'training', 'verification', 'activation']
      const currentStageIndex = stages.indexOf(onboarding.stage)
      const progress = ((currentStageIndex + 1) / stages.length) * 100
      
      return {
        farmerId,
        currentStage: onboarding.stage,
        completedStages: stages.slice(0, currentStageIndex + 1),
        pendingStages: stages.slice(currentStageIndex + 1),
        overallProgress: Math.round(progress),
        estimatedCompletionDate: onboarding.estimatedCompletionDate,
        nextActions: this.getNextActions(onboarding.stage)
      }
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      throw error
    }
  }

  // Get next actions based on current stage
  private getNextActions(stage: string): string[] {
    switch (stage) {
      case 'registration':
        return ['Collect farmer documents', 'Verify contact information', 'Assign agent']
      case 'documentation':
        return ['Review uploaded documents', 'Request missing documents', 'Schedule training']
      case 'training':
        return ['Monitor training progress', 'Schedule verification visit', 'Prepare activation']
      case 'verification':
        return ['Complete verification process', 'Finalize documentation', 'Prepare activation']
      case 'activation':
        return ['Create marketplace account', 'Send welcome package', 'Begin monitoring']
      default:
        return ['Review current status', 'Determine next steps']
    }
  }

  // Export onboarding data
  async exportOnboardingData(filters: OnboardingFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const data = await this.getOnboardings(filters)
      const csvContent = this.generateCSV(data)
      return new Blob([csvContent], { type: 'text/csv' })
    } catch (error) {
      console.error('Error exporting onboarding data:', error)
      throw error
    }
  }

  // Generate CSV content
  private generateCSV(data: FarmerOnboarding[]): string {
    if (data.length === 0) return ""

    const headers = [
      "ID", "Farmer Name", "Email", "Phone", "Location", "State", "LGA", "Village",
      "Farm Size", "Farm Size Unit", "Primary Crops", "Farming Experience", "Education Level",
      "Household Size", "Annual Income", "Income Source", "Status", "Stage", "Priority",
      "Created Date", "Estimated Completion", "Next Follow Up"
    ]

    const rows = data.map(onboarding => [
      onboarding._id,
      onboarding.farmer.name,
      onboarding.farmer.email,
      onboarding.farmer.phone,
      onboarding.farmer.location,
      onboarding.farmer.state,
      onboarding.farmer.lga,
      onboarding.farmer.village,
      onboarding.farmer.farmSize,
      onboarding.farmer.farmSizeUnit,
      onboarding.farmer.primaryCrops?.join('; ') || '',
      onboarding.farmer.farmingExperience,
      onboarding.farmer.educationLevel,
      onboarding.farmer.householdSize,
      onboarding.farmer.annualIncome,
      onboarding.farmer.incomeSource,
      onboarding.status,
      onboarding.stage,
      onboarding.priority,
      new Date(onboarding.createdAt).toLocaleDateString(),
      onboarding.estimatedCompletionDate ? new Date(onboarding.estimatedCompletionDate).toLocaleDateString() : '',
      onboarding.nextFollowUp ? new Date(onboarding.nextFollowUp).toLocaleDateString() : ''
    ].map(field => (typeof field === 'string' && field.includes(',')) ? `"${field}"` : field).join(','))

    return [headers.join(','), ...rows].join('\n')
  }
}

export const onboardingService = OnboardingService.getInstance()
