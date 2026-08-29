/* Minimal service worker for ArmanOS.
 * - Network-first for navigations, with a cached offline fallback ('/').
 * - Cache-first for same-origin static assets (/_next/static, /favicon).
 * - Never caches /api/* or /admin.
 */

const CACHE_NAME = 'armanos-v1'
const OFFLINE_URL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return

  // Never touch API or admin routes.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return

  // Network-first for navigations, falling back to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    )
    return
  }

  // Cache-first for immutable/static assets.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/favicon/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
  }
})
