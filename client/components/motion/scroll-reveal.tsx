"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import {
  defaultTransition,
  fadeIn,
  fadeUp,
  scaleIn,
  slideFromLeft,
  slideFromRight,
} from "@/lib/motion"
import { cn } from "@/lib/utils"

type ScrollRevealVariant = "fadeUp" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight"

const variantMap = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideLeft: slideFromLeft,
  slideRight: slideFromRight,
}

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: ScrollRevealVariant
  /** Viewport margin — negative triggers slightly before element enters view */
  margin?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  margin = "0px 0px -40px 0px",
  once = true,
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin, amount: 0.12 }}
      variants={variantMap[variant]}
      transition={{ ...defaultTransition, delay }}
    >
      {children}
    </motion.div>
  )
}
