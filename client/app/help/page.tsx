import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"
import Link from "next/link"

export const metadata = {
  title: "How GroChain works",
  description: "How farmers, buyers, and partner agencies use GroChain.",
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageContainer className={`max-w-3xl py-16 ${layout.stackLg}`}>
          <div className={layout.stackSm}>
            <Display as="h1" variant="section">How GroChain works</Display>
            <Text variant="lead">
              GroChain is a digital record for Nigerian produce: who grew it, when it was harvested, and how a buyer can
              check that before they pay.
            </Text>
          </div>

          <section className={layout.stackSm}>
            <Display as="h2" variant="sub">Farmers</Display>
            <Text variant="body" className="text-muted-foreground">
              Register, record harvests, generate a QR code for each batch, and list produce on the marketplace. Buyers
              see origin and grade from the same record you created.
            </Text>
            <Link href="/register?role=farmer" className="text-primary font-medium hover:underline">
              Create a farmer account
            </Link>
          </section>

          <section className={layout.stackSm}>
            <Display as="h2" variant="sub">Buyers</Display>
            <Text variant="body" className="text-muted-foreground">
              Browse listings, scan a QR code to verify a batch, and place orders without a separate paper trail.
            </Text>
            <Link href="/marketplace" className="text-primary font-medium hover:underline">
              Open the marketplace
            </Link>
          </section>

          <section className={layout.stackSm}>
            <Display as="h2" variant="sub">Partner agencies</Display>
            <Text variant="body" className="text-muted-foreground">
              Onboard farmers in bulk, follow their harvests, and keep agency records aligned with what buyers see.
            </Text>
            <Link href="/register?role=partner" className="text-primary font-medium hover:underline">
              Register as a partner
            </Link>
          </section>

          <section className={layout.stackSm}>
            <Display as="h2" variant="sub">Need a person?</Display>
            <Text variant="body" className="text-muted-foreground">
              Email{" "}
              <a href="mailto:hello@grochain.ng" className="text-primary hover:underline">
                hello@grochain.ng
              </a>{" "}
              or call +234 800 GROCHAIN.
            </Text>
          </section>
        </PageContainer>
      </main>
      <Footer />
    </div>
  )
}
