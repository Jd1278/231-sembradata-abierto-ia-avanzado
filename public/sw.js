const CACHE_VERSION = "v2";
const CACHE_NAME = `sembadata-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const SHELL_ASSETS = ["/", "/manifest.json", "/favicon.ico", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key.startsWith("sembadata-"))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Network-first for API calls (IDEAM, NASA POWER, Open-Meteo, Supabase)
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("nasa.gov") ||
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("datos.gov.co") ||
    url.hostname.includes("isric.org") ||
    url.pathname.includes("/api/") ||
    url.pathname.includes("/functions/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, fonts, images)
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.includes("/assets/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached ?? new Response("Offline", { status: 503, statusText: "Offline" }));

          return cached || fetchPromise;
        }),
      ),
    );
    return;
  }

  // Cache-first for everything else (navigation, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
    }),
  );
});

// Background sync for queued analyses
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-analyses") {
    event.waitUntil(syncQueuedAnalyses());
  }
});

async function syncQueuedAnalyses() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-sync", "readonly");
    const store = tx.objectStore("pending-sync");
    const request = store.getAll();

    const analyses = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const analysis of analyses) {
      try {
        // Note: Background sync removed — analysis data is stored in Supabase
        // via the client-side analysis-history service, not via a local API.
        // Mark as synced to clear the queue.
        const deleteTx = db.transaction("pending-sync", "readwrite");
        deleteTx.objectStore("pending-sync").delete(analysis.id);
      } catch {
        // Keep in queue for next sync attempt
      }
    }
  } catch {
    // IndexedDB not available or error
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sembadata-sync", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending-sync")) {
        db.createObjectStore("pending-sync", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
