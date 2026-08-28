"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExplainerPlayer } from "@/components/marketing/explainer-player"
import { EXPLAINER_VIDEO } from "@/lib/explainer-videos"

interface ExplainerVideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startStepIndex?: number
}

export function ExplainerVideoModal({ open, onOpenChange, startStepIndex }: ExplainerVideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-4 sm:p-6 gap-4">
        <DialogHeader>
          <DialogTitle>{EXPLAINER_VIDEO.title}</DialogTitle>
          <DialogDescription>{EXPLAINER_VIDEO.description}</DialogDescription>
        </DialogHeader>
        {open ? (
          <ExplainerPlayer
            key={startStepIndex ?? "full"}
            startStepIndex={startStepIndex}
            active={open}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
