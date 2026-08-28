"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { GroChainBrandMark } from "@/components/ui/grochain-brand-mark"
import { defaultTransition, motionEasing } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  /** Show rotating 3D brand mark instead of lucide icon */
  branded?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  branded = false,
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...defaultTransition, ease: motionEasing.entrance }}
    >
      {branded ? (
        <div className="mb-6">
          <GroChainBrandMark size="md" rotate showRing glow={false} />
        </div>
      ) : (
        <motion.div
          animate={prefersReduced ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        </motion.div>
      )}
      <Display as="h3" variant="card" className="mb-2">
        {title}
      </Display>
      {description ? (
        typeof description === "string" ? (
          <Text variant="sm" className="max-w-md">
            {description}
          </Text>
        ) : (
          description
        )
      ) : null}
      {action ? (
        <motion.div
          className={cn("mt-4 flex justify-center", layout.actionsRow)}
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {action}
        </motion.div>
      ) : null}
    </motion.div>
  )
}
