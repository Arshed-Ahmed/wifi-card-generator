"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function InstallAppCta() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const wasDismissed = window.localStorage.getItem("wifi-card-install-dismissed") === "1"
    if (wasDismissed) return

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsVisible(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt || isInstalling) return

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    } finally {
      setIsInstalling(false)
    }
  }

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wifi-card-install-dismissed", "1")
    }
    setIsVisible(false)
  }

  if (!isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Install WiFi Card Generator</p>
          <p className="text-sm text-muted-foreground">Use it like an app for quicker access at events and front desks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={dismiss}>
            Not now
          </Button>
          <Button size="sm" onClick={handleInstall} disabled={isInstalling} className="flex items-center gap-2">
            <Download size={14} />
            {isInstalling ? "Installing..." : "Install app"}
          </Button>
        </div>
      </div>
    </div>
  )
}
