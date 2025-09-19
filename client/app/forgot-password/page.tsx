"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.forgotPassword(email)
      toast({ title: "Email sent", description: "Check your inbox for a reset link." })
      router.push("/login")
    } catch (err: any) {
      toast({ title: "Request failed", description: err?.message || "Try again later.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>We’ll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


