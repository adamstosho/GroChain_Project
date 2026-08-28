"use client"

import { GroChainBrandMark } from "@/components/ui/grochain-brand-mark"
import { cn } from "@/lib/utils"

interface GroChainLoaderProps {
  message?: string
  /** fullscreen centered overlay vs inline block */
  variant?: "fullscreen" | "inline" | "compact"
  className?: string
}

/**
 * Branded loading indicator — replaces generic CSS spinners across auth & dashboard.
 */
export function GroChainLoader({
  message = "Loading…",
  variant = "inline",
  className,
}: GroChainLoaderProps) {
  const markSize = variant === "compact" ? "sm" : variant === "fullscreen" ? "lg" : "md"

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4 text-center", className)}>
      <GroChainBrandMark size={markSize} rotate showRing glow float />
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse-slow max-w-xs">
          {message}
        </p>
      )}
    </div>
  )

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}
