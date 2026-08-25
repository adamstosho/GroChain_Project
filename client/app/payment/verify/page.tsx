"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, CreditCard, Package, Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import Link from "next/link"

interface VerificationResult {
  status: 'success' | 'failed' | 'pending'
  transaction?: any
  verification?: any
  orderId?: string
  reference?: string
}

function PaymentVerificationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref') || reference
  const testMode = searchParams.get('test_mode') === 'true'

  useEffect(() => {
    const verifyPayment = async () => {
      if (!trxref) {
        setError('No payment reference provided')
        setLoading(false)
        return
      }

      try {

        // Try manual verification first
        const response = await apiService.verifyPayment(trxref, { testMode })

        if (response && response.status === 'success') {

          // Check if we have order information
          const transaction = (response.data as any)?.transaction
          const orderData = (response.data as any)?.order
          const orderId = transaction?.orderId || transaction?.metadata?.order_id

          const paymentConfirmed =
            !orderData ||
            orderData.paymentStatus === 'paid' ||
            orderData.status === 'paid'

          if (paymentConfirmed) {

            setVerificationResult({
              status: 'success',
              transaction: transaction,
              verification: (response.data as any)?.verification,
              orderId: orderId,
              reference: trxref
            })

            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
            })

            // Redirect to order details after a short delay
            setTimeout(() => {
              if (orderId) {
                router.push(`/dashboard/orders/${orderId}?from_payment=true&payment_ref=${trxref}`)
              } else {
                router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
              }
            }, 3000)
          } else {
            // Order status not properly updated, try to sync it

            if (orderId) {
              try {
                const syncResponse = await apiService.syncOrderStatus(orderId)

                if (syncResponse && syncResponse.status === 'success') {

                  setVerificationResult({
                    status: 'success',
                    transaction: transaction,
                    verification: (response.data as any)?.verification,
                    orderId: orderId,
                    reference: trxref
                  })

                  toast({
                    title: "Payment Confirmed!",
                    description: "Your payment has been confirmed and order updated.",
                  })

                  setTimeout(() => {
                    router.push(`/dashboard/orders/${orderId}?from_payment=true&payment_ref=${trxref}`)
                  }, 2000)
                } else {
                  // Sync failed, but transaction was successful

                  setVerificationResult({
                    status: 'success',
                    transaction: transaction,
                    verification: (response.data as any)?.verification,
                    orderId: orderId,
                    reference: trxref
                  })

                  toast({
                    title: "Payment Successful!",
                    description: "Payment processed. Order status will update shortly.",
                  })

                  setTimeout(() => {
                    if (orderId) {
                      router.push(`/dashboard/orders/${orderId}?from_payment=true&payment_ref=${trxref}`)
                    } else {
                      router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
                    }
                  }, 3000)
                }
              } catch (syncError) {
                console.error('❌ Order sync failed:', syncError)

                // Still show success since payment was processed
                setVerificationResult({
                  status: 'success',
                  transaction: transaction,
                  verification: (response.data as any)?.verification,
                  orderId: orderId,
                  reference: trxref
                })

                toast({
                  title: "Payment Successful!",
                  description: "Payment processed. Please refresh your orders page.",
                })

                setTimeout(() => {
                  router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
                }, 3000)
              }
            } else {
              // No order ID available

              setVerificationResult({
                status: 'success',
                transaction: transaction,
                verification: (response.data as any)?.verification,
                orderId: undefined,
                reference: trxref
              })

              toast({
                title: "Payment Successful!",
                description: "Your payment has been processed successfully.",
              })

              setTimeout(() => {
                router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
              }, 3000)
            }
          }

        } else {
          // If manual verification fails, try to check if webhook already processed it

          setVerificationResult({
            status: 'pending',
            reference: trxref
          })

          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. Please wait...",
          })

          // Check again after a delay with retry logic
          let retryCount = 0
          const maxRetries = 3

          const retryVerification = async () => {
            retryCount++

            try {
              const retryResponse = await apiService.verifyPayment(trxref, { testMode })
              if (retryResponse && retryResponse.status === 'success') {
                const transaction = (retryResponse.data as any)?.transaction
                const orderData = (retryResponse.data as any)?.order
                const orderId = transaction?.orderId || transaction?.metadata?.order_id


                setVerificationResult({
                  status: 'success',
                  transaction: transaction,
                  verification: (retryResponse.data as any)?.verification,
                  orderId: orderId,
                  reference: trxref
                })

                toast({
                  title: "Payment Confirmed!",
                  description: "Your payment has been confirmed successfully.",
                })

                setTimeout(() => {
                  if (orderId) {
                    router.push(`/dashboard/orders/${orderId}?from_payment=true&payment_ref=${trxref}`)
                  } else {
                    router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
                  }
                }, 2000)
              } else if (retryCount < maxRetries) {
                // Try again
                setTimeout(retryVerification, 3000)
              } else {
                // Max retries reached
                setVerificationResult({
                  status: 'pending',
                  reference: trxref
                })

                toast({
                  title: "Payment Processing",
                  description: "Payment is still being processed. Please check your orders page later.",
                })

                setTimeout(() => {
                  router.push(`/dashboard/orders?from_payment=true&payment_ref=${trxref}`)
                }, 5000)
              }
            } catch (retryError) {
              console.error(`❌ Retry ${retryCount} failed:`, retryError)

              if (retryCount < maxRetries) {
                setTimeout(retryVerification, 3000)
              } else {
                throw new Error('Payment verification failed after multiple attempts')
              }
            }
          }

          // Start retry process after initial delay
          setTimeout(retryVerification, 3000)
        }

      } catch (error: any) {
        console.error('❌ Payment verification error:', error)

        setVerificationResult({
          status: 'failed',
          reference: trxref
        })

        setError(error.message || 'Payment verification failed')

        toast({
          title: "Payment Verification Failed",
          description: error.message || "Unable to verify your payment. Please contact support.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [trxref, testMode, router, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
            {reference && (
              <p className="text-sm text-muted-foreground mt-2">
                Reference: {reference}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verificationResult?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2 text-warning">Payment Processing</h2>
            <p className="text-muted-foreground mb-4">
              Your payment is being processed by our payment provider.
              This may take a few moments...
            </p>
            {reference && (
              <p className="text-sm text-muted-foreground mb-4">
                Reference: {reference}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || verificationResult?.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">Payment Failed</h2>
            <p className="text-muted-foreground mb-4">
              {error || "Your payment could not be processed."}
            </p>
            {reference && (
              <p className="text-sm text-muted-foreground mb-4">
                Reference: {reference}
              </p>
            )}
            <div className="space-y-2">
              <Button onClick={() => window.history.back()} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/orders">
                  View Orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verificationResult?.status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-success">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your payment has been processed successfully.
            </p>
            {verificationResult.transaction && (
              <div className="bg-success/10 p-4 rounded-lg mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Payment Details</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono">{verificationResult.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₦{(verificationResult.transaction.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-success font-medium">Paid</span>
                  </div>
                </div>
              </div>
            )}
            {verificationResult.orderId && (
              <div className="bg-primary/10 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Order Information</span>
                </div>
                <p className="text-sm text-primary">
                  Your order is being processed. You will receive a confirmation email shortly.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to order details in a few seconds...
            </p>
            <div className="space-y-2">
              {verificationResult.orderId && (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/orders/${verificationResult.orderId}`}>
                    View Order Details
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/orders">
                  View All Orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 to-warning/10 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="text-center py-8">
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verification Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to verify payment status.
          </p>
          <Button onClick={() => router.push('/dashboard/orders')} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Orders
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href={`/dashboard/orders?from_payment=true&payment_ref=${reference}`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Orders
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    }>
      <PaymentVerificationContent />
    </Suspense>
  )
}
