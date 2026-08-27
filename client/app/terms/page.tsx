import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using GroChain.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight font-serif sm:text-4xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated 26 August 2026</p>
        </div>
        <p className="text-muted-foreground">
          By creating an account you agree to use GroChain for lawful agricultural commerce: accurate harvest records,
          honest listings, and respect for other users. GroChain provides software for traceability, marketplace, and
          related services; it does not guarantee crop prices, yields, or that every counterparty will complete a trade.
        </p>
        <p className="text-muted-foreground">
          You are responsible for the information you enter. We may suspend accounts that publish false origin data,
          abuse payments, or interfere with other users. These terms may be updated; continued use after a posted change
          means you accept the new version.
        </p>
        <p className="text-muted-foreground">
          Questions:{" "}
          <a href="mailto:hello@grochain.ng" className="text-primary hover:underline">
            hello@grochain.ng
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  )
}
