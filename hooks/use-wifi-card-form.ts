import { useEffect, useMemo, useRef, useState } from "react"
import { buildWifiQrValue } from "@/lib/wifi-qr"

export type WifiTemplate = "business" | "modern"
export type WifiOrientation = "landscape" | "portrait"

type SecurityType = "WPA" | "WEP" | "NONE"

export interface WifiFormSnapshot {
  ssid: string
  password: string
  encryption: SecurityType
  template: WifiTemplate
  isHiddenNetwork: boolean
  additionalInfo: string
  orientation: WifiOrientation
  primaryColor: string
  secondaryColor: string
  enable3D: boolean
  shareIncludesPassword: boolean
}

export interface SavedWifiProfile {
  id: string
  name: string
  data: WifiFormSnapshot
}

type PresetKey = "home" | "office" | "cafe" | "event"

const PRESET_PROFILES: Record<PresetKey, Omit<WifiFormSnapshot, "ssid" | "password">> = {
  home: {
    encryption: "WPA",
    template: "business",
    isHiddenNetwork: false,
    additionalInfo: "Welcome! Scan to connect to home WiFi.",
    orientation: "landscape",
    primaryColor: "#3b82f6",
    secondaryColor: "#dbeafe",
    enable3D: true,
    shareIncludesPassword: true,
  },
  office: {
    encryption: "WPA",
    template: "modern",
    isHiddenNetwork: false,
    additionalInfo: "Guest WiFi access for office visitors.",
    orientation: "landscape",
    primaryColor: "#10b981",
    secondaryColor: "#064e3b",
    enable3D: true,
    shareIncludesPassword: false,
  },
  cafe: {
    encryption: "WPA",
    template: "business",
    isHiddenNetwork: false,
    additionalInfo: "Thanks for visiting! Enjoy complimentary WiFi.",
    orientation: "portrait",
    primaryColor: "#f97316",
    secondaryColor: "#ffedd5",
    enable3D: false,
    shareIncludesPassword: false,
  },
  event: {
    encryption: "WPA",
    template: "modern",
    isHiddenNetwork: false,
    additionalInfo: "Event guest network. Access valid during event hours.",
    orientation: "portrait",
    primaryColor: "#8b5cf6",
    secondaryColor: "#4c1d95",
    enable3D: true,
    shareIncludesPassword: false,
  },
}

const STORAGE_KEY = "wifi-card-generator:saved-profiles"

export function useWifiCardForm() {
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [encryption, setEncryption] = useState<SecurityType>("WPA")
  const [showPassword, setShowPassword] = useState(false)
  const [showSSID, setShowSSID] = useState(true)
  const [template, setTemplate] = useState<WifiTemplate>("business")
  const [isHiddenNetwork, setIsHiddenNetwork] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [orientation, setOrientation] = useState<WifiOrientation>("landscape")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#dbeafe")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [enable3D, setEnable3D] = useState(true)
  const [shareIncludesPassword, setShareIncludesPassword] = useState(true)
  const [savedProfiles, setSavedProfiles] = useState<SavedWifiProfile[]>([])
  const skipTemplateColorSyncRef = useRef(false)

  const applySnapshot = (snapshot: WifiFormSnapshot) => {
    skipTemplateColorSyncRef.current = true
    setSsid(snapshot.ssid)
    setPassword(snapshot.password)
    setEncryption(snapshot.encryption)
    setTemplate(snapshot.template)
    setIsHiddenNetwork(snapshot.isHiddenNetwork)
    setAdditionalInfo(snapshot.additionalInfo)
    setOrientation(snapshot.orientation)
    setPrimaryColor(snapshot.primaryColor)
    setSecondaryColor(snapshot.secondaryColor)
    setEnable3D(snapshot.enable3D)
    setShareIncludesPassword(snapshot.shareIncludesPassword)
  }

  const getCurrentSnapshot = (): WifiFormSnapshot => ({
    ssid,
    password,
    encryption,
    template,
    isHiddenNetwork,
    additionalInfo,
    orientation,
    primaryColor,
    secondaryColor,
    enable3D,
    shareIncludesPassword,
  })

  const applyPreset = (preset: PresetKey) => {
    const presetData = PRESET_PROFILES[preset]
    applySnapshot({
      ssid,
      password,
      ...presetData,
    })
  }

  const loadSavedProfiles = () => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setSavedProfiles([])
        return
      }

      const parsed = JSON.parse(raw) as SavedWifiProfile[]
      setSavedProfiles(parsed)
    } catch {
      setSavedProfiles([])
    }
  }

  const persistSavedProfiles = (profiles: SavedWifiProfile[]) => {
    setSavedProfiles(profiles)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    }
  }

  const saveCurrentProfile = (name: string) => {
    const profileName = name.trim()
    if (!profileName) return false

    const nextProfile: SavedWifiProfile = {
      id: crypto.randomUUID(),
      name: profileName,
      data: getCurrentSnapshot(),
    }

    persistSavedProfiles([nextProfile, ...savedProfiles])
    return true
  }

  const applySavedProfile = (profileId: string) => {
    const profile = savedProfiles.find((item) => item.id === profileId)
    if (!profile) return false

    applySnapshot(profile.data)
    return true
  }

  const deleteSavedProfile = (profileId: string) => {
    const remaining = savedProfiles.filter((item) => item.id !== profileId)
    persistSavedProfiles(remaining)
  }

  useEffect(() => {
    if (skipTemplateColorSyncRef.current) {
      skipTemplateColorSyncRef.current = false
      return
    }

    if (template === "modern") {
      setPrimaryColor("#10b981")
      setSecondaryColor("#064e3b")
      return
    }

    setPrimaryColor("#3b82f6")
    setSecondaryColor("#dbeafe")
  }, [template])

  useEffect(() => {
    setShowSSID(!isHiddenNetwork)
  }, [isHiddenNetwork])

  useEffect(() => {
    loadSavedProfiles()
  }, [])

  const qrValue = useMemo(
    () =>
      buildWifiQrValue({
        ssid,
        password,
        encryption,
        isHiddenNetwork,
      }),
    [ssid, password, encryption, isHiddenNetwork],
  )

  const validationErrors = useMemo(() => {
    const ssidError = ssid.trim().length === 0 ? "Network name is required." : ""

    let passwordError = ""
    if (encryption !== "NONE") {
      if (password.trim().length === 0) {
        passwordError = "Password is required for secured networks."
      } else if (encryption === "WPA" && password.length < 8) {
        passwordError = "WPA/WPA2/WPA3 password should be at least 8 characters."
      }
    }

    return {
      ssid: ssidError,
      password: passwordError,
    }
  }, [ssid, password, encryption])

  const isFormValid = !validationErrors.ssid && !validationErrors.password

  return {
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
  }
}
