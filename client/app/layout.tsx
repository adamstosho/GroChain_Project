import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Fraunces } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DatadogSuppressor } from "@/components/datadog-suppressor"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { NotificationContainer } from "@/components/notifications/notification-toast"
import { OfflineIndicator, OfflineBanner, OfflineToast } from "@/components/ui/offline-indicator"
import { PWAInstallPrompt, PWAStatusIndicator } from "@/components/ui/pwa-install-prompt"
import { TokenRefreshProvider } from "@/components/auth/token-refresh-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import "@/lib/sw-register"
import "@/lib/chunk-retry"
import "@/lib/fix-exports" // Fix exports is not defined error

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://grochain.com"),
  title: "GroChain - Building Trust in Nigeria's Food Chain",
  description:
    "Digital agricultural platform connecting farmers, buyers, and agencies through transparent supply chain management with QR code traceability.",
  generator: "GroChain Platform",
  keywords: ["agriculture", "farming", "supply chain", "Nigeria", "food security", "traceability"],
  authors: [{ name: "GroChain Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "GroChain - Building Trust in Nigeria's Food Chain",
    description: "Building trust in Nigeria's food chain through transparent digital platform",
    type: "website",
    locale: "en_US",
    siteName: "GroChain",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GroChain Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GroChain - Building Trust in Nigeria's Food Chain",
    description: "Building trust in Nigeria's food chain through transparent digital platform",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GroChain",
  },
  alternates: {
    canonical: "https://grochain.com",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Improved accessibility
  userScalable: true,
  themeColor: "#166534",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${dmSans.variable} ${fraunces.variable} antialiased`}>
        <a
          href="#main-content"
          className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-md transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <DatadogSuppressor />
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <TokenRefreshProvider>
              <NotificationProvider>
                <NotificationContainer>
                  {process.env.NODE_ENV === 'production' && <OfflineBanner />}
                  <div id="main-content">{children}</div>
                </NotificationContainer>
              </NotificationProvider>
            </TokenRefreshProvider>
            <Toaster />
            {process.env.NODE_ENV === 'production' && (
              <>
                <OfflineIndicator />
                <PWAInstallPrompt />
                <PWAStatusIndicator />
                <OfflineToast />
              </>
            )}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
