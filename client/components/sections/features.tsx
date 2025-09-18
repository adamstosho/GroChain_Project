import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Shield, Smartphone, TrendingUp, CreditCard, UserCheck } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: UserCheck,
      title: "Farmer Onboarding",
      description: "Easy registration process with agency support and verification mapping",
      features: ["Identity verification", "Farm location mapping", "Real-time tracking", "Agency support"],
    },
    {
      icon: QrCode,
      title: "QR Code Traceability",
      description: "Generate unique QR codes for each product to enable full supply chain transparency",
      features: ["Instant QR generation", "Public verification", "Product history tracking", "Consumer trust building"],
    },
    {
      icon: Shield,
      title: "Digital Trust",
      description: "Build consumer confidence through verified product records and transparent processes",
      features: ["Verified farmer badges", "Transparent product records", "Share preferences", "Trust building"],
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized mobile experience with real-time connectivity for seamless operations",
      features: ["Real-time connectivity", "Low data design", "User-friendly interface", "Offline support"],
    },
    {
      icon: TrendingUp,
      title: "Market Analytics",
      description: "Real-time market data, product demand analysis and supply chain optimization insights",
      features: ["Price tracking", "Real-time market data", "Supply chain insights", "Demand forecasting"],
    },
    {
      icon: CreditCard,
      title: "Fintech Services",
      description: "Access to credit scores, loans, and financial services tailored for farmers",
      features: ["Credit scoring", "Agricultural loans", "Financial health tracking", "Payment solutions"],
    },
  ]

  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-4">
            Platform Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">
            Comprehensive tools designed specifically for Nigeria's agricultural ecosystem
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From farm to table, our platform provides everything needed to build trust, ensure quality, and connect
            stakeholders in the agricultural supply chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-success mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
