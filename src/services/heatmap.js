/**
 * Heatmap Service
 * Display popular hitchhiking zones on the map
 */

import { getState } from '../stores/state.js';

// Heatmap configuration
const HEATMAP_CONFIG = {
  radius: 25,
  blur: 15,
  maxZoom: 17,
  minOpacity: 0.3,
  gradient: {
    0.0: '#00ff00',  // Green - low activity
    0.25: '#7fff00',
    0.5: '#ffff00', // Yellow - medium
    0.75: '#ff7f00', // Orange - high
    1.0: '#ff0000',  // Red - hot spot
  },
};

// Store heatmap layer reference
let heatmapLayer = null;

/**
 * Generate heatmap data from spots
 * @param {Array} spots - Array of spot objects
 * @returns {Array} Array of [lat, lng, intensity] points
 */
export function generateHeatmapData(spots) {
  if (!spots || !spots.length) return [];

  const points = [];

  for (const spot of spots) {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) continue;

    // Calculate intensity based on multiple factors
    const intensity = calculateSpotIntensity(spot);

    points.push([
      spot.coordinates.lat,
      spot.coordinates.lng,
      intensity,
    ]);
  }

  return points;
}

/**
 * Calculate spot intensity for heatmap
 * Higher intensity = more popular/active spot
 */
function calculateSpotIntensity(spot) {
  let intensity = 0.3; // Base intensity

  // Rating contributes to intensity (max 0.3)
  if (spot.globalRating) {
    intensity += (spot.globalRating / 5) * 0.3;
  }

  // Check-ins contribute (max 0.2)
  if (spot.checkins) {
    intensity += Math.min(spot.checkins / 100, 0.2);
  }

  // Reviews contribute (max 0.1)
  if (spot.totalReviews) {
    intensity += Math.min(spot.totalReviews / 50, 0.1);
  }

  // Recent activity bonus (max 0.1)
  if (spot.lastUsed) {
    const daysSinceUse = (Date.now() - new Date(spot.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUse < 7) {
      intensity += 0.1;
    } else if (daysSinceUse < 30) {
      intensity += 0.05;
    }
  }

  return Math.min(intensity, 1.0);
}

/**
 * Initialize heatmap on a Leaflet map
 * @param {Object} map - Leaflet map instance
 * @param {Array} spots - Spots data
 */
export function initHeatmap(map, spots) {
  if (!map || !window.L) return null;

  // Check if Leaflet.heat is available
  if (!window.L.heatLayer) {
    console.warn('Leaflet.heat not available, using fallback circles');
    return initFallbackHeatmap(map, spots);
  }

  // Remove existing heatmap
  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
  }

  // Generate data
  const heatData = generateHeatmapData(spots);

  if (heatData.length === 0) return null;

  // Create heatmap layer
  heatmapLayer = window.L.heatLayer(heatData, {
    radius: HEATMAP_CONFIG.radius,
    blur: HEATMAP_CONFIG.blur,
    maxZoom: HEATMAP_CONFIG.maxZoom,
    minOpacity: HEATMAP_CONFIG.minOpacity,
    gradient: HEATMAP_CONFIG.gradient,
  });

  heatmapLayer.addTo(map);

  return heatmapLayer;
}

/**
 * Fallback heatmap using circles (when Leaflet.heat is not available)
 */
function initFallbackHeatmap(map, spots) {
  if (!map || !spots) return null;

  const circleGroup = window.L.layerGroup();

  for (const spot of spots) {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) continue;

    const intensity = calculateSpotIntensity(spot);
    const color = getColorForIntensity(intensity);

    const circle = window.L.circle([spot.coordinates.lat, spot.coordinates.lng], {
      radius: 500 + (intensity * 1500), // 500-2000m radius
      fillColor: color,
      fillOpacity: 0.3,
      stroke: false,
      className: 'heatmap-circle',
    });

    circleGroup.addLayer(circle);
  }

  circleGroup.addTo(map);
  heatmapLayer = circleGroup;

  return circleGroup;
}

/**
 * Get color for intensity value
 */
function getColorForIntensity(intensity) {
  if (intensity < 0.25) return '#00ff00';
  if (intensity < 0.5) return '#7fff00';
  if (intensity < 0.75) return '#ffff00';
  if (intensity < 0.9) return '#ff7f00';
  return '#ff0000';
}

/**
 * Update heatmap with new data
 */
export function updateHeatmap(map, spots) {
  if (!map) return;

  // Remove existing
  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
    heatmapLayer = null;
  }

  // Reinitialize
  initHeatmap(map, spots);
}

/**
 * Toggle heatmap visibility
 */
export function toggleHeatmap(map, visible) {
  if (!map || !heatmapLayer) return;

  if (visible) {
    map.addLayer(heatmapLayer);
  } else {
    map.removeLayer(heatmapLayer);
  }
}

/**
 * Remove heatmap from map
 */
export function removeHeatmap(map) {
  if (map && heatmapLayer) {
    map.removeLayer(heatmapLayer);
    heatmapLayer = null;
  }
}

/**
 * Get hotspot zones (areas with high concentration)
 * @param {Array} spots
 * @returns {Array} Array of hotspot zones
 */
export function getHotspotZones(spots) {
  if (!spots || spots.length < 5) return [];

  // Group spots by approximate region (0.5 degree grid)
  const grid = {};
  const gridSize = 0.5;

  for (const spot of spots) {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) continue;

    const gridKey = `${Math.floor(spot.coordinates.lat / gridSize)}_${Math.floor(spot.coordinates.lng / gridSize)}`;

    if (!grid[gridKey]) {
      grid[gridKey] = {
        spots: [],
        center: { lat: 0, lng: 0 },
        totalRating: 0,
        totalCheckins: 0,
      };
    }

    grid[gridKey].spots.push(spot);
    grid[gridKey].totalRating += spot.globalRating || 0;
    grid[gridKey].totalCheckins += spot.checkins || 0;
  }

  // Convert to hotspot zones
  const zones = Object.entries(grid)
    .filter(([, data]) => data.spots.length >= 3) // At least 3 spots
    .map(([key, data]) => {
      // Calculate center
      const lats = data.spots.map(s => s.coordinates.lat);
      const lngs = data.spots.map(s => s.coordinates.lng);

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
      };
    })
    .sort((a, b) => b.spotCount - a.spotCount);

  return zones.slice(0, 10); // Top 10 hotspots
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
      <div class="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>Faible</span>
        <span>Élevée</span>
      </div>
    </div>
  `;
}

// Global handlers
window.toggleHeatmap = (visible) => {
  const state = getState();
  if (window.mainMap) {
    toggleHeatmap(window.mainMap, visible);
  }
};

export default {
  generateHeatmapData,
  initHeatmap,
  updateHeatmap,
  toggleHeatmap,
  removeHeatmap,
  getHotspotZones,
  renderHeatmapLegend,
};
