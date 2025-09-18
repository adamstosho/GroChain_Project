"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { CheckCircle, Mail, AlertCircle } from "lucide-react"

function VerifyEmailForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Safely extract parameters with error handling
      const t = params?.get("token")
      const e = params?.get("email")
      const success = params?.get("success")
      const error = params?.get("error")
      const message = params?.get("message")
      
      if (t) setToken(t)
      if (e) setEmail(e)
      
      // Handle redirect from GET endpoint
      if (success === "true") {
        setVerified(true)
        toast({ 
          title: "Email verified successfully!", 
          description: "You can now sign in to your account.",
          variant: "default"
        })
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
      
      if (error === "verification_failed") {
        setVerificationError(message || "Verification failed. Please try again.")
        toast({
          title: "Verification failed",
          description: message || "Verification failed. Please try again.",
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing URL parameters:", error)
      setVerificationError("Invalid verification link format")
      setIsLoading(false)
    }
  }, [params, toast, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setVerificationError("")
    
    try {
      const response = await api.verifyEmail(token)
      setVerified(true)
      toast({ 
        title: "Email verified successfully!", 
        description: "You can now sign in to your account.",
        variant: "default"
      })
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.message || "Invalid or expired verification link."
      setVerificationError(errorMessage)
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setResending(true)
    try {
      await api.resendVerification(email)
      toast({ 
        title: "Verification email sent", 
        description: "Check your inbox for a new verification link.",
        variant: "default"
      })
    } catch (err: any) {
      toast({
        title: "Failed to resend verification",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setResending(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse" />
            </div>
            <CardTitle>Loading verification...</CardTitle>
            <CardDescription>
              Please wait while we load your verification page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            {token 
              ? "Click the button below to verify your email address."
              : "Enter your verification token or request a new one."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {token && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Verification Token</Label>
                <Input 
                  id="token" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  placeholder="Verification token from email"
                  className="font-mono text-sm"
                />
              </div>
              
              {verificationError && (
                <div className="flex items-center space-x-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{verificationError}</span>
                </div>
              )}
              
              <Button type="submit" disabled={!token || submitting} className="w-full">
                {submitting ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">— or —</div>

          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required
              />
            </div>
            
            <Button type="submit" variant="outline" disabled={!email || resending} className="w-full">
              {resending ? "Sending..." : "Resend Verification Link"}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>Didn't receive the email? Check your spam folder.</p>
            <p>Verification links expire in 1 hour.</p>
            <p className="text-blue-600">
              💡 <strong>Tip:</strong> If you're having issues, try opening this link in the same browser where you registered.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}


