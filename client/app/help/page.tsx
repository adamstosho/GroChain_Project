import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"

export const metadata = {
  title: "How GroChain works",
  description: "How farmers, buyers, and partner agencies use GroChain.",
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight font-serif sm:text-4xl">How GroChain works</h1>
          <p className="text-muted-foreground text-lg">
            GroChain is a digital record for Nigerian produce: who grew it, when it was harvested, and how a buyer can
            check that before they pay.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Farmers</h2>
          <p className="text-muted-foreground">
            Register, record harvests, generate a QR code for each batch, and list produce on the marketplace. Buyers
            see origin and grade from the same record you created.
          </p>
          <Link href="/register?role=farmer" className="text-primary font-medium hover:underline">
            Create a farmer account
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Buyers</h2>
          <p className="text-muted-foreground">
            Browse listings, scan a QR code to verify a batch, and place orders without a separate paper trail.
          </p>
          <Link href="/marketplace" className="text-primary font-medium hover:underline">
            Open the marketplace
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Partner agencies</h2>
          <p className="text-muted-foreground">
            Onboard farmers in bulk, follow their harvests, and keep agency records aligned with what buyers see.
          </p>
          <Link href="/register?role=partner" className="text-primary font-medium hover:underline">
            Register as a partner
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Need a person?</h2>
          <p className="text-muted-foreground">
            Email{" "}
            <a href="mailto:hello@grochain.ng" className="text-primary hover:underline">
              hello@grochain.ng
            </a>{" "}
            or call +234 800 GROCHAIN.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
