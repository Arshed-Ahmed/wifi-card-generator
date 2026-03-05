import { useEffect, useMemo, useState } from "react"

type AnalyticsEvent = "share_link_copied" | "card_downloaded" | "card_printed"

type AnalyticsStats = Record<AnalyticsEvent, number>

const STORAGE_KEY = "wifi-card-generator:analytics"

const DEFAULT_STATS: AnalyticsStats = {
  share_link_copied: 0,
  card_downloaded: 0,
  card_printed: 0,
}

export function useUsageAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats>(DEFAULT_STATS)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<AnalyticsStats>
      setStats({ ...DEFAULT_STATS, ...parsed })
    } catch {
      setStats(DEFAULT_STATS)
    }
  }, [])

  const track = (eventName: AnalyticsEvent) => {
    setStats((prev) => {
      const next = {
        ...prev,
        [eventName]: prev[eventName] + 1,
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }

      return next
    })
  }

  const resetAnalytics = () => {
    setStats(DEFAULT_STATS)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const totalTrackedActions = useMemo(
    () => stats.share_link_copied + stats.card_downloaded + stats.card_printed,
    [stats],
  )

  return {
    stats,
    track,
    resetAnalytics,
    totalTrackedActions,
  }
}
