/**
 * Offline Map Service
 * Handles downloading map zones (tiles + spots) for offline use
 * Stores tiles and spot data in IndexedDB
 */

import { Storage, SpotHitchDB } from '../utils/storage.js';
import { getAllLoadedSpots } from './spotLoader.js';
import { icon } from '../utils/icons.js'

// Constants
const DB_NAME = 'spothitch-offline-maps';
const DB_VERSION = 1;
const TILES_STORE = 'tiles';
const ZONES_STORE = 'zones';

// Tile server URL (OpenStreetMap)
const TILE_SERVER = 'https://tile.openstreetmap.org';

// Max tiles per zone to prevent abuse
const MAX_TILES_PER_ZONE = 5000;

// Tile size in bytes (approximate for estimation)
const APPROX_TILE_SIZE = 15000; // ~15KB average

// Database instance
let db = null;

/**
 * Initialize the offline map database
 * @returns {Promise<IDBDatabase>}
 */
export async function initOfflineMapDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineMap] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create tiles store with composite key (z, x, y)
      if (!database.objectStoreNames.contains(TILES_STORE)) {
        const tilesStore = database.createObjectStore(TILES_STORE, {
          keyPath: ['zoneId', 'z', 'x', 'y'],
        });
        tilesStore.createIndex('zoneId', 'zoneId', { unique: false });
      }

      // Create zones store
      if (!database.objectStoreNames.contains(ZONES_STORE)) {
        const zonesStore = database.createObjectStore(ZONES_STORE, {
          keyPath: 'id',
        });
        zonesStore.createIndex('createdAt', 'createdAt', { unique: false });
        zonesStore.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

/**
 * Calculate tile coordinates from lat/lng at a given zoom level
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 * @returns {{x: number, y: number}}
 */
export function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/**
 * Calculate lat/lng from tile coordinates
 * @param {number} x - Tile X
 * @param {number} y - Tile Y
 * @param {number} zoom - Zoom level
 * @returns {{lat: number, lng: number}}
 */
export function tileToLatLng(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/**
 * Get all tiles needed for a bounding box at given zoom levels
 * @param {Object} bounds - {north, south, east, west}
 * @param {number[]} zoomLevels - Array of zoom levels
 * @returns {Array<{z: number, x: number, y: number}>}
 */
export function getTilesForBounds(bounds, zoomLevels) {
  const tiles = [];

  for (const zoom of zoomLevels) {
    const topLeft = latLngToTile(bounds.north, bounds.west, zoom);
    const bottomRight = latLngToTile(bounds.south, bounds.east, zoom);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ z: zoom, x, y });
      }
    }
  }

  return tiles;
}

/**
 * Estimate the size of a zone download
 * @param {Object} bounds - {north, south, east, west}
 * @param {number[]} zoomLevels - Array of zoom levels (default: [8, 10, 12, 14])
 * @returns {{tileCount: number, estimatedSize: number, estimatedSizeMB: number, spotsCount: number}}
 */
export function getZoneSize(bounds, zoomLevels = [8, 10, 12, 14]) {
  if (!bounds || !isValidBounds(bounds)) {
    console.warn('[OfflineMap] Invalid bounds for getZoneSize');
    return { tileCount: 0, estimatedSize: 0, estimatedSizeMB: 0, spotsCount: 0 };
  }

  const tiles = getTilesForBounds(bounds, zoomLevels);
  const spotsInZone = getSpotsInBounds(bounds);

  const estimatedSize = tiles.length * APPROX_TILE_SIZE;
  const estimatedSizeMB = Math.round((estimatedSize / (1024 * 1024)) * 10) / 10;

  return {
    tileCount: tiles.length,
    estimatedSize,
    estimatedSizeMB,
    spotsCount: spotsInZone.length,
  };
}

/**
 * Validate bounds object
 * @param {Object} bounds
 * @returns {boolean}
 */
function isValidBounds(bounds) {
  if (!bounds) return false;
  const { north, south, east, west } = bounds;

  if (
    typeof north !== 'number' ||
    typeof south !== 'number' ||
    typeof east !== 'number' ||
    typeof west !== 'number'
  ) {
    return false;
  }

  if (north < south) return false;
  if (north > 90 || south < -90) return false;
  if (east > 180 || west < -180) return false;

  return true;
}

/**
 * Get spots within a bounding box
 * @param {Object} bounds - {north, south, east, west}
 * @returns {Array}
 */
export function getSpotsInBounds(bounds) {
  if (!bounds || !isValidBounds(bounds)) return [];

  return getAllLoadedSpots().filter((spot) => {
    if (!spot.coordinates) return false;
    const { lat, lng } = spot.coordinates;
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });
}

/**
 * Generate a unique zone ID
 * @returns {string}
 */
function generateZoneId() {
  return `zone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Download a zone for offline use
 * @param {Object} bounds - {north, south, east, west}
 * @param {number[]} zoomLevels - Array of zoom levels (default: [8, 10, 12, 14])
 * @param {Object} options - {name: string, onProgress: function}
 * @returns {Promise<{zoneId: string, tileCount: number, spotsCount: number, size: number}>}
 */
export async function downloadZone(bounds, zoomLevels = [8, 10, 12, 14], options = {}) {
  const { name = 'Zone sans nom', onProgress = null } = options;

  if (!bounds || !isValidBounds(bounds)) {
    throw new Error('Invalid bounds provided');
  }

  await initOfflineMapDB();

  const tiles = getTilesForBounds(bounds, zoomLevels);

  if (tiles.length > MAX_TILES_PER_ZONE) {
    throw new Error(
      `Zone too large: ${tiles.length} tiles (max ${MAX_TILES_PER_ZONE}). Reduce area or zoom levels.`
    );
  }

  const zoneId = generateZoneId();
  const spotsInZone = getSpotsInBounds(bounds);

  // Create zone record
  const zone = {
    id: zoneId,
    name,
    bounds,
    zoomLevels,
    tileCount: tiles.length,
    downloadedTiles: 0,
    spotsCount: spotsInZone.length,
    spots: spotsInZone,
    createdAt: Date.now(),
    status: 'downloading',
    size: 0,
  };

  // Save zone metadata
  await saveZone(zone);

  // Download tiles
  let downloadedCount = 0;
  let totalSize = 0;
  const failedTiles = [];

  for (const tile of tiles) {
    try {
      const tileData = await downloadTile(tile.z, tile.x, tile.y);
      await saveTile(zoneId, tile.z, tile.x, tile.y, tileData);
      totalSize += tileData.byteLength || tileData.length || APPROX_TILE_SIZE;
      downloadedCount++;

      if (onProgress) {
        onProgress({
          downloaded: downloadedCount,
          total: tiles.length,
          percent: Math.round((downloadedCount / tiles.length) * 100),
        });
      }
    } catch (error) {
      console.warn(`[OfflineMap] Failed to download tile ${tile.z}/${tile.x}/${tile.y}:`, error.message);
      failedTiles.push(tile);
    }
  }

  // Update zone with final status
  zone.downloadedTiles = downloadedCount;
  zone.size = totalSize;
  zone.status = failedTiles.length > 0 ? 'partial' : 'complete';
  zone.failedTiles = failedTiles.length;
  await saveZone(zone);

  return {
    zoneId,
    tileCount: downloadedCount,
    spotsCount: spotsInZone.length,
    size: totalSize,
    status: zone.status,
  };
}

/**
 * Download a single tile
 * @param {number} z - Zoom level
 * @param {number} x - Tile X
 * @param {number} y - Tile Y
 * @returns {Promise<ArrayBuffer>}
 */
async function downloadTile(z, x, y) {
  const url = `${TILE_SERVER}/${z}/${x}/${y}.png`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SpotHitch PWA/2.0 (contact@spothitch.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.arrayBuffer();
}

/**
 * Save a tile to IndexedDB
 * @param {string} zoneId
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {ArrayBuffer} data
 * @returns {Promise<void>}
 */
async function saveTile(zoneId, z, x, y, data) {
  const database = await initOfflineMapDB();
  const tx = database.transaction(TILES_STORE, 'readwrite');
  const store = tx.objectStore(TILES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put({
      zoneId,
      z,
      x,
      y,
      data,
      cachedAt: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save zone metadata to IndexedDB
 * @param {Object} zone
 * @returns {Promise<void>}
 */
async function saveZone(zone) {
  const database = await initOfflineMapDB();
  const tx = database.transaction(ZONES_STORE, 'readwrite');
  const store = tx.objectStore(ZONES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put(zone);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all downloaded zones
 * @returns {Promise<Array>}
 */
export async function getDownloadedZones() {
  await initOfflineMapDB();

  const tx = db.transaction(ZONES_STORE, 'readonly');
  const store = tx.objectStore(ZONES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a specific zone by ID
 * @param {string} zoneId
 * @returns {Promise<Object|null>}
 */
export async function getZone(zoneId) {
  if (!zoneId) return null;

  await initOfflineMapDB();

  const tx = db.transaction(ZONES_STORE, 'readonly');
  const store = tx.objectStore(ZONES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(zoneId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a zone and its tiles
 * @param {string} zoneId
 * @returns {Promise<boolean>}
 */
export async function deleteZone(zoneId) {
  if (!zoneId) {
    console.warn('[OfflineMap] No zoneId provided for deletion');
    return false;
  }

  await initOfflineMapDB();

  // Delete tiles first
  const tx1 = db.transaction(TILES_STORE, 'readwrite');
  const tilesStore = tx1.objectStore(TILES_STORE);
  const tilesIndex = tilesStore.index('zoneId');

  await new Promise((resolve, reject) => {
    const cursorRequest = tilesIndex.openCursor(IDBKeyRange.only(zoneId));
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });

  // Delete zone metadata
  const tx2 = db.transaction(ZONES_STORE, 'readwrite');
  const zonesStore = tx2.objectStore(ZONES_STORE);

  return new Promise((resolve, reject) => {
    const request = zonesStore.delete(zoneId);
    request.onsuccess = () => {
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a coordinate is available offline
 * @param {Object} coords - {lat, lng}
 * @param {number} zoom - Zoom level to check
 * @returns {Promise<boolean>}
 */
export async function isZoneAvailable(coords, zoom = 12) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return false;
  }

  await initOfflineMapDB();

  const tile = latLngToTile(coords.lat, coords.lng, zoom);

  const tx = db.transaction(TILES_STORE, 'readonly');
  const store = tx.objectStore(TILES_STORE);

  // Check all zones for this tile
  return new Promise((resolve) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        if (record.z === zoom && record.x === tile.x && record.y === tile.y) {
          resolve(true);
          return;
        }
        cursor.continue();
      } else {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

/**
 * Get an offline tile
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @returns {Promise<Blob|null>}
 */
export async function getOfflineTile(z, x, y) {
  await initOfflineMapDB();

  const tx = db.transaction(TILES_STORE, 'readonly');
  const store = tx.objectStore(TILES_STORE);

  return new Promise((resolve) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        if (record.z === z && record.x === x && record.y === y && record.data) {
          const blob = new Blob([record.data], { type: 'image/png' });
          resolve(blob);
          return;
        }
        cursor.continue();
      } else {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

/**
 * Get spots for a downloaded zone
 * @param {string} zoneId
 * @returns {Promise<Array>}
 */
export async function getZoneSpots(zoneId) {
  const zone = await getZone(zoneId);
  return zone?.spots || [];
}

/**
 * Get total storage used by offline maps
 * @returns {Promise<{totalSize: number, totalSizeMB: number, zoneCount: number}>}
 */
export async function getOfflineMapStorage() {
  const zones = await getDownloadedZones();

  const totalSize = zones.reduce((sum, zone) => sum + (zone.size || 0), 0);
  const totalSizeMB = Math.round((totalSize / (1024 * 1024)) * 10) / 10;

  return {
    totalSize,
    totalSizeMB,
    zoneCount: zones.length,
  };
}

/**
 * Clear all offline map data
 * @returns {Promise<boolean>}
 */
export async function clearAllOfflineMaps() {
  await initOfflineMapDB();

  // Clear tiles store
  const tx1 = db.transaction(TILES_STORE, 'readwrite');
  await new Promise((resolve, reject) => {
    const request = tx1.objectStore(TILES_STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Clear zones store
  const tx2 = db.transaction(ZONES_STORE, 'readwrite');
  await new Promise((resolve, reject) => {
    const request = tx2.objectStore(ZONES_STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return true;
}

/**
 * Create offline tile layer configuration.
 * For raster fallback when offline — vector tiles (MapLibre) require
 * a service worker approach for full offline support.
 * @returns {Object} Tile layer options with getTileUrl helper
 */
export function createOfflineTileLayer() {
  return {
    getTileUrl: async function (coords) {
      const offlineTile = await getOfflineTile(coords.z, coords.x, coords.y);
      if (offlineTile) {
        return URL.createObjectURL(offlineTile);
      }
      return `${TILE_SERVER}/${coords.z}/${coords.x}/${coords.y}.png`;
    },
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };
}

/**
 * Render a zone card for the UI
 * @param {Object} zone
 * @returns {string} HTML string
 */
export function renderZoneCard(zone) {
  if (!zone) return '';

  const sizeMB = Math.round((zone.size || 0) / (1024 * 1024) * 10) / 10;
  const statusEmoji = zone.status === 'complete' ? '✅' : zone.status === 'partial' ? '⚠️' : '⏳';
  const statusText =
    zone.status === 'complete'
      ? 'Complet'
      : zone.status === 'partial'
      ? 'Partiel'
      : 'En cours';

  const date = new Date(zone.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `
    <div class="offline-zone-card bg-white dark:bg-dark-secondary rounded-xl shadow-lg p-4 mb-4" data-zone-id="${zone.id}">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-lg text-white">${escapeHTML(zone.name)}</h3>
          <p class="text-sm text-slate-400 dark:text-slate-400">${date}</p>
        </div>
        <span class="px-2 py-1 rounded-full text-xs font-medium ${
          zone.status === 'complete'
            ? 'bg-green-100 text-green-800'
            : zone.status === 'partial'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-blue-100 text-blue-800'
        }">
          ${statusEmoji} ${statusText}
        </span>
      </div>
      <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
        <span>${icon('map-pin', 'w-5 h-5 mr-1')} ${zone.spotsCount} spots</span>
        <span>${icon('grid-2x2', 'w-5 h-5 mr-1')} ${zone.downloadedTiles} tuiles</span>
        <span>${icon('database', 'w-5 h-5 mr-1')} ${sizeMB} MB</span>
      </div>
      <div class="flex gap-2">
        <button
          onclick="window.viewOfflineZone('${zone.id}')"
          class="flex-1 px-3 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition text-sm"
        >
          ${icon('eye', 'w-5 h-5 mr-1')} Voir
        </button>
        <button
          onclick="window.deleteOfflineZone('${zone.id}')"
          class="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition text-sm"
        >
          ${icon('trash', 'w-5 h-5 mr-1')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global handlers for UI interactions
if (typeof window !== 'undefined') {
  window.viewOfflineZone = async (zoneId) => {
    const zone = await getZone(zoneId);
    if (zone && zone.bounds) {
      // Dispatch event for map component to handle
      window.dispatchEvent(
        new CustomEvent('offlineZoneView', { detail: zone })
      );
    }
  };

  window.deleteOfflineZone = async (zoneId) => {
    if (confirm('Supprimer cette zone hors-ligne ?')) {
      await deleteZone(zoneId);
      // Dispatch event for UI refresh
      window.dispatchEvent(new CustomEvent('offlineZoneDeleted', { detail: { zoneId } }));
    }
  };
}

// Export for testing
export const _testHelpers = {
  isValidBounds,
  generateZoneId,
  escapeHTML,
  TILE_SERVER,
  MAX_TILES_PER_ZONE,
  APPROX_TILE_SIZE,
};

export default {
  initOfflineMapDB,
  downloadZone,
  getDownloadedZones,
  getZone,
  deleteZone,
  getZoneSize,
  isZoneAvailable,
  getSpotsInBounds,
  getOfflineTile,
  getZoneSpots,
  getOfflineMapStorage,
  clearAllOfflineMaps,
  createOfflineTileLayer,
  renderZoneCard,
  latLngToTile,
  tileToLatLng,
  getTilesForBounds,
};
