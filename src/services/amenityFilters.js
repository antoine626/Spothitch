/**
 * Amenity Filters Service
 * Handles filtering spots by amenities (wifi, toilets, shelter, etc.)
 * Supports i18n for FR, EN, ES, DE
 * Bonus points system: +5 points for each amenity filled when creating a spot
 */

import { getState } from '../stores/state.js'

// Amenities database with icons and translations
const amenitiesData = {
  wifi: {
    id: 'wifi',
    icon: 'fa-solid fa-wifi',
    emoji: '\uD83D\uDCF6',
    labels: {
      fr: 'Wifi gratuit',
      en: 'Free WiFi',
      es: 'Wifi gratis',
      de: 'Kostenloses WLAN',
    },
    shortLabels: {
      fr: 'Wifi',
      en: 'WiFi',
      es: 'Wifi',
      de: 'WLAN',
    },
    description: {
      fr: 'Connexion wifi accessible a proximite',
      en: 'WiFi connection available nearby',
      es: 'Conexion wifi disponible cerca',
      de: 'WLAN-Verbindung in der Nahe verfugbar',
    },
    bonusPoints: 5,
  },
  toilets: {
    id: 'toilets',
    icon: 'fa-solid fa-restroom',
    emoji: '\uD83D\uDEBB',
    labels: {
      fr: 'Toilettes',
      en: 'Toilets',
      es: 'Banos',
      de: 'Toiletten',
    },
    shortLabels: {
      fr: 'WC',
      en: 'WC',
      es: 'WC',
      de: 'WC',
    },
    description: {
      fr: 'Toilettes publiques accessibles',
      en: 'Public toilets accessible',
      es: 'Banos publicos accesibles',
      de: 'Offentliche Toiletten zuganglich',
    },
    bonusPoints: 5,
  },
  shelter: {
    id: 'shelter',
    icon: 'fa-solid fa-house-chimney',
    emoji: '\uD83C\uDFE0',
    labels: {
      fr: 'Abri',
      en: 'Shelter',
      es: 'Refugio',
      de: 'Unterstand',
    },
    shortLabels: {
      fr: 'Abri',
      en: 'Shelter',
      es: 'Refugio',
      de: 'Unterstand',
    },
    description: {
      fr: 'Abri contre la pluie ou le soleil',
      en: 'Shelter from rain or sun',
      es: 'Refugio contra lluvia o sol',
      de: 'Schutz vor Regen oder Sonne',
    },
    bonusPoints: 5,
  },
  lighting: {
    id: 'lighting',
    icon: 'fa-solid fa-lightbulb',
    emoji: '\uD83D\uDCA1',
    labels: {
      fr: 'Eclairage',
      en: 'Lighting',
      es: 'Iluminacion',
      de: 'Beleuchtung',
    },
    shortLabels: {
      fr: 'Eclairage',
      en: 'Lights',
      es: 'Luces',
      de: 'Licht',
    },
    description: {
      fr: 'Bien eclaire la nuit',
      en: 'Well lit at night',
      es: 'Bien iluminado de noche',
      de: 'Nachts gut beleuchtet',
    },
    bonusPoints: 5,
  },
  parking: {
    id: 'parking',
    icon: 'fa-solid fa-square-parking',
    emoji: '\uD83C\uDD7F\uFE0F',
    labels: {
      fr: 'Parking',
      en: 'Parking',
      es: 'Aparcamiento',
      de: 'Parkplatz',
    },
    shortLabels: {
      fr: 'Parking',
      en: 'Parking',
      es: 'Parking',
      de: 'Parkplatz',
    },
    description: {
      fr: 'Place de parking pour s\'arreter facilement',
      en: 'Parking space to easily stop',
      es: 'Espacio para aparcar facilmente',
      de: 'Parkplatz zum einfachen Anhalten',
    },
    bonusPoints: 5,
  },
  water: {
    id: 'water',
    icon: 'fa-solid fa-droplet',
    emoji: '\uD83D\uDCA7',
    labels: {
      fr: 'Point d\'eau',
      en: 'Water point',
      es: 'Punto de agua',
      de: 'Wasserstelle',
    },
    shortLabels: {
      fr: 'Eau',
      en: 'Water',
      es: 'Agua',
      de: 'Wasser',
    },
    description: {
      fr: 'Fontaine ou point d\'eau potable',
      en: 'Fountain or drinking water point',
      es: 'Fuente o punto de agua potable',
      de: 'Brunnen oder Trinkwasserstelle',
    },
    bonusPoints: 5,
  },
  food: {
    id: 'food',
    icon: 'fa-solid fa-utensils',
    emoji: '\uD83C\uDF54',
    labels: {
      fr: 'Restauration',
      en: 'Food',
      es: 'Comida',
      de: 'Essen',
    },
    shortLabels: {
      fr: 'Restau',
      en: 'Food',
      es: 'Comida',
      de: 'Essen',
    },
    description: {
      fr: 'Restaurant ou snack a proximite',
      en: 'Restaurant or snack nearby',
      es: 'Restaurante o snack cerca',
      de: 'Restaurant oder Snack in der Nahe',
    },
    bonusPoints: 5,
  },
  shops: {
    id: 'shops',
    icon: 'fa-solid fa-store',
    emoji: '\uD83D\uDED2',
    labels: {
      fr: 'Commerces',
      en: 'Shops',
      es: 'Tiendas',
      de: 'Geschafte',
    },
    shortLabels: {
      fr: 'Commerces',
      en: 'Shops',
      es: 'Tiendas',
      de: 'Geschafte',
    },
    description: {
      fr: 'Magasins ou superette a proximite',
      en: 'Stores or convenience shop nearby',
      es: 'Tiendas o supermercado cerca',
      de: 'Laden oder Supermarkt in der Nahe',
    },
    bonusPoints: 5,
  },
}

// Bonus points per amenity when creating a spot
const AMENITY_BONUS_POINTS = 5

/**
 * Get all available amenities
 * @returns {string[]} Array of amenity IDs
 */
export function getAvailableAmenities() {
  return Object.keys(amenitiesData)
}

/**
 * Get detailed amenity data
 * @param {string} amenityId - Amenity ID
 * @returns {Object|null} Amenity data or null if not found
 */
export function getAmenityData(amenityId) {
  if (!amenityId || typeof amenityId !== 'string') return null
  return amenitiesData[amenityId.toLowerCase()] || null
}

/**
 * Get all amenities data
 * @returns {Object} Object with all amenities (deep clone)
 */
export function getAllAmenitiesData() {
  return JSON.parse(JSON.stringify(amenitiesData))
}

/**
 * Filter spots by selected amenities
 * Returns spots that have ALL selected amenities (AND logic)
 * @param {Object[]} spots - Array of spot objects
 * @param {string[]} amenities - Array of amenity IDs to filter by
 * @returns {Object[]} Filtered spots
 */
export function filterSpotsByAmenities(spots, amenities) {
  if (!spots || !Array.isArray(spots)) return []
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return spots

  // Normalize amenity IDs to lowercase
  const normalizedAmenities = amenities.map(a => a.toLowerCase())

  return spots.filter(spot => {
    if (!spot) return false

    // Get spot amenities (handle different formats)
    const spotAmenities = getSpotAmenities(spot)

    // Check if spot has ALL selected amenities
    return normalizedAmenities.every(amenity => spotAmenities.includes(amenity))
  })
}

/**
 * Filter spots by ANY of the selected amenities (OR logic)
 * @param {Object[]} spots - Array of spot objects
 * @param {string[]} amenities - Array of amenity IDs to filter by
 * @returns {Object[]} Filtered spots
 */
export function filterSpotsByAnyAmenity(spots, amenities) {
  if (!spots || !Array.isArray(spots)) return []
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return spots

  // Normalize amenity IDs to lowercase
  const normalizedAmenities = amenities.map(a => a.toLowerCase())

  return spots.filter(spot => {
    if (!spot) return false

    // Get spot amenities
    const spotAmenities = getSpotAmenities(spot)

    // Check if spot has ANY of the selected amenities
    return normalizedAmenities.some(amenity => spotAmenities.includes(amenity))
  })
}

/**
 * Get icon class for an amenity (FontAwesome class)
 * @param {string} amenityId - Amenity ID
 * @returns {string} FontAwesome icon class
 */
export function getAmenityIcon(amenityId) {
  const amenity = getAmenityData(amenityId)
  return amenity ? amenity.icon : 'fa-solid fa-circle-question'
}

/**
 * Get emoji for an amenity
 * @param {string} amenityId - Amenity ID
 * @returns {string} Emoji
 */
export function getAmenityEmoji(amenityId) {
  const amenity = getAmenityData(amenityId)
  return amenity ? amenity.emoji : '\u2753'
}

/**
 * Get translated label for an amenity
 * @param {string} amenityId - Amenity ID
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated label
 */
export function getAmenityLabel(amenityId, lang) {
  const amenity = getAmenityData(amenityId)
  if (!amenity) return amenityId || ''

  const language = (lang || getState().lang || 'fr').toLowerCase()
  return amenity.labels[language] || amenity.labels.fr || amenityId
}

/**
 * Get short translated label for an amenity
 * @param {string} amenityId - Amenity ID
 * @param {string} lang - Language code
 * @returns {string} Short translated label
 */
export function getAmenityShortLabel(amenityId, lang) {
  const amenity = getAmenityData(amenityId)
  if (!amenity) return amenityId || ''

  const language = (lang || getState().lang || 'fr').toLowerCase()
  return amenity.shortLabels[language] || amenity.shortLabels.fr || amenityId
}

/**
 * Get translated description for an amenity
 * @param {string} amenityId - Amenity ID
 * @param {string} lang - Language code
 * @returns {string} Translated description
 */
export function getAmenityDescription(amenityId, lang) {
  const amenity = getAmenityData(amenityId)
  if (!amenity) return ''

  const language = (lang || getState().lang || 'fr').toLowerCase()
  return amenity.description[language] || amenity.description.fr || ''
}

/**
 * Check if a spot has a specific amenity
 * @param {Object} spot - Spot object
 * @param {string} amenityId - Amenity ID
 * @returns {boolean} True if spot has the amenity
 */
export function hasAmenity(spot, amenityId) {
  if (!spot || !amenityId) return false

  const spotAmenities = getSpotAmenities(spot)
  return spotAmenities.includes(amenityId.toLowerCase())
}

/**
 * Get all amenities for a spot
 * @param {Object} spot - Spot object
 * @returns {string[]} Array of amenity IDs
 */
export function getSpotAmenities(spot) {
  if (!spot) return []

  // Handle different formats the spot might have amenities
  // Format 1: spot.amenities = ['wifi', 'toilets']
  if (Array.isArray(spot.amenities)) {
    return spot.amenities.map(a => a.toLowerCase())
  }

  // Format 2: spot.amenities = { wifi: true, toilets: true }
  if (spot.amenities && typeof spot.amenities === 'object') {
    return Object.entries(spot.amenities)
      .filter(([, value]) => value === true)
      .map(([key]) => key.toLowerCase())
  }

  // Format 3: Individual boolean properties
  const amenities = []
  const amenityIds = getAvailableAmenities()

  for (const amenityId of amenityIds) {
    if (spot[amenityId] === true || spot[`has${amenityId.charAt(0).toUpperCase() + amenityId.slice(1)}`] === true) {
      amenities.push(amenityId)
    }
  }

  return amenities
}

/**
 * Count spots that have a specific amenity
 * @param {Object[]} spots - Array of spot objects
 * @param {string} amenityId - Amenity ID
 * @returns {number} Count of spots with the amenity
 */
export function countSpotsByAmenity(spots, amenityId) {
  if (!spots || !Array.isArray(spots) || !amenityId) return 0

  return spots.filter(spot => hasAmenity(spot, amenityId)).length
}

/**
 * Get statistics for all amenities
 * @param {Object[]} spots - Array of spot objects
 * @returns {Object} Object with amenity counts and percentages
 */
export function getAmenityStats(spots) {
  const stats = {}
  const totalSpots = spots?.length || 0
  const amenityIds = getAvailableAmenities()

  for (const amenityId of amenityIds) {
    const count = countSpotsByAmenity(spots, amenityId)
    stats[amenityId] = {
      id: amenityId,
      count,
      percentage: totalSpots > 0 ? Math.round((count / totalSpots) * 100) : 0,
      label: getAmenityLabel(amenityId),
      icon: getAmenityIcon(amenityId),
      emoji: getAmenityEmoji(amenityId),
    }
  }

  return stats
}

/**
 * Render HTML badge for an amenity
 * @param {string} amenityId - Amenity ID
 * @param {Object} options - Rendering options
 * @param {string} options.size - Badge size: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} options.showLabel - Show label text (default: true)
 * @param {string} options.lang - Language code
 * @returns {string} HTML string for the badge
 */
export function renderAmenityBadge(amenityId, options = {}) {
  const { size = 'md', showLabel = true, lang } = options
  const amenity = getAmenityData(amenityId)

  if (!amenity) {
    return `<span class="amenity-badge amenity-badge-unknown">
      <i class="fa-solid fa-circle-question" aria-hidden="true"></i>
      ${showLabel ? `<span>${amenityId}</span>` : ''}
    </span>`
  }

  const label = getAmenityLabel(amenityId, lang)
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }
  const sizeClass = sizeClasses[size] || sizeClasses.md

  return `<span
    class="amenity-badge amenity-badge-${amenityId} inline-flex items-center gap-1 ${sizeClass} bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full"
    data-amenity="${amenityId}"
    title="${label}"
    aria-label="${label}"
  >
    <i class="${amenity.icon}" aria-hidden="true"></i>
    ${showLabel ? `<span class="amenity-label">${label}</span>` : ''}
  </span>`
}

/**
 * Render filter UI for amenities
 * @param {string[]} selectedAmenities - Currently selected amenity IDs
 * @param {Object} options - Rendering options
 * @param {string} options.lang - Language code
 * @param {boolean} options.showCounts - Show spot counts (requires spots param)
 * @param {Object[]} options.spots - Spots for counting (optional)
 * @returns {string} HTML string for the filter UI
 */
export function renderAmenityFilter(selectedAmenities = [], options = {}) {
  const { lang, showCounts = false, spots = [] } = options
  const amenityIds = getAvailableAmenities()
  const normalizedSelected = (selectedAmenities || []).map(a => a.toLowerCase())

  const filterItems = amenityIds.map(amenityId => {
    const amenity = getAmenityData(amenityId)
    const label = getAmenityLabel(amenityId, lang)
    const isSelected = normalizedSelected.includes(amenityId)
    const count = showCounts ? countSpotsByAmenity(spots, amenityId) : null

    return `
      <button
        type="button"
        class="amenity-filter-item flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
          ${isSelected
            ? 'bg-primary-500 text-white border-primary-500'
            : 'bg-white dark:bg-dark-secondary text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
          }"
        data-amenity="${amenityId}"
        aria-pressed="${isSelected}"
        onclick="window.toggleAmenityFilter && window.toggleAmenityFilter('${amenityId}')"
      >
        <i class="${amenity.icon}" aria-hidden="true"></i>
        <span>${label}</span>
        ${showCounts && count !== null ? `<span class="amenity-count text-xs opacity-75">(${count})</span>` : ''}
      </button>
    `
  }).join('')

  return `
    <div class="amenity-filter" role="group" aria-label="Filtrer par commodites">
      <div class="amenity-filter-header flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          <i class="fa-solid fa-filter mr-2" aria-hidden="true"></i>
          ${getLangText('filterByAmenities', lang)}
        </h3>
        ${normalizedSelected.length > 0 ? `
          <button
            type="button"
            class="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-400"
            onclick="window.clearAmenityFilters && window.clearAmenityFilters()"
          >
            ${getLangText('clearFilters', lang)}
          </button>
        ` : ''}
      </div>
      <div class="amenity-filter-items flex flex-wrap gap-2">
        ${filterItems}
      </div>
      ${normalizedSelected.length > 0 ? `
        <div class="amenity-filter-active mt-3 text-sm text-gray-600 dark:text-gray-400">
          ${normalizedSelected.length} ${getLangText('activeFilters', lang)}
        </div>
      ` : ''}
    </div>
  `
}

/**
 * Toggle amenity in selection
 * @param {string[]} currentSelection - Current selection array
 * @param {string} amenityId - Amenity ID to toggle
 * @returns {string[]} New selection array
 */
export function toggleAmenity(currentSelection, amenityId) {
  if (!amenityId) return currentSelection || []

  const selection = currentSelection || []
  const normalizedId = amenityId.toLowerCase()

  if (selection.includes(normalizedId)) {
    return selection.filter(a => a !== normalizedId)
  } else {
    // Validate that it's a valid amenity
    if (!amenitiesData[normalizedId]) {
      console.warn(`[AmenityFilters] Unknown amenity: ${amenityId}`)
      return selection
    }
    return [...selection, normalizedId]
  }
}

/**
 * Clear all selected amenities
 * @returns {string[]} Empty array
 */
export function clearAmenitySelection() {
  return []
}

/**
 * Get most popular amenities (sorted by frequency)
 * @param {Object[]} spots - Array of spot objects
 * @param {number} limit - Max number of amenities to return (default: all)
 * @returns {Object[]} Array of amenity objects with counts, sorted by popularity
 */
export function getPopularAmenities(spots, limit) {
  const stats = getAmenityStats(spots)

  const sorted = Object.values(stats)
    .sort((a, b) => b.count - a.count)

  return limit && limit > 0 ? sorted.slice(0, limit) : sorted
}

/**
 * Sort amenities by popularity (frequency in spots)
 * @param {Object[]} spots - Array of spot objects
 * @returns {string[]} Amenity IDs sorted by frequency (most common first)
 */
export function sortAmenitiesByPopularity(spots) {
  const popular = getPopularAmenities(spots)
  return popular.map(a => a.id)
}

/**
 * Calculate bonus points for amenities when creating a spot
 * @param {string[]|Object} amenities - Amenities array or object
 * @returns {number} Total bonus points
 */
export function calculateAmenityBonusPoints(amenities) {
  if (!amenities) return 0

  let amenityList = []

  // Handle array format
  if (Array.isArray(amenities)) {
    amenityList = amenities
  }
  // Handle object format { wifi: true, toilets: true }
  else if (typeof amenities === 'object') {
    amenityList = Object.entries(amenities)
      .filter(([, value]) => value === true)
      .map(([key]) => key)
  }

  // Count valid amenities and calculate points
  const validAmenities = amenityList.filter(a => amenitiesData[a.toLowerCase()])
  return validAmenities.length * AMENITY_BONUS_POINTS
}

/**
 * Get the bonus points value per amenity
 * @returns {number} Bonus points per amenity
 */
export function getAmenityBonusPointsValue() {
  return AMENITY_BONUS_POINTS
}

/**
 * Validate amenities array
 * @param {string[]} amenities - Array of amenity IDs
 * @returns {Object} Validation result { valid: boolean, invalid: string[], cleaned: string[] }
 */
export function validateAmenities(amenities) {
  if (!amenities || !Array.isArray(amenities)) {
    return { valid: true, invalid: [], cleaned: [] }
  }

  const valid = []
  const invalid = []

  for (const amenity of amenities) {
    if (typeof amenity !== 'string') {
      invalid.push(String(amenity))
      continue
    }

    const normalized = amenity.toLowerCase()
    if (amenitiesData[normalized]) {
      valid.push(normalized)
    } else {
      invalid.push(amenity)
    }
  }

  return {
    valid: invalid.length === 0,
    invalid,
    cleaned: valid,
  }
}

/**
 * Get amenities that a spot is missing
 * @param {Object} spot - Spot object
 * @returns {string[]} Array of missing amenity IDs
 */
export function getMissingAmenities(spot) {
  const spotAmenities = getSpotAmenities(spot)
  const allAmenities = getAvailableAmenities()

  return allAmenities.filter(a => !spotAmenities.includes(a))
}

/**
 * Get completeness percentage of amenity data
 * @param {Object} spot - Spot object
 * @returns {number} Percentage (0-100)
 */
export function getAmenityCompleteness(spot) {
  const spotAmenities = getSpotAmenities(spot)
  const allAmenities = getAvailableAmenities()

  // We don't expect all amenities to be present, so we check if at least some are defined
  // A spot is "complete" if it has at least 1 amenity or explicitly has an empty amenities array
  if (spot && (Array.isArray(spot.amenities) || (spot.amenities && typeof spot.amenities === 'object'))) {
    return 100 // Amenity data is defined (even if empty)
  }

  return spotAmenities.length > 0 ? 100 : 0
}

/**
 * Render amenities list for a spot
 * @param {Object} spot - Spot object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSpotAmenities(spot, options = {}) {
  const { size = 'sm', showEmpty = false, lang } = options
  const amenities = getSpotAmenities(spot)

  if (amenities.length === 0) {
    if (showEmpty) {
      return `<span class="text-gray-400 dark:text-gray-600 text-sm italic">
        ${getLangText('noAmenities', lang)}
      </span>`
    }
    return ''
  }

  const badges = amenities.map(amenityId =>
    renderAmenityBadge(amenityId, { size, showLabel: false, lang })
  ).join('')

  return `<div class="spot-amenities flex flex-wrap gap-1" role="list" aria-label="${getLangText('spotAmenities', lang)}">
    ${badges}
  </div>`
}

/**
 * Get translated UI text
 * @param {string} key - Text key
 * @param {string} lang - Language code
 * @returns {string} Translated text
 */
function getLangText(key, lang) {
  const language = (lang || getState().lang || 'fr').toLowerCase()

  const texts = {
    filterByAmenities: {
      fr: 'Filtrer par commodites',
      en: 'Filter by amenities',
      es: 'Filtrar por comodidades',
      de: 'Nach Annehmlichkeiten filtern',
    },
    clearFilters: {
      fr: 'Effacer',
      en: 'Clear',
      es: 'Borrar',
      de: 'Loschen',
    },
    activeFilters: {
      fr: 'filtre(s) actif(s)',
      en: 'active filter(s)',
      es: 'filtro(s) activo(s)',
      de: 'aktive(r) Filter',
    },
    noAmenities: {
      fr: 'Aucune commodite',
      en: 'No amenities',
      es: 'Sin comodidades',
      de: 'Keine Annehmlichkeiten',
    },
    spotAmenities: {
      fr: 'Commodites du spot',
      en: 'Spot amenities',
      es: 'Comodidades del spot',
      de: 'Spot-Annehmlichkeiten',
    },
  }

  const textObj = texts[key]
  if (!textObj) return key

  return textObj[language] || textObj.fr || key
}

// Default export with all functions
export default {
  // Core functions
  getAvailableAmenities,
  getAmenityData,
  getAllAmenitiesData,

  // Filtering
  filterSpotsByAmenities,
  filterSpotsByAnyAmenity,

  // Labels and icons
  getAmenityIcon,
  getAmenityEmoji,
  getAmenityLabel,
  getAmenityShortLabel,
  getAmenityDescription,

  // Spot operations
  hasAmenity,
  getSpotAmenities,
  getMissingAmenities,
  getAmenityCompleteness,

  // Statistics
  countSpotsByAmenity,
  getAmenityStats,
  getPopularAmenities,
  sortAmenitiesByPopularity,

  // Rendering
  renderAmenityBadge,
  renderAmenityFilter,
  renderSpotAmenities,

  // Selection management
  toggleAmenity,
  clearAmenitySelection,

  // Bonus points
  calculateAmenityBonusPoints,
  getAmenityBonusPointsValue,

  // Validation
  validateAmenities,
}
