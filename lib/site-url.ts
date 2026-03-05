const FALLBACK_SITE_URL = "https://wifi-card-generator.vercel.app"

export function getSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!rawUrl) {
    return FALLBACK_SITE_URL
  }

  try {
    return new URL(rawUrl).origin
  } catch {
    return FALLBACK_SITE_URL
  }
}

export function getSiteUrlAsURL(): URL {
  return new URL(getSiteUrl())
}
