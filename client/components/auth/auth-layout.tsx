"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft, Shield, Users, TrendingUp, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { GroChainLogo } from "@/components/ui/grochain-logo"
import { GroChainBrandMark } from "@/components/ui/grochain-brand-mark"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { defaultTransition, motionEasing } from "@/lib/motion"
import { layout } from "@/lib/design-system"
import { Display, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  showFeatures?: boolean
}

export function AuthLayout({ children, title, subtitle, showFeatures = false }: AuthLayoutProps) {
  const features = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade security with end-to-end encryption",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Farmers, buyers, and agencies sharing one set of records",
    },
    {
      icon: TrendingUp,
      title: "Growth Focused",
      description: "Tools and insights to scale your agricultural business",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connect with buyers and partners worldwide",
    },
  ]

  const stats = [
    { value: "3", label: "Roles on one platform" },
    { value: "QR", label: "Harvest traceability" },
    { value: "NG", label: "Built for Nigeria" },
  ]

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className={cn("flex flex-col justify-center py-12", layout.containerX)}>
        <StaggerContainer className={layout.containerNarrow}>
          <StaggerItem className="mb-8">
            <Link
              href="/"
              className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <div className="mb-6">
              <GroChainLogo variant="full" size="lg" />
            </div>

            <div className={layout.stackSm}>
              <Display as="h1" variant="page">
                {title}
              </Display>
              <Text variant="sm">{subtitle}</Text>
            </div>
          </StaggerItem>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...defaultTransition, delay: 0.25, ease: motionEasing.entrance }}
          >
            {children}
          </motion.div>
        </StaggerContainer>
      </div>

      <div className="relative hidden flex-col justify-center overflow-hidden bg-muted/30 px-8 py-12 agricultural-pattern lg:flex">
        <motion.div
          className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        <div className={cn("relative z-10 mx-auto max-w-md", layout.stackLg)}>
          {showFeatures ? (
            <>
              <div className="mb-4 flex justify-center">
                <GroChainBrandMark size="lg" rotate showRing glow float />
              </div>
              <StaggerContainer className={layout.stackMd}>
                {features.map((feature) => (
                  <StaggerItem key={feature.title}>
                    <div className="group flex items-start space-x-4">
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.2 }}
                      >
                        <feature.icon className="h-5 w-5 text-primary" />
                      </motion.div>
                      <div className="space-y-1">
                        <Display as="h3" variant="sub">
                          {feature.title}
                        </Display>
                        <Text variant="sm">{feature.description}</Text>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <motion.div
                className="grid grid-cols-3 gap-4 border-t pt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <Text as="div" variant="stat">
                      {stat.value}
                    </Text>
                    <Text variant="sm">{stat.label}</Text>
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              className={cn("text-center", layout.stackMd)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: motionEasing.entrance }}
            >
              <div className="mx-auto flex justify-center">
                <GroChainBrandMark size="xl" rotate showRing glow float />
              </div>
              <div className={layout.stackSm}>
                <Display as="h2" variant="card">
                  Welcome Back
                </Display>
                <Text variant="sm">Sign in to your GroChain account</Text>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
