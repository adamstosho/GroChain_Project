import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"
import { GroChainLogo } from "@/components/ui/grochain-logo"

export function Footer() {
  const platformLinks = [
    { name: "For Farmers", href: "/register?role=farmer" },
    { name: "For Buyers", href: "/register?role=buyer" },
    { name: "For Partners", href: "/register?role=partner" },
    { name: "Marketplace", href: "/marketplace" },
  ]

  const supportLinks = [
    { name: "How it works", href: "/help" },
    { name: "Contact Support", href: "mailto:hello@grochain.ng" },
    { name: "+234 800 GROCHAIN", href: "tel:+2348004762424" },
  ]

  return (
    <footer id="contact" className="bg-muted/50 border-t">
      <div className="container px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <GroChainLogo variant="full" size="md" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A digital agriculture platform connecting farmers, buyers, and agencies through transparent supply-chain
              records.
            </p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Lagos, Nigeria</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Platform</h3>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="space-y-2">
              <a
                href="mailto:hello@grochain.ng"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>hello@grochain.ng</span>
              </a>
              <a
                href="tel:+2348004762424"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>+234 800 GROCHAIN</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} GroChain. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
