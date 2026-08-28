import * as React from "react"
import { cn } from "@/lib/utils"
import { layout } from "@/lib/design-system"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "marketing" | "dashboard" | "narrow"
}

export function PageContainer({
  variant = "marketing",
  className,
  ...props
}: PageContainerProps) {
  const variantClass =
    variant === "dashboard"
      ? layout.containerDashboard
      : variant === "narrow"
        ? layout.containerNarrow
        : layout.container

  return <div className={cn(variantClass, className)} {...props} />
}
