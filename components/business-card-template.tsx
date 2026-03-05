import type React from "react"
import { Wifi, Info, Calendar } from "lucide-react"
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
}

export const BusinessCardTemplate: React.FC<CardTemplateProps> = ({
  ssid,
  password,
  encryption,
  qrValue,
  showPassword,
  showSSID,
  additionalInfo,
  primaryColor = "#3b82f6", // Default blue
  secondaryColor = "#dbeafe", // Default light blue
  expirationDate,
  isHiddenNetwork,
  orientation = "landscape",
}) => {
  // Create gradient colors from the primary and secondary colors
  const fromColor = secondaryColor
  const toColor = secondaryColor.replace(/[^,]+(?=\))/, "0.3") // Make the "to" color more transparent

  const cardStyle = {
    background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})`,
    borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
    width: orientation === "portrait" ? "320px" : "560px",
    height: orientation === "portrait" ? "560px" : "320px",
    aspectRatio: orientation === "portrait" ? "4/7" : "7/4",
  }

  return (

    <div
      id="wifi-card"
      className={`p-6 rounded-lg shadow-md border flex flex-col justify-between`}
      style={cardStyle}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Wifi style={{ color: primaryColor }} size={24} />
          <h3 className="font-bold text-xl" style={{ color: primaryColor }}>
            WiFi Access
          </h3>
        </div>
        <div
          className="text-xs font-medium px-2 py-1 rounded-full border"
          style={{
            color: primaryColor,
            backgroundColor: secondaryColor.replace(/[^,]+(?=\))/, "0.3"),
            borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
          }}
        >
          Scan to connect
        </div>
      </div>

      <div className={`flex ${orientation === "portrait" ? "flex-col items-center text-center flex-1 justify-center" : "items-center h-full"} gap-6`}>
        <div className="flex-1 w-full flex flex-col justify-center gap-4">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className={`flex items-center ${orientation === "portrait" ? "justify-center" : ""} gap-1`}>
                <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                  NETWORK NAME
                </p>
                {isHiddenNetwork && <span className="text-xs text-gray-500 italic">(hidden)</span>}
              </div>
              <p className="font-bold text-gray-800 break-words text-xl">{isHiddenNetwork && !showSSID ? "••••••••" : ssid}</p>
            </div>

            {password && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                  PASSWORD
                </p>
                <p className="font-medium text-gray-700 break-words text-lg">{showPassword ? password : "••••••••"}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                SECURITY
              </p>
              <p className="text-sm text-gray-700">{encryption === "NONE" ? "Open Network" : encryption}</p>
            </div>

            {expirationDate && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                  EXPIRES
                </p>
                <div className={`flex items-center ${orientation === "portrait" ? "justify-center" : ""} gap-1`}>
                  <Calendar size={14} style={{ color: primaryColor }} />
                  <p className="text-sm text-gray-700">{format(expirationDate, "MMM d, yyyy")}</p>
                </div>
              </div>
            )}
          </div>

          {additionalInfo && (
            <div className="pt-2 border-t border-gray-200/50 mt-auto">
              <div className={`flex items-start ${orientation === "portrait" ? "justify-center" : ""} gap-1`}>
                <Info size={14} className="mt-0.5" style={{ color: primaryColor }} />
                <p className="text-sm text-gray-700">{additionalInfo}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm shrink-0">
          <QRCodeSVG
            value={qrValue}
            size={orientation === "portrait" ? 180 : 150}
            className="qr-code-svg"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
      </div>

      <div
        className="mt-4 pt-3 border-t text-center shrink-0"
        style={{ borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2") }}
      >
        <p className="text-xs" style={{ color: primaryColor.replace(/[^,]+(?=\))/, "0.7") }}>
          Scan this QR code with your camera app to connect automatically
        </p>
      </div>
    </div>
  )
}
