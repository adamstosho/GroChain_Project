"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { ExplainerVideoModal } from "@/components/marketing/explainer-video-modal"

interface ExplainerVideoContextValue {
  openExplainer: (startStepIndex?: number) => void
  closeExplainer: () => void
}

const ExplainerVideoContext = createContext<ExplainerVideoContextValue | null>(null)

export function ExplainerVideoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [startStepIndex, setStartStepIndex] = useState<number | undefined>(undefined)

  const openExplainer = useCallback((step?: number) => {
    setStartStepIndex(step)
    setOpen(true)
  }, [])

  const closeExplainer = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({ openExplainer, closeExplainer }),
    [openExplainer, closeExplainer],
  )

  return (
    <ExplainerVideoContext.Provider value={value}>
      {children}
      <ExplainerVideoModal
        open={open}
        onOpenChange={setOpen}
        startStepIndex={startStepIndex}
      />
    </ExplainerVideoContext.Provider>
  )
}

export function useExplainerVideo() {
  const ctx = useContext(ExplainerVideoContext)
  if (!ctx) {
    throw new Error("useExplainerVideo must be used within ExplainerVideoProvider")
  }
  return ctx
}
