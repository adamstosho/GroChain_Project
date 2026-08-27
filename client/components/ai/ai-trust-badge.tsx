"use client"

import { useEffect, useState } from "react"
import { useAi, TrustScoreData } from "@/hooks/use-ai"
import { ShieldCheck, ShieldAlert, Shield, RefreshCw } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface AiTrustBadgeProps {
  userId: string
  showLabel?: boolean
  className?: string
}

export function AiTrustBadge({ userId, showLabel = true, className = "" }: AiTrustBadgeProps) {
  const { getTrustScore } = useAi()
  const [data, setData] = useState<TrustScoreData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const scoreData = await getTrustScore(userId, { silent: true })
      if (!cancelled) {
        setData(scoreData)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when identity changes
  }, [userId])

  if (loading && !data) {
    return (
      <RefreshCw
        className="h-4 w-4 animate-spin text-muted-foreground"
        aria-label="Loading trust score"
      />
    )
  }

  if (!data) return null

  const getBadgeConfig = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return {
          icon: ShieldCheck,
          color: "bg-success/10 text-success border-success/20",
          label: "Highly Trusted",
          desc: "Strong delivery and review history on GroChain.",
        }
      case "B+":
      case "B":
        return {
          icon: Shield,
          color: "bg-primary/10 text-primary border-primary/20",
          label: "Good Standing",
          desc: "Solid platform standing with consistent activity.",
        }
      default:
        return {
          icon: ShieldAlert,
          color: "bg-warning/10 text-warning border-warning/20",
          label: "Building Trust",
          desc: "Limited history — score leans on verification and account age.",
        }
    }
  }

  const config = getBadgeConfig(data.grade)
  const Icon = config.icon
  const successLabel =
    data.metrics.successRate == null ? "—" : `${data.metrics.successRate}%`
  const ratingLabel =
    data.metrics.avgRating == null ? "—" : `${data.metrics.avgRating}/5`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 cursor-help ${className}`}>
            <Badge
              variant="outline"
              className={`${config.color} font-bold px-2 py-0.5 border flex items-center gap-1`}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {showLabel && <span>{config.label}</span>}
              <span className="ml-1 opacity-70">{data.score}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] p-3">
          <div className="space-y-1.5 text-xs">
            <p className="font-bold border-b pb-1">Trust analysis</p>
            <p>{config.desc}</p>
            <div className="grid grid-cols-2 gap-1 pt-1 opacity-80">
              <span>Success:</span>
              <span className="text-right">{successLabel}</span>
              <span>Rating:</span>
              <span className="text-right">{ratingLabel}</span>
              <span>Orders:</span>
              <span className="text-right">{data.metrics.totalTransactions}</span>
            </div>
            <p className="pt-1 text-[10px] text-muted-foreground">
              {data.disclaimer ||
                "Advisory score from platform orders and reviews — not a credit guarantee."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
