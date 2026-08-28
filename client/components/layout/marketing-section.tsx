import * as React from "react"
import { cn } from "@/lib/utils"
import { layout } from "@/lib/design-system"

export interface MarketingSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** hero = taller padding; compact = stats strip */
  spacing?: "default" | "hero" | "compact" | "none"
  container?: boolean
}

export function MarketingSection({
  spacing = "default",
  container = true,
  className,
  children,
  ...props
}: MarketingSectionProps) {
  const spacingClass =
    spacing === "hero"
      ? layout.sectionHeroY
      : spacing === "compact"
        ? layout.sectionCompactY
        : spacing === "none"
          ? ""
          : layout.sectionY

  const content = container ? (
    <PageContainerInner>{children}</PageContainerInner>
  ) : (
    children
  )

  return (
    <section className={cn(spacingClass, className)} {...props}>
      {content}
    </section>
  )
}

function PageContainerInner({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(layout.container, className)}>{children}</div>
}
