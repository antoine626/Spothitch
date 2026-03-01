/**
 * Offline Download Service
 * Tracks which countries are downloaded for offline use
 * Actual spot loading & IDB persistence is handled by spotLoader.js
 */

import { getByIndex, count, remove as idbRemove } from '../utils/idb.js'

const STORAGE_KEY = 'spothitch_offline_countries'
const BASE = import.meta.env.BASE_URL || '/'

/**
 * Download spots for a country and save to IndexedDB
 * Delegates to spotLoader for the actual fetch + IDB save
 * @param {string} countryCode - ISO country code (e.g. 'FR', 'DE')
 * @param {Function} [onProgress] - Progress callback (0-100)
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function downloadCountrySpots(countryCode, onProgress) {
  const code = countryCode.toUpperCase()

  try {
    if (onProgress) onProgress(10)

    // Use spotLoader which handles fetch → IDB persistence
    const { loadCountrySpots } = await import('./spotLoader.js')
    if (onProgress) onProgress(30)

    const spots = await loadCountrySpots(code)
    if (onProgress) onProgress(80)

    // Also download cities for this country (3-layer suggestions system)
    try {
      const citiesRes = await fetch(`${BASE}data/cities/${code.toLowerCase()}.json`)
      if (citiesRes.ok) {
        const citiesData = await citiesRes.json()
        const key = `spothitch_cities_${code}`
        localStorage.setItem(key, JSON.stringify(citiesData.cities || []))
      }
    } catch {
      // Cities download failed — not critical
    }

    if (onProgress) onProgress(90)

    // Track downloaded country in localStorage
    markCountryDownloaded(code, spots.length)

    if (onProgress) onProgress(100)

    return { success: true, count: spots.length }
  } catch (error) {
    console.error(`[OfflineDownload] Failed to download ${code}:`, error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Mark a country as downloaded for offline
 * @param {string} code - Country code
 * @param {number} spotCount - Number of spots
 */
export function markCountryDownloaded(code, spotCount) {
  const countries = getDownloadedCountries()
  const existing = countries.find(c => c.code === code)
  if (existing) {
    existing.count = spotCount
    existing.downloadedAt = Date.now()
  } else {
    countries.push({
      code,
      count: spotCount,
      downloadedAt: Date.now(),
    })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(countries))
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
    // Get spots for this country from IDB and delete them
    const spots = await getByIndex('spots', 'country', code)
    for (const spot of spots) {
      await idbRemove('spots', spot.id)
    }

    // Update localStorage tracking
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
  markCountryDownloaded,
}
