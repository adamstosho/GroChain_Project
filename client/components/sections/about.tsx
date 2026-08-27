import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

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
    <section id="about" className="py-16 sm:py-24">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary">About GroChain</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">
                Nigeria's first comprehensive digital trust platform for agriculture
              </h2>
              <p className="text-lg text-muted-foreground">
                GroChain is bridging the gap between traditional farming practices and modern technology to create a
                more transparent, efficient, and trustworthy agricultural supply chain.
              </p>
            </div>

            <div className="space-y-6">
              <p className="text-muted-foreground">
                The platform covers onboarding, harvest records, QR traceability, marketplace sales, and payments so
                each batch can be followed from farm to buyer without a separate paper trail.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-0 bg-muted/30">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-primary">{stat.value}</div>
                        <div className="font-semibold">{stat.label}</div>
                        <div className="text-sm text-muted-foreground">{stat.description}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <Image
                src="/illustration-about.png"
                alt="Illustration of maize fields beside a farm storehouse, produce crate, and a tablet showing a leaf mark"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            {/* Overlay Stats */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground">
                  Field records, a labelled crate, and a scan at the stall — the same batch, end to end.
                </p>
                <p className="text-xs text-muted-foreground mt-2">What GroChain is built to show</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
