import { create } from 'zustand'
import { adminApiService } from '@/lib/admin-api'

interface AdminState {
  // State
  users: any[]
  harvests: any[]
  partners: any[]
  listings: any[]
  orders: any[]
  commissions: any[]
  payments: any[]
  financial: any
  analytics: any
  system: any
  security: any
  moderation: any
  isLoading: boolean
  error: string | null
  
  // Pagination
  pagination: {
    users: { page: number; limit: number; total: number }
    harvests: { page: number; limit: number; total: number }
    partners: { page: number; limit: number; total: number }
    listings: { page: number; limit: number; total: number }
    orders: { page: number; limit: number; total: number }
  }
  
  // Filters
  filters: {
    users: any
    harvests: any
    partners: any
    listings: any
    orders: any
  }
  
  // Actions - User Management
  fetchUsers: (params?: any) => Promise<void>
  updateUser: (userId: string, data: any) => Promise<void>
  suspendUser: (userId: string, reason: string) => Promise<void>
  activateUser: (userId: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  bulkUserOperation: (action: string, userIds: string[], reason?: string) => Promise<void>
  getUserAnalytics: (filters?: any) => Promise<void>
  
  // Actions - Harvest Management
  fetchHarvests: (params?: any) => Promise<void>
  approveHarvest: (harvestId: string, notes?: string) => Promise<void>
  rejectHarvest: (harvestId: string, reason: string) => Promise<void>
  bulkHarvestApproval: (harvestIds: string[], action: string, reason?: string) => Promise<void>
  getHarvestAnalytics: (filters?: any) => Promise<void>
  
  // Actions - Partner Management
  fetchPartners: (params?: any) => Promise<void>
  approvePartner: (partnerId: string, notes?: string) => Promise<void>
  rejectPartner: (partnerId: string, reason: string) => Promise<void>
  updatePartner: (partnerId: string, data: any) => Promise<void>
  deletePartner: (partnerId: string) => Promise<void>
  getPartnerAnalytics: (filters?: any) => Promise<void>
  
  // Actions - Marketplace Management
  fetchListings: (params?: any) => Promise<void>
  updateListing: (listingId: string, data: any) => Promise<void>
  deleteListing: (listingId: string) => Promise<void>
  fetchOrders: (params?: any) => Promise<void>
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<void>
  getMarketplaceAnalytics: (filters?: any) => Promise<void>
  
  // Actions - Financial Management
  fetchFinancialOverview: () => Promise<void>
  fetchCommissions: (params?: any) => Promise<void>
  processCommissionPayout: (commissionId: string, payoutData: any) => Promise<void>
  fetchPayments: (params?: any) => Promise<void>
  getFinancialAnalytics: (filters?: any) => Promise<void>
  generateFinancialReport: (reportData: any) => Promise<void>
  
  // Actions - Analytics & Reporting
  fetchSystemAnalytics: () => Promise<void>
  fetchBusinessIntelligence: () => Promise<void>
  generateCustomReport: (reportData: any) => Promise<void>
  exportAnalyticsData: (filters: any, format: string) => Promise<Blob>
  
  // Actions - System Management
  fetchSystemHealth: () => Promise<void>
  fetchSystemMetrics: () => Promise<void>
  updateSystemConfig: (configData: any) => Promise<void>
  getSystemLogs: (params?: any) => Promise<void>
  triggerSystemMaintenance: (maintenanceData: any) => Promise<void>
  triggerBackup: (backupData: any) => Promise<void>
  
  // Actions - Content Moderation
  fetchPendingContent: (params?: any) => Promise<void>
  approveContent: (contentId: string, notes?: string) => Promise<void>
  rejectContent: (contentId: string, reason: string) => Promise<void>
  getModerationAnalytics: (filters?: any) => Promise<void>
  
  // Actions - Security & Compliance
  fetchSecurityAlerts: (params?: any) => Promise<void>
  fetchFraudReports: (params?: any) => Promise<void>
  updateSecuritySettings: (securityData: any) => Promise<void>
  getComplianceReport: () => Promise<void>
  
  // Actions - Admin Profile & Permissions
  fetchAdminProfile: () => Promise<void>
  updateAdminProfile: (profileData: any) => Promise<void>
  fetchAdminPermissions: () => Promise<void>
  fetchAdminActivityLog: (params?: any) => Promise<void>
  
  // Utility Actions
  setError: (error: string | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  resetState: () => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  users: [],
  harvests: [],
  partners: [],
  listings: [],
  orders: [],
  commissions: [],
  payments: [],
  financial: null,
  analytics: null,
  system: null,
  security: null,
  moderation: null,
  isLoading: false,
  error: null,
  
  pagination: {
    users: { page: 1, limit: 20, total: 0 },
    harvests: { page: 1, limit: 20, total: 0 },
    partners: { page: 1, limit: 20, total: 0 },
    listings: { page: 1, limit: 20, total: 0 },
    orders: { page: 1, limit: 20, total: 0 },
  },
  
  filters: {
    users: {},
    harvests: {},
    partners: {},
    listings: {},
    orders: {},
  },

  // ==================== USER MANAGEMENT ACTIONS ====================

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllUsers(params)
      set({ 
        users: response.data.users, 
        pagination: { ...get().pagination, users: response.data },
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateUser: async (userId: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.updateUser(userId, data)
      set(state => ({
        users: state.users.map(user =>
          user._id === userId ? { ...user, ...response.data } : user
        ),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  suspendUser: async (userId: string, reason: string) => {
    try {
      await adminApiService.suspendUser(userId, reason)
      set(state => ({
        users: state.users.map(user =>
          user._id === userId ? { ...user, status: 'suspended', suspensionReason: reason } : user
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  activateUser: async (userId: string) => {
    try {
      await adminApiService.activateUser(userId)
      set(state => ({
        users: state.users.map(user =>
          user._id === userId ? { ...user, status: 'active' } : user
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteUser: async (userId: string) => {
    try {
      await adminApiService.deleteUser(userId)
      set(state => ({
        users: state.users.filter(user => user._id !== userId)
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  bulkUserOperation: async (action: string, userIds: string[], reason?: string) => {
    set({ isLoading: true, error: null })
    try {
      await adminApiService.bulkUserOperation(action, userIds, reason)
      await get().fetchUsers() // Refresh users list
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  getUserAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getUserAnalytics(filters)
      set({ 
        analytics: { ...get().analytics, users: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== HARVEST MANAGEMENT ACTIONS ====================

  fetchHarvests: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllHarvests(params)
      set({ 
        harvests: response.data.harvests, 
        pagination: { ...get().pagination, harvests: response.data },
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  approveHarvest: async (harvestId: string, notes?: string) => {
    try {
      await adminApiService.approveHarvest(harvestId, notes)
      set(state => ({
        harvests: state.harvests.map(harvest =>
          harvest._id === harvestId ? { ...harvest, status: 'approved' } : harvest
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  rejectHarvest: async (harvestId: string, reason: string) => {
    try {
      await adminApiService.rejectHarvest(harvestId, reason)
      set(state => ({
        harvests: state.harvests.map(harvest =>
          harvest._id === harvestId ? { ...harvest, status: 'rejected' } : harvest
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  bulkHarvestApproval: async (harvestIds: string[], action: string, reason?: string) => {
    set({ isLoading: true, error: null })
    try {
      await adminApiService.bulkHarvestApproval(harvestIds, action as 'approve' | 'reject', reason)
      await get().fetchHarvests() // Refresh harvests list
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  getHarvestAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getHarvestAnalytics(filters)
      set({ 
        analytics: { ...get().analytics, harvests: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== PARTNER MANAGEMENT ACTIONS ====================

  fetchPartners: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllPartners(params)
      set({ 
        partners: response.data.partners, 
        pagination: { ...get().pagination, partners: response.data },
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  approvePartner: async (partnerId: string, notes?: string) => {
    try {
      await adminApiService.approvePartner(partnerId, notes)
      set(state => ({
        partners: state.partners.map(partner =>
          partner._id === partnerId ? { ...partner, status: 'active' } : partner
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  rejectPartner: async (partnerId: string, reason: string) => {
    try {
      await adminApiService.rejectPartner(partnerId, reason)
      set(state => ({
        partners: state.partners.map(partner =>
          partner._id === partnerId ? { ...partner, status: 'rejected' } : partner
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  updatePartner: async (partnerId: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.updatePartner(partnerId, data)
      set(state => ({
        partners: state.partners.map(partner =>
          partner._id === partnerId ? { ...partner, ...response.data } : partner
        ),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  deletePartner: async (partnerId: string) => {
    try {
      await adminApiService.deletePartner(partnerId)
      set(state => ({
        partners: state.partners.filter(partner => partner._id !== partnerId)
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  getPartnerAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getPartnerAnalytics(filters)
      set({ 
        analytics: { ...get().analytics, partners: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== MARKETPLACE MANAGEMENT ACTIONS ====================

  fetchListings: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllListings(params)
      set({ 
        listings: response.data.listings, 
        pagination: { ...get().pagination, listings: response.data },
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateListing: async (listingId: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.updateListing(listingId, data)
      set(state => ({
        listings: state.listings.map(listing =>
          listing._id === listingId ? { ...listing, ...response.data } : listing
        ),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  deleteListing: async (listingId: string) => {
    try {
      await adminApiService.deleteListing(listingId)
      set(state => ({
        listings: state.listings.filter(listing => listing._id !== listingId)
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllOrders(params)
      set({ 
        orders: response.data.orders, 
        pagination: { ...get().pagination, orders: response.data },
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
    try {
      await adminApiService.updateOrderStatus(orderId, status, notes)
      set(state => ({
        orders: state.orders.map(order =>
          order._id === orderId ? { ...order, status } : order
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  getMarketplaceAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getMarketplaceAnalytics(filters)
      set({ 
        analytics: { ...get().analytics, marketplace: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== FINANCIAL MANAGEMENT ACTIONS ====================

  fetchFinancialOverview: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getFinancialOverview()
      set({ financial: response.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchCommissions: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllCommissions(params)
      set({ commissions: response.data.commissions, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  processCommissionPayout: async (commissionId: string, payoutData: any) => {
    try {
      await adminApiService.processCommissionPayout(commissionId, payoutData)
      await get().fetchFinancialOverview() // Refresh financial data
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  fetchPayments: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAllPayments(params)
      set({ payments: response.data.payments, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  getFinancialAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getFinancialAnalytics(filters)
      set({ 
        analytics: { ...get().analytics, financial: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  generateFinancialReport: async (reportData: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.generateFinancialReport(reportData)
      set({ isLoading: false })
      return response.data
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // ==================== ANALYTICS & REPORTING ACTIONS ====================

  fetchSystemAnalytics: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getSystemAnalytics()
      set({ 
        analytics: { ...get().analytics, system: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchBusinessIntelligence: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getBusinessIntelligence()
      set({ 
        analytics: { ...get().analytics, business: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  generateCustomReport: async (reportData: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.generateCustomReport(reportData)
      set({ isLoading: false })
      return response.data
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  exportAnalyticsData: async (filters: any, format: string) => {
    try {
      return await adminApiService.exportAnalyticsData(filters, format)
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  // ==================== SYSTEM MANAGEMENT ACTIONS ====================

  fetchSystemHealth: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getSystemHealth()
      set({ 
        system: { ...get().system, health: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchSystemMetrics: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getSystemMetrics()
      set({ 
        system: { ...get().system, metrics: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateSystemConfig: async (configData: any) => {
    set({ isLoading: true, error: null })
    try {
      await adminApiService.updateSystemConfig(configData)
      await get().fetchSystemHealth() // Refresh system data
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  getSystemLogs: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getSystemLogs(params)
      set({ 
        system: { ...get().system, logs: response.data.logs }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  triggerSystemMaintenance: async (maintenanceData: any) => {
    try {
      await adminApiService.triggerSystemMaintenance(maintenanceData)
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  triggerBackup: async (backupData: any) => {
    try {
      await adminApiService.triggerManualBackup(backupData)
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // ==================== CONTENT MODERATION ACTIONS ====================

  fetchPendingContent: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getPendingContent(params)
      set({ 
        moderation: { ...get().moderation, pending: response.data.content }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  approveContent: async (contentId: string, notes?: string) => {
    try {
      await adminApiService.approveContent(contentId, notes)
      await get().fetchPendingContent() // Refresh pending content
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  rejectContent: async (contentId: string, reason: string) => {
    try {
      await adminApiService.rejectContent(contentId, reason)
      await get().fetchPendingContent() // Refresh pending content
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  getModerationAnalytics: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getModerationAnalytics(filters)
      set({ 
        moderation: { ...get().moderation, analytics: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== SECURITY & COMPLIANCE ACTIONS ====================

  fetchSecurityAlerts: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getSecurityAlerts(params)
      set({ 
        security: { ...get().security, alerts: response.data.alerts }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchFraudReports: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getFraudReports(params)
      set({ 
        security: { ...get().security, fraudReports: response.data.reports }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateSecuritySettings: async (securityData: any) => {
    set({ isLoading: true, error: null })
    try {
      await adminApiService.updateSecuritySettings(securityData)
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  getComplianceReport: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getComplianceReport()
      set({ 
        security: { ...get().security, compliance: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== ADMIN PROFILE & PERMISSIONS ACTIONS ====================

  fetchAdminProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAdminProfile()
      set({ 
        system: { ...get().system, adminProfile: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateAdminProfile: async (profileData: any) => {
    set({ isLoading: true, error: null })
    try {
      await adminApiService.updateAdminProfile(profileData)
      await get().fetchAdminProfile() // Refresh admin profile
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchAdminPermissions: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAdminPermissions()
      set({ 
        system: { ...get().system, permissions: response.data }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchAdminActivityLog: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await adminApiService.getAdminActivityLog(params)
      set({ 
        system: { ...get().system, activityLog: response.data.activities }, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // ==================== UTILITY ACTIONS ====================

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  resetState: () => set({
    users: [],
    harvests: [],
    partners: [],
    listings: [],
    orders: [],
    commissions: [],
    payments: [],
    financial: null,
    analytics: null,
    system: null,
    security: null,
    moderation: null,
    isLoading: false,
    error: null,
    pagination: {
      users: { page: 1, limit: 20, total: 0 },
      harvests: { page: 1, limit: 20, total: 0 },
      partners: { page: 1, limit: 20, total: 0 },
      listings: { page: 1, limit: 20, total: 0 },
      orders: { page: 1, limit: 20, total: 0 },
    },
    filters: {
      users: {},
      harvests: {},
      partners: {},
      listings: {},
      orders: {},
    },
  }),
}))
