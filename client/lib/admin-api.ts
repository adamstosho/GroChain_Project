import { APP_CONFIG } from "./constants"

interface AdminApiResponse<T = any> {
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

        const err: any = new Error(errorMessage)
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

  async getAllUsers(params: any = {}): Promise<AdminApiResponse<{ users: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/users?${queryString}`)
  }

  async getUserById(userId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/users/${userId}`)
  }

  async updateUser(userId: string, data: any): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async suspendUser(userId: string, reason: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async activateUser(userId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/users/${userId}/activate`, {
      method: 'PATCH',
    })
  }

  async deleteUser(userId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async bulkUserOperation(action: string, userIds: string[], reason?: string): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, userIds, reason }),
    })
  }

  async getUserAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/users/analytics?${queryString}`)
  }

  // ==================== HARVEST MANAGEMENT ====================

  async getAllHarvests(params: any = {}): Promise<AdminApiResponse<{ harvests: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/harvests?${queryString}`)
  }

  async getHarvestById(harvestId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/harvests/${harvestId}`)
  }

  async approveHarvest(harvestId: string, notes?: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/harvests/${harvestId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectHarvest(harvestId: string, reason: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/harvests/${harvestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async bulkHarvestApproval(harvestIds: string[], action: 'approve' | 'reject', reason?: string): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/harvests/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ harvestIds, action, reason }),
    })
  }

  async getHarvestAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/harvests/analytics?${queryString}`)
  }

  // ==================== PARTNER MANAGEMENT ====================

  async getAllPartners(params: any = {}): Promise<AdminApiResponse<{ partners: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/partners?${queryString}`)
  }

  async getPartnerById(partnerId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/partners/${partnerId}`)
  }

  async approvePartner(partnerId: string, notes?: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/partners/${partnerId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectPartner(partnerId: string, reason: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/partners/${partnerId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async updatePartner(partnerId: string, data: any): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/partners/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePartner(partnerId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/partners/${partnerId}`, {
      method: 'DELETE',
    })
  }

  async getPartnerAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/partners/analytics?${queryString}`)
  }

  // ==================== MARKETPLACE MANAGEMENT ====================

  async getAllListings(params: any = {}): Promise<AdminApiResponse<{ listings: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/marketplace/listings?${queryString}`)
  }

  async getListingById(listingId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`)
  }

  async updateListing(listingId: string, data: any): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteListing(listingId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/marketplace/listings/${listingId}`, {
      method: 'DELETE',
    })
  }

  async getAllOrders(params: any = {}): Promise<AdminApiResponse<{ orders: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/marketplace/orders?${queryString}`)
  }

  async getOrderById(orderId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/marketplace/orders/${orderId}`)
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/marketplace/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    })
  }

  async getMarketplaceAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/marketplace/analytics?${queryString}`)
  }

  // ==================== FINANCIAL MANAGEMENT ====================

  async getFinancialOverview(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/financial/overview')
  }

  async getAllCommissions(params: any = {}): Promise<AdminApiResponse<{ commissions: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/financial/commissions?${queryString}`)
  }

  async processCommissionPayout(commissionId: string, payoutData: any): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/financial/commissions/${commissionId}/payout`, {
      method: 'POST',
      body: JSON.stringify(payoutData),
    })
  }

  async getAllPayments(params: any = {}): Promise<AdminApiResponse<{ payments: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/financial/payments?${queryString}`)
  }

  async getFinancialAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/financial/analytics?${queryString}`)
  }

  async generateFinancialReport(reportData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/financial/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getSystemAnalytics(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/analytics/system')
  }

  async getBusinessIntelligence(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/analytics/business')
  }


  async generateCustomReport(reportData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/analytics/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }

  async exportAnalyticsData(filters: any, format: string = 'csv'): Promise<Blob> {
    const queryString = new URLSearchParams({ ...filters, format }).toString()
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

  async getSystemHealth(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/health')
  }

  async getSystemMetrics(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/metrics')
  }

  async updateSystemConfig(configData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    })
  }

  async getSystemLogs(params: any = {}): Promise<AdminApiResponse<{ logs: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/system/logs?${queryString}`)
  }

  async triggerSystemMaintenance(maintenanceData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    })
  }

  async getBackupStatus(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/backup')
  }

  async triggerManualBackup(backupData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/system/backup', {
      method: 'POST',
      body: JSON.stringify(backupData),
    })
  }

  // ==================== CONTENT MODERATION ====================

  async getPendingContent(params: any = {}): Promise<AdminApiResponse<{ content: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/moderation/pending?${queryString}`)
  }

  async approveContent(contentId: string, notes?: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/moderation/${contentId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectContent(contentId: string, reason: string): Promise<AdminApiResponse<any>> {
    return this.request(`/api/admin/moderation/${contentId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async getModerationAnalytics(filters: any = {}): Promise<AdminApiResponse<any>> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request(`/api/admin/moderation/analytics?${queryString}`)
  }

  // ==================== SECURITY & COMPLIANCE ====================

  async getSecurityAlerts(params: any = {}): Promise<AdminApiResponse<{ alerts: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/security/alerts?${queryString}`)
  }

  async getFraudReports(params: any = {}): Promise<AdminApiResponse<{ reports: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/security/fraud?${queryString}`)
  }

  async updateSecuritySettings(securityData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/security/settings', {
      method: 'PUT',
      body: JSON.stringify(securityData),
    })
  }

  async getComplianceReport(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/security/compliance')
  }

  // ==================== ADMIN PROFILE & PERMISSIONS ====================

  async getAdminProfile(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/profile')
  }

  async updateAdminProfile(profileData: any): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }

  async getAdminPermissions(): Promise<AdminApiResponse<any>> {
    return this.request('/api/admin/permissions')
  }

  async getAdminActivityLog(params: any = {}): Promise<AdminApiResponse<{ activities: any[], total: number, page: number, limit: number }>> {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/admin/activity-log?${queryString}`)
  }
}

export const adminApiService = new AdminApiService()
