
import { useAuthStore } from './auth'

class TokenRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null
  private isActive = false

  // Start automatic token refresh (every 20 minutes)
  start() {
    if (this.isActive || typeof window === 'undefined') return

    this.isActive = true
    console.log('🔄 Starting automatic token refresh service...')

    // Refresh token every 20 minutes (tokens expire in 24h, so this is safe)
    this.refreshInterval = setInterval(async () => {
      try {
        const authStore = useAuthStore.getState()
        if (authStore.isAuthenticated && authStore.refreshToken) {
          console.log('🔄 Periodic token refresh...')
          await authStore.refreshAuth()
          console.log('✅ Periodic token refresh completed')
        }
      } catch (error) {
        console.warn('⚠️ Periodic token refresh failed:', error)
        // Don't logout on periodic refresh failure, let the 401 handler deal with it
      }
    }, 20 * 60 * 1000) // 20 minutes
  }

  // Stop automatic token refresh
  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    this.isActive = false
    console.log('🛑 Stopped automatic token refresh service')
  }

  // Refresh token immediately
  async refreshNow(): Promise<boolean> {
    try {
      const authStore = useAuthStore.getState()
      if (authStore.isAuthenticated && authStore.refreshToken) {
        await authStore.refreshAuth()
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Immediate token refresh failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService()

// Auto-start when module loads (in browser only)
if (typeof window !== 'undefined') {
  // Wait for auth store to hydrate before starting
  const checkAuthAndStart = () => {
    const authStore = useAuthStore.getState()
    if (authStore.hasHydrated && authStore.isAuthenticated) {
      tokenRefreshService.start()
    } else if (!authStore.hasHydrated) {
      // Wait a bit more for hydration
      setTimeout(checkAuthAndStart, 1000)
    }
  }

  // Start checking after a short delay
  setTimeout(checkAuthAndStart, 2000)
}
