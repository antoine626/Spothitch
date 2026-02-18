/**
 * Map Service
 * MapLibre GL JS map initialization and utilities
 */

import { getState } from '../stores/state.js'
import { sampleSpots } from '../data/spots.js'
import { loadSpotsInBounds, getAllLoadedSpots } from './spotLoader.js'
import { getFilteredSpots } from '../components/modals/Filters.js'
import { getFreshnessColor } from './spotFreshness.js'

// Map instances
let mainMap = null
let plannerMap = null
let tripDetailMap = null
let mapInitializing = false
let loadedSpotIds = new Set()

// Default center (World) — MapLibre uses [lng, lat]
const DEFAULT_CENTER = [10, 30]
const DEFAULT_ZOOM = 3

// OpenFreeMap style URLs (free, no API key)
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/liberty'
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty'

/**
 * Get map style URL based on theme
 */
export function getMapStyleUrl(theme = 'dark') {
  return theme === 'light' ? STYLE_LIGHT : STYLE_DARK
}

/**
 * Add Leaflet-compatible methods to a MapLibre map instance.
 * This avoids changing call sites in Map.js, main.js, PullToRefresh.js.
 */
function addCompatMethods(map) {
  // setView([lat, lng], zoom) → flyTo
  map.setView = function (latLng, zoom) {
    const lat = Array.isArray(latLng) ? latLng[0] : latLng.lat
    const lng = Array.isArray(latLng) ? latLng[1] : latLng.lng
    this.flyTo({ center: [lng, lat], zoom, duration: 800 })
  }
  // invalidateSize → resize
  map.invalidateSize = function () {
    this.resize()
  }
  return map
}

/**
 * Convert spots array to GeoJSON FeatureCollection
 */
function spotsToGeoJSON(spots) {
  const features = []
  for (const spot of spots) {
    const lat = spot.coordinates?.lat || spot.lat
    const lng = spot.coordinates?.lng || spot.lng
    if (!lat || !lng) continue
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        id: spot.id,
        from: spot.from || '',
        to: spot.to || '',
        rating: spot.globalRating || 0,
        source: spot.source || 'user',
        color: getFreshnessColor(spot),
        verified: spot.verified || false,
      },
    })
  }
  return { type: 'FeatureCollection', features }
}

/**
 * Add spots as a clustered GeoJSON source + layers to a map
 */
function addSpotLayers(map, geojson) {
  // Source with clustering
  map.addSource('spots', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  })

  // Cluster circles
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'spots',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': 'rgba(245, 158, 11, 0.85)',
      'circle-radius': [
        'step', ['get', 'point_count'],
        18,   // radius for count < 20
        20, 21, // radius for count < 100
        100, 24, // radius for count >= 100
      ],
      'circle-stroke-color': 'rgba(255, 255, 255, 0.6)',
      'circle-stroke-width': 2,
    },
  })

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'spots',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  // Individual spot dots (unclustered)
  map.addLayer({
    id: 'spot-points',
    type: 'circle',
    source: 'spots',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': [
        'case',
        ['==', ['get', 'source'], 'hitchwiki'], 5,
        7,
      ],
      'circle-stroke-color': 'rgba(255, 255, 255, 0.7)',
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'source'], 'hitchwiki'], 1,
        2,
      ],
      'circle-opacity': 0.85,
    },
  })

  // Click on individual spot → open detail
  map.on('click', 'spot-points', (e) => {
    if (!e.features || e.features.length === 0) return
    const spotId = e.features[0].properties.id
    window.selectSpot?.(spotId)
  })

  // Click on cluster → zoom in
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    if (!features.length) return
    const clusterId = features[0].properties.cluster_id
    map.getSource('spots').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom,
      })
    })
  })

  // Pointer cursor on interactive layers
  map.on('mouseenter', 'spot-points', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'spot-points', () => { map.getCanvas().style.cursor = '' })
  map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
}

/**
 * Initialize main spots map
 */
export async function initMap(containerId = 'map') {
  const mapContainer = document.getElementById(containerId)
  if (!mapContainer) return null

  if (mapInitializing) return null

  // If map already exists and its container is still in the DOM, just resize
  if (mainMap) {
    try {
      const existingContainer = mainMap.getContainer()
      if (existingContainer && document.body.contains(existingContainer)) {
        mainMap.resize()
        return mainMap
      }
      mainMap.remove()
    } catch (e) {
      // ignore
    }
    mainMap = null
    loadedSpotIds = new Set()
    window.spotHitchMap = null
  }

  mapContainer.innerHTML = ''
  mapInitializing = true

  try {
    const maplibregl = (await import('maplibre-gl')).default || (await import('maplibre-gl'))

    const state = getState()
    const center = state.userLocation
      ? [state.userLocation.lng, state.userLocation.lat]
      : DEFAULT_CENTER

    mainMap = new maplibregl.Map({
      container: containerId,
      style: getMapStyleUrl(state.theme),
      center,
      zoom: state.userLocation ? 13 : DEFAULT_ZOOM,
      attributionControl: true,
    })

    addCompatMethods(mainMap)

    mainMap.on('load', () => {
      // Add spots
      const allSpots = state.spots || sampleSpots
      const filteredSpots = getFilteredSpots(allSpots, state)
      const geojson = spotsToGeoJSON(filteredSpots)
      addSpotLayers(mainMap, geojson)
      filteredSpots.forEach(s => loadedSpotIds.add(s.id))

      // Add friend location layer
      addFriendLayers(mainMap)
      const friendsLocs = state.friendsLocations || []
      if (friendsLocs.length > 0) {
        updateFriendMarkers(friendsLocs)
      }

      // Load dynamic spots
      loadDynamicSpots(mainMap)

      // Reload spots on map move
      let moveTimeout = null
      mainMap.on('moveend', () => {
        clearTimeout(moveTimeout)
        moveTimeout = setTimeout(() => loadDynamicSpots(mainMap), 500)
      })
    })

    // User location marker
    if (state.userLocation) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50"></div>
        </div>
      `
      new maplibregl.Marker({ element: el })
        .setLngLat([state.userLocation.lng, state.userLocation.lat])
        .addTo(mainMap)
    }

    window.spotHitchMap = mainMap
    window.mapInstance = mainMap

    // Resize observer
    if (window.ResizeObserver && mapContainer) {
      const resizeObserver = new ResizeObserver(() => {
        if (mainMap) mainMap.resize()
      })
      resizeObserver.observe(mapContainer)
      mainMap._resizeObserver = resizeObserver
    }

    mapInitializing = false
    return mainMap
  } catch (error) {
    console.error('Map initialization failed:', error)
    mapInitializing = false
    displayFallbackSpots(mapContainer)
    return null
  }
}

/**
 * Initialize planner map
 */
export async function initPlannerMap() {
  const mapContainer = document.getElementById('planner-map')
  if (!mapContainer) return null

  if (plannerMap) {
    try {
      if (plannerMap.getContainer() === mapContainer) {
        plannerMap.resize()
        return plannerMap
      }
      plannerMap.remove()
    } catch (e) {
      // ignore
    }
    plannerMap = null
  }

  try {
    const maplibregl = (await import('maplibre-gl')).default || (await import('maplibre-gl'))

    plannerMap = new maplibregl.Map({
      container: 'planner-map',
      style: STYLE_DARK,
      center: DEFAULT_CENTER,
      zoom: 4,
    })

    addCompatMethods(plannerMap)
    return plannerMap
  } catch (error) {
    console.error('Planner map initialization failed:', error)
    return null
  }
}

/**
 * Initialize saved trip detail map
 */
export async function initSavedTripMap(tripId) {
  const mapContainer = document.getElementById('trip-detail-map')
  if (!mapContainer) return null

  if (tripDetailMap) {
    try { tripDetailMap.remove() } catch (e) { /* ignore */ }
    tripDetailMap = null
  }

  try {
    const maplibregl = (await import('maplibre-gl')).default || (await import('maplibre-gl'))
    const { getTripById } = await import('./planner.js')

    const trip = getTripById(tripId)
    if (!trip) return null

    tripDetailMap = new maplibregl.Map({
      container: 'trip-detail-map',
      style: STYLE_DARK,
      center: DEFAULT_CENTER,
      zoom: 5,
    })

    addCompatMethods(tripDetailMap)

    tripDetailMap.on('load', () => {
      // Draw route
      if (trip.route?.geometry) {
        drawRouteOnMap(tripDetailMap, trip.route.geometry)
      }

      // Step markers
      trip.steps.forEach((step, index) => {
        const isFirst = index === 0
        const isLast = index === trip.steps.length - 1

        const el = document.createElement('div')
        el.innerHTML = `<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-primary-500'} text-white shadow-lg">
                   ${isFirst ? '🚀' : isLast ? '🏁' : index}
                 </div>`
        new maplibregl.Marker({ element: el })
          .setLngLat([step.lng, step.lat])
          .addTo(tripDetailMap)
      })

      // Fit bounds
      if (trip.steps.length >= 2) {
        const coords = trip.steps.map(s => [s.lng, s.lat])
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        )
        tripDetailMap.fitBounds(bounds, { padding: 30 })
      }
    })

    return tripDetailMap
  } catch (error) {
    console.error('Trip map initialization failed:', error)
    return null
  }
}

/**
 * Draw route on a MapLibre map (GeoJSON line layer)
 * @param {Object} map - MapLibre map instance
 * @param {Array} routeCoords - coords in [lng, lat] from OSRM
 */
function drawRouteOnMap(map, routeCoords) {
  if (!map || !routeCoords) return

  // Remove existing route source/layer
  if (map.getLayer('route-line')) map.removeLayer('route-line')
  if (map.getSource('route')) map.removeSource('route')

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoords, // already [lng, lat] from OSRM
      },
    },
  })

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#f59e0b',
      'line-width': 4,
      'line-opacity': 0.8,
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  })
}

/**
 * Draw route on map (public API — compat with existing callers)
 * @param {Object} map - MapLibre map instance
 * @param {Object} _unused - was L (Leaflet), now unused
 * @param {Array} routeCoords - [lng, lat] from OSRM
 */
export function drawRoute(map, _unused, routeCoords) {
  if (!map) return
  // Ensure map is loaded before adding layers
  if (map.isStyleLoaded()) {
    drawRouteOnMap(map, routeCoords)
  } else {
    map.on('load', () => drawRouteOnMap(map, routeCoords))
  }
}

/**
 * Load dynamic spots from Hitchmap data based on current map bounds
 */
async function loadDynamicSpots(map) {
  if (!map) return

  try {
    const mapBounds = map.getBounds()
    const bounds = {
      north: mapBounds.getNorth(),
      south: mapBounds.getSouth(),
      east: mapBounds.getEast(),
      west: mapBounds.getWest(),
    }

    const spots = await loadSpotsInBounds(bounds)
    if (!spots || spots.length === 0) return

    const newSpots = spots.filter(s => !loadedSpotIds.has(s.id))
    if (newSpots.length === 0) return

    newSpots.forEach(s => loadedSpotIds.add(s.id))

    // Update existing spots source with all loaded spots
    const source = map.getSource('spots')
    if (source) {
      const allSpots = getAllLoadedSpots()
      source.setData(spotsToGeoJSON(allSpots))
    }

    // Update spot count in UI
    const countEl = document.querySelector('[aria-live="polite"] .text-primary-400')
    if (countEl) {
      countEl.textContent = loadedSpotIds.size
    }
  } catch (error) {
    // silently fail — spots will load on next move
  }
}

/**
 * Add friend location markers layer to the map
 */
function addFriendLayers(map) {
  map.addSource('friends', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  map.addLayer({
    id: 'friend-markers',
    type: 'circle',
    source: 'friends',
    paint: {
      'circle-color': '#10b981',
      'circle-radius': 12,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
    },
  })

  map.addLayer({
    id: 'friend-labels',
    type: 'symbol',
    source: 'friends',
    layout: {
      'text-field': ['get', 'avatar'],
      'text-size': 16,
      'text-offset': [0, 0],
      'text-allow-overlap': true,
    },
  })

  map.on('click', 'friend-markers', (e) => {
    if (!e.features?.length) return
    const userId = e.features[0].properties.userId
    window.showFriendProfile?.(userId)
  })

  map.on('mouseenter', 'friend-markers', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'friend-markers', () => { map.getCanvas().style.cursor = '' })
}

/**
 * Update friends GeoJSON data on the map
 */
export function updateFriendMarkers(friendsLocations) {
  if (!mainMap) return
  const source = mainMap.getSource('friends')
  if (!source) return

  const features = (friendsLocations || [])
    .filter(f => f.lat && f.lng)
    .map(f => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
      properties: {
        userId: f.userId,
        username: f.username || '',
        avatar: f.avatar || '🤙',
      },
    }))

  source.setData({ type: 'FeatureCollection', features })
}

/**
 * Toggle friends visibility on the map
 */
export function toggleFriendsOnMap(visible) {
  if (!mainMap) return
  const v = visible ? 'visible' : 'none'
  if (mainMap.getLayer('friend-markers')) mainMap.setLayoutProperty('friend-markers', 'visibility', v)
  if (mainMap.getLayer('friend-labels')) mainMap.setLayoutProperty('friend-labels', 'visibility', v)
}

/**
 * Display fallback spots (when map fails to load)
 */
export function displayFallbackSpots(container) {
  if (!container) return

  const spots = getState().spots || sampleSpots

  container.innerHTML = `
    <div class="fallback-spots p-4 bg-white/5 rounded-xl text-center">
      <p class="text-slate-400 mb-4">Carte non disponible</p>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        ${spots.slice(0, 10).map(spot => `
          <div class="flex items-center gap-2 p-2 bg-white/10 rounded-xl cursor-pointer"
               onclick="selectSpot(${spot.id})">
            <span>📍</span>
            <span class="text-white text-sm truncate">${spot.from} → ${spot.to}</span>
            <span class="text-amber-400 text-xs ml-auto">⭐${spot.globalRating?.toFixed(1) || 'N/A'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

/**
 * Update map theme (switch OpenFreeMap style)
 */
export async function updateMapTheme(theme) {
  if (!mainMap) return
  mainMap.setStyle(getMapStyleUrl(theme))

  // Re-add layers after style change (style change removes all layers)
  mainMap.once('style.load', () => {
    const allSpots = getAllLoadedSpots()
    if (allSpots.length > 0) {
      addSpotLayers(mainMap, spotsToGeoJSON(allSpots))
    }
    addFriendLayers(mainMap)
    const friendsLocs = getState().friendsLocations || []
    if (friendsLocs.length > 0) {
      updateFriendMarkers(friendsLocs)
    }
  })
}

/**
 * Center map on user location
 */
export function centerOnUser() {
  const state = getState()
  if (mainMap && state.userLocation) {
    mainMap.flyTo({
      center: [state.userLocation.lng, state.userLocation.lat],
      zoom: 12,
      duration: 800,
    })
  }
}

/**
 * Center map on spot
 */
export function centerOnSpot(spot) {
  if (mainMap && spot?.coordinates) {
    mainMap.flyTo({
      center: [spot.coordinates.lng, spot.coordinates.lat],
      zoom: 14,
      duration: 800,
    })
  }
}

/**
 * Destroy map instances (cleanup to prevent memory leaks)
 */
export function destroyMaps() {
  if (mainMap) {
    try {
      if (mainMap._resizeObserver) mainMap._resizeObserver.disconnect()
      mainMap.remove()
    } catch (e) { /* ignore */ }
    mainMap = null
  }
  if (plannerMap) {
    try { plannerMap.remove() } catch (e) { /* ignore */ }
    plannerMap = null
  }
  if (tripDetailMap) {
    try { tripDetailMap.remove() } catch (e) { /* ignore */ }
    tripDetailMap = null
  }
  window.spotHitchMap = null
  window.mapInstance = null
  mapInitializing = false
  loadedSpotIds = new Set()
}

/**
 * Initialize map service (alias for initMap with 'main-map' container)
 */
export async function initMapService(state) {
  return initMap('main-map')
}

// Re-export tile URL getter with old name for compatibility
export function getMapTileUrl(theme) {
  return getMapStyleUrl(theme)
}

export function getMapAttribution() {
  return '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | Data from <a href="https://hitchwiki.org">Hitchwiki</a> (ODBL)'
}

export default {
  initMap,
  initMapService,
  initPlannerMap,
  initSavedTripMap,
  drawRoute,
  displayFallbackSpots,
  getMapTileUrl,
  getMapStyleUrl,
  getMapAttribution,
  updateMapTheme,
  centerOnUser,
  centerOnSpot,
  destroyMaps,
  updateFriendMarkers,
  toggleFriendsOnMap,
}
