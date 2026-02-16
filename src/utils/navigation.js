import { icon } from './icons.js'

/**
 * External Navigation Apps Utility
 * Open Google Maps, Waze, or Apple Maps to navigate to a spot
 */

/**
 * Detect user platform
 * @returns {{ isIOS: boolean, isAndroid: boolean, isMac: boolean, isDesktop: boolean }}
 */
export function detectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /android/i.test(ua);
  const isMac = /Mac/.test(navigator.platform);
  const isDesktop = !isIOS && !isAndroid;

  return { isIOS, isAndroid, isMac, isDesktop };
}

/**
 * Open Google Maps with navigation to destination
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {string} name - Optional destination name
 */
export function openInGoogleMaps(lat, lng, name = '') {
  if (!lat || !lng) {
    console.error('Invalid coordinates for Google Maps');
    return false;
  }

  const { isAndroid } = detectPlatform();

  let url;
  if (isAndroid) {
    // Try to open Google Maps app directly on Android
    url = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name || 'Destination')})`;
    // Fallback to Google Maps intent
    const intentUrl = `intent://maps.google.com/maps?daddr=${lat},${lng}&mode=d#Intent;package=com.google.android.apps.maps;scheme=https;end`;

    // Try intent first, fallback to geo
    try {
      window.location.href = intentUrl;
      return true;
    } catch {
      window.location.href = url;
      return true;
    }
  }

  // Universal Google Maps URL (works on web and opens app if installed)
  url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
  return true;
}

/**
 * Open Waze with navigation to destination
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 */
export function openInWaze(lat, lng) {
  if (!lat || !lng) {
    console.error('Invalid coordinates for Waze');
    return false;
  }

  // Waze universal link - works on all platforms
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  window.open(url, '_blank');
  return true;
}

/**
 * Open Apple Maps with navigation to destination (iOS/Mac only)
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {string} name - Optional destination name
 */
export function openInAppleMaps(lat, lng, name = '') {
  if (!lat || !lng) {
    console.error('Invalid coordinates for Apple Maps');
    return false;
  }

  const { isIOS, isMac } = detectPlatform();

  if (!isIOS && !isMac) {
    console.warn('Apple Maps is only available on iOS and macOS');
    // Fallback to Google Maps on non-Apple devices
    return openInGoogleMaps(lat, lng, name);
  }

  // Apple Maps URL scheme
  const url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  window.location.href = url;
  return true;
}

/**
 * Open native maps app (platform-dependent)
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {string} name - Optional destination name
 */
export function openInNativeMaps(lat, lng, name = '') {
  const { isIOS, isMac } = detectPlatform();

  if (isIOS || isMac) {
    return openInAppleMaps(lat, lng, name);
  }

  return openInGoogleMaps(lat, lng, name);
}

/**
 * Get available navigation apps for current platform
 * @returns {Array<{ id: string, name: string, icon: string, color: string }>}
 */
export function getAvailableNavigationApps() {
  const { isIOS, isMac } = detectPlatform();

  const apps = [
    {
      id: 'google-maps',
      name: 'Google Maps',
      icon: 'google',
      iconFallback: 'map-pinned',
      color: '#4285F4',
      bgClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'waze',
      name: 'Waze',
      icon: 'waze',
      iconFallback: 'car',
      color: '#33CCFF',
      bgClass: 'bg-cyan-500 hover:bg-cyan-600',
    },
  ];

  // Add Apple Maps only on iOS/Mac
  if (isIOS || isMac) {
    apps.push({
      id: 'apple-maps',
      name: 'Plans',
      icon: 'apple',
      iconFallback: 'map-pin',
      color: '#000000',
      bgClass: 'bg-slate-700 hover:bg-slate-800',
    });
  }

  return apps;
}

/**
 * Open navigation in selected app
 * @param {string} appId - App identifier ('google-maps', 'waze', 'apple-maps')
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {string} name - Optional destination name
 */
export function openInNavigationApp(appId, lat, lng, name = '') {
  switch (appId) {
    case 'google-maps':
      return openInGoogleMaps(lat, lng, name);
    case 'waze':
      return openInWaze(lat, lng);
    case 'apple-maps':
      return openInAppleMaps(lat, lng, name);
    default:
      return openInGoogleMaps(lat, lng, name);
  }
}

/**
 * Show navigation app picker
 * Stores the selected app preference for future use
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {string} name - Optional destination name
 */
export function showNavigationPicker(lat, lng, name = '') {
  const apps = getAvailableNavigationApps();

  // Check if user has a preferred app
  const preferredApp = localStorage.getItem('spothitch_preferred_nav_app');

  if (preferredApp && apps.find(app => app.id === preferredApp)) {
    openInNavigationApp(preferredApp, lat, lng, name);
    return;
  }

  // Show picker modal
  window.setState?.({
    showNavigationPicker: true,
    navigationPickerData: { lat, lng, name }
  });
}

/**
 * Set preferred navigation app
 * @param {string} appId - App identifier
 */
export function setPreferredNavigationApp(appId) {
  localStorage.setItem('spothitch_preferred_nav_app', appId);
}

/**
 * Get preferred navigation app
 * @returns {string|null}
 */
export function getPreferredNavigationApp() {
  return localStorage.getItem('spothitch_preferred_nav_app');
}

/**
 * Clear preferred navigation app (will show picker next time)
 */
export function clearPreferredNavigationApp() {
  localStorage.removeItem('spothitch_preferred_nav_app');
}

/**
 * Render navigation picker modal HTML
 * @param {{ lat: number, lng: number, name: string }} data
 * @returns {string}
 */
export function renderNavigationPicker(data) {
  const apps = getAvailableNavigationApps();
  const { lat, lng, name } = data || {};

  if (!lat || !lng) return '';

  return `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onclick="closeNavigationPicker()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nav-picker-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel sm:rounded-3xl
          w-full max-w-md p-6 slide-up"
        onclick="event.stopPropagation()"
      >
        <h2 id="nav-picker-title" class="text-xl font-bold mb-2 text-center">
          ${icon('route', 'w-5 h-5 text-primary-400 mr-2')}
          Y aller
        </h2>
        <p class="text-sm text-slate-400 text-center mb-6">
          ${name ? `Naviguer vers <strong class="text-white">${name}</strong>` : 'Choisissez une application de navigation'}
        </p>

        <!-- Navigation Apps -->
        <div class="space-y-3">
          ${apps.map(app => `
            <button
              onclick="selectNavigationApp('${app.id}', ${lat}, ${lng}, '${(name || '').replace(/'/g, "\\'")}')"
              class="w-full flex items-center gap-4 p-4 ${app.bgClass} rounded-xl text-white font-semibold transition-all hover-lift"
              type="button"
            >
              <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                ${icon(app.icon, 'w-7 h-7')}
              </div>
              <span class="flex-1 text-left">${app.name}</span>
              ${icon('chevron-right', 'w-5 h-5 text-white/60')}
            </button>
          `).join('')}
        </div>

        <!-- Remember preference -->
        <div class="mt-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="remember-nav-app"
            class="w-5 h-5 rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500"
          />
          <label for="remember-nav-app" class="text-sm text-slate-400">
            Retenir mon choix pour la prochaine fois
          </label>
        </div>

        <!-- Close button -->
        <button
          onclick="closeNavigationPicker()"
          class="mt-4 w-full btn btn-ghost"
          type="button"
        >
          Annuler
        </button>
      </div>
    </div>
  `;
}

// Register global handlers
if (typeof window !== 'undefined') {
  window.openInGoogleMaps = openInGoogleMaps;
  window.openInWaze = openInWaze;
  window.openInAppleMaps = openInAppleMaps;
  window.openInNativeMaps = openInNativeMaps;
  window.openInNavigationApp = openInNavigationApp;
  window.showNavigationPicker = showNavigationPicker;

  window.selectNavigationApp = (appId, lat, lng, name) => {
    // Check if user wants to remember preference
    const rememberCheckbox = document.getElementById('remember-nav-app');
    if (rememberCheckbox?.checked) {
      setPreferredNavigationApp(appId);
    }

    // Close picker
    window.setState?.({ showNavigationPicker: false, navigationPickerData: null });

    // Open selected app
    openInNavigationApp(appId, lat, lng, name);
  };

  window.closeNavigationPicker = () => {
    window.setState?.({ showNavigationPicker: false, navigationPickerData: null });
  };
}

export default {
  detectPlatform,
  openInGoogleMaps,
  openInWaze,
  openInAppleMaps,
  openInNativeMaps,
  getAvailableNavigationApps,
  openInNavigationApp,
  showNavigationPicker,
  setPreferredNavigationApp,
  getPreferredNavigationApp,
  clearPreferredNavigationApp,
  renderNavigationPicker,
};
