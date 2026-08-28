"use client"

import type { ReactNode } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { motionEasing } from "@/lib/motion"
import { cn } from "@/lib/utils"

interface CartBadgeProps {
  count: number
  className?: string
}

/** Animated cart count — spring pop on change, hidden at zero */
export function CartBadge({ count, className }: CartBadgeProps) {
  const prefersReduced = useReducedMotion()
  const label = count > 99 ? "99+" : String(count)

  if (prefersReduced) {
    if (count <= 0) return null
    return (
      <span
        className={cn(
          "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium",
          className
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <AnimatePresence mode="popLayout">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.6 }}
          className={cn(
            "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium origin-center",
            className
          )}
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

interface SidebarAccordionPanelProps {
  open: boolean
  children: ReactNode
  className?: string
}

/** Height + opacity accordion — buyer sidebar sections */
export function SidebarAccordionPanel({ open, children, className }: SidebarAccordionPanelProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return open ? <div className={className}>{children}</div> : null
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: motionEasing.entrance }}
          className="overflow-hidden"
        >
          <div className={className}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
