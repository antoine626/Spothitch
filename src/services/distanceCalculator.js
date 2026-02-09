/**
 * Distance Calculator Service
 * Calculates travel distances, statistics, and unit conversions
 */

import { getState, setState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'

// Constants
const EARTH_RADIUS_KM = 6371
const EARTH_RADIUS_MILES = 3959
const KM_TO_MILES = 0.621371
const MILES_TO_KM = 1.60934

// Storage key for distance stats
const DISTANCE_STATS_KEY = 'spothitch_distance_stats'

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} point1 - First coordinate {lat, lng}
 * @param {Object} point2 - Second coordinate {lat, lng}
 * @param {string} unit - Unit of measurement ('km' or 'miles')
 * @returns {number} Distance in specified unit
 */
export function calculateDistanceBetweenPoints(point1, point2, unit = 'km') {
  if (!point1 || !point2) {
    return 0
  }

  if (!isValidCoordinate(point1) || !isValidCoordinate(point2)) {
    return 0
  }

  const lat1 = toRadians(point1.lat)
  const lat2 = toRadians(point2.lat)
  const deltaLat = toRadians(point2.lat - point1.lat)
  const deltaLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const radius = unit === 'miles' ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM

  return radius * c
}

/**
 * Calculate total distance across multiple spots
 * @param {Array} spots - Array of spots with coordinates
 * @param {string} unit - Unit of measurement ('km' or 'miles')
 * @returns {number} Total distance
 */
export function calculateTotalDistance(spots, unit = 'km') {
  if (!spots || !Array.isArray(spots) || spots.length < 2) {
    return 0
  }

  let totalDistance = 0

  for (let i = 0; i < spots.length - 1; i++) {
    const currentSpot = spots[i]
    const nextSpot = spots[i + 1]

    const coords1 = getCoordinates(currentSpot)
    const coords2 = getCoordinates(nextSpot)

    if (coords1 && coords2) {
      totalDistance += calculateDistanceBetweenPoints(coords1, coords2, unit)
    }
  }

  return totalDistance
}

/**
 * Calculate route distance between origin, destination with optional waypoints
 * @param {Object} origin - Origin coordinate {lat, lng}
 * @param {Object} destination - Destination coordinate {lat, lng}
 * @param {Array} waypoints - Optional array of waypoint coordinates
 * @param {string} unit - Unit of measurement ('km' or 'miles')
 * @returns {Object} Route distance info
 */
export function calculateRouteDistance(origin, destination, waypoints = [], unit = 'km') {
  if (!origin || !destination) {
    return {
      total: 0,
      segments: [],
      unit,
    }
  }

  if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
    return {
      total: 0,
      segments: [],
      unit,
    }
  }

  // Build the full route: origin -> waypoints -> destination
  const allPoints = [origin, ...waypoints.filter(wp => isValidCoordinate(wp)), destination]
  const segments = []
  let total = 0

  for (let i = 0; i < allPoints.length - 1; i++) {
    const distance = calculateDistanceBetweenPoints(allPoints[i], allPoints[i + 1], unit)
    segments.push({
      from: allPoints[i],
      to: allPoints[i + 1],
      distance,
      index: i,
    })
    total += distance
  }

  return {
    total,
    segments,
    unit,
    pointCount: allPoints.length,
    waypointCount: waypoints.filter(wp => isValidCoordinate(wp)).length,
  }
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters (or km/miles based on isMeters flag)
 * @param {Object} options - Formatting options
 * @param {string} options.unit - Output unit ('km', 'miles', 'auto')
 * @param {boolean} options.isMeters - Whether input is in meters
 * @param {number} options.decimals - Number of decimal places
 * @param {boolean} options.includeUnit - Whether to include unit in output
 * @returns {string} Formatted distance
 */
export function formatDistance(meters, options = {}) {
  const { unit = 'km', isMeters = true, decimals = 1, includeUnit = true } = options

  if (typeof meters !== 'number' || isNaN(meters)) {
    return includeUnit ? '0 km' : '0'
  }

  let value = meters
  let outputUnit = unit

  // Convert from meters if needed
  if (isMeters) {
    if (unit === 'miles') {
      value = meters / 1609.344
    } else {
      // km
      if (meters < 1000) {
        // Show in meters for short distances
        return includeUnit ? `${Math.round(meters)} m` : `${Math.round(meters)}`
      }
      value = meters / 1000
    }
  } else {
    // Input is already in km or miles
    if (unit === 'auto') {
      outputUnit = value > 1000 ? 'km' : 'km'
    }
  }

  const formatted = value.toFixed(decimals)

  if (!includeUnit) {
    return formatted
  }

  return `${formatted} ${outputUnit}`
}

/**
 * Convert distance between units
 * @param {number} distance - Distance value
 * @param {string} fromUnit - Source unit ('km' or 'miles')
 * @param {string} toUnit - Target unit ('km' or 'miles')
 * @returns {number} Converted distance
 */
export function convertDistance(distance, fromUnit, toUnit) {
  if (typeof distance !== 'number' || isNaN(distance)) {
    return 0
  }

  if (fromUnit === toUnit) {
    return distance
  }

  if (fromUnit === 'km' && toUnit === 'miles') {
    return distance * KM_TO_MILES
  }

  if (fromUnit === 'miles' && toUnit === 'km') {
    return distance * MILES_TO_KM
  }

  return distance
}

/**
 * Get distance statistics for a user
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Object} Distance statistics
 */
export function getDistanceStats(userId = null) {
  const state = getState()
  const targetUserId = userId || state.user?.uid || 'anonymous'

  // Try to get stored stats
  const storedStats = Storage.get(DISTANCE_STATS_KEY) || {}
  const userStats = storedStats[targetUserId] || getDefaultStats()

  // Calculate from checkin history if available
  const checkinHistory = state.checkinHistory || []
  const calculatedStats = calculateStatsFromHistory(checkinHistory)

  // Merge stored and calculated stats
  return {
    totalDistance: Math.max(userStats.totalDistance || 0, calculatedStats.totalDistance),
    totalTrips: Math.max(userStats.totalTrips || 0, calculatedStats.totalTrips),
    averagePerTrip: calculatedStats.averagePerTrip || userStats.averagePerTrip || 0,
    longestTrip: Math.max(userStats.longestTrip || 0, calculatedStats.longestTrip),
    shortestTrip: userStats.shortestTrip || calculatedStats.shortestTrip || 0,
    countries: [...new Set([...(userStats.countries || []), ...(calculatedStats.countries || [])])],
    lastUpdated: new Date().toISOString(),
    unit: userStats.unit || 'km',
  }
}

/**
 * Record a trip distance
 * @param {number} distance - Trip distance
 * @param {string} unit - Distance unit
 * @param {Object} tripInfo - Optional trip metadata
 * @returns {Object} Updated stats
 */
export function recordTripDistance(distance, unit = 'km', tripInfo = {}) {
  if (typeof distance !== 'number' || distance <= 0) {
    return null
  }

  const state = getState()
  const userId = state.user?.uid || 'anonymous'

  // Convert to km for storage
  const distanceKm = unit === 'miles' ? convertDistance(distance, 'miles', 'km') : distance

  // Get current stats
  const storedStats = Storage.get(DISTANCE_STATS_KEY) || {}
  const userStats = storedStats[userId] || getDefaultStats()

  // Update stats
  userStats.totalDistance += distanceKm
  userStats.totalTrips += 1
  userStats.averagePerTrip = userStats.totalDistance / userStats.totalTrips
  userStats.longestTrip = Math.max(userStats.longestTrip, distanceKm)

  if (userStats.shortestTrip === 0) {
    userStats.shortestTrip = distanceKm
  } else {
    userStats.shortestTrip = Math.min(userStats.shortestTrip, distanceKm)
  }

  // Track country if provided
  if (tripInfo.country && !userStats.countries.includes(tripInfo.country)) {
    userStats.countries.push(tripInfo.country)
  }

  // Save trip record
  userStats.trips = userStats.trips || []
  userStats.trips.push({
    distance: distanceKm,
    date: new Date().toISOString(),
    ...tripInfo,
  })

  // Keep only last 100 trips
  if (userStats.trips.length > 100) {
    userStats.trips = userStats.trips.slice(-100)
  }

  userStats.lastUpdated = new Date().toISOString()

  // Save to storage
  storedStats[userId] = userStats
  Storage.set(DISTANCE_STATS_KEY, storedStats)

  return userStats
}

/**
 * Get distance records (longest/shortest trips)
 * @param {string} userId - User ID
 * @returns {Object} Distance records
 */
export function getDistanceRecords(userId = null) {
  const stats = getDistanceStats(userId)

  return {
    longestTrip: {
      distance: stats.longestTrip,
      formatted: formatDistance(stats.longestTrip * 1000, { unit: stats.unit }),
    },
    shortestTrip: {
      distance: stats.shortestTrip,
      formatted: formatDistance(stats.shortestTrip * 1000, { unit: stats.unit }),
    },
    averageTrip: {
      distance: stats.averagePerTrip,
      formatted: formatDistance(stats.averagePerTrip * 1000, { unit: stats.unit }),
    },
    totalDistance: {
      distance: stats.totalDistance,
      formatted: formatDistance(stats.totalDistance * 1000, { unit: stats.unit }),
    },
    totalTrips: stats.totalTrips,
    countriesVisited: stats.countries.length,
  }
}

/**
 * Set preferred distance unit
 * @param {string} unit - Preferred unit ('km' or 'miles')
 */
export function setPreferredUnit(unit) {
  if (unit !== 'km' && unit !== 'miles') {
    console.warn('[DistanceCalculator] Invalid unit:', unit)
    return
  }

  const state = getState()
  const userId = state.user?.uid || 'anonymous'

  const storedStats = Storage.get(DISTANCE_STATS_KEY) || {}
  const userStats = storedStats[userId] || getDefaultStats()

  userStats.unit = unit

  storedStats[userId] = userStats
  Storage.set(DISTANCE_STATS_KEY, storedStats)
}

/**
 * Get preferred distance unit
 * @returns {string} Preferred unit
 */
export function getPreferredUnit() {
  const state = getState()
  const userId = state.user?.uid || 'anonymous'

  const storedStats = Storage.get(DISTANCE_STATS_KEY) || {}
  const userStats = storedStats[userId]

  return userStats?.unit || 'km'
}

/**
 * Calculate estimated travel time
 * @param {number} distance - Distance in km
 * @param {number} averageSpeed - Average speed in km/h (default 60 for hitchhiking)
 * @returns {Object} Time estimation
 */
export function estimateTravelTime(distance, averageSpeed = 60) {
  if (typeof distance !== 'number' || distance <= 0) {
    return { hours: 0, minutes: 0, formatted: '0 min' }
  }

  const totalHours = distance / averageSpeed
  const hours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - hours) * 60)

  let formatted
  if (hours === 0) {
    formatted = `${minutes} min`
  } else if (minutes === 0) {
    formatted = `${hours}h`
  } else {
    formatted = `${hours}h ${minutes}min`
  }

  return { hours, minutes, totalMinutes: hours * 60 + minutes, formatted }
}

/**
 * Calculate cumulative distances for a route (useful for progress tracking)
 * @param {Array} spots - Array of spots
 * @param {string} unit - Distance unit
 * @returns {Array} Array of cumulative distances
 */
export function calculateCumulativeDistances(spots, unit = 'km') {
  if (!spots || !Array.isArray(spots) || spots.length === 0) {
    return []
  }

  const cumulative = [0] // First spot has 0 distance
  let total = 0

  for (let i = 1; i < spots.length; i++) {
    const coords1 = getCoordinates(spots[i - 1])
    const coords2 = getCoordinates(spots[i])

    if (coords1 && coords2) {
      total += calculateDistanceBetweenPoints(coords1, coords2, unit)
    }

    cumulative.push(total)
  }

  return cumulative
}

/**
 * Find the nearest spot from a list
 * @param {Object} origin - Origin coordinate
 * @param {Array} spots - Array of spots
 * @param {number} limit - Maximum number of results
 * @returns {Array} Sorted array of spots with distances
 */
export function findNearestSpots(origin, spots, limit = 5) {
  if (!origin || !spots || !Array.isArray(spots)) {
    return []
  }

  if (!isValidCoordinate(origin)) {
    return []
  }

  const spotsWithDistance = spots
    .map(spot => {
      const coords = getCoordinates(spot)
      if (!coords) return null

      const distance = calculateDistanceBetweenPoints(origin, coords)

      return {
        ...spot,
        distanceFromOrigin: distance,
        distanceFormatted: formatDistance(distance * 1000),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceFromOrigin - b.distanceFromOrigin)

  return spotsWithDistance.slice(0, limit)
}

/**
 * Reset distance stats for a user
 * @param {string} userId - User ID
 */
export function resetDistanceStats(userId = null) {
  const state = getState()
  const targetUserId = userId || state.user?.uid || 'anonymous'

  const storedStats = Storage.get(DISTANCE_STATS_KEY) || {}
  storedStats[targetUserId] = getDefaultStats()

  Storage.set(DISTANCE_STATS_KEY, storedStats)
}

// Helper functions

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Check if coordinate is valid
 */
function isValidCoordinate(coord) {
  if (!coord) return false
  const lat = coord.lat ?? coord.latitude
  const lng = coord.lng ?? coord.lon ?? coord.longitude

  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Extract coordinates from spot object
 */
function getCoordinates(spot) {
  if (!spot) return null

  let coords = null

  // Handle direct coordinate objects
  if (spot.lat !== undefined && spot.lng !== undefined) {
    coords = { lat: spot.lat, lng: spot.lng }
  }
  // Handle nested coordinates
  else if (spot.coordinates) {
    coords = {
      lat: spot.coordinates.lat ?? spot.coordinates.latitude,
      lng: spot.coordinates.lng ?? spot.coordinates.lon ?? spot.coordinates.longitude,
    }
  }
  // Handle latitude/longitude format
  else if (spot.latitude !== undefined && spot.longitude !== undefined) {
    coords = { lat: spot.latitude, lng: spot.longitude }
  }

  // Validate extracted coordinates
  if (coords && isValidCoordinate(coords)) {
    return coords
  }

  return null
}

/**
 * Get default stats object
 */
function getDefaultStats() {
  return {
    totalDistance: 0,
    totalTrips: 0,
    averagePerTrip: 0,
    longestTrip: 0,
    shortestTrip: 0,
    countries: [],
    trips: [],
    unit: 'km',
    lastUpdated: null,
  }
}

/**
 * Calculate stats from checkin history
 */
function calculateStatsFromHistory(checkinHistory) {
  if (!checkinHistory || checkinHistory.length < 2) {
    return getDefaultStats()
  }

  // Sort by timestamp
  const sorted = [...checkinHistory].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  let totalDistance = 0
  const countries = new Set()
  const tripDistances = []
  let currentTripDistance = 0

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    const coords1 = getCoordinates(prev)
    const coords2 = getCoordinates(curr)

    if (coords1 && coords2) {
      const distance = calculateDistanceBetweenPoints(coords1, coords2)

      // If distance is reasonable (< 2000km), add to current trip
      if (distance < 2000) {
        currentTripDistance += distance
        totalDistance += distance
      } else {
        // New trip detected
        if (currentTripDistance > 0) {
          tripDistances.push(currentTripDistance)
        }
        currentTripDistance = 0
      }
    }

    // Track countries
    if (curr.country) countries.add(curr.country)
    if (prev.country) countries.add(prev.country)
  }

  // Don't forget the last trip
  if (currentTripDistance > 0) {
    tripDistances.push(currentTripDistance)
  }

  const totalTrips = tripDistances.length || 1

  return {
    totalDistance,
    totalTrips,
    averagePerTrip: totalDistance / totalTrips,
    longestTrip: tripDistances.length > 0 ? Math.max(...tripDistances) : 0,
    shortestTrip: tripDistances.length > 0 ? Math.min(...tripDistances) : 0,
    countries: Array.from(countries),
    trips: [],
    unit: 'km',
    lastUpdated: new Date().toISOString(),
  }
}

// Export default object for convenience
export default {
  calculateDistanceBetweenPoints,
  calculateTotalDistance,
  calculateRouteDistance,
  formatDistance,
  convertDistance,
  getDistanceStats,
  recordTripDistance,
  getDistanceRecords,
  setPreferredUnit,
  getPreferredUnit,
  estimateTravelTime,
  calculateCumulativeDistances,
  findNearestSpots,
  resetDistanceStats,
}
