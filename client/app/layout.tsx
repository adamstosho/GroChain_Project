import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { OfflineIndicator } from "@/components/ui/offline-indicator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GroChain - Agricultural Supply Chain Platform",
  description: "Revolutionizing Nigeria's agriculture value chain with transparency, digital identities, and fintech services for smallholder farmers.",
  keywords: ["agriculture", "supply chain", "Nigeria", "farmers", "blockchain", "fintech"],
  authors: [{ name: "GroChain Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#16a34a",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "GroChain - Agricultural Supply Chain Platform",
    description: "Revolutionizing Nigeria's agriculture value chain with transparency, digital identities, and fintech services for smallholder farmers.",
    type: "website",
    locale: "en_NG",
    siteName: "GroChain",
  },
  twitter: {
    card: "summary_large_image",
    title: "GroChain - Agricultural Supply Chain Platform",
    description: "Revolutionizing Nigeria's agriculture value chain with transparency, digital identities, and fintech services for smallholder farmers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
        <OfflineIndicator />
      </body>
    </html>
  )
}