/**
 * Offline Maps Service
 * Download and manage offline map zones with spots
 */

import { Storage } from '../utils/storage.js'
import { sampleSpots } from '../data/spots.js'

// Constants
const TILE_SIZE = 256
const MAX_ZOOM = 14
const MIN_ZOOM = 8
const TILES_PER_ZONE = 100 // Approximate tiles per zone
const CACHE_NAME = 'spothitch-map-tiles-v1'

// Storage keys
const OFFLINE_ZONES_KEY = 'offlineMapZones'
const OFFLINE_TILES_INDEX_KEY = 'offlineTilesIndex'

/**
 * Predefined zones in Europe
 */
export const availableZones = [
  {
    id: 'ile-de-france',
    name: 'Ile-de-France',
    country: 'FR',
    flag: '🇫🇷',
    bounds: { north: 49.2, south: 48.1, east: 3.5, west: 1.4 },
    center: { lat: 48.8566, lng: 2.3522 },
    estimatedSize: '15 MB',
  },
  {
    id: 'benelux',
    name: 'Benelux',
    country: 'BE/NL/LU',
    flag: '🇧🇪',
    bounds: { north: 53.5, south: 49.5, east: 7.2, west: 2.5 },
    center: { lat: 51.0, lng: 4.5 },
    estimatedSize: '25 MB',
  },
  {
    id: 'baviere',
    name: 'Baviere',
    country: 'DE',
    flag: '🇩🇪',
    bounds: { north: 50.5, south: 47.3, east: 13.9, west: 8.9 },
    center: { lat: 48.7, lng: 11.5 },
    estimatedSize: '30 MB',
  },
  {
    id: 'catalogne',
    name: 'Catalogne',
    country: 'ES',
    flag: '🇪🇸',
    bounds: { north: 42.9, south: 40.5, east: 3.3, west: 0.2 },
    center: { lat: 41.4, lng: 2.0 },
    estimatedSize: '20 MB',
  },
  {
    id: 'lombardie',
    name: 'Lombardie',
    country: 'IT',
    flag: '🇮🇹',
    bounds: { north: 46.6, south: 44.7, east: 11.4, west: 8.5 },
    center: { lat: 45.5, lng: 9.9 },
    estimatedSize: '22 MB',
  },
  {
    id: 'autriche-ouest',
    name: 'Autriche Ouest',
    country: 'AT',
    flag: '🇦🇹',
    bounds: { north: 48.0, south: 46.4, east: 14.0, west: 9.5 },
    center: { lat: 47.3, lng: 11.4 },
    estimatedSize: '18 MB',
  },
  {
    id: 'pologne-sud',
    name: 'Pologne Sud',
    country: 'PL',
    flag: '🇵🇱',
    bounds: { north: 52.5, south: 49.0, east: 24.0, west: 18.0 },
    center: { lat: 50.0, lng: 20.0 },
    estimatedSize: '28 MB',
  },
  {
    id: 'portugal-centre',
    name: 'Portugal Centre',
    country: 'PT',
    flag: '🇵🇹',
    bounds: { north: 41.0, south: 38.0, east: -7.0, west: -10.0 },
    center: { lat: 39.5, lng: -8.5 },
    estimatedSize: '20 MB',
  },
]

/**
 * Get downloaded zones from storage
 * @returns {Array} Downloaded zones with status
 */
export function getDownloadedZones() {
  const zones = Storage.get(OFFLINE_ZONES_KEY)
  return zones || []
}

/**
 * Check if a zone is downloaded
 * @param {string} zoneId - Zone ID
 * @returns {boolean}
 */
export function isZoneDownloaded(zoneId) {
  const downloaded = getDownloadedZones()
  return downloaded.some(z => z.id === zoneId && z.status === 'complete')
}

/**
 * Get zone download status
 * @param {string} zoneId - Zone ID
 * @returns {Object|null} Zone status or null
 */
export function getZoneStatus(zoneId) {
  const downloaded = getDownloadedZones()
  return downloaded.find(z => z.id === zoneId) || null
}

/**
 * Calculate tile coordinates for a bounding box
 * @param {Object} bounds - {north, south, east, west}
 * @param {number} zoom - Zoom level
 * @returns {Array} Array of tile coordinates {x, y, z}
 */
function getTilesForBounds(bounds, zoom) {
  const tiles = []

  // Convert lat/lng to tile coordinates
  const latToTile = (lat, z) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))
  const lngToTile = (lng, z) => Math.floor((lng + 180) / 360 * Math.pow(2, z))

  const minX = lngToTile(bounds.west, zoom)
  const maxX = lngToTile(bounds.east, zoom)
  const minY = latToTile(bounds.north, zoom)
  const maxY = latToTile(bounds.south, zoom)

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y, z: zoom })
    }
  }

  return tiles
}

/**
 * Get total tiles count for a zone
 * @param {Object} zone - Zone object
 * @returns {number} Total tiles count
 */
export function getZoneTilesCount(zone) {
  let total = 0
  for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
    total += getTilesForBounds(zone.bounds, zoom).length
  }
  return total
}

/**
 * Download a zone for offline use
 * @param {string} zoneId - Zone ID
 * @param {Function} onProgress - Progress callback (percentage, status)
 * @returns {Promise<boolean>} Success status
 */
export async function downloadZone(zoneId, onProgress = () => {}) {
  const zone = availableZones.find(z => z.id === zoneId)
  if (!zone) {
    throw new Error(`Zone ${zoneId} not found`)
  }

  // Check if already downloaded
  if (isZoneDownloaded(zoneId)) {
    onProgress(100, 'already_downloaded')
    return true
  }

  // Update status to downloading
  updateZoneStatus(zoneId, 'downloading', 0)
  onProgress(0, 'starting')

  try {
    // Open cache
    const cache = await caches.open(CACHE_NAME)

    // Get all tiles to download
    const allTiles = []
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
      allTiles.push(...getTilesForBounds(zone.bounds, zoom))
    }

    const totalTiles = allTiles.length
    let downloadedTiles = 0

    // Download tiles in batches
    const batchSize = 10
    for (let i = 0; i < allTiles.length; i += batchSize) {
      const batch = allTiles.slice(i, i + batchSize)

      await Promise.all(batch.map(async tile => {
        const url = getTileUrl(tile)
        try {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response.clone())
          }
        } catch (e) {
          // Ignore individual tile errors
          console.warn(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}`)
        }
      }))

      downloadedTiles += batch.length
      const progress = Math.round((downloadedTiles / totalTiles) * 100)
      updateZoneStatus(zoneId, 'downloading', progress)
      onProgress(progress, 'downloading')
    }

    // Save spots for this zone
    const zoneSpots = getSpotsInBounds(zone.bounds)
    saveZoneSpots(zoneId, zoneSpots)

    // Mark as complete
    updateZoneStatus(zoneId, 'complete', 100, {
      downloadedAt: Date.now(),
      tilesCount: totalTiles,
      spotsCount: zoneSpots.length,
    })

    onProgress(100, 'complete')
    return true
  } catch (error) {
    console.error(`Failed to download zone ${zoneId}:`, error)
    updateZoneStatus(zoneId, 'error', 0)
    onProgress(0, 'error')
    throw error
  }
}

/**
 * Get tile URL for OSM tiles
 * @param {Object} tile - {x, y, z}
 * @returns {string} Tile URL
 */
function getTileUrl(tile) {
  // Use CartoDB dark tiles (same as main map)
  const servers = ['a', 'b', 'c', 'd']
  const server = servers[Math.abs(tile.x + tile.y) % servers.length]
  return `https://${server}.basemaps.cartocdn.com/dark_all/${tile.z}/${tile.x}/${tile.y}.png`
}

/**
 * Update zone status in storage
 * @param {string} zoneId - Zone ID
 * @param {string} status - Status (downloading, complete, error)
 * @param {number} progress - Progress percentage
 * @param {Object} extra - Extra data to store
 */
function updateZoneStatus(zoneId, status, progress, extra = {}) {
  const zones = getDownloadedZones()
  const existingIndex = zones.findIndex(z => z.id === zoneId)

  const zoneData = {
    id: zoneId,
    status,
    progress,
    ...extra,
    updatedAt: Date.now(),
  }

  if (existingIndex >= 0) {
    zones[existingIndex] = { ...zones[existingIndex], ...zoneData }
  } else {
    zones.push(zoneData)
  }

  Storage.set(OFFLINE_ZONES_KEY, zones)
}

/**
 * Get spots within bounds
 * @param {Object} bounds - {north, south, east, west}
 * @returns {Array} Spots in bounds
 */
function getSpotsInBounds(bounds) {
  return sampleSpots.filter(spot => {
    if (!spot.coordinates) return false
    const { lat, lng } = spot.coordinates
    return lat >= bounds.south && lat <= bounds.north &&
           lng >= bounds.west && lng <= bounds.east
  })
}

/**
 * Save spots for a zone
 * @param {string} zoneId - Zone ID
 * @param {Array} spots - Spots to save
 */
function saveZoneSpots(zoneId, spots) {
  Storage.set(`offlineSpots_${zoneId}`, spots)
}

/**
 * Get spots for an offline zone
 * @param {string} zoneId - Zone ID
 * @returns {Array} Spots
 */
export function getZoneSpots(zoneId) {
  return Storage.get(`offlineSpots_${zoneId}`) || []
}

/**
 * Delete a downloaded zone
 * @param {string} zoneId - Zone ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteZone(zoneId) {
  const zone = availableZones.find(z => z.id === zoneId)
  if (!zone) return false

  try {
    // Delete tiles from cache
    const cache = await caches.open(CACHE_NAME)
    const allTiles = []
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
      allTiles.push(...getTilesForBounds(zone.bounds, zoom))
    }

    await Promise.all(allTiles.map(tile => {
      const url = getTileUrl(tile)
      return cache.delete(url)
    }))

    // Delete spots
    Storage.remove(`offlineSpots_${zoneId}`)

    // Update zones list
    const zones = getDownloadedZones().filter(z => z.id !== zoneId)
    Storage.set(OFFLINE_ZONES_KEY, zones)

    return true
  } catch (error) {
    console.error(`Failed to delete zone ${zoneId}:`, error)
    return false
  }
}

/**
 * Get total offline storage size
 * @returns {Promise<string>} Formatted size
 */
export async function getOfflineStorageSize() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usedMB = (estimate.usage || 0) / (1024 * 1024)
      return `${usedMB.toFixed(1)} MB`
    }
    return 'N/A'
  } catch {
    return 'N/A'
  }
}

/**
 * Clear all offline map data
 * @returns {Promise<boolean>}
 */
export async function clearAllOfflineData() {
  try {
    await caches.delete(CACHE_NAME)
    Storage.remove(OFFLINE_ZONES_KEY)

    // Remove all zone spots
    availableZones.forEach(zone => {
      Storage.remove(`offlineSpots_${zone.id}`)
    })

    return true
  } catch (error) {
    console.error('Failed to clear offline data:', error)
    return false
  }
}

/**
 * Render offline maps management UI
 * @returns {string} HTML content
 */
export function renderOfflineMapsModal() {
  const downloadedZones = getDownloadedZones()

  return `
    <div class="offline-maps-modal">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white">Cartes hors-ligne</h2>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <p class="text-slate-400 text-sm mb-4">
        Telecharger des zones pour utiliser la carte sans connexion internet.
      </p>

      <div class="space-y-3 max-h-96 overflow-y-auto">
        ${availableZones.map(zone => {
          const status = downloadedZones.find(z => z.id === zone.id)
          const isDownloaded = status?.status === 'complete'
          const isDownloading = status?.status === 'downloading'

          return `
            <div class="bg-dark-secondary rounded-xl p-4 border border-white/10">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${zone.flag}</span>
                  <div>
                    <h3 class="font-semibold text-white">${zone.name}</h3>
                    <p class="text-xs text-slate-400">${zone.estimatedSize}</p>
                  </div>
                </div>

                ${isDownloaded ? `
                  <div class="flex items-center gap-2">
                    <span class="text-green-400 text-sm">
                      <i class="fas fa-check-circle mr-1"></i>
                      ${status.spotsCount || 0} spots
                    </span>
                    <button
                      onclick="deleteOfflineZone('${zone.id}')"
                      class="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                ` : isDownloading ? `
                  <div class="flex items-center gap-2">
                    <div class="w-20 h-2 bg-dark rounded-full overflow-hidden">
                      <div class="h-full bg-primary-500 transition-all" style="width: ${status.progress || 0}%"></div>
                    </div>
                    <span class="text-xs text-slate-400">${status.progress || 0}%</span>
                  </div>
                ` : `
                  <button
                    onclick="downloadOfflineZone('${zone.id}')"
                    class="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600"
                  >
                    <i class="fas fa-download mr-1"></i>
                    Telecharger
                  </button>
                `}
              </div>
            </div>
          `
        }).join('')}
      </div>

      <div class="mt-4 pt-4 border-t border-white/10">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-400">Espace utilise:</span>
          <span id="offline-storage-size" class="text-white">Calcul...</span>
        </div>
        <button
          onclick="clearAllOfflineMaps()"
          class="mt-3 w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
        >
          <i class="fas fa-trash-alt mr-2"></i>
          Supprimer toutes les donnees hors-ligne
        </button>
      </div>
    </div>
  `
}

/**
 * Initialize offline maps UI handlers
 */
export function initOfflineMapsHandlers() {
  // Download zone handler
  window.downloadOfflineZone = async (zoneId) => {
    try {
      await downloadZone(zoneId, (progress, status) => {
        // Re-render modal to show progress
        const modalContent = document.querySelector('.modal-content')
        if (modalContent) {
          modalContent.innerHTML = renderOfflineMapsModal()
          updateStorageSize()
        }
      })

      if (window.showSuccess) {
        window.showSuccess('Zone telechargee avec succes !')
      }
    } catch (error) {
      if (window.showError) {
        window.showError('Erreur lors du telechargement')
      }
    }
  }

  // Delete zone handler
  window.deleteOfflineZone = async (zoneId) => {
    if (confirm('Supprimer cette zone hors-ligne ?')) {
      await deleteZone(zoneId)

      // Re-render modal
      const modalContent = document.querySelector('.modal-content')
      if (modalContent) {
        modalContent.innerHTML = renderOfflineMapsModal()
        updateStorageSize()
      }

      if (window.showSuccess) {
        window.showSuccess('Zone supprimee')
      }
    }
  }

  // Clear all handler
  window.clearAllOfflineMaps = async () => {
    if (confirm('Supprimer toutes les donnees hors-ligne ?')) {
      await clearAllOfflineData()

      // Re-render modal
      const modalContent = document.querySelector('.modal-content')
      if (modalContent) {
        modalContent.innerHTML = renderOfflineMapsModal()
        updateStorageSize()
      }

      if (window.showSuccess) {
        window.showSuccess('Donnees hors-ligne supprimees')
      }
    }
  }
}

/**
 * Update storage size display
 */
async function updateStorageSize() {
  const sizeElement = document.getElementById('offline-storage-size')
  if (sizeElement) {
    const size = await getOfflineStorageSize()
    sizeElement.textContent = size
  }
}

export default {
  availableZones,
  getDownloadedZones,
  isZoneDownloaded,
  getZoneStatus,
  downloadZone,
  deleteZone,
  getZoneSpots,
  getOfflineStorageSize,
  clearAllOfflineData,
  renderOfflineMapsModal,
  initOfflineMapsHandlers,
}
