"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatedExplainer } from "@/components/marketing/animated-explainer"
import { EXPLAINER_VIDEO, EXPLAINER_VIDEO_ENABLED, getSceneStartIndex } from "@/lib/explainer-videos"
import { cn } from "@/lib/utils"

interface ExplainerPlayerProps {
  startStepIndex?: number
  className?: string
  active?: boolean
}

type PlayerMode = "animated" | "video"

/** Cached per session — avoids repeated 404 HEAD requests when no video file exists yet. */
let cachedVideoAvailable: boolean | null = null

async function probeVideoAvailability(): Promise<boolean> {
  if (cachedVideoAvailable !== null) return cachedVideoAvailable
  if (!EXPLAINER_VIDEO_ENABLED) {
    cachedVideoAvailable = false
    return false
  }
  try {
    const res = await fetch(EXPLAINER_VIDEO.mp4, { method: "HEAD" })
    cachedVideoAvailable = res.ok
  } catch {
    cachedVideoAvailable = false
  }
  return cachedVideoAvailable
}

export function ExplainerPlayer({ startStepIndex, className, active = true }: ExplainerPlayerProps) {
  const [mode, setMode] = useState<PlayerMode>("animated")
  const [checking, setChecking] = useState(false)

  const sceneStart = getSceneStartIndex(startStepIndex)

  const resolveMode = useCallback(async () => {
    setChecking(true)
    const available = await probeVideoAvailability()
    setMode(available ? "video" : "animated")
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!active) return
    void resolveMode()
  }, [active, resolveMode])

  if (checking) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-xl bg-muted/50 motion-safe:animate-pulse",
          className,
        )}
        aria-busy="true"
        aria-label="Loading explainer"
      />
    )
  }

  if (mode === "video") {
    return (
      <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-black", className)}>
        <video
          className="h-full w-full object-contain"
          poster={EXPLAINER_VIDEO.poster}
          controls
          playsInline
          preload="none"
          aria-label={EXPLAINER_VIDEO.title}
          onError={() => {
            cachedVideoAvailable = false
            setMode("animated")
          }}
        >
          <source src={EXPLAINER_VIDEO.webm} type="video/webm" />
          <source src={EXPLAINER_VIDEO.mp4} type="video/mp4" />
          <track kind="captions" src={EXPLAINER_VIDEO.vtt} srcLang="en" label="English" />
        </video>
      </div>
    )
  }

  return (
    <AnimatedExplainer
      key={`explainer-${startStepIndex ?? "full"}-${active}`}
      startIndex={sceneStart}
      className={className}
    />
  )
}
