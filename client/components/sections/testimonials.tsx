"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { ScrollStagger, StaggerItem } from "@/components/motion/stagger-container"
import { MarketingSection } from "@/components/layout/marketing-section"
import { SectionHeader, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

export function Testimonials() {
  const testimonials = [
    {
      name: "Adunni Adebayo",
      role: "Farmer",
      location: "Ogun State",
      avatar: "/illustration-avatar-farmer.png",
      rating: 5,
      content:
        "GroChain has transformed how I sell my products. The QR codes give my customers confidence, and I can reach buyers directly without middlemen.",
      highlight: "Direct market access",
    },
    {
      name: "Chidi Okafor",
      role: "Food Buyer",
      location: "Lagos",
      avatar: "/illustration-avatar-buyer.png",
      rating: 5,
      content:
        "As a buyer, I love knowing exactly where my food comes from. The platform gives me confidence in the quality and freshness.",
      highlight: "Quality assurance",
    },
    {
      name: "Ibrahim Garba",
      role: "Partner Agency",
      location: "Kano",
      avatar: "/illustration-avatar-agent.png",
      rating: 5,
      content:
        "The bulk onboarding feature makes it easy for us to support multiple farmers. The real-time features are a game changer.",
      highlight: "Efficient operations",
    },
  ]

  return (
    <MarketingSection className="bg-muted/40">
      <ScrollReveal>
        <SectionHeader
          badge={<Badge variant="secondary">What Our Users Say</Badge>}
          title="Real experiences from farmers, buyers, and agencies across Nigeria"
        />
      </ScrollReveal>

      <ScrollStagger className={layout.gridCards}>
        {testimonials.map((testimonial) => (
          <StaggerItem key={testimonial.name}>
            <Card className="group h-full border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-lg">
              <CardContent className="space-y-5 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <Quote className="h-5 w-5 text-primary/30" />
                </div>

                <Text variant="sm" className="text-[0.9375rem]">
                  &ldquo;{testimonial.content}&rdquo;
                </Text>

                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary-soft text-xs text-primary">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <Text variant="caption">
                        {testimonial.role}, {testimonial.location}
                      </Text>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {testimonial.highlight}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </ScrollStagger>
    </MarketingSection>
  )
}
