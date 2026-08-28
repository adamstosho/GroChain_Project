import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agricultural Marketplace | GroChain",
  description: "Browse and buy fresh, verified agricultural products directly from local Nigerian farmers. Transparent supply chain and QR code traceability.",
  openGraph: {
    title: "Marketplace | GroChain - Digital Agriculture",
    description: "Connect with verified farmers and buy quality produce.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroChain Marketplace" }],
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
