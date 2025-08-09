// Self-destructing Service Worker: unregister and clear caches, then get out of the way
// This file intentionally disables SW functionality until we re-enable it later.

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      // ignore
    }
    try {
      await self.registration.unregister();
    } catch (e) {
      // ignore
    }
    // Refresh open clients to pick up latest assets without SW
    try {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        client.navigate(client.url);
      }
    } catch (e) {
      // ignore
    }
  })());
});

// Pass-through fetch (no caching)
self.addEventListener('fetch', () => {});