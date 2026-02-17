/**
 * Overpass API Service
 * Queries OpenStreetMap for gas stations and rest areas along a route
 */

import { recordRequest, getWaitTime } from '../utils/clientRateLimit.js'

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const RATE_LIMIT_KEY = 'overpass'
const RATE_LIMIT = { max: 1, windowMs: 1500 } // 1 req per 1.5s (conservative)

// Simple in-memory cache keyed by route start+end
const cache = new Map()

/**
 * Sample a route geometry to ~25 points
 * @param {Array<[number,number]>} geometry - Array of [lng, lat] from OSRM
 * @returns {Array<{lat: number, lng: number}>} Sampled points (lat, lng)
 */
function sampleRoute(geometry) {
  if (!geometry || geometry.length === 0) return []
  const target = 25
  const step = Math.max(1, Math.floor(geometry.length / target))
  const sampled = []
  for (let i = 0; i < geometry.length; i += step) {
    const [lng, lat] = geometry[i] // OSRM is [lng, lat], Overpass needs lat, lng
    sampled.push({ lat, lng })
  }
  // Always include the last point
  const [lastLng, lastLat] = geometry[geometry.length - 1]
  if (sampled.length === 0 || sampled[sampled.length - 1].lat !== lastLat || sampled[sampled.length - 1].lng !== lastLng) {
    sampled.push({ lat: lastLat, lng: lastLng })
  }
  // Cap at 30 points max
  return sampled.slice(0, 30)
}

/**
 * Build Overpass QL query for amenities along sampled route points.
 * Uses a bounding box approach (faster + simpler) instead of per-point around
 * which can produce invalid queries when too many coordinates are used.
 * @param {Array<{lat: number, lng: number}>} points - Sampled points
 * @param {number} radiusMeters - Search radius in meters
 * @param {Object} options - { showFuel, showRestAreas }
 * @returns {string} Overpass QL query
 */
function buildQuery(points, radiusMeters, options) {
  const { showFuel = true, showRestAreas = true } = options
  if (!showFuel && !showRestAreas) return null
  if (points.length === 0) return null

  // Compute bounding box from route points + padding
  const pad = radiusMeters / 111000 // rough degrees per meter
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }
  const bbox = `${(minLat - pad).toFixed(4)},${(minLng - pad).toFixed(4)},${(maxLat + pad).toFixed(4)},${(maxLng + pad).toFixed(4)}`

  const filters = []
  if (showFuel) {
    filters.push(`node["amenity"="fuel"](${bbox});`)
  }
  if (showRestAreas) {
    filters.push(`node["highway"="rest_area"](${bbox});`)
    filters.push(`node["highway"="services"](${bbox});`)
  }

  return `[out:json][timeout:25];(${filters.join('')});out body;`
}

/**
 * Generate a cache key from route geometry
 */
function getCacheKey(routeGeometry) {
  if (!routeGeometry || routeGeometry.length < 2) return null
  const start = routeGeometry[0]
  const end = routeGeometry[routeGeometry.length - 1]
  return `${start[0].toFixed(3)},${start[1].toFixed(3)}-${end[0].toFixed(3)},${end[1].toFixed(3)}`
}

/**
 * Normalize Overpass element to a POI object
 * @param {Object} element - Raw Overpass element
 * @returns {Object} Normalized POI
 */
function normalizeElement(element) {
  const tags = element.tags || {}
  let type = 'fuel'
  if (tags.highway === 'rest_area' || tags.highway === 'services') {
    type = 'rest_area'
  }

  return {
    id: `overpass_${element.id}`,
    type,
    name: tags.name || (type === 'fuel' ? tags.brand || '' : ''),
    lat: element.lat,
    lng: element.lon,
    brand: tags.brand || '',
    tags: {
      operator: tags.operator || '',
      opening_hours: tags.opening_hours || '',
      fuel_diesel: tags['fuel:diesel'] || '',
      fuel_octane_95: tags['fuel:octane_95'] || '',
    },
  }
}

/**
 * Query Overpass API for amenities along a route corridor
 * @param {Array<[number,number]>} routeGeometry - Array of [lng, lat] from OSRM
 * @param {number} corridorKm - Max distance from route in km (default 2)
 * @param {Object} options - { showFuel: true, showRestAreas: true }
 * @returns {Promise<Array>} Array of POI objects
 */
export async function getAmenitiesAlongRoute(routeGeometry, corridorKm = 2, options = {}) {
  const { showFuel = true, showRestAreas = true } = options

  if (!routeGeometry || routeGeometry.length < 2) {
    return []
  }

  // Check cache first
  const cacheKey = getCacheKey(routeGeometry)
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)
    // Filter by current options
    return cached.filter(poi => {
      if (poi.type === 'fuel' && !showFuel) return false
      if (poi.type === 'rest_area' && !showRestAreas) return false
      return true
    })
  }

  // Sample the route to ~25 points
  const sampledPoints = sampleRoute(routeGeometry)
  if (sampledPoints.length === 0) return []

  // Build the query (always fetch both types for cache, filter after)
  const radiusMeters = Math.round(corridorKm * 1000)
  const query = buildQuery(sampledPoints, radiusMeters, { showFuel: true, showRestAreas: true })
  if (!query) return []

  // Rate limiting - wait if needed
  const waitTime = getWaitTime(RATE_LIMIT_KEY, RATE_LIMIT)
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime + 100))
  }

  // Record the request
  if (!recordRequest(RATE_LIMIT_KEY, RATE_LIMIT)) {
    console.warn('[Overpass] Rate limited, try again later')
    return []
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000) // 20s timeout

    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`[Overpass] HTTP ${response.status}`)
      return []
    }

    const data = await response.json()
    const elements = data.elements || []

    // Normalize all results
    const allPois = elements
      .filter(el => el.type === 'node' && el.lat && el.lon)
      .map(normalizeElement)

    // Filter by proximity to actual route (bbox may include distant POIs)
    const corridorPois = allPois.filter(poi => {
      for (const pt of sampledPoints) {
        const dLat = (poi.lat - pt.lat) * 111
        const dLng = (poi.lng - pt.lng) * 111 * Math.cos(pt.lat * Math.PI / 180)
        if (Math.sqrt(dLat * dLat + dLng * dLng) <= corridorKm) return true
      }
      return false
    })

    // Deduplicate by position (some stations appear twice)
    const seen = new Set()
    const uniquePois = corridorPois.filter(poi => {
      const key = `${poi.lat.toFixed(5)},${poi.lng.toFixed(5)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Cache the full results
    if (cacheKey) {
      cache.set(cacheKey, uniquePois)
    }

    // Filter by requested options
    return uniquePois.filter(poi => {
      if (poi.type === 'fuel' && !showFuel) return false
      if (poi.type === 'rest_area' && !showRestAreas) return false
      return true
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[Overpass] Request timed out')
    } else {
      console.warn('[Overpass] Request failed:', error.message)
    }
    return []
  }
}

/**
 * Clear the Overpass cache
 */
export function clearOverpassCache() {
  cache.clear()
}

export default {
  getAmenitiesAlongRoute,
  clearOverpassCache,
}
