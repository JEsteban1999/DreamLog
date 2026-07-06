// DreamLog service worker — PWA (offline básico) + notificaciones push.

const CACHE = "dreamlog-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/pwa-icon.svg", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Nunca cachear llamadas a la API ni cross-origin (Supabase, backend, fuentes).
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api")) return;

  // Navegaciones (index.html): network-first con fallback a cache (offline).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put("/index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets con hash (immutables): cache-first, poblando la cache al vuelo.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
    )
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "DreamLog", body: "Tienes una notificación nueva." };
  try {
    data = event.data.json();
  } catch {
    // payload no era JSON, usamos el default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa-icon.svg",
      badge: "/pwa-icon.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
