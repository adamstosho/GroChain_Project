"use client"

import { Children, isValidElement, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { motionDuration, motionEasing } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** Max items that receive individual stagger delay — rest animate together */
const STAGGER_CAP = 12
const STAGGER_STEP = 0.045

interface StaggerGridProps {
  children: ReactNode
  className?: string
  /** Change to re-run entrance (e.g. filter/view change) */
  resetKey?: string | number
}

/**
 * Performance-safe list/grid stagger — caps per-item delay so large catalogs
 * don't queue dozens of sequential animations.
 */
export function StaggerGrid({ children, className, resetKey = "default" }: StaggerGridProps) {
  const prefersReduced = useReducedMotion()
  const items = Children.toArray(children).filter(isValidElement)

  if (prefersReduced) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <motion.div
      key={resetKey}
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 },
        },
      }}
    >
      {items.map((child, index) => (
        <motion.div
          key={child.key ?? index}
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: motionDuration.base,
                ease: motionEasing.entrance,
                delay: Math.min(index, STAGGER_CAP) * STAGGER_STEP,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
