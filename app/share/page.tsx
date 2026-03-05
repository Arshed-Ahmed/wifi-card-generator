"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BusinessCardTemplate } from "@/components/business-card-template"
import { ModernCardTemplate } from "@/components/modern-card-template"
import { Card3DWrapper } from "@/app/card-3d-wrapper"
import { Button } from "@/components/ui/button"
import { Copy, Wifi } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { decryptShareToken, type SharePayload } from "@/lib/share-link"
import { buildWifiQrValue } from "@/lib/wifi-qr"

function ShareContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [data, setData] = useState<SharePayload | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const d = searchParams.get("d")

    if (!d) {
      setLoadError("Missing link data.")
      setIsLoading(false)
      return
    }

    const decrypt = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
        const key = hashParams.get("k")

        if (!key) {
          throw new Error("Missing decryption key")
        }

        const decoded = await decryptShareToken(d, key)
        setData(decoded)
        setLoadError(null)
      } catch (error) {
        console.error("Failed to parse secure data", error)
        setLoadError("This link is invalid or has been modified.")
      } finally {
        setIsLoading(false)
      }
    }

    decrypt()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading secure link...</p>
      </div>
    )
  }

  if (!data || loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{loadError || "Loading or invalid link..."}</p>
      </div>
    )
  }

  const {
    s: ssid,
    p: password = "",
    e: encryption,
    h: isHiddenNetwork,
    t: template,
    pc: primaryColor,
    sc: secondaryColor,
    o: orientation,
    a: additionalInfo,
    x: expirationDateStr
  } = data

  const expirationDate = expirationDateStr ? new Date(expirationDateStr) : undefined
  const qrValue = buildWifiQrValue({
    ssid,
    password,
    encryption,
    isHiddenNetwork,
  })

  const commonProps = {
    ssid,
    password,
    encryption,
    qrValue,
    showPassword: true,
    showSSID: !isHiddenNetwork,
    additionalInfo,
    primaryColor,
    secondaryColor,
    expirationDate,
    isHiddenNetwork,
    orientation: orientation as "landscape" | "portrait",
  }

  const handleCopyPassword = () => {
    if (!password) {
      toast({
        title: "Password not shared",
        description: "This link was created in QR-only mode.",
      })
      return
    }

    navigator.clipboard.writeText(password)
    toast({
      title: "Password copied!",
      description: "You can now paste it in your WiFi settings.",
    })
  }

  const renderCardTemplate = (forceSide?: "front" | "back") => {
    if (template === "modern") {
      return (
        <ModernCardTemplate 
          {...commonProps} 
          side={forceSide || (isFlipped ? "back" : "front")} 
        />
      )
    }
    return <BusinessCardTemplate {...commonProps} />
  }

  const renderCard = () => {
    if (template === "modern") {
      const flipCard = (
        <div 
          className="relative mx-auto cursor-pointer"
          style={{ 
            width: orientation === "portrait" ? "320px" : "560px",
            height: orientation === "portrait" ? "560px" : "320px",
            perspective: "1500px" 
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
              isFlipped ? "rotate-diagonal-180" : ""
            }`}
          >
            <div className="absolute inset-0 backface-hidden z-20">
              {renderCardTemplate("front")}
            </div>
            <div className="absolute inset-0 backface-hidden rotate-diagonal-180 z-10">
              {renderCardTemplate("back")}
            </div>
          </div>
        </div>
      )

      return (
        <div className="w-full flex justify-center">
          <Card3DWrapper>{flipCard}</Card3DWrapper>
        </div>
      )
    }

    return (
      <div className="w-full flex justify-center">
        <Card3DWrapper>
          <div style={{ width: orientation === "portrait" ? "320px" : "560px" }}>
            {renderCardTemplate()}
          </div>
        </Card3DWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Wifi className="w-8 h-8" />
            Connect to WiFi
          </h1>
          <p className="text-muted-foreground">
            Scan the QR code if you are on another device, or copy the password below.
          </p>
        </div>

        <div className="flex justify-center">
          {renderCard()}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button onClick={handleCopyPassword} size="lg" className="w-full sm:w-auto flex gap-2" disabled={!password}>
            <Copy size={18} />
            {password ? "Copy Password" : "Password not shared"}
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-diagonal-180 {
          transform: rotate3d(1, 1, 0, 180deg);
        }
      `}</style>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <ShareContent />
    </Suspense>
  )
}
