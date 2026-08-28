"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { SafeImage } from "@/components/ui/safe-image"
import { MarketingSection } from "@/components/layout/marketing-section"
import { Display, Text } from "@/components/ui/typography"
import { layout, ratio } from "@/lib/design-system"

export function About() {
  const stats = [
    {
      value: "3 roles",
      label: "One platform",
      description: "Farmers, buyers, and partner agencies work from the same records",
    },
    {
      value: "QR",
      label: "Batch traceability",
      description: "Each harvest can carry a code buyers scan before they pay",
    },
    {
      value: "Farm → buyer",
      label: "One trail",
      description: "Onboarding, harvest, listing, and payment stay on a single record",
    },
    {
      value: "NG",
      label: "Built here",
      description: "Designed for Nigerian produce, agencies, and payment rails",
    },
  ]

  return (
    <MarketingSection id="about" className="bg-background">
      <div className={layout.gridSplit}>
        <ScrollReveal variant="slideLeft" className={layout.stackLg}>
          <div className={layout.stackSm}>
            <Badge variant="secondary">About GroChain</Badge>
            <Display as="h2" variant="section">
              Nigeria&apos;s first comprehensive digital trust platform for agriculture
            </Display>
            <Text variant="lead">
              GroChain bridges the gap between traditional farming practices and modern technology to create a
              more transparent, efficient, and trustworthy agricultural supply chain.
            </Text>
          </div>

          <div className={layout.stackMd}>
            <Text variant="sm" className="text-muted-foreground">
              The platform covers onboarding, harvest records, QR traceability, marketplace sales, and payments so
              each batch can be followed from farm to buyer without a separate paper trail.
            </Text>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-border/60 bg-muted/30 shadow-sm transition-all duration-300 hover:border-primary/15 hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="space-y-1.5">
                      <div className="font-serif text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                      <Text variant="caption">{stat.description}</Text>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slideRight" delay={0.1}>
          <div className="relative">
            <div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/10 to-secondary/10 blur-md"
              aria-hidden
            />
            <div className={`relative overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-lg ${ratio.hero}`}>
              <SafeImage
                src="/illustration-about.png"
                alt="Illustration of maize fields beside a farm storehouse, produce crate, and a tablet showing a leaf mark"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="rounded-xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-md">
                  <p className="text-sm font-semibold text-foreground">
                    Field records, a labelled crate, and a scan at the stall — the same batch, end to end.
                  </p>
                  <Text variant="caption" className="mt-1.5">
                    What GroChain is built to show
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </MarketingSection>
  )
}
