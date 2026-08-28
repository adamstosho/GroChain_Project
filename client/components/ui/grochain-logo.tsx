"use client"

import React from "react"
import Image from "next/image"
import { GroChainBrandMark } from "@/components/ui/grochain-brand-mark"
import { cn } from "@/lib/utils"

interface GroChainLogoProps {
  variant?: "full" | "icon" | "text"
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
  /** Use high-fidelity 3D mark with rotation (hero surfaces) */
  brand3d?: boolean
  className?: string
}

/**
 * Official GroChain logo — designed brand identity (globe network + leaf + chain).
 * Assets: /logo-icon.png (mark), /logo-full.png (horizontal lockup with tagline).
 * Regenerated via `npm run generate:icons` from design/03-brand-assets/logo/source/.
 */
export function GroChainLogo({
  variant = "full",
  size = "md",
  animated = false,
  brand3d = false,
  className,
}: GroChainLogoProps) {
  if (brand3d) {
    const brandSize = size === "sm" ? "sm" : size === "lg" ? "lg" : size === "xl" ? "xl" : "md"
    return (
      <GroChainBrandMark
        size={brandSize}
        rotate={animated}
        showRing
        glow
        float={animated}
        className={className}
      />
    )
  }
  const iconBox = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const fullBox = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-14 w-auto",
    xl: "h-20 w-auto",
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  const pulse = animated ? "animate-pulse-slow" : undefined

  if (variant === "icon") {
    return (
      <div className={cn("relative flex items-center justify-center", iconBox[size], className, pulse)}>
        <Image
          src="/logo-icon.png"
          alt="GroChain"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 48px, 64px"
          priority
        />
      </div>
    )
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight text-[#166534]", textSizes[size], className)}>
        GroChain
      </span>
    )
  }

  return (
    <div className={cn("relative flex items-center", fullBox[size], className, pulse)}>
      <Image
        src="/logo-full.png"
        alt="GroChain — Building Trust in Nigeria's Food Chain"
        width={320}
        height={100}
        className="h-full w-auto object-contain object-left"
        sizes="(max-width: 768px) 160px, 240px"
        priority
      />
    </div>
  )
}
