import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"
import { Display, Text } from "@/components/ui/typography"
import { layout } from "@/lib/design-system"

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using GroChain.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageContainer className={`max-w-3xl py-16 ${layout.stackMd}`}>
          <div className={layout.stackSm}>
            <Display as="h1" variant="section">Terms of Service</Display>
            <Text variant="sm">Last updated 26 August 2026</Text>
          </div>
          <Text variant="body" className="text-muted-foreground">
            By creating an account you agree to use GroChain for lawful agricultural commerce: accurate harvest records,
            honest listings, and respect for other users. GroChain provides software for traceability, marketplace, and
            related services; it does not guarantee crop prices, yields, or that every counterparty will complete a trade.
          </Text>
          <Text variant="body" className="text-muted-foreground">
            You are responsible for the information you enter. We may suspend accounts that publish false origin data,
            abuse payments, or interfere with other users. These terms may be updated; continued use after a posted change
            means you accept the new version.
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
