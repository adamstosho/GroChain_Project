// React hook for automatic payment verification
import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PaymentVerificationState {
  isVerifying: boolean
  isVerified: boolean
  error: string | null
  lastVerified: Date | null
}

interface UsePaymentVerificationOptions {
  reference?: string
  orderId?: string
  autoVerify?: boolean
  verifyInterval?: number // in milliseconds
}

export function usePaymentVerification(options: UsePaymentVerificationOptions = {}) {
  const { reference, orderId, autoVerify = true, verifyInterval = 30000 } = options
  const [state, setState] = useState<PaymentVerificationState>({
    isVerifying: false,
    isVerified: false,
    error: null,
    lastVerified: null
  })
  const { toast } = useToast()

  // Verify payment function
  const verifyPayment = useCallback(async (paymentRef?: string) => {
    const refToVerify = paymentRef || reference

    if (!refToVerify) {
      setState(prev => ({ ...prev, error: 'No payment reference provided' }))
      return false
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      console.log(`🔍 Verifying payment: ${refToVerify}`)

      const result = await apiService.verifyPayment(refToVerify)

      if (result.status === 'success') {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          isVerified: true,
          error: null,
          lastVerified: new Date()
        }))

        toast({
          title: "Payment Verified",
          description: "Your payment has been confirmed and updated.",
        })

        console.log('✅ Payment verified successfully')
        return true
      } else {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          error: result.message || 'Verification failed'
        }))

        console.log('❌ Payment verification failed:', result.message)
        return false
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }))

      toast({
        title: "Verification Error",
        description: "Could not verify payment status. Please try again.",
        variant: "destructive"
      })

      console.error('❌ Payment verification error:', error)
      return false
    }
  }, [reference, toast])

  // Batch verify multiple payments
  const batchVerifyPayments = useCallback(async (references: string[]) => {
    if (!references.length) return []

    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      const response = await fetch(`${apiService.getBaseUrl()}/api/payments/batch-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ references })
      })

      const result = await response.json()

      if (result.status === 'success') {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          lastVerified: new Date()
        }))

        const verifiedCount = result.results.filter((r: any) => r.success).length

        if (verifiedCount > 0) {
          toast({
            title: "Payments Verified",
            description: `${verifiedCount} payment(s) have been confirmed.`,
          })
        }

        return result.results
      } else {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          error: result.message
        }))
        return []
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch verification failed'
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }))
      return []
    }
  }, [toast])

  // Auto-verification effect
  useEffect(() => {
    if (!autoVerify || (!reference && !orderId)) return

    // Initial verification
    verifyPayment()

    // Set up periodic verification if interval is provided
    if (verifyInterval > 0) {
      const intervalId = setInterval(() => {
        verifyPayment()
      }, verifyInterval)

      return () => clearInterval(intervalId)
    }
  }, [autoVerify, reference, orderId, verifyInterval, verifyPayment])

  return {
    ...state,
    verifyPayment,
    batchVerifyPayments,
    // Helper functions
    canVerify: !!(reference || orderId),
    needsVerification: !state.isVerified && !state.isVerifying,
    hasError: !!state.error
  }
}

// Hook for verifying orders with pending payments
export function useOrderPaymentVerification(orderId?: string) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const { verifyPayment, batchVerifyPayments, ...verificationState } = usePaymentVerification({
    autoVerify: false // Manual verification for orders
  })

  // Verify all pending orders
  const verifyAllPendingOrders = useCallback(async () => {
    if (pendingOrders.length === 0) return

    const references = pendingOrders
      .filter(order => order.paymentReference)
      .map(order => order.paymentReference)

    if (references.length > 0) {
      const results = await batchVerifyPayments(references)

      // Update local state with verification results
      setPendingOrders(prevOrders =>
        prevOrders.map(order => {
          const result = results.find((r: any) => r.reference === order.paymentReference)
          if (result?.success) {
            return { ...order, status: 'paid', paymentStatus: 'paid' }
          }
          return order
        })
      )
    }
  }, [pendingOrders, batchVerifyPayments])

  // Verify specific order
  const verifyOrderPayment = useCallback(async (order: any) => {
    if (!order.paymentReference) return false

    const success = await verifyPayment(order.paymentReference)

    if (success) {
      // Update local state
      setPendingOrders(prevOrders =>
        prevOrders.map(o =>
          o._id === order._id
            ? { ...o, status: 'paid', paymentStatus: 'paid' }
            : o
        )
      )
    }

    return success
  }, [verifyPayment])

  return {
    ...verificationState,
    pendingOrders,
    setPendingOrders,
    verifyAllPendingOrders,
    verifyOrderPayment
  }
}

// Hook for dashboard-wide payment verification
export function useDashboardPaymentVerification() {
  const { verifyPayment, batchVerifyPayments, ...verificationState } = usePaymentVerification({
    autoVerify: false
  })

  // Get all pending orders and verify them
  const verifyAllDashboardPayments = useCallback(async () => {
    try {
      // This would typically come from an API call to get pending orders
      const response = await apiService.getUserOrders()
      const orders = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []

      const pendingOrders = orders.filter((order: any) =>
        order.status === 'pending' || order.paymentStatus === 'pending'
      )

      if (pendingOrders.length === 0) {
        console.log('✅ No pending orders to verify')
        return { success: true, message: 'No pending orders found' }
      }

      const references = pendingOrders
        .filter((order: any) => order.paymentReference)
        .map((order: any) => order.paymentReference)

      if (references.length === 0) {
        console.log('⚠️ No payment references found for pending orders')
        return { success: false, message: 'No payment references available' }
      }

      console.log(`🔍 Verifying ${references.length} payments...`)
      const results = await batchVerifyPayments(references)

      const verifiedCount = results.filter((r: any) => r.success).length

      return {
        success: true,
        message: `Verified ${verifiedCount}/${references.length} payments`,
        results,
        verifiedCount,
        totalCount: references.length
      }

    } catch (error) {
      console.error('❌ Dashboard verification error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }, [batchVerifyPayments])

  return {
    ...verificationState,
    verifyAllDashboardPayments
  }
}
