import type { ReactNode } from "react"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export interface DashboardSubpageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Compact page header for dashboard sub-pages without the full hero banner */
export function DashboardSubpageHeader({
  title,
  description,
  actions,
  className,
}: DashboardSubpageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={layout.stackSm}>
        <Display as="h1" variant="page">
          {title}
        </Display>
        {description ? (
          typeof description === "string" ? (
            <Text variant="sm">{description}</Text>
          ) : (
            description
          )
        ) : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}
