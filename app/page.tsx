"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Download, Printer, Palette, RotateCw, Calendar, Sparkles } from "lucide-react"
import { BusinessCardTemplate } from "@/components/business-card-template"
import { ModernCardTemplate } from "@/components/modern-card-template"
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

  // Update colors when template changes
  useEffect(() => {
    if (template === "modern") {
      setPrimaryColor("#10b981") // Emerald
      setSecondaryColor("#064e3b") // Dark emerald
    } else {
      setPrimaryColor("#3b82f6") // Blue
      setSecondaryColor("#dbeafe") // Light blue
    }
  }, [template])
  const [enable3D, setEnable3D] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
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

    // Use a clean ref for capturing 
    try {
      // Find the specific card elements we want to capture
      // For modern card, we want to capture the side that is currently "up" or both?
      // Let's capture the side based on isFlipped state or just the front if not specified
      
      let targetElement: HTMLElement | null = null;
      
      if (template === "business") {
        targetElement = document.getElementById("wifi-card");
      } else {
        // For modern, we grab the flat version from our hidden stash
        // We can't grab the 3D transformed one easily
        // So we will grab the "print" version which is flat, but we need to pick one side
        // Let's grab the Front by default or the currently visible one?
        // Since we have a "download-staging" area now (see below), we use that.
        
        // Actually, let's create a temporary clean render for download
        // We will clone the element logic into a temp div
      }

      // Create a temporary container
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "fixed"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      tempContainer.style.zIndex = "-1"
      // Ensure specific width/height to avoid cutoff
      tempContainer.style.width = orientation === "portrait" ? "340px" : "580px"
      tempContainer.style.height = orientation === "portrait" ? "580px" : "340px"
      document.body.appendChild(tempContainer)

      // Create a div to render the template into
      // We need to mount a React component or just copy HTML?
      // Copying HTML is safer for now as we are outside React render cycle
      
      if (template === "business") {
          const original = document.getElementById("wifi-card");
          if (original) tempContainer.innerHTML = original.outerHTML;
      } else {
          // For Modern, we want to capture the FACE that is visible
          // The visible face is determined by isFlipped
          // But capturing the 3D element is hard.
          // We can use the hidden "flat" versions we will add to the DOM
          const selector = isFlipped ? "#wifi-card-back-flat" : "#wifi-card-front-flat";
          const original = document.querySelector(selector);
          if (original) {
             tempContainer.innerHTML = original.outerHTML;
          }
      }
      
      // Clean up any potential duplicates in ID in the clone to avoid confusion?
      // html2canvas doesn't care about IDs much if we pass the element directly
      const elementToCapture = tempContainer.firstElementChild as HTMLElement;
      if (!elementToCapture) throw new Error("Could not find element to capture");

      // Use html2canvas
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(elementToCapture, {
        scale: 2,
        logging: false,
        backgroundColor: null,
        useCORS: true,
      })

      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `wifi-${ssid || "network"}-${template}.png`
      downloadLink.href = pngFile
      downloadLink.click()

      document.body.removeChild(tempContainer)

      toast({
        title: "Card downloaded successfully",
        description: `Saved as wifi-${ssid || "network"}.png`,
      })

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
      orientation: orientation as "landscape" | "portrait",
    }

    if (template === "modern") {
      return (
        <ModernCardTemplate 
          {...commonProps} 
          side={forceSide || (isFlipped ? "back" : "front")} 
        />
      )
    }

    // Business template doesn't support sides yet, but we pass common props
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

    // Modern Template with 3D Flip
    if (template === "modern") {
      // 3D Flip Container
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
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden z-20">
              {renderCardTemplate("front")}
            </div>
            
            {/* Back Side (Rotated) */}
            <div 
              className="absolute inset-0 backface-hidden rotate-diagonal-180 z-10"
            >
              {renderCardTemplate("back")}
            </div>
          </div>
        </div>
      )

      return (
        <>
          <div className="print:hidden w-full flex justify-center">
             {enable3D ? <Card3DWrapper>{flipCard}</Card3DWrapper> : flipCard}
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

          {/* Print Layout for Modern (Both sides) */}
          <div className="hidden print:flex print:flex-col print:gap-8 print:items-center print:w-full">
            <div className="print-page-break-after">
              {renderCardTemplate("front")}
            </div>
            <div>
              {renderCardTemplate("back")}
            </div>
          </div>
        </>
      )
    }

    // Business Template (Single Side)
    return (
      <>
        <div className="w-full flex justify-center print:hidden">
          {enable3D ? (
            <Card3DWrapper>
              <div style={{ width: orientation === "portrait" ? "320px" : "560px" }}>
                {renderCardTemplate()}
              </div>
            </Card3DWrapper>
          ) : (
            <div style={{ width: orientation === "portrait" ? "320px" : "560px" }}>
              {renderCardTemplate()}
            </div>
          )}
        </div>
        
        {/* Print Layout for Business */}
        <div className="hidden print:flex print:justify-center print:items-center print:w-full">
           {renderCardTemplate()}
        </div>
      </>
    )
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
        
        @media print {
          /* General Reset for Print */
          body {
            background: white !important;
            color: black !important;
          }

          /* Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* But allow the print container and its relevant children to be visible */
          .print\:flex, .print\:flex * {
            visibility: visible !important;
          }
          .print\:block, .print\:block * {
            visibility: visible !important;
          }

          /* Specifically target our cards */
          #wifi-card, #wifi-card-front, #wifi-card-back {
            visibility: visible !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            margin: 0 auto 20px auto !important;
            max-width: 100% !important;
            transform: none !important; /* Remove any 3D transforms */
            position: relative !important;
            left: auto !important;
            top: auto !important;
          }
          
          /* Ensure QR codes are visible */
          .qr-code-svg {
             visibility: visible !important;
          }

          /* Hide the UI wrappers */
          .print\:hidden {
            display: none !important;
          }
          
          /* Layout adjustments */
          .print\:flex {
             display: flex !important;
             width: 100% !important;
             align-items: center !important;
             justify-content: center !important;
          }

          .print-page-break-after {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </div>
  )
}
