// Service Worker — TerangaGym PWA
const CACHE = 'terangagym-v1'
const OFFLINE_URLS = ['/', '/portal', '/manifest.json']

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS).catch(() => {}))
  )
})

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin except QR code API
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin && !url.hostname.includes('qrserver.com')) return

  // API calls: network only (don't cache)
  if (url.pathname.startsWith('/api/')) return

  // Everything else: network-first, fall back to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ── Push notification handler ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() }
  catch { data = { notification: { title: 'TerangaGym', body: event.data.text() } } }

  const notif = data.notification ?? data
  const title = notif.title ?? 'TerangaGym'
  const options = {
    body: notif.body ?? '',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    data: { url: notif.data?.url ?? '/portal' },
    requireInteraction: false,
    tag: notif.tag ?? 'terangagym-notif',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/portal'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/portal') && 'focus' in c) return c.focus()
      }
      return clients.openWindow(url)
    })
  )
})
