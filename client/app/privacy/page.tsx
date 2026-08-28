import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

export const metadata = {
  title: "Privacy Policy",
  description: "How GroChain handles account and harvest data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageContainer className={`max-w-3xl py-16 ${layout.stackMd}`}>
          <div className={layout.stackSm}>
            <Display as="h1" variant="section">Privacy Policy</Display>
            <Text variant="sm">Last updated 26 August 2026</Text>
          </div>
          <Text variant="body" className="text-muted-foreground">
            GroChain collects the account details you submit (name, contact, role) and the farm, harvest, listing, and
            payment records you create so the platform can operate. We use that data to run your account, show
            traceability information you choose to publish, and contact you about the service.
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Public QR pages and marketplace listings show the origin and quality information attached to a batch. Private
            account data is not sold. We keep records as long as the account and related batches need to stay verifiable.
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Questions:{" "}
            <a href="mailto:hello@grochain.ng" className="text-primary hover:underline">
              hello@grochain.ng
            </a>
            .
          </Text>
        </PageContainer>
      </main>
      <Footer />
    </div>
  )
}
