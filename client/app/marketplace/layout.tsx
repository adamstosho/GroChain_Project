import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agricultural Marketplace | GroChain",
  description: "Browse and buy fresh, verified agricultural products directly from local Nigerian farmers. Transparent supply chain and QR code traceability.",
  openGraph: {
    title: "Marketplace | GroChain - Digital Agriculture",
    description: "Connect with verified farmers and buy quality produce.",
    images: ["/herosection-image.png"],
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
