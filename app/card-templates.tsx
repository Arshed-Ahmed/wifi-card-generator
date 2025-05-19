import type React from "react"
import { Wifi, Lock, Globe, Info, Calendar } from "lucide-react"
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
}) => {
  // Create gradient colors from the primary and secondary colors
  const fromColor = secondaryColor
  const toColor = secondaryColor.replace(/[^,]+(?=\))/, "0.3") // Make the "to" color more transparent

  return (
    <div
      id="wifi-card"
      className="p-6 rounded-lg shadow-md border w-full print:shadow-none"
      style={{
        background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})`,
        borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
      }}
    >
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                NETWORK NAME
              </p>
              {isHiddenNetwork && <span className="text-xs text-gray-500 italic">(hidden)</span>}
            </div>
            <p className="font-bold text-gray-800 break-words">{isHiddenNetwork && !showSSID ? "••••••••" : ssid}</p>
          </div>

          {password && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                PASSWORD
              </p>
              <p className="font-medium text-gray-700 break-words">{showPassword ? password : "••••••••"}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
              SECURITY
            </p>
            <p className="text-sm text-gray-700">{encryption === "NONE" ? "Open Network" : encryption}</p>
          </div>

          {expirationDate && (
            <div className="mt-4 flex items-start gap-1">
              <Calendar size={14} className="mt-0.5" style={{ color: primaryColor }} />
              <div>
                <p className="text-xs font-medium" style={{ color: primaryColor }}>
                  EXPIRES
                </p>
                <p className="text-sm text-gray-700">{format(expirationDate, "MMMM d, yyyy")}</p>
              </div>
            </div>
          )}

          {additionalInfo && (
            <div className="mt-4 flex items-start gap-1">
              <Info size={14} className="mt-0.5" style={{ color: primaryColor }} />
              <p className="text-sm text-gray-700">{additionalInfo}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCodeSVG
            value={qrValue}
            size={160}
            className="qr-code-svg"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
      </div>

      <div
        className="mt-4 pt-3 border-t text-center"
        style={{ borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2") }}
      >
        <p className="text-xs" style={{ color: primaryColor.replace(/[^,]+(?=\))/, "0.7") }}>
          Scan this QR code with your camera app to connect automatically
        </p>
      </div>
    </div>
  )
}

export const ModernCardTemplate: React.FC<CardTemplateProps> = ({
  ssid,
  password,
  encryption,
  qrValue,
  showPassword,
  showSSID,
  additionalInfo,
  primaryColor = "#6366f1", // Default indigo
  secondaryColor = "#eef2ff", // Default light indigo
  expirationDate,
  isHiddenNetwork,
}) => {
  // Create gradient colors from the primary and secondary colors
  const fromColor = secondaryColor
  const toColor = secondaryColor.replace(/[^,]+(?=\))/, "0.3") // Make the "to" color more transparent

  return (
    <div
      id="wifi-card"
      className="p-6 rounded-lg shadow-md border w-full print:shadow-none"
      style={{
        background: `linear-gradient(to right, ${fromColor}, ${toColor})`,
        borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full" style={{ backgroundColor: primaryColor, color: "white" }}>
            <Wifi size={18} />
          </div>
          <h3 className="font-bold text-xl" style={{ color: primaryColor }}>
            Connect
          </h3>
        </div>
        <div
          className="text-xs bg-white font-medium px-3 py-1 rounded-full border shadow-sm"
          style={{
            color: primaryColor,
            borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
          }}
        >
          WiFi
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1">
              <Globe size={14} style={{ color: primaryColor.replace(/[^,]+(?=\))/, "0.7") }} />
              <p className="text-xs font-medium" style={{ color: primaryColor }}>
                NETWORK
              </p>
              {isHiddenNetwork && <span className="text-xs text-gray-500 italic">(hidden)</span>}
            </div>
            <p className="font-bold text-gray-800 break-words">{isHiddenNetwork && !showSSID ? "••••••••" : ssid}</p>
          </div>

          {password && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <Lock size={14} style={{ color: primaryColor.replace(/[^,]+(?=\))/, "0.7") }} />
                <p className="text-xs font-medium" style={{ color: primaryColor }}>
                  PASSWORD
                </p>
              </div>
              <p className="font-medium text-gray-700 break-words">{showPassword ? password : "••••••••"}</p>
            </div>
          )}

          <div
            className="inline-block bg-white px-3 py-1 rounded-full text-xs border shadow-sm"
            style={{
              color: primaryColor,
              borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2"),
            }}
          >
            {encryption === "NONE" ? "Open Network" : encryption}
          </div>

          {expirationDate && (
            <div className="mt-4 flex items-start gap-1">
              <Calendar size={14} className="mt-0.5" style={{ color: primaryColor }} />
              <div>
                <p className="text-xs font-medium" style={{ color: primaryColor }}>
                  VALID UNTIL
                </p>
                <p className="text-sm text-gray-700">{format(expirationDate, "MMMM d, yyyy")}</p>
              </div>
            </div>
          )}

          {additionalInfo && (
            <div className="mt-4 flex items-start gap-1">
              <Info size={14} className="mt-0.5" style={{ color: primaryColor }} />
              <p className="text-sm text-gray-700">{additionalInfo}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm">
          <QRCodeSVG
            value={qrValue}
            size={160}
            className="qr-code-svg"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
      </div>

      <div
        className="mt-5 pt-3 border-t text-center"
        style={{ borderColor: primaryColor.replace(/[^,]+(?=\))/, "0.2") }}
      >
        <p className="text-xs" style={{ color: primaryColor.replace(/[^,]+(?=\))/, "0.7") }}>
          Scan with your phone camera to connect
        </p>
      </div>
    </div>
  )
}
