"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

/** Brand-aligned confetti palette */
const CONFETTI_COLORS = ["#166534", "#22C55E", "#A3E635", "#15803d", "#D1A84B", "#ffffff"]

const PARTICLE_COUNT = 28

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  color: string
  size: number
  delay: number
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    x: (Math.random() - 0.5) * 520,
    y: -(Math.random() * 320 + 80),
    rotate: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    size: Math.random() * 5 + 4,
    delay: Math.random() * 0.12,
  }))
}

interface ConfettiBurstProps {
  /** Fire once when this becomes true */
  active: boolean
}

/**
 * One-shot celebration burst — fixed particle count, auto-unmounts, no extra deps.
 * Skipped when prefers-reduced-motion is set.
 */
export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const prefersReduced = useReducedMotion()
  const [show, setShow] = useState(false)
  const particles = useMemo(() => (show ? buildParticles() : []), [show])

  useEffect(() => {
    if (!active || prefersReduced) return
    setShow(true)
    const timer = window.setTimeout(() => setShow(false), 2200)
    return () => window.clearTimeout(timer)
  }, [active, prefersReduced])

  if (!show || prefersReduced) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] overflow-hidden"
      aria-hidden
    >
      <div className="absolute left-1/2 top-[28%] -translate-x-1/2">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-[2px] will-change-transform"
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: 0,
              rotate: p.rotate,
              scale: 0.6,
            }}
            transition={{
              duration: 1.6,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </div>
    </div>
  )
}
