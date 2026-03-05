export interface SharePayload {
  s: string
  p?: string
  e: string
  h: boolean
  t: string
  pc: string
  sc: string
  o: string
  a?: string
  x?: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64Url(bytes: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function importKey(rawKey: Uint8Array) {
  return crypto.subtle.importKey("raw", toArrayBuffer(rawKey), "AES-GCM", false, ["encrypt", "decrypt"])
}

export async function createEncryptedShareToken(payload: SharePayload) {
  const rawKey = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await importKey(rawKey)

  const plaintext = encoder.encode(JSON.stringify(payload))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  const cipherBytes = new Uint8Array(encrypted)

  return {
    token: `${toBase64Url(iv)}.${toBase64Url(cipherBytes)}`,
    key: toBase64Url(rawKey),
  }
}

export async function decryptShareToken(token: string, keyValue: string): Promise<SharePayload> {
  const [ivEncoded, cipherEncoded] = token.split(".")
  if (!ivEncoded || !cipherEncoded) {
    throw new Error("Invalid encrypted payload")
  }

  const iv = fromBase64Url(ivEncoded)
  const cipherBytes = fromBase64Url(cipherEncoded)
  const rawKey = fromBase64Url(keyValue)

  const key = await importKey(rawKey)
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(cipherBytes))
  const json = decoder.decode(new Uint8Array(decrypted))

  return JSON.parse(json) as SharePayload
}
