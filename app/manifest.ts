import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"

const siteUrl = getSiteUrl()

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WiFi Card Generator",
    short_name: "WiFi Cards",
    description: "Generate secure, printable WiFi QR cards for guests, events, offices, and homes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    categories: ["utilities", "productivity"],
    icons: [
      {
        src: "/pwa/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Create WiFi Card",
        short_name: "Create",
        description: "Open card generator",
        url: "/",
      },
      {
        name: "Open Shared Card",
        short_name: "Shared",
        description: "Open shared WiFi card page",
        url: "/share",
      },
    ],
    id: siteUrl,
  }
}
