/**
 * Trip Planner Service
 * Handles route planning and spot suggestions
 */

import { getState, setState } from '../stores/state.js';
import { getRoute, searchLocation } from './osrm.js';
import { sampleSpots } from '../data/spots.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is near a route segment
 * @param {Object} point - Point with lat, lng
 * @param {Array} routeCoords - Array of [lng, lat] coordinates
 * @param {number} maxDistanceKm - Maximum distance from route in km
 * @returns {boolean}
 */
function isPointNearRoute(point, routeCoords, maxDistanceKm = 10) {
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [lng1, lat1] = routeCoords[i];
    const [lng2, lat2] = routeCoords[i + 1];

    // Simple distance check to route segment midpoint
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;

    const distance = haversineDistance(point.lat, point.lng, midLat, midLng);
    if (distance <= maxDistanceKm) {
      return true;
    }
  }
  return false;
}

/**
 * Get spots along a route between two points
 * @param {Object} from - Starting point {lat, lng, name}
 * @param {Object} to - Ending point {lat, lng, name}
 * @param {number} maxDistanceKm - Max distance from route
 */
async function getSpotsForRoute(from, to, maxDistanceKm = 15) {
  try {
    // Get route from OSRM
    const route = await getRoute([from, to]);

    if (!route || !route.geometry) {
      console.warn('No route found');
      return { route: null, spots: [] };
    }

    // Find spots near the route
    const spots = getState().spots || sampleSpots;
    const nearbySpots = spots.filter(spot => {
      if (!spot.coordinates) return false;
      return isPointNearRoute(spot.coordinates, route.geometry, maxDistanceKm);
    });

    // Sort by distance from start
    nearbySpots.sort((a, b) => {
      const distA = haversineDistance(from.lat, from.lng, a.coordinates.lat, a.coordinates.lng);
      const distB = haversineDistance(from.lat, from.lng, b.coordinates.lat, b.coordinates.lng);
      return distA - distB;
    });

    return {
      route,
      spots: nearbySpots,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('Error getting spots for route:', error);
    return { route: null, spots: [] };
  }
}

/**
 * Get spots between two points (simple bbox filter)
 * @param {Object} from - Starting point
 * @param {Object} to - Ending point
 */
function getSpotsBetween(from, to) {
  const spots = getState().spots || sampleSpots;

  const minLat = Math.min(from.lat, to.lat) - 0.5;
  const maxLat = Math.max(from.lat, to.lat) + 0.5;
  const minLng = Math.min(from.lng, to.lng) - 0.5;
  const maxLng = Math.max(from.lng, to.lng) + 0.5;

  return spots.filter(spot => {
    if (!spot.coordinates) return false;
    const { lat, lng } = spot.coordinates;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });
}

/**
 * Find spots near a route (from coordinates array)
 * @param {Array} routeCoords - Array of [lng, lat] coordinates
 * @param {number} maxKm - Maximum distance from route
 */
function findSpotsNearRoute(routeCoords, maxKm = 10) {
  const spots = getState().spots || sampleSpots;

  return spots.filter(spot => {
    if (!spot.coordinates) return false;
    return isPointNearRoute(spot.coordinates, routeCoords, maxKm);
  });
}

/**
 * Create a new trip plan
 * @param {Array} steps - Array of step objects {name, lat, lng}
 */
async function createTrip(steps) {
  if (steps.length < 2) {
    showToast(t('needAtLeast2Steps') || 'Il faut au moins 2 étapes', 'error');
    return null;
  }

  const waypoints = steps.map(s => ({ lat: s.lat, lng: s.lng }));

  try {
    const route = await getRoute(waypoints);

    // Find spots along the entire route
    const allSpots = findSpotsNearRoute(route.geometry, 15);

    // Group spots by leg
    const spotsByLeg = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const legStart = steps[i];
      const legEnd = steps[i + 1];
      const legSpots = allSpots.filter(spot => {
        if (!spot.coordinates) return false;
        const distStart = haversineDistance(
          legStart.lat, legStart.lng,
          spot.coordinates.lat, spot.coordinates.lng
        );
        const distEnd = haversineDistance(
          legEnd.lat, legEnd.lng,
          spot.coordinates.lat, spot.coordinates.lng
        );
        const legDist = haversineDistance(
          legStart.lat, legStart.lng,
          legEnd.lat, legEnd.lng
        );
        return distStart + distEnd <= legDist * 1.3; // Within 30% of direct path
      });
      spotsByLeg.push({
        from: legStart.name,
        to: legEnd.name,
        spots: legSpots.slice(0, 5), // Top 5 spots per leg
      });
    }

    const trip = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      steps,
      route,
      spotsByLeg,
      totalDistance: route.distance,
      totalDuration: route.duration,
      estimatedDays: Math.ceil(route.distance / 300000), // ~300km per day
    };

    return trip;
  } catch (error) {
    console.error('Error creating trip:', error);
    showToast(t('tripCreationError') || 'Erreur lors de la création du voyage', 'error');
    return null;
  }
}

/**
 * Save a trip to user's saved trips
 * @param {Object} trip - Trip object
 */
function saveTrip(trip) {
  const state = getState();
  const savedTrips = state.savedTrips || [];

  // Check if already saved
  if (savedTrips.find(t => t.id === trip.id)) {
    showToast(t('tripAlreadySaved') || 'Voyage déjà sauvegardé', 'info');
    return false;
  }

  setState({
    savedTrips: [...savedTrips, trip],
  });

  showToast(t('tripSaved') || 'Voyage sauvegardé !', 'success');
  return true;
}

/**
 * Delete a saved trip
 * @param {string} tripId - Trip ID
 */
function deleteTrip(tripId) {
  const state = getState();
  const savedTrips = state.savedTrips || [];

  setState({
    savedTrips: savedTrips.filter(t => t.id !== tripId),
  });

  showToast(t('tripDeleted') || 'Voyage supprimé', 'info');
}

/**
 * Get saved trips
 */
function getSavedTrips() {
  const state = getState();
  return state.savedTrips || [];
}

/**
 * Get a saved trip by ID
 * @param {string} tripId - Trip ID
 */
export function getTripById(tripId) {
  const trips = getSavedTrips();
  return trips.find(t => t.id === tripId);
}

/**
 * Search for a location and return coordinates
 * @param {string} query - Search query
 */
async function searchTripLocation(query) {
  const results = await searchLocation(query);
  return results.map(r => ({
    name: r.name.split(',')[0], // Just city name
    fullName: r.name,
    lat: r.lat,
    lng: r.lng,
  }));
}

/**
 * Add a step to current trip planning
 * @param {Object} step - Step object {name, lat, lng}
 */
function addTripStep(step) {
  const state = getState();
  const steps = state.tripSteps || [];

  setState({
    tripSteps: [...steps, step],
  });
}

/**
 * Remove a step from current trip planning
 * @param {number} index - Step index
 */
export function removeTripStep(index) {
  const state = getState();
  const steps = state.tripSteps || [];

  setState({
    tripSteps: steps.filter((_, i) => i !== index),
  });
}

/**
 * Reorder trip steps
 * @param {number} fromIndex - Original index
 * @param {number} toIndex - New index
 */
function reorderTripSteps(fromIndex, toIndex) {
  const state = getState();
  const steps = [...(state.tripSteps || [])];

  const [removed] = steps.splice(fromIndex, 1);
  steps.splice(toIndex, 0, removed);

  setState({
    tripSteps: steps,
  });
}

/**
 * Clear current trip planning
 */
export function clearTripSteps() {
  setState({
    tripSteps: [],
    activeTrip: null,
    tripRoute: null,
  });
}

/**
 * Get suggested starting spots for a city
 * @param {Object} location - {lat, lng}
 * @param {number} limit - Max spots to return
 */
function getSuggestedStartingSpots(location, limit = 5) {
  const spots = getState().spots || sampleSpots;

  const sortedSpots = spots
    .filter(spot => spot.coordinates)
    .map(spot => ({
      ...spot,
      distance: haversineDistance(
        location.lat, location.lng,
        spot.coordinates.lat, spot.coordinates.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  return sortedSpots.slice(0, limit);
}

export default {
  getSpotsForRoute,
  getSpotsBetween,
  findSpotsNearRoute,
  createTrip,
  saveTrip,
  deleteTrip,
  getSavedTrips,
  getTripById,
  searchTripLocation,
  addTripStep,
  removeTripStep,
  reorderTripSteps,
  clearTripSteps,
  getSuggestedStartingSpots,
};
