const CACHE_NAME = "lia-v3-1-cache";
const ASSETS = [
  "/",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/assets/lia-icon.svg",
  "/assets/lia-icon-192.png",
  "/assets/lia-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/chat") || url.pathname.startsWith("/login") || url.pathname.startsWith("/logout")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
