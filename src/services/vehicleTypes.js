/**
 * Vehicle Types Service
 * Tracks and displays vehicle type statistics per spot
 * Integrated into SPOT STATS for better hitchhiking insights
 */

import { getState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'

// Storage key for vehicle stats
const VEHICLE_STATS_KEY = 'vehicle_stats'

// Vehicle types with icons and labels
export const vehicleTypes = {
  voiture: {
    id: 'voiture',
    icon: 'fa-car',
    emoji: '🚗',
    labels: {
      fr: 'Voiture',
      en: 'Car',
      es: 'Coche',
      de: 'Auto',
    },
    description: {
      fr: 'Vehicule particulier standard',
      en: 'Standard private vehicle',
      es: 'Vehiculo particular estandar',
      de: 'Standard Privatfahrzeug',
    },
  },
  camion: {
    id: 'camion',
    icon: 'fa-truck',
    emoji: '🚛',
    labels: {
      fr: 'Camion',
      en: 'Truck',
      es: 'Camion',
      de: 'LKW',
    },
    description: {
      fr: 'Poids lourd ou semi-remorque',
      en: 'Heavy goods vehicle or semi-trailer',
      es: 'Vehiculo pesado o semi-remolque',
      de: 'Schwertransporter oder Sattelzug',
    },
  },
  van: {
    id: 'van',
    icon: 'fa-shuttle-van',
    emoji: '🚐',
    labels: {
      fr: 'Van',
      en: 'Van',
      es: 'Furgoneta',
      de: 'Transporter',
    },
    description: {
      fr: 'Fourgon ou utilitaire',
      en: 'Van or utility vehicle',
      es: 'Furgoneta o vehiculo utilitario',
      de: 'Kleintransporter oder Nutzfahrzeug',
    },
  },
  'camping-car': {
    id: 'camping-car',
    icon: 'fa-caravan',
    emoji: '🏕️',
    labels: {
      fr: 'Camping-car',
      en: 'Motorhome',
      es: 'Autocaravana',
      de: 'Wohnmobil',
    },
    description: {
      fr: 'Vehicule de loisirs habitable',
      en: 'Recreational vehicle',
      es: 'Vehiculo recreativo habitable',
      de: 'Wohnmobil oder Reisefahrzeug',
    },
  },
  moto: {
    id: 'moto',
    icon: 'fa-motorcycle',
    emoji: '🏍️',
    labels: {
      fr: 'Moto',
      en: 'Motorcycle',
      es: 'Moto',
      de: 'Motorrad',
    },
    description: {
      fr: 'Deux-roues motorise',
      en: 'Motorized two-wheeler',
      es: 'Dos ruedas motorizado',
      de: 'Motorisiertes Zweirad',
    },
  },
  bus: {
    id: 'bus',
    icon: 'fa-bus',
    emoji: '🚌',
    labels: {
      fr: 'Bus',
      en: 'Bus',
      es: 'Autobus',
      de: 'Bus',
    },
    description: {
      fr: 'Autocar ou minibus',
      en: 'Coach or minibus',
      es: 'Autocar o minibus',
      de: 'Reisebus oder Kleinbus',
    },
  },
}

// List of valid vehicle type IDs
export const validVehicleTypes = Object.keys(vehicleTypes)

/**
 * Get vehicle stats from storage
 * @returns {Object} All vehicle stats by spot ID
 */
function getVehicleStatsFromStorage() {
  return Storage.get(VEHICLE_STATS_KEY) || {}
}

/**
 * Save vehicle stats to storage
 * @param {Object} stats - Stats to save
 */
function saveVehicleStatsToStorage(stats) {
  Storage.set(VEHICLE_STATS_KEY, stats)
}

/**
 * Get vehicle statistics for a specific spot
 * @param {string|number} spotId - The spot ID
 * @returns {Object} Vehicle stats with counts and percentages
 */
export function getVehicleStats(spotId) {
  if (!spotId) return null

  const allStats = getVehicleStatsFromStorage()
  const spotStats = allStats[spotId] || {}

  // Calculate totals and percentages (exclude lastUpdated from count)
  let totalRecords = 0
  for (const [key, value] of Object.entries(spotStats)) {
    if (key !== 'lastUpdated' && typeof value === 'number') {
      totalRecords += value
    }
  }

  if (totalRecords === 0) {
    return {
      spotId,
      totalRecords: 0,
      types: {},
      percentages: {},
      mostCommon: null,
      lastUpdated: null,
    }
  }

  // Calculate percentages for each type
  const percentages = {}
  for (const [type, count] of Object.entries(spotStats)) {
    if (typeof count === 'number' && count > 0) {
      percentages[type] = Math.round((count / totalRecords) * 100)
    }
  }

  // Find most common vehicle
  let mostCommon = null
  let maxCount = 0
  for (const [type, count] of Object.entries(spotStats)) {
    if (typeof count === 'number' && count > maxCount) {
      maxCount = count
      mostCommon = type
    }
  }

  return {
    spotId,
    totalRecords,
    types: { ...spotStats },
    percentages,
    mostCommon,
    lastUpdated: spotStats.lastUpdated || null,
  }
}

/**
 * Record a vehicle type observation for a spot
 * @param {string|number} spotId - The spot ID
 * @param {string} type - Vehicle type (voiture, camion, van, camping-car, moto, bus)
 * @returns {Object} Updated stats or null if invalid
 */
export function recordVehicleType(spotId, type) {
  if (!spotId) {
    console.warn('[VehicleTypes] Invalid spot ID')
    return null
  }

  if (!type || !validVehicleTypes.includes(type)) {
    console.warn(`[VehicleTypes] Invalid vehicle type: ${type}`)
    return null
  }

  const allStats = getVehicleStatsFromStorage()

  if (!allStats[spotId]) {
    allStats[spotId] = {}
  }

  // Increment count for this vehicle type
  allStats[spotId][type] = (allStats[spotId][type] || 0) + 1
  allStats[spotId].lastUpdated = new Date().toISOString()

  // Save to storage
  saveVehicleStatsToStorage(allStats)

  return getVehicleStats(spotId)
}

/**
 * Get the most common vehicle type for a spot
 * @param {string|number} spotId - The spot ID
 * @returns {Object|null} Most common vehicle info or null
 */
export function getMostCommonVehicle(spotId) {
  if (!spotId) return null

  const stats = getVehicleStats(spotId)

  if (!stats || !stats.mostCommon) {
    return null
  }

  const vehicleInfo = vehicleTypes[stats.mostCommon]
  const state = getState()
  const lang = state?.lang || 'fr'

  return {
    type: stats.mostCommon,
    count: stats.types[stats.mostCommon] || 0,
    percentage: stats.percentages[stats.mostCommon] || 0,
    label: vehicleInfo?.labels[lang] || vehicleInfo?.labels.fr || stats.mostCommon,
    emoji: vehicleInfo?.emoji || '🚗',
    icon: vehicleInfo?.icon || 'fa-car',
  }
}

/**
 * Render vehicle statistics as HTML for spot detail view
 * @param {string|number} spotId - The spot ID
 * @returns {string} HTML string for vehicle stats display
 */
export function renderVehicleStats(spotId) {
  const stats = getVehicleStats(spotId)
  const state = getState()
  const lang = state?.lang || 'fr'

  if (!stats || stats.totalRecords === 0) {
    const emptyMessage = {
      fr: 'Aucune donnee de vehicule disponible',
      en: 'No vehicle data available',
      es: 'No hay datos de vehiculos disponibles',
      de: 'Keine Fahrzeugdaten verfugbar',
    }

    return `
      <div class="vehicle-stats-container p-4 bg-dark-secondary rounded-lg">
        <h4 class="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <i class="fas fa-car"></i>
          <span>Types de vehicules</span>
        </h4>
        <p class="text-sm text-gray-500 text-center py-4">${emptyMessage[lang] || emptyMessage.fr}</p>
        <button
          class="w-full mt-2 py-2 px-4 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm transition-colors"
          onclick="window.openVehicleTypeModal?.('${spotId}')"
          aria-label="Ajouter un type de vehicule">
          <i class="fas fa-plus mr-2"></i>Ajouter une observation
        </button>
      </div>
    `
  }

  // Build bars for each vehicle type with data
  const barsHtml = validVehicleTypes
    .filter(type => stats.types[type] && stats.types[type] > 0)
    .sort((a, b) => (stats.types[b] || 0) - (stats.types[a] || 0))
    .map(type => {
      const vehicle = vehicleTypes[type]
      const count = stats.types[type]
      const percentage = stats.percentages[type] || 0
      const label = vehicle?.labels[lang] || vehicle?.labels.fr || type
      const isMostCommon = type === stats.mostCommon

      return `
        <div class="vehicle-stat-row flex items-center gap-3 py-2 ${isMostCommon ? 'bg-primary-500/10 -mx-2 px-2 rounded-lg' : ''}">
          <span class="w-8 text-center text-lg" title="${label}">${vehicle?.emoji || '🚗'}</span>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-white">${label}</span>
              <span class="text-xs text-gray-400">${count} (${percentage}%)</span>
            </div>
            <div class="h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                class="h-full ${isMostCommon ? 'bg-primary-500' : 'bg-accent-500'} rounded-full transition-all duration-300"
                style="width: ${percentage}%"
                role="progressbar"
                aria-valuenow="${percentage}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="${label}: ${percentage}%">
              </div>
            </div>
          </div>
          ${isMostCommon ? '<span class="text-primary-400 text-xs font-medium">Top</span>' : ''}
        </div>
      `
    })
    .join('')

  const mostCommon = getMostCommonVehicle(spotId)
  const titleLabel = {
    fr: 'Types de vehicules',
    en: 'Vehicle types',
    es: 'Tipos de vehiculos',
    de: 'Fahrzeugtypen',
  }
  const totalLabel = {
    fr: 'observations',
    en: 'observations',
    es: 'observaciones',
    de: 'Beobachtungen',
  }
  const addLabel = {
    fr: 'Ajouter une observation',
    en: 'Add an observation',
    es: 'Agregar una observacion',
    de: 'Beobachtung hinzufugen',
  }

  return `
    <div class="vehicle-stats-container p-4 bg-dark-secondary rounded-lg" data-spot-id="${spotId}">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-semibold text-gray-400 flex items-center gap-2">
          <i class="fas fa-car"></i>
          <span>${titleLabel[lang] || titleLabel.fr}</span>
        </h4>
        <span class="text-xs text-gray-500">${stats.totalRecords} ${totalLabel[lang] || totalLabel.fr}</span>
      </div>

      ${mostCommon ? `
        <div class="most-common-vehicle mb-4 p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${mostCommon.emoji}</span>
            <div>
              <p class="text-sm text-primary-400 font-medium">Le plus courant</p>
              <p class="text-white font-semibold">${mostCommon.label}</p>
              <p class="text-xs text-gray-400">${mostCommon.percentage}% des observations</p>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="vehicle-stats-list space-y-1">
        ${barsHtml}
      </div>

      <button
        class="w-full mt-4 py-2 px-4 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm transition-colors"
        onclick="window.openVehicleTypeModal?.('${spotId}')"
        aria-label="${addLabel[lang] || addLabel.fr}">
        <i class="fas fa-plus mr-2"></i>${addLabel[lang] || addLabel.fr}
      </button>
    </div>
  `
}

/**
 * Get all vehicle types with their labels
 * @returns {Array} Array of vehicle type objects
 */
export function getVehicleTypesList() {
  const state = getState()
  const lang = state?.lang || 'fr'

  return validVehicleTypes.map(typeId => {
    const vehicle = vehicleTypes[typeId]
    return {
      id: typeId,
      label: vehicle.labels[lang] || vehicle.labels.fr,
      emoji: vehicle.emoji,
      icon: vehicle.icon,
      description: vehicle.description[lang] || vehicle.description.fr,
    }
  })
}

/**
 * Get vehicle type info by ID
 * @param {string} typeId - Vehicle type ID
 * @returns {Object|null} Vehicle type info or null
 */
export function getVehicleTypeInfo(typeId) {
  if (!typeId || !vehicleTypes[typeId]) return null

  const state = getState()
  const lang = state?.lang || 'fr'
  const vehicle = vehicleTypes[typeId]

  return {
    id: typeId,
    label: vehicle.labels[lang] || vehicle.labels.fr,
    emoji: vehicle.emoji,
    icon: vehicle.icon,
    description: vehicle.description[lang] || vehicle.description.fr,
  }
}

/**
 * Clear vehicle stats for a specific spot
 * @param {string|number} spotId - The spot ID
 * @returns {boolean} Success status
 */
export function clearVehicleStats(spotId) {
  if (!spotId) return false

  const allStats = getVehicleStatsFromStorage()

  if (allStats[spotId]) {
    delete allStats[spotId]
    saveVehicleStatsToStorage(allStats)
    return true
  }

  return false
}

/**
 * Get global vehicle statistics across all spots
 * @returns {Object} Aggregated vehicle stats
 */
export function getGlobalVehicleStats() {
  const allStats = getVehicleStatsFromStorage()
  const globalCounts = {}
  let totalRecords = 0
  let spotsWithData = 0

  for (const spotId of Object.keys(allStats)) {
    const spotStats = allStats[spotId]
    spotsWithData++

    for (const [type, count] of Object.entries(spotStats)) {
      if (type !== 'lastUpdated' && typeof count === 'number') {
        globalCounts[type] = (globalCounts[type] || 0) + count
        totalRecords += count
      }
    }
  }

  // Calculate percentages
  const percentages = {}
  for (const [type, count] of Object.entries(globalCounts)) {
    percentages[type] = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
  }

  // Find most common
  let mostCommon = null
  let maxCount = 0
  for (const [type, count] of Object.entries(globalCounts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = type
    }
  }

  return {
    totalRecords,
    spotsWithData,
    types: globalCounts,
    percentages,
    mostCommon,
  }
}

/**
 * Bulk record multiple vehicle observations
 * @param {string|number} spotId - The spot ID
 * @param {Array<string>} types - Array of vehicle type IDs
 * @returns {Object} Updated stats
 */
export function recordMultipleVehicleTypes(spotId, types) {
  if (!spotId || !Array.isArray(types)) return null

  for (const type of types) {
    recordVehicleType(spotId, type)
  }

  return getVehicleStats(spotId)
}

/**
 * Export vehicle stats for a spot as JSON
 * @param {string|number} spotId - The spot ID
 * @returns {string} JSON string of stats
 */
export function exportVehicleStats(spotId) {
  const stats = getVehicleStats(spotId)
  return JSON.stringify(stats, null, 2)
}

/**
 * Import vehicle stats for a spot from JSON
 * @param {string|number} spotId - The spot ID
 * @param {string|Object} data - JSON string or object
 * @returns {boolean} Success status
 */
export function importVehicleStats(spotId, data) {
  if (!spotId) return false

  try {
    const statsData = typeof data === 'string' ? JSON.parse(data) : data

    if (!statsData || typeof statsData !== 'object') {
      return false
    }

    const allStats = getVehicleStatsFromStorage()

    // Validate and import only valid vehicle types
    allStats[spotId] = {}
    for (const [type, count] of Object.entries(statsData.types || statsData)) {
      if (validVehicleTypes.includes(type) && typeof count === 'number' && count >= 0) {
        allStats[spotId][type] = count
      }
    }
    allStats[spotId].lastUpdated = new Date().toISOString()

    saveVehicleStatsToStorage(allStats)
    return true
  } catch (error) {
    console.warn('[VehicleTypes] Import failed:', error)
    return false
  }
}

/**
 * Render vehicle type selector modal content
 * @param {string|number} spotId - The spot ID
 * @returns {string} HTML string for selector
 */
export function renderVehicleTypeSelector(spotId) {
  const state = getState()
  const lang = state?.lang || 'fr'
  const types = getVehicleTypesList()

  const titleLabel = {
    fr: 'Quel type de vehicule vous a pris ?',
    en: 'What type of vehicle picked you up?',
    es: 'Que tipo de vehiculo te recogio?',
    de: 'Welcher Fahrzeugtyp hat Sie mitgenommen?',
  }

  const buttonsHtml = types.map(type => `
    <button
      class="vehicle-type-btn flex flex-col items-center justify-center p-4 bg-dark-tertiary hover:bg-primary-500/20 rounded-lg transition-colors border border-transparent hover:border-primary-500/50"
      onclick="window.recordAndCloseVehicleType?.('${spotId}', '${type.id}')"
      aria-label="${type.label}">
      <span class="text-3xl mb-2">${type.emoji}</span>
      <span class="text-sm font-medium text-white">${type.label}</span>
    </button>
  `).join('')

  return `
    <div class="vehicle-type-selector p-4">
      <h3 class="text-lg font-semibold text-white mb-4 text-center">${titleLabel[lang] || titleLabel.fr}</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${buttonsHtml}
      </div>
    </div>
  `
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.openVehicleTypeModal = (spotId) => {
    const state = getState()
    if (typeof window.setState === 'function') {
      window.setState({
        showVehicleTypeModal: true,
        vehicleTypeModalSpotId: spotId
      })
    }
    console.log(`[VehicleTypes] Opening modal for spot: ${spotId}`)
  }

  window.recordAndCloseVehicleType = (spotId, typeId) => {
    const stats = recordVehicleType(spotId, typeId)
    if (stats && typeof window.setState === 'function') {
      window.setState({ showVehicleTypeModal: false })
    }
    // Show toast notification
    if (typeof window.showToast === 'function') {
      const vehicle = vehicleTypes[typeId]
      window.showToast(`${vehicle?.emoji || '🚗'} Type enregistre !`, 'success')
    }
    console.log(`[VehicleTypes] Recorded ${typeId} for spot ${spotId}`)
    return stats
  }
}

export default {
  vehicleTypes,
  validVehicleTypes,
  getVehicleStats,
  recordVehicleType,
  getMostCommonVehicle,
  renderVehicleStats,
  getVehicleTypesList,
  getVehicleTypeInfo,
  clearVehicleStats,
  getGlobalVehicleStats,
  recordMultipleVehicleTypes,
  exportVehicleStats,
  importVehicleStats,
  renderVehicleTypeSelector,
}
