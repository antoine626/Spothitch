// ============================================================
// 🔧 SPOTHITCH SERVICE WORKER v3 - Optimized Performance
// ============================================================
// Version: 3.0.0
// Date: 26/12/2025
// Features: Precache, Runtime Cache, Stale-While-Revalidate, 
//           Background Sync, Message Channel, Cache Cleanup
// ============================================================

const SW_VERSION = '3.0.0';
const CACHE_PREFIX = 'spothitch';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v3`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v3`;
const API_CACHE = `${CACHE_PREFIX}-api-v3`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v3`;

// Base path for GitHub Pages
const BASE_PATH = '/Spothitch';

// ==================== PRECACHE MANIFEST ====================
// Critical resources for offline-first experience
const PRECACHE_URLS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/offline.html`,
    `${BASE_PATH}/icon-192.png`,
    `${BASE_PATH}/icon-512.png`,
    `${BASE_PATH}/favicon.png`,
];

// External resources to cache on first use
const RUNTIME_CACHE_CONFIG = {
    // CDN stylesheets - cache first, update in background
    stylesheets: [
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
        'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    ],
    // CDN scripts - cache first
    scripts: [
        'https://cdn.tailwindcss.com',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
    ],
};

// URL patterns for routing
const PATTERNS = {
    firebase: /firebaseio\.com|googleapis\.com|firebasestorage\.app/,
    osrm: /router\.project-osrm\.org/,
    tiles: /basemaps\.cartocdn\.com|tile\.openstreetmap\.org|tiles\.stadiamaps\.com/,
    nominatim: /nominatim\.openstreetmap\.org/,
    fonts: /fonts\.googleapis\.com|fonts\.gstatic\.com/,
    images: /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i,
};

// Cache size limits
const CACHE_LIMITS = {
    [DYNAMIC_CACHE]: 100,
    [API_CACHE]: 50,
    [IMAGE_CACHE]: 200,
};

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing v${SW_VERSION}...`);
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            
            // Precache with error handling for each resource
            const results = await Promise.allSettled(
                PRECACHE_URLS.map(async (url) => {
                    try {
                        const response = await fetch(url, { cache: 'reload' });
                        if (response.ok) {
                            await cache.put(url, response);
                            return { url, status: 'cached' };
                        }
                        return { url, status: 'failed', reason: response.status };
                    } catch (err) {
                        return { url, status: 'failed', reason: err.message };
                    }
                })
            );
            
            const cached = results.filter(r => r.value?.status === 'cached').length;
            console.log(`[SW] Precached ${cached}/${PRECACHE_URLS.length} resources`);
            
            // Skip waiting to activate immediately
            await self.skipWaiting();
        })()
    );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating v${SW_VERSION}...`);
    
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            const oldCaches = cacheNames.filter(name => 
                name.startsWith(CACHE_PREFIX) && 
                ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE].includes(name)
            );
            
            await Promise.all(oldCaches.map(name => {
                console.log(`[SW] Deleting old cache: ${name}`);
                return caches.delete(name);
            }));
            
            // Take control of all clients
            await self.clients.claim();
            
            // Notify clients of update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SW_UPDATED',
                    version: SW_VERSION
                });
            });
            
            console.log(`[SW] Activated v${SW_VERSION}`);
        })()
    );
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip non-http(s) requests
    if (!url.protocol.startsWith('http')) return;
    
    // Skip chrome-extension and other internal requests
    if (url.protocol === 'chrome-extension:') return;
    
    // Route based on URL pattern
    if (PATTERNS.firebase.test(url.href)) {
        event.respondWith(networkFirst(request, API_CACHE, 10000));
        return;
    }
    
    if (PATTERNS.osrm.test(url.href)) {
        event.respondWith(networkFirst(request, API_CACHE, 5000));
        return;
    }
    
    if (PATTERNS.tiles.test(url.href)) {
        event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
        return;
    }
    
    if (PATTERNS.nominatim.test(url.href)) {
        event.respondWith(networkFirst(request, API_CACHE, 8000));
        return;
    }
    
    if (PATTERNS.fonts.test(url.href)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }
    
    if (PATTERNS.images.test(url.pathname)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }
    
    // CDN resources (stylesheets and scripts)
    if (RUNTIME_CACHE_CONFIG.stylesheets.some(s => url.href.includes(s)) ||
        RUNTIME_CACHE_CONFIG.scripts.some(s => url.href.includes(s))) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }
    
    // Default: Network first with offline fallback for documents
    if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }
    
    // Default for other requests
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

// ==================== CACHING STRATEGIES ====================

/**
 * Cache First - Try cache, fallback to network
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
            trimCache(cacheName);
        }
        return response;
    } catch (err) {
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network First - Try network with timeout, fallback to cache
 */
async function networkFirst(request, cacheName, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
            trimCache(cacheName);
        }
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        
        const cached = await caches.match(request);
        if (cached) {
            console.log(`[SW] Serving from cache: ${request.url}`);
            return cached;
        }
        
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale While Revalidate - Return cache immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    // Fetch in background
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
            trimCache(cacheName);
        }
        return response;
    }).catch(() => null);
    
    // Return cached immediately if available
    if (cached) {
        return cached;
    }
    
    // Otherwise wait for network
    const response = await fetchPromise;
    if (response) {
        return response;
    }
    
    return new Response('Offline', { status: 503 });
}

/**
 * Network First with Offline Fallback for HTML pages
 */
async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        const offlinePage = await caches.match(`${BASE_PATH}/offline.html`);
        if (offlinePage) {
            return offlinePage;
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Trim cache to respect size limits
 */
async function trimCache(cacheName) {
    const limit = CACHE_LIMITS[cacheName];
    if (!limit) return;
    
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > limit) {
        // Delete oldest entries
        const toDelete = keys.slice(0, keys.length - limit);
        await Promise.all(toDelete.map(key => cache.delete(key)));
        console.log(`[SW] Trimmed ${toDelete.length} items from ${cacheName}`);
    }
}

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
    console.log(`[SW] Background sync: ${event.tag}`);
    
    if (event.tag === 'sync-spots') {
        event.waitUntil(syncPendingSpots());
    }
    
    if (event.tag === 'sync-reviews') {
        event.waitUntil(syncPendingReviews());
    }
});

async function syncPendingSpots() {
    try {
        // Try to access IndexedDB via client
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            clients[0].postMessage({ type: 'SYNC_SPOTS' });
        }
    } catch (err) {
        console.error('[SW] Sync failed:', err);
    }
}

async function syncPendingReviews() {
    console.log('[SW] Syncing pending reviews...');
    // Implementation depends on app structure
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'SpotHitch', body: event.data.text() };
    }
    
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: `${BASE_PATH}/icon-192.png`,
        badge: `${BASE_PATH}/icon-96.png`,
        vibrate: [100, 50, 100],
        data: { url: data.url || `${BASE_PATH}/` },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'dismiss', title: 'Ignorer' }
        ],
        tag: data.tag || 'spothitch-notification',
        renotify: true,
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'SpotHitch', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'dismiss') return;
    
    const url = event.notification.data?.url || `${BASE_PATH}/`;
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window if found
                for (const client of clientList) {
                    if (client.url.includes(BASE_PATH) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                return clients.openWindow(url);
            })
    );
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0]?.postMessage({ version: SW_VERSION });
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then(names => 
                    Promise.all(names.map(name => caches.delete(name)))
                ).then(() => {
                    event.ports[0]?.postMessage({ success: true });
                })
            );
            break;
            
        case 'CACHE_URLS':
            if (payload?.urls) {
                event.waitUntil(
                    caches.open(DYNAMIC_CACHE).then(cache => 
                        Promise.allSettled(payload.urls.map(url => 
                            fetch(url).then(res => res.ok && cache.put(url, res))
                        ))
                    ).then(() => {
                        event.ports[0]?.postMessage({ success: true });
                    })
                );
            }
            break;
    }
});

// ==================== PERIODIC SYNC ====================
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'refresh-spots') {
        event.waitUntil(refreshSpotsCache());
    }
});

async function refreshSpotsCache() {
    console.log('[SW] Periodic refresh...');
    // Notify clients to refresh data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'REFRESH_DATA' });
    });
}

// ==================== LOGGING ====================
console.log(`[SW] Service Worker v${SW_VERSION} loaded`);
