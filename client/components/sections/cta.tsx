import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">
              Ready to Join Nigeria's Digital Agriculture Revolution?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto">
              Whether you're a farmer, buyer, or agency, GroChain has the tools you need to build trust and grow your
              business.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
            >
              Try QR Verification
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/60">
            Join thousands of farmers, buyers, and agencies already using GroChain
          </p>
        </div>
      </div>
    </section>
  )
}
