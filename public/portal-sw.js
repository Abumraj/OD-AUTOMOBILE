// OD Business Portal service worker.
// Keeps the app shell available when the connection drops. Private data is never cached:
// every /api request goes straight to the network.
const SHELL_CACHE = 'od-portal-shell-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add('/portal')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    // Page navigations: try the network, fall back to the cached shell so the app can still open.
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match('/portal')));
    }
});
