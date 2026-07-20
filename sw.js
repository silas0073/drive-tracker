const CACHE = "drive-tracker-v6";
const SHELL = ["/manifest.json", "/icon-192.png", "/icon-512.png", "/icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache API calls — always hit the network for live drive data.
  if (url.pathname.startsWith("/api/")) return;

  // App shell (the page itself): network-first, so new deploys show up
  // immediately instead of serving a stale cached version. Falls back to
  // cache only if offline.
  const isAppShell = e.request.mode === "navigate" || url.pathname === "/" || url.pathname === "/index.html";
  if (isAppShell) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first is fine, they rarely change.
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
