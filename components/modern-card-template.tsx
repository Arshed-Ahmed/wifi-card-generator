import type React from "react"
import { Wifi, Lock, Info, Calendar } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"

interface CardTemplateProps {
  ssid: string
  password: string
  encryption: string
  qrValue: string
  showPassword: boolean
  showSSID: boolean
  additionalInfo?: string
  primaryColor?: string
  secondaryColor?: string
  expirationDate?: Date
  isHiddenNetwork?: boolean
  orientation?: "landscape" | "portrait"
  side?: "front" | "back"
}


export const ModernCardTemplate: React.FC<CardTemplateProps> = ({
  ssid,
  password,
  encryption,
  qrValue,
  showPassword,
  showSSID,
  additionalInfo,
  primaryColor = "#10b981", // Default emerald
  secondaryColor = "#064e3b", // Default dark emerald
  expirationDate,
  isHiddenNetwork,
  orientation = "landscape",
  side = "front",
}) => {
  // Use a dark theme by default for Modern
  const bgColor = secondaryColor
  const accentColor = primaryColor
  const textColor = "#ffffff"

  const cardStyle = {
    backgroundColor: bgColor,
    backgroundImage: `radial-gradient(circle at 10% 20%, ${accentColor}20 0%, transparent 20%), radial-gradient(circle at 90% 80%, ${accentColor}20 0%, transparent 20%)`,
    borderColor: accentColor,
    width: orientation === "portrait" ? "320px" : "560px",
    height: orientation === "portrait" ? "560px" : "320px",
    aspectRatio: orientation === "portrait" ? "4/7" : "7/4",
    color: textColor,
  }

  // Front side content (Details)
  if (side === "front") {
    return (
      <div
        id="wifi-card-front"
        className={`p-8 rounded-2xl shadow-xl border-0 w-full print:shadow-none overflow-hidden relative ${
          orientation === "portrait" ? "flex flex-col justify-between" : "flex flex-col"
        }`}
        style={cardStyle}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12 blur-xl"></div>

        <div className="flex items-start justify-between mb-2 relative z-10 shrink-0">
          <div>
            <h3 className="font-black text-3xl tracking-tighter" style={{ color: textColor }}>
              WI-FI
            </h3>
            <div className="h-1 w-12 mt-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <Wifi size={28} color={accentColor} />
          </div>
        </div>

        <div className={`flex-1 w-full relative z-10 flex flex-col ${orientation === "portrait" ? "justify-between" : "justify-start"}`}>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-1 pb-1">
            <div className="space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase opacity-60">Network (SSID)</p>
              <p className="font-bold text-2xl break-words tracking-tight leading-none">
                {isHiddenNetwork && !showSSID ? "••••••••" : ssid}
                {isHiddenNetwork && <span className="ml-2 text-xs opacity-50 font-normal italic">(hidden)</span>}
              </p>
            </div>

            {password && (
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-widest uppercase opacity-60">Password</p>
                <div className="w-full">
                  <p className="font-mono text-lg tracking-wider break-all bg-black/20 px-3 py-1 rounded-lg inline-block min-w-[50%]">
                    {showPassword ? password : "••••••••"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-4 mt-2 pt-2 pb-2 `}>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-1">Security</p>
              <div className="flex items-center gap-1.5">
                <Lock size={14} color={accentColor} />
                <span className="font-medium">{encryption === "NONE" ? "Open" : encryption}</span>
              </div>
            </div>

            {expirationDate && (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-1">Valid Until</p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} color={accentColor} />
                  <span className="font-medium">{format(expirationDate, "MMM d, yyyy")}</span>
                </div>
              </div>
            )}
          </div>

          {additionalInfo && (
            <div className="pt-4 border-t border-white/10 mb-0">
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 opacity-70 shrink-0" />
                <p className="text-sm opacity-80 leading-snug">{additionalInfo}</p>
              </div>
            </div>
          )}

          <div className="mt-4 pt-1 flex justify-between items-center opacity-40 relative z-10">
            <span className="text-[10px] uppercase tracking-widest">Connect Instantly</span>
            <span className="text-[10px] uppercase tracking-widest">Flip to Scan &rarr;</span>
          </div>
        </div>
      </div>
    )
  }

  // Back side content (QR Code)
  return (
    <div
      id="wifi-card-back"
      className={`p-8 rounded-2xl shadow-xl border-0 w-full print:shadow-none overflow-hidden relative flex flex-col items-center justify-center`}
      style={cardStyle}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10" 
           style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accentColor} 0, ${accentColor} 1px, transparent 0, transparent 50%)`, backgroundSize: '10px 10px' }}>
      </div>

      <div className="relative z-10 p-4 rounded-xl shadow-2xl bg-white/10 backdrop-blur-xl">
        <QRCodeSVG
          value={qrValue}
          size={orientation === "portrait" ? 200 : 180}
          className="qr-code-svg"
          includeMargin={false}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>

      <div className="mt-8 text-center relative z-10">
        <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <Wifi size={18} color={accentColor} />
          <span className="font-bold text-sm tracking-wide">Scan to Connect</span>
        </div>
      </div>
    </div>
  )
}

