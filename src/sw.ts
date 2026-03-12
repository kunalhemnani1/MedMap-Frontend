import {
    CacheFirst,
    CacheableResponsePlugin,
    ExpirationPlugin,
    NetworkFirst,
    Serwist,
    StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    // No precache entries — esbuild compiles this outside webpack so there's
    // no manifest injection. Runtime caching handles all offline scenarios.
    precacheEntries: [],
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // OpenStreetMap tiles — cache-first, 30 days, max 1 000 tiles
        {
            matcher: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: new CacheFirst({
                cacheName: "osm-tiles-v1",
                plugins: [
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                    new ExpirationPlugin({
                        maxEntries: 1000,
                        maxAgeSeconds: 30 * 24 * 60 * 60,
                    }),
                ],
            }),
        },
        // Leaflet marker icons (unpkg CDN)
        {
            matcher: /^https:\/\/unpkg\.com\/leaflet/,
            handler: new CacheFirst({
                cacheName: "leaflet-assets-v1",
                plugins: [
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                    new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
                ],
            }),
        },
        // Overpass API (nearby hospital data) — stale-while-revalidate, 24 h
        {
            matcher: /^https:\/\/overpass-api\.de\//,
            handler: new StaleWhileRevalidate({
                cacheName: "overpass-v1",
                plugins: [
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                    new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 }),
                ],
            }),
        },
        // Next.js static assets (JS chunks, CSS, images) — stale-while-revalidate
        {
            matcher: /\/_next\/static\//,
            handler: new StaleWhileRevalidate({
                cacheName: "next-static-v1",
                plugins: [
                    new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 }),
                ],
            }),
        },
        // Navigation (HTML pages) — network-first with cache fallback
        {
            matcher: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: new NetworkFirst({
                cacheName: "pages-v1",
                plugins: [
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }),
                ],
            }),
        },
    ],
});

serwist.addEventListeners();
