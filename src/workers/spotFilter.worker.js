/**
 * Spot Filter Web Worker
 * Runs heavy spot operations off the main thread:
 * - Filter by country, rating, distance, amenities
 * - Sort by distance, rating, freshness
 * - Haversine distance calculation for 37K+ spots
 * - Bounding box extraction
 *
 * Usage from main thread:
 *   worker.postMessage({ type: 'filter', spots, filters })
 *   worker.onmessage = (e) => console.log(e.data.results)
 */

// ==================== MATH ====================

const DEG_TO_RAD = Math.PI / 180
const EARTH_RADIUS_KM = 6371

/**
 * Haversine distance between two GPS coordinates
 * @returns {number} Distance in km
 */
function haversine(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * DEG_TO_RAD
  const dLng = (lng2 - lng1) * DEG_TO_RAD
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ==================== OPERATIONS ====================

/**
 * Filter spots based on criteria
 */
function filterSpots(spots, filters) {
  let result = spots

  // Country filter
  if (filters.country) {
    const country = filters.country.toLowerCase()
    result = result.filter(s =>
      (s.country || '').toLowerCase() === country ||
      (s.countryCode || '').toLowerCase() === country
    )
  }

  // Rating filter
  if (filters.minRating > 0) {
    result = result.filter(s => (s.globalRating || s.rating || 0) >= filters.minRating)
  }

  // Max wait time filter
  if (filters.maxWait > 0) {
    result = result.filter(s => (s.averageWait || 999) <= filters.maxWait)
  }

  // Verified only filter
  if (filters.verifiedOnly) {
    result = result.filter(s => s.verified || s.validations > 0)
  }

  // Search query filter
  if (filters.query) {
    const q = filters.query.toLowerCase()
    result = result.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.country || '').toLowerCase().includes(q)
    )
  }

  // Bounding box filter (for map viewport)
  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds
    result = result.filter(s => {
      const lat = s.coordinates?.lat || s.lat
      const lng = s.coordinates?.lng || s.lng
      return lat >= south && lat <= north && lng >= west && lng <= east
    })
  }

  // Distance filter (from user location)
  if (filters.userLocation && filters.maxDistance) {
    const { lat, lng } = filters.userLocation
    result = result.filter(s => {
      const sLat = s.coordinates?.lat || s.lat
      const sLng = s.coordinates?.lng || s.lng
      if (!sLat || !sLng) return false
      return haversine(lat, lng, sLat, sLng) <= filters.maxDistance
    })
  }

  // Amenities filter
  if (filters.amenities && filters.amenities.length > 0) {
    result = result.filter(s => {
      const spotAmenities = s.amenities || []
      return filters.amenities.every(a => spotAmenities.includes(a))
    })
  }

  return result
}

/**
 * Sort spots
 */
function sortSpots(spots, sortBy, userLocation) {
  const sorted = [...spots]

  switch (sortBy) {
    case 'rating':
      sorted.sort((a, b) => (b.globalRating || b.rating || 0) - (a.globalRating || a.rating || 0))
      break

    case 'distance':
      if (userLocation) {
        sorted.sort((a, b) => {
          const distA = haversine(
            userLocation.lat, userLocation.lng,
            a.coordinates?.lat || a.lat, a.coordinates?.lng || a.lng
          )
          const distB = haversine(
            userLocation.lat, userLocation.lng,
            b.coordinates?.lat || b.lat, b.coordinates?.lng || b.lng
          )
          return distA - distB
        })
      }
      break

    case 'recent':
      sorted.sort((a, b) => {
        const dateA = new Date(a.lastActivity || a.created || 0).getTime()
        const dateB = new Date(b.lastActivity || b.created || 0).getTime()
        return dateB - dateA
      })
      break

    case 'wait':
      sorted.sort((a, b) => (a.averageWait || 999) - (b.averageWait || 999))
      break

    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      break

    default:
      // Default: rating desc
      sorted.sort((a, b) => (b.globalRating || b.rating || 0) - (a.globalRating || a.rating || 0))
  }

  return sorted
}

/**
 * Calculate distances from user to all spots
 */
function calculateDistances(spots, userLocation) {
  return spots.map(s => ({
    id: s.id,
    distance: haversine(
      userLocation.lat, userLocation.lng,
      s.coordinates?.lat || s.lat || 0,
      s.coordinates?.lng || s.lng || 0
    ),
  }))
}

/**
 * Find spots within a corridor between two points
 * (for route planning)
 */
function findSpotsAlongRoute(spots, from, to, corridorWidth = 50) {
  // Calculate bounding box with corridor
  const minLat = Math.min(from.lat, to.lat) - corridorWidth / 111
  const maxLat = Math.max(from.lat, to.lat) + corridorWidth / 111
  const minLng = Math.min(from.lng, to.lng) - corridorWidth / 85
  const maxLng = Math.max(from.lng, to.lng) + corridorWidth / 85

  // Filter spots in corridor
  const inBox = spots.filter(s => {
    const lat = s.coordinates?.lat || s.lat
    const lng = s.coordinates?.lng || s.lng
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
  })

  // Score by distance to the line between from-to
  const routeDistance = haversine(from.lat, from.lng, to.lat, to.lng)
  return inBox.map(s => {
    const lat = s.coordinates?.lat || s.lat
    const lng = s.coordinates?.lng || s.lng
    const distFromStart = haversine(from.lat, from.lng, lat, lng)
    const distToEnd = haversine(lat, lng, to.lat, to.lng)
    const detour = (distFromStart + distToEnd) - routeDistance
    return { ...s, detour, distFromStart }
  }).filter(s => s.detour < corridorWidth)
    .sort((a, b) => a.distFromStart - b.distFromStart)
}

/**
 * Cluster spots by proximity (for map markers)
 */
function clusterSpots(spots, zoom) {
  // Grid-based clustering
  const gridSize = 360 / Math.pow(2, zoom) // degrees per grid cell
  const clusters = new Map()

  for (const spot of spots) {
    const lat = spot.coordinates?.lat || spot.lat || 0
    const lng = spot.coordinates?.lng || spot.lng || 0
    const gridX = Math.floor(lng / gridSize)
    const gridY = Math.floor(lat / gridSize)
    const key = `${gridX},${gridY}`

    if (!clusters.has(key)) {
      clusters.set(key, { spots: [], lat: 0, lng: 0 })
    }
    const cluster = clusters.get(key)
    cluster.spots.push(spot)
    cluster.lat += lat
    cluster.lng += lng
  }

  // Calculate cluster centers
  const result = []
  for (const [, cluster] of clusters) {
    const count = cluster.spots.length
    result.push({
      lat: cluster.lat / count,
      lng: cluster.lng / count,
      count,
      spots: count <= 10 ? cluster.spots : cluster.spots.slice(0, 10),
      topRated: cluster.spots.sort((a, b) =>
        (b.globalRating || 0) - (a.globalRating || 0)
      )[0],
    })
  }

  return result
}

// ==================== MESSAGE HANDLER ====================

self.onmessage = function(e) {
  const { type, id, spots, filters, sortBy, userLocation, from, to, zoom, corridorWidth } = e.data
  const start = performance.now()

  let result

  switch (type) {
    case 'filter':
      result = filterSpots(spots || [], filters || {})
      break

    case 'sort':
      result = sortSpots(spots || [], sortBy || 'rating', userLocation)
      break

    case 'filterAndSort':
      result = filterSpots(spots || [], filters || {})
      result = sortSpots(result, sortBy || 'rating', userLocation)
      break

    case 'distances':
      result = calculateDistances(spots || [], userLocation)
      break

    case 'route':
      result = findSpotsAlongRoute(spots || [], from, to, corridorWidth)
      break

    case 'cluster':
      result = clusterSpots(spots || [], zoom || 10)
      break

    case 'haversine':
      result = haversine(from.lat, from.lng, to.lat, to.lng)
      break

    default:
      result = { error: `Unknown operation: ${type}` }
  }

  const duration = performance.now() - start

  self.postMessage({
    id,
    type,
    results: result,
    count: Array.isArray(result) ? result.length : undefined,
    duration: Math.round(duration * 100) / 100,
  })
}
