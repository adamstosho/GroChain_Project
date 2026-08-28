"use client"

import { useEffect, useState } from "react"
import Image, { type ImageProps } from "next/image"
import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

const FALLBACK_SRC = "/placeholder-harvest.jpg"

type LoadPhase = "optimized" | "direct" | "placeholder"

interface SafeImageProps extends Omit<ImageProps, "onError" | "src"> {
  src: string
  fallbackSrc?: string
  showIconFallback?: boolean
}

function isExternalUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://")
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = FALLBACK_SRC,
  showIconFallback = false,
  className,
  unoptimized,
  ...props
}: SafeImageProps) {
  const [phase, setPhase] = useState<LoadPhase>("optimized")
  const external = isExternalUrl(src)

  useEffect(() => {
    setPhase("optimized")
  }, [src])

  const handleError = () => {
    setPhase((current) => {
      if (current === "optimized" && external) return "direct"
      return "placeholder"
    })
  }

  if (phase === "placeholder" && showIconFallback) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-muted", className)}>
        <Leaf className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    )
  }

  const imageSrc = phase === "placeholder" ? fallbackSrc : src
  const useUnoptimized = unoptimized || phase === "direct" || phase === "placeholder" || (phase === "optimized" && !external)

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      className={className}
      unoptimized={useUnoptimized}
      onError={handleError}
    />
  )
}
