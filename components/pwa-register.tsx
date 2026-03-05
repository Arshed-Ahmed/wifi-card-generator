"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    if (process.env.NODE_ENV !== "production") {
      const cleanupDevServiceWorkers = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map((registration) => registration.unregister()))

          if ("caches" in window) {
            const keys = await caches.keys()
            await Promise.all(
              keys.filter((key) => key.startsWith("wifi-card-")).map((key) => caches.delete(key)),
            )
          }
        } catch (error) {
          console.error("Service worker cleanup failed", error)
        }
      }

      cleanupDevServiceWorkers()
      return
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (error) {
        console.error("Service worker registration failed", error)
      }
    }

    register()
  }, [])

  return null
}
