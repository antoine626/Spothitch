/**
 * Proximity Verification Service
 * Tracks location history and verifies user was near a spot in the last 24h
 * before allowing spot creation or review/checkin
 */

import { Storage } from '../utils/storage.js'
import { getDistanceKm } from './location.js'

const LOCATION_HISTORY_KEY = 'spothitch_location_history'
const MAX_HISTORY_ENTRIES = 200
const HISTORY_RETENTION_MS = 48 * 60 * 60 * 1000 // 48h (keep extra for safety)
const PROXIMITY_RADIUS_KM = 5 // Must have been within 5km
const PROXIMITY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24h window

/**
 * Record a location entry in history
 * Called whenever user's GPS updates
 * @param {{ lat: number, lng: number }} location
 */
export function recordLocation(location) {
  if (!location?.lat || !location?.lng) return

  const history = getLocationHistory()
  const now = Date.now()

  // Deduplicate: skip if last entry is very close (< 100m) and recent (< 5min)
  if (history.length > 0) {
    const last = history[history.length - 1]
    const dist = getDistanceKm(last.lat, last.lng, location.lat, location.lng)
    const elapsed = now - last.t
    if (dist < 0.1 && elapsed < 5 * 60 * 1000) return
  }

  history.push({ lat: location.lat, lng: location.lng, t: now })

  // Prune old entries (> 48h)
  const cutoff = now - HISTORY_RETENTION_MS
  const pruned = history.filter(e => e.t > cutoff)

  // Cap at MAX entries
  const capped = pruned.length > MAX_HISTORY_ENTRIES
    ? pruned.slice(pruned.length - MAX_HISTORY_ENTRIES)
    : pruned

  Storage.set(LOCATION_HISTORY_KEY, capped)
}

/**
 * Get stored location history
 * @returns {Array<{ lat: number, lng: number, t: number }>}
 */
export function getLocationHistory() {
  return Storage.get(LOCATION_HISTORY_KEY) || []
}

/**
 * Check if user was near a given location within the last 24h
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {number} [radiusKm] - Override default radius
 * @returns {{ nearby: boolean, closestKm: number|null, closestTime: number|null }}
 */
export function wasNearLocation(lat, lng, radiusKm = PROXIMITY_RADIUS_KM) {
  if (!lat || !lng) return { nearby: false, closestKm: null, closestTime: null }

  const history = getLocationHistory()
  const cutoff = Date.now() - PROXIMITY_WINDOW_MS
  const recent = history.filter(e => e.t > cutoff)

  if (recent.length === 0) {
    return { nearby: false, closestKm: null, closestTime: null }
  }

  let closestKm = Infinity
  let closestTime = null

  for (const entry of recent) {
    const dist = getDistanceKm(entry.lat, entry.lng, lat, lng)
    if (dist < closestKm) {
      closestKm = dist
      closestTime = entry.t
    }
  }

  return {
    nearby: closestKm <= radiusKm,
    closestKm: Math.round(closestKm * 10) / 10,
    closestTime,
  }
}

/**
 * Check if user's CURRENT position is near a given location
 * Fallback when no history: use live GPS
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {{ lat: number, lng: number }|null} userLocation - Current user location from state
 * @returns {{ nearby: boolean, distanceKm: number|null }}
 */
export function isCurrentlyNear(lat, lng, userLocation) {
  if (!userLocation?.lat || !userLocation?.lng || !lat || !lng) {
    return { nearby: false, distanceKm: null }
  }

  const dist = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng)
  return {
    nearby: dist <= PROXIMITY_RADIUS_KM,
    distanceKm: Math.round(dist * 10) / 10,
  }
}

/**
 * Full proximity check: history OR current position
 * Returns { allowed, reason }
 * @param {number} lat - Target spot latitude
 * @param {number} lng - Target spot longitude
 * @param {{ lat: number, lng: number }|null} userLocation - Current GPS
 * @returns {{ allowed: boolean, reason: string }}
 */
export function checkProximity(lat, lng, userLocation) {
  // 1. No coordinates on spot → allow (user-placed spot without GPS)
  if (!lat || !lng) return { allowed: true, reason: 'no_coordinates' }

  // 2. Check location history (last 24h)
  const historyCheck = wasNearLocation(lat, lng)
  if (historyCheck.nearby) return { allowed: true, reason: 'history' }

  // 3. Check current position
  const currentCheck = isCurrentlyNear(lat, lng, userLocation)
  if (currentCheck.nearby) return { allowed: true, reason: 'current' }

  // 4. No GPS at all → allow with warning (graceful degradation)
  if (!userLocation && historyCheck.closestKm === null) {
    return { allowed: true, reason: 'no_gps' }
  }

  // 5. Too far
  const distKm = currentCheck.distanceKm || historyCheck.closestKm
  return { allowed: false, reason: 'too_far', distanceKm: distKm }
}

export default {
  recordLocation,
  getLocationHistory,
  wasNearLocation,
  isCurrentlyNear,
  checkProximity,
}
