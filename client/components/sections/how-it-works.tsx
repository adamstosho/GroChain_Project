"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { ScrollStagger, StaggerItem } from "@/components/motion/stagger-container"
import { StepVideoPreview } from "@/components/marketing/step-video-preview"
import { useExplainerVideo } from "@/components/marketing/explainer-video-provider"
import { EXPLAINER_SCENES } from "@/lib/explainer-videos"
import { ClipboardList, QrCode, ShoppingBag } from "lucide-react"
import { MarketingSection } from "@/components/layout/marketing-section"
import { SectionHeader, Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

const steps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Log your harvest",
    description:
      "Farmers record crop details, quality grades, and location. Each batch gets a unique ID on the platform.",
  },
  {
    step: "02",
    icon: QrCode,
    title: "Generate a QR code",
    description:
      "Every batch receives a scannable QR code. Buyers can verify origin, grade, and farmer details instantly.",
  },
  {
    step: "03",
    icon: ShoppingBag,
    title: "Sell with confidence",
    description:
      "List on the marketplace, accept payments, and track shipments — all on one transparent record.",
  },
]

export function HowItWorks() {
  const { openExplainer } = useExplainerVideo()

  return (
    <MarketingSection className="bg-background">
      <ScrollReveal>
        <SectionHeader
          badge={<Badge variant="secondary">How It Works</Badge>}
          title="From farm field to verified sale in three steps"
          description="GroChain replaces paper trails with a digital record every stakeholder can trust."
        />
      </ScrollReveal>

      <ScrollStagger className={layout.gridSteps}>
        {steps.map((item, index) => {
          const scene = EXPLAINER_SCENES.find((s) => s.stepIndex === index)

          return (
            <StaggerItem key={item.step}>
              <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md sm:p-8">
                {scene && (
                  <StepVideoPreview
                    poster={scene.image}
                    title={item.title}
                    posterFit={scene.id === "harvest" || scene.id === "marketplace" ? "contain" : "cover"}
                    onPlay={() => openExplainer(index)}
                  />
                )}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="select-none font-serif text-4xl font-bold text-primary/15">{item.step}</span>
                </div>
                <Display as="h3" variant="card" className="mb-2">
                  {item.title}
                </Display>
                <Text variant="sm">{item.description}</Text>
              </div>
            </StaggerItem>
          )
        })}
      </ScrollStagger>
    </MarketingSection>
  )
}
