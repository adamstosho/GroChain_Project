"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Pause, Play, QrCode, ShoppingBag, ClipboardList, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { defaultTransition, motionEasing } from "@/lib/motion"
import { EXPLAINER_SCENES, type ExplainerSceneId } from "@/lib/explainer-videos"

const sceneIcons: Record<ExplainerSceneId, typeof Sparkles> = {
  intro: Sparkles,
  harvest: ClipboardList,
  qr: QrCode,
  marketplace: ShoppingBag,
  cta: Sparkles,
}

interface AnimatedExplainerProps {
  startIndex?: number
  className?: string
  onComplete?: () => void
}

export function AnimatedExplainer({ startIndex = 0, className, onComplete }: AnimatedExplainerProps) {
  const prefersReduced = useReducedMotion()
  const safeStart = Math.max(0, Math.min(startIndex, EXPLAINER_SCENES.length - 1))
  const [sceneIndex, setSceneIndex] = useState(safeStart)
  const [playing, setPlaying] = useState(true)

  const scene = EXPLAINER_SCENES[sceneIndex] ?? EXPLAINER_SCENES[0]
  const SceneIcon = sceneIcons[scene.id]

  const goNext = useCallback(() => {
    setSceneIndex((prev) => {
      if (prev >= EXPLAINER_SCENES.length - 1) {
        onComplete?.()
        return prev
      }
      return prev + 1
    })
  }, [onComplete])

  const goTo = useCallback((index: number) => {
    setSceneIndex(Math.max(0, Math.min(index, EXPLAINER_SCENES.length - 1)))
  }, [])

  useEffect(() => {
    setSceneIndex(safeStart)
    setPlaying(!prefersReduced)
  }, [safeStart, prefersReduced])

  useEffect(() => {
    if (prefersReduced || !playing) return
    const timer = window.setTimeout(goNext, scene.durationMs)
    return () => window.clearTimeout(timer)
  }, [sceneIndex, scene.durationMs, playing, prefersReduced, goNext])

  if (prefersReduced) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <p className="text-sm text-muted-foreground">
          GroChain in three steps: log harvest, generate QR codes, sell on the marketplace with full traceability.
        </p>
        <ol className="space-y-2 text-sm list-decimal list-inside text-foreground">
          {EXPLAINER_SCENES.filter((s) => s.stepIndex !== undefined).map((s) => (
            <li key={s.id}>
              <span className="font-medium">{s.title}</span> — {s.subtitle}
            </li>
          ))}
        </ol>
        <Button asChild size="sm" className="mt-2">
          <Link href="/register">
            Get started free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("relative flex flex-col", className)}>
      <div
        className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/10"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ ...defaultTransition, ease: motionEasing.entrance }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...defaultTransition }}
              className="relative mb-5 h-24 w-24 sm:h-28 sm:w-28"
            >
              {scene.id === "qr" ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-card shadow-lg">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <QrCode className="h-14 w-14 text-primary" aria-hidden />
                  </motion.div>
                </div>
              ) : (
                <Image
                  src={scene.image}
                  alt={scene.imageAlt}
                  fill
                  className={cn(
                    "object-contain drop-shadow-md",
                    scene.id === "cta" && "p-2",
                  )}
                  sizes="112px"
                  unoptimized={scene.image.endsWith(".png")}
                />
              )}
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft">
                <SceneIcon className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground font-serif">{scene.title}</h3>
            </div>
            <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">{scene.subtitle}</p>

            {scene.id === "cta" && (
              <Button asChild size="sm" className="mt-5 gap-1.5">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        {playing && (
          <motion.div
            key={`progress-${sceneIndex}`}
            className="absolute bottom-0 left-0 h-1 bg-primary motion-reduce:hidden"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: scene.durationMs / 1000, ease: "linear" }}
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="Explainer scenes">
          {EXPLAINER_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === sceneIndex}
              aria-label={`Scene ${i + 1}: ${s.title}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === sceneIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause explainer" : "Play explainer"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
    </div>
  )
}
