"use client"

import { useEffect, useState } from "react"
import { useAi, TrustScoreData } from "@/hooks/use-ai"
import { ShieldCheck, ShieldAlert, Shield, Info, RefreshCw } from "lucide-react"
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
  const { getTrustScore, loading } = useAi()
  const [data, setData] = useState<TrustScoreData | null>(null)

  useEffect(() => {
    if (userId) {
      loadScore()
    }
  }, [userId])

  const loadScore = async () => {
    const scoreData = await getTrustScore(userId)
    setData(scoreData)
  }

  if (loading && !data) {
    return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  if (!data) return null

  const getBadgeConfig = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return { 
          icon: ShieldCheck, 
          color: "bg-success/10 text-success border-success/20", 
          label: "Highly Trusted",
          desc: "AI verified: Exceptional transaction history and identity."
        }
      case 'B+':
      case 'B':
        return { 
          icon: Shield, 
          color: "bg-primary/10 text-primary border-primary/20", 
          label: "Verified Partner",
          desc: "AI verified: Good standing with consistent performance."
        }
      default:
        return { 
          icon: ShieldAlert, 
          color: "bg-warning/10 text-warning border-warning/20", 
          label: "New/Reviewing",
          desc: "AI notice: User is relatively new or has limited history."
        }
    }
  }

  const config = getBadgeConfig(data.grade)
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 cursor-help ${className}`}>
            <Badge variant="outline" className={`${config.color} font-bold px-2 py-0.5 border flex items-center gap-1`}>
              <Icon className="h-3 w-3" />
              {showLabel && <span>{config.label}</span>}
              <span className="ml-1 opacity-70">{data.score}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] p-3">
          <div className="space-y-1.5 text-xs">
            <p className="font-bold border-b pb-1">AI Trust Analysis</p>
            <p>{config.desc}</p>
            <div className="grid grid-cols-2 gap-1 pt-1 opacity-80">
              <span>Success:</span> <span className="text-right">{data.metrics.successRate}%</span>
              <span>Rating:</span> <span className="text-right">{data.metrics.avgRating}/5</span>
            </div>
            <p className="pt-1 text-[10px] text-muted-foreground">Score generated in real-time from blockchain and txn history.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
