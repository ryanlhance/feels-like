// Feels Like — service worker. Caches the app shell; shows offline.html when the
// network is unavailable (we intentionally do NOT cache live weather readings).
const CACHE = 'feelslike-v34';
const SHELL = ['./','./index.html','./offline.html','./manifest.webmanifest','./favicon.png','./apple-touch-icon.png','./icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let weather/geocode APIs hit network directly

  if (req.mode === 'navigate') {
    // Network-first for the page; fall back to a clear offline screen.
    e.respondWith(fetch(req).catch(() => caches.match('./offline.html')));
    return;
  }
  // Static assets: cache-first, then network.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => undefined)));
});
