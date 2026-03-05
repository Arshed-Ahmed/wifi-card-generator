import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PwaRegister } from "@/components/pwa-register"
import { getSiteUrl, getSiteUrlAsURL } from "@/lib/site-url"

const inter = Inter({ subsets: ["latin"] })
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: getSiteUrlAsURL(),
  title: {
    default: "WiFi Card Generator | Create Printable WiFi QR Cards",
    template: "%s | WiFi Card Generator",
  },
  description:
    "Generate secure, printable WiFi QR cards in seconds. Create custom WiFi cards for homes, offices, cafes, hotels, and events.",
  keywords: [
    "WiFi QR code generator",
    "WiFi card generator",
    "printable WiFi QR card",
    "guest WiFi QR code",
    "WiFi sharing",
    "WPA QR code",
    "WiFi password QR",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "WiFi Card Generator | Create Printable WiFi QR Cards",
    description:
      "Generate secure, printable WiFi QR cards in seconds and share WiFi access without typing long passwords.",
    siteName: "WiFi Card Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "WiFi Card Generator",
    description: "Create and share printable WiFi QR cards instantly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  generator: "Next.js",
  applicationName: "WiFi Card Generator",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WiFi Card Generator",
  },
  formatDetection: {
    telephone: false,
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "WiFi Card Generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description:
    "A web app to generate custom printable WiFi QR cards for guest access at homes, offices, and events.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PwaRegister />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="min-h-screen bg-background">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
