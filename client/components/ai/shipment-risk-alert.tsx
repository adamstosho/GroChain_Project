"use client"

import { useEffect, useState } from "react"
import { useAi } from "@/hooks/use-ai"
import { AlertCircle, ShieldCheck, Thermometer, Clock, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
    if (shipmentId) {
      loadRisk()
    }
  }, [shipmentId])

  const loadRisk = async () => {
    const data = await getShipmentRisk(shipmentId)
    setRiskData(data)
  }

  if (!riskData) return null

  const getRiskUI = (level: string) => {
    switch (level) {
      case 'Critical':
        return { color: 'text-destructive bg-destructive/10 border-destructive/10', icon: AlertCircle, label: 'High Spoilage Risk' }
      case 'Moderate':
        return { color: 'text-warning bg-warning/10 border-warning/10', icon: AlertCircle, label: 'Moderate Risk' }
      default:
        return { color: 'text-success bg-success/5 border-success/10', icon: ShieldCheck, label: 'AI Secure Route' }
    }
  }

  const ui = getRiskUI(riskData.riskLevel)
  const Icon = ui.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 p-2 rounded-xl border ${ui.color} ${className} cursor-help transition-all hover:shadow-sm`}>
            <Icon className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">{ui.label}</span>
                <span className="text-[10px] opacity-70">{riskData.distance}km</span>
              </div>
            </div>
            <HelpCircle className="h-3 w-3 opacity-30" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-[240px]">
          <div className="space-y-2 text-xs">
            <p className="font-bold border-b pb-1">AI Logistics Analysis</p>
            <p>{riskData.recommendation}</p>
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2 opacity-80">
                <Clock className="h-3 w-3" />
                <span>Delay Impact: {riskData.isDelayed ? '+40pts' : '0pts'}</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Thermometer className="h-3 w-3" />
                <span>Environmental Risk: {riskData.riskScore > 30 ? 'Elevated' : 'Stable'}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
