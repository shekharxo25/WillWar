/* WillWar service worker (hand-written; see docs/DECISIONS.md).
 * Scope: /app/. Precache the shell and /app/offline. NetworkFirst for app pages,
 * StaleWhileRevalidate for Learn and static assets. Never cache /api/*.
 * VERSION is stamped by scripts/stamp-sw.mjs at release time.
 */
const VERSION = "dev";
const SHELL = `ww-shell-${VERSION}`;
const PAGES = `ww-pages-${VERSION}`;
const ASSETS = `ww-assets-${VERSION}`;
const PRECACHE = ["/app/offline", "/app/today", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ww-") && !k.endsWith(`-${VERSION}`)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/sounds/") ||
    /\.(woff2|png|svg|ico|css|js)$/.test(url.pathname)
  );
}

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  } catch {
    const hit = (await cache.match(req)) || (await caches.match(req));
    if (hit) return hit;
    return (await caches.match("/app/offline")) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req);
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok && (res.type === "basic" || res.type === "cors")) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cached
  if (req.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (url.pathname.startsWith("/learn") || url.pathname.startsWith("/app/learn") || isStatic(url)) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

// Push: discreet copy comes from the server payload; fall back to a neutral line.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "WillWar";
  const body = data.body || "Tap to check in.";
  event.waitUntil(self.registration.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/monochrome-512.png", data: { url: data.url || "/app/today" } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.navigate(url).then((w) => (w || c).focus());
      return self.clients.openWindow(url);
    }),
  );
});
