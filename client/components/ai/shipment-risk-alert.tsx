"use client"

import { useEffect, useState } from "react"
import { useAi } from "@/hooks/use-ai"
import { AlertCircle, ShieldCheck, Thermometer, Clock, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShipmentRiskAlertProps {
  shipmentId: string
  className?: string
}

export function ShipmentRiskAlert({ shipmentId, className = "" }: ShipmentRiskAlertProps) {
  const { getShipmentRisk } = useAi()
  const [riskData, setRiskData] = useState<any>(null)

  useEffect(() => {
    if (!shipmentId) return
    let cancelled = false
    ;(async () => {
      const data = await getShipmentRisk(shipmentId)
      if (!cancelled) setRiskData(data)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId])

  if (!riskData) return null

  const getRiskUI = (level: string) => {
    switch (level) {
      case "Critical":
        return {
          color: "text-destructive bg-destructive/10 border-destructive/10",
          icon: AlertCircle,
          label: "High spoilage risk",
        }
      case "Moderate":
        return {
          color: "text-warning bg-warning/10 border-warning/10",
          icon: AlertCircle,
          label: "Moderate risk",
        }
      default:
        return {
          color: "text-success bg-success/5 border-success/10",
          icon: ShieldCheck,
          label: "Route looks normal",
        }
    }
  }

  const ui = getRiskUI(riskData.riskLevel)
  const Icon = ui.icon
  const distanceLabel =
    typeof riskData.distance === "number" ? `${riskData.distance}km` : "—"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 p-2 rounded-xl border ${ui.color} ${className} cursor-help transition-all hover:shadow-sm`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{ui.label}</span>
                <span className="text-[10px] opacity-70">{distanceLabel}</span>
              </div>
            </div>
            <HelpCircle className="h-3 w-3 opacity-30" aria-hidden />
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-[260px]">
          <div className="space-y-2 text-xs">
            <p className="font-bold border-b pb-1">Logistics risk advisory</p>
            <p>{riskData.recommendation}</p>
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2 opacity-80">
                <Clock className="h-3 w-3" aria-hidden />
                <span>Past ETA: {riskData.isDelayed ? "Yes (+40)" : "No"}</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Thermometer className="h-3 w-3" aria-hidden />
                <span>Risk score: {riskData.riskScore}/100</span>
              </div>
            </div>
            {Array.isArray(riskData.factors) && riskData.factors.length > 0 && (
              <ul className="list-disc pl-4 opacity-80">
                {riskData.factors.slice(0, 4).map((f: any) => (
                  <li key={f.code}>{f.detail}</li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground pt-1">
              {riskData.disclaimer ||
                "Rule-based advisory from distance, cold chain, and delivery timing."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
