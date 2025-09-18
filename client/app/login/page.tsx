import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your GroChain account" showFeatures={true}>
      <Suspense fallback={<div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>}>
        <LoginFormWrapper />
      </Suspense>
    </AuthLayout>
  )
}
