import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function About() {
  const stats = [
    {
      value: "10K+",
      label: "Registered Farmers",
      description: "Farmers have joined our platform to showcase their products",
    },
    {
      value: "100%",
      label: "Community Driven",
      description: "Built by Nigerians, for Nigerians, with platform governance",
    },
    {
      value: "₦500M+",
      label: "Total Transactions",
      description: "Value of transactions processed through our platform",
    },
    { value: "95%", label: "Satisfaction Rate", description: "Customer satisfaction rate across all user categories" },
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
                We're bringing together farmers and modern technology to create a more transparent, efficient, and
                trustworthy agricultural supply chain. Our platform enables end-to-end traceability, supports local
                farmers, and ensures food quality for consumers.
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
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <Image
                src="/nigerian-agricultural-landscape-with-modern-farmin.png"
                alt="Nigerian agricultural landscape showcasing modern farming techniques and traditional practices"
                fill
                className="object-cover"
              />
            </div>

            {/* Overlay Stats */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900">
                  "GroChain has transformed how I sell my products. The QR codes give my customers confidence, and I can
                  reach buyers directly without middlemen."
                </p>
                <p className="text-xs text-gray-600 mt-2">- Adunni Adebayo, Farmer from Ogun</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
