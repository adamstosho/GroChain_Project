import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { apiService } from "./api"
import {
  authPersistStorage,
  clearAuthTokens,
  getAuthDataFromStorage,
  isRememberMeEnabled,
  setRefreshTokenInStorage,
  setRememberMePreference,
  setTokensInStorage,
  setTokenInStorage,
} from "./auth-storage"
import type { User } from "./types"

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

// Middleware reads auth_token cookie; session cookies omit Max-Age when remember me is off
const setCookie = (name: string, value: string, rememberMe?: boolean, maxAgeSeconds?: number) => {
  if (typeof document === "undefined") return
  const persist = rememberMe ?? isRememberMeEnabled()
  if (persist) {
    const maxAge = maxAgeSeconds ?? ACCESS_COOKIE_MAX_AGE
    document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  } else {
    document.cookie = `${name}=${value}; Path=/; SameSite=Lax`
  }
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
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
      
      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true })
        try {
          setRememberMePreference(rememberMe)

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

          apiService.setToken(accessToken)
          setTokensInStorage(accessToken, refreshToken, rememberMe)

          setCookie("auth_token", accessToken, rememberMe)
          setCookie("refresh_token", refreshToken, rememberMe, REFRESH_COOKIE_MAX_AGE)
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
          
          // Registration successful - user needs to verify email
          set({
            user: null, // Don't store user until verified
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        try {
          apiService.clearToken()
          clearCookie("auth_token")
          clearCookie("refresh_token")
          clearAuthTokens()
          
          // Call backend logout (best effort)
          apiService.logout().catch(() => {
            // Ignore backend errors during logout
          })
        } catch (error) {
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
          setTokenInStorage(newAccessToken)
          setRefreshTokenInStorage(newRefreshToken)
          setCookie("auth_token", newAccessToken)
          setCookie("refresh_token", newRefreshToken, undefined, REFRESH_COOKIE_MAX_AGE)
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
        setTokenInStorage(token)
        setCookie('auth_token', token)
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: "grochain-auth",
      storage: createJSONStorage(() => authPersistStorage),
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
  
  const authData = getAuthDataFromStorage()
  if (!authData) return false
  
  try {
    const parsed = JSON.parse(authData)
    const state = parsed.state ?? parsed
    return !!(state.user && state.token && state.isAuthenticated)
  } catch {
    return false
  }
}

// Utility function to get current user
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const authData = getAuthDataFromStorage()
    if (!authData) return null
    
    const parsed = JSON.parse(authData)
    const state = parsed.state ?? parsed
    return state.user || null
  } catch {
    return null
  }
}
