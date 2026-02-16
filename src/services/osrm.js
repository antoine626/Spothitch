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
  if (!query || query.length < 2) {
    return [];
  }

  // Get app language for localized results
  let lang = 'fr'
  try { lang = (await import('../stores/state.js')).getState().lang || 'fr' } catch (e) { /* no-op */ }

  // Use featuretype=city to only get cities/towns (not streets, buildings etc.)
  // Results are sorted by "importance" by default (popular cities first)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&accept-language=${lang}&featuretype=city&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpotHitch/2.0 (https://spothitch.com)',
        'Accept-Language': lang,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    // Sort by importance (highest first = most popular cities)
    data.sort((a, b) => (parseFloat(b.importance) || 0) - (parseFloat(a.importance) || 0))

    const results = data.map(item => {
      // Build a cleaner name: City, Country
      const addr = item.address || {}
      const city = addr.city || addr.town || addr.village || item.display_name.split(',')[0]
      const country = addr.country || ''
      const cleanName = country ? `${city}, ${country}` : city
      return {
        name: cleanName,
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        importance: parseFloat(item.importance) || 0,
      }
    });

    // Deduplicate: aggressively remove entries with same city name nearby
    const seen = new Set()
    return results.filter(r => {
      const cityName = r.name.split(',')[0].trim().toLowerCase()
      const coordKey = `${r.lat.toFixed(1)},${r.lng.toFixed(1)}`
      const key = `${cityName}|${coordKey}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 5);
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
        'User-Agent': 'SpotHitch/2.0 (https://spothitch.com)',
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
 * Search cities with optional country filter
 * @param {string} query - Search query
 * @param {Object} options - Options
 * @param {string} [options.countryCode] - ISO country code to filter (e.g. 'FR')
 * @returns {Promise<Array>} City suggestions
 */
export async function searchCities(query, { countryCode } = {}) {
  if (!query || query.length < 2) return []

  let lang = 'fr'
  try { lang = (await import('../stores/state.js')).getState().lang || 'fr' } catch { /* no-op */ }

  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&accept-language=${lang}&featuretype=city&addressdetails=1`
  if (countryCode) {
    url += `&countrycodes=${countryCode.toLowerCase()}`
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpotHitch/2.0 (https://spothitch.com)',
        'Accept-Language': lang,
      },
    })

    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`)

    const data = await response.json()
    data.sort((a, b) => (parseFloat(b.importance) || 0) - (parseFloat(a.importance) || 0))

    const results = data.map(item => {
      const addr = item.address || {}
      const city = addr.city || addr.town || addr.village || item.display_name.split(',')[0]
      const country = addr.country || ''
      const countryCodeResult = (addr.country_code || '').toUpperCase()
      return {
        name: city,
        fullName: country ? `${city}, ${country}` : city,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        countryCode: countryCodeResult,
        countryName: country,
        importance: parseFloat(item.importance) || 0,
      }
    })

    const seen = new Set()
    return results.filter(r => {
      const key = `${r.name.toLowerCase()}|${r.lat.toFixed(1)},${r.lng.toFixed(1)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 5)
  } catch (error) {
    console.error('City search failed:', error)
    return []
  }
}

/**
 * Search countries by name
 * @param {string} query - Country name query
 * @returns {Promise<Array>} Country suggestions
 */
export async function searchCountries(query) {
  if (!query || query.length < 2) return []

  let lang = 'fr'
  try { lang = (await import('../stores/state.js')).getState().lang || 'fr' } catch { /* no-op */ }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=${lang}&featuretype=country&addressdetails=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SpotHitch/2.0 (https://spothitch.com)',
        'Accept-Language': lang,
      },
    })

    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`)

    const data = await response.json()
    return data.map(item => ({
      name: item.address?.country || item.display_name.split(',')[0],
      code: (item.address?.country_code || '').toUpperCase(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    })).filter(c => c.code)
  } catch (error) {
    console.error('Country search failed:', error)
    return []
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
  searchCities,
  searchCountries,
  reverseGeocode,
  clearCache,
};
