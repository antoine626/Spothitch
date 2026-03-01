/**
 * Tile Downloader Service
 * Pre-fetches map tiles for offline use via Cache API
 * Stores metadata in IDB "tiles" store for tracking/cleanup
 * The SW already serves from "openfreemap-tiles" cache → zero MapLibre changes
 */

import {
  getCountryBoundsBuffered,
  lng2tile,
  lat2tile,
  estimateTileCount,
} from '../data/countryBounds.js'
import { putAll, getByIndex, remove as idbRemove } from '../utils/idb.js'

const TILE_CACHE_NAME = 'openfreemap-tiles'
const MAX_ZOOM = 10
const CONCURRENCY = 6
const TILE_JSON_URL = 'https://tiles.openfreemap.org/planet'

let tileUrlTemplate = null

/**
 * Resolve the current tile URL template from OpenFreeMap TileJSON
 * @returns {Promise<string>} URL template with {z}/{x}/{y}
 */
export async function resolveTileUrl() {
  if (tileUrlTemplate) return tileUrlTemplate

  try {
    const res = await fetch(TILE_JSON_URL)
    if (!res.ok) throw new Error(`TileJSON ${res.status}`)
    const json = await res.json()
    // TileJSON spec: tiles is an array of URL templates
    tileUrlTemplate = json.tiles?.[0] || null
    return tileUrlTemplate
  } catch (e) {
    console.warn('[TileDownloader] Failed to resolve tile URL:', e)
    return null
  }
}

/**
 * Generate tile coordinates for a bounding box at a specific zoom
 */
function getTilesForZoom(bounds, z) {
  const xMin = lng2tile(bounds.west, z)
  const xMax = lng2tile(bounds.east, z)
  const yMin = lat2tile(bounds.north, z)
  const yMax = lat2tile(bounds.south, z)
  const tiles = []
  for (let x = Math.min(xMin, xMax); x <= Math.max(xMin, xMax); x++) {
    for (let y = Math.min(yMin, yMax); y <= Math.max(yMin, yMax); y++) {
      tiles.push({ z, x, y })
    }
  }
  return tiles
}

/**
 * Download all map tiles for a country (zoom 0-10)
 * Stores tiles in Cache API and metadata in IDB
 *
 * @param {string} code - Country code (e.g. 'FR')
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{ downloaded: number, skipped: number, failed: number, sizeMB: number }>}
 */
export async function downloadCountryTiles(code, onProgress, signal) {
  const countryCode = code.toUpperCase()
  const bounds = getCountryBoundsBuffered(countryCode, 0.5)
  if (!bounds) throw new Error(`No bounds for country ${countryCode}`)

  const template = await resolveTileUrl()
  if (!template) throw new Error('Could not resolve tile URL template')

  // Generate all tile coords
  const allTiles = []
  for (let z = 0; z <= MAX_ZOOM; z++) {
    allTiles.push(...getTilesForZoom(bounds, z))
  }

  const cache = await caches.open(TILE_CACHE_NAME)
  let downloaded = 0
  let skipped = 0
  let failed = 0
  let totalBytes = 0
  const metadata = []

  // Process tiles with limited concurrency
  let i = 0
  const total = allTiles.length

  async function processNext() {
    while (i < total) {
      if (signal?.aborted) return
      const idx = i++
      const tile = allTiles[idx]
      const url = template
        .replace('{z}', tile.z)
        .replace('{x}', tile.x)
        .replace('{y}', tile.y)

      try {
        // Skip if already cached
        const existing = await cache.match(url)
        if (existing) {
          skipped++
          if (onProgress) {
            const pct = Math.round(((downloaded + skipped + failed) / total) * 100)
            onProgress(pct)
          }
          continue
        }

        const res = await fetch(url, { signal })
        if (!res.ok) {
          failed++
        } else {
          const blob = await res.blob()
          totalBytes += blob.size
          // Put in Cache API (the SW serves from this cache)
          await cache.put(url, new Response(blob, {
            headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/x-protobuf' },
          }))
          downloaded++

          // Store metadata for tracking
          metadata.push({
            key: `${countryCode}_${tile.z}_${tile.x}_${tile.y}`,
            country: countryCode,
            zoom: tile.z,
            url,
            size: blob.size,
          })
        }
      } catch (e) {
        if (signal?.aborted) return
        failed++
      }

      if (onProgress) {
        const pct = Math.round(((downloaded + skipped + failed) / total) * 100)
        onProgress(pct)
      }
    }
  }

  // Run concurrent workers
  const workers = []
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(processNext())
  }
  await Promise.all(workers)

  // Bulk save metadata to IDB
  if (metadata.length > 0) {
    try {
      await putAll('tiles', metadata)
    } catch (e) {
      console.warn('[TileDownloader] Failed to save tile metadata:', e)
    }
  }

  return {
    downloaded,
    skipped,
    failed,
    sizeMB: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
  }
}

/**
 * Delete all cached tiles for a country
 * @param {string} code - Country code
 * @returns {Promise<number>} Number of tiles deleted
 */
export async function deleteCountryTiles(code) {
  const countryCode = code.toUpperCase()
  let deleted = 0

  try {
    // Get tile metadata from IDB
    const tileMeta = await getByIndex('tiles', 'country', countryCode)
    if (!tileMeta?.length) return 0

    // Delete from Cache API
    const cache = await caches.open(TILE_CACHE_NAME)
    for (const meta of tileMeta) {
      try {
        await cache.delete(meta.url)
        await idbRemove('tiles', meta.key)
        deleted++
      } catch { /* best effort */ }
    }
  } catch (e) {
    console.warn('[TileDownloader] deleteCountryTiles failed:', e)
  }

  return deleted
}

/**
 * Estimate tile count and size for a country
 * @param {string} code - Country code
 * @returns {{ tileCount: number, estimatedMB: number }}
 */
export function estimateCountryTileSize(code) {
  const bounds = getCountryBoundsBuffered(code?.toUpperCase(), 0.5)
  if (!bounds) return { tileCount: 0, estimatedMB: 0 }

  const tileCount = estimateTileCount(bounds, MAX_ZOOM)
  // Average tile size ~50KB for vector tiles (pbf)
  const estimatedMB = Math.round((tileCount * 50) / 1024 * 10) / 10
  return { tileCount, estimatedMB }
}

/**
 * Get count of cached tiles for a country
 * @param {string} code - Country code
 * @returns {Promise<number>}
 */
export async function getCountryTileCount(code) {
  try {
    const tileMeta = await getByIndex('tiles', 'country', code.toUpperCase())
    return tileMeta?.length || 0
  } catch {
    return 0
  }
}

export default {
  resolveTileUrl,
  downloadCountryTiles,
  deleteCountryTiles,
  estimateCountryTileSize,
  getCountryTileCount,
}
