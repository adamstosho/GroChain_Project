"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface DashboardPageHeaderProps {
  badge: string
  title: string
  titleHighlight?: string
  description: ReactNode
  lastUpdated?: Date | null
  actions?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Shared dashboard hero — uses app theme tokens (light agricultural palette by default).
 * Avoid hardcoded dark (slate-900) blocks so dashboards stay visually consistent.
 */
export function DashboardPageHeader({
  badge,
  title,
  titleHighlight,
  description,
  lastUpdated,
  actions,
  footer,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-10 shadow-sm",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-secondary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              {badge}
            </Badge>
            {lastUpdated && (
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
                Real-time
              </span>
            )}
          </div>

          <div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
              {titleHighlight ? (
                <>
                  {" "}
                  <span className="text-primary">{titleHighlight}</span>
                </>
              ) : null}
            </h1>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          {footer ? <div className="pt-1">{footer}</div> : null}
        </div>

        {actions ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
