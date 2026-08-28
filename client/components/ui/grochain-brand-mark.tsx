"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { motionDuration, motionEasing } from "@/lib/motion"

export type BrandMarkSize = "sm" | "md" | "lg" | "xl" | "hero"

const sizeMap: Record<BrandMarkSize, { box: string; image: number; ring: string }> = {
  sm: { box: "h-16 w-16", image: 64, ring: "inset-[-6px]" },
  md: { box: "h-24 w-24", image: 96, ring: "inset-[-8px]" },
  lg: { box: "h-32 w-32", image: 128, ring: "inset-[-10px]" },
  xl: { box: "h-40 w-40", image: 160, ring: "inset-[-12px]" },
  hero: { box: "h-48 w-48 sm:h-56 sm:w-56", image: 224, ring: "inset-[-14px]" },
}

interface GroChainBrandMarkProps {
  size?: BrandMarkSize
  rotate?: boolean
  showRing?: boolean
  float?: boolean
  glow?: boolean
  className?: string
}

/** True transparent PNG — black matte removed at build time (see scripts/knockout-logo-background.js) */
const LOGO_SRC = "/grochain-logo-3d.png"

export function GroChainBrandMark({
  size = "md",
  rotate = true,
  showRing = true,
  float = false,
  glow = true,
  className,
}: GroChainBrandMarkProps) {
  const prefersReduced = useReducedMotion()
  const dims = sizeMap[size]

  const logoContent = (
    <Image
      src={LOGO_SRC}
      alt="GroChain"
      width={dims.image}
      height={dims.image}
      className="relative z-10 h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(22,101,52,0.28)]"
      priority
      unoptimized
    />
  )

  if (prefersReduced) {
    return (
      <div className={cn("relative flex items-center justify-center", dims.box, className)}>
        {logoContent}
      </div>
    )
  }

  return (
    <div className={cn("relative flex items-center justify-center", dims.box, className)}>
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.85, 1.05, 0.85] }}
          transition={{
            duration: motionDuration.logoFloat,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      )}

      {showRing && (
        <motion.div
          className={cn(
            "absolute rounded-full border-2 border-dashed border-primary/30",
            dims.ring
          )}
          animate={rotate ? { rotate: 360 } : undefined}
          transition={
            rotate
              ? {
                  duration: motionDuration.logoSpin * 1.5,
                  repeat: Infinity,
                  ease: motionEasing.loop,
                }
              : undefined
          }
          aria-hidden
        />
      )}

      <motion.div
        className={cn("relative h-full w-full", dims.box)}
        animate={{
          ...(rotate ? { rotateY: [0, 360] } : {}),
          ...(float ? { y: [0, -8, 0] } : {}),
        }}
        transition={{
          rotateY: rotate
            ? {
                duration: motionDuration.logoSpin,
                repeat: Infinity,
                ease: motionEasing.loop,
              }
            : undefined,
          y: float
            ? {
                duration: motionDuration.logoFloat,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : undefined,
        }}
        style={{ transformStyle: "preserve-3d", perspective: 800 }}
      >
        {logoContent}
      </motion.div>
    </div>
  )
}
