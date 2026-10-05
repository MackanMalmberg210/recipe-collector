// ==============================================================================
// Recipe Collector — Service Worker (PWA Offline Kitchen & Supermarket Mode)
// Version: 1.0.0
// ==============================================================================

const CACHE_NAME = "recipe-collector-v1";

// Critical static assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  "/",
  "/groceries",
  "/saved",
  "/planner",
  "/app-icon.svg",
  "/favicon.ico",
  "/manifest.webmanifest",
];

// Install Event — precache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("PWA precache warning:", err))
  );
});

// Activate Event — cleanup outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event — smart caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and API calls (always go directly to network)
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Skip external domain requests except Google fonts & Unsplash images
  const isSameOrigin = url.origin === self.location.origin;
  const isCdnAsset =
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("unsplash.com") ||
    url.hostname.includes("supabase.co");

  if (!isSameOrigin && !isCdnAsset) {
    return;
  }

  // 3. Navigation (HTML Pages) — Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // Fallback to cached root or groceries if in supermarket mode
          if (url.pathname.includes("groceries")) {
            const cachedGroceries = await caches.match("/groceries");
            if (cachedGroceries) return cachedGroceries;
          }

          const cachedHome = await caches.match("/");
          if (cachedHome) return cachedHome;

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline • Recipe Collector</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui;background:#12100e;color:#fafaf9;padding:2rem;text-align:center;"><h2>Offline Mode</h2><p>You are currently offline in the kitchen or supermarket. Reconnecting...</p></body></html>`,
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // 4. Static Assets (CSS, JS, Fonts, Images) — Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
