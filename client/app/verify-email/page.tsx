"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { api } from "@/lib/api"
import { CheckCircle, Mail, AlertCircle } from "lucide-react"

function VerifyEmailForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const e = params?.get("email")
    const verified = params?.get("verified")
    if (e) setEmail(e)
    if (verified === "1") {
      setVerified(true)
      setSuccessMessage("Email verified successfully! You can now sign in to your account.")
      setTimeout(() => router.push("/login"), 3000)
    }
    setIsLoading(false)
  }, [params, router])

  const handleVerify = async (e?: React.FormEvent, overrideCode?: string) => {
    e?.preventDefault()
    const otp = (overrideCode ?? code).replace(/\D/g, "")
    if (!email || otp.length !== 6) return

    setSubmitting(true)
    setVerificationError("")

    try {
      await api.verifyEmail(email, otp)
      setVerified(true)
      setSuccessMessage("Email verified successfully! You can now sign in to your account.")
      setTimeout(() => router.push("/login"), 3000)
    } catch (err: any) {
      setVerificationError(err?.message || "Invalid or expired verification code.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setResending(true)
    setVerificationError("")
    try {
      await api.resendVerification(email)
      setSuccessMessage("A new 6-digit code was sent to your email.")
      setCode("")
    } catch (err: any) {
      setVerificationError(err?.message || "Please try again later.")
    } finally {
      setResending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <div className="h-8 w-8 animate-pulse rounded-full bg-primary" />
            </div>
            <CardTitle>Loading verification...</CardTitle>
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-success">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been verified. Redirecting you to sign in...
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to your inbox. It expires in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage && (
            <div className="flex items-center space-x-2 rounded-md border border-success/10 bg-success/10 p-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-sm text-success">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Verification code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value)
                    if (value.length === 6 && email) {
                      void handleVerify(undefined, value)
                    }
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Check your inbox and spam folder for an email from GroChain.
              </p>
            </div>

            {verificationError && (
              <div className="flex items-center space-x-2 rounded-md border border-destructive/10 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={!email || code.length !== 6 || submitting}
              className="w-full"
            >
              {submitting ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">— or —</div>

          <form onSubmit={handleResend} className="space-y-3">
            <Button
              type="submit"
              variant="outline"
              disabled={!email || resending}
              className="w-full"
            >
              {resending ? "Sending..." : "Resend code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
