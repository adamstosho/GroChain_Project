"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft, Shield, Users, TrendingUp, Globe } from "lucide-react"
import { GroChainLogo } from "@/components/ui/grochain-logo"

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
      description: "Join thousands of farmers building trust together",
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
    { value: "10K+", label: "Active Farmers" },
    { value: "₦500M+", label: "Total Transactions" },
    { value: "95%", label: "Satisfaction Rate" },
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <div className="mb-6">
              <GroChainLogo variant="full" size="lg" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Form */}
          {children}
        </div>
      </div>

      {/* Right Side - Features/Stats */}
      <div className="hidden lg:flex flex-col justify-center bg-muted/30 px-8 py-12 agricultural-pattern">
        <div className="mx-auto max-w-md space-y-8">
          {showFeatures ? (
            <>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                <GroChainLogo variant="icon" size="xl" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to your GroChain account</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
