// React hook for automatic payment verification
import { useState, useEffect, useCallback, useRef } from 'react'
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
  testMode?: boolean
}

export function usePaymentVerification(options: UsePaymentVerificationOptions = {}) {
  const {
    reference,
    orderId,
    autoVerify = true,
    verifyInterval = 30000,
    testMode = false,
  } = options
  const [state, setState] = useState<PaymentVerificationState>({
    isVerifying: false,
    isVerified: false,
    error: null,
    lastVerified: null
  })
  const { toast } = useToast()
  const isVerifiedRef = useRef(false)
  const isVerifyingRef = useRef(false)

  useEffect(() => {
    isVerifiedRef.current = state.isVerified
  }, [state.isVerified])

  const verifyPayment = useCallback(async (paymentRef?: string) => {
    const refToVerify = paymentRef || reference

    if (!refToVerify) {
      setState(prev => ({ ...prev, error: 'No payment reference provided' }))
      return false
    }

    if (isVerifiedRef.current) {
      return true
    }

    // Prevent concurrent duplicate verify calls (Strict Mode / overlapping intervals)
    if (isVerifyingRef.current) {
      return false
    }
    isVerifyingRef.current = true

    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      const result = await apiService.verifyPayment(refToVerify, { testMode })

      if (result.status === 'success') {
        const wasAlreadyVerified = isVerifiedRef.current
        isVerifiedRef.current = true
        setState(prev => ({
          ...prev,
          isVerifying: false,
          isVerified: true,
          error: null,
          lastVerified: new Date()
        }))

        if (!wasAlreadyVerified) {
          toast({
            title: "Payment Verified",
            description: "Your payment has been confirmed and updated.",
          })
        }

        return true
      }

      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: result.message || 'Verification failed'
      }))
      return false

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }))

      if (!isVerifiedRef.current) {
        toast({
          title: "Verification Error",
          description: "Could not verify payment status. Please try again.",
          variant: "destructive"
        })
      }

      return false
    } finally {
      isVerifyingRef.current = false
    }
  }, [reference, testMode, toast])

  const batchVerifyPayments = useCallback(async (references: string[]) => {
    if (!references.length) return []

    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      const results = await Promise.all(
        references.map(async (ref) => {
          try {
            const result = await apiService.verifyPayment(ref, { testMode })
            return {
              reference: ref,
              success: result.status === 'success',
              data: result.data,
              message: result.message
            }
          } catch (err) {
            return {
              reference: ref,
              success: false,
              message: err instanceof Error ? err.message : 'Verification failed'
            }
          }
        })
      )

      const verifiedCount = results.filter((r) => r.success).length
      if (verifiedCount > 0) {
        isVerifiedRef.current = true
      }

      setState(prev => ({
        ...prev,
        isVerifying: false,
        isVerified: verifiedCount > 0 || prev.isVerified,
        lastVerified: new Date()
      }))

      if (verifiedCount > 0) {
        toast({
          title: "Payments Verified",
          description: `${verifiedCount} payment(s) have been confirmed.`,
        })
      }

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch verification failed'
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }))
      return []
    }
  }, [testMode, toast])

  useEffect(() => {
    if (!autoVerify || (!reference && !orderId)) return

    verifyPayment()

    if (verifyInterval <= 0 || state.isVerified) return

    const intervalId = setInterval(() => {
      if (!isVerifiedRef.current) {
        verifyPayment()
      }
    }, verifyInterval)

    return () => clearInterval(intervalId)
  }, [autoVerify, reference, orderId, verifyInterval, verifyPayment, state.isVerified])

  return {
    ...state,
    verifyPayment,
    batchVerifyPayments,
    canVerify: !!(reference || orderId),
    needsVerification: !state.isVerified && !state.isVerifying,
    hasError: !!state.error
  }
}

export function useOrderPaymentVerification(orderId?: string) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const { verifyPayment, batchVerifyPayments, ...verificationState } = usePaymentVerification({
    autoVerify: false
  })

  const verifyAllPendingOrders = useCallback(async () => {
    if (pendingOrders.length === 0) return

    const references = pendingOrders
      .filter(order => order.paymentReference)
      .map(order => order.paymentReference)

    if (references.length > 0) {
      const results = await batchVerifyPayments(references)

      setPendingOrders(prevOrders =>
        prevOrders.map(order => {
          const result = results.find((r: { reference?: string; success?: boolean }) => r.reference === order.paymentReference)
          if (result?.success) {
            return { ...order, paymentStatus: 'paid' }
          }
          return order
        })
      )
    }
  }, [pendingOrders, batchVerifyPayments])

  const verifyOrderPayment = useCallback(async (order: { _id?: string; paymentReference?: string }) => {
    if (!order.paymentReference) return false

    const success = await verifyPayment(order.paymentReference)

    if (success) {
      setPendingOrders(prevOrders =>
        prevOrders.map(o =>
          o._id === order._id
            ? { ...o, paymentStatus: 'paid' }
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

export function useDashboardPaymentVerification() {
  const { verifyPayment, batchVerifyPayments, ...verificationState } = usePaymentVerification({
    autoVerify: false
  })

  const verifyAllDashboardPayments = useCallback(async () => {
    try {
      const response = await apiService.getUserOrders()
      const orders = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []

      const pendingOrders = orders.filter((order: { status?: string; paymentStatus?: string }) =>
        order.status === 'pending' || order.paymentStatus === 'pending'
      )

      if (pendingOrders.length === 0) {
        return { success: true, message: 'No pending orders found' }
      }

      const references = pendingOrders
        .filter((order: { paymentReference?: string }) => order.paymentReference)
        .map((order: { paymentReference?: string }) => order.paymentReference)

      if (references.length === 0) {
        return { success: false, message: 'No payment references available' }
      }

      const results = await batchVerifyPayments(references as string[])
      const verifiedCount = results.filter((r: { success?: boolean }) => r.success).length

      return {
        success: true,
        message: `Verified ${verifiedCount}/${references.length} payments`,
        results,
        verifiedCount,
        totalCount: references.length
      }

    } catch (error) {
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
