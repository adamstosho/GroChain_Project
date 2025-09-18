import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiService } from "./api"
import type { User } from "./types"

// Minimal cookie helper (middleware reads auth_token cookie)
const setCookie = (name: string, value: string, maxAgeSeconds: number = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}
const clearCookie = (name: string) => {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  normalizeUser: (backendUser: any) => User
  hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  updateUserAvatar: (avatarUrl: string) => void
  setLoading: (loading: boolean) => void
  setToken: (token: string) => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),

      // Internal helper to normalize backend user shape to frontend User type
      // Ensures id/_id differences and default fields are handled
      normalizeUser: (backendUser: any): User => {
        const id = backendUser._id || backendUser.id || ""
        const backendPrefs = backendUser.notificationPreferences || {}
        return {
          _id: id,
          name: backendUser.name || "",
          email: backendUser.email || "",
          phone: backendUser.phone || "",
          role: backendUser.role || "farmer",
          status: backendUser.status || "active",
          partner: backendUser.partner,
          emailVerified: Boolean(backendUser.emailVerified),
          phoneVerified: Boolean(backendUser.phoneVerified),
          location: backendUser.location,
          gender: backendUser.gender,
          age: backendUser.age,
          education: backendUser.education,
          pushToken: backendUser.pushToken,
          notificationPreferences: {
            email: backendPrefs.email ?? true,
            sms: backendPrefs.sms ?? true,
            push: backendPrefs.push ?? false,
            marketing: backendPrefs.marketing ?? true,
            orderUpdates: backendPrefs.transaction ?? true,
            harvestUpdates: backendPrefs.harvest ?? true,
            paymentUpdates: backendPrefs.transaction ?? true,
            weatherAlerts: backendPrefs.weatherAlerts ?? false,
          },
          profile: backendUser.profile || {}, // Include profile data with avatar
          createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
          updatedAt: backendUser.updatedAt ? new Date(backendUser.updatedAt) : new Date(),
        }
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await apiService.login(email, password)
          // Support both { data: { accessToken, refreshToken, user } } and top-level fields
          const envelope: any = (response as any) || {}
          const data = envelope.data || envelope
          const accessToken = data.accessToken || data.token || envelope.accessToken || envelope.token
          const refreshToken = data.refreshToken || envelope.refreshToken
          const rawUser = data.user || envelope.user

          if (!accessToken || !refreshToken || !rawUser) {
            throw new Error('Authentication response is missing required fields.')
          }

          // Store token in API service and localStorage
          apiService.setToken(accessToken)

          // Store tokens in localStorage for persistence
          if (typeof window !== "undefined") {
            localStorage.setItem("grochain_auth_token", accessToken)
            localStorage.setItem("grochain_refresh_token", refreshToken)
          }

          // Also set HTTP-only cookies for middleware compatibility
          setCookie("auth_token", accessToken)
          setCookie("refresh_token", refreshToken, 60 * 60 * 24 * 30)
          const normalizedUser = (get() as any).normalizeUser(rawUser)

          set({
            user: normalizedUser,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true })
        try {
          const response = await apiService.register(userData)
          // Backend requires email verification before login; do not set tokens here
          const envelope: any = (response as any) || {}
          const requiresVerification = envelope.requiresVerification === true || envelope.data?.requiresVerification === true
          const rawUser = envelope.user || envelope.data?.user

          // Store minimal user context if returned (optional), but do not authenticate
          set({
            user: rawUser ? (get() as any).normalizeUser(rawUser) : null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })

          if (!requiresVerification) {
            // In case backend changes to auto-login in future; noop for now
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        // Clear all local storage and cookies
        try { 
          // Clear API service token
          apiService.clearToken()
          
          // Clear cookies
          clearCookie("auth_token")
          clearCookie("refresh_token")
          
          // Clear localStorage if it exists
          if (typeof window !== 'undefined') {
            localStorage.removeItem('grochain-auth')
            sessionStorage.clear()
          }
          
          // Call backend logout (best effort)
          apiService.logout().catch(() => {
            // Ignore backend errors during logout
          })
        } catch (error) {
          // Ensure cleanup happens even if there are errors
          console.warn('Error during logout cleanup:', error)
        }
        
        // Reset state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return

        try {
          const response = await apiService.refreshToken(refreshToken)
          const envelope: any = (response as any) || {}
          const data = envelope.data || envelope
          const newAccessToken = data.accessToken || data.token || envelope.accessToken || envelope.token
          const newRefreshToken = data.refreshToken || envelope.refreshToken

          if (!newAccessToken || !newRefreshToken) {
            throw new Error('Refresh response is missing required fields.')
          }

          apiService.setToken(newAccessToken)
          setCookie("auth_token", newAccessToken)
          setCookie("refresh_token", newRefreshToken, 60 * 60 * 24 * 30)
          set({
            token: newAccessToken,
            refreshToken: newRefreshToken,
          })
        } catch (error) {
          get().logout()
          throw error
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      updateUserAvatar: (avatarUrl: string) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            profile: {
              ...state.user.profile,
              avatar: avatarUrl
            }
          } : null,
        }))
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
      
      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
        apiService.setToken(token)
        setCookie('auth_token', token)
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: "grochain-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called after state is rehydrated from storage
        try {
          console.log('🔄 Auth rehydration starting...', {
            hasState: !!state,
            hasToken: !!state?.token,
            hasUser: !!state?.user,
            isAuthenticated: state?.isAuthenticated
          })

          // Ensure API service has the token after rehydration
          if (state?.token) {
            apiService.setToken(state.token)
            console.log('✅ API service token set after rehydration')
          } else {
            console.log('⚠️ No token found in rehydrated state')
          }

          state?.setHasHydrated(true)
          console.log('✅ Auth rehydration completed successfully')
        } catch (error) {
          console.error('❌ Auth rehydration error:', error)
        }
      },
    },
  ),
)

// Auth guard hook
export const useAuthGuard = (requiredRole?: string) => {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  const hasAccess = () => {
    if (!hasHydrated) return false
    if (!isAuthenticated || !user) return false
    if (!requiredRole) return true
    return user.role === requiredRole || user.role === "admin"
  }

  return {
    user,
    isAuthenticated,
    hasAccess: hasAccess(),
    role: user?.role,
    isHydrated: hasHydrated,
  }
}

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  
  // Check localStorage
  const authData = localStorage.getItem('grochain-auth')
  if (!authData) return false
  
  try {
    const parsed = JSON.parse(authData)
    return !!(parsed.user && parsed.token && parsed.isAuthenticated)
  } catch {
    return false
  }
}

// Utility function to get current user
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const authData = localStorage.getItem('grochain-auth')
    if (!authData) return null
    
    const parsed = JSON.parse(authData)
    return parsed.user || null
  } catch {
    return null
  }
}
