/**
 * Offline Download Service
 * Downloads country spot data to IndexedDB for offline use
 * Users can download specific countries and browse spots without network
 */

import { putAll, getByIndex, clear, count, getAll } from '../utils/idb.js'

const STORAGE_KEY = 'spothitch_offline_countries'
const BASE = import.meta.env.BASE_URL || '/'

/**
 * Download spots for a country and save to IndexedDB
 * @param {string} countryCode - ISO country code (e.g. 'FR', 'DE')
 * @param {Function} [onProgress] - Progress callback (0-100)
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function downloadCountrySpots(countryCode, onProgress) {
  const code = countryCode.toUpperCase()

  try {
    if (onProgress) onProgress(10)

    const response = await fetch(`${BASE}data/spots/${code.toLowerCase()}.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    if (onProgress) onProgress(40)

    const data = await response.json()
    const spots = (data.spots || []).map((spot, i) => ({
      ...spot,
      id: spot.id || `offline_${code}_${i}`,
      country: code,
      _offline: true,
      _downloadedAt: Date.now(),
    }))

    if (onProgress) onProgress(70)

    // Save to IndexedDB
    await putAll('spots', spots)

    if (onProgress) onProgress(90)

    // Track downloaded countries in localStorage
    const countries = getDownloadedCountries()
    const existing = countries.find(c => c.code === code)
    if (existing) {
      existing.count = spots.length
      existing.downloadedAt = Date.now()
    } else {
      countries.push({
        code,
        count: spots.length,
        downloadedAt: Date.now(),
      })
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(countries))

    if (onProgress) onProgress(100)

    return { success: true, count: spots.length }
  } catch (error) {
    console.error(`[OfflineDownload] Failed to download ${code}:`, error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Get list of downloaded countries
 * @returns {Array<{code: string, count: number, downloadedAt: number}>}
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
 * Delete offline data for a country
 * @param {string} countryCode
 * @returns {Promise<boolean>}
 */
export async function deleteOfflineCountry(countryCode) {
  const code = countryCode.toUpperCase()
  try {
    // Get spots for this country and delete them
    const spots = await getByIndex('spots', 'country', code)
    const offlineSpots = spots.filter(s => s._offline)

    // Delete from IDB one by one (getByIndex returns read-only)
    const { remove } = await import('../utils/idb.js')
    for (const spot of offlineSpots) {
      await remove('spots', spot.id)
    }

    // Update localStorage
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
  const spots = await getAll('spots')
  return spots.filter(s => s._offline)
}

/**
 * Get storage size estimate for offline data
 * @returns {Promise<{countryCount: number, spotCount: number, sizeMB: string}>}
 */
export async function getOfflineStorageInfo() {
  const countries = getDownloadedCountries()
  const spotCount = await count('spots')

  let sizeMB = '?'
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate()
    sizeMB = ((est.usage || 0) / 1024 / 1024).toFixed(1)
  }

  return {
    countryCount: countries.length,
    spotCount,
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
}
