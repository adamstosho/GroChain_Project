"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { defaultTransition, fadeUp, slideFromRight } from "@/lib/motion"
import { useExplainerVideo } from "@/components/marketing/explainer-video-provider"
import { layout, ratio } from "@/lib/design-system"
import { Display, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export function Hero() {
  const prefersReduced = useReducedMotion()
  const { openExplainer } = useExplainerVideo()

  const contentVariants = prefersReduced ? undefined : fadeUp
  const imageVariants = prefersReduced ? undefined : slideFromRight

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-primary-soft/30 agricultural-pattern">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-success/5 blur-3xl" />
      </div>

      <div className={cn("container relative", layout.containerX, layout.sectionHeroY)}>
        <div className={cn("grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20")}>
          <motion.div
            className={cn("flex flex-col justify-center", layout.stackLg)}
            initial={prefersReduced ? false : "hidden"}
            animate={prefersReduced ? undefined : "visible"}
            variants={contentVariants}
            transition={{ ...defaultTransition, staggerChildren: 0.1 }}
          >
            <div className={layout.stackSm}>
              <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3 w-3 text-secondary" />
                Nigeria&apos;s Digital Agriculture Platform
              </Badge>
              <Display as="h1" variant="hero">
                Building Trust in{" "}
                <span className="relative text-primary">
                  Nigeria&apos;s Food Chain
                  <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-secondary/40" />
                </span>
              </Display>
              <Text variant="lead" className="max-w-xl">
                GroChain connects farmers, buyers, and agencies through transparent supply-chain records.
                Verify authentic produce with QR codes and support local agriculture.
              </Text>
            </div>

            <div className={layout.actionsRow}>
              <Button size="lg" className="group shadow-sm" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group bg-card/60 backdrop-blur-sm"
                onClick={() => openExplainer()}
              >
                <Play className="mr-2 h-4 w-4 fill-primary/20 text-primary" />
                Watch how it works
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground">
              {[
                { color: "bg-success", label: "Farmers, buyers, agencies" },
                { color: "bg-secondary", label: "QR traceability" },
                { color: "bg-primary", label: "Built in Nigeria" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", item.color)} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={prefersReduced ? false : "hidden"}
            animate={prefersReduced ? undefined : "visible"}
            variants={imageVariants}
            transition={{ ...defaultTransition, delay: 0.15 }}
          >
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 blur-sm"
                aria-hidden
              />
              <button
                type="button"
                onClick={() => openExplainer()}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-xl shadow-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  ratio.hero
                )}
                aria-label="Watch how GroChain works — opens explainer video"
              >
                <Image
                  src="/illustration-hero.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-xl transition-transform duration-300 group-hover:scale-110">
                    <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                  </span>
                </div>
                <span className="absolute bottom-4 left-4 rounded-md bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  30 sec explainer
                </span>
              </button>
            </div>

            <div className="absolute -bottom-5 -left-2 animate-float rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:-left-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Quality Verified</p>
                  <Text variant="caption">Fresh from farm</Text>
                </div>
              </div>
            </div>

            <div
              className="absolute -right-2 -top-4 animate-float rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:-right-5"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                  <span className="text-sm font-bold text-primary">QR</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Traceable</p>
                  <Text variant="caption">Scan to verify</Text>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
