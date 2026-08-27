import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata = {
  title: "Privacy Policy",
  description: "How GroChain handles account and harvest data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight font-serif sm:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated 26 August 2026</p>
        </div>
        <p className="text-muted-foreground">
          GroChain collects the account details you submit (name, contact, role) and the farm, harvest, listing, and
          payment records you create so the platform can operate. We use that data to run your account, show
          traceability information you choose to publish, and contact you about the service.
        </p>
        <p className="text-muted-foreground">
          Public QR pages and marketplace listings show the origin and quality information attached to a batch. Private
          account data is not sold. We keep records as long as the account and related batches need to stay verifiable.
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
