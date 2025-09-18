import { RegisterForm } from "@/components/auth/register-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Join GroChain"
      subtitle="Choose your role in Nigeria's digital agriculture platform"
      showFeatures={false}
    >
      <RegisterForm />
    </AuthLayout>
  )
}
