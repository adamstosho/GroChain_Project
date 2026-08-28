/** Dashboard routes are auth-gated and client-heavy — skip static prerender. */
export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
