"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { usePaymentVerification } from '@/hooks/use-payment-verification'
import { useToast } from '@/hooks/use-toast'

interface PaymentVerificationButtonProps {
  reference: string
  orderId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  onVerificationComplete?: (success: boolean) => void
}

export function PaymentVerificationButton({
  reference,
  orderId,
  variant = 'outline',
  size = 'sm',
  className = '',
  onVerificationComplete
}: PaymentVerificationButtonProps) {
  const { isVerifying, isVerified, error, verifyPayment } = usePaymentVerification({
    reference,
    autoVerify: false // Manual verification only
  })
  const { toast } = useToast()

  const handleVerify = async () => {
    const success = await verifyPayment()

    if (onVerificationComplete) {
      onVerificationComplete(success)
    }

    if (success) {
      toast({
        title: "Payment Verified!",
        description: "Your payment has been confirmed and the order status updated.",
      })
    } else {
      toast({
        title: "Verification Failed",
        description: error || "Could not verify payment status. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Don't show button if already verified
  if (isVerified) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Payment Verified</span>
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleVerify}
      disabled={isVerifying}
      className={`flex items-center gap-2 ${className}`}
    >
      {isVerifying ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Verifying...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Verify Payment</span>
        </>
      )}
    </Button>
  )
}

// Batch verification component for multiple orders
interface BatchVerificationButtonProps {
  orders: Array<{ paymentReference?: string; _id: string }>
  onComplete?: (results: any[]) => void
  className?: string
}

export function BatchVerificationButton({
  orders,
  onComplete,
  className = ''
}: BatchVerificationButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const { toast } = useToast()

  const handleBatchVerify = async () => {
    const references = orders
      .filter(order => order.paymentReference)
      .map(order => order.paymentReference!)

    if (references.length === 0) {
      toast({
        title: "No References",
        description: "No payment references found to verify.",
        variant: "destructive"
      })
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/payments/batch-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ references })
      })

      const result = await response.json()

      setResults(result.results || [])

      if (result.success) {
        const verifiedCount = result.results.filter((r: any) => r.success).length

        toast({
          title: "Batch Verification Complete",
          description: `Successfully verified ${verifiedCount}/${references.length} payments.`,
        })

        if (onComplete) {
          onComplete(result.results)
        }
      } else {
        toast({
          title: "Batch Verification Failed",
          description: result.message || "Could not verify payments.",
          variant: "destructive"
        })
      }

    } catch (error) {
      toast({
        title: "Verification Error",
        description: "An error occurred during verification.",
        variant: "destructive"
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const verifiedCount = results.filter(r => r.success).length
  const totalCount = results.length

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBatchVerify}
        disabled={isVerifying || orders.length === 0}
        className="flex items-center gap-2"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Verify All Payments ({orders.length})</span>
          </>
        )}
      </Button>

      {totalCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{verifiedCount}/{totalCount} verified</span>
          {verifiedCount > 0 && <CheckCircle className="h-3 w-3 text-green-600" />}
        </div>
      )}
    </div>
  )
}

// Auto-verification component that runs on page load
interface AutoVerificationProps {
  reference?: string
  orderId?: string
  onVerified?: () => void
  className?: string
}

export function AutoVerification({
  reference,
  orderId,
  onVerified,
  className = ''
}: AutoVerificationProps) {
  const { isVerifying, isVerified, error } = usePaymentVerification({
    reference,
    orderId,
    autoVerify: true,
    verifyInterval: 0 // Only verify once on load
  })

  // Call onVerified callback when verification completes
  React.useEffect(() => {
    if (isVerified && onVerified) {
      onVerified()
    }
  }, [isVerified, onVerified])

  // Only show if there's an error or still verifying
  if (isVerified || (!isVerifying && !error)) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isVerifying && (
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Verifying payment...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>Verification failed</span>
        </div>
      )}
    </div>
  )
}
