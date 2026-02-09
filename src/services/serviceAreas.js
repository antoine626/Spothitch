/**
 * Service Areas Service
 * Loads and displays gas stations / rest areas on the map
 * Source: Hitchmap (ODBL license)
 */

const BASE = import.meta.env.BASE_URL || '/'

let serviceAreasData = null
let serviceAreaLayer = null
let areasVisible = false

/**
 * Load service areas data
 */
export async function loadServiceAreas() {
  if (serviceAreasData) return serviceAreasData

  try {
    const response = await fetch(`${BASE}data/service-areas.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    serviceAreasData = await response.json()
    console.log(`⛽ Loaded ${serviceAreasData.totalAreas} service areas`)
    return serviceAreasData
  } catch (error) {
    console.warn('Failed to load service areas:', error)
    return null
  }
}

/**
 * Add service areas to map
 * @param {object} map - Leaflet map instance
 * @param {object} L - Leaflet library
 */
export async function addServiceAreasToMap(map, L) {
  if (!map || !L) return

  const data = await loadServiceAreas()
  if (!data || !data.areas) return

  // Remove existing layer
  if (serviceAreaLayer) {
    map.removeLayer(serviceAreaLayer)
  }

  serviceAreaLayer = L.layerGroup()

  const gasIcon = L.divIcon({
    className: 'service-area-marker',
    html: `<div class="w-6 h-6 rounded-full bg-emerald-500/80 flex items-center justify-center text-white text-xs shadow-md border border-emerald-300/50">⛽</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  // Only show areas visible in current bounds
  const bounds = map.getBounds()
  const visibleAreas = data.areas.filter(a =>
    a.lat >= bounds.getSouth() - 1 &&
    a.lat <= bounds.getNorth() + 1 &&
    a.lon >= bounds.getWest() - 1 &&
    a.lon <= bounds.getEast() + 1
  )

  visibleAreas.forEach(area => {
    const marker = L.marker([area.lat, area.lon], { icon: gasIcon })
    if (area.name) {
      marker.bindTooltip(area.name, { direction: 'top', offset: [0, -10] })
    }
    marker.bindPopup(`
      <div class="p-2 min-w-[150px]">
        <div class="font-bold text-gray-900">⛽ ${area.name || 'Aire de service'}</div>
        <div class="text-xs text-gray-500 mt-1">Source: Hitchwiki (ODBL)</div>
      </div>
    `)
    serviceAreaLayer.addLayer(marker)
  })

  if (areasVisible) {
    serviceAreaLayer.addTo(map)
  }

  return serviceAreaLayer
}

/**
 * Toggle service areas visibility
 */
export function toggleServiceAreas(map) {
  if (!map || !serviceAreaLayer) return false

  areasVisible = !areasVisible

  if (areasVisible) {
    serviceAreaLayer.addTo(map)
  } else {
    map.removeLayer(serviceAreaLayer)
  }

  // Save preference
  try {
    localStorage.setItem('spothitch_show_service_areas', JSON.stringify(areasVisible))
  } catch (e) { /* ignore */ }

  return areasVisible
}

/**
 * Check if areas are currently visible
 */
export function areServiceAreasVisible() {
  return areasVisible
}

/**
 * Initialize visibility from saved preference
 */
export function initServiceAreasPreference() {
  try {
    const saved = localStorage.getItem('spothitch_show_service_areas')
    if (saved !== null) {
      areasVisible = JSON.parse(saved)
    }
  } catch (e) { /* ignore */ }
  return areasVisible
}

/**
 * Clean up service areas layer
 */
export function destroyServiceAreas() {
  if (serviceAreaLayer) {
    serviceAreaLayer = null
  }
}

export default {
  loadServiceAreas,
  addServiceAreasToMap,
  toggleServiceAreas,
  areServiceAreasVisible,
  initServiceAreasPreference,
  destroyServiceAreas,
}
