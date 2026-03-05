type WifiEncryption = "WPA" | "WEP" | "NONE" | "nopass" | string

interface BuildWifiQrValueOptions {
  ssid: string
  password: string
  encryption: WifiEncryption
  isHiddenNetwork: boolean
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:\"])/g, "\\$1")
}

function normalizeEncryption(encryption: WifiEncryption) {
  if (encryption === "WEP") return "WEP"
  if (encryption === "NONE" || encryption === "nopass") return "nopass"
  return "WPA"
}

export function buildWifiQrValue({ ssid, password, encryption, isHiddenNetwork }: BuildWifiQrValueOptions) {
  if (!ssid) return ""

  const normalizedEncryption = normalizeEncryption(encryption)
  const escapedSsid = escapeWifiValue(ssid)
  const escapedPassword = escapeWifiValue(password)

  const payload = [`WIFI:T:${normalizedEncryption};`, `S:${escapedSsid};`]

  if (normalizedEncryption !== "nopass") {
    payload.push(`P:${escapedPassword};`)
  }

  if (isHiddenNetwork) {
    payload.push("H:true;")
  }

  payload.push(";")
  return payload.join("")
}
