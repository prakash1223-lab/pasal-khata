const CACHE_NAME    = 'pasal-khata-v1'
const OFFLINE_PAGE  = '/index.html'

// Only cache these specific static shell files
const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
]

// ── Install: pre-cache shell only ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url).catch(() => {})))
    )
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: smart routing ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1. Never intercept non-GET requests
  if (request.method !== 'GET') return

  // 2. Never intercept API calls — always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ success: false, message: 'You are offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )
    return
  }

  // 3. Never intercept JS/CSS assets — let Vite serve them fresh
  //    This prevents the MIME type error when SW returns HTML for a .js request
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js')        ||
    url.pathname.endsWith('.css')       ||
    url.pathname.endsWith('.jsx')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // If offline and asset isn't cached, fail gracefully
        return new Response('', { status: 503 })
      })
    )
    return
  }

  // 4. Navigation requests (HTML pages) — network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh shell
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(OFFLINE_PAGE, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(OFFLINE_PAGE)
          return cached || new Response('<h1>Offline</h1>', {
            headers: { 'Content-Type': 'text/html' }
          })
        })
    )
    return
  }

  // 5. Everything else (images, fonts, manifest) — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => new Response('', { status: 503 }))
    })
  )
})
