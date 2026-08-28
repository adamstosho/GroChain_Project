"use client"

import { Hero } from "@/components/sections/hero"
import { StatsStrip } from "@/components/sections/stats-strip"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Features } from "@/components/sections/features"
import { MarketplacePreview } from "@/components/sections/marketplace-preview"
import { About } from "@/components/sections/about"
import { Testimonials } from "@/components/sections/testimonials"
import { CTA } from "@/components/sections/cta"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ExplainerVideoProvider } from "@/components/marketing/explainer-video-provider"

export function LandingPageContent() {
  return (
    <ExplainerVideoProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <StatsStrip />
          <HowItWorks />
          <Features />
          <MarketplacePreview />
          <About />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </ExplainerVideoProvider>
  )
}
