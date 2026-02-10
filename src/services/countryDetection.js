/**
 * Country Detection Service
 * Auto-detects when user crosses into a new country and shows guide
 *
 * Uses Nominatim reverse geocoding (rate-limited to 1 check per 5 min)
 * Shows toast notification when country changes with link to guide
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { getGuideByCode } from '../data/guides.js'

const CONFIG = {
  storageKey: 'spothitch_last_country',
  checkInterval: 5 * 60 * 1000,
  nominatimUrl: 'https://nominatim.openstreetmap.org/reverse',
  userAgent: 'SpotHitch/2.0 (hitchhiking app)',
}

let lastCheckTime = 0
let isEnabled = false
let watchId = null

function getLastCountry() {
  try {
    return localStorage.getItem(CONFIG.storageKey)
  } catch {
    return null
  }
}

function saveLastCountry(countryCode) {
  try {
    localStorage.setItem(CONFIG.storageKey, countryCode)
  } catch (e) {
    console.warn('[CountryDetection] Failed to save country:', e)
  }
}

async function getCountryFromCoordinates(lat, lng) {
  try {
    const url = `${CONFIG.nominatimUrl}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`

    const response = await fetch(url, {
      headers: { 'User-Agent': CONFIG.userAgent },
    })

    if (!response.ok) {
      console.warn('[CountryDetection] Nominatim API error:', response.status)
      return null
    }

    const data = await response.json()
    const countryCode = data.address?.country_code?.toUpperCase()

    if (countryCode) {
      console.log('[CountryDetection] Detected country:', countryCode)
      return countryCode
    }

    return null
  } catch (e) {
    console.warn('[CountryDetection] Failed to get country:', e)
    return null
  }
}

async function checkCountryChange(lat, lng) {
  const now = Date.now()
  if (now - lastCheckTime < CONFIG.checkInterval) return
  lastCheckTime = now

  const currentCountry = await getCountryFromCoordinates(lat, lng)
  if (!currentCountry) return

  const lastCountry = getLastCountry()

  if (lastCountry && lastCountry !== currentCountry) {
    console.log('[CountryDetection] Country changed:', lastCountry, '->', currentCountry)

    const guide = getGuideByCode(currentCountry)

    if (guide) {
      const countryName = guide.name || currentCountry
      showToast(`Tu es en ${countryName} ! Voir le guide`, 'info', 8000, () => {
        setState({
          selectedCountryGuide: guide,
          activeTab: 'travel',
          activeSubTab: 'guides',
        })
      })
    }
  }

  saveLastCountry(currentCountry)
}

function startWatching() {
  if (!navigator.geolocation) {
    console.warn('[CountryDetection] Geolocation not available')
    return false
  }

  stopWatching()

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      checkCountryChange(position.coords.latitude, position.coords.longitude)
    },
    (error) => {
      console.warn('[CountryDetection] Location error:', error.message)
    },
    {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 30000,
    }
  )

  return true
}

function stopWatching() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

export function initCountryDetection() {
  try {
    const state = getState()
    if (state.travelModeEnabled) {
      isEnabled = true
      startWatching()
    }
    return true
  } catch (e) {
    console.warn('[CountryDetection] Init failed:', e)
    return false
  }
}

export function enableCountryDetection() {
  if (!isEnabled) {
    isEnabled = true
    startWatching()
  }
}

export function disableCountryDetection() {
  if (isEnabled) {
    isEnabled = false
    stopWatching()
  }
}

export function getCountryDetectionStatus() {
  return {
    enabled: isEnabled,
    lastCountry: getLastCountry(),
    lastCheckTime,
  }
}

export function clearLastCountry() {
  try {
    localStorage.removeItem(CONFIG.storageKey)
  } catch (e) {
    console.warn('[CountryDetection] Failed to clear:', e)
  }
}

export default {
  initCountryDetection,
  enableCountryDetection,
  disableCountryDetection,
  getCountryDetectionStatus,
  clearLastCountry,
}
