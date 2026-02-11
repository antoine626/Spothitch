/**
 * Spot Loader Service
 * Dynamically loads hitchhiking spots from JSON files per country
 * Source: Hitchmap (ODBL license)
 */

const BASE = import.meta.env.BASE_URL || '/'

// Cache loaded country data
const loadedCountries = new Map()
let countryIndex = null
let allLoadedSpots = []
let nextId = 100000 // Start high to avoid conflicts with sample spots

/**
 * Load country index (list of available countries)
 */
export async function loadSpotIndex() {
  if (countryIndex) return countryIndex

  try {
    const response = await fetch(`${BASE}data/spots/index.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    countryIndex = await response.json()
    return countryIndex
  } catch (error) {
    console.warn('Failed to load spot index:', error)
    return null
  }
}

/**
 * Load spots for a specific country
 * @param {string} countryCode - ISO country code (e.g. 'FR', 'DE')
 * @returns {Array} spots in app format
 */
export async function loadCountrySpots(countryCode) {
  const code = countryCode.toUpperCase()

  // Return cached data
  if (loadedCountries.has(code)) {
    return loadedCountries.get(code)
  }

  try {
    const response = await fetch(`${BASE}data/spots/${code.toLowerCase()}.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const spots = convertToAppFormat(data.spots, code)

    loadedCountries.set(code, spots)

    // Update global spots array
    allLoadedSpots = [...allLoadedSpots, ...spots]

    console.log(`📍 Loaded ${spots.length} spots for ${code}`)
    return spots
  } catch (error) {
    console.warn(`Failed to load spots for ${code}:`, error)
    return []
  }
}

/**
 * Convert Hitchmap format to app spot format
 */
function convertToAppFormat(rawSpots, countryCode) {
  // Data already cleaned at build time (inactive/low-rating/duplicates removed)
  return rawSpots.map(s => {
    const id = nextId++
    const bestComment = s.comments?.[0]?.text || ''

    return {
      id,
      from: '',
      to: '',
      description: bestComment,
      photoUrl: null,
      creator: 'Hitchwiki',
      creatorAvatar: '🗺️',
      coordinates: { lat: s.lat, lng: s.lon },
      ratings: {
        accessibility: Math.min(5, s.rating),
        safety: Math.min(5, s.rating),
        traffic: Math.min(5, s.rating),
      },
      globalRating: s.rating,
      spotType: 'custom',
      direction: '',
      fromCity: '',
      stationName: '',
      roadNumber: '',
      totalReviews: s.reviews || 0,
      avgWaitTime: s.wait,
      lastUsed: s.lastUsed,
      checkins: s.reviews || 0,
      verified: s.reviews >= 3 && s.rating >= 4,
      source: 'hitchwiki',
      country: countryCode,
      signal: s.signal,
      comments: s.comments || [],
    }
  })
}

/**
 * Load spots for countries visible in a map bounds
 * @param {object} bounds - { north, south, east, west }
 */
export async function loadSpotsInBounds(bounds) {
  const index = await loadSpotIndex()
  if (!index) return []

  // Determine which countries might be visible
  // Use a simple center-point heuristic based on known country centers
  const countryCenters = {
    // Europe
    FR: { lat: 46.6, lon: 2.2 }, DE: { lat: 51.2, lon: 10.4 },
    ES: { lat: 40.0, lon: -3.7 }, IT: { lat: 42.5, lon: 12.5 },
    NL: { lat: 52.1, lon: 5.3 }, BE: { lat: 50.5, lon: 4.5 },
    PT: { lat: 39.4, lon: -8.2 }, AT: { lat: 47.5, lon: 14.6 },
    CH: { lat: 46.8, lon: 8.2 }, IE: { lat: 53.4, lon: -8.2 },
    PL: { lat: 51.9, lon: 19.1 }, CZ: { lat: 49.8, lon: 15.5 },
    GB: { lat: 55.4, lon: -3.4 }, SE: { lat: 60.1, lon: 18.6 },
    NO: { lat: 60.5, lon: 8.5 }, DK: { lat: 56.3, lon: 9.5 },
    FI: { lat: 61.9, lon: 25.7 }, HU: { lat: 47.2, lon: 19.5 },
    HR: { lat: 45.1, lon: 15.2 }, RO: { lat: 45.9, lon: 25.0 },
    GR: { lat: 39.1, lon: 21.8 }, BG: { lat: 42.7, lon: 25.5 },
    SK: { lat: 48.7, lon: 19.7 }, SI: { lat: 46.2, lon: 14.8 },
    LT: { lat: 55.2, lon: 23.9 }, LV: { lat: 56.9, lon: 24.1 },
    EE: { lat: 58.6, lon: 25.0 }, LU: { lat: 49.8, lon: 6.1 },
    RS: { lat: 44.0, lon: 21.0 }, BA: { lat: 43.9, lon: 17.7 },
    ME: { lat: 42.7, lon: 19.4 }, MK: { lat: 41.5, lon: 21.7 },
    AL: { lat: 41.2, lon: 20.2 }, XK: { lat: 42.6, lon: 21.0 },
    MD: { lat: 47.0, lon: 28.4 }, UA: { lat: 48.4, lon: 31.2 },
    IS: { lat: 64.9, lon: -19.0 },
    GE: { lat: 42.3, lon: 43.4 }, AM: { lat: 40.1, lon: 44.5 },
    // Americas
    US: { lat: 37.1, lon: -95.7 }, CA: { lat: 56.1, lon: -106.3 },
    MX: { lat: 23.6, lon: -102.5 }, BR: { lat: -14.2, lon: -51.9 },
    AR: { lat: -38.4, lon: -63.6 }, CL: { lat: -35.7, lon: -71.5 },
    CO: { lat: 4.6, lon: -74.1 }, PE: { lat: -9.2, lon: -75.0 },
    EC: { lat: -1.8, lon: -78.2 }, BO: { lat: -16.3, lon: -63.6 },
    UY: { lat: -32.5, lon: -55.8 },
    CR: { lat: 9.7, lon: -83.8 },
    PA: { lat: 8.5, lon: -80.8 }, GT: { lat: 15.8, lon: -90.2 },
    // Asia
    JP: { lat: 36.2, lon: 138.3 }, CN: { lat: 35.9, lon: 104.2 },
    IN: { lat: 20.6, lon: 78.9 }, TH: { lat: 15.9, lon: 100.9 },
    ID: { lat: -0.8, lon: 113.9 }, PH: { lat: 12.9, lon: 121.8 },
    VN: { lat: 14.1, lon: 108.3 }, KH: { lat: 12.6, lon: 104.9 },
    MY: { lat: 4.2, lon: 101.9 },
    LA: { lat: 19.9, lon: 102.5 }, LK: { lat: 7.9, lon: 80.8 },
    NP: { lat: 28.4, lon: 84.1 }, KR: { lat: 35.9, lon: 128.0 },
    MN: { lat: 46.9, lon: 103.8 }, KG: { lat: 41.2, lon: 74.8 },
    KZ: { lat: 48.0, lon: 68.0 }, UZ: { lat: 41.4, lon: 64.6 },
    TJ: { lat: 38.9, lon: 71.3 }, PK: { lat: 30.4, lon: 69.3 },
    // Middle East
    TR: { lat: 38.9, lon: 35.2 }, IR: { lat: 32.4, lon: 53.7 },
    IL: { lat: 31.0, lon: 34.9 }, JO: { lat: 30.6, lon: 36.2 },
    OM: { lat: 21.5, lon: 55.9 },
    // Africa
    MA: { lat: 31.8, lon: -7.1 }, ZA: { lat: -30.6, lon: 22.9 },
    EG: { lat: 26.8, lon: 30.8 },
    KE: { lat: -0.0, lon: 37.9 }, TZ: { lat: -6.4, lon: 34.9 },
    GH: { lat: 7.9, lon: -1.0 }, NG: { lat: 9.1, lon: 8.7 },
    NA: { lat: -22.9, lon: 18.5 },
    BW: { lat: -22.3, lon: 24.7 }, TN: { lat: 33.9, lon: 9.5 }, MZ: { lat: -18.7, lon: 35.5 },
    // Oceania
    AU: { lat: -25.3, lon: 133.8 }, NZ: { lat: -40.9, lon: 174.9 },
    TW: { lat: 23.7, lon: 120.9 },
    // Additional countries (only those with actual JSON files)
    AD: { lat: 42.5, lon: 1.5 }, AF: { lat: 33.9, lon: 67.7 },
    AO: { lat: -11.2, lon: 17.9 }, AZ: { lat: 40.1, lon: 47.6 },
    BD: { lat: 23.7, lon: 90.4 }, BJ: { lat: 9.3, lon: 2.3 },
    BN: { lat: 4.5, lon: 114.7 }, BZ: { lat: 17.2, lon: -88.5 },
    CI: { lat: 7.5, lon: -5.5 }, CM: { lat: 7.4, lon: 12.4 },
    CY: { lat: 35.1, lon: 33.4 }, DM: { lat: 15.4, lon: -61.4 },
    DO: { lat: 18.7, lon: -70.2 }, DZ: { lat: 28.0, lon: 1.7 },
    EH: { lat: 24.2, lon: -12.9 }, FO: { lat: 61.9, lon: -6.9 },
    GD: { lat: 12.1, lon: -61.7 }, GG: { lat: 49.5, lon: -2.5 },
    GL: { lat: 71.7, lon: -42.6 }, GY: { lat: 4.9, lon: -58.9 },
    HN: { lat: 15.2, lon: -86.2 }, IM: { lat: 54.2, lon: -4.5 },
    IQ: { lat: 33.2, lon: 43.7 }, JE: { lat: 49.2, lon: -2.1 },
    KW: { lat: 29.3, lon: 47.5 }, LI: { lat: 47.2, lon: 9.6 },
    MC: { lat: 43.7, lon: 7.4 }, ML: { lat: 17.6, lon: -4.0 },
    MR: { lat: 21.0, lon: -10.9 }, MT: { lat: 35.9, lon: 14.4 },
    MU: { lat: -20.3, lon: 57.6 }, NI: { lat: 12.9, lon: -85.2 },
    PS: { lat: 31.9, lon: 35.2 }, RU: { lat: 61.5, lon: 105.3 },
    SA: { lat: 23.9, lon: 45.1 }, SM: { lat: 43.9, lon: 12.4 },
    SN: { lat: 14.5, lon: -14.5 }, SV: { lat: 13.8, lon: -88.9 },
    SZ: { lat: -26.5, lon: 31.5 }, TG: { lat: 8.6, lon: 1.2 },
    TL: { lat: -8.9, lon: 125.7 }, TO: { lat: -21.2, lon: -175.2 },
    UG: { lat: 1.4, lon: 32.3 }, VC: { lat: 12.9, lon: -61.3 },
    XZ: { lat: 29.7, lon: 91.1 }, ZM: { lat: -13.1, lon: 27.8 },
  }

  // Expand bounds by 10 degrees to preload nearby countries
  const expandedBounds = {
    north: bounds.north + 10,
    south: bounds.south - 10,
    east: bounds.east + 10,
    west: bounds.west - 10,
  }

  const visibleCountries = Object.entries(countryCenters)
    .filter(([, center]) =>
      center.lat >= expandedBounds.south &&
      center.lat <= expandedBounds.north &&
      center.lon >= expandedBounds.west &&
      center.lon <= expandedBounds.east
    )
    .map(([code]) => code)

  // Load countries in parallel
  const promises = visibleCountries.map(code => loadCountrySpots(code))
  const results = await Promise.all(promises)

  return results.flat()
}

/**
 * Get all currently loaded spots
 */
export function getAllLoadedSpots() {
  return allLoadedSpots
}

/**
 * Get loaded countries list
 */
export function getLoadedCountries() {
  return [...loadedCountries.keys()]
}

/**
 * Check if a country is loaded
 */
export function isCountryLoaded(countryCode) {
  return loadedCountries.has(countryCode.toUpperCase())
}

/**
 * Get spot count stats
 */
export async function getSpotStats() {
  const index = await loadSpotIndex()
  if (!index) return { totalCountries: 0, totalLocations: 0, totalReviews: 0 }

  return {
    totalCountries: index.totalCountries,
    totalLocations: index.totalLocations,
    totalReviews: index.totalReviews,
  }
}

/**
 * Clear cache (for memory management)
 */
export function clearSpotCache() {
  loadedCountries.clear()
  allLoadedSpots = []
  nextId = 100000
}

export default {
  loadSpotIndex,
  loadCountrySpots,
  loadSpotsInBounds,
  getAllLoadedSpots,
  getLoadedCountries,
  isCountryLoaded,
  getSpotStats,
  clearSpotCache,
}
