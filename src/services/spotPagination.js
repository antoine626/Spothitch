/**
 * Spot Pagination Service
 * Load spots based on visible map area for better performance
 */

import { getState, setState } from '../stores/state.js';

// Configuration
const CONFIG = {
  pageSize: 50, // Number of spots per page
  maxSpotsInMemory: 500, // Maximum spots to keep in memory
  bufferZone: 0.5, // Extra area to load beyond visible bounds (in degrees)
  debounceMs: 300, // Debounce map move events
};

// State
let loadedBounds = null;
let loadingBounds = false;
let debounceTimer = null;

/**
 * Get spots visible in current map bounds
 * @param {Object} bounds - Map bounds {north, south, east, west}
 * @param {Array} allSpots - All available spots
 * @returns {Array} Filtered spots
 */
export function getSpotsInBounds(bounds, allSpots) {
  if (!bounds || !allSpots) return [];

  return allSpots.filter((spot) => {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) return false;

    const { lat, lng } = spot.coordinates;
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });
}

/**
 * Get spots with buffer zone for smoother panning
 * @param {Object} bounds - Map bounds
 * @param {Array} allSpots - All spots
 * @returns {Array}
 */
export function getSpotsInBoundsWithBuffer(bounds, allSpots) {
  if (!bounds || !allSpots) return [];

  const bufferedBounds = {
    north: bounds.north + CONFIG.bufferZone,
    south: bounds.south - CONFIG.bufferZone,
    east: bounds.east + CONFIG.bufferZone,
    west: bounds.west - CONFIG.bufferZone,
  };

  return getSpotsInBounds(bufferedBounds, allSpots);
}

/**
 * Paginate spots array
 * @param {Array} spots
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} - {spots, totalPages, currentPage, hasMore}
 */
export function paginateSpots(spots, page = 0, pageSize = CONFIG.pageSize) {
  if (!spots || spots.length === 0) {
    return {
      spots: [],
      totalPages: 0,
      currentPage: 0,
      hasMore: false,
      total: 0,
    };
  }

  const totalPages = Math.ceil(spots.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, spots.length);

  return {
    spots: spots.slice(startIndex, endIndex),
    totalPages,
    currentPage: page,
    hasMore: endIndex < spots.length,
    total: spots.length,
  };
}

/**
 * Handle map bounds change
 * @param {Object} map - Leaflet map instance
 */
export function onMapBoundsChange(map) {
  if (!map) return;

  // Debounce
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    updateVisibleSpots(map);
  }, CONFIG.debounceMs);
}

/**
 * Update visible spots based on map bounds
 * @param {Object} map - Leaflet map instance
 */
export function updateVisibleSpots(map) {
  if (!map || loadingBounds) return;

  const bounds = map.getBounds();
  const mapBounds = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };

  // Check if we need to reload
  if (loadedBounds && isBoundsContained(mapBounds, loadedBounds)) {
    // Current bounds are within loaded bounds, no need to reload
    return;
  }

  loadingBounds = true;

  const state = getState();
  const allSpots = state.spots || [];

  // Get spots in visible area with buffer
  const visibleSpots = getSpotsInBoundsWithBuffer(mapBounds, allSpots);

  // Update state
  setState({
    visibleSpots,
    mapBounds,
    spotsLoaded: true,
  });

  loadedBounds = {
    north: mapBounds.north + CONFIG.bufferZone,
    south: mapBounds.south - CONFIG.bufferZone,
    east: mapBounds.east + CONFIG.bufferZone,
    west: mapBounds.west - CONFIG.bufferZone,
  };

  loadingBounds = false;
}

/**
 * Check if inner bounds are contained within outer bounds
 * @param {Object} inner
 * @param {Object} outer
 * @returns {boolean}
 */
function isBoundsContained(inner, outer) {
  return (
    inner.north <= outer.north &&
    inner.south >= outer.south &&
    inner.east <= outer.east &&
    inner.west >= outer.west
  );
}

/**
 * Get spots sorted by distance from a point
 * @param {Array} spots
 * @param {Object} center - {lat, lng}
 * @param {number} limit
 * @returns {Array}
 */
export function getSpotsByDistance(spots, center, limit = 20) {
  if (!spots || !center) return [];

  return spots
    .map((spot) => ({
      ...spot,
      distance: calculateDistance(
        center.lat,
        center.lng,
        spot.coordinates?.lat,
        spot.coordinates?.lng
      ),
    }))
    .filter((spot) => !isNaN(spot.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return NaN;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Group spots by region/country
 * @param {Array} spots
 * @returns {Object}
 */
export function groupSpotsByRegion(spots) {
  if (!spots) return {};

  const groups = {};

  spots.forEach((spot) => {
    const region = spot.country || 'Inconnu';
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(spot);
  });

  // Sort each group by rating
  Object.keys(groups).forEach((region) => {
    groups[region].sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0));
  });

  return groups;
}

/**
 * Get spot clusters for map display
 * @param {Array} spots
 * @param {number} gridSize - Size of grid cells in degrees
 * @returns {Array} Array of cluster objects
 */
export function clusterSpots(spots, gridSize = 0.5) {
  if (!spots || spots.length === 0) return [];

  const clusters = {};

  spots.forEach((spot) => {
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) return;

    const gridKey = `${Math.floor(spot.coordinates.lat / gridSize)}_${Math.floor(spot.coordinates.lng / gridSize)}`;

    if (!clusters[gridKey]) {
      clusters[gridKey] = {
        spots: [],
        center: { lat: 0, lng: 0 },
        totalRating: 0,
      };
    }

    clusters[gridKey].spots.push(spot);
    clusters[gridKey].totalRating += spot.globalRating || 0;
  });

  // Calculate cluster centers and stats
  return Object.values(clusters).map((cluster) => {
    const lats = cluster.spots.map((s) => s.coordinates.lat);
    const lngs = cluster.spots.map((s) => s.coordinates.lng);

    return {
      center: {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      },
      count: cluster.spots.length,
      avgRating: cluster.totalRating / cluster.spots.length,
      spots: cluster.spots,
    };
  });
}

/**
 * Infinite scroll handler for spots list
 * @param {Object} options
 * @returns {Object} - scroll handler and state
 */
export function createInfiniteScroll(options = {}) {
  const { onLoadMore, threshold = 200 } = options;

  let currentPage = 0;
  let loading = false;
  let hasMore = true;

  const handleScroll = (event) => {
    if (loading || !hasMore) return;

    const target = event.target;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loading = true;
      currentPage++;

      onLoadMore(currentPage)
        .then((result) => {
          hasMore = result.hasMore;
        })
        .finally(() => {
          loading = false;
        });
    }
  };

  const reset = () => {
    currentPage = 0;
    loading = false;
    hasMore = true;
  };

  return {
    handleScroll,
    reset,
    getCurrentPage: () => currentPage,
    isLoading: () => loading,
    hasMore: () => hasMore,
  };
}

/**
 * Render pagination UI
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {string} onPageChange - JavaScript function name to call
 * @returns {string}
 */
export function renderPagination(currentPage, totalPages, onPageChange = 'goToPage') {
  if (totalPages <= 1) return '';

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible);

  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible);
  }

  for (let i = start; i < end; i++) {
    pages.push(i);
  }

  return `
    <div class="flex items-center justify-center gap-2 py-4" role="navigation" aria-label="Pagination">
      <button
        onclick="${onPageChange}(${currentPage - 1})"
        class="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        ${currentPage === 0 ? 'disabled' : ''}
        aria-label="Page précédente"
      >
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>

      ${pages
        .map(
          (page) => `
        <button
          onclick="${onPageChange}(${page})"
          class="w-10 h-10 rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 hover:bg-white/10'
          }"
          aria-label="Page ${page + 1}"
          ${page === currentPage ? 'aria-current="page"' : ''}
        >
          ${page + 1}
        </button>
      `
        )
        .join('')}

      <button
        onclick="${onPageChange}(${currentPage + 1})"
        class="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        ${currentPage >= totalPages - 1 ? 'disabled' : ''}
        aria-label="Page suivante"
      >
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
    </div>
  `;
}

// Global handlers
window.onMapBoundsChange = onMapBoundsChange;
window.goToPage = (page) => {
  const state = getState();
  setState({ currentSpotPage: page });
};

export default {
  getSpotsInBounds,
  getSpotsInBoundsWithBuffer,
  paginateSpots,
  onMapBoundsChange,
  updateVisibleSpots,
  getSpotsByDistance,
  groupSpotsByRegion,
  clusterSpots,
  createInfiniteScroll,
  renderPagination,
};
