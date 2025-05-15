"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Download, Printer, Palette, RotateCw, Calendar, Sparkles } from "lucide-react"
import { BusinessCardTemplate, ModernCardTemplate } from "./card-templates"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card3DWrapper } from "./card-3d-wrapper"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function WifiCardGenerator() {
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [encryption, setEncryption] = useState("WPA")
  const [showPassword, setShowPassword] = useState(false)
  const [showSSID, setShowSSID] = useState(true)
  const [qrValue, setQrValue] = useState("")
  const [template, setTemplate] = useState("business")
  const [isHiddenNetwork, setIsHiddenNetwork] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [orientation, setOrientation] = useState("landscape")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6") // Default blue
  const [secondaryColor, setSecondaryColor] = useState("#dbeafe") // Default light blue
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [enable3D, setEnable3D] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // When hidden network is checked, hide the SSID by default
  useEffect(() => {
    if (isHiddenNetwork) {
      setShowSSID(false)
    } else {
      setShowSSID(true)
    }
  }, [isHiddenNetwork])

  // Generate QR code value whenever inputs change
  useEffect(() => {
    if (ssid) {
      // Format: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;H:<hidden>;;
      // Fixed the format to properly include the hidden parameter
      const hiddenParam = isHiddenNetwork ? "H:true;" : ""
      setQrValue(`WIFI:S:${ssid};T:${encryption};P:${password};${hiddenParam};`)
    } else {
      setQrValue("")
    }
  }, [ssid, password, encryption, isHiddenNetwork])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    if (!qrValue || isDownloading) return

    setIsDownloading(true)

    try {
      // Create a temporary container for the card without 3D effects
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "-9999px"
      document.body.appendChild(tempContainer)

      // Clone the card content without 3D effects
      const props = {
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
      }

      // Render the appropriate template
      const templateElement = document.createElement("div")
      templateElement.id = "temp-wifi-card"

      // Apply the template HTML directly
      if (template === "business") {
        const businessCard = document.querySelector("#wifi-card")
        if (businessCard) {
          templateElement.innerHTML = businessCard.outerHTML
        }
      } else {
        const modernCard = document.querySelector("#wifi-card")
        if (modernCard) {
          templateElement.innerHTML = modernCard.outerHTML
        }
      }

      tempContainer.appendChild(templateElement)

      // Wait for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100))

      try {
        // Use html2canvas to capture the temporary element
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(templateElement, {
          scale: 2,
          logging: false,
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
        })

        // Convert to PNG and download
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `wifi-${ssid}.png`
        downloadLink.href = pngFile
        downloadLink.click()

        // Clean up
        document.body.removeChild(tempContainer)

        toast({
          title: "Card downloaded successfully",
          description: `Saved as wifi-${ssid}.png`,
        })
      } catch (error) {
        console.error("Canvas capture error:", error)

        // Fallback method if html2canvas fails
        toast({
          title: "Using alternative download method",
          description: "The first method failed, trying another approach...",
        })

        // Try a simpler approach - just capture the visible card
        try {
          const visibleCard = document.getElementById("wifi-card")
          if (!visibleCard) throw new Error("Card element not found")

          const html2canvas = (await import("html2canvas")).default
          const canvas = await html2canvas(visibleCard, {
            scale: 2,
            logging: false,
            backgroundColor: null,
            allowTaint: true,
            useCORS: true,
          })

          const pngFile = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          downloadLink.download = `wifi-${ssid}.png`
          downloadLink.href = pngFile
          downloadLink.click()

          toast({
            title: "Card downloaded successfully",
            description: `Saved as wifi-${ssid}.png`,
          })
        } catch (fallbackError) {
          console.error("Fallback capture error:", fallbackError)
          toast({
            title: "Download failed",
            description: "Please try disabling the 3D effect and try again",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Please try disabling the 3D effect and try again",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const renderCardTemplate = () => {
    const props = {
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
    }

    switch (template) {
      case "business":
        return <BusinessCardTemplate {...props} />
      case "modern":
        return <ModernCardTemplate {...props} />
      default:
        return <BusinessCardTemplate {...props} />
    }
  }

  const renderCard = () => {
    if (!qrValue) {
      return (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          Enter network details to generate QR code
        </div>
      )
    }

    const cardContent = (
      <div
        className={`w-[90%] mx-auto ${orientation === "portrait" ? "rotate-90 transform origin-center mt-16 mb-16" : ""}`}
        ref={cardRef}
      >
        {renderCardTemplate()}
      </div>
    )

    if (enable3D) {
      return (
        <Card3DWrapper className="w-full flex justify-center items-center print:transform-none">
          {cardContent}
        </Card3DWrapper>
      )
    }

    return cardContent
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">WiFi Card Generator</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Network Details</CardTitle>
            <CardDescription>Enter your WiFi network information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">Network Name (SSID)</Label>
              <Input
                id="ssid"
                placeholder="Enter network name"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryption">Security Type</Label>
              <Select value={encryption} onValueChange={setEncryption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="NONE">None</SelectItem>
                </SelectContent>
              </Select>
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
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
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

              {isHiddenNetwork && (
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
              )}
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
              <Popover>
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
                    disabled={(date) => date < new Date()}
                  />
                  {expirationDate && (
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
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 pt-4">
              <Label className="flex items-center gap-2">
                <Palette size={16} />
                Card Template
              </Label>
              <Tabs value={template} onValueChange={setTemplate} className="w-full">
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
                <Tabs value={orientation} onValueChange={setOrientation} className="w-full">
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

            <div className="flex items-center space-x-2 pt-4">
              <div className="flex items-center space-x-2">
                <Switch id="3d-effect" checked={enable3D} onCheckedChange={setEnable3D} />
                <Label htmlFor="3d-effect" className="flex items-center gap-1">
                  <Sparkles size={16} />
                  3D Effect
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle>WiFi Card</CardTitle>
            <CardDescription>Scan this QR code to connect</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">{renderCard()}</CardContent>
          <CardFooter className="flex justify-center gap-4 print:hidden">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!qrValue || isDownloading}
              className="flex gap-2"
            >
              <Download size={18} />
              {isDownloading ? "Processing..." : "Download"}
            </Button>
            <Button onClick={handlePrint} disabled={!qrValue} className="flex gap-2">
              <Printer size={18} />
              Print
            </Button>
          </CardFooter>
        </Card>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          #wifi-card,
          #wifi-card * {
            visibility: visible;
            transform: none !important;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:transform-none * {
            transform: none !important;
            transition: none !important;
          }
          #wifi-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) ${orientation === "portrait" ? "rotate(90deg)" : ""} !important;
            border: 1px solid #e5e7eb;
            box-shadow: none !important;
            width: ${orientation === "portrait" ? "2.5in" : "4.5in"} !important;
            height: ${orientation === "portrait" ? "4.5in" : "2.5in"} !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
