"use client"

import Image from "next/image"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepVideoPreviewProps {
  poster: string
  title: string
  onPlay: () => void
  className?: string
  /** Avatar-style posters look better with contain; hero art uses cover */
  posterFit?: "cover" | "contain"
}

export function StepVideoPreview({
  poster,
  title,
  onPlay,
  className,
  posterFit = "cover",
}: StepVideoPreviewProps) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        "group relative mb-5 w-full aspect-[16/10] overflow-hidden rounded-xl border border-border/60 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`Watch how it works: ${title}`}
    >
      <Image
        src={poster}
        alt=""
        fill
        className={cn(
          "transition-transform duration-500 group-hover:scale-105",
          posterFit === "contain" ? "object-contain p-4" : "object-cover",
        )}
        sizes="(min-width: 768px) 33vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="h-5 w-5 fill-current ml-0.5" aria-hidden />
        </span>
      </div>
      <span className="absolute bottom-2.5 left-3 text-xs font-medium text-white/90">Watch step</span>
    </button>
  )
}
