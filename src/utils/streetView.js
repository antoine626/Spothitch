import { icon } from './icons.js'

/**
 * Street View Utility Functions
 * Integration with Google Street View for spot visualization
 */

/**
 * Generate Google Street View URL for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Street View URL
 */
export function getStreetViewUrl(lat, lng) {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

/**
 * Generate Street View static image URL (for preview thumbnails)
 * Note: Requires Google Maps API key for production use
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Options
 * @param {number} options.width - Image width (default 400)
 * @param {number} options.height - Image height (default 200)
 * @param {number} options.heading - Camera heading 0-360 (default 0)
 * @param {number} options.pitch - Camera pitch -90 to 90 (default 0)
 * @param {number} options.fov - Field of view (default 90)
 * @returns {string} Static Street View image URL
 */
export function getStreetViewImageUrl(lat, lng, options = {}) {
  const {
    width = 400,
    height = 200,
    heading = 0,
    pitch = 0,
    fov = 90,
  } = options;

  // Note: This requires a valid API key for production
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!lat || !lng) return null;

  const baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
  const params = new URLSearchParams({
    size: `${width}x${height}`,
    location: `${lat},${lng}`,
    heading: String(heading),
    pitch: String(pitch),
    fov: String(fov),
    key: apiKey,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Street View embed URL for iframe
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Embed URL for iframe
 */
export function getStreetViewEmbedUrl(lat, lng) {
  if (!lat || !lng) return null;

  // Google Maps embed URL with Street View layer
  // Note: For production, consider using the official Embed API
  return `https://www.google.com/maps/embed?pb=!4v0!6m8!1m7!1s!2m2!1d${lat}!2d${lng}!3f0!4f0!5f0.7820865974627469`;
}

/**
 * Check if Street View is likely available at location
 * This is a basic heuristic - actual availability depends on Google's coverage
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether Street View is likely available
 */
export function isStreetViewLikelyAvailable(lat, lng) {
  if (!lat || !lng) return false;

  // Street View is generally available in:
  // - Most of Europe
  // - Urban areas
  // - Major roads

  // Basic check: within reasonable bounds
  const isValidLat = lat >= -90 && lat <= 90;
  const isValidLng = lng >= -180 && lng <= 180;

  return isValidLat && isValidLng;
}

/**
 * Open Street View in a new window
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Window|null} Window reference or null if blocked
 */
export function openStreetView(lat, lng) {
  const url = getStreetViewUrl(lat, lng);
  if (!url) {
    console.warn('Invalid coordinates for Street View');
    return null;
  }
  return window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Render Street View preview component HTML
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Options
 * @param {boolean} options.showButton - Show open button (default true)
 * @param {string} options.buttonText - Button text (default "Ouvrir Street View")
 * @returns {string} HTML string for the preview component
 */
export function renderStreetViewPreview(lat, lng, options = {}) {
  const {
    showButton = true,
    buttonText = 'Ouvrir Street View',
  } = options;

  if (!lat || !lng) {
    return `
      <div class="street-view-unavailable p-4 bg-slate-800/50 rounded-xl text-center">
        ${icon('street-view', 'w-8 h-8 text-slate-500 mb-2')}
        <p class="text-sm text-slate-400">Coordonnees non disponibles</p>
      </div>
    `;
  }

  const streetViewUrl = getStreetViewUrl(lat, lng);

  return `
    <div class="street-view-preview rounded-xl overflow-hidden bg-slate-800/50">
      <div class="relative">
        <!-- Placeholder for Street View -->
        <div class="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center">
          ${icon('street-view', 'w-10 h-10 text-primary-400 mb-3')}
          <p class="text-sm text-slate-300 mb-1">Google Street View</p>
          <p class="text-xs text-slate-500">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>

        ${showButton ? `
          <div class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onclick="openStreetViewWindow(${lat}, ${lng})"
              class="btn btn-primary text-sm"
              type="button"
            >
              ${icon('external-link-alt', 'w-5 h-5')}
              ${buttonText}
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Global handler
window.openStreetViewWindow = (lat, lng) => openStreetView(lat, lng)

export default {
  getStreetViewUrl,
  getStreetViewImageUrl,
  getStreetViewEmbedUrl,
  isStreetViewLikelyAvailable,
  openStreetView,
  renderStreetViewPreview,
};
