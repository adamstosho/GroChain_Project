import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Testimonials() {
  const testimonials = [
    {
      name: "Adunni Adebayo",
      role: "Farmer",
      location: "Ogun State",
      avatar: "/nigerian-farmer-woman.png",
      rating: 5,
      content:
        "GroChain has transformed how I sell my products. The QR codes give my customers confidence, and I can reach buyers directly without middlemen.",
      highlight: "Direct market access",
    },
    {
      name: "Chidi Okafor",
      role: "Food Buyer",
      location: "Lagos",
      avatar: "/nigerian-businessman.png",
      rating: 5,
      content:
        "As a buyer, I love knowing exactly where my food comes from. The platform gives me confidence in the quality and freshness.",
      highlight: "Quality assurance",
    },
    {
      name: "Ibrahim Garba",
      role: "Partner Agency",
      location: "Kano",
      avatar: "/nigerian-agricultural-agent.png",
      rating: 5,
      content:
        "The bulk onboarding feature makes it easy for us to support multiple farmers. The real-time features are a game changer.",
      highlight: "Efficient operations",
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary">What Our Users Say</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">
            Real experiences from farmers, buyers, and agencies across Nigeria
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <Quote className="h-5 w-5 text-muted-foreground" />
                </div>

                <p className="text-muted-foreground leading-relaxed">"{testimonial.content}"</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}, {typeof testimonial.location === 'string' ? testimonial.location : `${(testimonial.location as any)?.city || 'Unknown'}, ${(testimonial.location as any)?.state || 'Unknown State'}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {testimonial.highlight}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
