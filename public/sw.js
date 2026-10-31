// GameVault offline storefront. API responses and private order data are never cached.
const CACHE_NAME = 'gamevault-v6'
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable.png']
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(PRECACHE_ASSETS.map(asset => cache.add(asset)))))
  // Updated workers wait for the visitor to choose Refresh.
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && /^(gamevault-|antigravity-coder-)/.test(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: { code: 'NETWORK_OFFLINE', message: 'You are offline. Reconnect to check your order or complete checkout.' } }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })))
    return
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/index.html')) || new Response('Offline — GameVault. Reconnect to continue shopping.', { headers: { 'Content-Type': 'text/plain' } })))
    return
  }
  if (!/\.(?:js|css|svg|png|jpe?g|webp|woff2)$/.test(url.pathname)) return
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(request)
    const fromNetwork = fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    }).catch(() => cached || Response.error())
    return cached || fromNetwork
  }))
})
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
