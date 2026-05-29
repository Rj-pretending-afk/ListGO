// Minimal service worker — enables PWA installability.
// No caching strategy: the app uses Cloudflare CDN for assets and relies on
// live API calls, so we skip precaching to avoid stale-content issues.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
