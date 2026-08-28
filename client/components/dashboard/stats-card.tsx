"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { defaultTransition, motionEasing } from "@/lib/motion"
import { Text } from "@/components/ui/typography"
import { textStyles } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  index?: number
}

export function StatsCard({ title, value, description, icon: Icon, trend, index = 0 }: StatsCardProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...defaultTransition, delay: index * 0.07, ease: motionEasing.entrance }}
      whileHover={prefersReduced ? undefined : { y: -2 }}
    >
      <Card className="h-full transition-shadow duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn(textStyles.caption, "min-w-0 flex-1 truncate pr-2 font-medium sm:text-sm")}>{title}</CardTitle>
          <motion.div
            whileHover={prefersReduced ? undefined : { scale: 1.12, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </motion.div>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-4">
          <div className={cn(textStyles.stat, "truncate text-foreground")}>{value}</div>
          <div className="mt-2 flex flex-col justify-between gap-1 sm:flex-row sm:items-center sm:gap-0">
            <Text variant="caption" className="min-w-0 flex-1 truncate">
              {description}
            </Text>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs w-fit flex-shrink-0">
                {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trend.value}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
