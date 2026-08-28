"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Shield, Smartphone, TrendingUp, CreditCard, UserCheck } from "lucide-react"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { ScrollStagger, StaggerItem } from "@/components/motion/stagger-container"
import { MarketingSection } from "@/components/layout/marketing-section"
import { SectionHeader } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

export function Features() {
  const features = [
    {
      icon: UserCheck,
      title: "Farmer Onboarding",
      description: "Easy registration process with agency support and verification mapping",
      features: ["Identity verification", "Farm location mapping", "Real-time tracking", "Agency support"],
    },
    {
      icon: QrCode,
      title: "QR Code Traceability",
      description: "Generate unique QR codes for each product to enable full supply chain transparency",
      features: ["Instant QR generation", "Public verification", "Product history tracking", "Consumer trust building"],
    },
    {
      icon: Shield,
      title: "Digital Trust",
      description: "Build consumer confidence through verified product records and transparent processes",
      features: ["Verified farmer badges", "Transparent product records", "Share preferences", "Trust building"],
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized mobile experience with real-time connectivity for seamless operations",
      features: ["Real-time connectivity", "Low data design", "User-friendly interface", "Offline support"],
    },
    {
      icon: TrendingUp,
      title: "Market Insights",
      description: "Advisory analytics from your own harvests, listings, and sales on GroChain",
      features: ["Sales trends", "Listing performance", "Revenue outlook", "Platform-based pricing signals"],
    },
    {
      icon: CreditCard,
      title: "Fintech Services",
      description: "Access to credit scores, loans, and financial services tailored for farmers",
      features: ["Credit scoring", "Agricultural loans", "Financial health tracking", "Payment solutions"],
    },
  ]

  return (
    <MarketingSection id="features" className="bg-muted/40">
      <ScrollReveal>
        <SectionHeader
          badge={<Badge variant="secondary">Platform Features</Badge>}
          title="Everything Nigeria's agricultural ecosystem needs"
          description="From farm to table, our platform provides the tools to build trust, ensure quality, and connect stakeholders across the supply chain."
        />
      </ScrollReveal>

      <ScrollStagger className={layout.gridCards}>
        {features.map((feature) => (
          <StaggerItem key={feature.title}>
            <Card className="group h-full border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
              <CardHeader className="space-y-4 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="mb-2 font-serif text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center text-sm text-muted-foreground">
                      <div className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </ScrollStagger>
    </MarketingSection>
  )
}
