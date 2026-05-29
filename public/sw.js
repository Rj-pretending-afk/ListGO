self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
// Pass all requests through to the network — Cloudflare CDN handles caching.
// The fetch handler is required for Chrome to consider the app installable.
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)))
