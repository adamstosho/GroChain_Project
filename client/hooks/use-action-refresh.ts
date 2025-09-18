import { useCallback } from 'react'

interface UseActionRefreshOptions {
  onRefresh?: (reason: string) => void
  onOptimisticUpdate?: (action: string, data: any) => void
}

export function useActionRefresh({
  onRefresh,
  onOptimisticUpdate
}: UseActionRefreshOptions = {}) {
  
  const triggerRefresh = useCallback((reason: string) => {
    if (onRefresh) {
      console.log(`🔄 Action-triggered refresh: ${reason}`)
      onRefresh(reason)
    }
  }, [onRefresh])

  const triggerOptimisticUpdate = useCallback((action: string, data: any) => {
    if (onOptimisticUpdate) {
      console.log(`⚡ Action-triggered optimistic update: ${action}`, data)
      onOptimisticUpdate(action, data)
    }
  }, [onOptimisticUpdate])

  // Common action handlers
  const handleOrderPlaced = useCallback((orderData: any) => {
    triggerOptimisticUpdate('order_placed', orderData)
    setTimeout(() => triggerRefresh('order_placed'), 1000)
  }, [triggerOptimisticUpdate, triggerRefresh])

  const handleFavoriteAdded = useCallback((favoriteData: any) => {
    triggerOptimisticUpdate('favorite_added', favoriteData)
    setTimeout(() => triggerRefresh('favorite_added'), 500)
  }, [triggerOptimisticUpdate, triggerRefresh])

  const handleFavoriteRemoved = useCallback((favoriteData: any) => {
    triggerOptimisticUpdate('favorite_removed', favoriteData)
    setTimeout(() => triggerRefresh('favorite_removed'), 500)
  }, [triggerOptimisticUpdate, triggerRefresh])

  const handleProfileUpdated = useCallback(() => {
    triggerRefresh('profile_updated')
  }, [triggerRefresh])

  const handlePaymentCompleted = useCallback((paymentData: any) => {
    triggerOptimisticUpdate('payment_completed', paymentData)
    setTimeout(() => triggerRefresh('payment_completed'), 1000)
  }, [triggerOptimisticUpdate, triggerRefresh])

  return {
    // Direct refresh methods
    refresh: triggerRefresh,
    optimisticUpdate: triggerOptimisticUpdate,
    
    // Action-specific methods
    handleOrderPlaced,
    handleFavoriteAdded,
    handleFavoriteRemoved,
    handleProfileUpdated,
    handlePaymentCompleted
  }
}

