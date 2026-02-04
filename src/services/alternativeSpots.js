/**
 * Alternative Spots Service
 * Find nearby spots when current one doesn't suit the user
 */

import { getState } from '../stores/state.js';

/**
 * Haversine formula to calculate distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bearing (direction) between two points
 * @param {number} lat1 - Starting latitude
 * @param {number} lng1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {string} Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180 / Math.PI + 360) % 360; // Convert to degrees

  return degreesToCardinal(bearing);
}

/**
 * Convert bearing degrees to cardinal direction
 */
function degreesToCardinal(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Get direction icon for cardinal direction
 */
export function getDirectionIcon(direction) {
  const icons = {
    'N': 'fa-arrow-up',
    'NE': 'fa-arrow-up rotate-45',
    'E': 'fa-arrow-right',
    'SE': 'fa-arrow-down rotate-[-45deg]',
    'S': 'fa-arrow-down',
    'SW': 'fa-arrow-down rotate-45',
    'W': 'fa-arrow-left',
    'NW': 'fa-arrow-up rotate-[-45deg]',
  };
  return icons[direction] || 'fa-location-dot';
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Estimate walking time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Estimated walking time
 */
export function estimateWalkingTime(distanceKm) {
  // Average walking speed: 5 km/h
  const minutes = Math.round((distanceKm / 5) * 60);
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `~${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
}

/**
 * Find alternative spots near a given spot
 * @param {Object} currentSpot - The current spot
 * @param {Object} options - Search options
 * @param {number} options.maxDistance - Maximum distance in km (default: 5)
 * @param {number} options.limit - Maximum number of results (default: 5)
 * @param {string} options.sortBy - Sort by 'distance' or 'rating' (default: 'distance')
 * @returns {Array} Array of alternative spots with distance info
 */
export function findAlternativeSpots(currentSpot, options = {}) {
  const { spots } = getState();
  const {
    maxDistance = 5,
    limit = 5,
    sortBy = 'distance'
  } = options;

  if (!currentSpot?.coordinates?.lat || !currentSpot?.coordinates?.lng) {
    return [];
  }

  const { lat, lng } = currentSpot.coordinates;

  // Calculate distance for all spots and filter
  const alternatives = spots
    .filter(spot => {
      // Exclude current spot
      if (spot.id === currentSpot.id) return false;
      // Must have coordinates
      if (!spot.coordinates?.lat || !spot.coordinates?.lng) return false;
      return true;
    })
    .map(spot => {
      const distance = haversineDistance(
        lat, lng,
        spot.coordinates.lat, spot.coordinates.lng
      );
      const direction = calculateBearing(
        lat, lng,
        spot.coordinates.lat, spot.coordinates.lng
      );
      const walkingTime = estimateWalkingTime(distance);

      return {
        ...spot,
        distance,
        distanceFormatted: formatDistance(distance),
        direction,
        directionIcon: getDirectionIcon(direction),
        walkingTime,
      };
    })
    .filter(spot => spot.distance <= maxDistance);

  // Sort results
  if (sortBy === 'rating') {
    alternatives.sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0));
  } else {
    alternatives.sort((a, b) => a.distance - b.distance);
  }

  return alternatives.slice(0, limit);
}

/**
 * Check if there are nearby alternatives
 * @param {Object} currentSpot - The current spot
 * @param {number} maxDistance - Maximum distance in km
 * @returns {boolean} True if alternatives exist
 */
export function hasAlternatives(currentSpot, maxDistance = 5) {
  const alternatives = findAlternativeSpots(currentSpot, { maxDistance, limit: 1 });
  return alternatives.length > 0;
}

/**
 * Get alternative spots count
 * @param {Object} currentSpot - The current spot
 * @param {number} maxDistance - Maximum distance in km
 * @returns {number} Number of alternatives
 */
export function getAlternativesCount(currentSpot, maxDistance = 5) {
  const { spots } = getState();

  if (!currentSpot?.coordinates?.lat || !currentSpot?.coordinates?.lng) {
    return 0;
  }

  const { lat, lng } = currentSpot.coordinates;

  return spots.filter(spot => {
    if (spot.id === currentSpot.id) return false;
    if (!spot.coordinates?.lat || !spot.coordinates?.lng) return false;

    const distance = haversineDistance(
      lat, lng,
      spot.coordinates.lat, spot.coordinates.lng
    );
    return distance <= maxDistance;
  }).length;
}

export default {
  haversineDistance,
  calculateBearing,
  getDirectionIcon,
  formatDistance,
  estimateWalkingTime,
  findAlternativeSpots,
  hasAlternatives,
  getAlternativesCount,
};
