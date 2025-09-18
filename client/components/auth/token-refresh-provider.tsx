"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth'
import { tokenRefreshService } from '@/lib/token-refresh'

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useAuthStore()

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      console.log('🔄 Starting token refresh service for authenticated user')
      tokenRefreshService.start()
    } else if (hasHydrated && !isAuthenticated) {
      console.log('🛑 Stopping token refresh service for unauthenticated user')
      tokenRefreshService.stop()
    }
  }, [isAuthenticated, hasHydrated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tokenRefreshService.stop()
    }
  }, [])

  return <>{children}</>
}
