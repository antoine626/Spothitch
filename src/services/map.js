/**
 * Map Service
 * Leaflet map initialization and utilities
 */

import { getState } from '../stores/state.js';
import { sampleSpots } from '../data/spots.js';

// Map instances
let mainMap = null;
let plannerMap = null;
let tripDetailMap = null;
let routeLayer = null;

// Default center (Europe)
const DEFAULT_CENTER = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;

/**
 * Get map tile URL based on theme
 * @param {string} theme - 'light' or 'dark'
 */
export function getMapTileUrl(theme = 'dark') {
  const tiles = {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };
  return tiles[theme] || tiles.dark;
}

/**
 * Get map attribution
 */
export function getMapAttribution() {
  return '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | Data from <a href="https://hitchwiki.org">Hitchwiki</a> (ODBL)';
}

/**
 * Initialize main spots map
 * @param {string} containerId - Map container element ID (default: 'map')
 */
export async function initMap(containerId = 'map') {
  console.log('🗺️ initMap called for:', containerId);
  const mapContainer = document.getElementById(containerId);
  if (!mapContainer) {
    console.warn('🗺️ Map container not found:', containerId);
    return null;
  }
  console.log('🗺️ Map container found:', mapContainer);

  // Always clean up existing map first to prevent memory leaks
  if (mainMap) {
    try {
      // Check if the map container is the same
      if (mainMap.getContainer() === mapContainer) {
        mainMap.invalidateSize();
        return mainMap;
      }
      // Different container or container was replaced, destroy old map
      console.log('🗺️ Destroying old map instance');
      mainMap.remove();
    } catch (e) {
      console.warn('🗺️ Error cleaning up old map:', e);
    }
    mainMap = null;
    window.spotHitchMap = null;
  }

  // Clear container content (loading spinner)
  mapContainer.innerHTML = '';

  try {
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    // Import marker cluster
    try {
      await import('leaflet.markercluster');
      await import('leaflet.markercluster/dist/MarkerCluster.css');
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css');
    } catch (e) {
      console.warn('MarkerCluster not available');
    }

    const state = getState();
    const center = state.userLocation
      ? [state.userLocation.lat, state.userLocation.lng]
      : DEFAULT_CENTER;

    mainMap = L.default.map(containerId, {
      center,
      zoom: state.userLocation ? 10 : DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // No default zoom control - using custom buttons in Map.js view

    // Add tile layer
    L.default.tileLayer(getMapTileUrl(state.theme), {
      attribution: getMapAttribution(),
      maxZoom: 18,
    }).addTo(mainMap);

    // Add spots markers
    addSpotsToMap(mainMap, L.default, state.spots || sampleSpots);

    // Add user location marker if available
    if (state.userLocation) {
      addUserLocationMarker(mainMap, L.default, state.userLocation);
    }

    // Store reference globally (for searchLocation and other features)
    window.spotHitchMap = mainMap;
    window.mapInstance = mainMap;

    // Force resize after render to fix sizing issues (multiple attempts)
    const forceResize = () => {
      if (mainMap) {
        mainMap.invalidateSize();
      }
    };

    // Multiple resize attempts to ensure map renders correctly
    setTimeout(forceResize, 0);
    setTimeout(forceResize, 100);
    setTimeout(forceResize, 300);
    setTimeout(forceResize, 500);

    // Also use ResizeObserver for dynamic resizing
    if (window.ResizeObserver && mapContainer) {
      const resizeObserver = new ResizeObserver(() => {
        if (mainMap) {
          mainMap.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainer);

      // Store observer for cleanup
      mainMap._resizeObserver = resizeObserver;
    }

    console.log('✅ Map initialized with', (state.spots || sampleSpots).length, 'spots');
    return mainMap;
  } catch (error) {
    console.error('Map initialization failed:', error);
    displayFallbackSpots(mapContainer);
    return null;
  }
}

/**
 * Initialize planner map
 */
export async function initPlannerMap() {
  const mapContainer = document.getElementById('planner-map');
  if (!mapContainer) return null;

  // Clean up existing planner map to prevent memory leaks
  if (plannerMap) {
    try {
      if (plannerMap.getContainer() === mapContainer) {
        plannerMap.invalidateSize();
        return plannerMap;
      }
      plannerMap.remove();
    } catch (e) {
      console.warn('Error cleaning up planner map:', e);
    }
    plannerMap = null;
  }

  try {
    const L = await import('leaflet');

    plannerMap = L.default.map('planner-map', {
      center: DEFAULT_CENTER,
      zoom: 4,
      zoomControl: false,
    });

    L.default.tileLayer(getMapTileUrl('dark'), {
      attribution: getMapAttribution(),
      maxZoom: 18,
    }).addTo(plannerMap);

    return plannerMap;
  } catch (error) {
    console.error('Planner map initialization failed:', error);
    return null;
  }
}

/**
 * Initialize saved trip detail map
 * @param {string} tripId - Trip ID
 */
export async function initSavedTripMap(tripId) {
  const mapContainer = document.getElementById('trip-detail-map');
  if (!mapContainer) return null;

  // Clean up existing trip detail map to prevent memory leaks
  if (tripDetailMap) {
    try {
      tripDetailMap.remove();
    } catch (e) {
      console.warn('Error cleaning up trip detail map:', e);
    }
    tripDetailMap = null;
  }

  try {
    const L = await import('leaflet');
    const { getTripById } = await import('./planner.js');

    const trip = getTripById(tripId);
    if (!trip) return null;

    tripDetailMap = L.default.map('trip-detail-map', {
      center: DEFAULT_CENTER,
      zoom: 5,
      zoomControl: false,
    });

    L.default.tileLayer(getMapTileUrl('dark'), {
      attribution: getMapAttribution(),
      maxZoom: 18,
    }).addTo(tripDetailMap);

    // Draw route if available
    if (trip.route?.geometry) {
      drawRoute(tripDetailMap, L.default, trip.route.geometry);
    }

    // Add step markers
    trip.steps.forEach((step, index) => {
      const isFirst = index === 0;
      const isLast = index === trip.steps.length - 1;

      L.default.marker([step.lat, step.lng], {
        icon: L.default.divIcon({
          className: 'custom-marker',
          html: `<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-sky-500'} text-white">
                   ${isFirst ? '🚀' : isLast ? '🏁' : index}
                 </div>`,
        }),
      }).addTo(tripDetailMap);
    });

    // Fit bounds
    const bounds = trip.steps.map(s => [s.lat, s.lng]);
    tripDetailMap.fitBounds(bounds, { padding: [30, 30] });

    return tripDetailMap;
  } catch (error) {
    console.error('Trip map initialization failed:', error);
    return null;
  }
}

/**
 * Add spots markers to map
 */
function addSpotsToMap(map, L, spots) {
  if (!map || !L || !spots) return;

  // Try to use MarkerCluster if available
  let markerGroup;
  try {
    markerGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 12,
    });
  } catch (e) {
    markerGroup = L.layerGroup();
  }

  spots.forEach(spot => {
    if (!spot.coordinates) return;

    const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
      icon: createSpotIcon(L, spot),
    });

    marker.bindPopup(createSpotPopup(spot));
    marker.on('click', () => {
      window.selectSpot?.(spot.id);
    });

    markerGroup.addLayer(marker);
  });

  map.addLayer(markerGroup);
}

/**
 * Create custom spot icon
 */
function createSpotIcon(L, spot) {
  const rating = spot.globalRating || 0;
  const color = rating >= 4.5 ? '#22c55e' : rating >= 4 ? '#0ea5e9' : rating >= 3 ? '#f59e0b' : '#ef4444';

  return L.divIcon({
    className: 'spot-marker',
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
             style="background-color: ${color}">
          ${rating.toFixed(1)}
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
             style="background-color: ${color}"></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

/**
 * Create spot popup content
 */
function createSpotPopup(spot) {
  return `
    <div class="spot-popup p-2 min-w-[200px]">
      ${spot.photoUrl ? `<img src="${spot.photoUrl}" alt="${spot.from}" class="w-full h-24 object-cover rounded-lg mb-2" />` : ''}
      <h3 class="font-bold text-gray-900">${spot.from} → ${spot.to}</h3>
      <div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
        <span>⭐ ${spot.globalRating?.toFixed(1) || 'N/A'}</span>
        <span>⏱️ ${spot.avgWaitTime || '?'} min</span>
      </div>
      <p class="text-xs text-gray-500 mt-1 line-clamp-2">${spot.description || ''}</p>
      <button onclick="selectSpot(${spot.id})"
              class="mt-2 w-full px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm">
        Voir détails
      </button>
    </div>
  `;
}

/**
 * Add user location marker
 */
function addUserLocationMarker(map, L, location) {
  const userMarker = L.marker([location.lat, location.lng], {
    icon: L.divIcon({
      className: 'user-marker',
      html: `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    }),
  });

  userMarker.addTo(map);
  userMarker.bindTooltip('Vous êtes ici');
}

/**
 * Draw route on map
 */
export function drawRoute(map, L, routeCoords) {
  if (!map || !L || !routeCoords) return;

  // Remove existing route
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  // routeCoords is in [lng, lat] format from OSRM, convert to [lat, lng]
  const latLngs = routeCoords.map(coord => [coord[1], coord[0]]);

  routeLayer = L.polyline(latLngs, {
    color: '#0ea5e9',
    weight: 4,
    opacity: 0.8,
    smoothFactor: 1,
  }).addTo(map);

  // Fit map to route bounds
  map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });

  return routeLayer;
}

/**
 * Display fallback spots (when map fails to load)
 */
export function displayFallbackSpots(container) {
  if (!container) return;

  const spots = getState().spots || sampleSpots;

  container.innerHTML = `
    <div class="fallback-spots p-4 bg-gray-800 rounded-xl text-center">
      <p class="text-gray-400 mb-4">Carte non disponible</p>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        ${spots.slice(0, 10).map(spot => `
          <div class="flex items-center gap-2 p-2 bg-gray-700 rounded-lg cursor-pointer"
               onclick="selectSpot(${spot.id})">
            <span>📍</span>
            <span class="text-white text-sm truncate">${spot.from} → ${spot.to}</span>
            <span class="text-amber-400 text-xs ml-auto">⭐${spot.globalRating?.toFixed(1) || 'N/A'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Update map theme
 */
export async function updateMapTheme(theme) {
  if (!mainMap) return;

  const L = await import('leaflet');

  // Remove old tile layer
  mainMap.eachLayer(layer => {
    if (layer instanceof L.default.TileLayer) {
      mainMap.removeLayer(layer);
    }
  });

  // Add new tile layer
  L.default.tileLayer(getMapTileUrl(theme), {
    attribution: getMapAttribution(),
    maxZoom: 18,
  }).addTo(mainMap);
}

/**
 * Center map on user location
 */
export function centerOnUser() {
  const state = getState();

  if (mainMap && state.userLocation) {
    mainMap.setView([state.userLocation.lat, state.userLocation.lng], 12);
  }
}

/**
 * Center map on spot
 */
export function centerOnSpot(spot) {
  if (mainMap && spot?.coordinates) {
    mainMap.setView([spot.coordinates.lat, spot.coordinates.lng], 14);
  }
}

/**
 * Destroy map instances (cleanup to prevent memory leaks)
 */
export function destroyMaps() {
  console.log('🗺️ Destroying map instances for cleanup');
  if (mainMap) {
    try {
      // Clean up ResizeObserver if exists
      if (mainMap._resizeObserver) {
        mainMap._resizeObserver.disconnect();
      }
      mainMap.remove();
    } catch (e) {
      console.warn('Error removing main map:', e);
    }
    mainMap = null;
  }
  if (plannerMap) {
    try {
      plannerMap.remove();
    } catch (e) {
      console.warn('Error removing planner map:', e);
    }
    plannerMap = null;
  }
  if (tripDetailMap) {
    try {
      tripDetailMap.remove();
    } catch (e) {
      console.warn('Error removing trip detail map:', e);
    }
    tripDetailMap = null;
  }
  if (routeLayer) {
    routeLayer = null;
  }
  window.spotHitchMap = null;
  window.mapInstance = null;
}

/**
 * Initialize map service (alias for initMap with 'main-map' container)
 * Used by the Map view component
 */
export async function initMapService(state) {
  return initMap('main-map');
}

export default {
  initMap,
  initMapService,
  initPlannerMap,
  initSavedTripMap,
  drawRoute,
  displayFallbackSpots,
  getMapTileUrl,
  getMapAttribution,
  updateMapTheme,
  centerOnUser,
  centerOnSpot,
  destroyMaps,
};
