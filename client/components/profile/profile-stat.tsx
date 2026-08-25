"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ProfileStatProps {
  icon: LucideIcon
  label: string
  value: string | number
  colorClassName?: string
  className?: string
}

export function ProfileStat({ icon: Icon, label, value, colorClassName, className }: ProfileStatProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4", className)}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-10 sm:w-10",
          colorClassName
        )}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
        <p className="break-words text-sm font-bold leading-tight text-foreground sm:text-lg">{value}</p>
      </div>
    </div>
  )
}

export function ProfileStatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4", className)}>{children}</div>
  )
}
