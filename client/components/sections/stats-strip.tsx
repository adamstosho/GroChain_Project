"use client"

import { ScrollStagger, StaggerItem } from "@/components/motion/stagger-container"
import { Leaf, QrCode, ShieldCheck, Users } from "lucide-react"
import { layout } from "@/lib/design-system"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

const stats = [
  {
    icon: Users,
    value: "3 roles",
    label: "One platform",
    description: "Farmers, buyers & partners",
  },
  {
    icon: QrCode,
    value: "QR",
    label: "Batch traceability",
    description: "Scan before you pay",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Verified records",
    description: "Farm to buyer trail",
  },
  {
    icon: Leaf,
    value: "NG",
    label: "Built in Nigeria",
    description: "For local produce",
  },
]

export function StatsStrip() {
  return (
    <section className="relative border-y border-border/60 bg-card/80 backdrop-blur-sm">
      <div className={cn("container", layout.containerX, layout.sectionCompactY)}>
        <ScrollStagger className={layout.gridStats}>
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="group flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors hover:bg-primary-soft/50 sm:items-start sm:text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform group-hover:scale-105">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <Text as="p" variant="stat">
                    {stat.value}
                  </Text>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                  <Text variant="caption">{stat.description}</Text>
                </div>
              </div>
            </StaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  )
}
