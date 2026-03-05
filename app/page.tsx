"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Download, Link, Palette, RotateCw, Calendar, Sparkles, Trash2, ShieldCheck, QrCode, Smartphone, Printer, Users, Wifi, WandSparkles } from "lucide-react"
import { BusinessCardTemplate } from "@/components/business-card-template"
import { ModernCardTemplate } from "@/components/modern-card-template"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card3DWrapper } from "./card-3d-wrapper"
import { Switch } from "@/components/ui/switch"
import { useWifiCardForm, type WifiFormSnapshot } from "@/hooks/use-wifi-card-form"
import { useWifiCardActions } from "@/hooks/use-wifi-card-actions"
import { useToast } from "@/hooks/use-toast"
import { InstallAppCta } from "@/components/install-app-cta"
import { useUsageAnalytics } from "@/hooks/use-usage-analytics"
import { buildWifiQrValue } from "@/lib/wifi-qr"
import html2canvas from "html2canvas"

type FlowStep = "details" | "style" | "share"
type PrintLayout = "single" | "a4-sheet" | "table-tent" | "business-card"
type MobilePreviewPreset = "phone-small" | "phone-medium" | "phone-large" | "phone-xl"

const MOBILE_PRESET_WIDTHS: Record<MobilePreviewPreset, number> = {
  "phone-small": 320,
  "phone-medium": 360,
  "phone-large": 390,
  "phone-xl": 430,
}

export default function WifiCardGenerator() {
  const {
    ssid,
    setSsid,
    password,
    setPassword,
    encryption,
    setEncryption,
    showPassword,
    setShowPassword,
    showSSID,
    setShowSSID,
    qrValue,
    validationErrors,
    isFormValid,
    template,
    setTemplate,
    isHiddenNetwork,
    setIsHiddenNetwork,
    additionalInfo,
    setAdditionalInfo,
    orientation,
    setOrientation,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    expirationDate,
    setExpirationDate,
    enable3D,
    setEnable3D,
    shareIncludesPassword,
    setShareIncludesPassword,
    applyPreset,
    savedProfiles,
    saveCurrentProfile,
    applySavedProfile,
    deleteSavedProfile,
    getCurrentSnapshot,
    applySnapshot,
  } = useWifiCardForm()
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [profileName, setProfileName] = useState("")
  const [selectedProfileId, setSelectedProfileId] = useState("")
  const [flowStep, setFlowStep] = useState<FlowStep>("details")
  const [mobilePreview, setMobilePreview] = useState(false)
  const [mobilePreviewPreset, setMobilePreviewPreset] = useState<MobilePreviewPreset>("phone-medium")
  const [printLayout, setPrintLayout] = useState<PrintLayout>("single")
  const [sessionNetworks, setSessionNetworks] = useState<{ guest?: WifiFormSnapshot; staff?: WifiFormSnapshot }>({})
  const [activeNetworkSlot, setActiveNetworkSlot] = useState<"guest" | "staff" | "custom">("custom")
  const { isDownloading, handleCopyLink, handleDownload } = useWifiCardActions()
  const { toast } = useToast()
  const { stats, track, totalTrackedActions } = useUsageAnalytics()
  const flowSteps: FlowStep[] = ["details", "style", "share"]
  const currentFlowIndex = flowSteps.indexOf(flowStep)

  const hexToRgb = (hexColor: string) => {
    const normalized = hexColor.replace("#", "")
    if (normalized.length !== 6) return null

    const value = Number.parseInt(normalized, 16)
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    }
  }

  const luminance = (channel: number) => {
    const unit = channel / 255
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  }

  const contrastRatio = useMemo(() => {
    const fg = hexToRgb(primaryColor)
    const bg = hexToRgb(secondaryColor)
    if (!fg || !bg) return 1

    const fgLum = 0.2126 * luminance(fg.r) + 0.7152 * luminance(fg.g) + 0.0722 * luminance(fg.b)
    const bgLum = 0.2126 * luminance(bg.r) + 0.7152 * luminance(bg.g) + 0.0722 * luminance(bg.b)

    const lighter = Math.max(fgLum, bgLum)
    const darker = Math.min(fgLum, bgLum)
    return (lighter + 0.05) / (darker + 0.05)
  }, [primaryColor, secondaryColor])

  const contrastLabel = contrastRatio >= 4.5 ? "Good contrast" : contrastRatio >= 3 ? "Medium contrast" : "Low contrast"

  const saveToNetworkSlot = (slot: "guest" | "staff") => {
    setSessionNetworks((prev) => ({
      ...prev,
      [slot]: getCurrentSnapshot(),
    }))
    toast({ title: `${slot === "guest" ? "Guest" : "Staff"} slot saved` })
  }

  const loadFromNetworkSlot = (slot: "guest" | "staff") => {
    const snapshot = sessionNetworks[slot]
    if (!snapshot) {
      toast({
        title: "No saved network in slot",
        description: `Save ${slot} settings first to use this slot.`,
        variant: "destructive",
      })
      return
    }

    applySnapshot(snapshot)
    setActiveNetworkSlot(slot)
    toast({ title: `${slot === "guest" ? "Guest" : "Staff"} slot loaded` })
  }

  const handlePrint = async () => {
    track("card_printed")

    if (template !== "modern") {
      window.print()
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site to print modern cards reliably.",
        variant: "destructive",
      })
      window.print()
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Preparing print...</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          </style>
        </head>
        <body>Preparing modern card print preview...</body>
      </html>
    `)
    printWindow.document.close()

    const wait = (ms: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms)
    })

    const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      let timeoutId: number | undefined
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(label)), ms)
      })

      try {
        return await Promise.race([promise, timeoutPromise])
      } finally {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId)
        }
      }
    }

    const setPrintStatus = (message: string) => {
      try {
        if (printWindow.document.body) {
          printWindow.document.body.textContent = message
        }
      } catch {
      }
    }

    const captureCardImage = async (selector: string) => {
      const container = document.querySelector(selector) as HTMLElement | null
      if (!container) throw new Error(`Missing print source: ${selector}`)

      const cardNode = (container.firstElementChild as HTMLElement | null) ?? container
      if ("fonts" in document && document.fonts?.ready) {
        await Promise.race([document.fonts.ready, wait(1200)])
      }

      await wait(60)

      const rect = cardNode.getBoundingClientRect()
      const captureWidth = Math.max(Math.round(rect.width), cardNode.clientWidth, cardNode.scrollWidth)
      const captureHeight = Math.max(Math.round(rect.height), cardNode.clientHeight, cardNode.scrollHeight)

      if (captureWidth <= 0 || captureHeight <= 0) {
        throw new Error(`Invalid capture size for ${selector}: ${captureWidth}x${captureHeight}`)
      }

      const canvas = await withTimeout(
        html2canvas(cardNode, {
          scale: Math.max(window.devicePixelRatio || 1, 2),
          logging: false,
          backgroundColor: null,
          useCORS: true,
          width: captureWidth,
          height: captureHeight,
          windowWidth: captureWidth,
          windowHeight: captureHeight,
        }),
        12000,
        `Capture timed out for ${selector}`,
      )

      return canvas.toDataURL("image/png")
    }

    try {
      setPrintStatus("Capturing modern card front...")
      const frontImage = await captureCardImage("#wifi-card-front-print-source")
      setPrintStatus("Capturing modern card back...")
      const backImage = await captureCardImage("#wifi-card-back-print-source")

      const singleMarkup = `
        <div class="sheet center">
          <img class="card single" src="${frontImage}" alt="Modern card front" />
        </div>
        <div class="sheet center break-before">
          <img class="card single" src="${backImage}" alt="Modern card back" />
        </div>
      `

      const businessMarkup = `
        <div class="sheet center">
          <img class="card business" src="${frontImage}" alt="Modern card front" />
        </div>
        <div class="sheet center break-before">
          <img class="card business" src="${backImage}" alt="Modern card back" />
        </div>
      `

      const a4Markup = `
        <div class="sheet grid-a4">
          ${Array.from({ length: 8 }).map(() => `<img class="card a4" src="${frontImage}" alt="Modern card front" />`).join("")}
        </div>
        <div class="sheet grid-a4 break-before">
          ${Array.from({ length: 8 }).map(() => `<img class="card a4" src="${backImage}" alt="Modern card back" />`).join("")}
        </div>
      `

      const tentMarkup = `
        <div class="sheet tent">
          <img class="card tent-card" src="${frontImage}" alt="Modern card front" />
          <img class="card tent-card flip" src="${backImage}" alt="Modern card back" />
        </div>
      `

      const markup =
        printLayout === "a4-sheet"
          ? a4Markup
          : printLayout === "table-tent"
            ? tentMarkup
            : printLayout === "business-card"
              ? businessMarkup
              : singleMarkup

      printWindow.document.open()
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Modern WiFi Card</title>
            <style>
              @page { size: A4; margin: 10mm; }
              * { box-sizing: border-box; }
              body { margin: 0; font-family: Arial, sans-serif; }
              .sheet { width: 100%; }
              .center { display: flex; justify-content: center; align-items: flex-start; }
              .break-before { page-break-before: always; break-before: page; }
              .card { display: block; }
              .single { width: min(170mm, 100%); height: auto; }
              .business { width: 88.9mm; height: auto; }
              .grid-a4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
              .a4 { width: 100%; height: auto; }
              .tent { display: grid; grid-template-rows: auto auto; gap: 8mm; justify-items: center; }
              .tent-card { width: min(150mm, 100%); height: auto; }
              .tent-card.flip { transform: rotate(180deg); }
            </style>
          </head>
          <body>${markup}</body>
        </html>
      `)
      printWindow.document.close()
      window.setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 250)
    } catch (error) {
      console.error("Modern print fallback failed:", error)
      printWindow.close()
      toast({
        title: "Print fallback used",
        description: "Could not prepare exact modern print preview. Using browser print instead.",
        variant: "destructive",
      })
      window.print()
    }
  }

  const runNetworkSlotAction = async (slot: "guest" | "staff", action: "load" | "share" | "download" | "print") => {
    const snapshot = sessionNetworks[slot]
    if (!snapshot) {
      toast({
        title: "No saved network in slot",
        description: `Save ${slot} settings first to use this action.`,
        variant: "destructive",
      })
      return
    }

    if (action === "load") {
      applySnapshot(snapshot)
      setActiveNetworkSlot(slot)
      toast({ title: `${slot === "guest" ? "Guest" : "Staff"} slot loaded` })
      return
    }

    const slotQrValue = buildWifiQrValue({
      ssid: snapshot.ssid,
      password: snapshot.password,
      encryption: snapshot.encryption,
      isHiddenNetwork: snapshot.isHiddenNetwork,
    })

    if (action === "share") {
      const success = await handleCopyLink({
        qrValue: slotQrValue,
        ssid: snapshot.ssid,
        password: snapshot.password,
        encryption: snapshot.encryption,
        isHiddenNetwork: snapshot.isHiddenNetwork,
        template: snapshot.template,
        primaryColor: snapshot.primaryColor,
        secondaryColor: snapshot.secondaryColor,
        orientation: snapshot.orientation,
        additionalInfo: snapshot.additionalInfo,
        expirationDate,
        shareIncludesPassword: snapshot.shareIncludesPassword,
      })
      if (success) track("share_link_copied")
      return
    }

    applySnapshot(snapshot)
    setActiveNetworkSlot(slot)

    await new Promise((resolve) => setTimeout(resolve, 60))

    if (action === "download") {
      const success = await handleDownload({
        qrValue: slotQrValue,
        isFlipped: false,
        orientation: snapshot.orientation,
        ssid: snapshot.ssid,
        template: snapshot.template,
      })
      if (success) track("card_downloaded")
      return
    }

    if (action === "print") {
      await handlePrint()
    }
  }

  const goToNextStep = () => {
    const next = flowSteps[currentFlowIndex + 1]
    if (next) setFlowStep(next)
  }

  const goToPreviousStep = () => {
    const previous = flowSteps[currentFlowIndex - 1]
    if (previous) setFlowStep(previous)
  }

  const renderCardTemplate = (forceSide?: "front" | "back") => {
    const commonProps = {
      ssid,
      password,
      encryption,
      qrValue,
      showPassword,
      showSSID,
      additionalInfo,
      primaryColor,
      secondaryColor,
      expirationDate,
      isHiddenNetwork,
      orientation,
    }

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
    if (!qrValue) {
      return (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          Enter network details to generate QR code
        </div>
      )
    }

    const baseWidth = orientation === "portrait" ? 320 : 560
    const baseHeight = orientation === "portrait" ? 560 : 320
    const mobileTargetWidth = MOBILE_PRESET_WIDTHS[mobilePreviewPreset]
    const cardScale = mobilePreview ? Math.min(1, mobileTargetWidth / baseWidth) : 1
    const previewWidth = Math.round(baseWidth * cardScale)
    const previewHeight = Math.round(baseHeight * cardScale)

    // Modern Template with 3D Flip
    if (template === "modern") {
      // 3D Flip Container
      const flipCard = (
        <div 
          className="relative mx-auto cursor-pointer"
          style={{ 
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            perspective: "1500px" 
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
              isFlipped ? "rotate-diagonal-180" : ""
            }`}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden z-20">
              <div
                style={{
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  transform: `scale(${cardScale})`,
                  transformOrigin: "top left",
                }}
              >
                {renderCardTemplate("front")}
              </div>
            </div>
            
            {/* Back Side (Rotated) */}
            <div 
              className="absolute inset-0 backface-hidden rotate-diagonal-180 z-10"
            >
              <div
                style={{
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  transform: `scale(${cardScale})`,
                  transformOrigin: "top left",
                }}
              >
                {renderCardTemplate("back")}
              </div>
            </div>
          </div>
        </div>
      )

      return (
        <>
          <div className="w-full flex justify-center">
            <div className={mobilePreview ? "rounded-[2rem] border border-border bg-muted/20 p-3 overflow-hidden" : ""}>
              {enable3D ? <Card3DWrapper>{flipCard}</Card3DWrapper> : flipCard}
            </div>
          </div>
          
          {/* Hidden Staging Area for Download (Flat Versions) */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <div id="wifi-card-front-flat">
               {renderCardTemplate("front")}
            </div>
            <div id="wifi-card-back-flat">
               {renderCardTemplate("back")}
            </div>
          </div>
        </>
      )
    }

    // Business Template (Single Side)
    return (
      <>
        <div className="w-full flex justify-center">
          <div className={mobilePreview ? "rounded-[2rem] border border-border bg-muted/20 p-3 overflow-hidden" : ""}>
            {enable3D ? (
              <Card3DWrapper>
                <div style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}>
                  <div
                    style={{
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                      transform: `scale(${cardScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {renderCardTemplate()}
                  </div>
                </div>
              </Card3DWrapper>
            ) : (
              <div style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}>
                <div
                  style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${cardScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {renderCardTemplate()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
          <div id="wifi-card-business-flat">{renderCardTemplate()}</div>
        </div>
      </>
    )
  }

  const renderPrintCards = () => {
    if (!qrValue) return null

    if (printLayout === "a4-sheet") {
      if (template === "modern") {
        return (
          <>
            <div className="print-a4-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`a4-front-${index}`} className="print-card-wrapper">
                  {renderCardTemplate("front")}
                </div>
              ))}
            </div>
            <div className="print-a4-grid print-page-break-before">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`a4-back-${index}`} className="print-card-wrapper">
                  {renderCardTemplate("back")}
                </div>
              ))}
            </div>
          </>
        )
      }

      return (
        <div className="print-a4-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`a4-${index}`} className="print-card-wrapper">
              {renderCardTemplate("front")}
            </div>
          ))}
        </div>
      )
    }

    if (printLayout === "table-tent") {
      if (template === "modern") {
        return (
          <div className="print-table-tent">
            <div className="print-card-wrapper">{renderCardTemplate("front")}</div>
            <div className="print-card-wrapper print-table-tent-flip">{renderCardTemplate("back")}</div>
          </div>
        )
      }

      return (
        <div className="print-table-tent">
          <div className="print-card-wrapper">{renderCardTemplate("front")}</div>
          <div className="print-card-wrapper print-table-tent-flip">{renderCardTemplate("front")}</div>
        </div>
      )
    }

    if (printLayout === "business-card") {
      if (template === "modern") {
        return (
          <div className="print-modern-duplex">
            <div className="print-business-card">{renderCardTemplate("front")}</div>
            <div className="print-business-card print-page-break-before">{renderCardTemplate("back")}</div>
          </div>
        )
      }

      return <div className="print-business-card">{renderCardTemplate("front")}</div>
    }

    if (template === "modern") {
      return (
        <div className="print-modern-duplex">
          <div className="print-card-wrapper">{renderCardTemplate("front")}</div>
          <div className="print-card-wrapper print-page-break-before">{renderCardTemplate("back")}</div>
        </div>
      )
    }

    return <div className="print-card-wrapper">{renderCardTemplate("front")}</div>
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <InstallAppCta />
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold inline-flex items-center gap-2">
          <Wifi className="h-8 w-8" />
          WiFi Card Generator
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Create secure, printable WiFi QR cards with guided setup, presets, and instant sharing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <WandSparkles size={18} />
              Network Details
            </CardTitle>
            <CardDescription>Enter your WiFi network information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={flowStep} onValueChange={(value) => setFlowStep(value as FlowStep)} className="w-full space-y-3">
              <TabsList className="grid grid-cols-3 w-full p-1">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>
              <div className="h-1 rounded bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentFlowIndex + 1) / flowSteps.length) * 100}%` }}
                />
              </div>
            </Tabs>

            {flowStep === "details" ? (
              <>
                <div className="space-y-2">
                  <Label>Quick Presets</Label>
                  <Select
                    value={selectedPreset}
                    onValueChange={(value) => {
                      setSelectedPreset(value)
                      applyPreset(value as "home" | "office" | "cafe" | "event")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Apply a preset style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home WiFi</SelectItem>
                      <SelectItem value="office">Office Guest</SelectItem>
                      <SelectItem value="cafe">Cafe Guest</SelectItem>
                      <SelectItem value="event">Event Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssid">Network Name (SSID)</Label>
                  <Input
                    id="ssid"
                    placeholder="Enter network name"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    aria-invalid={Boolean(validationErrors.ssid)}
                  />
                  {validationErrors.ssid ? (
                    <p className="text-xs text-destructive" role="alert" aria-live="polite">
                      {validationErrors.ssid}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encryption">Security Type</Label>
                  <RadioGroup
                    value={encryption}
                    onValueChange={(value) => setEncryption(value as "WPA" | "WEP" | "NONE")}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    aria-label="Security Type"
                  >
                    <Label className="flex items-center gap-2 rounded-md border border-input p-2 cursor-pointer">
                      <RadioGroupItem value="WPA" id="security-wpa" />
                      <span>WPA/WPA2/WPA3</span>
                    </Label>
                    <Label className="flex items-center gap-2 rounded-md border border-input p-2 cursor-pointer">
                      <RadioGroupItem value="WEP" id="security-wep" />
                      <span>WEP</span>
                    </Label>
                    <Label className="flex items-center gap-2 rounded-md border border-input p-2 cursor-pointer">
                      <RadioGroupItem value="NONE" id="security-none" />
                      <span>None</span>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(validationErrors.password)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  {validationErrors.password ? (
                    <p className="text-xs text-destructive" role="alert" aria-live="polite">
                      {validationErrors.password}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hiddenNetwork"
                      checked={isHiddenNetwork}
                      onCheckedChange={(checked) => setIsHiddenNetwork(checked === true)}
                    />
                    <Label htmlFor="hiddenNetwork" className="text-sm">
                      Hidden network (not broadcasting SSID)
                    </Label>
                  </div>

                  {isHiddenNetwork ? (
                    <div className="flex items-center ml-6 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSSID(!showSSID)}
                        className="text-xs flex items-center gap-1 h-8"
                      >
                        {showSSID ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showSSID ? "Hide network name" : "Show network name"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Input
                    id="additionalInfo"
                    placeholder="e.g., For conference attendees only"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="flex items-center gap-2">
                    <Calendar size={16} />
                    Expiration Date (Optional)
                  </Label>
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {expirationDate ? format(expirationDate, "PPP") : <span>Pick an expiration date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                      />
                      {expirationDate ? (
                        <div className="p-3 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpirationDate(undefined)}
                            className="text-xs"
                          >
                            Clear date
                          </Button>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            ) : null}

            {flowStep === "style" ? (
              <>
                <div className="space-y-2 pt-4">
                  <Label className="flex items-center gap-2">
                    <Palette size={16} />
                    Card Template
                  </Label>
                  <Tabs
                    value={template}
                    onValueChange={(value) => setTemplate(value as "business" | "modern")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="business">Business</TabsTrigger>
                      <TabsTrigger value="modern">Modern</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex justify-between pt-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <RotateCw size={16} />
                      Orientation
                    </Label>
                    <Tabs
                      value={orientation}
                      onValueChange={(value) => setOrientation(value as "landscape" | "portrait")}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-2 w-[200px]">
                        <TabsTrigger value="landscape">Landscape</TabsTrigger>
                        <TabsTrigger value="portrait">Portrait</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Palette size={16} />
                      Colors
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                            <span>Customize Colors</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 p-1"
                              />
                              <Input
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-10 h-10 p-1"
                              />
                              <Input
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="3d-effect" checked={enable3D} onCheckedChange={setEnable3D} />
                    <Label htmlFor="3d-effect" className="flex items-center gap-1">
                      <Sparkles size={16} />
                      3D Effect
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="mobile-preview" checked={mobilePreview} onCheckedChange={setMobilePreview} />
                    <Label htmlFor="mobile-preview" className="flex items-center gap-1">
                      <Smartphone size={16} />
                      Mobile preview mode
                    </Label>
                  </div>
                  {mobilePreview ? (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="mobile-preview-width" className="text-xs text-muted-foreground">
                        Preview device width
                      </Label>
                      <Select
                        value={mobilePreviewPreset}
                        onValueChange={(value) => setMobilePreviewPreset(value as MobilePreviewPreset)}
                      >
                        <SelectTrigger id="mobile-preview-width">
                          <SelectValue placeholder="Select device width" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone-small">Small phone (320px)</SelectItem>
                          <SelectItem value="phone-medium">Medium phone (360px)</SelectItem>
                          <SelectItem value="phone-large">Large phone (390px)</SelectItem>
                          <SelectItem value="phone-xl">XL phone (430px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="rounded-md border border-border/80 bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Contrast checker</p>
                    <p className="text-muted-foreground">
                      {contrastLabel} • Ratio {contrastRatio.toFixed(2)}:1
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            {flowStep === "share" ? (
              <>
                <div className="space-y-2 pt-2">
                  <Label>Saved Profiles</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Profile name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const saved = saveCurrentProfile(profileName)
                        if (saved) {
                          setProfileName("")
                          toast({ title: "Profile saved", description: "You can load it anytime." })
                        } else {
                          toast({
                            title: "Enter a profile name",
                            description: "Profile name cannot be empty.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Load saved profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedProfiles.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No saved profiles
                          </SelectItem>
                        ) : (
                          savedProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedProfileId}
                      onClick={() => {
                        const loaded = applySavedProfile(selectedProfileId)
                        if (loaded) {
                          toast({ title: "Profile loaded", description: "Saved settings have been applied." })
                        }
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!selectedProfileId}
                      onClick={() => {
                        deleteSavedProfile(selectedProfileId)
                        setSelectedProfileId("")
                        toast({ title: "Profile deleted" })
                      }}
                      aria-label="Delete selected profile"
                      title="Delete selected profile"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="rounded-md border border-border/80 bg-muted/30 p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Users size={16} />
                      Multi-network session (Guest + Staff)
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => saveToNetworkSlot("guest")}>Save Guest</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => saveToNetworkSlot("staff")}>Save Staff</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => loadFromNetworkSlot("guest")}>Load Guest</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => loadFromNetworkSlot("staff")}>Load Staff</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active slot: {activeNetworkSlot === "custom" ? "Custom" : activeNetworkSlot === "guest" ? "Guest" : "Staff"}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="share-password"
                      checked={shareIncludesPassword}
                      onCheckedChange={setShareIncludesPassword}
                    />
                    <Label htmlFor="share-password" className="text-sm">
                      Include password text in shared link
                    </Label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs" aria-label="Full details sharing mode">
                      <p className="font-medium flex items-center gap-1">
                        <ShieldCheck size={14} />
                        Full details mode
                      </p>
                      <p className="text-muted-foreground">Includes password text in the shared view for easy copy/paste.</p>
                    </div>
                    <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs" aria-label="QR-only sharing mode">
                      <p className="font-medium flex items-center gap-1">
                        <QrCode size={14} />
                        QR-only mode
                      </p>
                      <p className="text-muted-foreground">Hides password text while still allowing connection by scanning.</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground" aria-live="polite">
                    Privacy-safe local usage stats: {totalTrackedActions} actions • {stats.share_link_copied} shared • {stats.card_downloaded} downloads • {stats.card_printed} prints
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={currentFlowIndex === 0}>
                Back
              </Button>
              <p className="text-xs text-muted-foreground" aria-live="polite">Step {currentFlowIndex + 1} of {flowSteps.length}</p>
              <Button
                type="button"
                onClick={goToNextStep}
                disabled={currentFlowIndex === flowSteps.length - 1 || (flowStep === "details" && !isFormValid)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WiFi Card</CardTitle>
            <CardDescription>Scan this QR code to connect</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">{renderCard()}</CardContent>
          <CardFooter className="flex flex-wrap items-start justify-center gap-3">
            <div className="w-[220px] space-y-1">
              <Select value={printLayout} onValueChange={(value) => setPrintLayout(value as PrintLayout)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Print layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single card</SelectItem>
                  <SelectItem value="a4-sheet">A4 sheet (8 cards)</SelectItem>
                  <SelectItem value="table-tent">Table tent</SelectItem>
                  <SelectItem value="business-card">Business-card size</SelectItem>
                </SelectContent>
              </Select>
              {template === "modern" ? (
                <p className="text-xs text-muted-foreground px-1">Print includes front + back for Modern.</p>
              ) : null}
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const success = await handleDownload({
                  qrValue,
                  isFlipped,
                  orientation,
                  ssid,
                  template,
                })
                if (success) track("card_downloaded")
              }}
              disabled={!qrValue || !isFormValid || isDownloading}
              className="flex gap-2"
            >
              <Download size={18} />
              {isDownloading ? "Processing..." : "Download"}
            </Button>
            <Button
              onClick={async () => {
                const success = await handleCopyLink({
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
                })
                if (success) track("share_link_copied")
              }}
              disabled={!qrValue || !isFormValid}
              className="flex gap-2"
            >
              <Link size={18} />
              Copy Link
            </Button>
            <Button variant="secondary" onClick={handlePrint} disabled={!qrValue || !isFormValid} className="flex gap-2">
              <Printer size={18} />
              Print
            </Button>
          </CardFooter>
        </Card>
      </div>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} />
              Session Overview
            </CardTitle>
            <CardDescription>Quick actions for Guest and Staff network slots in this session.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {(["guest", "staff"] as const).map((slot) => {
              const snapshot = sessionNetworks[slot]
              return (
                <div key={slot} className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="font-medium capitalize">{slot} Network</p>
                    <p className="text-xs text-muted-foreground">
                      {snapshot ? `${snapshot.ssid || "(No SSID)"} • ${snapshot.encryption} • ${snapshot.template}` : "Not saved yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!snapshot} onClick={() => runNetworkSlotAction(slot, "load")}>
                      Load
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!snapshot} onClick={() => runNetworkSlotAction(slot, "share")}>
                      Share
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!snapshot} onClick={() => runNetworkSlotAction(slot, "download")}>
                      Download
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!snapshot} onClick={() => runNetworkSlotAction(slot, "print")}>
                      Print
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <div className="print-layout-root" data-layout={printLayout} data-orientation={orientation} aria-hidden="true">
        {renderPrintCards()}
      </div>

      {template === "modern" && qrValue ? (
        <div className="modern-print-source-root" aria-hidden="true">
          <div id="wifi-card-front-print-source" className="modern-print-source-card">
            {renderCardTemplate("front")}
          </div>
          <div id="wifi-card-back-print-source" className="modern-print-source-card">
            {renderCardTemplate("back")}
          </div>
        </div>
      ) : null}

      <section className="mt-12 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Create WiFi QR cards in seconds</h2>
          <p className="text-muted-foreground max-w-3xl">
            WiFi Card Generator helps you create printable WiFi QR cards for homes, offices, shops, events, and guest
            areas. Instead of sharing passwords manually, guests can scan a QR code and connect quickly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Enter network details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Add SSID, security type, and password. Hidden network and expiry date options are also supported.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Customize your card</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pick a template, switch orientation, set colors, and enable 3D effect for a polished, branded look.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Download or share securely</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Export as PNG for print, or generate an encrypted share link for quick guest onboarding.
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can I generate a WiFi QR code for WPA, WEP, and open networks?</AccordionTrigger>
              <AccordionContent>
                Yes. This app supports WPA/WPA2/WPA3, WEP, and open networks. Select the security type before
                generating your card.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is the shared link secure?</AccordionTrigger>
              <AccordionContent>
                Shared links use encrypted payloads. You can also enable QR-only mode to avoid including password text
                in the shared view.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I print these WiFi cards for events or front desks?</AccordionTrigger>
              <AccordionContent>
                Yes. Download as PNG and print for reception desks, meeting rooms, cafes, or temporary event access.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <style jsx global>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .rotate-diagonal-180 {
          transform: rotate3d(1, 1, 0, 180deg);
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .print-layout-root {
          display: none;
        }

        .modern-print-source-root {
          position: fixed;
          left: -200vw;
          top: 0;
          z-index: -1;
          pointer-events: none;
          visibility: visible;
        }

        .modern-print-source-card {
          display: block;
          margin: 0;
          padding: 0;
        }

        .print-layout-root .print-card-wrapper,
        .print-layout-root .print-business-card {
          break-inside: avoid;
          page-break-inside: avoid;
          overflow: visible;
        }

        .print-layout-root .print-card-wrapper > *,
        .print-layout-root .print-business-card > * {
          box-shadow: none !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .print-layout-root #wifi-card-front,
        .print-layout-root #wifi-card-back {
          overflow: visible !important;
        }

        .print-layout-root #wifi-card-front.modern-front-card,
        .print-layout-root #wifi-card-back.modern-back-card {
          background: #f8fafc !important;
          background-image: none !important;
          color: #111827 !important;
          border: 1px solid #d1d5db !important;
        }

        .print-layout-root #wifi-card-front.modern-front-card p,
        .print-layout-root #wifi-card-front.modern-front-card span,
        .print-layout-root #wifi-card-front.modern-front-card h3 {
          color: #111827 !important;
        }

        .print-layout-root #wifi-card-front.modern-front-card .font-mono {
          background: #e5e7eb !important;
          color: #111827 !important;
        }

        .print-layout-root #wifi-card-front .opacity-40,
        .print-layout-root #wifi-card-front .opacity-50,
        .print-layout-root #wifi-card-front .opacity-60,
        .print-layout-root #wifi-card-front .opacity-70,
        .print-layout-root #wifi-card-front .opacity-80 {
          opacity: 1 !important;
        }

        .print-layout-root #wifi-card-back .modern-back-overlay {
          display: none !important;
        }

        .print-layout-root #wifi-card-back .modern-back-qr-shell {
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.2);
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .print-layout-root #wifi-card-back .qr-code-svg {
          display: block !important;
          opacity: 1 !important;
        }

        .print-layout-root #wifi-card-back .modern-back-caption {
          background: #f3f4f6 !important;
          border-color: #d1d5db !important;
        }

        .print-layout-root #wifi-card-back .modern-back-caption span {
          opacity: 1 !important;
          color: #111827 !important;
        }

        .print-layout-root[data-orientation="portrait"] #wifi-card-front,
        .print-layout-root[data-orientation="portrait"] #wifi-card-back {
          overflow: visible !important;
        }

        .print-a4-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6mm;
        }

        .print-modern-duplex {
          display: grid;
          gap: 8mm;
        }

        .print-page-break-before {
          break-before: page;
          page-break-before: always;
        }

        .print-a4-grid .print-card-wrapper {
          min-height: 45mm;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .print-a4-grid .print-card-wrapper > * {
          transform-origin: top center;
          transform: scale(0.45);
        }

        .print-layout-root[data-orientation="portrait"] .print-a4-grid .print-card-wrapper > * {
          transform: scale(0.34);
        }

        .print-table-tent {
          display: grid;
          grid-template-rows: auto auto;
          gap: 8mm;
          justify-items: center;
        }

        .print-table-tent .print-card-wrapper {
          width: 150mm;
          height: 86mm;
          display: flex;
          justify-content: center;
        }

        .print-table-tent .print-card-wrapper > * {
          transform-origin: top center;
          transform: scale(0.92);
        }

        .print-table-tent-flip {
          transform: rotate(180deg);
        }

        .print-layout-root[data-layout="single"] .print-card-wrapper {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .print-layout-root[data-layout="single"] .print-card-wrapper > * {
          transform: none;
        }

        .print-business-card {
          width: 88.9mm;
          height: 50.8mm;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .print-business-card > * {
          transform-origin: top center;
          transform: scale(0.5);
        }

        .print-layout-root[data-orientation="portrait"] .print-business-card > * {
          transform: scale(0.3);
        }

        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }

          .print-layout-root,
          .print-layout-root * {
            visibility: visible;
          }

          .print-layout-root {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 0;
          }

          .print-layout-root[data-layout="single"],
          .print-layout-root[data-layout="business-card"] {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 8mm;
          }
        }
      `}</style>
    </div>
  )
}
