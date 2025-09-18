import { create } from 'zustand'
import { api } from '@/lib/api'
import type {
  PartnerDashboardData,
  PartnerMetrics,
  PartnerCommission,
  PartnerFarmer,
  Commission,
  Referral,
  BulkOnboardResponse,
  FarmerFilters,
  CommissionFilters,
  ReferralFilters
} from '@/lib/types/partners'

interface PartnerState {
  // Dashboard Data
  dashboard: PartnerDashboardData | null
  metrics: PartnerMetrics | null
  commission: PartnerCommission | null

  // Farmers Data
  farmers: PartnerFarmer[]
  farmersLoading: boolean
  farmersPagination: {
    page: number
    pages: number
    total: number
  }
  farmerFilters: FarmerFilters

  // Commissions Data
  commissions: Commission[]
  commissionsLoading: boolean
  commissionsPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  commissionFilters: CommissionFilters

  // Referrals Data
  referrals: Referral[]
  referralsLoading: boolean
  referralsPagination: {
    page: number
    totalPages: number
    totalDocs: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  referralFilters: ReferralFilters

  // Bulk Operations
  bulkUploadResult: BulkOnboardResponse | null
  bulkUploading: boolean

  // UI State
  loading: boolean
  error: string | null

  // Actions
  fetchDashboard: () => Promise<void>
  fetchMetrics: () => Promise<void>
  fetchCommission: () => Promise<void>
  fetchFarmers: (filters?: FarmerFilters) => Promise<void>
  fetchCommissions: (filters?: CommissionFilters) => Promise<void>
  fetchReferrals: (filters?: ReferralFilters) => Promise<void>
  uploadCSV: (file: File) => Promise<void>
  createReferral: (farmerId: string, data?: any) => Promise<void>
  processCommissionPayout: (data: any) => Promise<void>
  clearError: () => void
  resetBulkUpload: () => void
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  // Initial State
  dashboard: null,
  metrics: null,
  commission: null,
  farmers: [],
  farmersLoading: false,
  farmersPagination: { page: 1, pages: 0, total: 0 },
  farmerFilters: { page: 1, limit: 20 },
  commissions: [],
  commissionsLoading: false,
  commissionsPagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  },
  commissionFilters: { page: 1, limit: 20 },
  referrals: [],
  referralsLoading: false,
  referralsPagination: {
    page: 1,
    totalPages: 0,
    totalDocs: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  },
  referralFilters: { page: 1, limit: 20 },
  bulkUploadResult: null,
  bulkUploading: false,
  loading: false,
  error: null,

  // Actions
  fetchDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getPartnerDashboard()
      set({ dashboard: response.data as PartnerDashboardData, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchMetrics: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getPartnerMetrics()
      set({ metrics: response.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchCommission: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.getPartnerCommission()
      set({ commission: response.data as unknown as PartnerCommission, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchFarmers: async (filters = {}) => {
    const currentFilters = { ...get().farmerFilters, ...filters }
    set({ farmersLoading: true, error: null, farmerFilters: currentFilters })

    try {
      const response = await api.getPartnerFarmers(currentFilters)
      const data = response.data
      if (data) {
        set({
          farmers: data.farmers,
          farmersPagination: {
            page: data.page,
            pages: data.pages,
            total: data.total
          },
          farmersLoading: false
        })
      }
    } catch (error: any) {
      set({ error: error.message, farmersLoading: false })
    }
  },

  fetchCommissions: async (filters = {}) => {
    const currentFilters = { ...get().commissionFilters, ...filters }
    set({ commissionsLoading: true, error: null, commissionFilters: currentFilters })

    try {
      const response = await api.getCommissions(currentFilters)
      const data = response.data
      if (data) {
        set({
          commissions: data.commissions as Commission[],
          commissionsPagination: data.pagination,
          commissionsLoading: false
        })
      }
    } catch (error: any) {
      set({ error: error.message, commissionsLoading: false })
    }
  },

  fetchReferrals: async (filters = {}) => {
    const currentFilters = { ...get().referralFilters, ...filters }
    set({ referralsLoading: true, error: null, referralFilters: currentFilters })

    try {
      const response = await api.getReferrals(currentFilters)
      const data = response.data
      if (data) {
        set({
          referrals: data.docs as Referral[],
          referralsPagination: {
            page: data.page,
            totalPages: data.totalPages,
            totalDocs: data.totalDocs,
            limit: data.limit,
            hasNextPage: data.hasNextPage,
            hasPrevPage: data.hasPrevPage
          },
          referralsLoading: false
        })
      }
    } catch (error: any) {
      set({ error: error.message, referralsLoading: false })
    }
  },

  uploadCSV: async (file: File) => {
    set({ bulkUploading: true, error: null })
    try {
      const response = await api.uploadPartnerCSV(file)
      set({ bulkUploadResult: response.data as unknown as BulkOnboardResponse, bulkUploading: false })

      // Refresh farmers list after successful upload
      await get().fetchFarmers()
    } catch (error: any) {
      set({ error: error.message, bulkUploading: false })
      throw error
    }
  },

  createReferral: async (farmerId: string, data = {}) => {
    set({ loading: true, error: null })
    try {
      await api.createReferral({
        farmerId,
        ...data
      })
      // Refresh referrals after creation
      await get().fetchReferrals()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  processCommissionPayout: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await api.processCommissionPayout(data)
      // Refresh commission data after payout
      await get().fetchCommission()
      await get().fetchCommissions()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  resetBulkUpload: () => set({ bulkUploadResult: null, bulkUploading: false })
}))
