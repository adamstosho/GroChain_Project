"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProfileSectionCardProps {
  icon: LucideIcon
  title: string
  description?: string
  iconClassName?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ProfileSectionCard({
  icon: Icon,
  title,
  description,
  iconClassName,
  action,
  children,
  className,
}: ProfileSectionCardProps) {
  return (
    <Card className={cn("border border-border transition-shadow duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
