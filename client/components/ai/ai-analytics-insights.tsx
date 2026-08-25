"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAi } from "@/hooks/use-ai"
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, ShieldCheck } from "lucide-react"

export function AiAnalyticsInsights() {
  const { getGrowthForecast, loading } = useAi()
  const [forecast, setForecast] = useState<any>(null)

  useEffect(() => {
    const fetch = async () => {
      const data = await getGrowthForecast()
      setForecast(data)
    }
    fetch()
  }, [])

  if (loading && !forecast) {
    return (
      <Card className="border border-border shadow-sm bg-gradient-to-br from-primary/10 via-card to-primary/5 animate-pulse h-[300px]">
        <CardContent className="flex items-center justify-center h-full">
          <Brain className="h-10 w-10 text-primary/40 animate-bounce" />
        </CardContent>
      </Card>
    )
  }

  if (!forecast) return null

  return (
    <Card className="relative overflow-hidden border border-border bg-card shadow-sm group">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <CardHeader className="relative z-10 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                GroChain AI Insights
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Real-time predictive growth analytics
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-widest px-2 py-1">
            Engine v2.1
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  30-Day Revenue Forecast
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    ₦{forecast.forecastedRevenue.toLocaleString()}
                  </h2>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold ${
                      forecast.growthIndicator === "rising" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {forecast.growthIndicator === "rising" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {forecast.growthIndicator.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                <span>Confidence Level</span>
                <span>{Math.round(forecast.confidence * 100)}%</span>
              </div>
              <Progress value={forecast.confidence * 100} className="h-1.5" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Strategic Recommendations
            </p>
            <div className="space-y-2">
              {forecast.insights.map((insight: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="mt-0.5">
                    {i === 0 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : i === 1 ? (
                      <Target className="h-4 w-4 text-primary" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-warning" />
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
            <ShieldCheck className="h-3 w-3 text-primary" />
            SECURE DATA FUSION ACTIVE
          </div>
          <div className="h-1 w-1 rounded-full bg-border" aria-hidden />
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <Target className="h-3 w-3 text-primary" />
            NEURAL NETWORK RE-TRAINED 2H AGO
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
