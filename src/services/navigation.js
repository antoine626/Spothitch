/**
 * GPS Navigation Service
 * Turn-by-turn directions to spots
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// OSRM routing API
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

// Navigation state
let watchId = null;
let currentRoute = null;
let currentStepIndex = 0;

/**
 * Start navigation to a destination
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} destName - Destination name
 */
export async function startNavigation(destLat, destLng, destName = 'Destination') {
  // Check for geolocation support
  if (!navigator.geolocation) {
    showToast(t('gpsNotAvailable') || 'GPS non disponible sur cet appareil', 'error');
    return false;
  }

  // Get current position
  try {
    const position = await getCurrentPosition();
    const { latitude: startLat, longitude: startLng } = position.coords;

    // Calculate route
    const route = await calculateRoute(startLat, startLng, destLat, destLng);

    if (!route) {
      showToast(t('routeCalculationFailed') || 'Impossible de calculer l\'itinéraire', 'error');
      return false;
    }

    currentRoute = route;
    currentStepIndex = 0;

    // Update state with navigation data
    setState({
      navigationActive: true,
      navigationDestination: { lat: destLat, lng: destLng, name: destName },
      navigationRoute: route,
      navigationCurrentStep: 0,
      navigationDistance: route.distance,
      navigationDuration: route.duration,
      navigationInstructions: route.steps,
      userLocation: { lat: startLat, lng: startLng },
    });

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    showToast(t('navigationStarted') || `Navigation vers ${destName} démarrée`, 'success');
    return true;
  } catch (error) {
    console.error('Navigation start error:', error);
    showToast(t('locationError') || 'Erreur de localisation', 'error');
    return false;
  }
}

/**
 * Stop active navigation
 */
export function stopNavigation() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  currentRoute = null;
  currentStepIndex = 0;

  setState({
    navigationActive: false,
    navigationDestination: null,
    navigationRoute: null,
    navigationCurrentStep: 0,
    navigationDistance: null,
    navigationDuration: null,
    navigationInstructions: null,
  });

  showToast(t('navigationStopped') || 'Navigation arrêtée', 'info');
}

/**
 * Get current position as a promise
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

/**
 * Calculate route using OSRM
 * @param {number} startLat
 * @param {number} startLng
 * @param {number} endLat
 * @param {number} endLng
 */
async function calculateRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `${OSRM_API}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry,
      steps: route.legs[0].steps.map((step, index) => ({
        index,
        instruction: translateInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver,
        name: step.name || 'Route',
        coordinates: step.geometry.coordinates[0],
      })),
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

/**
 * Translate OSRM maneuver to French instruction
 */
function translateInstruction(type, modifier, streetName) {
  const street = streetName || (t('navTheRoad') || 'la route');

  const instructions = {
    'depart': (t('navDepart') || 'Partez sur') + ` ${street}`,
    'arrive': t('navArrive') || 'Vous êtes arrivé',
    'turn-left': (t('navTurnLeft') || 'Tournez à gauche sur') + ` ${street}`,
    'turn-right': (t('navTurnRight') || 'Tournez à droite sur') + ` ${street}`,
    'turn-slight left': (t('navSlightLeft') || 'Légèrement à gauche sur') + ` ${street}`,
    'turn-slight right': (t('navSlightRight') || 'Légèrement à droite sur') + ` ${street}`,
    'turn-sharp left': (t('navSharpLeft') || 'Tournez fortement à gauche sur') + ` ${street}`,
    'turn-sharp right': (t('navSharpRight') || 'Tournez fortement à droite sur') + ` ${street}`,
    'turn-uturn': t('navUturn') || 'Faites demi-tour',
    'continue-straight': (t('navContinueStraight') || 'Continuez tout droit sur') + ` ${street}`,
    'continue-': (t('navContinue') || 'Continuez sur') + ` ${street}`,
    'merge-': (t('navMerge') || 'Rejoignez') + ` ${street}`,
    'on ramp-': (t('navOnRamp') || 'Prenez la bretelle vers') + ` ${street}`,
    'off ramp-': (t('navOffRamp') || 'Sortez vers') + ` ${street}`,
    'fork-left': t('navForkLeft') || 'Prenez à gauche à la bifurcation',
    'fork-right': t('navForkRight') || 'Prenez à droite à la bifurcation',
    'fork-': t('navFork') || 'Prenez la bifurcation',
    'end of road-left': t('navEndOfRoadLeft') || 'En fin de route, tournez à gauche',
    'end of road-right': t('navEndOfRoadRight') || 'En fin de route, tournez à droite',
    'roundabout-': (t('navRoundabout') || 'Au rond-point, sortez sur') + ` ${street}`,
    'rotary-': (t('navRoundabout') || 'Au rond-point, sortez sur') + ` ${street}`,
    'new name-': (t('navContinue') || 'Continuez sur') + ` ${street}`,
  };

  const key = modifier ? `${type}-${modifier}` : `${type}-`;
  return instructions[key] || instructions[`${type}-`] || (t('navContinue') || 'Continuez sur') + ` ${street}`;
}

/**
 * Handle position update during navigation
 */
function handlePositionUpdate(position) {
  const { latitude, longitude, heading, speed } = position.coords;

  // Update user location
  setState({
    userLocation: { lat: latitude, lng: longitude },
    userHeading: heading,
    userSpeed: speed,
  });

  if (!currentRoute) return;

  // Check if arrived at destination
  const state = getState();
  const dest = state.navigationDestination;
  const distToDest = calculateDistance(latitude, longitude, dest.lat, dest.lng);

  if (distToDest < 50) { // Within 50 meters
    arrivedAtDestination();
    return;
  }

  // Update remaining distance and time
  const remainingDistance = currentRoute.distance * (1 - currentStepIndex / currentRoute.steps.length);
  const remainingDuration = currentRoute.duration * (1 - currentStepIndex / currentRoute.steps.length);

  // Check if we should advance to next step
  if (currentStepIndex < currentRoute.steps.length - 1) {
    const currentStep = currentRoute.steps[currentStepIndex];
    const nextStep = currentRoute.steps[currentStepIndex + 1];

    if (nextStep?.coordinates) {
      const distToNext = calculateDistance(
        latitude, longitude,
        nextStep.coordinates[1], nextStep.coordinates[0]
      );

      // If closer to next step than current, advance
      const distToCurrent = calculateDistance(
        latitude, longitude,
        currentStep.coordinates[1], currentStep.coordinates[0]
      );

      if (distToNext < distToCurrent && distToNext < 100) {
        currentStepIndex++;
        setState({
          navigationCurrentStep: currentStepIndex,
        });

        // Announce next instruction
        announceInstruction(currentRoute.steps[currentStepIndex]);
      }
    }
  }

  setState({
    navigationDistance: remainingDistance,
    navigationDuration: remainingDuration,
  });
}

/**
 * Handle position error
 */
function handlePositionError(error) {
  console.error('Position error:', error);

  if (error.code === error.PERMISSION_DENIED) {
    showToast(t('gpsAccessDenied') || 'Accès GPS refusé', 'error');
    stopNavigation();
  }
}

/**
 * Called when user arrives at destination
 */
function arrivedAtDestination() {
  const state = getState();
  const destName = state.navigationDestination?.name || 'destination';

  // Play arrival sound and show notification
  if (window.playSound) {
    window.playSound('success');
  }

  showToast(t('arrivedAtDestination') || `Vous êtes arrivé à ${destName}`, 'success');

  // Show confetti celebration
  if (window.launchConfettiBurst) {
    window.launchConfettiBurst();
  }

  stopNavigation();
}

/**
 * Announce instruction (using speech synthesis if available)
 */
function announceInstruction(step) {
  if (!step) return;

  // Try speech synthesis
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(step.instruction);
    const langMap = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE' }
    utterance.lang = langMap[getState().lang] || 'fr-FR';
    utterance.rate = 1.1;
    speechSynthesis.speak(utterance);
  }

  // Also show toast
  showToast(step.instruction, 'info');
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
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
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return t('lessThanOneMin') || 'Moins d\'1 min';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
}

/**
 * Get direction icon for maneuver type
 */
export function getDirectionIcon(maneuverType, modifier) {
  const icons = {
    'turn': modifier?.includes('left') ? 'fa-turn-left' : 'fa-turn-right',
    'continue': 'fa-arrow-up',
    'merge': 'fa-code-merge',
    'fork': modifier?.includes('left') ? 'fa-code-fork fa-flip-horizontal' : 'fa-code-fork',
    'roundabout': 'fa-rotate-right',
    'rotary': 'fa-rotate-right',
    'depart': 'fa-location-dot',
    'arrive': 'fa-flag-checkered',
    'end of road': 'fa-road',
  };

  return icons[maneuverType] || 'fa-arrow-up';
}

/**
 * Open external navigation app
 * @param {number} lat
 * @param {number} lng
 * @param {string} name
 */
export function openExternalNavigation(lat, lng, name) {
  // Detect platform and open appropriate app
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  let url;

  if (isIOS) {
    // Apple Maps
    url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  } else if (isAndroid) {
    // Google Maps app
    url = `google.navigation:q=${lat},${lng}`;
  } else {
    // Fallback to Google Maps web
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  // Try to open the URL
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.click();
}

// Global handlers
window.startNavigation = startNavigation;
window.stopNavigation = stopNavigation;
window.openExternalNavigation = openExternalNavigation;

export default {
  startNavigation,
  stopNavigation,
  formatDistance,
  formatDuration,
  getDirectionIcon,
  openExternalNavigation,
};
