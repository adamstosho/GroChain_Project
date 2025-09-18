import { APP_CONFIG } from "./constants"
import type { ApiResponse, User, Harvest, Listing, Order, WeatherData, DashboardStats } from "./types"

class ApiService {
  private baseUrl: string
  private token: string | null = null
  private isRefreshing: boolean = false

  constructor() {
    this.baseUrl = APP_CONFIG.api.baseUrl
    this.loadTokenFromStorage()
  }

  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (error) {
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
      this.token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Load token from storage before each request to ensure it's up to date
    // Skip for auth endpoints and refresh-related calls to prevent infinite loops
    if (!endpoint.includes('/auth/') && !endpoint.includes('refresh')) {
      this.loadTokenFromStorage()
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
        for (const [k, v] of options.headers as any) headers[k] = String(v)
      } else if (options.headers instanceof Headers) {
        (options.headers as Headers).forEach((v, k) => (headers[k] = v))
      } else {
        Object.assign(headers, options.headers as any)
      }
    }

    if (this.token && this.token !== 'undefined') {
      headers["Authorization"] = `Bearer ${this.token}`
    } else {
      // Try to load token from storage
      this.loadTokenFromStorage()
      if (this.token && this.token !== 'undefined') {
        headers["Authorization"] = `Bearer ${this.token}`
      }
    }

    // If sending FormData, let the browser set the correct multipart boundary
    if (options.body instanceof FormData) {
      // @ts-ignore
      delete headers["Content-Type"]
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
          console.log('🔄 Token expired, attempting refresh...')
          
          const refreshSuccess = await this.refreshTokenIfNeeded()
          if (refreshSuccess) {
            console.log('✅ Token refreshed successfully, retrying request...')
            // Retry the original request with new token
            return this.request(endpoint, options)
          } else {
            console.log('❌ Token refresh failed, redirecting to login...')
            // Clear all auth data and redirect to login
            this.clearToken()
            if (typeof window !== 'undefined') {
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

        // Add more detailed error information for debugging
        console.error(`API Error [${endpoint}]:`, {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          data: data,
          errorType: data.errorType || 'Unknown',
          errorDetails: data.errorDetails || 'No details provided',
          errors: data.errors || 'No validation errors provided'
        })

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

        const err: any = new Error(errorMessage)
        err.status = response.status
        err.payload = this.safeStringify(data)
        err.endpoint = endpoint
        throw err
      }

      return data
    } catch (error) {

      // Handle timeout/abort errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
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
      localStorage.removeItem(APP_CONFIG.auth.tokenKey)
      localStorage.removeItem(APP_CONFIG.auth.refreshTokenKey)
      // Also clear the auth store keys for consistency
      localStorage.removeItem('grochain-auth')
    }
  }

  // Check if token exists and is valid
  hasValidToken(): boolean {
    if (!this.token || this.token === 'undefined') {
      // Try to load from localStorage
      if (typeof window !== "undefined") {
        this.token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
      }
    }
    return !!(this.token && this.token !== 'undefined')
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== "undefined" ?
        localStorage.getItem(APP_CONFIG.auth.refreshTokenKey) : null

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

      const envelope: any = response || {}
      const data = envelope.data || envelope
      const newAccessToken = data.accessToken || data.token || envelope.accessToken || envelope.token
      const newRefreshToken = data.refreshToken || envelope.refreshToken

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
              localStorage.setItem(APP_CONFIG.auth.refreshTokenKey, newRefreshToken)
            }
          } catch (error) {
            console.warn('Could not update auth store:', error)
          }
        }
        
        return true
      }

      console.log('❌ No new access token in refresh response')
      return false
    } catch (error: any) {
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
    return this.request<{ user: User; token: string; refreshToken: string }>("/api/auth/register", {
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
      return await this.request("/api/auth/logout", {
        method: "POST",
      })
    } catch (e) {
      // Ignore network errors here; we'll still clear local state
      return { success: true, message: "Logged out" } as any
    }
  }

  // Email verification helpers
  async verifyEmail(token: string) {
    return this.request<{ message: string; user: any }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
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
    return this.request("/api/users/preferences/me")
  }

  async updatePreferences(notifications: any) {
    return this.request("/api/users/preferences/me", {
      method: "PUT",
      body: JSON.stringify({ notifications }),
    })
  }

  // User Settings
  async getSettings() {
    return this.request("/api/users/settings/me")
  }

  async updateSettings(settings: { security?: any; display?: any; performance?: any }) {
    return this.request("/api/users/settings/me", {
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
    return this.request<DashboardStats>("/api/users/dashboard")
  }

  async getRecentActivities(limit?: number) {
    const params = limit ? `?limit=${limit}` : ''
    return this.request("/api/users/recent-activities" + params)
  }

  async getDashboardMetrics() {
    return this.request("/api/analytics/dashboard")
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

  async updateAdminProfile(data: any) {
    return this.request("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getAdminSettings() {
    return this.request('/api/admin/settings')
  }

  async updateAdminSettings(settings: any) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getAdminNotificationSettings() {
    return this.request('/api/admin/settings/notifications')
  }

  async updateAdminNotificationSettings(settings: any) {
    return this.request('/api/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getAdminSecuritySettings() {
    return this.request('/api/admin/settings/security')
  }

  async updateAdminSecuritySettings(settings: any) {
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

  async getAdminUsers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request(`/api/admin/users${queryString}`)
  }

  async getAdminUserById(id: string) {
    return this.request(`/api/admin/users/${id}`)
  }

  async updateAdminUser(id: string, data: any) {
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

  async getAdminAnalyticsExport(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : ''
    return this.request(`/api/admin/analytics/export${queryString}`)
  }

  // Admin System Management
  async getAdminSystemStatus() {
    return this.request('/api/admin/system/status')
  }

  async getAdminSystemLogs(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : ''
    return this.request(`/api/admin/system/logs${queryString}`)
  }

  async getAdminSystemConfig() {
    return this.request('/api/admin/system/config')
  }

  async updateAdminSystemConfig(section: string, settings: any) {
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
  async getHarvests(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {})
    return this.request<Harvest[]>(`/api/harvests?${params}`)
  }

  async getHarvestAnalytics(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {})
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

  async createHarvest(harvestData: Partial<Harvest>) {
    return this.request<Harvest>("/api/harvests", {
      method: "POST",
      body: JSON.stringify(harvestData as any),
    })
  }

  async getHarvestById(id: string) {
    return this.request<Harvest>(`/api/harvests/id/${id}`)
  }

  async updateHarvest(id: string, harvestData: Partial<Harvest>) {
    return this.request<Harvest>(`/api/harvests/${id}`, {
      method: "PUT",
      body: JSON.stringify(harvestData as any),
    })
  }

  async getHarvestProvenance(batchId: string) {
    return this.request<Harvest>(`/api/harvests/provenance/${batchId}`)
  }

  async verifyHarvest(batchId: string) {
    return this.request<Harvest>(`/api/harvests/verification/${batchId}`)
  }

  // Marketplace
  async getListings(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters)
    return this.request<Listing[]>(`/api/marketplace/listings?${params}`)
  }

  async getListing(id: string) {
    return this.request<Listing>(`/api/marketplace/listings/${id}`)
  }

  async getListingForEdit(id: string) {
    return this.request<Listing>(`/api/marketplace/listings/${id}/edit`)
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

  async createOrder(orderData: Partial<Order>) {
    return this.request<Order>("/api/marketplace/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
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

  async updateListingStatus(id: string, status: string, data?: any) {
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
  async getListingReviews(listingId: string, params?: Record<string, any>) {
    const queryString = new URLSearchParams(params).toString()
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

  async getFarmerReviews(params?: Record<string, any>) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/reviews/farmer?${queryString}`)
  }



  // Harvest approval → create listing from harvest (farmer only)
  async createListingFromHarvest(harvestId: string, price: number, description?: string, quantity?: number, unit?: string) {
    return this.request(`/api/harvest-approval/${harvestId}/create-listing`, {
      method: "POST",
      body: JSON.stringify({ price, description, quantity, unit }),
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

  // Analytics
  async getAnalytics(type: string, filters?: Record<string, any>) {
    const params = new URLSearchParams(filters)
    return this.request(`/api/analytics/${type}?${params}`)
  }

  // File Upload
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append("images", file)
    const res: any = await this.request("/api/marketplace/upload-image", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      } as any,
    })
    const urls: string[] = res?.urls || res?.data?.urls || []
    return { url: urls[0] }
  }

  async uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach((f) => formData.append("images", f))
    const res: any = await this.request("/api/marketplace/upload-image", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      } as any,
    })
    const urls: string[] = res?.urls || res?.data?.urls || []
    return urls
  }

  // Avatar Upload
  async uploadAvatar(formData: FormData, isAdmin: boolean = false) {
    const token = localStorage.getItem('grochain_auth_token')
    const endpoint = isAdmin ? '/api/admin/profile/avatar' : '/api/users/profile/avatar'

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server')
      }
      throw error
    }
  }

  // Fintech - Credit Score and Loans
  async getMyCreditScore() {
    return this.request(`/api/fintech/credit-score/me`);
  }

  async getLoanApplications(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {})
    return this.request(`/api/fintech/loan-applications?${params.toString()}`)
  }

  async createLoanApplication(data: { amount: number; purpose: string; term: number; description?: string }) {
    return this.request(`/api/fintech/loan-applications`, {
      method: "POST",
      body: JSON.stringify(data),
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
    currentAmount: number;
    status: string;
  }>) {
    return this.request(`/api/fintech/financial-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }



  async getInsurancePolicies() {
    return this.request('/api/fintech/insurance-policies/me');
  }

  async getInsuranceQuotes(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {})
    return this.request(`/api/fintech/insurance-quotes?${params.toString()}`);
  }

  async getFinancialHealth() {
    return this.request('/api/fintech/financial-health/me');
  }

  async getMyProfile() {
    return this.request('/api/users/profile/me');
  }

  async updateMyProfile(data: any) {
    return this.request('/api/users/profile/me', {
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

  async updateMySettings(data: any) {
    return this.request('/api/users/settings/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteHarvest(harvestId: string) {
    return this.request(`/api/harvests/${harvestId}`, { method: "DELETE" })
  }

  async exportHarvests(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {})
    const url = `/api/harvests/export?${params}`
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = url
    link.download = `harvests-export.${(filters || {}).format || 'json'}`
    link.click()
    return { success: true }
  }



  async getMarketplaceListings(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/marketplace/listings?${queryString}`)
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

  async getFavorites(userId?: string, params: any = {}) {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      const queryString = new URLSearchParams(params).toString()
      return this.request(`/api/marketplace/favorites/${userId}?${queryString}`)
    } else {
      // Fallback: get favorites for current authenticated user
      const queryString = new URLSearchParams(params).toString()
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

  async getBuyerOrders(buyerId: string, params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/marketplace/orders/buyer/${buyerId}?${queryString}`)
  }



  async initializePayment(paymentData: any) {
    return this.request('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  async verifyPayment(reference: string) {
    return this.request(`/api/payments/verify/${reference}`)
  }

  async syncOrderStatus(orderId: string) {
    return this.request(`/api/payments/sync/${orderId}`, {
      method: 'POST'
    })
  }

  async getTransactionHistory(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/payments/transactions?${queryString}`)
  }

  // Payment Methods Management
  async getPaymentMethods() {
    return this.request('/api/payments/methods')
  }

  async addPaymentMethod(data: { type: string; details: any }) {
    return this.request('/api/payments/methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePaymentMethod(id: string, data: any) {
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

  async reportShipmentIssue(shipmentId: string, issueData: any) {
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

  async getUserOrders(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/api/marketplace/orders?${queryString}` : '/api/marketplace/orders'
    return this.request(url)
  }



  async getWeatherData(params?: any) {
    const queryString = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
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

  // Farmer-specific marketplace data
  async getFarmerListings(params?: Record<string, any>) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/farmers/listings?${queryString}`)
  }

  async getFarmerOrders(params?: Record<string, any>) {
    const queryString = new URLSearchParams(params).toString()
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
    const queryString = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
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
    }>(`/api/partners/farmers?${queryString}`)
  }

  async getPartnerMetrics() {
    return this.request<{
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
    }>("/api/partners/metrics")
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
    const queryString = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
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

  async processCommissionPayout(data: {
    commissionIds: string[]
    payoutMethod: string
    payoutDetails: any
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
    const queryString = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
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
    const queryString = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
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
    return this.request(`/api/partners/referrals/stats/performance?period=${period}`)
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
    const queryString = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
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



  async getUserNotifications(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/notifications?${queryString}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ notifications: preferences }),
    })
  }

  async exportOrderData(exportData: any) {
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

  async generateQRCodeForHarvest(harvestId: string, customData?: Record<string, any>) {
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

        const err: any = new Error(errorMessage)
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

  async getFarmerProfile() {
    return this.request('/api/farmers/profile/me')
  }

  async updateFarmerProfile(profileData: any) {
    return this.request('/api/farmers/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }



  async getPartnerProfile() {
    return this.request('/api/users/profile/me')
  }

  async updatePartnerProfile(profileData: any) {
    return this.request('/api/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }




  async getPerformanceAnalytics(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/analytics/performance?${queryString}`)
  }

  async getGeographicAnalytics(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/analytics/geographic?${queryString}`)
  }

  async getFinancialAnalytics(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/analytics/financial?${queryString}`)
  }

  async getTrendAnalytics(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/analytics/trends?${queryString}`)
  }

  async generateAnalyticsReport(config: any): Promise<any> {
    return this.request<any>("/api/analytics/report", {
      method: "POST",
      body: JSON.stringify(config)
    })
  }

  async exportAnalyticsData(type: string = 'user', period: string = '30d', format: string = 'csv'): Promise<void> {
    const requestBody = {
      type,
      period,
      format,
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

  async getApprovals(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/approvals?${queryString}`)
  }

  async getApprovalById(approvalId: string): Promise<any> {
    return this.request<any>(`/api/approvals/${approvalId}`)
  }

  async getPendingHarvests(filters?: any): Promise<any> {
    const queryString = filters ? new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<any>(`/api/harvest-approval/pending?${queryString}`)
  }

  async getAllHarvests(filters?: any): Promise<any> {
    const queryString = filters ? new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)])).toString() : ''
    return this.request<any>(`/api/harvest-approval/all?${queryString}`)
  }

  async getApprovalStats(): Promise<any> {
    return this.request<any>('/api/harvest-approval/stats')
  }

  async approveHarvest(approvalId: string, data: { quality?: string; notes?: string; agriculturalData?: any }): Promise<any> {
    console.log('=== API SERVICE: approveHarvest called ===')
    console.log('Approval ID:', approvalId)
    console.log('Data:', data)
    try {
      const result = await this.request<any>(`/api/harvest-approval/${approvalId}/approve`, {
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

  async rejectHarvest(approvalId: string, data: { reason: string; notes?: string }): Promise<any> {
    console.log('=== API SERVICE: rejectHarvest called ===')
    console.log('Approval ID:', approvalId)
    console.log('Data:', data)
    try {
      const result = await this.request<any>(`/api/harvest-approval/${approvalId}/reject`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      console.log('=== API SERVICE: rejectHarvest success ===')
      return result
    } catch (error) {
      console.log('=== API SERVICE: rejectHarvest failed ===')
      console.log('Error details:', error)
      throw error
    }
  }

  async markForReview(approvalId: string, data: { notes?: string }): Promise<any> {
    return this.request<any>(`/api/harvest-approval/${approvalId}/revision`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async bulkProcessApprovals(data: { approvalIds: string[]; action: string; notes?: string; reason?: string }): Promise<any> {
    return this.request<any>('/api/harvest-approval/bulk-process', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async batchProcessApprovals(batchAction: any): Promise<any> {
    return this.request<any>('/api/approvals/batch', {
      method: 'POST',
      body: JSON.stringify(batchAction)
    })
  }

  async getApprovalMetrics(filters: any = {}): Promise<any> {
    const queryString = new URLSearchParams(filters).toString()
    return this.request<any>(`/api/approvals/metrics?${queryString}`)
  }

  async getApprovalHistory(approvalId: string): Promise<any> {
    return this.request<any>(`/api/approvals/${approvalId}/history`)
  }

  async exportApprovals(filters: any, format: string = 'csv'): Promise<Blob> {
    const queryString = new URLSearchParams({ ...filters, format }).toString()
    const response = await fetch(`${this.baseUrl}/api/approvals/export?${queryString}`, {
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
    return this.request<{
      verified: boolean
      batchId: string
      cropType: string
      harvestDate: string
      quantity: number
      unit: string
      quality: string
      location: any
      farmer: string
      status: string
      message?: string
    }>(`/api/verify/${batchId}`)
  }

  async getQRProvenance(batchId: string) {
    return this.request<any>(`/api/verify/harvest/${batchId}`)
  }

  async getProductProvenance(productId: string) {
    return this.request<any>(`/api/verify/product/${productId}`)
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // New method to make a raw POST request (e.g., for file downloads) without JSON parsing
  async postRaw(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
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
      } catch (e) {
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

}

export const apiService = new ApiService()

export const api = apiService
