"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { layout } from "@/lib/design-system"
import { Display, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export function CTA() {
  return (
    <section className={cn("relative overflow-hidden", layout.sectionY)}>
      <div className="absolute inset-0 bg-primary" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-hover opacity-100" aria-hidden />
      <div className="absolute inset-0 agricultural-pattern opacity-30" aria-hidden />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-success/10 blur-3xl" aria-hidden />

      <div className={cn("container relative", layout.containerX)}>
        <ScrollReveal variant="scaleIn" className="mx-auto max-w-3xl space-y-8 text-center">
          <div className={layout.stackSm}>
            <Display as="h2" variant="sectionLg" className="text-primary-foreground">
              Ready to join Nigeria&apos;s digital agriculture revolution?
            </Display>
            <Text variant="lead" className="text-primary-foreground/80">
              Whether you&apos;re a farmer, buyer, or agency, GroChain has the tools you need to build trust and grow your
              business.
            </Text>
          </div>

          <div className={cn(layout.actionsRow, "justify-center")}>
            <Button size="lg" variant="secondary" className="group shadow-md" asChild>
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>

          <Text variant="sm" className="text-primary-foreground/60">
            Create an account to list harvests, buy verified produce, or onboard farmers as a partner
          </Text>
        </ScrollReveal>
      </div>
    </section>
  )
}
