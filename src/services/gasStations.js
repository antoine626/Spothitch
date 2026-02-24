/**
 * Gas Stations Service
 * Fetches fuel stations along a route using Overpass API (OpenStreetMap)
 */

import { getState, setState } from '../stores/state.js'
import { t } from '../i18n/index.js'

const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

/**
 * Fetch gas stations along a route geometry
 * @param {Array} routeCoords - Array of [lng, lat] from OSRM
 * @param {number} bufferKm - Search buffer in km (default 2km)
 * @returns {Array} Array of {lat, lng, name, brand}
 */
export async function fetchGasStationsAlongRoute(routeCoords, bufferKm = 2) {
  if (!routeCoords || routeCoords.length < 2) return []

  // Sample every ~20 points to build a reasonable bounding polygon
  const step = Math.max(1, Math.floor(routeCoords.length / 20))
  const sampled = []
  for (let i = 0; i < routeCoords.length; i += step) {
    sampled.push(routeCoords[i])
  }
  // Always include last point
  if (sampled[sampled.length - 1] !== routeCoords[routeCoords.length - 1]) {
    sampled.push(routeCoords[routeCoords.length - 1])
  }

  // Build bounding box from sampled points
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  sampled.forEach(([lng, lat]) => {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  })

  // Expand bbox by buffer
  const bufferDeg = bufferKm / 111 // ~111km per degree
  minLat -= bufferDeg
  maxLat += bufferDeg
  minLng -= bufferDeg
  maxLng += bufferDeg

  // Overpass query for fuel stations in bbox
  const query = `[out:json][timeout:10];
    node["amenity"="fuel"](${minLat},${minLng},${maxLat},${maxLng});
    out body;`

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!response.ok) return []
    const data = await response.json()

    // Filter stations that are actually near the route (within bufferKm)
    const stations = (data.elements || [])
      .filter(el => el.lat && el.lon)
      .map(el => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.name || el.tags?.brand || t('gasStation') || 'Station-service',
        brand: el.tags?.brand || '',
        fuel_types: el.tags?.['fuel:diesel'] === 'yes' ? 'Diesel' : '',
        opening_hours: el.tags?.opening_hours || '',
      }))
      .filter(station => isNearRoute(station, routeCoords, bufferKm))

    return stations
  } catch (error) {
    // Silently fail — gas stations are a nice-to-have
    return []
  }
}

/**
 * Check if a point is near a route (simplified — checks distance to nearest route segment)
 */
function isNearRoute(point, routeCoords, maxDistKm) {
  const step = Math.max(1, Math.floor(routeCoords.length / 50))
  for (let i = 0; i < routeCoords.length; i += step) {
    const [lng, lat] = routeCoords[i]
    const dist = haversineKm(point.lat, point.lng, lat, lng)
    if (dist <= maxDistKm) return true
  }
  return false
}

/**
 * Haversine distance in km
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Fetch gas stations in map viewport
 * @param {Object} bounds - { north, south, east, west }
 * @returns {Promise<Array>} stations
 */
export async function fetchGasStationsInBounds(bounds) {
  if (!bounds) return []

  const query = `[out:json][timeout:10];
    node["amenity"="fuel"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    out body;`

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!response.ok) return []
    const data = await response.json()

    return (data.elements || [])
      .filter(el => el.lat && el.lon)
      .map(el => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.name || el.tags?.brand || t('gasStation') || 'Station-service',
        brand: el.tags?.brand || '',
      }))
  } catch {
    return []
  }
}

/**
 * Toggle gas stations visibility on map
 */
export function toggleGasStations() {
  const state = getState()
  const show = !state.showGasStationsOnMap
  setState({ showGasStationsOnMap: show })

  if (show) {
    // Get current map bounds
    const map = window.homeMapInstance || window.mapInstance
    if (!map) {
      setState({ showGasStationsOnMap: false })
      return
    }

    // Check zoom level — require zoom >= 6 to avoid too many results
    const zoom = map.getZoom?.() || 0
    if (zoom < 6) {
      import('../services/notifications.js').then(n => n.showToast(
        t('zoomInForStations') || 'Zoome pour voir les stations-service',
        'info'
      ))
      setState({ showGasStationsOnMap: false })
      return
    }

    // Show loading feedback
    import('../services/notifications.js').then(n => n.showToast(
      t('loadingStations') || 'Chargement des stations...',
      'info'
    ))

    const bounds = map.getBounds?.()
    if (bounds) {
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      fetchGasStationsInBounds({
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng,
      }).then(stations => {
        setState({ gasStations: stations })
        showGasStationMarkers(stations)
        if (stations.length === 0) {
          import('../services/notifications.js').then(n => n.showToast(
            t('noStationsFound') || 'Aucune station trouvée, zoome plus',
            'info'
          ))
        }
      }).catch(() => {
        import('../services/notifications.js').then(n => n.showToast(
          t('stationsError') || 'Erreur de chargement des stations',
          'error'
        ))
        setState({ showGasStationsOnMap: false })
      })
    }
  } else {
    hideGasStationMarkers()
    setState({ gasStations: [] })
  }
}

/**
 * Show gas station markers on the home map
 */
function showGasStationMarkers(stations) {
  const map = window.homeMapInstance || window.mapInstance
  if (!map || !stations?.length) return

  // Remove existing gas station layer
  if (map.getLayer('gas-stations')) map.removeLayer('gas-stations')
  if (map.getSource('gas-stations')) map.removeSource('gas-stations')

  const features = stations.map(s => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    properties: { name: s.name, brand: s.brand },
  }))

  map.addSource('gas-stations', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  })

  map.addLayer({
    id: 'gas-stations',
    type: 'circle',
    source: 'gas-stations',
    paint: {
      'circle-color': '#ef4444',
      'circle-radius': 6,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
    },
  })

  // Click handler for gas station popup
  map.on('click', 'gas-stations', (e) => {
    if (!e.features?.length) return
    const props = e.features[0].properties
    const coords = e.features[0].geometry.coordinates
    import('maplibre-gl').then((mod) => {
      const maplibregl = mod.default || mod
      new maplibregl.Popup({ offset: 10, className: 'gas-popup' })
        .setLngLat(coords)
        .setHTML(`<div class="p-2 text-sm"><strong>${props.name}</strong>${props.brand ? `<br>${props.brand}` : ''}</div>`)
        .addTo(map)
    })
  })
  map.on('mouseenter', 'gas-stations', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'gas-stations', () => { map.getCanvas().style.cursor = '' })
}

/**
 * Hide gas station markers from map
 */
function hideGasStationMarkers() {
  const map = window.homeMapInstance || window.mapInstance
  if (!map) return
  if (map.getLayer('gas-stations')) map.removeLayer('gas-stations')
  if (map.getSource('gas-stations')) map.removeSource('gas-stations')
}

// Global handlers
window.toggleGasStations = toggleGasStations

export default { fetchGasStationsAlongRoute, toggleGasStations }
