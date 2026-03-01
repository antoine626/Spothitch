/**
 * Offline Download Service
 * Downloads spots + map tiles + gas stations for offline use
 * Phase 1 (0-30%): spots + cities (IDB via spotLoader)
 * Phase 2 (30-70%): map tiles (Cache API via tileDownloader)
 * Phase 3 (70-95%): gas stations (IDB via gasStations)
 * Phase 4 (95-100%): mark complete
 */

import { getByIndex, count, remove as idbRemove } from '../utils/idb.js'

const STORAGE_KEY = 'spothitch_offline_countries'
const BASE = import.meta.env.BASE_URL || '/'

/**
 * Download spots + tiles + stations for a country
 * @param {string} countryCode - ISO country code (e.g. 'FR', 'DE')
 * @param {Function} [onProgress] - Progress callback (0-100)
 * @returns {Promise<{success: boolean, count: number, stationCount: number, tileSizeMB: number}>}
 */
export async function downloadCountrySpots(countryCode, onProgress) {
  const code = countryCode.toUpperCase()
  let stationCount = 0
  let tileSizeMB = 0

  try {
    // === Phase 1 (0-30%): Spots + cities ===
    if (onProgress) onProgress(5)

    const { loadCountrySpots } = await import('./spotLoader.js')
    const spots = await loadCountrySpots(code)
    const spotCount = spots.length
    if (onProgress) onProgress(20)

    // Also download cities (3-layer suggestions)
    try {
      const citiesRes = await fetch(`${BASE}data/cities/${code.toLowerCase()}.json`)
      if (citiesRes.ok) {
        const citiesData = await citiesRes.json()
        localStorage.setItem(`spothitch_cities_${code}`, JSON.stringify(citiesData.cities || []))
      }
    } catch { /* not critical */ }
    if (onProgress) onProgress(30)

    // === Phase 2 (30-70%): Map tiles ===
    try {
      const { downloadCountryTiles } = await import('./tileDownloader.js')
      const tileResult = await downloadCountryTiles(code, (pct) => {
        if (onProgress) onProgress(30 + Math.round(pct * 0.4)) // 30-70%
      })
      tileSizeMB = tileResult.sizeMB
    } catch (e) {
      console.warn(`[OfflineDownload] Tiles failed for ${code}:`, e.message)
      // Not blocking — spots are already saved
    }
    if (onProgress) onProgress(70)

    // === Phase 3 (70-95%): Gas stations ===
    try {
      const { downloadCountryStations } = await import('./gasStations.js')
      const stationResult = await downloadCountryStations(code, (pct) => {
        if (onProgress) onProgress(70 + Math.round(pct * 0.25)) // 70-95%
      })
      stationCount = stationResult.count
    } catch (e) {
      console.warn(`[OfflineDownload] Stations failed for ${code}:`, e.message)
      // Not blocking
    }
    if (onProgress) onProgress(95)

    // === Phase 4 (95-100%): Mark complete ===
    markCountryDownloaded(code, spotCount, stationCount, tileSizeMB)
    if (onProgress) onProgress(100)

    return { success: true, count: spotCount, stationCount, tileSizeMB }
  } catch (error) {
    console.error(`[OfflineDownload] Failed to download ${code}:`, error)
    return { success: false, count: 0, stationCount: 0, tileSizeMB: 0, error: error.message }
  }
}

/**
 * Mark a country as downloaded for offline
 * @param {string} code - Country code
 * @param {number} spotCount - Number of spots
 * @param {number} [stationCount] - Number of stations
 * @param {number} [tileSizeMB] - Size of downloaded tiles in MB
 */
export function markCountryDownloaded(code, spotCount, stationCount = 0, tileSizeMB = 0) {
  const countries = getDownloadedCountries()
  const existing = countries.find(c => c.code === code)
  const data = {
    code,
    count: spotCount,
    stationCount,
    tileSizeMB,
    downloadedAt: Date.now(),
  }
  if (existing) {
    Object.assign(existing, data)
  } else {
    countries.push(data)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(countries))
}

/**
 * Get list of downloaded countries
 * @returns {Array<{code: string, count: number, stationCount: number, tileSizeMB: number, downloadedAt: number}>}
 */
export function getDownloadedCountries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Check if a country is downloaded
 * @param {string} countryCode
 * @returns {boolean}
 */
export function isCountryDownloaded(countryCode) {
  return getDownloadedCountries().some(c => c.code === countryCode.toUpperCase())
}

/**
 * Delete offline data for a country (spots + tiles + stations)
 * @param {string} countryCode
 * @returns {Promise<boolean>}
 */
export async function deleteOfflineCountry(countryCode) {
  const code = countryCode.toUpperCase()
  try {
    // 1. Delete spots from IDB
    const spots = await getByIndex('spots', 'country', code)
    for (const spot of spots) {
      await idbRemove('spots', spot.id)
    }

    // 2. Delete tiles (Cache API + IDB metadata)
    try {
      const { deleteCountryTiles } = await import('./tileDownloader.js')
      await deleteCountryTiles(code)
    } catch { /* optional */ }

    // 3. Delete stations from IDB cache
    try {
      const { deleteOfflineStations } = await import('./gasStations.js')
      await deleteOfflineStations(code)
    } catch { /* optional */ }

    // 4. Update localStorage tracking
    const countries = getDownloadedCountries().filter(c => c.code !== code)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(countries))

    return true
  } catch (error) {
    console.error(`[OfflineDownload] Failed to delete ${code}:`, error)
    return false
  }
}

/**
 * Get offline spots for a country (from IndexedDB)
 * @param {string} countryCode
 * @returns {Promise<Array>}
 */
export async function getOfflineCountrySpots(countryCode) {
  return getByIndex('spots', 'country', countryCode.toUpperCase())
}

/**
 * Get all offline spots
 * @returns {Promise<Array>}
 */
export async function getAllOfflineSpots() {
  const { getAll } = await import('../utils/idb.js')
  return getAll('spots')
}

/**
 * Get storage size estimate for offline data (spots + tiles + stations)
 * @returns {Promise<Object>}
 */
export async function getOfflineStorageInfo() {
  const countries = getDownloadedCountries()
  const spotCount = await count('spots')

  // Count tiles
  let tileCount = 0
  try {
    tileCount = await count('tiles')
  } catch { /* tiles store may not exist yet */ }

  let sizeMB = '?'
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate()
    sizeMB = ((est.usage || 0) / 1024 / 1024).toFixed(1)
  }

  // Sum station counts from country metadata
  const totalStations = countries.reduce((sum, c) => sum + (c.stationCount || 0), 0)
  const totalTileSizeMB = countries.reduce((sum, c) => sum + (c.tileSizeMB || 0), 0)

  return {
    countryCount: countries.length,
    spotCount,
    tileCount,
    totalStations,
    totalTileSizeMB: Math.round(totalTileSizeMB * 10) / 10,
    sizeMB,
    countries,
  }
}

export default {
  downloadCountrySpots,
  getDownloadedCountries,
  isCountryDownloaded,
  deleteOfflineCountry,
  getOfflineCountrySpots,
  getAllOfflineSpots,
  getOfflineStorageInfo,
  markCountryDownloaded,
}
