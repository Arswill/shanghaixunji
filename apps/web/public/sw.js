// Force unregister all service workers and clear all caches.
// This is a nuclear reset to clear stale SW caches from dev sessions.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() =>
      self.clients.matchAll().then((clients) =>
        clients.forEach((client) => client.navigate(client.url))
      )
    )
  )
})

// Pass-through: don't intercept any requests.
self.addEventListener('fetch', (event) => {
  // Do nothing — let the browser handle the request normally.
})
