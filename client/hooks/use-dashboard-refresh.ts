import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/auth'

interface UseDashboardRefreshOptions {
  onRefresh?: () => void
  onOptimisticUpdate?: (action: string, data: any) => void
}

export function useDashboardRefresh({
  onRefresh,
  onOptimisticUpdate
}: UseDashboardRefreshOptions = {}) {
  const { user } = useAuthStore()
  const lastRefreshRef = useRef<number>(0)
  const backgroundSyncRef = useRef<NodeJS.Timeout | null>(null)
  const isPageVisibleRef = useRef<boolean>(true)
  const onRefreshRef = useRef(onRefresh)
  const onOptimisticUpdateRef = useRef(onOptimisticUpdate)

  onRefreshRef.current = onRefresh
  onOptimisticUpdateRef.current = onOptimisticUpdate

  const handleRefresh = useCallback((reason: string = 'manual') => {
    if (!user || !onRefreshRef.current) return

    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshRef.current
    
    // Prevent too frequent refreshes (minimum 2 seconds between refreshes)
    if (timeSinceLastRefresh < 2000) {
      console.log(`⏭️ Skipping refresh (${reason}): too soon after last refresh`)
      return
    }

    console.log(`🔄 Dashboard refresh triggered: ${reason}`)
    lastRefreshRef.current = now
    onRefreshRef.current()
  }, [user])

  // Optimistic update for immediate UI feedback
  const handleOptimisticUpdate = useCallback((action: string, data: any) => {
    if (!user || !onOptimisticUpdateRef.current) return
    
    console.log(`⚡ Optimistic update: ${action}`, data)
    onOptimisticUpdateRef.current(action, data)
  }, [user])

  // Page visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      isPageVisibleRef.current = isVisible
      
      if (isVisible && user) {
        // Refresh when user returns to tab (after 30+ seconds away)
        const timeAway = Date.now() - lastRefreshRef.current
        if (timeAway > 30000) {
          console.log('👁️ Page became visible after being away - refreshing dashboard')
          handleRefresh('page_focus')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, handleRefresh])

  // Network status change handler
  useEffect(() => {
    const handleOnline = () => {
      if (user && isPageVisibleRef.current) {
        console.log('🌐 Network reconnected - refreshing dashboard')
        handleRefresh('network_reconnect')
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user, handleRefresh])

  // Background sync (every 10 minutes when page is active)
  useEffect(() => {
    if (!user || !onRefreshRef.current) return

    const startBackgroundSync = () => {
      if (backgroundSyncRef.current) {
        clearInterval(backgroundSyncRef.current)
      }

      backgroundSyncRef.current = setInterval(() => {
        if (isPageVisibleRef.current && user) {
          console.log('🔄 Background sync - refreshing dashboard')
          handleRefresh('background_sync')
        }
      }, 10 * 60 * 1000) // 10 minutes
    }

    startBackgroundSync()

    return () => {
      if (backgroundSyncRef.current) {
        clearInterval(backgroundSyncRef.current)
      }
    }
  }, [user, handleRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (backgroundSyncRef.current) {
        clearInterval(backgroundSyncRef.current)
      }
    }
  }, [])

  return {
    refresh: (reason?: string) => handleRefresh(reason),
    optimisticUpdate: handleOptimisticUpdate,
    lastRefresh: lastRefreshRef.current
  }
}
