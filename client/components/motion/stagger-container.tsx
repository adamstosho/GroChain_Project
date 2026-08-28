"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import { staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  as?: "div" | "section" | "ul"
  margin?: string
  once?: boolean
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className, as = "div" }: StaggerContainerProps) {
  const prefersReduced = useReducedMotion()
  const Component = motion[as]

  if (prefersReduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </Component>
  )
}

/** Stagger children as they scroll into view */
export function ScrollStagger({
  children,
  className,
  as = "div",
  margin = "0px 0px -40px 0px",
  once = true,
}: StaggerContainerProps) {
  const prefersReduced = useReducedMotion()
  const Component = motion[as]

  if (prefersReduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin, amount: 0.12 }}
      variants={staggerContainer}
    >
      {children}
    </Component>
  )
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={cn(className)} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
