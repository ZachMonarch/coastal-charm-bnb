// Service Worker for Monarch Property Management
// Version: Auto-managed by vite-plugin-pwa
// This file is a fallback only - production uses VitePWA's generated SW

const CACHE_VERSION = 'monarch-v2-' + Date.now();
const STATIC_CACHE = CACHE_VERSION + '-static';

// Minimal critical assets - DO NOT cache HTML (causes stale content)
const STATIC_ASSETS = [
  '/icons/icon-512.png'
];

// Install - skip waiting for immediate activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // Graceful caching - don't fail install if assets missing
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(() => console.warn('SW: Asset not found:', url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('monarch-') && name !== STATIC_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network-first for HTML/API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external domains
  if (!request.url.startsWith(self.location.origin)) return;
  
  const url = new URL(request.url);
  
  // NEVER cache HTML - always network first to prevent stale content
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Static assets (JS/CSS/images) - stale-while-revalidate
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Handle messages from main thread (cache clear, etc)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => 
      Promise.all(names.map(name => caches.delete(name)))
    ).then(() => {
      event.ports[0]?.postMessage({ cleared: true });
    });
  }
});
