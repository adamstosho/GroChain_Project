import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2 min-w-0 flex-1">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="pb-3 sm:pb-4">
        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold truncate">{value}</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-1 sm:gap-0">
          <p className="text-xs text-muted-foreground truncate min-w-0 flex-1">{description}</p>
          {trend && (
            <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs w-fit flex-shrink-0">
              {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
