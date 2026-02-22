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
 * Sample a route geometry to ~40 evenly-spaced points
 * @param {Array<[number,number]>} geometry - Array of [lng, lat] from OSRM
 * @returns {Array<{lat: number, lng: number}>} Sampled points (lat, lng)
 */
function sampleRoute(geometry) {
  if (!geometry || geometry.length === 0) return []
  const target = 40
  const step = Math.max(1, Math.floor(geometry.length / target))
  const sampled = []
  for (let i = 0; i < geometry.length; i += step) {
    const [lng, lat] = geometry[i] // OSRM is [lng, lat], Overpass needs lat, lng
    sampled.push({ lat, lng })
  }
  // Always include the last point
  const [lastLng, lastLat] = geometry[geometry.length - 1]
  const last = sampled[sampled.length - 1]
  if (sampled.length === 0 || last.lat !== lastLat || last.lng !== lastLng) {
    sampled.push({ lat: lastLat, lng: lastLng })
  }
  return sampled.slice(0, 50)
}

/**
 * Build Overpass QL query using multiple small bounding boxes along the route.
 * Each segment of ~5 consecutive points gets its own bbox, then they're unioned.
 * This avoids a single giant bbox that would timeout on long routes.
 * @param {Array<{lat: number, lng: number}>} points - Sampled points
 * @param {number} radiusMeters - Search radius in meters
 * @param {Object} options - { showFuel, showRestAreas }
 * @returns {string} Overpass QL query
 */
function buildQuery(points, radiusMeters, options) {
  const { showFuel = true, showRestAreas = true } = options
  if (!showFuel && !showRestAreas) return null
  if (points.length === 0) return null

  const pad = radiusMeters / 111000 // rough degrees per meter

  // Split points into segments of 5 and compute a bbox per segment
  const segmentSize = 5
  const bboxes = []
  for (let i = 0; i < points.length; i += segmentSize) {
    const segment = points.slice(i, i + segmentSize)
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
    for (const p of segment) {
      if (p.lat < minLat) minLat = p.lat
      if (p.lat > maxLat) maxLat = p.lat
      if (p.lng < minLng) minLng = p.lng
      if (p.lng > maxLng) maxLng = p.lng
    }
    bboxes.push(`${(minLat - pad).toFixed(4)},${(minLng - pad).toFixed(4)},${(maxLat + pad).toFixed(4)},${(maxLng + pad).toFixed(4)}`)
  }

  // Build union of queries for each bbox
  const filters = []
  for (const bbox of bboxes) {
    if (showFuel) {
      filters.push(`node["amenity"="fuel"](${bbox});`)
    }
    if (showRestAreas) {
      filters.push(`node["highway"="rest_area"](${bbox});`)
      filters.push(`node["highway"="services"](${bbox});`)
    }
  }

  // Single global bbox for service area ways (sparse, won't overload)
  let globalMinLat = Infinity, globalMaxLat = -Infinity
  let globalMinLng = Infinity, globalMaxLng = -Infinity
  for (const p of points) {
    if (p.lat < globalMinLat) globalMinLat = p.lat
    if (p.lat > globalMaxLat) globalMaxLat = p.lat
    if (p.lng < globalMinLng) globalMinLng = p.lng
    if (p.lng > globalMaxLng) globalMaxLng = p.lng
  }
  const globalBbox = `${(globalMinLat - pad).toFixed(4)},${(globalMinLng - pad).toFixed(4)},${(globalMaxLat + pad).toFixed(4)},${(globalMaxLng + pad).toFixed(4)}`
  filters.push(`way["highway"="services"](${globalBbox});`)
  filters.push(`way["highway"="rest_area"](${globalBbox});`)

  return `[out:json][timeout:25];(${filters.join('')});out body center;`
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

  try {
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

  // Sample the route to ~40 points
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

  {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

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

    // Verify response is JSON (Overpass returns HTML when overloaded)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('json')) {
      console.warn('[Overpass] Non-JSON response, server may be overloaded')
      return []
    }

    const data = await response.json()
    const elements = data.elements || []

    // Extract service area ways (for names + tags-based services)
    const serviceAreas = elements
      .filter(el => el.type === 'way' && (el.tags?.highway === 'services' || el.tags?.highway === 'rest_area') && el.center)
      .map(el => {
        const tags = el.tags || {}
        const services = new Set()
        // Read services directly from way tags
        if (tags.toilets === 'yes') services.add('🚻')
        if (tags.shower === 'yes') services.add('🚿')
        if (tags.shop?.includes('convenience') || tags.shop?.includes('supermarket')) services.add('🛒')
        if (tags.amenity?.includes('restaurant') || tags.amenity?.includes('fast_food')) services.add('🍔')
        if (tags.amenity?.includes('cafe')) services.add('☕')
        return { name: tags.name || '', lat: el.center.lat, lng: el.center.lon, services }
      })

    // Normalize all node results (fuel + rest_area nodes only)
    const allPois = elements
      .filter(el => el.type === 'node' && el.lat && el.lon)
      .map(normalizeElement)

    // Enrich fuel stations: attach nearby service area name + services
    if (serviceAreas.length > 0) {
      for (const poi of allPois) {
        if (poi.type !== 'fuel') continue
        let closest = null
        let closestDist = Infinity
        for (const area of serviceAreas) {
          const dLat = (poi.lat - area.lat) * 111
          const dLng = (poi.lng - area.lng) * 111 * Math.cos(poi.lat * Math.PI / 180)
          const dist = Math.sqrt(dLat * dLat + dLng * dLng)
          if (dist < 1 && dist < closestDist) {
            closest = area
            closestDist = dist
          }
        }
        if (closest) {
          if (closest.name) poi.serviceArea = closest.name
          const svc = [...closest.services]
          if (svc.length > 0) poi.services = svc
        }
      }
    }

    // Second pass: fetch amenity nodes near service areas (restaurants, etc.)
    // Only if we found service areas in the corridor
    const corridorAreas = serviceAreas.filter(area => {
      for (const pt of sampledPoints) {
        const dLat = (area.lat - pt.lat) * 111
        const dLng = (area.lng - pt.lng) * 111 * Math.cos(pt.lat * Math.PI / 180)
        if (Math.sqrt(dLat * dLat + dLng * dLng) <= corridorKm) return true
      }
      return false
    })

    if (corridorAreas.length > 0) {
      try {
        await enrichServiceAreasWithAmenities(corridorAreas, allPois)
      } catch { /* non-critical — popup just won't show service icons */ }
    }

    // Filter by proximity to actual route (small bboxes may still include distant POIs)
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
  } // end inner block
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
 * Fetch amenity nodes near service areas and enrich fuel POIs
 * Uses `around` queries centered on each area (lightweight, targeted)
 */
async function enrichServiceAreasWithAmenities(areas, allPois) {
  // Build around queries for each area (500m radius)
  const aroundFilters = []
  for (const area of areas.slice(0, 20)) { // cap to avoid huge queries
    const around = `(around:500,${area.lat.toFixed(5)},${area.lng.toFixed(5)})`
    aroundFilters.push(`node["amenity"="restaurant"]${around};`)
    aroundFilters.push(`node["amenity"="fast_food"]${around};`)
    aroundFilters.push(`node["amenity"="cafe"]${around};`)
    aroundFilters.push(`node["amenity"="toilets"]${around};`)
    aroundFilters.push(`node["amenity"="shower"]${around};`)
    aroundFilters.push(`node["shop"~"convenience|supermarket"]${around};`)
  }

  if (aroundFilters.length === 0) return

  // Wait for rate limit
  const waitTime = getWaitTime(RATE_LIMIT_KEY, RATE_LIMIT)
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime + 100))
  }
  recordRequest(RATE_LIMIT_KEY, RATE_LIMIT)

  const query = `[out:json][timeout:15];(${aroundFilters.join('')});out body;`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: controller.signal,
  })
  clearTimeout(timeout)

  if (!response.ok) return
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('json')) return
  const data = await response.json()
  const amenityNodes = data.elements || []

  const iconMap = { restaurant: '🍔', fast_food: '🍔', cafe: '☕', toilets: '🚻', shower: '🚿' }
  const shopMap = { convenience: '🛒', supermarket: '🛒' }

  // Associate each amenity with nearest service area
  for (const node of amenityNodes) {
    if (!node.lat || !node.lon) continue
    const icon = iconMap[node.tags?.amenity] || shopMap[node.tags?.shop] || ''
    if (!icon) continue

    let closest = null
    let closestDist = Infinity
    for (const area of areas) {
      const dLat = (node.lat - area.lat) * 111
      const dLng = (node.lon - area.lng) * 111 * Math.cos(node.lat * Math.PI / 180)
      const dist = Math.sqrt(dLat * dLat + dLng * dLng)
      if (dist < 0.5 && dist < closestDist) {
        closest = area
        closestDist = dist
      }
    }
    if (closest) closest.services.add(icon)
  }

  // Update fuel POIs with enriched services
  for (const poi of allPois) {
    if (poi.type !== 'fuel' || !poi.serviceArea) continue
    for (const area of areas) {
      if (area.name && area.name === poi.serviceArea) {
        const svc = [...area.services]
        if (svc.length > 0) poi.services = svc
        break
      }
    }
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
