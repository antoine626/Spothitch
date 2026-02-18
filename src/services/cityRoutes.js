/**
 * City Routes Service
 * Aggregates spot data by nearby city and computes route stats
 */

import { haversineKm } from '../utils/geo.js'

/**
 * Slugify a string for URL-friendly identifiers
 */
export function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Compute average wait time from spots
 */
function computeAvgWait(spots) {
  const waits = spots.filter(s => s.wait > 0).map(s => s.wait)
  return waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0
}

/**
 * Compute average rating from spots
 */
function computeAvgRating(spots) {
  const ratings = spots.filter(s => s.rating > 0).map(s => s.rating)
  return ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0
}

/**
 * Find nearby spots within a radius of a given point
 * @param {Array} spots - All loaded spots
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Search radius in km (default 30)
 * @returns {Array} Spots within radius
 */
export function findNearbySpots(spots, lat, lng, radiusKm = 30) {
  return spots.filter(s => {
    const sLat = s.lat || s.coordinates?.lat
    const sLng = s.lon || s.lng || s.coordinates?.lng
    if (!sLat || !sLng) return false
    return haversineKm(lat, lng, sLat, sLng) <= radiusKm
  })
}

/**
 * Group nearby spots into "routes" by destination direction
 * Uses simple destination coordinate clustering
 */
function groupByDirection(spots) {
  const routes = {}
  for (const spot of spots) {
    if (!spot.destLat || !spot.destLon) continue
    // Find existing route cluster within 20km of this destination
    let matched = false
    for (const key of Object.keys(routes)) {
      const r = routes[key]
      if (haversineKm(r.destLat, r.destLon, spot.destLat, spot.destLon) < 20) {
        r.spots.push(spot)
        matched = true
        break
      }
    }
    if (!matched) {
      const key = `${Math.round(spot.destLat * 10)}_${Math.round(spot.destLon * 10)}`
      routes[key] = {
        destLat: spot.destLat,
        destLon: spot.destLon,
        spots: [spot],
      }
    }
  }
  return routes
}

/**
 * Build city info for a searched location
 * @param {Array} allSpots - All loaded spots
 * @param {string} cityName - Name of the city
 * @param {number} lat - City latitude
 * @param {number} lng - City longitude
 * @param {string} countryCode - ISO country code
 * @param {string} countryName - Full country name
 * @returns {Object|null} City data with routes
 */
export function buildCityInfo(allSpots, cityName, lat, lng, countryCode, countryName) {
  const nearby = findNearbySpots(allSpots, lat, lng, 30)
  if (nearby.length === 0) return null

  const slug = slugify(cityName)
  const directionGroups = groupByDirection(nearby)

  const routesList = Object.values(directionGroups)
    .map(r => ({
      destLat: r.destLat,
      destLon: r.destLon,
      slug: `${Math.round(r.destLat * 10)}_${Math.round(r.destLon * 10)}`,
      spotCount: r.spots.length,
      avgWait: computeAvgWait(r.spots),
      avgRating: computeAvgRating(r.spots),
      spots: r.spots,
    }))
    .filter(r => r.spotCount >= 1)
    .sort((a, b) => b.spotCount - a.spotCount)

  return {
    name: cityName,
    slug,
    lat,
    lng,
    country: countryCode || '',
    countryName: countryName || '',
    spotCount: nearby.length,
    avgWait: computeAvgWait(nearby),
    avgRating: computeAvgRating(nearby),
    routesList,
    spots: nearby,
  }
}

/**
 * Build city data from all spots for SEO (batch processing)
 * Groups spots by reverse-geocoded city names
 * @param {Array} spots - All spots with lat/lon
 * @param {Object} cityMap - Map of "lat_lon" -> cityName (from reverse geocoding)
 * @returns {Object} Cities keyed by slug
 */
export function buildCityDataFromMap(spots, cityMap) {
  const cities = {}

  for (const spot of spots) {
    const lat = spot.lat || spot.coordinates?.lat
    const lon = spot.lon || spot.lng || spot.coordinates?.lng
    if (!lat || !lon) continue

    // Find nearest city from cityMap
    const key = `${Math.round(lat * 10) / 10}_${Math.round(lon * 10) / 10}`
    const cityName = cityMap[key]
    if (!cityName) continue

    const citySlug = slugify(cityName)
    if (!cities[citySlug]) {
      cities[citySlug] = {
        name: cityName,
        slug: citySlug,
        lat,
        lng: lon,
        country: spot.country || '',
        spots: [],
      }
    }
    cities[citySlug].spots.push(spot)
  }

  for (const city of Object.values(cities)) {
    city.spotCount = city.spots.length
    city.avgWait = computeAvgWait(city.spots)
    city.avgRating = computeAvgRating(city.spots)
  }

  return cities
}
