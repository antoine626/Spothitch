/**
 * Country Borders Service
 * Displays country borders on the map with visited/unvisited styling
 */

import { getState } from '../stores/state.js';

// Border layer reference
let borderLayer = null;
let highlightedCountry = null;

// Country colors based on visited status
const COLORS = {
  visited: {
    fill: 'rgba(34, 197, 94, 0.15)', // green-500 with opacity
    stroke: '#22c55e', // green-500
  },
  unvisited: {
    fill: 'rgba(148, 163, 184, 0.08)', // slate-400 with opacity
    stroke: '#64748b', // slate-500
  },
  highlighted: {
    fill: 'rgba(14, 165, 233, 0.25)', // sky-500 with opacity
    stroke: '#0ea5e9', // sky-500
  },
};

// Simplified GeoJSON data for European countries
// Coordinates are simplified polygons (not full detail) for performance
const europeanCountries = {
  FR: {
    name: 'France',
    code: 'FR',
    center: [46.603354, 1.888334],
    // Simplified polygon for France mainland
    coordinates: [
      [[2.55, 51.1], [1.6, 50.95], [-1.8, 48.65], [-4.8, 48.4], [-4.4, 47.8],
       [-2.5, 47.5], [-1.2, 46.3], [-1.8, 44.0], [0.6, 42.7], [3.1, 42.45],
       [4.2, 43.5], [6.0, 43.0], [7.7, 43.7], [7.0, 45.9], [6.85, 46.45],
       [7.6, 47.6], [8.2, 48.9], [6.0, 49.5], [4.85, 50.0], [2.55, 51.1]]
    ],
  },
  DE: {
    name: 'Germany',
    code: 'DE',
    center: [51.165691, 10.451526],
    coordinates: [
      [[8.5, 55.0], [14.2, 54.0], [14.8, 51.0], [15.0, 50.2], [12.1, 49.0],
       [13.8, 48.8], [13.0, 47.5], [10.0, 47.3], [7.5, 47.6], [5.9, 49.5],
       [6.0, 50.8], [5.9, 51.0], [6.7, 51.9], [7.0, 52.2], [7.2, 53.3],
       [8.5, 55.0]]
    ],
  },
  BE: {
    name: 'Belgium',
    code: 'BE',
    center: [50.503887, 4.469936],
    coordinates: [
      [[2.55, 51.1], [4.3, 51.4], [5.9, 51.0], [6.4, 50.3], [6.0, 49.5],
       [4.85, 49.8], [4.15, 49.95], [2.55, 51.1]]
    ],
  },
  NL: {
    name: 'Netherlands',
    code: 'NL',
    center: [52.132633, 5.291266],
    coordinates: [
      [[3.4, 51.4], [4.3, 51.4], [5.9, 51.0], [6.7, 51.9], [7.2, 53.3],
       [6.0, 53.5], [4.8, 53.0], [3.4, 51.4]]
    ],
  },
  ES: {
    name: 'Spain',
    code: 'ES',
    center: [40.463667, -3.74922],
    coordinates: [
      [[-9.3, 43.0], [-1.8, 43.4], [0.6, 42.7], [3.1, 42.45], [3.3, 41.9],
       [1.5, 41.0], [-0.3, 39.5], [0.2, 38.7], [-0.8, 37.5], [-2.0, 36.7],
       [-5.6, 36.0], [-7.4, 37.2], [-8.9, 38.5], [-9.5, 39.4], [-8.8, 42.0],
       [-9.3, 43.0]]
    ],
  },
  IT: {
    name: 'Italy',
    code: 'IT',
    center: [41.87194, 12.56738],
    coordinates: [
      [[6.63, 45.1], [7.0, 45.9], [10.5, 46.85], [13.7, 46.5], [13.8, 45.6],
       [12.5, 44.2], [14.0, 42.5], [16.0, 41.5], [18.5, 40.2], [17.0, 39.0],
       [15.6, 38.2], [15.1, 37.5], [12.4, 37.8], [12.5, 38.8], [9.8, 40.5],
       [8.1, 39.1], [8.5, 41.0], [9.5, 43.2], [7.5, 43.8], [6.63, 45.1]]
    ],
  },
  PL: {
    name: 'Poland',
    code: 'PL',
    center: [51.919438, 19.145136],
    coordinates: [
      [[14.2, 54.0], [18.5, 54.8], [23.0, 54.1], [23.9, 52.3], [24.0, 50.5],
       [22.8, 49.0], [18.9, 49.2], [15.0, 50.2], [14.8, 51.0], [14.2, 54.0]]
    ],
  },
  IE: {
    name: 'Ireland',
    code: 'IE',
    center: [53.41291, -8.24389],
    coordinates: [
      [[-10.5, 51.4], [-6.0, 51.5], [-5.5, 53.5], [-6.2, 55.2], [-8.5, 55.4],
       [-10.5, 53.5], [-10.5, 51.4]]
    ],
  },
  AT: {
    name: 'Austria',
    code: 'AT',
    center: [47.516231, 14.550072],
    coordinates: [
      [[9.5, 47.1], [10.5, 47.0], [13.0, 47.0], [13.0, 47.5], [16.9, 47.7],
       [17.1, 48.0], [16.9, 48.6], [15.5, 49.0], [14.5, 48.6], [13.8, 48.8],
       [12.1, 49.0], [10.0, 47.3], [9.5, 47.1]]
    ],
  },
  CZ: {
    name: 'Czech Republic',
    code: 'CZ',
    center: [49.817492, 15.472962],
    coordinates: [
      [[12.1, 49.0], [14.5, 48.6], [15.5, 49.0], [16.9, 48.6], [18.9, 49.2],
       [18.5, 49.7], [16.0, 50.6], [15.0, 50.2], [14.8, 51.0], [12.1, 49.0]]
    ],
  },
  PT: {
    name: 'Portugal',
    code: 'PT',
    center: [39.399872, -8.224454],
    coordinates: [
      [[-9.5, 37.0], [-7.4, 37.2], [-6.9, 38.2], [-7.0, 39.0], [-6.8, 40.0],
       [-6.9, 41.0], [-8.2, 41.8], [-8.8, 42.0], [-9.5, 39.4], [-9.5, 37.0]]
    ],
  },
  CH: {
    name: 'Switzerland',
    code: 'CH',
    center: [46.818188, 8.227512],
    coordinates: [
      [[6.0, 46.0], [6.85, 46.45], [7.0, 45.9], [7.6, 47.6], [9.5, 47.1],
       [10.5, 47.0], [10.5, 46.85], [9.0, 46.0], [8.0, 45.8], [7.0, 45.9],
       [6.63, 45.1], [6.0, 46.0]]
    ],
  },
  HR: {
    name: 'Croatia',
    code: 'HR',
    center: [45.1, 15.2],
    coordinates: [
      [[13.5, 45.5], [15.3, 45.5], [16.4, 46.4], [18.9, 45.9], [19.4, 45.2],
       [19.0, 44.0], [17.6, 42.9], [16.0, 43.5], [15.2, 44.2], [14.0, 44.8],
       [13.5, 45.5]]
    ],
  },
  HU: {
    name: 'Hungary',
    code: 'HU',
    center: [47.162494, 19.503304],
    coordinates: [
      [[16.9, 47.7], [17.1, 48.0], [18.8, 48.0], [21.0, 48.5], [22.3, 48.1],
       [22.1, 47.5], [21.2, 46.1], [18.8, 45.9], [16.4, 46.4], [16.9, 47.7]]
    ],
  },
  DK: {
    name: 'Denmark',
    code: 'DK',
    center: [56.26392, 9.501785],
    coordinates: [
      [[8.1, 54.8], [10.9, 54.7], [12.6, 54.5], [12.6, 55.7], [10.5, 57.7],
       [8.1, 57.1], [8.6, 55.0], [8.1, 54.8]]
    ],
  },
  SE: {
    name: 'Sweden',
    code: 'SE',
    center: [60.128161, 18.643501],
    coordinates: [
      [[10.5, 57.7], [12.6, 55.7], [14.3, 55.4], [18.5, 59.0], [20.0, 63.5],
       [24.0, 65.8], [21.0, 68.5], [18.0, 69.0], [14.5, 67.0], [11.5, 63.5],
       [11.0, 59.0], [10.5, 57.7]]
    ],
  },
  // Additional countries in Europe
  GB: {
    name: 'United Kingdom',
    code: 'GB',
    center: [55.378051, -3.435973],
    coordinates: [
      [[-5.7, 50.0], [-1.2, 50.8], [1.7, 51.2], [1.5, 52.9], [0.0, 53.5],
       [-3.0, 53.4], [-4.5, 54.4], [-3.0, 55.9], [-5.0, 56.5], [-5.6, 58.6],
       [-3.0, 58.6], [-2.0, 57.7], [-1.8, 55.8], [-5.7, 50.0]]
    ],
  },
  NO: {
    name: 'Norway',
    code: 'NO',
    center: [60.472024, 8.468946],
    coordinates: [
      [[5.0, 58.5], [6.5, 57.9], [7.0, 58.0], [8.0, 58.5], [11.5, 59.0],
       [11.5, 63.5], [14.5, 67.0], [18.0, 69.0], [28.0, 71.0], [31.0, 70.0],
       [29.0, 69.0], [25.0, 68.5], [21.0, 68.5], [18.0, 65.8], [14.0, 65.0],
       [11.0, 62.0], [5.0, 58.5]]
    ],
  },
  FI: {
    name: 'Finland',
    code: 'FI',
    center: [61.92411, 25.748151],
    coordinates: [
      [[21.0, 59.5], [29.0, 59.8], [31.5, 62.5], [30.0, 65.0], [29.0, 69.0],
       [28.0, 70.0], [21.0, 68.5], [20.0, 63.5], [21.0, 59.5]]
    ],
  },
  GR: {
    name: 'Greece',
    code: 'GR',
    center: [39.074208, 21.824312],
    coordinates: [
      [[19.4, 39.8], [20.0, 40.8], [21.0, 40.8], [24.0, 40.5], [26.0, 40.0],
       [26.5, 38.5], [24.0, 37.5], [22.5, 37.0], [21.0, 36.8], [19.5, 37.5],
       [19.4, 39.8]]
    ],
  },
  RO: {
    name: 'Romania',
    code: 'RO',
    center: [45.943161, 24.96676],
    coordinates: [
      [[22.3, 48.1], [24.5, 48.0], [27.0, 48.2], [29.5, 46.3], [29.0, 44.5],
       [28.5, 43.8], [25.5, 43.7], [22.5, 44.1], [21.5, 44.8], [20.8, 45.5],
       [21.2, 46.1], [22.3, 48.1]]
    ],
  },
  BG: {
    name: 'Bulgaria',
    code: 'BG',
    center: [42.733883, 25.48583],
    coordinates: [
      [[22.5, 44.1], [25.5, 43.7], [28.5, 43.8], [28.6, 42.0], [26.5, 41.2],
       [24.0, 41.0], [22.4, 41.0], [22.3, 42.3], [22.5, 44.1]]
    ],
  },
  SK: {
    name: 'Slovakia',
    code: 'SK',
    center: [48.669026, 19.699024],
    coordinates: [
      [[16.9, 48.6], [17.1, 48.0], [18.8, 48.0], [21.0, 48.5], [22.3, 48.1],
       [22.8, 49.0], [18.9, 49.2], [16.9, 48.6]]
    ],
  },
  SI: {
    name: 'Slovenia',
    code: 'SI',
    center: [46.151241, 14.995463],
    coordinates: [
      [[13.7, 46.5], [14.5, 46.4], [16.4, 46.4], [16.0, 45.5], [15.3, 45.5],
       [13.8, 45.6], [13.7, 46.5]]
    ],
  },
  RS: {
    name: 'Serbia',
    code: 'RS',
    center: [44.016521, 21.005859],
    coordinates: [
      [[18.9, 45.9], [21.2, 46.1], [20.8, 45.5], [21.5, 44.8], [22.5, 44.1],
       [22.3, 42.3], [20.5, 42.8], [19.4, 43.5], [19.0, 44.0], [18.9, 45.9]]
    ],
  },
  LT: {
    name: 'Lithuania',
    code: 'LT',
    center: [55.169438, 23.881275],
    coordinates: [
      [[21.0, 56.1], [23.0, 56.4], [26.5, 55.7], [26.8, 54.3], [24.0, 54.0],
       [21.0, 54.2], [21.0, 56.1]]
    ],
  },
  LV: {
    name: 'Latvia',
    code: 'LV',
    center: [56.879635, 24.603189],
    coordinates: [
      [[21.0, 56.1], [21.0, 57.5], [24.0, 57.8], [27.5, 57.5], [28.0, 56.2],
       [26.5, 55.7], [23.0, 56.4], [21.0, 56.1]]
    ],
  },
  EE: {
    name: 'Estonia',
    code: 'EE',
    center: [58.595272, 25.013607],
    coordinates: [
      [[21.0, 57.5], [22.0, 59.5], [27.0, 59.5], [28.0, 58.0], [27.5, 57.5],
       [24.0, 57.8], [21.0, 57.5]]
    ],
  },
  LU: {
    name: 'Luxembourg',
    code: 'LU',
    center: [49.815273, 6.129583],
    coordinates: [
      [[5.7, 49.5], [6.4, 49.5], [6.5, 50.1], [6.0, 50.2], [5.7, 49.5]]
    ],
  },
};

/**
 * Get visited countries from user's checkin history
 * @returns {string[]} Array of country codes the user has visited
 */
export function getVisitedCountries() {
  const state = getState();
  const visitedSet = new Set();

  // Get countries from checkin history
  if (state.checkinHistory && Array.isArray(state.checkinHistory)) {
    state.checkinHistory.forEach(checkin => {
      if (checkin.country) {
        visitedSet.add(checkin.country.toUpperCase());
      }
    });
  }

  // Get countries from spots the user has created
  if (state.spots && Array.isArray(state.spots)) {
    state.spots.forEach(spot => {
      if (spot.creator === state.username && spot.country) {
        visitedSet.add(spot.country.toUpperCase());
      }
    });
  }

  // Add countries from user's badges (e.g., country explorer badges)
  if (state.badges && Array.isArray(state.badges)) {
    state.badges.forEach(badge => {
      if (badge.includes('_explorer')) {
        const countryCode = badge.replace('_explorer', '').toUpperCase();
        if (europeanCountries[countryCode]) {
          visitedSet.add(countryCode);
        }
      }
    });
  }

  return Array.from(visitedSet);
}

/**
 * Get country borders GeoJSON data for a specific country
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {Object|null} GeoJSON feature object or null if not found
 */
export function getCountryBorders(countryCode) {
  if (!countryCode) return null;

  const code = countryCode.toUpperCase();
  const country = europeanCountries[code];

  if (!country) return null;

  return {
    type: 'Feature',
    properties: {
      code: country.code,
      name: country.name,
      center: country.center,
    },
    geometry: {
      type: 'Polygon',
      coordinates: country.coordinates,
    },
  };
}

/**
 * Get all country borders as a GeoJSON FeatureCollection
 * @param {string[]} [countryCodes] - Optional array of country codes to include. If not provided, returns all.
 * @returns {Object} GeoJSON FeatureCollection
 */
export function getAllCountryBorders(countryCodes) {
  const features = [];
  const codes = countryCodes || Object.keys(europeanCountries);

  codes.forEach(code => {
    const border = getCountryBorders(code);
    if (border) {
      features.push(border);
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Render country border layer on the map
 * @param {Object} map - Leaflet map instance
 * @param {Object} L - Leaflet library reference
 * @param {Object} [options] - Rendering options
 * @returns {Object|null} Leaflet GeoJSON layer or null
 */
export function renderBorderLayer(map, L, options = {}) {
  if (!map || !L) return null;

  const {
    showVisited = true,
    onlyVisited = false,
    interactive = true,
    opacity = 1,
  } = options;

  // Remove existing border layer
  if (borderLayer) {
    try {
      map.removeLayer(borderLayer);
    } catch (e) {
      console.warn('Error removing border layer:', e);
    }
    borderLayer = null;
  }

  const visitedCountries = showVisited ? getVisitedCountries() : [];
  const geojsonData = getAllCountryBorders();

  // Filter to only visited if requested
  if (onlyVisited) {
    geojsonData.features = geojsonData.features.filter(feature =>
      visitedCountries.includes(feature.properties.code)
    );
  }

  const styleFunction = (feature) => {
    const isVisited = visitedCountries.includes(feature.properties.code);
    const isHighlighted = highlightedCountry === feature.properties.code;

    let colors;
    if (isHighlighted) {
      colors = COLORS.highlighted;
    } else if (isVisited) {
      colors = COLORS.visited;
    } else {
      colors = COLORS.unvisited;
    }

    return {
      fillColor: colors.fill,
      fillOpacity: opacity,
      color: colors.stroke,
      weight: isHighlighted ? 3 : (isVisited ? 2 : 1),
      opacity: opacity,
    };
  };

  const onEachFeature = (feature, layer) => {
    if (!interactive) return;

    const isVisited = visitedCountries.includes(feature.properties.code);
    const tooltip = `${feature.properties.name} ${isVisited ? '(Visited)' : ''}`;

    layer.bindTooltip(tooltip, {
      permanent: false,
      direction: 'center',
      className: 'country-tooltip',
    });

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          fillOpacity: 0.3,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        borderLayer.resetStyle(e.target);
      },
      click: (e) => {
        const code = feature.properties.code;
        if (window.onCountryClick) {
          window.onCountryClick(code, feature.properties);
        }
      },
    });
  };

  try {
    borderLayer = L.geoJSON(geojsonData, {
      style: styleFunction,
      onEachFeature: onEachFeature,
      coordsToLatLng: (coords) => L.latLng(coords[1], coords[0]),
    }).addTo(map);

    // Send to back so markers are on top
    borderLayer.bringToBack();

    return borderLayer;
  } catch (error) {
    console.error('Error rendering border layer:', error);
    return null;
  }
}

/**
 * Highlight a specific country on the map
 * @param {string} countryCode - ISO 2-letter country code
 * @param {Object} [map] - Leaflet map instance (optional, uses window.spotHitchMap if not provided)
 * @param {Object} [L] - Leaflet library reference (optional)
 * @returns {boolean} Success status
 */
export function highlightCountry(countryCode, map, L) {
  if (!countryCode) {
    highlightedCountry = null;
    return false;
  }

  const code = countryCode.toUpperCase();

  if (!europeanCountries[code]) {
    console.warn(`Country ${code} not found`);
    return false;
  }

  highlightedCountry = code;

  // Re-render layer if available
  const mapInstance = map || window.spotHitchMap;
  if (mapInstance && borderLayer && L) {
    // Reset all styles then apply highlight
    borderLayer.eachLayer((layer) => {
      const featureCode = layer.feature?.properties?.code;
      const visitedCountries = getVisitedCountries();
      const isVisited = visitedCountries.includes(featureCode);
      const isHighlighted = featureCode === code;

      let colors;
      if (isHighlighted) {
        colors = COLORS.highlighted;
      } else if (isVisited) {
        colors = COLORS.visited;
      } else {
        colors = COLORS.unvisited;
      }

      layer.setStyle({
        fillColor: colors.fill,
        color: colors.stroke,
        weight: isHighlighted ? 3 : (isVisited ? 2 : 1),
      });

      if (isHighlighted) {
        layer.bringToFront();
      }
    });
  }

  return true;
}

/**
 * Clear country highlight
 */
export function clearHighlight() {
  highlightedCountry = null;

  if (borderLayer) {
    borderLayer.eachLayer((layer) => {
      const featureCode = layer.feature?.properties?.code;
      const visitedCountries = getVisitedCountries();
      const isVisited = visitedCountries.includes(featureCode);

      const colors = isVisited ? COLORS.visited : COLORS.unvisited;

      layer.setStyle({
        fillColor: colors.fill,
        color: colors.stroke,
        weight: isVisited ? 2 : 1,
      });
    });
  }
}

/**
 * Get countries visible within map bounds
 * @param {Object} bounds - Leaflet LatLngBounds object or {north, south, east, west}
 * @returns {Object[]} Array of country objects within bounds
 */
export function getCountriesInView(bounds) {
  if (!bounds) return [];

  let north, south, east, west;

  // Handle Leaflet bounds object
  if (typeof bounds.getNorth === 'function') {
    north = bounds.getNorth();
    south = bounds.getSouth();
    east = bounds.getEast();
    west = bounds.getWest();
  } else {
    // Handle plain object
    north = bounds.north || bounds._northEast?.lat;
    south = bounds.south || bounds._southWest?.lat;
    east = bounds.east || bounds._northEast?.lng;
    west = bounds.west || bounds._southWest?.lng;
  }

  if (north === undefined || south === undefined || east === undefined || west === undefined) {
    return [];
  }

  const countriesInView = [];

  Object.entries(europeanCountries).forEach(([code, country]) => {
    const [centerLat, centerLng] = country.center;

    // Check if country center is within bounds
    if (centerLat >= south && centerLat <= north && centerLng >= west && centerLng <= east) {
      countriesInView.push({
        code: country.code,
        name: country.name,
        center: country.center,
      });
    }

    // Also check if any part of the country polygon intersects with bounds
    if (!countriesInView.find(c => c.code === code)) {
      const coords = country.coordinates[0];
      for (const [lng, lat] of coords) {
        if (lat >= south && lat <= north && lng >= west && lng <= east) {
          countriesInView.push({
            code: country.code,
            name: country.name,
            center: country.center,
          });
          break;
        }
      }
    }
  });

  return countriesInView;
}

/**
 * Check if coordinates are near a country border
 * @param {Object} coords - {lat, lng} or {latitude, longitude}
 * @param {number} [threshold=0.5] - Distance threshold in degrees (~55km per degree at equator)
 * @returns {Object|null} Nearest border info or null
 */
export function isNearBorder(coords, threshold = 0.5) {
  if (!coords) return null;

  const lat = coords.lat || coords.latitude;
  const lng = coords.lng || coords.longitude;

  if (lat === undefined || lng === undefined) return null;

  let nearestBorder = null;
  let minDistance = Infinity;

  Object.entries(europeanCountries).forEach(([code, country]) => {
    const borderCoords = country.coordinates[0];

    // Check distance to each border segment
    for (let i = 0; i < borderCoords.length - 1; i++) {
      const [lng1, lat1] = borderCoords[i];
      const [lng2, lat2] = borderCoords[i + 1];

      // Calculate distance from point to line segment
      const distance = pointToSegmentDistance(lat, lng, lat1, lng1, lat2, lng2);

      if (distance < minDistance) {
        minDistance = distance;
        nearestBorder = {
          countryCode: code,
          countryName: country.name,
          distance: distance,
          isNear: distance <= threshold,
        };
      }
    }
  });

  if (nearestBorder && nearestBorder.isNear) {
    return nearestBorder;
  }

  return null;
}

/**
 * Calculate distance from a point to a line segment
 * @private
 */
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate projection parameter
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Find nearest point on segment
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  // Return distance
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

/**
 * Get country info by code
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {Object|null} Country info or null
 */
export function getCountryInfo(countryCode) {
  if (!countryCode) return null;

  const code = countryCode.toUpperCase();
  const country = europeanCountries[code];

  if (!country) return null;

  const visitedCountries = getVisitedCountries();

  return {
    code: country.code,
    name: country.name,
    center: country.center,
    isVisited: visitedCountries.includes(code),
  };
}

/**
 * Get all available countries
 * @returns {Object[]} Array of country objects
 */
export function getAllCountries() {
  return Object.entries(europeanCountries).map(([code, country]) => ({
    code: country.code,
    name: country.name,
    center: country.center,
  }));
}

/**
 * Get visited country stats
 * @returns {Object} Stats about visited countries
 */
export function getVisitedCountryStats() {
  const visitedCountries = getVisitedCountries();
  const totalCountries = Object.keys(europeanCountries).length;

  return {
    visited: visitedCountries.length,
    total: totalCountries,
    percentage: Math.round((visitedCountries.length / totalCountries) * 100),
    visitedCodes: visitedCountries,
    remainingCodes: Object.keys(europeanCountries).filter(
      code => !visitedCountries.includes(code)
    ),
  };
}

/**
 * Find country containing a point
 * @param {Object} coords - {lat, lng}
 * @returns {Object|null} Country info or null
 */
export function findCountryAtPoint(coords) {
  if (!coords) return null;

  const lat = coords.lat || coords.latitude;
  const lng = coords.lng || coords.longitude;

  if (lat === undefined || lng === undefined) return null;

  for (const [code, country] of Object.entries(europeanCountries)) {
    if (isPointInPolygon([lng, lat], country.coordinates[0])) {
      return {
        code: country.code,
        name: country.name,
        center: country.center,
      };
    }
  }

  return null;
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 * @private
 */
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Remove border layer from map
 * @param {Object} [map] - Leaflet map instance
 */
export function removeBorderLayer(map) {
  const mapInstance = map || window.spotHitchMap;

  if (borderLayer && mapInstance) {
    try {
      mapInstance.removeLayer(borderLayer);
    } catch (e) {
      console.warn('Error removing border layer:', e);
    }
    borderLayer = null;
  }

  highlightedCountry = null;
}

/**
 * Get current border layer
 * @returns {Object|null} Current Leaflet GeoJSON layer or null
 */
export function getBorderLayer() {
  return borderLayer;
}

/**
 * Check if border layer is active
 * @returns {boolean} True if border layer exists
 */
export function isBorderLayerActive() {
  return borderLayer !== null;
}

/**
 * Get currently highlighted country
 * @returns {string|null} Country code or null
 */
export function getHighlightedCountry() {
  return highlightedCountry;
}

/**
 * Export colors for external use
 */
export const BORDER_COLORS = COLORS;

/**
 * Export European countries data
 */
export const EUROPEAN_COUNTRIES = europeanCountries;

export default {
  getCountryBorders,
  getAllCountryBorders,
  renderBorderLayer,
  highlightCountry,
  clearHighlight,
  getCountriesInView,
  isNearBorder,
  getCountryInfo,
  getAllCountries,
  getVisitedCountries,
  getVisitedCountryStats,
  findCountryAtPoint,
  removeBorderLayer,
  getBorderLayer,
  isBorderLayerActive,
  getHighlightedCountry,
  BORDER_COLORS,
  EUROPEAN_COUNTRIES,
};
