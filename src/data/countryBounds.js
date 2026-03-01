/**
 * Country Bounding Boxes
 * Used by offline tile downloader to calculate which map tiles to pre-fetch
 * Matches the 137 countries in spotLoader.js _countryCenters
 *
 * Format: { code: [south, west, north, east] } (latitude/longitude)
 */

const COUNTRY_BOUNDS = {
  // Europe
  FR: [41.3, -5.1, 51.1, 9.6], DE: [47.3, 5.9, 55.1, 15.0],
  ES: [27.6, -18.2, 43.8, 4.3], IT: [36.6, 6.6, 47.1, 18.5],
  NL: [50.8, 3.4, 53.5, 7.2], BE: [49.5, 2.5, 51.5, 6.4],
  PT: [32.6, -31.3, 42.2, -6.2], AT: [46.4, 9.5, 49.0, 17.2],
  CH: [45.8, 5.9, 47.8, 10.5], IE: [51.4, -10.5, 55.4, -5.9],
  PL: [49.0, 14.1, 54.8, 24.1], CZ: [48.6, 12.1, 51.1, 18.9],
  GB: [49.9, -8.6, 60.9, 1.8], SE: [55.3, 11.1, 69.1, 24.2],
  NO: [57.9, 4.6, 71.2, 31.1], DK: [54.6, 8.1, 57.8, 15.2],
  FI: [59.8, 20.6, 70.1, 31.6], HU: [45.7, 16.1, 48.6, 22.9],
  HR: [42.4, 13.5, 46.6, 19.4], RO: [43.6, 20.3, 48.3, 29.7],
  GR: [34.8, 19.4, 41.7, 29.7], BG: [41.2, 22.4, 44.2, 28.6],
  SK: [47.7, 16.8, 49.6, 22.6], SI: [45.4, 13.4, 46.9, 16.6],
  LT: [53.9, 21.0, 56.5, 26.8], LV: [55.7, 21.0, 58.1, 28.2],
  EE: [57.5, 21.8, 59.7, 28.2], LU: [49.4, 5.7, 50.2, 6.5],
  RS: [42.2, 18.8, 46.2, 23.0], BA: [42.6, 15.7, 45.3, 19.6],
  ME: [41.9, 18.5, 43.6, 20.4], MK: [40.9, 20.5, 42.4, 23.0],
  AL: [39.6, 19.3, 42.7, 21.1], XK: [42.0, 20.0, 43.3, 21.8],
  MD: [45.5, 26.6, 48.5, 30.2], UA: [44.4, 22.1, 52.4, 40.2],
  IS: [63.3, -24.5, 66.5, -13.5],
  GE: [41.1, 40.0, 43.6, 46.7], AM: [38.8, 43.4, 41.3, 46.6],
  // Americas
  US: [24.5, -124.8, 49.4, -66.9], CA: [41.7, -141.0, 83.1, -52.6],
  MX: [14.5, -118.4, 32.7, -86.7], BR: [-33.8, -73.9, 5.3, -34.8],
  AR: [-55.1, -73.6, -21.8, -53.6], CL: [-55.9, -75.6, -17.5, -66.4],
  CO: [-4.2, -79.0, 12.5, -66.9], PE: [-18.3, -81.3, -0.0, -68.7],
  EC: [-5.0, -91.7, 1.7, -75.2], BO: [-22.9, -69.6, -9.7, -57.5],
  UY: [-35.0, -58.4, -30.1, -53.1],
  CR: [8.0, -85.9, 11.2, -82.6],
  PA: [7.2, -83.1, 9.6, -77.2], GT: [13.7, -92.2, 17.8, -88.2],
  // Asia
  JP: [24.2, 122.9, 45.6, 153.9], CN: [18.2, 73.5, 53.6, 134.8],
  IN: [6.7, 68.2, 35.5, 97.4], TH: [5.6, 97.3, 20.5, 105.6],
  ID: [-11.0, 95.0, 6.1, 141.0], PH: [4.6, 116.9, 21.1, 126.6],
  VN: [8.6, 102.1, 23.4, 109.5], KH: [10.4, 102.3, 14.7, 107.6],
  MY: [0.9, 99.6, 7.4, 119.3],
  LA: [13.9, 100.1, 22.5, 107.7], LK: [5.9, 79.7, 9.8, 81.9],
  NP: [26.4, 80.1, 30.4, 88.2], KR: [33.1, 124.6, 38.6, 131.9],
  MN: [41.6, 87.7, 52.2, 119.9], KG: [39.2, 69.3, 43.3, 80.3],
  KZ: [40.6, 46.5, 55.4, 87.3], UZ: [37.2, 56.0, 45.6, 73.1],
  TJ: [36.7, 67.4, 41.0, 75.1], PK: [23.7, 60.9, 37.1, 77.8],
  // Middle East
  TR: [36.0, 26.0, 42.1, 44.8], IR: [25.1, 44.0, 39.8, 63.3],
  IL: [29.5, 34.3, 33.3, 35.9], JO: [29.2, 34.9, 33.4, 39.3],
  OM: [16.6, 52.0, 26.4, 59.8],
  // Africa
  MA: [27.7, -13.2, 35.9, -1.0], ZA: [-34.8, 16.5, -22.1, 32.9],
  EG: [22.0, 25.0, 31.7, 36.9],
  KE: [-4.7, 33.9, 5.0, 41.9], TZ: [-11.7, 29.3, -1.0, 40.4],
  GH: [4.7, -3.3, 11.2, 1.2], NG: [4.3, 2.7, 13.9, 14.7],
  NA: [-28.9, 11.7, -16.9, 25.3],
  BW: [-26.9, 20.0, -17.8, 29.4], TN: [30.2, 7.5, 37.3, 11.6], MZ: [-26.9, 30.2, -10.5, 40.8],
  // Oceania
  AU: [-43.6, 113.2, -10.1, 153.6], NZ: [-47.3, 166.4, -34.4, 178.6],
  TW: [21.9, 120.0, 25.3, 122.0],
  // Additional countries
  AD: [42.4, 1.4, 42.7, 1.8], AF: [29.4, 60.5, 38.5, 74.9],
  AO: [-18.0, 11.7, -4.4, 24.1],
  BD: [20.7, 88.0, 26.6, 92.7], BJ: [6.2, 0.8, 12.4, 3.8],
  BN: [4.0, 114.1, 5.0, 115.4], BZ: [15.9, -89.2, 18.5, -87.5],
  CI: [4.4, -8.6, 10.7, -2.5], CM: [1.7, 8.5, 13.1, 16.2],
  CY: [34.6, 32.3, 35.7, 34.6], DM: [15.2, -61.5, 15.6, -61.2],
  DO: [17.5, -72.0, 19.9, -68.3], DZ: [19.0, -8.7, 37.1, 12.0],
  FO: [61.4, -7.5, 62.4, -6.3],
  GD: [12.0, -61.8, 12.3, -61.4], GG: [49.4, -2.7, 49.5, -2.5],
  GL: [59.8, -73.1, 83.6, -12.2], GY: [1.2, -61.4, 8.6, -56.5],
  HN: [12.9, -89.4, 16.0, -83.2], IM: [54.1, -4.8, 54.4, -4.3],
  IQ: [29.1, 38.8, 37.4, 48.6], JE: [49.2, -2.3, 49.3, -2.0],
  LI: [47.1, 9.5, 47.3, 9.6],
  MC: [43.72, 7.39, 43.76, 7.44],
  MR: [14.7, -17.1, 27.3, -4.8], MT: [35.8, 14.2, 36.1, 14.6],
  MU: [-20.5, 56.5, -19.7, 63.5], NI: [10.7, -87.7, 15.0, -82.8],
  RU: [41.2, 19.6, 81.9, -169.0],
  SA: [16.4, 34.6, 32.2, 55.7], SM: [43.89, 12.4, 43.95, 12.5],
  SN: [12.3, -17.5, 16.7, -11.4], SV: [13.2, -90.1, 14.4, -87.7],
  SZ: [-27.3, 30.8, -25.7, 32.1], TG: [6.1, -0.1, 11.1, 1.8],
  TL: [-9.5, 124.0, -8.1, 127.3], TO: [-21.5, -175.7, -15.6, -173.7],
  UG: [-1.5, 29.6, 4.2, 35.0], VC: [12.6, -61.5, 13.4, -61.1],
  XZ: [26.9, 78.4, 36.5, 99.1], ZM: [-18.1, 22.0, -8.2, 33.5],
}

/**
 * Get country bounds with optional buffer (in degrees)
 * @param {string} code - ISO country code
 * @param {number} buffer - Buffer in degrees (default 0.5)
 * @returns {{ south: number, west: number, north: number, east: number } | null}
 */
export function getCountryBoundsBuffered(code, buffer = 0.5) {
  const bounds = COUNTRY_BOUNDS[code?.toUpperCase()]
  if (!bounds) return null
  const [south, west, north, east] = bounds
  return {
    south: south - buffer,
    west: west - buffer,
    north: north + buffer,
    east: east + buffer,
  }
}

/**
 * Get raw bounds (no buffer)
 * @param {string} code
 * @returns {[number, number, number, number] | null} [south, west, north, east]
 */
export function getCountryBoundsRaw(code) {
  return COUNTRY_BOUNDS[code?.toUpperCase()] || null
}

/**
 * Convert longitude to tile X coordinate at a given zoom
 */
export function lng2tile(lon, z) {
  return Math.floor(((lon + 180) / 360) * (1 << z))
}

/**
 * Convert latitude to tile Y coordinate at a given zoom
 */
export function lat2tile(lat, z) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * (1 << z)
  )
}

/**
 * Estimate tile count for a bounding box up to maxZoom
 * @param {{ south: number, west: number, north: number, east: number }} bounds
 * @param {number} maxZoom - Maximum zoom level (default 10)
 * @returns {number} Total estimated tiles
 */
export function estimateTileCount(bounds, maxZoom = 10) {
  if (!bounds) return 0
  let total = 0
  for (let z = 0; z <= maxZoom; z++) {
    const xMin = lng2tile(bounds.west, z)
    const xMax = lng2tile(bounds.east, z)
    const yMin = lat2tile(bounds.north, z) // north = smaller y
    const yMax = lat2tile(bounds.south, z) // south = bigger y
    const cols = Math.abs(xMax - xMin) + 1
    const rows = Math.abs(yMax - yMin) + 1
    total += cols * rows
  }
  return total
}

/**
 * Get list of all supported country codes
 */
export function getAllCountryCodes() {
  return Object.keys(COUNTRY_BOUNDS)
}

export { COUNTRY_BOUNDS }

export default {
  COUNTRY_BOUNDS,
  getCountryBoundsBuffered,
  getCountryBoundsRaw,
  lng2tile,
  lat2tile,
  estimateTileCount,
  getAllCountryCodes,
}
