import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createEncryptedShareToken } from "@/lib/share-link"
import html2canvas from "html2canvas"

type DownloadParams = {
  qrValue: string
  isFlipped: boolean
  orientation: "landscape" | "portrait"
  ssid: string
  template: "business" | "modern"
}

type ShareParams = {
  qrValue: string
  ssid: string
  password: string
  encryption: string
  isHiddenNetwork: boolean
  template: string
  primaryColor: string
  secondaryColor: string
  orientation: string
  additionalInfo: string
  expirationDate?: Date
  shareIncludesPassword: boolean
}

export function useWifiCardActions() {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleCopyLink = async ({
    qrValue,
    ssid,
    password,
    encryption,
    isHiddenNetwork,
    template,
    primaryColor,
    secondaryColor,
    orientation,
    additionalInfo,
    expirationDate,
    shareIncludesPassword,
  }: ShareParams) => {
    if (!qrValue) return false

    try {
      const data = {
        s: ssid,
        p: shareIncludesPassword ? password : undefined,
        e: encryption,
        h: isHiddenNetwork,
        t: template,
        pc: primaryColor,
        sc: secondaryColor,
        o: orientation,
        a: additionalInfo || undefined,
        x: expirationDate ? expirationDate.toISOString() : undefined,
      }

      const { token, key } = await createEncryptedShareToken(data)
      const url = `${window.location.origin}/share?d=${token}#k=${key}`

      await navigator.clipboard.writeText(url)
      toast({
        title: "Secure link copied!",
        description: shareIncludesPassword
          ? "Guests can scan and copy the password from this link."
          : "QR-only link copied. Password text is not included.",
      })
      return true
    } catch (error) {
      console.error("Copy link error:", error)
      toast({
        title: "Could not create secure link",
        description: "Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleDownload = async ({ qrValue, isFlipped, orientation, ssid, template }: DownloadParams) => {
    if (!qrValue || isDownloading) return false

    setIsDownloading(true)

    try {
      const pixelRatio = Math.max(window.devicePixelRatio || 1, 2)
      const sanitizedSsid = (ssid || "network").trim().replace(/[^a-zA-Z0-9._-]+/g, "-") || "network"

      const captureCardCanvas = async (selector: string) => {
        const container = document.querySelector(selector) as HTMLElement | null
        if (!container) throw new Error(`Could not find element to capture: ${selector}`)

        const cardNode = (container.firstElementChild as HTMLElement | null) ?? container

        return html2canvas(cardNode, {
          scale: pixelRatio,
          logging: false,
          backgroundColor: null,
          useCORS: true,
          width: cardNode.scrollWidth,
          height: cardNode.scrollHeight,
        })
      }

      const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = filename
        downloadLink.href = pngFile
        downloadLink.click()
      }

      if (template === "modern") {
        const frontCanvas = await captureCardCanvas("#wifi-card-front-flat")
        const backCanvas = await captureCardCanvas("#wifi-card-back-flat")

        downloadCanvas(frontCanvas, `wifi-${sanitizedSsid}-modern-front.png`)
        downloadCanvas(backCanvas, `wifi-${sanitizedSsid}-modern-back.png`)

        toast({
          title: "Modern cards downloaded",
          description: "Saved front and back PNG files.",
        })

        return true
      }

      const canvas = await captureCardCanvas("#wifi-card-business-flat")

      downloadCanvas(canvas, `wifi-${sanitizedSsid}-business.png`)

      toast({
        title: "Card downloaded successfully",
        description: `Saved as wifi-${sanitizedSsid}-business.png`,
      })
      return true
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Please try disabling the 3D effect and try again",
        variant: "destructive",
      })
      return false
    } finally {
      setIsDownloading(false)
    }
  }

  return {
    isDownloading,
    handleCopyLink,
    handleDownload,
  }
}
