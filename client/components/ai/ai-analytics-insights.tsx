"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAi } from "@/hooks/use-ai"
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, ShieldCheck } from "lucide-react"
import { formatCompactCurrency } from "@/lib/format"

export function AiAnalyticsInsights() {
  const { getGrowthForecast, loading } = useAi()
  const [forecast, setForecast] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await getGrowthForecast()
      if (!cancelled) setForecast(data)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading && !forecast) {
    return (
      <Card className="border border-border shadow-sm bg-gradient-to-br from-primary/10 via-card to-primary/5 animate-pulse h-[300px]">
        <CardContent className="flex items-center justify-center h-full">
          <Brain className="h-10 w-10 text-primary/40 animate-bounce" aria-hidden />
          <span className="sr-only">Loading growth insights</span>
        </CardContent>
      </Card>
    )
  }

  const forecastedRevenue = Number(forecast?.forecastedRevenue)
  const insights = Array.isArray(forecast?.insights)
    ? forecast.insights.filter((item: string) => typeof item === "string" && !/\bNaN\b/.test(item))
    : []
  const growthIndicator = forecast?.growthIndicator === "falling" ? "falling" : "rising"
  const confidence = typeof forecast?.confidence === "number" ? forecast.confidence : 0

  if (!forecast || Number.isNaN(forecastedRevenue)) return null

  return (
    <Card className="relative overflow-hidden border border-border bg-card shadow-sm group">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <CardHeader className="relative z-10 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
              <Brain className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Growth insights
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                30-day advisory from your harvests, listings, and paid sales
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-widest px-2 py-1">
            Rules v2
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                30-day revenue outlook
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold text-foreground">
                  {formatCompactCurrency(forecastedRevenue)}
                </h2>
                <div
                  className={`flex items-center gap-1 text-xs font-bold ${
                    growthIndicator === "rising" ? "text-success" : "text-destructive"
                  }`}
                >
                  {growthIndicator === "rising" ? (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  )}
                  {growthIndicator.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                <span>Data confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <Progress value={confidence * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">
                Confidence scales with how much of your own sales history is available — not a model accuracy claim.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recommendations
            </p>
            <div className="space-y-2">
              {insights.map((insight: string, i: number) => (
                <div
                  key={`${i}-${insight.slice(0, 24)}`}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="mt-0.5">
                    {i === 0 ? (
                      <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                    ) : i === 1 ? (
                      <Target className="h-4 w-4 text-primary" aria-hidden />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-warning" aria-hidden />
                    )}
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
            ADVISORY ONLY — NOT A LOAN OR PRICE GUARANTEE
          </div>
          <div className="h-1 w-1 rounded-full bg-border" aria-hidden />
          <div className="text-[10px] font-medium text-muted-foreground max-w-prose">
            {forecast.disclaimer ||
              "Calculated from your GroChain records with transparent rules, not a neural network."}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
