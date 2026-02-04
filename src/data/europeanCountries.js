/**
 * European Countries Data
 * ISO 3166-1 alpha-2 country codes with metadata
 */

export const europeanCountries = [
  // Western Europe
  { code: 'FR', name: 'France', nameEn: 'France', emoji: '🇫🇷', capital: 'Paris', region: 'western' },
  { code: 'BE', name: 'Belgique', nameEn: 'Belgium', emoji: '🇧🇪', capital: 'Bruxelles', region: 'western' },
  { code: 'NL', name: 'Pays-Bas', nameEn: 'Netherlands', emoji: '🇳🇱', capital: 'Amsterdam', region: 'western' },
  { code: 'LU', name: 'Luxembourg', nameEn: 'Luxembourg', emoji: '🇱🇺', capital: 'Luxembourg', region: 'western' },
  { code: 'MC', name: 'Monaco', nameEn: 'Monaco', emoji: '🇲🇨', capital: 'Monaco', region: 'western' },

  // Central Europe
  { code: 'DE', name: 'Allemagne', nameEn: 'Germany', emoji: '🇩🇪', capital: 'Berlin', region: 'central' },
  { code: 'CH', name: 'Suisse', nameEn: 'Switzerland', emoji: '🇨🇭', capital: 'Berne', region: 'central' },
  { code: 'AT', name: 'Autriche', nameEn: 'Austria', emoji: '🇦🇹', capital: 'Vienne', region: 'central' },
  { code: 'LI', name: 'Liechtenstein', nameEn: 'Liechtenstein', emoji: '🇱🇮', capital: 'Vaduz', region: 'central' },
  { code: 'PL', name: 'Pologne', nameEn: 'Poland', emoji: '🇵🇱', capital: 'Varsovie', region: 'central' },
  { code: 'CZ', name: 'Tchequie', nameEn: 'Czech Republic', emoji: '🇨🇿', capital: 'Prague', region: 'central' },
  { code: 'SK', name: 'Slovaquie', nameEn: 'Slovakia', emoji: '🇸🇰', capital: 'Bratislava', region: 'central' },
  { code: 'HU', name: 'Hongrie', nameEn: 'Hungary', emoji: '🇭🇺', capital: 'Budapest', region: 'central' },
  { code: 'SI', name: 'Slovenie', nameEn: 'Slovenia', emoji: '🇸🇮', capital: 'Ljubljana', region: 'central' },

  // Southern Europe
  { code: 'ES', name: 'Espagne', nameEn: 'Spain', emoji: '🇪🇸', capital: 'Madrid', region: 'southern' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal', emoji: '🇵🇹', capital: 'Lisbonne', region: 'southern' },
  { code: 'IT', name: 'Italie', nameEn: 'Italy', emoji: '🇮🇹', capital: 'Rome', region: 'southern' },
  { code: 'GR', name: 'Grece', nameEn: 'Greece', emoji: '🇬🇷', capital: 'Athenes', region: 'southern' },
  { code: 'MT', name: 'Malte', nameEn: 'Malta', emoji: '🇲🇹', capital: 'La Valette', region: 'southern' },
  { code: 'CY', name: 'Chypre', nameEn: 'Cyprus', emoji: '🇨🇾', capital: 'Nicosie', region: 'southern' },
  { code: 'AD', name: 'Andorre', nameEn: 'Andorra', emoji: '🇦🇩', capital: 'Andorre-la-Vieille', region: 'southern' },
  { code: 'SM', name: 'Saint-Marin', nameEn: 'San Marino', emoji: '🇸🇲', capital: 'Saint-Marin', region: 'southern' },
  { code: 'VA', name: 'Vatican', nameEn: 'Vatican City', emoji: '🇻🇦', capital: 'Vatican', region: 'southern' },

  // Northern Europe
  { code: 'GB', name: 'Royaume-Uni', nameEn: 'United Kingdom', emoji: '🇬🇧', capital: 'Londres', region: 'northern' },
  { code: 'IE', name: 'Irlande', nameEn: 'Ireland', emoji: '🇮🇪', capital: 'Dublin', region: 'northern' },
  { code: 'DK', name: 'Danemark', nameEn: 'Denmark', emoji: '🇩🇰', capital: 'Copenhague', region: 'northern' },
  { code: 'SE', name: 'Suede', nameEn: 'Sweden', emoji: '🇸🇪', capital: 'Stockholm', region: 'northern' },
  { code: 'NO', name: 'Norvege', nameEn: 'Norway', emoji: '🇳🇴', capital: 'Oslo', region: 'northern' },
  { code: 'FI', name: 'Finlande', nameEn: 'Finland', emoji: '🇫🇮', capital: 'Helsinki', region: 'northern' },
  { code: 'IS', name: 'Islande', nameEn: 'Iceland', emoji: '🇮🇸', capital: 'Reykjavik', region: 'northern' },
  { code: 'EE', name: 'Estonie', nameEn: 'Estonia', emoji: '🇪🇪', capital: 'Tallinn', region: 'northern' },
  { code: 'LV', name: 'Lettonie', nameEn: 'Latvia', emoji: '🇱🇻', capital: 'Riga', region: 'northern' },
  { code: 'LT', name: 'Lituanie', nameEn: 'Lithuania', emoji: '🇱🇹', capital: 'Vilnius', region: 'northern' },

  // Eastern Europe
  { code: 'RO', name: 'Roumanie', nameEn: 'Romania', emoji: '🇷🇴', capital: 'Bucarest', region: 'eastern' },
  { code: 'BG', name: 'Bulgarie', nameEn: 'Bulgaria', emoji: '🇧🇬', capital: 'Sofia', region: 'eastern' },
  { code: 'UA', name: 'Ukraine', nameEn: 'Ukraine', emoji: '🇺🇦', capital: 'Kiev', region: 'eastern' },
  { code: 'MD', name: 'Moldavie', nameEn: 'Moldova', emoji: '🇲🇩', capital: 'Chisinau', region: 'eastern' },
  { code: 'BY', name: 'Bielorussie', nameEn: 'Belarus', emoji: '🇧🇾', capital: 'Minsk', region: 'eastern' },

  // Balkans
  { code: 'HR', name: 'Croatie', nameEn: 'Croatia', emoji: '🇭🇷', capital: 'Zagreb', region: 'balkans' },
  { code: 'BA', name: 'Bosnie-Herzegovine', nameEn: 'Bosnia and Herzegovina', emoji: '🇧🇦', capital: 'Sarajevo', region: 'balkans' },
  { code: 'RS', name: 'Serbie', nameEn: 'Serbia', emoji: '🇷🇸', capital: 'Belgrade', region: 'balkans' },
  { code: 'ME', name: 'Montenegro', nameEn: 'Montenegro', emoji: '🇲🇪', capital: 'Podgorica', region: 'balkans' },
  { code: 'MK', name: 'Macedoine du Nord', nameEn: 'North Macedonia', emoji: '🇲🇰', capital: 'Skopje', region: 'balkans' },
  { code: 'AL', name: 'Albanie', nameEn: 'Albania', emoji: '🇦🇱', capital: 'Tirana', region: 'balkans' },
  { code: 'XK', name: 'Kosovo', nameEn: 'Kosovo', emoji: '🇽🇰', capital: 'Pristina', region: 'balkans' },
];

// Total count of European countries
export const TOTAL_EUROPEAN_COUNTRIES = europeanCountries.length;

/**
 * Get country by code
 * @param {string} code - ISO country code
 * @returns {Object|null} Country object or null
 */
export function getCountryByCode(code) {
  return europeanCountries.find(c => c.code === code) || null;
}

/**
 * Get countries by region
 * @param {string} region - Region name
 * @returns {Object[]} Array of countries
 */
export function getCountriesByRegion(region) {
  return europeanCountries.filter(c => c.region === region);
}

/**
 * Get all regions
 * @returns {string[]} Array of unique region names
 */
export function getAllRegions() {
  return [...new Set(europeanCountries.map(c => c.region))];
}

/**
 * Region display names
 */
export const regionNames = {
  western: 'Europe de l\'Ouest',
  central: 'Europe centrale',
  southern: 'Europe du Sud',
  northern: 'Europe du Nord',
  eastern: 'Europe de l\'Est',
  balkans: 'Balkans',
};

/**
 * Calculate distance between two coordinates (haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Capital coordinates for distance calculation
 */
export const capitalCoordinates = {
  FR: { lat: 48.8566, lng: 2.3522 },
  BE: { lat: 50.8503, lng: 4.3517 },
  NL: { lat: 52.3676, lng: 4.9041 },
  LU: { lat: 49.6116, lng: 6.1319 },
  MC: { lat: 43.7384, lng: 7.4246 },
  DE: { lat: 52.5200, lng: 13.4050 },
  CH: { lat: 46.9481, lng: 7.4474 },
  AT: { lat: 48.2082, lng: 16.3738 },
  LI: { lat: 47.1410, lng: 9.5209 },
  PL: { lat: 52.2297, lng: 21.0122 },
  CZ: { lat: 50.0755, lng: 14.4378 },
  SK: { lat: 48.1486, lng: 17.1077 },
  HU: { lat: 47.4979, lng: 19.0402 },
  SI: { lat: 46.0569, lng: 14.5058 },
  ES: { lat: 40.4168, lng: -3.7038 },
  PT: { lat: 38.7223, lng: -9.1393 },
  IT: { lat: 41.9028, lng: 12.4964 },
  GR: { lat: 37.9838, lng: 23.7275 },
  MT: { lat: 35.8989, lng: 14.5146 },
  CY: { lat: 35.1856, lng: 33.3823 },
  AD: { lat: 42.5063, lng: 1.5218 },
  SM: { lat: 43.9424, lng: 12.4578 },
  VA: { lat: 41.9029, lng: 12.4534 },
  GB: { lat: 51.5074, lng: -0.1278 },
  IE: { lat: 53.3498, lng: -6.2603 },
  DK: { lat: 55.6761, lng: 12.5683 },
  SE: { lat: 59.3293, lng: 18.0686 },
  NO: { lat: 59.9139, lng: 10.7522 },
  FI: { lat: 60.1699, lng: 24.9384 },
  IS: { lat: 64.1466, lng: -21.9426 },
  EE: { lat: 59.4370, lng: 24.7536 },
  LV: { lat: 56.9496, lng: 24.1052 },
  LT: { lat: 54.6872, lng: 25.2797 },
  RO: { lat: 44.4268, lng: 26.1025 },
  BG: { lat: 42.6977, lng: 23.3219 },
  UA: { lat: 50.4501, lng: 30.5234 },
  MD: { lat: 47.0105, lng: 28.8638 },
  BY: { lat: 53.9006, lng: 27.5590 },
  HR: { lat: 45.8150, lng: 15.9819 },
  BA: { lat: 43.8563, lng: 18.4131 },
  RS: { lat: 44.7866, lng: 20.4489 },
  ME: { lat: 42.4304, lng: 19.2594 },
  MK: { lat: 41.9981, lng: 21.4254 },
  AL: { lat: 41.3275, lng: 19.8187 },
  XK: { lat: 42.6629, lng: 21.1655 },
};

/**
 * Get nearest unvisited country
 * @param {number} lat - Current latitude
 * @param {number} lng - Current longitude
 * @param {string[]} visitedCodes - Array of visited country codes
 * @returns {Object|null} Nearest unvisited country with distance
 */
export function getNearestUnvisitedCountry(lat, lng, visitedCodes = []) {
  let nearest = null;
  let minDistance = Infinity;

  for (const country of europeanCountries) {
    if (visitedCodes.includes(country.code)) continue;

    const coords = capitalCoordinates[country.code];
    if (!coords) continue;

    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...country, distance: Math.round(distance) };
    }
  }

  return nearest;
}

export default {
  europeanCountries,
  TOTAL_EUROPEAN_COUNTRIES,
  getCountryByCode,
  getCountriesByRegion,
  getAllRegions,
  regionNames,
  calculateDistance,
  capitalCoordinates,
  getNearestUnvisitedCountry,
};
