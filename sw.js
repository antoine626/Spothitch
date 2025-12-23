// ============================================================
// 🔧 SPOTHITCH SERVICE WORKER - Offline-First Strategy
// ============================================================
// Version: 1.0.0
// Date: 23/12/2024
// ============================================================

const CACHE_VERSION = 'spothitch-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    // CDN dependencies (cache externe)
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Patterns pour le routing des requêtes
const API_PATTERNS = [
    /firebaseio\.com/,
    /googleapis\.com/,
    /firebasestorage\.app/
];

const OSRM_PATTERN = /router\.project-osrm\.org/;
const TILE_PATTERN = /basemaps\.cartocdn\.com|tile\.openstreetmap\.org/;
const NOMINATIM_PATTERN = /nominatim\.openstreetmap\.org/;

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v1...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Cache failed:', err);
            })
    );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
                        .map(key => {
                            console.log('[SW] Deleting old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Ignorer chrome-extension et autres schemes non-http
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Strategy: API Firebase → Network-first avec cache fallback
    if (API_PATTERNS.some(pattern => pattern.test(url.href))) {
        event.respondWith(networkFirstWithCache(event.request, API_CACHE));
        return;
    }
    
    // Strategy: OSRM routing → Network-first avec cache 5min
    if (OSRM_PATTERN.test(url.href)) {
        event.respondWith(networkFirstWithTimeout(event.request, DYNAMIC_CACHE, 5000));
        return;
    }
    
    // Strategy: Map tiles → Cache-first (les tiles changent rarement)
    if (TILE_PATTERN.test(url.href)) {
        event.respondWith(cacheFirst(event.request, DYNAMIC_CACHE));
        return;
    }
    
    // Strategy: Nominatim geocoding → Network-first avec cache
    if (NOMINATIM_PATTERN.test(url.href)) {
        event.respondWith(networkFirstWithCache(event.request, DYNAMIC_CACHE));
        return;
    }
    
    // Strategy: Static assets → Cache-first
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

// ==================== STRATEGIES ====================

/**
 * Cache-First Strategy
 * Essaie le cache d'abord, puis le réseau
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        // Ne mettre en cache que les réponses valides
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        // Si offline et pas de cache, retourner une réponse d'erreur
        return new Response('Offline - Resource not cached', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network-First Strategy avec cache fallback
 * Essaie le réseau d'abord, puis le cache si offline
 */
async function networkFirstWithCache(request, cacheName) {
    try {
        const response = await fetch(request);
        
        // Mettre en cache la réponse valide
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        // Si offline, essayer le cache
        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] Serving from cache (offline):', request.url);
            return cached;
        }
        
        return new Response(JSON.stringify({ error: 'offline', cached: false }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Network-First avec timeout
 * Si le réseau est trop lent, utilise le cache
 */
async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        
        // Timeout ou erreur réseau → essayer le cache
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        return new Response(JSON.stringify({ error: 'timeout', cached: false }), {
            status: 504,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ==================== BACKGROUND SYNC ====================
// Pour synchroniser les données quand on revient en ligne

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-spots') {
        event.waitUntil(syncPendingSpots());
    }
    
    if (event.tag === 'sync-validations') {
        event.waitUntil(syncPendingValidations());
    }
});

async function syncPendingSpots() {
    // Cette fonction sera appelée quand l'utilisateur revient en ligne
    // Elle doit lire les spots en attente depuis IndexedDB et les envoyer à Firebase
    console.log('[SW] Syncing pending spots...');
    
    // TODO: Implémenter avec IndexedDB
    // const pendingSpots = await idb.get('pending-spots');
    // for (const spot of pendingSpots) {
    //     await fetch('/api/spots', { method: 'POST', body: JSON.stringify(spot) });
    // }
}

async function syncPendingValidations() {
    console.log('[SW] Syncing pending validations...');
    // TODO: Implémenter
}

// ==================== PUSH NOTIFICATIONS ====================
// Pour les futures notifications push

self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'Nouvelle notification SpotHitch',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'dismiss', title: 'Ignorer' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'SpotHitch', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'dismiss') return;
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Si une fenêtre existe déjà, la focus
                for (const client of clientList) {
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Sinon, ouvrir une nouvelle fenêtre
                return clients.openWindow(url);
            })
    );
});

// ==================== PERIODIC SYNC ====================
// Pour rafraîchir les données en arrière-plan

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'refresh-spots') {
        event.waitUntil(refreshSpotsCache());
    }
});

async function refreshSpotsCache() {
    console.log('[SW] Periodic refresh of spots cache...');
    // TODO: Fetch latest spots and update cache
}

console.log('[SW] Service Worker script loaded');
