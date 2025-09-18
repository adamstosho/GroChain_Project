"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 agricultural-pattern">
      <div className="container px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                <CheckCircle className="mr-2 h-3 w-3" />
                Verified Products
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-serif">
                Building Trust in <span className="text-primary">Nigeria's Food Chain</span>
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
                GroChain connects farmers, buyers, and agencies through a transparent digital platform. Verify authentic
                Nigerian produce with QR codes, support local farmers, and ensure food quality.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group bg-transparent">
                <Play className="mr-2 h-4 w-4" />
                Verify Products
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span>10K+ Farmers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-secondary" />
                <span>100% Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Community Driven</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <Image
                src="/herosection-image.png"
                alt="Nigerian farmers with fresh produce showcasing agricultural products"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Cards */}
            <div className="absolute -bottom-4 -left-4 bg-card border rounded-lg p-4 shadow-lg animate-float">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Quality Verified</p>
                  <p className="text-xs text-muted-foreground">Fresh from farm</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -top-4 -right-4 bg-card border rounded-lg p-4 shadow-lg animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">QR</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Traceable</p>
                  <p className="text-xs text-muted-foreground">Scan to verify</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
