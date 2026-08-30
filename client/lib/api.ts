import { APP_CONFIG } from "./constants"
import {
  clearAuthTokens,
  getRefreshTokenFromStorage,
  getTokenFromStorage,
  setRefreshTokenInStorage,
} from "./auth-storage"
import type { ApiResponse, User, Harvest, Listing, Order, WeatherData, DashboardStats } from "./types"

type JsonRecord = Record<string, unknown>
type QueryParams = Record<string, unknown>

function toQueryString(params?: QueryParams): string {
  if (!params) return ""
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value))
    }
  }
  return search.toString()
}

interface UploadImageResponse {
  urls?: string[]
  data?: { urls?: string[] }
}

type UploadImageApiResponse = ApiResponse<UploadImageResponse> & UploadImageResponse

class ApiService {
  private baseUrl: string
  private token: string | null = null
  private isRefreshing: boolean = false

  constructor() {
    // In the browser during local dev, use same-origin /api rewrites to avoid CORS on alternate ports.
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      this.baseUrl = ""
    } else {
      this.baseUrl = APP_CONFIG.api.baseUrl
    }
    this.loadTokenFromStorage()
  }

  private safeStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      // Handle circular references
      const seen = new WeakSet()
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]'
          }
          seen.add(value)
        }
        return value
      }, 2)
    }
  }

  private loadTokenFromStorage() {
    if (typeof window !== "undefined") {
      this.token = getTokenFromStorage()
    }
  }

  // Public method to get base URL
  getBaseUrl(): string {
    return this.baseUrl
  }

  // Public method to manually set token
  setToken(token: string | null) {
    this.token = token
  }

  // Public method to get current token
  getToken() {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false, retryCount: number = 0): Promise<ApiResponse<T>> {
    // Load token from storage before each request to ensure it's up to date
    // Skip for auth endpoints and refresh-related calls to prevent infinite loops
    if (!endpoint.includes('/auth/') && !endpoint.includes('refresh')) {
      this.loadTokenFromStorage()
    }

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Making request to: ${endpoint}`, {
        method: options.method || 'GET',
        hasToken: !!this.token
      })
    }

    // Add cache buster for non-GET requests to prevent caching issues
    // Automatically prepend /api to all endpoints (except auth endpoints that already have it)
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`
    let url = `${this.baseUrl}${apiEndpoint}`

    if (options.method && options.method !== 'GET') {
      const separator = endpoint.includes('?') ? '&' : '?'
      url += `${separator}_t=${Date.now()}`
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    // Normalize incoming headers into a plain record
    if (options.headers) {
      if (Array.isArray(options.headers)) {
        for (const [k, v] of options.headers as Iterable<[string, string]>) headers[k] = String(v)
      } else if (options.headers instanceof Headers) {
        (options.headers as Headers).forEach((v, k) => (headers[k] = v))
      } else {
        Object.assign(headers, options.headers as Record<string, string>)
      }
    }

    // Public GET-only paths — never strip auth from mutations (POST/PUT/PATCH/DELETE).
    const method = (options.method || 'GET').toUpperCase()
    const pathOnly = (endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`).split('?')[0]
    const isPublicEndpoint =
      method === 'GET' &&
      (pathOnly.startsWith('/api/verify') ||
        pathOnly === '/api/marketplace/listings' ||
        /^\/api\/marketplace\/listings\/[^/]+$/.test(pathOnly))

    // Always send Authorization for non-public endpoints when a token exists
    if (!isPublicEndpoint) {
      if (this.token && this.token !== 'undefined') {
        headers["Authorization"] = `Bearer ${this.token}`
      } else {
        // Try to load token from storage
        this.loadTokenFromStorage()
        if (this.token && this.token !== 'undefined') {
          headers["Authorization"] = `Bearer ${this.token}`
        }
      }
    }

    // If sending FormData, let the browser set the correct multipart boundary
    if (options.body instanceof FormData) {
      delete (headers as Record<string, string>)["Content-Type"]
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch(url, {
        ...options,
        headers,
        mode: "cors",
        credentials: "include",
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()

          // Handle empty response objects
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            data = { message: "Empty response from server" }
          }
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError)
          const text = await response.text()
          data = { message: text || "Invalid JSON response" }
        }
      } else {
        const text = await response.text()
        data = { message: text || "Unknown error" }
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token (only for protected endpoints)
        if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login' && !isPublicEndpoint) {
          console.log('🔄 401 Error on protected endpoint:', endpoint, 'attempting refresh...')

          const refreshSuccess = await this.refreshTokenIfNeeded()
          if (refreshSuccess) {
            console.log('✅ Token refreshed successfully, retrying request...')
            // Retry the original request with new token
            const retryResult = await this.request<T>(endpoint, options, true)
            return retryResult
          } else {
            console.log('❌ Token refresh failed for endpoint:', endpoint)
            // Clear all auth data
            this.clearToken()

            // Redirect to login for protected endpoints
            if (typeof window !== 'undefined') {
              console.log('🚨 REDIRECTING TO LOGIN for protected endpoint:', endpoint)
              // Import useAuthStore dynamically to avoid circular dependency
              import('./auth').then(({ useAuthStore }) => {
                useAuthStore.getState().logout()
              })
              // Redirect to login page
              window.location.href = '/login'
            }
          }
        }

        let errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`

        // Include validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += `\nValidation errors: ${data.errors.join(', ')}`
        }

        // Add more detailed error information for debugging (only for non-retry requests)
        if (!isRetry) {
          console.error(`API Error [${endpoint}]:`, {
            status: response.status,
            statusText: response.statusText,
            data: data,
            errorType: data?.errorType || 'Unknown',
            errorDetails: data?.errorDetails || 'No details provided'
          })
        }

        if (response.status === 0 || !response.status) {
          errorMessage =
            "Network error: Unable to connect to server. Please ensure the backend server is running on " + this.baseUrl
        } else if (response.status >= 500) {
          errorMessage = "Server error: " + errorMessage
        } else if (response.status === 404) {
          errorMessage = "Endpoint not found: " + endpoint
        } else if (response.status === 401) {
          errorMessage = "Authentication error: " + (data.message || "Please log in again")
        } else if (response.status === 403) {
          errorMessage = "Authorization error: " + (data.message || "Access denied")
        }

        const err = new Error(errorMessage) as Error & { status?: number; payload?: string; endpoint?: string }
        err.status = response.status
        err.payload = this.safeStringify(data)
        err.endpoint = endpoint
        throw err
      }

      if (process.env.NODE_ENV === 'development') {
        console.log("[API] Request successful:", { endpoint, status: response.status })
      }
      return data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[API] Request failed:", { endpoint, error: (error as Error).message })
      }

      // Handle timeout/abort errors with retry logic
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Retry up to 2 times for timeout errors
          if (retryCount < 2 && !isRetry) {
            console.log(`[API] Retrying request due to timeout (attempt ${retryCount + 1})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
            return this.request<T>(endpoint, options, true, retryCount + 1)
          }
          throw new Error('Request timeout: The server took too long to respond. Please try again.')
        }

        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            `Network error: Unable to connect to ${this.baseUrl}. Please ensure the backend server is running.`,
          )
        }
      }

      throw error
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      clearAuthTokens()
    }
  }

  // Check if token exists and is valid
  hasValidToken(): boolean {
    if (!this.token || this.token === 'undefined') {
      if (typeof window !== "undefined") {
        this.token = getTokenFromStorage()
      }
    }
    return !!(this.token && this.token !== 'undefined')
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== "undefined" ?
        getRefreshTokenFromStorage() : null

      if (!refreshToken) {
        console.log('❌ No refresh token available')
        return false
      }

      if (this.isRefreshing) {
        console.log('⏳ Token refresh already in progress, waiting...')
        // Wait for current refresh to complete
        while (this.isRefreshing) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return this.hasValidToken()
      }

      this.isRefreshing = true
      console.log('🔄 Starting token refresh...')

      // Use the async refreshToken method directly to avoid recursion through request()
      const response = await this.refreshToken(refreshToken)

      this.isRefreshing = false

      const envelope = (response || {}) as Record<string, unknown>
      const data = (envelope.data || envelope) as Record<string, unknown>
      const newAccessToken = (data.accessToken || data.token || envelope.accessToken || envelope.token) as string | undefined
      const newRefreshToken = (data.refreshToken || envelope.refreshToken) as string | undefined

      if (newAccessToken) {
        console.log('✅ New access token received')
        this.setToken(newAccessToken)

        // Update auth store if available
        if (typeof window !== "undefined") {
          try {
            const { useAuthStore } = await import('./auth')
            const authStore = useAuthStore.getState()
            authStore.setToken(newAccessToken)
            if (newRefreshToken) {
              authStore.refreshToken = newRefreshToken
              setRefreshTokenInStorage(newRefreshToken)
            }
          } catch (error) {
            console.warn('Could not update auth store:', error)
          }
        }

        return true
      }
      console.log('❌ No new access token in refresh response')
      return false
    } catch (error: unknown) {
      console.error('❌ Token refresh failed:', error)
      this.isRefreshing = false
      this.clearToken()
      return false
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{ user: User; token: string; refreshToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: {
    name: string
    email: string
    phone: string
    password: string
    role: string
    location?: string
  }) {
    console.log("[API] Register request to:", `${this.baseUrl}/api/auth/register`)
    console.log("[API] Register data:", userData)

    return this.request<{
      status: string
      message: string
      requiresVerification: boolean
      user: User
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async refreshToken(refreshToken: string) {
    // Prevent concurrent refresh calls
    if (this.isRefreshing) {
      // Wait for current refresh to complete
      while (this.isRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return { success: true, message: 'Refresh completed by another call' }
    }

    this.isRefreshing = true

    try {
      const response = await this.request<{ token: string; refreshToken: string }>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      })

      return response
    } finally {
      this.isRefreshing = false
    }
  }

  async logout() {
    try {
      return await this.request<{ success: boolean; message: string }>("/api/auth/logout", {
        method: "POST",
      })
    } catch {
      // Ignore network errors here; we'll still clear local state
      return { success: true, message: "Logged out" } as ApiResponse<JsonRecord>
    }
  }

  // Email verification helpers
  async verifyEmail(email: string, code: string) {
    return this.request<{ message: string; user: User }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  // Password reset helpers
  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    })
  }

  // User Management
  async getProfile() {
    return this.request<User>("/api/users/profile/me")
  }

  async updateProfile(userData: Partial<User>) {
    return this.request<User>("/api/users/profile/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // User Preferences
  async getPreferences() {
    return this.request<{ notifications: Record<string, boolean> }>("/api/users/preferences/me")
  }
  
  async updatePreferences(notifications: Record<string, boolean>) {
    return this.request<{ message: string }>("/api/users/preferences/me", {
      method: "PUT",
      body: JSON.stringify({ notifications }),
    })
  }

  // User Settings
  async getSettings() {
    return this.request<{ settings: JsonRecord }>("/api/users/settings/me")
  }

  async updateSettings(settings: { security?: JsonRecord; display?: JsonRecord; performance?: JsonRecord }) {
    return this.request<{ message: string }>("/api/users/settings/me", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Password
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/api/users/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async getDashboard() {
    return this.request<DashboardStats>("/users/dashboard")
  }

  async getRecentActivities(limit?: number) {
    console.log('🔍 Calling getRecentActivities API endpoint');
    try {
      const params = limit ? `?limit=${limit}` : ''
      const result = await this.request("/users/recent-activities" + params)
      console.log('✅ getRecentActivities response:', result);
      return result;
    } catch (error) {
      console.error('❌ getRecentActivities error:', error);
      throw error;
    }
  }

  async getDashboardMetrics() {
    return this.request("/analytics/dashboard")
  }

  // Admin-specific methods
  async getAdminDashboard() {
    return this.request("/api/admin/dashboard")
  }

  async getAdminProfile() {
    console.log('🚀 API: Calling getAdminProfile endpoint')
    try {
      const result = this.request("/api/admin/profile")
      console.log('🚀 API: getAdminProfile request initiated')
      return result
    } catch (error) {
      console.error('🚀 API: getAdminProfile failed:', error)
      throw error
    }
  }

  async updateAdminProfile(data: object) {
    return this.request("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getAdminSettings() {
    return this.request('/api/admin/settings')
  }

  async updateAdminSettings(settings: object) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getAdminNotificationSettings() {
    return this.request('/api/admin/settings/notifications')
  }

  async updateAdminNotificationSettings(settings: object) {
    return this.request('/api/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getAdminSecuritySettings() {
    return this.request('/api/admin/settings/security')
  }

  async updateAdminSecuritySettings(settings: object) {
    return this.request('/api/admin/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async changeAdminPassword(currentPassword: string, newPassword: string) {
    return this.request('/api/admin/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async getAdminSystemHealth() {
    return this.request("/api/admin/system/health")
  }

  async getAdminSystemMetrics() {
    return this.request("/api/admin/system/metrics")
  }

  async getAdminRecentUsers(limit = 5) {
    return this.request(`/api/admin/users/recent?limit=${limit}`)
  }

  async getAdminUsers(params?: QueryParams) {
    const queryString = params ? `?${toQueryString(params)}` : ''
    return this.request(`/api/admin/users${queryString}`)
  }

  async getAdminUserById(id: string) {
    return this.request(`/api/admin/users/${id}`)
  }

  async updateAdminUser(id: string, data: object) {
    return this.request(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteAdminUser(id: string) {
    return this.request(`/api/admin/users/${id}`, {
      method: "DELETE",
    })
  }

  async activateAdminUser(id: string) {
    return this.request(`/api/admin/users/${id}/activate`, {
      method: "POST",
    })
  }

  async suspendAdminUser(id: string) {
    return this.request(`/api/admin/users/${id}/suspend`, {
      method: "POST",
    })
  }

  async verifyAdminUser(id: string) {
    return this.request(`/api/admin/users/${id}/verify`, {
      method: "POST",
    })
  }

  async resetAdminUserPassword(id: string, newPassword: string) {
    return this.request(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    })
  }

  // Admin Analytics
  async getAdminAnalyticsOverview(period = '30d') {
    return this.request(`/api/admin/analytics/overview?period=${period}`)
  }

  async getAdminAnalyticsUsers(period = '30d') {
    return this.request(`/api/admin/analytics/users?period=${period}`)
  }

  async getAdminAnalyticsRegional(period = '30d') {
    return this.request(`/api/admin/analytics/regional?period=${period}`)
  }

  async getAdminAnalyticsQuality(period = '30d') {
    return this.request(`/api/admin/analytics/quality?period=${period}`)
  }

  async getAdminAnalyticsExport(params?: QueryParams) {
    const queryString = params ? `?${toQueryString(params)}` : ''
    return this.request(`/api/admin/analytics/export${queryString}`)
  }

  // Admin System Management
  async getAdminSystemStatus() {
    return this.request('/api/admin/system/status')
  }

  async getAdminSystemLogs(params?: QueryParams) {
    const queryString = params ? `?${toQueryString(params)}` : ''
    return this.request(`/api/admin/system/logs${queryString}`)
  }

  async getAdminSystemConfig() {
    return this.request('/api/admin/system/config')
  }

  async updateAdminSystemConfig(section: string, settings: object) {
    return this.request('/api/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify({ section, settings })
    })
  }

  async toggleMaintenanceMode(enabled: boolean, message?: string) {
    return this.request('/api/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled, message })
    })
  }

  async createSystemBackup(type: string = 'full', description?: string) {
    return this.request('/api/admin/system/backup', {
      method: 'POST',
      body: JSON.stringify({ type, description })
    })
  }

  async getSystemBackups() {
    return this.request('/api/admin/system/backups')
  }

  async restoreSystemBackup(backupId: string, collections?: string[]) {
    return this.request('/api/admin/system/restore', {
      method: 'POST',
      body: JSON.stringify({ backupId, collections })
    })
  }

  // Harvest Management
  async getHarvests(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request<Harvest[]>(`/api/harvests?${params}`)
  }

  async getHarvestAnalytics(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    const url = `/api/harvests/analytics?${params}`

    try {
      const response = await this.request(url)
      return response
    } catch (error) {
      throw error
    }
  }

  async getHarvestStats() {
    try {
      const response = await this.request('/api/harvests/stats')
      return response
    } catch (error) {
      throw error
    }
  }

  async createHarvest(harvestData: Partial<Harvest>, options?: { idempotencyKey?: string }) {
    const headers: Record<string, string> = {}
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey.slice(0, 128)
    }
    return this.request<Harvest>("/api/harvests", {
      method: "POST",
      headers,
      body: JSON.stringify(harvestData),
    })
  }

  async getHarvestById(id: string) {
    return this.request<Harvest>(`/api/harvests/id/${id}`)
  }

  async updateHarvest(id: string, harvestData: Partial<Harvest>) {
    return this.request<Harvest>(`/api/harvests/${id}`, {
      method: "PUT",
      body: JSON.stringify(harvestData),
    })
  }

  async getHarvestProvenance(batchId: string) {
    return this.request<Harvest>(`/api/harvests/provenance/${batchId}`)
  }

  async verifyHarvest(batchId: string) {
    return this.request<Harvest>(`/api/harvests/verification/${batchId}`)
  }

  // Marketplace
  async getListings(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request<Listing[]>(`/api/marketplace/listings?${params}`)
  }

  async getListing(id: string) {
    return this.request<Listing>(`/api/marketplace/listings/${id}`)
  }

  async getListingForEdit(id: string) {
    return this.request<Listing>(`/api/marketplace/listings/${id}`)
  }

  async updateListing(id: string, listingData: Partial<Listing>) {
    return this.request<Listing>(`/api/marketplace/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(listingData),
    })
  }

  async createListing(listingData: Partial<Listing>) {
    return this.request<Listing>("/api/marketplace/listings", {
      method: "POST",
      body: JSON.stringify(listingData),
    })
  }

  async createOrder(orderData: Partial<Order>, options?: { idempotencyKey?: string }) {
    const idempotencyKey =
      options?.idempotencyKey ||
      (orderData as { idempotencyKey?: string }).idempotencyKey ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined)

    const headers: Record<string, string> = {}
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey.slice(0, 128)
    }

    const { idempotencyKey: _ignored, ...payload } = orderData as Partial<Order> & {
      idempotencyKey?: string
    }

    return this.request<Order>("/api/marketplace/orders", {
      method: "POST",
      body: JSON.stringify(
        idempotencyKey ? { ...payload, idempotencyKey } : payload
      ),
      headers,
    })
  }

  async downloadOrderReceipt(orderId: string) {
    return this.request(`/api/marketplace/orders/${orderId}/receipt`, {
      method: "GET",
    })
  }

  async cancelOrder(orderId: string) {
    return this.request(`/api/marketplace/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: 'cancelled' }),
    })
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/api/marketplace/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  async getOrders(userId?: string) {
    const endpoint = userId ? `/api/marketplace/orders/buyer/${userId}` : "/api/marketplace/orders"
    return this.request<Order[]>(endpoint)
  }

  async getOrder(id: string) {
    return this.request<Order>(`/api/marketplace/orders/${id}`)
  }

  async getMarketplaceAnalytics(params?: string, userId?: string) {
    const endpoint = userId ? `/api/analytics/farmers/${userId}` : '/api/analytics/marketplace'
    const url = params ? `${endpoint}${params}` : endpoint
    return this.request(url)
  }

  async getMarketplaceStats() {
    return this.request('/api/analytics/marketplace')
  }

  async updateListingStatus(id: string, status: string, data?: JsonRecord) {
    return this.request(`/api/marketplace/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...data })
    })
  }

  async unpublishListing(id: string) {
    return this.request(`/api/marketplace/listings/${id}/unpublish`, {
      method: 'PATCH'
    })
  }

  // Review Management
  async getListingReviews(listingId: string, params?: Record<string, unknown>) {
    const queryString = toQueryString(params)
    return this.request(`/api/reviews/listings/${listingId}?${queryString}`)
  }

  async createReview(listingId: string, reviewData: {
    rating: number
    comment?: string
    images?: string[]
    orderId?: string
  }) {
    return this.request(`/api/reviews/listings/${listingId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    })
  }

  async updateReview(reviewId: string, reviewData: {
    rating?: number
    comment?: string
    images?: string[]
  }) {
    return this.request(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    })
  }

  async deleteReview(reviewId: string) {
    return this.request(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    })
  }

  async respondToReview(reviewId: string, response: string) {
    return this.request(`/api/reviews/${reviewId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ comment: response })
    })
  }

  async getFarmerReviews(params?: Record<string, unknown>) {
    const queryString = toQueryString(params)
    return this.request(`/api/reviews/farmer?${queryString}`)
  }



  // Harvest approval → create listing from harvest (farmer only)
  async createListingFromHarvest(
    harvestId: string,
    price: number,
    description?: string,
    quantity?: number,
    unit?: string,
    images?: string[]
  ) {
    return this.request(`/api/harvest-approval/${harvestId}/create-listing`, {
      method: "POST",
      body: JSON.stringify({ price, description, quantity, unit, images }),
    })
  }

  // Weather
  async getCurrentWeather(params?: { lat: number; lng: number; city: string; state: string; country: string }) {
    // Use coordinates as location identifier
    const location = params ? `${params.lat},${params.lng}` : 'default'
    let query = ""
    if (params) {
      const qs = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        city: params.city,
        state: params.state,
        country: params.country,
      })
      query = `?${qs.toString()}`
    }
    return this.request<WeatherData>(`/api/weather/current/${location}${query}`)
  }

  async getWeatherForecast(params?: { lat: number; lng: number; city: string; state: string; country: string; days?: number }) {
    // Use coordinates as location identifier
    const location = params ? `${params.lat},${params.lng}` : 'default'
    let query = ""
    if (params) {
      const qs = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        city: params.city,
        state: params.state,
        country: params.country,
        ...(params.days ? { days: String(params.days) } : {}),
      })
      query = `?${qs.toString()}`
    }
    return this.request<WeatherData>(`/api/weather/forecast/${location}${query}`)
  }

  async getAgriculturalInsights(params?: { lat: number; lng: number; city: string; state: string; country: string }) {
    let query = ""
    if (params) {
      const qs = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        city: params.city,
        state: params.state,
        country: params.country,
      })
      query = `?${qs.toString()}`
    }
    return this.request<WeatherData>(`/api/weather/agricultural-insights${query}`)
  }

  async getIPLocation() {
    return this.request<{
      lat: number
      lng: number
      city?: string
      state?: string
      country?: string
    }>('/api/weather/ip-location')
  }

  async reverseGeocode(lat: number, lng: number) {
    return this.request<{
      city?: string
      state?: string
      country?: string
    }>(`/api/weather/reverse-geocode?lat=${lat}&lng=${lng}`)
  }

  // Analytics
  async getAnalytics(type: string, filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request(`/api/analytics/${type}?${params}`)
  }

  // File Upload
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append("images", file)
    const token = getTokenFromStorage()
    const res = await this.request<UploadImageResponse>("/api/marketplace/upload-image", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      } as Record<string, string>,
    }) as UploadImageApiResponse
    // Backend returns top-level `urls`; also accept nested `data.urls` for safety.
    const urls: string[] = res.urls || res.data?.urls || []
    if (!urls[0]) {
      throw new Error("Upload succeeded but no image URL was returned")
    }
    return { url: urls[0] }
  }

  async uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach((f) => formData.append("images", f))
    const token = getTokenFromStorage()
    const res = await this.request<UploadImageResponse>("/api/marketplace/upload-image", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      } as Record<string, string>,
    }) as UploadImageApiResponse
    // Backend returns top-level `urls`; also accept nested `data.urls` for safety.
    const urls: string[] = res.urls || res.data?.urls || []
    if (urls.length === 0) {
      throw new Error("Upload succeeded but no image URLs were returned")
    }
    return urls
  }

  // Avatar Upload
  async uploadAvatar(formData: FormData, isAdmin: boolean = false, signal?: AbortSignal) {
    const token = getTokenFromStorage()
    const endpoint = isAdmin ? '/api/admin/profile/avatar' : '/api/users/profile/avatar'

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData,
        signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server')
      }
      throw error
    }
  }

  // Fintech - Credit Score and Loans
  async getMyCreditScore() {
    return this.request(`/api/fintech/credit-score/me`);
  }

  async getLoanApplications(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request(`/api/fintech/loan-applications?${params}`)
  }

  async getLoanApplication(id: string) {
    return this.request(`/api/fintech/loan-applications/${id}`)
  }

  async createLoanApplication(data: {
    amount: number
    purpose: string
    term: number
    description?: string
    interestRate?: number
    collateral?: string
    collateralValue?: number
    monthlyIncome?: number
    existingLoans?: number
    documents?: string[]
    farmerId?: string
  }) {
    return this.request(`/api/fintech/loan-applications`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async acceptLoanApplication(id: string) {
    return this.request(`/api/fintech/loan-applications/${id}/accept`, {
      method: "POST",
    })
  }

  async recordLoanPayment(id: string) {
    return this.request(`/api/fintech/loan-applications/${id}/payments`, {
      method: "POST",
    })
  }

  async initializeLoanPayment(loanApplicationId: string, callbackUrl?: string) {
    return this.request(`/api/payments/loan/initialize`, {
      method: "POST",
      body: JSON.stringify({ loanApplicationId, callbackUrl }),
    })
  }

  async getFinancialDashboard() {
    return this.request('/api/fintech/dashboard');
  }

  async getFinancialGoals() {
    return this.request('/api/fintech/financial-goals/me');
  }

  async createFinancialGoal(data: {
    title: string;
    description?: string;
    type: string;
    targetAmount: number;
    targetDate: string;
    priority?: string;
  }) {
    return this.request('/api/fintech/financial-goals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateFinancialGoal(id: string, data: Partial<{
    title: string;
    description: string;
    type: string;
    targetAmount: number;
    targetDate: string;
    priority: string;
    category: string;
    currentAmount: number;
    status: string;
  }>) {
    return this.request(`/api/fintech/financial-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteFinancialGoal(id: string) {
    return this.request(`/api/fintech/financial-goals/${id}`, {
      method: 'DELETE'
    });
  }



  async getInsurancePolicies() {
    return this.request('/api/fintech/insurance-policies/me');
  }

  async getInsuranceQuotes(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request(`/api/fintech/insurance-quotes?${params}`);
  }

  async getInsuranceClaims(filters?: Record<string, unknown>) {
    const params = toQueryString(filters)
    return this.request(`/api/fintech/insurance-claims?${params}`);
  }

  async createInsuranceClaim(data: {
    policyId?: string;
    policyNumber?: string;
    claimType: string;
    description: string;
    incidentDate: string;
    estimatedLoss: number;
    location?: string;
    weatherConditions?: string;
    documents?: Array<{ name: string; url: string; type: string }>;
  }) {
    return this.request('/api/fintech/insurance-claims', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getInsuranceClaim(id: string) {
    return this.request(`/api/fintech/insurance-claims/${id}`);
  }

  async updateInsuranceClaim(id: string, data: Partial<{
    status: string;
    adjusterNotes: string;
    claimAmount: number;
    paidAmount: number;
    decisionDate: string;
  }>) {
    return this.request(`/api/fintech/insurance-claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getFinancialHealth() {
    return this.request('/api/fintech/financial-health/me');
  }

  async getMyProfile() {
    return this.request('/api/users/profile/me');
  }

  async updateMyProfile(data: object) {
    return this.request('/api/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Partner-specific profile methods
  async getPartnerProfile() {
    return this.request('/api/users/profile/me');
  }

  async updatePartnerProfile(data: object) {
    return this.request('/api/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Farmer-specific profile methods  
  async getFarmerProfile() {
    return this.request('/api/farmers/profile/me');
  }

  async updateFarmerProfile(data: object) {
    return this.request('/api/farmers/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getMyPreferences() {
    return this.request('/api/users/preferences/me');
  }

  async updateMyPreferences(data: { notifications: Record<string, boolean> }) {
    return this.request('/api/users/preferences/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getMySettings() {
    return this.request('/api/users/settings/me');
  }

  async updateMySettings(data: object) {
    return this.request('/api/users/settings/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteHarvest(harvestId: string) {
    return this.request(`/api/harvests/${harvestId}`, { method: "DELETE" })
  }

  async exportHarvests(filters?: Record<string, unknown>) {
    const format = (filters || {}).format || 'csv'
    const exportService = (await import('./export-utils')).getExportService()
    return exportService.exportHarvests({
      format: format as 'csv' | 'excel' | 'pdf',
      filters: { ...(filters || {}) },
    })
  }



  async getMarketplaceListings(params: QueryParams = {}) {
    const queryString = toQueryString(params)
    return this.request(`/api/marketplace/listings?${queryString}`)
  }

  async getBuyerActivity() {
    return this.request('/api/marketplace/buyer-activity')
  }

  async getTopBuyers(limit?: number) {
    const query = limit ? `?limit=${limit}` : ''
    return this.request(`/api/marketplace/top-buyers${query}`)
  }

  async getProductDetails(productId: string) {
    return this.request(`/api/marketplace/listings/${productId}`)
  }

  async addToFavorites(listingId: string, notes?: string) {
    return this.request('/api/marketplace/favorites', {
      method: 'POST',
      body: JSON.stringify({ listingId, notes }),
    })
  }

  async getFavorites(userId?: string, params: QueryParams = {}) {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      const queryString = toQueryString(params)
      return this.request(`/api/marketplace/favorites/${userId}?${queryString}`)
    } else {
      // Fallback: get favorites for current authenticated user
      const queryString = toQueryString(params)
      return this.request(`/api/marketplace/favorites/current?${queryString}`)
    }
  }

  async removeFromFavorites(userId: string, listingId: string) {
    return this.request(`/api/marketplace/favorites/${userId}/${listingId}`, {
      method: 'DELETE',
    })
  }

  // Cart quantity management
  async reserveCartQuantity(items: Array<{ listingId: string; quantity: number }>) {
    return this.request('/api/marketplace/cart/reserve', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  }

  async releaseCartQuantity(items: Array<{ listingId: string; quantity: number }>) {
    return this.request('/api/marketplace/cart/release', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  }

  async updateCartItemQuantity(listingId: string, oldQuantity: number, newQuantity: number) {
    return this.request('/api/marketplace/cart/item-quantity', {
      method: 'PATCH',
      body: JSON.stringify({ listingId, oldQuantity, newQuantity }),
    })
  }

  async cleanupSoldOutProducts() {
    return this.request('/api/marketplace/cleanup-sold-out', {
      method: 'POST',
    })
  }

  async getBuyerOrders(buyerId: string, params: QueryParams = {}) {
    const queryString = toQueryString(params)
    return this.request(`/api/marketplace/orders/buyer/${buyerId}?${queryString}`)
  }



  async initializePayment(paymentData: object) {
    return this.request('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  async verifyPayment(reference: string, options?: { testMode?: boolean }) {
    const query = options?.testMode ? '?test_mode=true' : ''
    return this.request(`/api/payments/verify/${reference}${query}`)
  }

  async syncOrderStatus(orderId: string) {
    return this.request(`/api/payments/sync/${orderId}`, {
      method: 'POST'
    })
  }

  async getTransactionHistory(params: QueryParams = {}) {
    const queryString = toQueryString(params)
    return this.request(`/api/payments/transactions?${queryString}`)
  }

  // Payment Methods Management
  async getPaymentMethods() {
    return this.request('/api/payments/methods')
  }

  async addPaymentMethod(data: { type: string; details: JsonRecord }) {
    return this.request('/api/payments/methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePaymentMethod(id: string, data: object) {
    return this.request(`/api/payments/methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePaymentMethod(id: string) {
    return this.request(`/api/payments/methods/${id}`, {
      method: 'DELETE',
    })
  }

  async setDefaultPaymentMethod(id: string) {
    return this.request(`/api/payments/methods/${id}/default`, {
      method: 'PATCH',
    })
  }

  async getShipmentDetails(shipmentId: string) {
    return this.request(`/api/shipments/${shipmentId}`)
  }

  /** Set or clear `assignedLogisticsUser` on a shipment (admin / eligible partner). Pass null/empty to unassign. */
  async assignShipmentLogistics(shipmentId: string, assignedLogisticsUser: string | null) {
    return this.request(`/api/shipments/${shipmentId}/assigned-logistics`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedLogisticsUser: assignedLogisticsUser ?? '' }),
    })
  }

  async reportShipmentIssue(shipmentId: string, issueData: object) {
    return this.request(`/api/shipments/${shipmentId}/issues`, {
      method: 'POST',
      body: JSON.stringify(issueData),
    })
  }

  // Order Management
  async getBuyerAnalytics(buyerId?: string) {
    const endpoint = buyerId ? `/api/analytics/buyers/${buyerId}` : `/api/analytics/buyers/me`
    return this.request(endpoint)
  }

  async getBuyerAnalyticsWithPeriod(buyerId?: string, period: string = '30d') {
    const endpoint = buyerId ? `/api/analytics/buyers/${buyerId}` : `/api/analytics/buyers/me`
    return this.request(`${endpoint}?period=${period}`)
  }

  async searchSuggestions(q: string, limit: number = 10) {
    return this.request(`/api/marketplace/search-suggestions?q=${encodeURIComponent(q)}&limit=${limit}`)
  }

  async getUserOrders(params: QueryParams = {}) {
    const queryString = toQueryString(params)
    const url = queryString ? `/api/marketplace/orders?${queryString}` : '/api/marketplace/orders'
    return this.request(url)
  }



  async getWeatherData(params?: QueryParams) {
    const queryString = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request(`/api/weather${queryString ? '?' + queryString : ''}`)
  }

  async getHealthCheck() {
    return this.request('/api/health')
  }

  async getSupportedFormats() {
    return this.request('/api/export-import/formats')
  }

  async getNotificationPreferences() {
    return this.request('/api/notifications/preferences')
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PATCH',
    })
  }

  async updatePushToken(token: string) {
    return this.request('/api/notifications/push-token', {
      method: 'PUT',
      body: JSON.stringify({ token }),
    })
  }

  async getFarmerAnalytics(farmerId?: string) {
    const endpoint = farmerId ? `/api/analytics/farmers/${farmerId}` : '/api/analytics/farmers/me'
    try {
      const result = await this.request(endpoint)
      return result
    } catch (error) {
      throw error
    }
  }

  async getFarmerCropAnalytics(farmerId?: string, period: string = '30d') {
    const endpoint = farmerId ? `/api/analytics/farmers/${farmerId}/crops` : '/api/analytics/farmers/me/crops'
    try {
      const result = await this.request(`${endpoint}?period=${period}`)
      return result
    } catch (error) {
      throw error
    }
  }

  // Farmer-specific marketplace data
  async getFarmerListings(params?: Record<string, unknown>) {
    const queryString = toQueryString(params)
    return this.request(`/api/farmers/listings?${queryString}`)
  }

  async getFarmerOrders(params?: Record<string, unknown>) {
    const queryString = toQueryString(params)
    return this.request(`/api/farmers/orders?${queryString}`)
  }

  async getFarmerDashboard() {
    return this.request('/api/users/dashboard')
  }

  // Partner Dashboard Methods
  async getPartnerDashboard() {
    return this.request<{
      totalFarmers: number
      activeFarmers: number
      pendingApprovals: number
      monthlyCommission: number
      totalCommission: number
      approvalRate: number
      recentActivity: Array<{
        type: string
        farmer?: string
        amount?: number
        timestamp: string
        description: string
      }>
    }>("/api/partners/dashboard")
  }

  async getPartnerFarmers(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const queryString = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<{
      farmers: Array<{
        _id: string
        name: string
        email: string
        phone: string
        location: string
        status: 'active' | 'inactive' | 'pending'
        joinedDate: string
        totalHarvests: number
        totalSales: number
      }>
      total: number
      page: number
      pages: number
    }>(`/partners/farmers?${queryString}`)
  }

  async getPartnerMetrics(filters?: { period?: string }) {
    console.log('🔍 Calling getPartnerMetrics API endpoint', filters);
    try {
      const queryParams = filters?.period ? `?period=${filters.period}` : '';
      const result = await this.request<{
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
        }
      }>(`/partners/metrics${queryParams}`)
      console.log('✅ getPartnerMetrics response:', result);
      return result;
    } catch (error) {
      console.error('❌ getPartnerMetrics error:', error);
      throw error;
    }
  }

  async syncPartnerFarmers() {
    return this.request("/api/referrals/sync-partners", { method: "POST" })
  }

  async getPartnerCommission() {
    console.log('🔍 Calling getPartnerCommission API endpoint');
    try {
      const result = await this.request<{
        totalEarned: number
        commissionRate: number
        pendingAmount: number
        paidAmount: number
        lastPayout?: string
        monthlyBreakdown: Array<{
          month: string
          amount: number
        }>
        summary?: {
          thisMonth: number
          lastMonth: number
          totalEarned: number
        }
      }>("/api/partners/commission")

      console.log('✅ Partner commission data fetched successfully', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch partner commission data:', error);
      throw error;
    }
  }

  async uploadPartnerCSV(file: File) {
    const formData = new FormData()
    formData.append('csvFile', file)

    return this.request<{
      totalRows: number
      successfulRows: number
      failedRows: number
      errors: Array<{
        row: number
        error: string
      }>
    }>("/api/partners/upload-csv", {
      method: "POST",
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  // Commission Management
  async getCommissions(params?: {
    page?: number
    limit?: number
    status?: string
    farmerId?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: string
  }) {
    const queryString = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<{
      commissions: Array<{
        _id: string
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
        amount: number
        rate: number
        status: 'pending' | 'approved' | 'paid' | 'cancelled'
        paidAt?: string
        notes?: string
      }>
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
        hasNextPage: boolean
        hasPrevPage: boolean
      }
    }>(`/api/commissions?${queryString}`)
  }

  // Partner-facing: requests a payout (records payout details for an admin
  // to review) — does not mark anything paid.
  async requestCommissionPayout(data: {
    commissionIds: string[]
    payoutMethod: string
    payoutDetails: JsonRecord
    notes?: string
  }) {
    return this.request('/api/commissions/payout-request', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Admin-only: actually executes the payout (marks paid + writes the ledger entry)
  async processCommissionPayout(data: {
    commissionIds: string[]
    payoutMethod: string
    payoutDetails: JsonRecord
  }) {
    return this.request('/api/commissions/payout', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getCommissionStats(params?: {
    partnerId?: string
    farmerId?: string
    startDate?: string
    endDate?: string
  }) {
    const queryString = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<{
      totalCommissions: number
      totalAmount: number
      statusBreakdown: Array<{
        _id: string
        count: number
        totalAmount: number
      }>
      monthlyBreakdown: Array<{
        _id: {
          year: number
          month: number
        }
        count: number
        totalAmount: number
      }>
      averageCommission: number
    }>(`/api/commissions/stats?${queryString}`)
  }

  async getPartnerCommissionSummary(partnerId: string) {
    return this.request<{
      summary: {
        totalCommissions: number
        pendingCommissions: number
        paidCommissions: number
        totalAmount: number
        pendingAmount: number
        paidAmount: number
      }
      recentCommissions: Array<{
        _id: string
        farmer: {
          name: string
        }
        order: {
          orderNumber: string
        }
        amount: number
        status: string
        createdAt: string
      }>
    }>(`/api/commissions/summary/${partnerId}`)
  }

  async updateCommissionStatus(id: string, data: { status: string; notes?: string }) {
    return this.request(`/api/commissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Referral Management
  async getReferrals(params?: {
    page?: number
    limit?: number
    status?: string
    farmerId?: string
    sortBy?: string
    sortOrder?: string
  }) {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return this.request<{
      docs: Array<{
        _id: string
        farmer: {
          _id: string
          name: string
          email: string
          phone: string
          region: string
        }
        status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
        referralCode: string
        commissionRate: number
        commission: number
        commissionStatus: 'pending' | 'calculated' | 'paid' | 'cancelled'
        performanceMetrics: {
          totalTransactions: number
          totalValue: number
          averageOrderValue: number
          customerRetention: number
        }
        expiresAt: string
        isRenewable: boolean
      }>
      totalDocs: number
      limit: number
      page: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }>(`/api/partners/referrals?${queryString}`)
  }

  async createReferral(data: {
    farmerId: string
    commissionRate?: number
    notes?: string
  }) {
    return this.request('/api/partners/referrals', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getReferralStats() {
    return this.request('/api/partners/referrals/stats/overview')
  }

  async getReferralPerformanceStats(period: string = 'month') {
    return this.request(`/api/referrals/stats/performance?period=${period}`)
  }

  async updateReferral(id: string, data: {
    status?: string
    commissionRate?: number
    notes?: string
  }) {
    return this.request(`/api/partners/referrals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteReferral(id: string) {
    return this.request(`/api/partners/referrals/${id}`, {
      method: 'DELETE'
    })
  }

  async getReferralById(id: string) {
    return this.request(`/api/partners/referrals/${id}`)
  }

  async searchFarmers(params: {
    search?: string
    limit?: number
    page?: number
  }) {
    const queryString = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString()
    return this.request<{
      farmers: Array<{
        _id: string
        name: string
        email: string
        phone: string
        location: string
        farmName?: string
      }>
      total: number
      page: number
      pages: number
      hasNextPage?: boolean
      hasPrevPage?: boolean
    }>(`/api/farmers/search?${queryString}`)
  }



  async getUserNotifications(params: QueryParams = {}) {
    const queryString = toQueryString(params)
    return this.request(`/api/notifications?${queryString}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request('/api/notifications/mark-read', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: [notificationId] }),
    })
  }

  async updateNotificationPreferences(preferences: object) {
    return this.request('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ notifications: preferences }),
    })
  }

  async exportOrderData(exportData: object) {
    return this.request('/api/export-import/export/orders', {
      method: 'POST',
      body: JSON.stringify(exportData),
    })
  }

  // QR Code Management
  async getQRCodes(filters?: {
    page?: number
    limit?: number
    status?: string
    cropType?: string
    search?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }
    return this.request(`/api/qr-codes?${params.toString()}`)
  }

  async generateQRCodeForHarvest(harvestId: string, customData?: Record<string, unknown>) {
    return this.request('/api/qr-codes', {
      method: 'POST',
      body: JSON.stringify({ harvestId, customData }),
    })
  }

  async getQRCodeById(id: string) {
    return this.request(`/api/qr-codes/${id}`)
  }

  async downloadQRCode(id: string) {
    const url = `${this.baseUrl}/api/qr-codes/${id}/download`
    const headers: Record<string, string> = {}

    if (this.token && this.token !== 'undefined') {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        mode: "cors",
        credentials: "include",
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        if (response.status === 404) {
          errorMessage = "QR code not found"
        } else if (response.status === 401) {
          errorMessage = "Authentication error: Please log in again"
        }

        const err = new Error(errorMessage) as Error & { status?: number; data?: JsonRecord }
        err.status = response.status
        throw err
      }

      // Return the response directly for binary data
      return response
    } catch (error) {
      throw error
    }
  }

  async revokeQRCode(id: string) {
    return this.request(`/api/qr-codes/${id}/revoke`, {
      method: 'PATCH',
    })
  }

  async deleteQRCode(id: string) {
    return this.request(`/api/qr-codes/${id}`, {
      method: 'DELETE',
    })
  }

  async getQRCodeStats() {
    return this.request('/api/qr-codes/stats')
  }

  async recordQRScan(qrCodeId: string, scanData?: {
    name?: string
    location?: string
    coordinates?: { lat: number; lng: number }
    verificationResult?: 'success' | 'failed' | 'tampered'
    notes?: string
  }) {
    return this.request('/api/qr-codes/scan', {
      method: 'POST',
      body: JSON.stringify({ qrCodeId, scanData }),
    })
  }






  async getPerformanceAnalytics(filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    const queryString = toQueryString(filters)
    return this.request<JsonRecord>(`/api/analytics/performance?${queryString}`)
  }

  async getGeographicAnalytics(filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    const queryString = toQueryString(filters)
    return this.request<JsonRecord>(`/api/analytics/geographic?${queryString}`)
  }

  async getFinancialAnalytics(filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    const queryString = toQueryString(filters)
    return this.request<JsonRecord>(`/api/analytics/financial?${queryString}`)
  }

  async getTrendAnalytics(filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    const queryString = toQueryString(filters)
    return this.request<JsonRecord>(`/api/analytics/trends?${queryString}`)
  }

  async generateAnalyticsReport(config: object): Promise<ApiResponse<JsonRecord>> {
    return this.request<JsonRecord>("/api/analytics/report", {
      method: "POST",
      body: JSON.stringify(config)
    })
  }

  async exportAnalyticsData(type: string = 'user', period: string = '30d', format: string = 'csv'): Promise<void> {
    const normalized =
      format === 'excel' || format === 'xlsx' || format === 'pdf' ? 'xlsx' : format === 'json' ? 'csv' : 'csv'
    const requestBody = {
      type,
      period,
      format: normalized,
      filename: `farmer-analytics-${period}-${new Date().toISOString().split('T')[0]}`
    }

    const response = await fetch(`${this.baseUrl}/api/analytics/report`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    // Handle file download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // Get filename from response headers or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `farmer-analytics-${period}-${new Date().toISOString().split('T')[0]}.${format}`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  async getApprovals(filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    return this.getAllHarvests(filters)
  }

  async getApprovalById(approvalId: string): Promise<ApiResponse<JsonRecord>> {
    return this.request<JsonRecord>(`/api/harvests/id/${approvalId}`)
  }

  async getPendingHarvests(filters?: QueryParams): Promise<ApiResponse<JsonRecord>> {
    const queryString = filters ? new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<JsonRecord>(`/api/harvest-approval/pending?${queryString}`)
  }

  async getAllHarvests(filters?: QueryParams): Promise<ApiResponse<JsonRecord>> {
    const queryString = filters ? new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<JsonRecord>(`/api/harvest-approval/all?${queryString}`)
  }

  async getApprovalStats(): Promise<ApiResponse<JsonRecord>> {
    return this.request<JsonRecord>('/api/harvest-approval/stats')
  }

  async approveHarvest(approvalId: string, data: { quality?: string; notes?: string; agriculturalData?: object }): Promise<ApiResponse<JsonRecord>> {
    console.log('=== API SERVICE: approveHarvest called ===')
    console.log('Approval ID:', approvalId)
    console.log('Data:', data)
    try {
      const result = await this.request<JsonRecord>(`/api/harvest-approval/${approvalId}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      console.log('=== API SERVICE: approveHarvest success ===')
      return result
    } catch (error) {
      console.log('=== API SERVICE: approveHarvest failed ===')
      console.log('Error details:', error)
      throw error
    }
  }

  async rejectHarvest(approvalId: string, data: { reason: string; notes?: string; rejectionReason?: string }): Promise<ApiResponse<JsonRecord>> {
    const rejectionReason = data.rejectionReason || data.reason
    return this.request<JsonRecord>(`/api/harvest-approval/${approvalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        rejectionReason,
        reason: rejectionReason,
        notes: data.notes
      })
    })
  }

  async markForReview(approvalId: string, data: { notes?: string }): Promise<ApiResponse<JsonRecord>> {
    return this.request<JsonRecord>(`/api/harvest-approval/${approvalId}/revision`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async bulkProcessApprovals(data: { approvalIds?: string[]; harvestIds?: string[]; action: string; notes?: string; reason?: string; rejectionReason?: string }): Promise<ApiResponse<JsonRecord>> {
    const harvestIds = data.harvestIds || data.approvalIds || []
    const rejectionReason = data.rejectionReason || data.reason
    return this.request<JsonRecord>('/api/harvest-approval/bulk-process', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        harvestIds,
        approvalIds: harvestIds,
        rejectionReason,
        reason: rejectionReason
      })
    })
  }

  async batchProcessApprovals(batchAction: {
    approvalIds?: string[]
    harvestIds?: string[]
    action: string
    notes?: string
    reason?: string
    rejectionReason?: string
  }): Promise<ApiResponse<JsonRecord>> {
    return this.bulkProcessApprovals(batchAction)
  }

  async getApprovalMetrics(_filters: QueryParams = {}): Promise<ApiResponse<JsonRecord>> {
    return this.getApprovalStats()
  }

  async getApprovalHistory(approvalId: string): Promise<ApiResponse<JsonRecord>> {
    return this.getApprovalById(approvalId)
  }

  async exportApprovals(filters: QueryParams, format: string = 'csv'): Promise<Blob> {
    const queryString = new URLSearchParams({ ...filters, format }).toString()
    const response = await fetch(`${this.baseUrl}/api/harvest-approval/export?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${this.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }


  // QR Code Verification Methods
  async verifyQRCode(batchId: string) {
    return await this.request<{
      verified: boolean
      batchId: string
      cropType: string
      harvestDate: string
      quantity: number
      unit: string
      quality: string
      location: string | JsonRecord
      farmer: string
      status: string
      message?: string
    }>(`/api/verify/${batchId}`)
  }

  async getQRProvenance(batchId: string) {
    return this.request<JsonRecord>(`/api/verify/harvest/${batchId}`)
  }

  async getProductProvenance(productId: string) {
    return this.request<JsonRecord>(`/api/verify/product/${productId}`)
  }

  // Generic HTTP methods
  async get<T = JsonRecord>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = JsonRecord>(endpoint: string, data?: object, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = JsonRecord>(endpoint: string, data?: object, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = JsonRecord>(endpoint: string, data?: object, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = JsonRecord>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // New method to make a raw POST request (e.g., for file downloads) without JSON parsing
  async postRaw(endpoint: string, data?: object, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}

    if (this.token && this.token !== 'undefined') {
      headers["Authorization"] = `Bearer ${this.token}`
    } else {
      this.loadTokenFromStorage()
      if (this.token && this.token !== 'undefined') {
        headers["Authorization"] = `Bearer ${this.token}`
      }
    }

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: { ...headers, ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    })

    // If response is not OK, and it's not a 401 (handled by refreshTokenIfNeeded), throw error
    if (!response.ok && response.status !== 401) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        // If not JSON, use default message
      }
      throw new Error(errorMessage)
    }

    // If 401, trigger refresh logic and retry
    if (response.status === 401 && endpoint !== '/api/auth/refresh') {
      const refreshSuccess = await this.refreshTokenIfNeeded()
      if (refreshSuccess) {
        // Retry the original request with new token
        return this.postRaw(endpoint, data, options)
      } else {
        // If refresh failed, throw original error
        throw new Error('Authentication error: Token refresh failed')
      }
    }

    return response
  }

  // New method to make a raw GET request (e.g., for file downloads) without JSON parsing
  async getRaw(endpoint: string, options?: RequestInit): Promise<Response> {
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`
    const url = `${this.baseUrl}${apiEndpoint}`
    const headers: Record<string, string> = {}

    if (this.token && this.token !== 'undefined') {
      headers["Authorization"] = `Bearer ${this.token}`
    } else {
      this.loadTokenFromStorage()
      if (this.token && this.token !== 'undefined') {
        headers["Authorization"] = `Bearer ${this.token}`
      }
    }

    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: { ...headers, ...options?.headers },
    })

    // If 401, trigger refresh logic and retry
    if (response.status === 401 && endpoint !== '/api/auth/refresh') {
      const refreshSuccess = await this.refreshTokenIfNeeded()
      if (refreshSuccess) {
        return this.getRaw(endpoint, options)
      } else {
        throw new Error('Authentication error: Token refresh failed')
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    return response
  }

  // Get farmer details by ID (for partner dashboard)
  async getFarmerById(farmerId: string) {
    console.log('🔍 Calling getFarmerById API endpoint for farmer:', farmerId);
    try {
      const result = await this.request<{
        _id: string
        name: string
        email: string
        phone: string
        location: string
        address?: string
        status: string
        role: string
        joinedDate: string
        emailVerified: boolean
        profile?: JsonRecord
        partner?: JsonRecord
        harvests?: Array<{
          _id: string
          cropType: string
          quantity: number
          unit: string
          quality: string
          status: string
          createdAt: string
          estimatedValue?: number
        }>
        performanceMetrics?: {
          totalHarvests: number
          totalSales: number
          averageHarvestValue: number
          lastHarvestDate?: string
          cropsGrown: string[]
          performanceRating: 'excellent' | 'good' | 'average' | 'needs_improvement'
        }
      }>(`/partners/farmers/${farmerId}`);
      console.log('✅ getFarmerById response:', result);
      return result;
    } catch (error) {
      console.error('❌ getFarmerById error:', error);
      throw error;
    }
  }

  // Get harvests by farmer ID
  async getHarvestsByFarmer(farmerId: string) {
    console.log('🔍 Calling getHarvestsByFarmer API endpoint for farmer:', farmerId);
    try {
      const result = await this.request<Array<{
        _id: string
        cropType: string
        quantity: number
        unit: string
        quality: string
        status: string
        createdAt: string
        estimatedValue?: number
      }>>(`/harvests/farmer/${farmerId}`);
      console.log('✅ getHarvestsByFarmer response:', result);
      return result;
    } catch (error) {
      console.error('❌ getHarvestsByFarmer error:', error);
      throw error;
    }
  }

  // Onboarding Portal Management
  // Backend base path: /api/onboarding (backend/routes/onboarding.routes.js, mounted in backend/app.js)
  async getOnboardings(params: {
    page?: number
    limit?: number
    status?: string
    stage?: string
    priority?: string
    state?: string
    assignedAgent?: string
    searchTerm?: string
    dateRange?: { start?: string | Date; end?: string | Date }
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'dateRange' && typeof value === 'object') {
        const range = value as { start?: string | Date; end?: string | Date }
        if (range.start) searchParams.append('dateRange[start]', new Date(range.start).toISOString())
        if (range.end) searchParams.append('dateRange[end]', new Date(range.end).toISOString())
        return
      }
      searchParams.append(key, String(value))
    })
    const queryString = searchParams.toString()
    return this.request<{
      onboardings: JsonRecord[]
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/api/onboarding${queryString ? `?${queryString}` : ''}`)
  }

  async getOnboardingStats() {
    return this.request<{
      total: number
      pending: number
      inProgress: number
      completed: number
      rejected: number
      onHold: number
      thisWeek: number
      thisMonth: number
      successRate: number
      averageCompletionTime: number
      regionalDistribution: Record<string, number>
      cropDistribution: Record<string, number>
    }>('/api/onboarding/stats')
  }

  async getOnboardingById(id: string) {
    return this.request<JsonRecord>(`/api/onboarding/${id}`)
  }

  async createOnboarding(data: {
    farmerId: string
    assignedPartner: string
    assignedAgent?: string
    priority?: string
    notes?: string
    estimatedCompletionDate?: string
    location?: string | JsonRecord
  }) {
    return this.request<JsonRecord>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateOnboarding(id: string, data: object) {
    return this.request<JsonRecord>(`/api/onboarding/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async updateOnboardingStage(id: string, data: { stage: string; notes?: string }) {
    return this.request<JsonRecord>(`/api/onboarding/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteOnboarding(id: string) {
    return this.request<JsonRecord>(`/api/onboarding/${id}`, { method: 'DELETE' })
  }

  async getOnboardingProgress(farmerId: string) {
    return this.request<JsonRecord>(`/api/onboarding/progress/${farmerId}`)
  }

  async bulkUpdateOnboardings(data: { onboardingIds: string[]; updates: JsonRecord }) {
    return this.request<{ modifiedCount: number; matchedCount: number }>('/api/onboarding/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async exportOnboardings(filters: QueryParams = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await this.postRaw('/api/onboarding/export', { format, filters })
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }
    return response.blob()
  }

}

export const apiService = new ApiService()

export const api = apiService
