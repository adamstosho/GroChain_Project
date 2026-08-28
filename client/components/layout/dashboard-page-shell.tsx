import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { dashboard as dashboardLayout } from "@/lib/design-system"

export interface DashboardPageShellProps {
  children: ReactNode
  className?: string
}

/** Standard vertical rhythm wrapper for dashboard page content */
export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return <div className={cn(dashboardLayout.pageStack, className)}>{children}</div>
}
