// Kill-switch service worker (TanStack Start migration).
// Replaces the old Workbox / vite-plugin-pwa worker at the same URL so returning
// browsers evict it. Only this app's own caches are deleted.
function isAppCache(name) {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  if (hasWorkboxBucket && name.endsWith(self.registration.scope)) return true;
  // Runtime caches configured by the old vite-plugin-pwa setup + fallback worker
  return name === "unsplash-images" || name === "supabase-api" || name.startsWith("monarch-");
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.filter(isAppCache).map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
