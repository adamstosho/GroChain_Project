import { Suspense } from "react"
import { GroChainLoader } from "@/components/ui/grochain-loader"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export const dynamic = "force-dynamic"

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your GroChain account" showFeatures={true}>
      <Suspense fallback={<GroChainLoader message="Preparing sign in…" variant="inline" className="py-8" />}>
        <LoginFormWrapper />
      </Suspense>
    </AuthLayout>
  )
}
