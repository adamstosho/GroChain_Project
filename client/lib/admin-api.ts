import { APP_CONFIG } from "./constants"

type QueryParams = Record<string, unknown>

function toQueryString(params: QueryParams = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value))
    }
  }
  return search.toString()
}

interface AdminApiResponse<T = unknown> {
  status: string
  message: string
  data: T
  timestamp: string
}

class AdminApiService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = APP_CONFIG.api.baseUrl
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<AdminApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = { "Content-Type": "application/json" }

    if (this.token && this.token !== 'undefined') {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      console.log("[Admin API] Request:", { url, method: options.method || "GET", headers })

      const response = await fetch(url, {
        ...options,
        headers,
        mode: "cors",
        credentials: "include",
      })

      console.log("[Admin API] Response:", { status: response.status, ok: response.ok })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        if (response.status === 0 || !response.status) {
          errorMessage = "Network error: Unable to connect to server"
        } else if (response.status >= 500) {
          errorMessage = "Server error: " + errorMessage
        } else if (response.status === 404) {
          errorMessage = "Admin endpoint not found: " + endpoint
        } else if (response.status === 403) {
          errorMessage = "Access denied: Insufficient admin privileges"
        }

        const err = new Error(errorMessage) as Error & { status: number }
        err.status = response.status
        throw err
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[Admin API] Error:", error)
      throw error
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem(APP_CONFIG.auth.tokenKey, token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(APP_CONFIG.auth.tokenKey)
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ users: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/users?${queryString}`)
  }

  async getUserById(userId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/users/${userId}`)
  }

  async updateUser(userId: string, data: object): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async suspendUser(userId: string, reason: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async activateUser(userId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/users/${userId}/activate`, {
      method: 'PATCH',
    })
  }

  async deleteUser(userId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async bulkUserOperation(action: string, userIds: string[], reason?: string): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, userIds, reason }),
    })
  }

  async getUserAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/users/analytics?${queryString}`)
  }

  // ==================== HARVEST MANAGEMENT ====================

  async getAllHarvests(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ harvests: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/harvests?${queryString}`)
  }

  async getHarvestById(harvestId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/harvests/${harvestId}`)
  }

  async approveHarvest(harvestId: string, notes?: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/harvests/${harvestId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectHarvest(harvestId: string, reason: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/harvests/${harvestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async bulkHarvestApproval(harvestIds: string[], action: 'approve' | 'reject', reason?: string): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/harvests/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ harvestIds, action, reason }),
    })
  }

  async getHarvestAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/harvests/analytics?${queryString}`)
  }

  // ==================== PARTNER MANAGEMENT ====================

  async getAllPartners(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ partners: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/partners?${queryString}`)
  }

  async getPartnerById(partnerId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/partners/${partnerId}`)
  }

  async approvePartner(partnerId: string, notes?: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/partners/${partnerId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectPartner(partnerId: string, reason: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/partners/${partnerId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async updatePartner(partnerId: string, data: object): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/partners/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePartner(partnerId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/partners/${partnerId}`, {
      method: 'DELETE',
    })
  }

  async getPartnerAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/partners/analytics?${queryString}`)
  }

  // ==================== MARKETPLACE MANAGEMENT ====================

  async getAllListings(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ listings: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/marketplace/listings?${queryString}`)
  }

  async getListingById(listingId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`)
  }

  async updateListing(listingId: string, data: object): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteListing(listingId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`, {
      method: 'DELETE',
    })
  }

  async getAllOrders(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ orders: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/marketplace/orders?${queryString}`)
  }

  async getOrderById(orderId: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/marketplace/orders/${orderId}`)
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/marketplace/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    })
  }

  async getMarketplaceAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/marketplace/analytics?${queryString}`)
  }

  // ==================== FINANCIAL MANAGEMENT ====================

  async getFinancialOverview(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/financial/overview')
  }

  async getAllCommissions(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ commissions: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/financial/commissions?${queryString}`)
  }

  async processCommissionPayout(commissionId: string, payoutData: object): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/financial/commissions/${commissionId}/payout`, {
      method: 'POST',
      body: JSON.stringify(payoutData),
    })
  }

  async getAllPayments(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ payments: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/financial/payments?${queryString}`)
  }

  async getFinancialAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/financial/analytics?${queryString}`)
  }

  async generateFinancialReport(reportData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/financial/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getSystemAnalytics(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/analytics/system')
  }

  async getBusinessIntelligence(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/analytics/business')
  }


  async generateCustomReport(reportData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/analytics/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }

  async exportAnalyticsData(filters: Record<string, unknown>, format: string = 'csv'): Promise<Blob> {
    const params: Record<string, string> = { format }
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) params[key] = String(value)
    }
    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`${this.baseURL}/api/admin/analytics/export?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${this.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }
    
    return response.blob()
  }

  // ==================== SYSTEM MANAGEMENT ====================

  async getSystemHealth(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/health')
  }

  async getSystemMetrics(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/metrics')
  }

  async updateSystemConfig(configData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    })
  }

  async getSystemLogs(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ logs: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/system/logs?${queryString}`)
  }

  async triggerSystemMaintenance(maintenanceData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    })
  }

  async getBackupStatus(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/backups')
  }

  async triggerManualBackup(backupData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/system/backup', {
      method: 'POST',
      body: JSON.stringify(backupData),
    })
  }

  // ==================== CONTENT MODERATION ====================

  async getPendingContent(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ content: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/moderation/pending?${queryString}`)
  }

  async approveContent(contentId: string, notes?: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/moderation/${contentId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectContent(contentId: string, reason: string): Promise<AdminApiResponse<unknown>> {
    return this.request(`/api/admin/moderation/${contentId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async getModerationAnalytics(filters: Record<string, unknown> = {}): Promise<AdminApiResponse<unknown>> {
    const queryString = toQueryString(filters)
    return this.request(`/api/admin/moderation/analytics?${queryString}`)
  }

  // ==================== SECURITY & COMPLIANCE ====================

  async getSecurityAlerts(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ alerts: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/security/alerts?${queryString}`)
  }

  async getFraudReports(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ reports: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/security/fraud?${queryString}`)
  }

  async updateSecuritySettings(securityData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/security/settings', {
      method: 'PUT',
      body: JSON.stringify(securityData),
    })
  }

  async getComplianceReport(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/security/compliance')
  }

  // ==================== ADMIN PROFILE & PERMISSIONS ====================

  async getAdminProfile(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/profile')
  }

  async updateAdminProfile(profileData: object): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }

  async getAdminPermissions(): Promise<AdminApiResponse<unknown>> {
    return this.request('/api/admin/permissions')
  }

  async getAdminActivityLog(params: Record<string, unknown> = {}): Promise<AdminApiResponse<{ activities: unknown[], total: number, page: number, limit: number }>> {
    const queryString = toQueryString(params)
    return this.request(`/api/admin/activity-log?${queryString}`)
  }
}

export const adminApiService = new AdminApiService()
