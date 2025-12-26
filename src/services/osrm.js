/**
 * OSRM Routing Service
 * Handles route calculation with debouncing and caching
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving/';

// Cache for route results
const routeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Debounce timer
let debounceTimer = null;

/**
 * Calculate route between waypoints
 * @param {Array<{lat: number, lng: number}>} waypoints - Array of coordinates
 * @returns {Promise<Object>} Route data
 */
export async function getRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }
  
  // Build coordinates string
  const coords = waypoints
    .map(wp => `${wp.lng.toFixed(6)},${wp.lat.toFixed(6)}`)
    .join(';');
  
  // Build URL
  const url = `${OSRM_BASE_URL}${coords}?overview=full&geometries=geojson&steps=true`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.code}`);
    }
    
    const route = data.routes[0];
    
    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry.coordinates, // GeoJSON coordinates
      steps: route.legs.flatMap(leg => leg.steps),
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    throw error;
  }
}

/**
 * Get route with debouncing (rate limiting)
 * @param {Array<{lat: number, lng: number}>} waypoints - Array of coordinates
 * @param {number} delay - Debounce delay in ms (default 500)
 * @returns {Promise<Object>} Route data
 */
export function getRouteDebounced(waypoints, delay = 500) {
  return new Promise((resolve, reject) => {
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(async () => {
      try {
        // Check cache first
        const cacheKey = waypoints
          .map(wp => `${wp.lat.toFixed(3)},${wp.lng.toFixed(3)}`)
          .join('|');
        
        const cached = routeCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          resolve(cached.data);
          return;
        }
        
        // Fetch new route
        const result = await getRoute(waypoints);
        
        // Cache result
        routeCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
        
        // Trim cache if too large
        if (routeCache.size > 50) {
          const oldestKey = routeCache.keys().next().value;
          routeCache.delete(oldestKey);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} min`;
  }
  
  return `${hours}h ${minutes}min`;
}

/**
 * Get geocoding suggestion from Nominatim
 * @param {string} query - Search query
 * @returns {Promise<Array>} Suggestions
 */
export async function searchLocation(query) {
  if (!query || query.length < 3) {
    return [];
  }
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpotHitch/2.0 (https://antoine626.github.io/Spothitch)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.error('Geocoding failed:', error);
    return [];
  }
}

/**
 * Reverse geocoding - get address from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Location info
 */
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpotHitch/2.0 (https://antoine626.github.io/Spothitch)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      name: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
      countryCode: data.address?.country_code?.toUpperCase(),
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

/**
 * Clear route cache
 */
export function clearCache() {
  routeCache.clear();
}

export default {
  getRoute,
  getRouteDebounced,
  formatDistance,
  formatDuration,
  searchLocation,
  reverseGeocode,
  clearCache,
};
