/**
 * Points of Interest Service
 * Find nearby POIs (restaurants, toilets, water, shelter, supermarkets, gas stations, wifi) near spots
 */

import { getState, setState } from '../stores/state.js'

// POI Types with icons and translations
const poiTypes = {
  restaurant: {
    id: 'restaurant',
    icon: 'fa-utensils',
    emoji: '🍽️',
    color: '#f97316', // orange
    translations: {
      fr: 'Restaurant',
      en: 'Restaurant',
      es: 'Restaurante',
      de: 'Restaurant',
    },
  },
  toilets: {
    id: 'toilets',
    icon: 'fa-restroom',
    emoji: '🚻',
    color: '#3b82f6', // blue
    translations: {
      fr: 'Toilettes',
      en: 'Toilets',
      es: 'Baños',
      de: 'Toiletten',
    },
  },
  water: {
    id: 'water',
    icon: 'fa-droplet',
    emoji: '💧',
    color: '#0ea5e9', // sky blue
    translations: {
      fr: 'Point d\'eau',
      en: 'Water',
      es: 'Agua',
      de: 'Wasser',
    },
  },
  shelter: {
    id: 'shelter',
    icon: 'fa-house',
    emoji: '🏠',
    color: '#84cc16', // lime
    translations: {
      fr: 'Abri',
      en: 'Shelter',
      es: 'Refugio',
      de: 'Unterstand',
    },
  },
  supermarket: {
    id: 'supermarket',
    icon: 'fa-cart-shopping',
    emoji: '🛒',
    color: '#22c55e', // green
    translations: {
      fr: 'Supermarché',
      en: 'Supermarket',
      es: 'Supermercado',
      de: 'Supermarkt',
    },
  },
  gas_station: {
    id: 'gas_station',
    icon: 'fa-gas-pump',
    emoji: '⛽',
    color: '#ef4444', // red
    translations: {
      fr: 'Station-service',
      en: 'Gas station',
      es: 'Gasolinera',
      de: 'Tankstelle',
    },
  },
  wifi: {
    id: 'wifi',
    icon: 'fa-wifi',
    emoji: '📶',
    color: '#8b5cf6', // purple
    translations: {
      fr: 'Wifi gratuit',
      en: 'Free wifi',
      es: 'Wifi gratis',
      de: 'Kostenloses WLAN',
    },
  },
}

// Average walking speed in km/h
const WALKING_SPEED_KMH = 5

// In-memory storage for POIs (would be Firebase in production)
let poisStorage = []

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate walking time from distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Walking time in minutes
 */
function calculateWalkingTime(distanceKm) {
  return Math.round((distanceKm / WALKING_SPEED_KMH) * 60)
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}

/**
 * Format walking time for display
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
function formatWalkingTime(minutes) {
  if (minutes < 60) {
    return `~${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `~${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`
}

/**
 * Get all POI types
 * @returns {Array} Array of POI type objects
 */
export function getPOITypes() {
  return Object.values(poiTypes)
}

/**
 * Get POI type by ID
 * @param {string} typeId - POI type ID
 * @returns {Object|null} POI type object or null
 */
export function getPOITypeById(typeId) {
  return poiTypes[typeId] || null
}

/**
 * Get translated name for POI type
 * @param {string} typeId - POI type ID
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated name
 */
export function getPOITypeName(typeId, lang = 'fr') {
  const type = poiTypes[typeId]
  if (!type) return typeId
  return type.translations[lang] || type.translations.en || typeId
}

/**
 * Get nearby POIs for a spot
 * @param {string|number} spotId - Spot ID
 * @param {number} radius - Search radius in km (default: 1)
 * @param {Object} options - Additional options
 * @param {string} options.type - Filter by POI type
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.sortBy - Sort by 'distance' or 'type'
 * @returns {Array} Array of POIs with distance and walking time
 */
export function getNearbyPOIs(spotId, radius = 1, options = {}) {
  const state = getState()
  const spots = state.spots || []
  // Use state.pois if it has items, otherwise use poisStorage
  const pois = (state.pois && state.pois.length > 0) ? state.pois : poisStorage
  const { type, limit = 20, sortBy = 'distance' } = options

  // Find the spot
  const spot = spots.find((s) => s.id === spotId || s.id === String(spotId))

  if (!spot || !spot.coordinates?.lat || !spot.coordinates?.lng) {
    return []
  }

  const { lat, lng } = spot.coordinates

  // Filter and calculate distances
  let nearbyPOIs = pois
    .filter((poi) => {
      // Must have coordinates
      if (!poi.coordinates?.lat || !poi.coordinates?.lng) return false
      // Filter by type if specified
      if (type && poi.type !== type) return false
      return true
    })
    .map((poi) => {
      const distance = haversineDistance(
        lat,
        lng,
        poi.coordinates.lat,
        poi.coordinates.lng
      )
      const walkingTimeMinutes = calculateWalkingTime(distance)

      return {
        ...poi,
        distance,
        distanceFormatted: formatDistance(distance),
        walkingTime: walkingTimeMinutes,
        walkingTimeFormatted: formatWalkingTime(walkingTimeMinutes),
      }
    })
    .filter((poi) => poi.distance <= radius)

  // Sort results
  if (sortBy === 'type') {
    nearbyPOIs.sort((a, b) => {
      const typeCompare = a.type.localeCompare(b.type)
      return typeCompare !== 0 ? typeCompare : a.distance - b.distance
    })
  } else {
    nearbyPOIs.sort((a, b) => a.distance - b.distance)
  }

  // Limit results
  if (limit > 0) {
    nearbyPOIs = nearbyPOIs.slice(0, limit)
  }

  return nearbyPOIs
}

/**
 * Get POIs for a spot, grouped by type
 * @param {string|number} spotId - Spot ID
 * @param {number} radius - Search radius in km
 * @returns {Object} Object with POI type keys and arrays of POIs
 */
export function getNearbyPOIsGroupedByType(spotId, radius = 1) {
  const pois = getNearbyPOIs(spotId, radius)
  const grouped = {}

  for (const poi of pois) {
    if (!grouped[poi.type]) {
      grouped[poi.type] = []
    }
    grouped[poi.type].push(poi)
  }

  return grouped
}

/**
 * Add a new POI near a spot
 * @param {string|number} spotId - Associated spot ID
 * @param {Object} poiData - POI data
 * @param {string} poiData.name - POI name
 * @param {string} poiData.type - POI type (restaurant, toilets, water, shelter, supermarket, gas_station, wifi)
 * @param {Object} poiData.coordinates - { lat, lng }
 * @param {string} poiData.description - Optional description
 * @param {boolean} poiData.verified - Whether POI is verified
 * @param {Array} poiData.features - Additional features (free, open_24h, etc.)
 * @returns {Object} Created POI with ID
 */
export function addPOI(spotId, poiData) {
  const state = getState()

  // Validate required fields
  if (!poiData.name || typeof poiData.name !== 'string') {
    throw new Error('POI name is required')
  }

  if (!poiData.type || !poiTypes[poiData.type]) {
    throw new Error('Invalid POI type')
  }

  if (
    !poiData.coordinates ||
    typeof poiData.coordinates.lat !== 'number' ||
    typeof poiData.coordinates.lng !== 'number'
  ) {
    throw new Error('Valid coordinates are required')
  }

  // Validate coordinate ranges
  if (
    poiData.coordinates.lat < -90 ||
    poiData.coordinates.lat > 90 ||
    poiData.coordinates.lng < -180 ||
    poiData.coordinates.lng > 180
  ) {
    throw new Error('Coordinates out of valid range')
  }

  const newPOI = {
    id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    spotId: spotId,
    name: poiData.name.trim(),
    type: poiData.type,
    coordinates: {
      lat: poiData.coordinates.lat,
      lng: poiData.coordinates.lng,
    },
    description: poiData.description?.trim() || '',
    verified: poiData.verified || false,
    features: Array.isArray(poiData.features) ? poiData.features : [],
    createdAt: new Date().toISOString(),
    createdBy: state.user?.uid || 'anonymous',
  }

  // Add to storage
  poisStorage.push(newPOI)

  // Update state if pois exist in state
  if (state.pois) {
    setState({ pois: [...state.pois, newPOI] })
  }

  return newPOI
}

/**
 * Update an existing POI
 * @param {string} poiId - POI ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated POI or null if not found
 */
export function updatePOI(poiId, updates) {
  const index = poisStorage.findIndex((p) => p.id === poiId)
  if (index === -1) return null

  const allowedUpdates = [
    'name',
    'description',
    'verified',
    'features',
    'coordinates',
  ]
  const filteredUpdates = {}

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key]
    }
  }

  // Validate coordinates if provided
  if (filteredUpdates.coordinates) {
    const { lat, lng } = filteredUpdates.coordinates
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error('Invalid coordinates')
    }
  }

  poisStorage[index] = {
    ...poisStorage[index],
    ...filteredUpdates,
    updatedAt: new Date().toISOString(),
  }

  return poisStorage[index]
}

/**
 * Delete a POI
 * @param {string} poiId - POI ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePOI(poiId) {
  const index = poisStorage.findIndex((p) => p.id === poiId)
  if (index === -1) return false

  poisStorage.splice(index, 1)
  return true
}

/**
 * Get a POI by ID
 * @param {string} poiId - POI ID
 * @returns {Object|null} POI or null if not found
 */
export function getPOIById(poiId) {
  return poisStorage.find((p) => p.id === poiId) || null
}

/**
 * Get all POIs for a specific spot
 * @param {string|number} spotId - Spot ID
 * @returns {Array} Array of POIs associated with the spot
 */
export function getPOIsBySpot(spotId) {
  return poisStorage.filter(
    (p) => p.spotId === spotId || p.spotId === String(spotId)
  )
}

/**
 * Count POIs by type near a spot
 * @param {string|number} spotId - Spot ID
 * @param {number} radius - Search radius in km
 * @returns {Object} Object with type keys and counts
 */
export function countPOIsByType(spotId, radius = 1) {
  const pois = getNearbyPOIs(spotId, radius)
  const counts = {}

  for (const type of Object.keys(poiTypes)) {
    counts[type] = 0
  }

  for (const poi of pois) {
    if (counts[poi.type] !== undefined) {
      counts[poi.type]++
    }
  }

  return counts
}

/**
 * Check if a spot has nearby POIs of a specific type
 * @param {string|number} spotId - Spot ID
 * @param {string} type - POI type
 * @param {number} radius - Search radius in km
 * @returns {boolean} True if at least one POI of type exists
 */
export function hasNearbyPOIOfType(spotId, type, radius = 1) {
  const pois = getNearbyPOIs(spotId, radius, { type, limit: 1 })
  return pois.length > 0
}

/**
 * Render POI list HTML
 * @param {Array} pois - Array of POI objects
 * @param {Object} options - Rendering options
 * @param {boolean} options.showDistance - Show distance (default: true)
 * @param {boolean} options.showWalkingTime - Show walking time (default: true)
 * @param {boolean} options.showDescription - Show description (default: false)
 * @param {string} options.emptyMessage - Message when no POIs (default: 'Aucun point d\'intérêt')
 * @returns {string} HTML string
 */
export function renderPOIList(pois, options = {}) {
  const state = getState()
  const lang = state.lang || 'fr'
  const {
    showDistance = true,
    showWalkingTime = true,
    showDescription = false,
    emptyMessage = lang === 'fr'
      ? 'Aucun point d\'intérêt à proximité'
      : 'No nearby points of interest',
  } = options

  if (!pois || pois.length === 0) {
    return `
      <div class="poi-list-empty text-center py-8 text-gray-400">
        <i class="fas fa-map-marker-alt text-3xl mb-2 opacity-50"></i>
        <p>${emptyMessage}</p>
      </div>
    `
  }

  const poiItems = pois
    .map((poi) => {
      const type = poiTypes[poi.type] || poiTypes.restaurant
      const typeName = type.translations[lang] || type.translations.en

      return `
      <div class="poi-item flex items-center gap-3 p-3 rounded-lg bg-dark-secondary hover:bg-dark-primary transition-colors cursor-pointer"
           data-poi-id="${poi.id}"
           role="listitem"
           aria-label="${typeName}: ${poi.name}">
        <div class="poi-icon flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
             style="background-color: ${type.color}20">
          <i class="fas ${type.icon}" style="color: ${type.color}"></i>
        </div>
        <div class="poi-info flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="poi-name font-medium text-white truncate">${escapeHtml(poi.name)}</span>
            ${poi.verified ? '<i class="fas fa-check-circle text-green-500 text-xs" title="Vérifié"></i>' : ''}
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <span class="poi-type">${type.emoji} ${typeName}</span>
            ${showDistance && poi.distanceFormatted ? `<span class="poi-distance">• ${poi.distanceFormatted}</span>` : ''}
            ${showWalkingTime && poi.walkingTimeFormatted ? `<span class="poi-walking-time">• 🚶 ${poi.walkingTimeFormatted}</span>` : ''}
          </div>
          ${showDescription && poi.description ? `<p class="poi-description text-xs text-gray-500 mt-1 truncate">${escapeHtml(poi.description)}</p>` : ''}
        </div>
        ${
          poi.features && poi.features.length > 0
            ? `
          <div class="poi-features flex gap-1">
            ${poi.features
              .slice(0, 3)
              .map((f) => `<span class="text-xs bg-dark-primary px-1.5 py-0.5 rounded text-gray-400">${escapeHtml(f)}</span>`)
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `
    })
    .join('')

  return `
    <div class="poi-list space-y-2" role="list" aria-label="Points d'intérêt">
      ${poiItems}
    </div>
  `
}

/**
 * Render POI markers data for map
 * @param {Array} pois - Array of POI objects
 * @returns {Array} Array of marker data objects for Leaflet
 */
export function renderPOIMarkers(pois) {
  if (!pois || !Array.isArray(pois)) return []

  const state = getState()
  const lang = state.lang || 'fr'

  return pois
    .filter((poi) => poi.coordinates?.lat && poi.coordinates?.lng)
    .map((poi) => {
      const type = poiTypes[poi.type] || poiTypes.restaurant
      const typeName = type.translations[lang] || type.translations.en

      return {
        id: poi.id,
        type: 'poi',
        poiType: poi.type,
        coordinates: [poi.coordinates.lat, poi.coordinates.lng],
        icon: type.icon,
        emoji: type.emoji,
        color: type.color,
        name: poi.name,
        typeName: typeName,
        verified: poi.verified || false,
        distance: poi.distance,
        distanceFormatted: poi.distanceFormatted,
        walkingTime: poi.walkingTime,
        walkingTimeFormatted: poi.walkingTimeFormatted,
        popupContent: `
          <div class="poi-popup">
            <div class="flex items-center gap-2 mb-2">
              <span style="color: ${type.color}">${type.emoji}</span>
              <strong>${escapeHtml(poi.name)}</strong>
              ${poi.verified ? '<i class="fas fa-check-circle text-green-500 text-xs"></i>' : ''}
            </div>
            <p class="text-sm text-gray-400">${typeName}</p>
            ${poi.distanceFormatted ? `<p class="text-xs text-gray-500 mt-1">${poi.distanceFormatted} • 🚶 ${poi.walkingTimeFormatted}</p>` : ''}
            ${poi.description ? `<p class="text-xs mt-2">${escapeHtml(poi.description)}</p>` : ''}
          </div>
        `,
      }
    })
}

/**
 * Render POI type filter buttons
 * @param {string} selectedType - Currently selected type (or 'all')
 * @returns {string} HTML string of filter buttons
 */
export function renderPOITypeFilters(selectedType = 'all') {
  const state = getState()
  const lang = state.lang || 'fr'

  const allLabel = lang === 'fr' ? 'Tous' : 'All'

  const allButton = `
    <button class="poi-filter-btn ${selectedType === 'all' ? 'active bg-primary-500 text-white' : 'bg-dark-secondary text-gray-400 hover:bg-dark-primary'} px-3 py-1.5 rounded-full text-sm transition-colors"
            data-poi-type="all"
            aria-pressed="${selectedType === 'all'}">
      ${allLabel}
    </button>
  `

  const typeButtons = Object.values(poiTypes)
    .map((type) => {
      const typeName = type.translations[lang] || type.translations.en
      const isActive = selectedType === type.id

      return `
      <button class="poi-filter-btn ${isActive ? 'active bg-primary-500 text-white' : 'bg-dark-secondary text-gray-400 hover:bg-dark-primary'} px-3 py-1.5 rounded-full text-sm transition-colors"
              data-poi-type="${type.id}"
              aria-pressed="${isActive}"
              title="${typeName}">
        ${type.emoji}
      </button>
    `
    })
    .join('')

  return `
    <div class="poi-type-filters flex flex-wrap gap-2" role="group" aria-label="Filtrer par type">
      ${allButton}
      ${typeButtons}
    </div>
  `
}

/**
 * Render POI summary for spot card
 * @param {string|number} spotId - Spot ID
 * @param {number} radius - Search radius in km
 * @returns {string} HTML string with POI icons and count
 */
export function renderPOISummary(spotId, radius = 0.5) {
  const counts = countPOIsByType(spotId, radius)
  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0)

  if (totalCount === 0) {
    return ''
  }

  const icons = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([type]) => {
      const poiType = poiTypes[type]
      return `<span style="color: ${poiType.color}" title="${poiType.translations.fr}">${poiType.emoji}</span>`
    })
    .join('')

  return `
    <div class="poi-summary flex items-center gap-1 text-sm" aria-label="${totalCount} points d'intérêt à proximité">
      ${icons}
      <span class="text-gray-400 text-xs ml-1">(${totalCount})</span>
    </div>
  `
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return ''
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.textContent = text
    return div.innerHTML
  }
  // Fallback for Node.js/test environment
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Initialize POIs storage (for testing)
 * @param {Array} pois - Array of POI objects
 */
export function initPOIsStorage(pois) {
  poisStorage = Array.isArray(pois) ? [...pois] : []
}

/**
 * Get all POIs from storage (for testing/debugging)
 * @returns {Array} All stored POIs
 */
export function getAllPOIs() {
  return [...poisStorage]
}

/**
 * Clear all POIs (for testing)
 */
export function clearPOIs() {
  poisStorage = []
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.getPOITypes = getPOITypes
  window.getNearbyPOIs = getNearbyPOIs
  window.addPOI = addPOI
}

export default {
  getPOITypes,
  getPOITypeById,
  getPOITypeName,
  getNearbyPOIs,
  getNearbyPOIsGroupedByType,
  addPOI,
  updatePOI,
  deletePOI,
  getPOIById,
  getPOIsBySpot,
  countPOIsByType,
  hasNearbyPOIOfType,
  renderPOIList,
  renderPOIMarkers,
  renderPOITypeFilters,
  renderPOISummary,
  initPOIsStorage,
  getAllPOIs,
  clearPOIs,
}
