const STATIC_CACHE = "wifi-card-static-v1"
const RUNTIME_CACHE = "wifi-card-runtime-v1"
const OFFLINE_URLS = ["/", "/share"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const requestUrl = new URL(event.request.url)

  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/_next/") ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return
  }

  const isDocument = event.request.mode === "navigate"

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, cloned))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          return caches.match("/")
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const cloned = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, cloned))
          return response
        })
        .catch(() => caches.match("/"))
    }),
  )
})
