/**
 * Proximity Notification Service
 * Shows a sticky notification bar when user is within 500m of a spot
 * with quick validate/report actions
 */

import { getState, setState, subscribe } from '../stores/state.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'
import { haversineKm } from '../utils/geo.js'
import { icon } from '../utils/icons.js'

// ==================== CONFIGURATION ====================

const PROXIMITY_RADIUS_KM = 0.5 // 500m
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours
const STORAGE_KEY = 'spothitch_proximity_alerts'

// ==================== STATE ====================

let watchId = null

// ==================== STORAGE ====================

/**
 * Get alerted spots from localStorage
 * @returns {Object} Map of spotId -> timestamp
 */
function getAlertedSpots() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

/**
 * Mark a spot as alerted (24h cooldown)
 * @param {string|number} spotId
 */
function markSpotAlerted(spotId) {
  const alerted = getAlertedSpots()
  alerted[spotId] = Date.now()
  // Clean up entries older than 24h
  const now = Date.now()
  for (const key of Object.keys(alerted)) {
    if (now - alerted[key] > COOLDOWN_MS) {
      delete alerted[key]
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerted))
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Check if a spot was alerted within the last 24h
 * @param {string|number} spotId
 * @returns {boolean}
 */
function wasRecentlyAlerted(spotId) {
  const alerted = getAlertedSpots()
  const ts = alerted[spotId]
  if (!ts) return false
  return Date.now() - ts < COOLDOWN_MS
}

// ==================== CORE LOGIC ====================

/**
 * Check all loaded spots against user position
 * @param {number} lat
 * @param {number} lng
 */
function checkProximity(lat, lng) {
  const state = getState()
  if (!state.proximityAlerts) return
  if (state.proximityAlertSpot) return // already showing an alert

  const spots = state.spots || []

  for (const spot of spots) {
    const spotLat = spot.coordinates?.lat || spot.lat
    const spotLng = spot.coordinates?.lng || spot.lng
    if (!spotLat || !spotLng) continue

    if (wasRecentlyAlerted(spot.id)) continue

    const dist = haversineKm(lat, lng, spotLat, spotLng)
    if (dist <= PROXIMITY_RADIUS_KM) {
      // Show proximity alert for this spot
      markSpotAlerted(spot.id)
      setState({ proximityAlertSpot: spot })
      return // only one alert at a time
    }
  }
}

/**
 * Position callback from watchPosition
 */
function onPosition(position) {
  const lat = position.coords.latitude
  const lng = position.coords.longitude
  checkProximity(lat, lng)
}

/**
 * Start watching user position
 */
function startWatching() {
  if (watchId !== null) return
  if (!navigator.geolocation) return

  watchId = navigator.geolocation.watchPosition(
    onPosition,
    () => { /* geolocation error — silent */ },
    {
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 30000,
    }
  )
}

/**
 * Stop watching user position
 */
function stopWatching() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

// ==================== RENDER ====================

/**
 * Render the proximity alert notification bar
 * @param {Object} spot - The nearby spot
 * @returns {string} HTML
 */
export function renderProximityAlert(spot) {
  const spotName = spot.to || spot.from || spot.name || 'Spot'
  const spotId = typeof spot.id === 'string' ? spot.id : String(spot.id)
  const escapedId = spotId.replace(/'/g, '&#39;')

  return `
    <div class="fixed top-20 left-4 right-4 z-40 bg-[#0f1520]/95 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-4 shadow-2xl" role="alert">
      <div class="flex items-center gap-3">
        ${icon('map-pin', 'w-6 h-6 text-amber-400 shrink-0')}
        <div class="flex-1 min-w-0">
          <div class="font-medium text-white text-sm truncate">${t('spotNearby')} ${spotName}</div>
          <div class="text-xs text-slate-400">${t('isSpotStillGood')}</div>
        </div>
        <button onclick="quickValidateSpot('${escapedId}')" class="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all" aria-label="${t('spotNearby')} - ${t('isSpotStillGood')}">
          <span aria-hidden="true">&#x1f44d;</span>
        </button>
        <button onclick="quickReportSpot('${escapedId}')" class="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all" aria-label="${t('spotNearby')} - report">
          <span aria-hidden="true">&#x1f44e;</span>
        </button>
        <button onclick="dismissProximityAlert()" class="text-slate-500 hover:text-white transition-all" aria-label="${t('close') || 'Close'}">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

/**
 * Quick validate a spot — save lightweight check-in
 */
window.quickValidateSpot = (spotId) => {
  const state = getState()
  const checkinHistory = state.checkinHistory || []
  const newCheckin = {
    id: `checkin_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    spotId,
    type: 'quick_validation',
    timestamp: new Date().toISOString(),
  }
  setState({
    checkinHistory: [newCheckin, ...checkinHistory],
    proximityAlertSpot: null,
  })
  showToast(t('thanksForValidation'), 'success')
}

/**
 * Quick report a spot — open report modal
 */
window.quickReportSpot = (spotId) => {
  setState({
    proximityAlertSpot: null,
    showReport: true,
    reportType: 'spot',
    reportTargetId: spotId,
  })
}

/**
 * Dismiss the proximity alert notification
 */
window.dismissProximityAlert = () => {
  setState({ proximityAlertSpot: null })
}

// ==================== INITIALIZATION ====================

/**
 * Initialize proximity notification system
 * Call after app loads
 */
export function initProximityNotify() {
  const state = getState()
  if (state.proximityAlerts) {
    startWatching()
  }

  // Listen for proximityAlerts state changes
  subscribe((newState) => {
    if (newState.proximityAlerts && watchId === null) {
      startWatching()
    } else if (!newState.proximityAlerts && watchId !== null) {
      stopWatching()
      setState({ proximityAlertSpot: null })
    }
  })
}

window.initProximityNotify = initProximityNotify

export default {
  initProximityNotify,
  renderProximityAlert,
  checkProximity,
}
