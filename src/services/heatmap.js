/**
 * Heatmap Service
 * Display popular hitchhiking zones on the map
 * Uses MapLibre GL native heatmap layer
 */

import { getState } from '../stores/state.js'

// Heatmap configuration
const HEATMAP_CONFIG = {
  maxZoom: 17,
  minOpacity: 0.3,
}


/**
 * Generate heatmap GeoJSON from spots
 * @param {Array} spots - Array of spot objects
 * @returns {Object} GeoJSON FeatureCollection
 */
export function generateHeatmapData(spots) {
  if (!spots || !spots.length) return { type: 'FeatureCollection', features: [] }

  const features = []

  for (const spot of spots) {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) continue

    const intensity = calculateSpotIntensity(spot)

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [spot.coordinates.lng, spot.coordinates.lat],
      },
      properties: {
        intensity,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

/**
 * Calculate spot intensity for heatmap
 */
function calculateSpotIntensity(spot) {
  let intensity = 0.3

  if (spot.globalRating) {
    intensity += (spot.globalRating / 5) * 0.3
  }

  if (spot.checkins) {
    intensity += Math.min(spot.checkins / 100, 0.2)
  }

  if (spot.totalReviews) {
    intensity += Math.min(spot.totalReviews / 50, 0.1)
  }

  if (spot.lastUsed) {
    const daysSinceUse = (Date.now() - new Date(spot.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUse < 7) {
      intensity += 0.1
    } else if (daysSinceUse < 30) {
      intensity += 0.05
    }
  }

  return Math.min(intensity, 1.0)
}

/**
 * Initialize heatmap on a MapLibre map
 * @param {Object} map - MapLibre map instance
 * @param {Array} spots - Spots data
 */
export function initHeatmap(map, spots) {
  if (!map) return null

  // Remove existing heatmap layers/sources
  removeHeatmap(map)

  const geojson = generateHeatmapData(spots)
  if (geojson.features.length === 0) return null

  // Add heatmap source
  map.addSource('heatmap-source', {
    type: 'geojson',
    data: geojson,
  })

  // Add native heatmap layer
  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap-source',
    maxzoom: HEATMAP_CONFIG.maxZoom,
    paint: {
      // Weight based on intensity property
      'heatmap-weight': ['get', 'intensity'],
      // Increase intensity as zoom level increases
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        0, 1,
        9, 3,
      ],
      // Color ramp for heatmap
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0, 255, 0, 0)',
        0.25, 'rgba(127, 255, 0, 0.6)',
        0.5, 'rgba(255, 255, 0, 0.7)',
        0.75, 'rgba(255, 127, 0, 0.8)',
        1, 'rgba(255, 0, 0, 0.9)',
      ],
      // Radius increases with zoom
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        0, 2,
        9, 20,
        14, 30,
      ],
      // Opacity
      'heatmap-opacity': HEATMAP_CONFIG.minOpacity,
    },
  })

  return true
}

/**
 * Update heatmap with new data
 */
export function updateHeatmap(map, spots) {
  if (!map) return
  removeHeatmap(map)
  initHeatmap(map, spots)
}

/**
 * Toggle heatmap visibility
 */
export function toggleHeatmap(map, visible) {
  if (!map) return

  if (map.getLayer('heatmap-layer')) {
    map.setLayoutProperty('heatmap-layer', 'visibility', visible ? 'visible' : 'none')
  } else if (visible) {
    // Heatmap not yet created, initialize it
    const state = getState()
    if (state.spots?.length) {
      initHeatmap(map, state.spots)
    }
  }
}

/**
 * Remove heatmap from map
 */
export function removeHeatmap(map) {
  if (!map) return
  if (map.getLayer('heatmap-layer')) map.removeLayer('heatmap-layer')
  if (map.getSource('heatmap-source')) map.removeSource('heatmap-source')
}

/**
 * Get hotspot zones (areas with high concentration)
 */
export function getHotspotZones(spots) {
  if (!spots || spots.length < 5) return []

  const grid = {}
  const gridSize = 0.5

  for (const spot of spots) {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) continue

    const gridKey = `${Math.floor(spot.coordinates.lat / gridSize)}_${Math.floor(spot.coordinates.lng / gridSize)}`

    if (!grid[gridKey]) {
      grid[gridKey] = {
        spots: [],
        center: { lat: 0, lng: 0 },
        totalRating: 0,
        totalCheckins: 0,
      }
    }

    grid[gridKey].spots.push(spot)
    grid[gridKey].totalRating += spot.globalRating || 0
    grid[gridKey].totalCheckins += spot.checkins || 0
  }

  const zones = Object.entries(grid)
    .filter(([, data]) => data.spots.length >= 3)
    .map(([key, data]) => {
      const lats = data.spots.map(s => s.coordinates.lat)
      const lngs = data.spots.map(s => s.coordinates.lng)

      return {
        id: key,
        center: {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        },
        spotCount: data.spots.length,
        avgRating: data.totalRating / data.spots.length,
        totalCheckins: data.totalCheckins,
        intensity: Math.min(data.spots.length / 10, 1),
      }
    })
    .sort((a, b) => b.spotCount - a.spotCount)

  return zones.slice(0, 10)
}

/**
 * Render heatmap legend
 */
export function renderHeatmapLegend() {
  return `
    <div class="heatmap-legend absolute bottom-20 left-4 z-[400] bg-dark-card/90 backdrop-blur rounded-xl p-3 shadow-lg">
      <div class="text-xs font-medium text-slate-400 mb-2">Activité</div>
      <div class="flex items-center gap-1">
        <div class="w-4 h-4 rounded" style="background: #00ff00;"></div>
        <div class="w-4 h-4 rounded" style="background: #7fff00;"></div>
        <div class="w-4 h-4 rounded" style="background: #ffff00;"></div>
        <div class="w-4 h-4 rounded" style="background: #ff7f00;"></div>
        <div class="w-4 h-4 rounded" style="background: #ff0000;"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>Faible</span>
        <span>Élevée</span>
      </div>
    </div>
  `
}

// Global handlers
window.toggleHeatmap = (visible) => {
  if (window.mainMap) {
    toggleHeatmap(window.mainMap, visible)
  }
}

export default {
  generateHeatmapData,
  initHeatmap,
  updateHeatmap,
  toggleHeatmap,
  removeHeatmap,
  getHotspotZones,
  renderHeatmapLegend,
}
