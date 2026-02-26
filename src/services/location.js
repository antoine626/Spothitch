/**
 * Location Service
 * Handles geolocation with explanation before permission request
 */

// NOTE: Do NOT import from state.js here — it causes circular imports.
// Use window.setState / window.getState instead (exposed by main.js).
import { Storage } from '../utils/storage.js';
import { t } from '../i18n/index.js';

// Lazy-load showToast to avoid circular: location -> notifications -> state -> location
let _showToast = null
function showToast(msg, type) {
  if (!_showToast) {
    _showToast = (...args) => {
      import('./notifications.js').then(m => m.showToast(...args)).catch(() => {})
    }
  }
  _showToast(msg, type)
}

/**
 * Helper: call setState without importing state.js (breaks circular import)
 */
function setStateSafe(updates) {
  if (typeof window.setState === 'function') {
    window.setState(updates)
  }
}

/**
 * Helper: replicate actions.setUserLocation without importing state.js
 */
function setUserLocationSafe(location) {
  setStateSafe({
    userLocation: location,
    gpsEnabled: !!location,
  })
  if (location?.lat && location?.lng) {
    import('./proximityVerification.js').then(({ recordLocation }) => {
      recordLocation(location)
    }).catch(() => {})
  }
}

// Storage key for location permission choice
const LOCATION_PERMISSION_KEY = 'location_permission_choice';
const LOCATION_PERMISSION_DATE_KEY = 'location_permission_date';

// How long to remember declined permission (30 days in ms)
const PERMISSION_REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000;

/**
 * Check if user has already made a location permission choice
 * @returns {'granted' | 'denied' | 'unknown'}
 */
export function getLocationPermissionChoice() {
  const choice = Storage.get(LOCATION_PERMISSION_KEY);
  const choiceDate = Storage.get(LOCATION_PERMISSION_DATE_KEY);

  if (!choice || !choiceDate) {
    return 'unknown';
  }

  // If declined, check if we should ask again (after 30 days)
  if (choice === 'denied') {
    const elapsed = Date.now() - choiceDate;
    if (elapsed > PERMISSION_REMEMBER_DURATION) {
      // Clear old choice, ask again
      Storage.remove(LOCATION_PERMISSION_KEY);
      Storage.remove(LOCATION_PERMISSION_DATE_KEY);
      return 'unknown';
    }
  }

  return choice;
}

/**
 * Save user's location permission choice
 * @param {'granted' | 'denied'} choice
 */
export function saveLocationPermissionChoice(choice) {
  Storage.set(LOCATION_PERMISSION_KEY, choice);
  Storage.set(LOCATION_PERMISSION_DATE_KEY, Date.now());
  setStateSafe({ locationPermissionChoice: choice });
}

/**
 * Check browser's geolocation permission status
 * @returns {Promise<'granted' | 'denied' | 'prompt'>}
 */
export async function checkBrowserPermission() {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.warn('Permission API not supported:', error);
    return 'prompt';
  }
}

/**
 * Request location with explanation modal first
 * Shows explanation modal if user hasn't made a choice yet
 * @param {Object} options
 * @param {boolean} options.forceAsk - Force showing the explanation modal
 * @param {Function} options.onSuccess - Callback with position on success
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<GeolocationPosition | null>}
 */
export async function requestLocationWithExplanation(options = {}) {
  const { forceAsk = false, onSuccess, onError } = options;

  // Check if geolocation is available
  if (!navigator.geolocation) {
    const error = new Error(t('locationNotSupported'));
    if (onError) onError(error);
    showToast(t('locationNotSupported'), 'error');
    return null;
  }

  // Check user's previous choice
  const previousChoice = getLocationPermissionChoice();

  // If user already declined and we're not forcing, respect their choice
  if (previousChoice === 'denied' && !forceAsk) {
    const error = new Error(t('locationDeclined'));
    if (onError) onError(error);
    return null;
  }

  // If user already granted, go directly to browser request
  if (previousChoice === 'granted') {
    return requestBrowserLocation({ onSuccess, onError });
  }

  // Check browser's current permission
  const browserPermission = await checkBrowserPermission();

  // If browser already granted, use it directly
  if (browserPermission === 'granted') {
    saveLocationPermissionChoice('granted');
    return requestBrowserLocation({ onSuccess, onError });
  }

  // If browser denied, inform user
  if (browserPermission === 'denied') {
    saveLocationPermissionChoice('denied');
    showToast(t('locationBrowserDenied'), 'warning');
    if (onError) onError(new Error('Browser denied geolocation'));
    return null;
  }

  // Show explanation modal
  setStateSafe({ showLocationPermission: true });

  // Return a promise that resolves when user makes a choice
  return new Promise((resolve) => {
    // Store callbacks for later use
    window._locationPermissionCallbacks = {
      onSuccess: (position) => {
        if (onSuccess) onSuccess(position);
        resolve(position);
      },
      onError: (error) => {
        if (onError) onError(error);
        resolve(null);
      },
    };
  });
}

/**
 * Request location directly from browser
 * @param {Object} options
 * @returns {Promise<GeolocationPosition | null>}
 */
export async function requestBrowserLocation(options = {}) {
  const { onSuccess, onError } = options;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Update state
        setUserLocationSafe(location);
        saveLocationPermissionChoice('granted');

        if (onSuccess) onSuccess(position);
        resolve(position);
      },
      (error) => {
        // Error
        console.error('Geolocation error:', error);

        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('locationPermissionDenied');
            saveLocationPermissionChoice('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('locationUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('locationTimeout');
            break;
          default:
            errorMessage = t('locationError');
        }

        showToast(errorMessage, 'error');
        if (onError) onError(error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  });
}

/**
 * Handle user accepting location permission from modal
 */
export async function handleAcceptLocationPermission() {
  setStateSafe({ showLocationPermission: false });

  const position = await requestBrowserLocation({
    onSuccess: window._locationPermissionCallbacks?.onSuccess,
    onError: window._locationPermissionCallbacks?.onError,
  });

  // Clean up callbacks
  delete window._locationPermissionCallbacks;

  if (position) {
    showToast(t('locationGranted'), 'success');
  }

  return position;
}

/**
 * Handle user declining location permission from modal
 */
export function handleDeclineLocationPermission() {
  setStateSafe({ showLocationPermission: false });
  saveLocationPermissionChoice('denied');

  if (window._locationPermissionCallbacks?.onError) {
    window._locationPermissionCallbacks.onError(new Error('User declined'));
  }

  // Clean up callbacks
  delete window._locationPermissionCallbacks;

  showToast(t('locationDeclinedMessage'), 'info');
}

/**
 * Watch user's position continuously
 * @param {Function} onUpdate - Callback with updated position
 * @returns {number | null} - Watch ID for clearing, or null if not available
 */
export function watchUserLocation(onUpdate) {
  if (!navigator.geolocation) {
    return null;
  }

  const choice = getLocationPermissionChoice();
  if (choice !== 'granted') {
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setUserLocationSafe(location);
      if (onUpdate) onUpdate(location);
    },
    (error) => {
      console.error('Watch position error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );
}

/**
 * Stop watching user's position
 * @param {number} watchId - ID returned by watchUserLocation
 */
export function stopWatchingLocation(watchId) {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Reset location permission choice (for testing/settings)
 */
export function resetLocationPermission() {
  Storage.remove(LOCATION_PERMISSION_KEY);
  Storage.remove(LOCATION_PERMISSION_DATE_KEY);
  setStateSafe({
    locationPermissionChoice: 'unknown',
    userLocation: null,
    gpsEnabled: false,
  });
}

/**
 * Get distance between two coordinates in km
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in km
 */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export default {
  requestLocationWithExplanation,
  requestBrowserLocation,
  handleAcceptLocationPermission,
  handleDeclineLocationPermission,
  watchUserLocation,
  stopWatchingLocation,
  getLocationPermissionChoice,
  saveLocationPermissionChoice,
  resetLocationPermission,
  getDistanceKm,
};
