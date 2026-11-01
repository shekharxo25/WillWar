/* WillWar service worker (scope /app/). Generated into public/sw.js by scripts/stamp-sw.mjs.
 * Rules (docs/guardrails/pwa-native-feel.md): precache the shell and /app/offline;
 * NetworkFirst for app pages; StaleWhileRevalidate for /learn and static assets;
 * never cache /api/* or anything user-specific. */
const VERSION = "__SW_VERSION__";
const SHELL = `ww-shell-${VERSION}`;
const PAGES = `ww-pages-${VERSION}`;
const STATIC = `ww-static-${VERSION}`;
const PRECACHE = ["/app/offline", "/app/today", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ww-") && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isRsc(request) {
  return request.headers.get("RSC") === "1" || new URL(request.url).searchParams.has("_rsc");
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request, { ignoreSearch: true })) || (await caches.match(request, { ignoreSearch: true }));
    return cached || (await caches.match("/app/offline")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cached
  if (url.pathname.startsWith("/app/auth/")) return;
  if (isRsc(request)) return;

  if (request.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname.startsWith("/learn") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Push: discreet copy comes from the server; this only displays it.
self.addEventListener("push", (event) => {
  let data = { title: "WillWar", body: "Tap to check in.", url: "/app/today" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // keep the discreet default
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-monochrome-96.png",
      tag: data.tag || "willwar",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/app/today", self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin + "/app") && "focus" in client) {
          client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
