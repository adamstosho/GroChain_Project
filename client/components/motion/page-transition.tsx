"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import { defaultTransition, pageTransition } from "@/lib/motion"

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      transition={defaultTransition}
    >
      {children}
    </motion.div>
  )
}
