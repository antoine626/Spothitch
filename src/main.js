/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Styles
import './styles/main.css';

// State & Store
import { getState, setState, subscribe, actions } from './stores/state.js';

// Firebase — lazy-loaded to save 115KB gzip on initial load
let _firebase = null
async function getFirebase() {
  if (!_firebase) _firebase = await import('./services/firebase.js')
  return _firebase
}
// Sentry — lazy-loaded (non-critical for FCP)
import { initNotifications, showToast } from './services/notifications.js';
import { initOfflineHandler } from './services/offline.js';
// Map — lazy-loaded (MapLibre is 277KB gzip, defer until map tab)
let _map = null
async function getMap() {
  if (!_map) _map = await import('./services/map.js')
  return _map
}
// Preload map module during idle time (after carousel/onboarding)
function preloadMap() {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => getMap())
  } else {
    setTimeout(() => getMap(), 2000)
  }
}
// Heavy modules — lazy-loaded via dynamic import() to reduce initial bundle
// gamification.js, quiz.js, planner.js, friendChallenges.js loaded on demand
import { searchLocation } from './services/osrm.js';

// i18n
import { t, setLanguage, initI18n } from './i18n/index.js';

// Components
import { renderApp, afterRender } from './components/App.js';
import { initSplashScreen, hideSplashScreen } from './components/SplashScreen.js';

// Data
import { sampleSpots } from './data/spots.js';
// guides.js loaded dynamically to reduce main bundle size

// Utils
import { initSEO, trackPageView } from './utils/seo.js';
import { announceAction, prefersReducedMotion } from './utils/a11y.js';
import { initPWA, showInstallBanner, dismissInstallBanner, installPWA } from './utils/pwa.js';
import { initNetworkMonitor, cleanupOldData } from './utils/network.js';
import { scheduleRender } from './utils/render.js';
import { debounce } from './utils/performance.js';
import { observeAllLazyImages } from './utils/lazyImages.js';
import { initWebVitals } from './utils/webVitals.js';
import { initHoverPrefetch, prefetchNextTab } from './utils/prefetch.js';
import { trackTabChange } from './utils/analytics.js';
import { cleanupDrafts } from './utils/formPersistence.js';
import { initWasm } from './utils/wasmGeo.js';
import { escapeHTML } from './utils/sanitize.js';
import { runAllCleanup } from './utils/cleanup.js';
import { initDeepLinkListener } from './utils/deeplink.js';
import { setupGlobalErrorHandlers as setupErrorHandlers } from './utils/errorBoundary.js';
// animations.js, share.js, confetti.js — lazy-loaded (only triggered by user actions)
import { initAutoOfflineSync } from './services/autoOfflineSync.js';
import { resetFilters as resetFiltersUtil } from './components/modals/Filters.js';
import { redeemReward } from './components/modals/Shop.js';
import './components/modals/Leaderboard.js'; // Register global handlers
import { registerCheckinHandlers } from './components/modals/CheckinModal.js'; // Checkin modal handlers
import { startNavigation, stopNavigation, openExternalNavigation } from './services/navigation.js'; // GPS navigation
import './services/gasStations.js'; // Gas stations (registers window.toggleGasStations)
import {
  initScreenReaderSupport,
  announce as srAnnounce,
  announceViewChange,
} from './services/screenReader.js'; // Accessibility
// proximityAlerts.js — lazy-loaded (init in init(), handlers use dynamic import)
// tripHistory.js, webShare.js — lazy-loaded (only used on specific actions)

// Heavy services — lazy-loaded via dynamic import() to reduce initial bundle
// teamChallenges.js, travelGroups.js, nearbyFriends.js, profileCustomization.js
// spotPagination.js, imageOptimizer.js, dataExport.js loaded on demand
import {
  loadModal,
  preloadModals,
  preloadOnIdle,
} from './utils/lazyLoad.js';
import { icon } from './utils/icons.js'
import {
  startCompanionMode,
  stopCompanionMode,
  checkIn as companionCheckInFn,
  sendAlert as companionSendAlertFn,
  getSMSLink as companionGetSMSLink,
  restoreCompanionMode,
  onOverdue as onCompanionOverdue,
} from './services/companion.js'
import {
  showLoading,
  hideLoading,
  setLoadingMessage,
  setLoadingProgress,
  isLoading,
  withLoading,
} from './components/LoadingIndicator.js';

// ==================== AUTO-UPDATE ====================
// Ensures users ALWAYS get the latest code — no manual cache clearing needed.
// Two mechanisms work together:
// 1. version.json polling — detects new deployments
// 2. SW update listener — detects when new Service Worker is ready

let currentVersion = null
let isReloading = false

function startVersionCheck() {
  const CHECK_INTERVAL = 120_000 // 2 minutes (was 10 — faster updates)
  const BASE = import.meta.env.BASE_URL || '/'
  let lastCheck = 0

  async function checkVersion() {
    if (isReloading) return
    // Debounce: don't check more than once per 30 seconds
    const now = Date.now()
    if (now - lastCheck < 30_000) return
    lastCheck = now
    try {
      const res = await fetch(`${BASE}version.json?t=${now}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!currentVersion) {
        currentVersion = data.version
        return
      }
      if (data.version !== currentVersion) {
        doReload()
      }
    } catch { /* offline or file missing — ignore */ }
  }

  function doReload() {
    if (isReloading) return
    isReloading = true
    if (document.visibilityState === 'hidden') {
      window.location.reload()
    } else {
      window.showToast?.('🔄 ' + (window.t?.('updating') || 'Updating...'), 'info')
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  // Initial check to store current version
  checkVersion()

  // Check regularly — EVEN when app is visible (user won't notice the fetch)
  setInterval(checkVersion, CHECK_INTERVAL)

  // Check when user comes back from background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(checkVersion, 2000)
    }
  })

  // Reload when a NEW Service Worker takes control (not on first install)
  // On first visit, controller is null → skip. On update, controller changes → reload.
  let hadController = !!navigator.serviceWorker?.controller
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (hadController) {
      doReload()
    }
    hadController = true
  })
}

// ==================== BADGING API ====================

/**
 * Update the PWA app badge with the current unread notification count.
 * Uses the Badging API (navigator.setAppBadge) when available.
 * Falls back silently on unsupported browsers.
 * @param {number} count - Number of unread messages/notifications
 */
function updateAppBadge(count) {
  if (!('setAppBadge' in navigator)) return
  try {
    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {})
    } else {
      navigator.clearAppBadge().catch(() => {})
    }
  } catch (_e) {
    // Badging API not available or permission denied — ignore silently
  }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the application
 */
async function init() {
  // Initialize splash screen only if user has already seen the landing carousel
  // (no need for 2 loading screens stacked on each other)
  const landingSeen = localStorage.getItem('spothitch_landing_seen')
  if (landingSeen) {
    initSplashScreen();
    preloadMap() // Returning user — preload map during splash
  }

  // Check for reset parameter in URL
  if (window.location.search.includes('reset')) {
    localStorage.clear();
    window.history.replaceState({}, '', window.location.pathname);
  }

  try {
    // Load detected language translations (only active language, not all 4)
    const lang = await initI18n();
    setState({ lang });
    document.documentElement.lang = lang;

    // Initialize SEO
    initSEO();

    // Check reduced motion preference
    if (prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // === CRITICAL PATH: render first, init services after ===

    // Show landing page for first-time visitors
    if (!localStorage.getItem('spothitch_landing_seen')) {
      setState({ showLanding: true })
    }

    // Initialize offline handler (needed for first render)
    try { initOfflineHandler() } catch (e) { /* optional */ }

    // Subscribe to state changes and render IMMEDIATELY
    subscribe((state) => {
      scheduleRender(() => render(state));
    });

    // Subscribe to unread count changes and update app badge
    let _lastBadgeCount = -1
    subscribe((state) => {
      const count = (state.unreadFriendMessages || 0) + (state.unreadDMCount || 0)
      if (count !== _lastBadgeCount) {
        _lastBadgeCount = count
        updateAppBadge(count)
      }
    });

    // Load initial data (spots) — triggers render via state change
    loadInitialData();

    // === NON-CRITICAL: defer everything else after first paint ===
    requestAnimationFrame(() => setTimeout(async () => {
      try {
        // Screen reader support
        try { initScreenReaderSupport() } catch (e) { /* optional */ }

        // PWA
        try { initPWA() } catch (e) { /* optional */ }

        // Network monitor
        try { initNetworkMonitor() } catch (e) { /* optional */ }

        // Notifications
        try { await initNotifications() } catch (e) { /* optional */ }

        // Error tracking (Sentry)
        try {
          const { initSentry, setupGlobalErrorHandlers } = await import('./services/sentry.js')
          await initSentry()
          setupGlobalErrorHandlers()
        } catch (e) { /* optional */ }

        // Firebase (only if user has a saved session)
        try {
          const hasSession = localStorage.getItem('spothitch_user') || localStorage.getItem('spothitch_firebase_token')
          if (hasSession) {
            const fb = await getFirebase()
            fb.initializeFirebase()
            fb.onAuthChange((user) => {
              actions.setUser(user)
              if (user) {
                setState({
                  currentUser: user,
                  userProfile: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                  },
                })
              } else {
                setState({ currentUser: null, userProfile: null })
              }
              try {
                import('./services/sentry.js').then(m => m.setUser(user))
              } catch (_e) { /* sentry optional */ }
            })
          }
        } catch (e) { /* optional */ }

        // Lazy background services
        try { const { initNearbyFriendsTracking } = await import('./services/nearbyFriends.js'); initNearbyFriendsTracking() } catch (e) { /* optional */ }
        try { const { initProximityAlerts } = await import('./services/proximityAlerts.js'); initProximityAlerts() } catch (e) { /* optional */ }
        try { const { initProximityNotify } = await import('./services/proximityNotify.js'); initProximityNotify() } catch (e) { /* optional */ }
        try { const { initPostHog } = await import('./utils/posthog.js'); initPostHog() } catch (e) { /* optional */ }

        // Preload, cleanup, monitoring
        try { preloadOnIdle() } catch (e) { /* optional */ }
        try { cleanupOldData() } catch (e) { /* optional */ }
        try { initWebVitals() } catch (e) { /* optional */ }
        try { initWasm() } catch (e) { /* optional */ }
        try { initHoverPrefetch() } catch (e) { /* optional */ }
        try { cleanupDrafts() } catch (e) { /* optional */ }
      } catch (e) {
        console.warn('Non-critical init error:', e.message)
      }
    }, 0))

    // Trigger initial render
    scheduleRender(() => render(getState()));

    // Handle deep links from URL params
    try {
      initDeepLinkListener();
    } catch (e) {
      console.warn('Deep link init skipped:', e.message);
    }

    // Setup global error handlers
    try {
      setupErrorHandlers();
    } catch (e) {
      console.warn('Error handlers skipped:', e.message);
    }

    // Hide loader
    hideLoader();

    // Register service worker
    registerServiceWorker();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();


    // Register checkin modal handlers
    try {
      registerCheckinHandlers();
    } catch (e) {
      console.warn('Checkin handlers skipped:', e.message);
    }

    // Initialize auto offline sync
    try {
      initAutoOfflineSync();
    } catch (e) {
      console.warn('Auto offline sync skipped:', e.message);
    }

    // Initialize push notifications (if previously enabled)
    try {
      const { initPushNotifications } = await import('./services/pushNotifications.js')
      initPushNotifications()
    } catch (e) {
      console.warn('Push notifications skipped:', e.message)
    }

    // Restore companion mode if it was active
    try {
      const wasActive = restoreCompanionMode()
      if (wasActive) {
        onCompanionOverdue(() => {
          setState({ showCompanionModal: true })
        })
      }
    } catch (e) {
      console.warn('Companion mode restore skipped:', e.message)
    }

    // Listen for service worker messages (push notification actions)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'COMPANION_CHECKIN') {
          window.companionCheckIn?.()
        } else if (event.data?.type === 'COMPANION_ALERT') {
          window.companionSendAlert?.()
        }
      })
    }

    // Register cleanup on page unload
    window.addEventListener('beforeunload', runAllCleanup);

    // Auto-update check: reload if a new version is deployed
    startVersionCheck()
  } catch (error) {
    console.error('❌ Init error:', error);
    // Show error to user but still try to render
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.innerHTML = `
        <div style="text-align:center;padding:20px">
          <div style="color:#ef4444;font-size:48px;margin-bottom:16px">⚠️</div>
          <div style="color:#fff;font-size:18px;margin-bottom:8px">${t('loadingError') || 'Erreur de chargement'}</div>
          <div style="color:#94a3b8;font-size:14px">${error.message}</div>
          <button onclick="location.reload()" class="reload-btn">${t('retry') || 'Réessayer'}</button>
          <style>.reload-btn{margin-top:16px;padding:8px 16px;background:#f59e0b;color:#fff;
            border:none;border-radius:8px;cursor:pointer}</style>
        </div>
      `;
    }
  }
}

/**
 * Load initial spot data
 */
function loadInitialData() {
  // Load sample spots for demo
  actions.setSpots(sampleSpots);

  // Load saved trips from localStorage
  try {
    const savedTrips = JSON.parse(localStorage.getItem('spothitch_saved_trips') || '[]')
    if (savedTrips.length > 0) setState({ savedTrips })
  } catch (e) { /* no-op */ }

  // Try to get user location and load nearby spots
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        actions.setUserLocation(loc)
        // Load nearby spots for the new home view
        loadNearbySpots(loc)
      },
      () => {
        // Location not available - continue without
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}

/**
 * Load spots near a location via spotLoader
 */
async function loadNearbySpots(loc) {
  try {
    const { loadSpotsInBounds } = await import('./services/spotLoader.js')
    const bounds = {
      north: loc.lat + 3,
      south: loc.lat - 3,
      east: loc.lng + 3,
      west: loc.lng - 3,
    }
    const spots = await loadSpotsInBounds(bounds)
    if (spots.length > 0) {
      const current = getState().spots || []
      const existingIds = new Set(current.map(s => s.id))
      const newSpots = spots.filter(s => !existingIds.has(s.id))
      if (newSpots.length > 0) {
        actions.setSpots([...current, ...newSpots])
      }
    }
  } catch (e) {
    console.warn('loadNearbySpots failed:', e)
  }
}

/**
 * Hide the loading screen (splash screen)
 */
function hideLoader() {
  // Use the splash screen hide function
  hideSplashScreen();
}

// Scroll position storage
const scrollPositions = new Map();
let previousTab = null;

/**
 * Save scroll position for current tab
 */
function saveScrollPosition(tab) {
  if (tab) {
    scrollPositions.set(tab, window.scrollY || document.documentElement.scrollTop || 0);
  }
}

/**
 * Restore scroll position for tab
 */
function restoreScrollPosition(tab) {
  const saved = scrollPositions.get(tab);
  if (saved !== undefined) {
    window.scrollTo(0, saved);
  }
}

/**
 * Main render function
 */
function render(state) {
  const app = document.getElementById('app');
  if (!app) return;

  // Skip re-render if user is typing in any input (prevents losing input focus/value)
  const focused = document.activeElement
  if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA' || focused.tagName === 'SELECT')) {
    return
  }

  // Save scroll position before EVERY re-render (not just tab changes)
  const savedScroll = window.scrollY || document.documentElement.scrollTop || 0
  if (previousTab && previousTab !== state.activeTab) {
    saveScrollPosition(previousTab)
  }

  // Preserve map containers across re-renders to avoid destroying MapLibre
  const isMapTab = ['map', 'home', 'fullmap', 'travel', 'planner'].includes(state.activeTab)
  const homeMapContainer = document.getElementById('home-map')
  const hasHomeMap = homeMapContainer && window.homeMapInstance
  const savedHomeMap = hasHomeMap ? homeMapContainer : null

  // Preserve trip map container (avoids white flash on every state change)
  const tripMapContainer = document.getElementById('trip-map')
  const hasTripMap = tripMapContainer && tripMapContainer.dataset.initialized === 'true'
  const savedTripMap = hasTripMap ? tripMapContainer : null

  app.innerHTML = renderApp(state);

  // Re-insert preserved map containers
  if (savedHomeMap && isMapTab) {
    const slot = document.getElementById('home-map')
    if (slot) slot.replaceWith(savedHomeMap)
  }
  if (savedTripMap && state.showTripMap) {
    const slot = document.getElementById('trip-map')
    if (slot) {
      slot.replaceWith(savedTripMap)
      // Force MapLibre to repaint after DOM reinsertion
      requestAnimationFrame(() => window._tripMapResize?.())
    }
  }

  // Call afterRender hook
  afterRender(state);

  // Observe lazy images after DOM update
  requestAnimationFrame(() => observeAllLazyImages());

  // Track tab changes for analytics
  if (previousTab !== state.activeTab) {
    trackTabChange(state.activeTab);
    prefetchNextTab(state.activeTab);
  }

  // Restore scroll position after render
  if (previousTab !== state.activeTab) {
    setTimeout(() => restoreScrollPosition(state.activeTab), 50)
  } else {
    // Same tab: restore exact scroll position (prevents jump to top)
    requestAnimationFrame(() => {
      if (savedScroll > 0) {
        window.scrollTo(0, savedScroll)
      }
    })
  }
  previousTab = state.activeTab;

  // Initialize map service for spots view
  if (state.activeTab === 'spots' && state.viewMode === 'map') {
    getMap().then(m => m.initMap());
  }
}

/**
 * Register service worker — non-aggressive update strategy
 * New SW activates on next natural page load, no forced reloads
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')

    // Check for SW updates every 2 minutes
    setInterval(() => registration.update(), 2 * 60 * 1000)

    // Check for updates when user returns to the app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })

    // Check on online recovery
    window.addEventListener('online', () => registration.update())

    // When a new SW is found, it will skipWaiting (configured in vite.config.js)
    // Then controllerchange fires → handled in startVersionCheck() → auto-reload
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      setState({
        showAddSpot: false,
        showRating: false,
        showSOS: false,
        showSettings: false,
        showQuiz: false,
        showAuth: false,
        showBadges: false,
        showChallenges: false,
        showShop: false,
        showMyRewards: false,
        showStats: false,
        showFilters: false,
        showSideMenu: false,
        showLeaderboard: false,
        showDonation: false,
        showCompanionModal: false,
        selectedSpot: null,
      });
    }

    // Ctrl+K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('#search-input');
      if (searchInput) searchInput.focus();
    }
  });
}

// ==================== GLOBAL HANDLERS ====================

// Make functions available globally for onclick handlers

// Reset App
window.resetApp = () => {
  if (confirm(t('resetAppConfirm') || 'Réinitialiser l\'application ? Toutes les données locales seront effacées.')) {
    localStorage.clear();
    location.reload();
  }
};

// Navigation
window.changeTab = (tab) => {
  actions.changeTab(tab);
  trackPageView(tab);
  announceViewChange(tab);
};

// Open full map (from home)
window.openFullMap = () => {
  setState({ activeTab: 'spots', viewMode: 'map' });
  trackPageView('spots-map');
  // Initialize map after DOM update
  setTimeout(() => {
    getMap().then(m => m.initMap());
  }, 200);
};
window.toggleTheme = () => actions.toggleTheme();
window.setViewMode = (mode) => {
  setState({ viewMode: mode });
  // Initialize map after DOM update
  if (mode === 'map') {
    setTimeout(() => getMap().then(m => m.initMap()), 100);
  }
};
window.t = t;
window.setState = setState;
window.getState = getState;
window.showToast = showToast;

// Spot handlers
window.selectSpot = async (id) => {
  const { spots } = getState();
  // eslint-disable-next-line eqeqeq
  let spot = spots.find(s => s.id === id || s.id == id);
  // Also check dynamically loaded spots
  if (!spot) {
    try {
      const { getAllLoadedSpots: getAll } = await import('./services/spotLoader.js');
      const allLoaded = getAll();
      // eslint-disable-next-line eqeqeq
      spot = allLoaded.find(s => s.id === id || s.id == id);
    } catch (e) { /* spotLoader not available */ }
  }
  if (spot) {
    actions.selectSpot(spot);
    getMap().then(m => m.centerOnSpot(spot));
  }
};
window.openSpotDetail = window.selectSpot; // alias for services that use openSpotDetail
window.closeSpotDetail = () => actions.selectSpot(null);
window.openAddSpot = () => {
  // Test mode bypass — activate via console: localStorage.setItem('spothitch_test_mode', 'true')
  const isTestMode = localStorage.getItem('spothitch_test_mode') === 'true'

  if (isTestMode) {
    // Skip auth in test mode but still require profile
    if (!window.requireProfile('addSpot')) return
    setState({ showAddSpot: true, addSpotPreview: false, addSpotStep: 1, addSpotType: null })
    return
  }

  // Production: require real authentication (Google/Facebook/Apple/Email)
  const { isLoggedIn } = getState()
  if (!isLoggedIn) {
    setState({
      showAuth: true,
      authPendingAction: 'addSpot',
      showAuthReason: t('authRequiredAddSpot') || 'Connecte-toi pour partager un spot',
    })
    return
  }

  // Authenticated — also require profile (username)
  if (!window.requireProfile('addSpot')) return
  setState({ showAddSpot: true, addSpotPreview: false, addSpotStep: 1, addSpotType: null })
}
window.openAddSpotPreview = () => setState({ showAddSpot: true, addSpotPreview: true });
window.closeAddSpot = () => setState({ showAddSpot: false, addSpotPreview: false, addSpotStep: 1, addSpotType: null });

// Location Permission handlers
window.acceptLocationPermission = async () => {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })
    setState({
      showLocationPermission: false,
      locationPermissionGranted: true,
      userLocation: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    })
    showToast(t('locationEnabled') || 'Localisation activée !', 'success')
  } catch (error) {
    console.error('Geolocation error:', error)
    showToast(t('locationFailed') || 'Impossible d\'obtenir la localisation', 'error')
    setState({ showLocationPermission: false })
  }
}
window.declineLocationPermission = () => {
  setState({ showLocationPermission: false, locationPermissionDenied: true })
  showToast(t('locationLater') || 'Vous pouvez activer la localisation plus tard dans les paramètres', 'info')
}
window.openRating = (spotId) => setState({ showRating: true, ratingSpotId: spotId });
window.closeRating = () => setState({ showRating: false, ratingSpotId: null });
window.openNavigation = (lat, lng) => {
  if (lat && lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }
};
window.getSpotLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const latInput = document.getElementById('spot-lat');
        const lngInput = document.getElementById('spot-lng');
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
        showToast(t('positionRetrieved') || 'Position récupérée !', 'success');
      },
      () => showToast(t('positionFailed') || 'Impossible de récupérer la position', 'error'),
      { enableHighAccuracy: true }
    );
  }
};
// AddSpot 3-step form handlers → defined in AddSpot.js (with validation)
window.doCheckin = async (spotId) => {
  const { recordCheckin } = await import('./services/gamification.js')
  recordCheckin()
  getFirebase().then(fb => fb.saveValidationToFirebase(spotId, getState().user?.uid))
  showToast(t('checkinSuccess'), 'success')
  announceAction('checkin', true)

  // Show share card after checkin
  const { spots } = getState()
  const spot = spots.find(s => s.id === spotId)
  if (spot) {
    setTimeout(async () => {
      try {
        const { showShareModal } = await import('./services/shareCard.js')
        showShareModal(spot)
      } catch (err) {
        console.warn('Failed to show share modal:', err)
      }
    }, 500)
  }
  // Log to trip history
  try {
    const { logTripEvent } = await import('./services/tripHistory.js')
    logTripEvent('checkin', { spotId })
  } catch (e) { /* trip history optional */ }
};
window.submitReview = async (spotId) => {
  if (!window.requireProfile('review')) return
  const comment = document.getElementById('review-comment')?.value
  const rating = getState().currentRating || 4
  if (comment) {
    // Proximity check for reviews
    const spot = getState().selectedSpot
    const spotLat = spot?.coordinates?.lat || spot?.lat
    const spotLng = spot?.coordinates?.lng || spot?.lng
    if (spotLat && spotLng) {
      const { checkProximity } = await import('./services/proximityVerification.js')
      const proximity = checkProximity(spotLat, spotLng, getState().userLocation)
      if (!proximity.allowed) {
        showToast(t('proximityRequired') || `Tu dois être passé à moins de 5 km de ce spot dans les dernières 24h (${proximity.distanceKm} km)`, 'error')
        return
      }
    }
    const fb1 = await getFirebase()
    await fb1.saveCommentToFirebase({ spotId, text: comment, rating })
    const { recordReview } = await import('./services/gamification.js')
    recordReview()
    showToast(t('reviewPublished') || 'Avis publié !', 'success')
    setState({ showRating: false })
  }
};
window.setRating = (rating) => setState({ currentRating: rating });
window.reportSpotAction = async (spotId) => {
  const reason = prompt(t('reportReason') || 'Raison du signalement ?');
  if (reason) {
    const fb2 = await getFirebase()
    await fb2.reportSpot(spotId, reason);
    showToast(t('reportSent') || 'Signalement envoyé', 'success');
  }
};

// Navigation GPS handlers
window.startSpotNavigation = async (lat, lng, name) => {
  if (!lat || !lng) {
    showToast(t('missingCoordinates') || 'Coordonnées manquantes', 'error');
    return;
  }
  // Close spot detail modal
  setState({ selectedSpot: null });
  // Start navigation
  await startNavigation(lat, lng, name || t('hitchhikingSpot') || 'Spot d\'autostop');
};
window.stopNavigation = stopNavigation;
window.openExternalNavigation = openExternalNavigation;

// SOS handlers
window.openSOS = async () => {
  setState({ showSOS: true });
  try {
    const { triggerSOSTip } = await import('./services/contextualTips.js');
    triggerSOSTip();
  } catch (e) { /* no-op */ }
};
window.closeSOS = () => setState({ showSOS: false });

// Missing handlers (prevent ReferenceError on click)
window.openAccessibilityHelp = () => showToast(t('accessibilityHelp') || 'Accessibilité : utilise les raccourcis clavier et le zoom du navigateur', 'info')
window.showFriendOptions = () => showToast(t('friendOptionsSoon') || 'Options ami bientôt disponibles', 'info')
window.showFullNavigation = () => window.changeTab('map')
// SOS fallbacks — overridden by SOS.js when modal loads
if (!window.shareSOSLocation) {
  window.shareSOSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const url = `https://www.google.com/maps?q=${latitude},${longitude}`
          if (navigator.share) {
            navigator.share({ title: 'SOS - SpotHitch', text: t('sosShareText') || 'Position urgence', url })
          } else {
            navigator.clipboard.writeText(url)
            showToast(t('linkCopied') || 'Lien copié !', 'success')
          }
        },
        () => showToast(t('positionFailed') || 'Position indisponible', 'error')
      )
    }
  }
}
if (!window.markSafe) {
  window.markSafe = () => {
    setState({ sosActive: false })
    showToast(t('markedSafe') || 'Marqué en sécurité', 'success')
  }
}
if (!window.addEmergencyContact) {
  window.addEmergencyContact = () => {
    const name = document.getElementById('emergency-name')?.value
    const phone = document.getElementById('emergency-phone')?.value
    if (!name || !phone) { showToast(t('fillNameAndNumber') || 'Nom et numéro requis', 'warning'); return }
    const { emergencyContacts = [] } = getState()
    setState({ emergencyContacts: [...emergencyContacts, { name, phone }] })
    document.getElementById('emergency-name').value = ''
    document.getElementById('emergency-phone').value = ''
    showToast(t('contactAdded') || 'Contact ajouté !', 'success')
  }
}
if (!window.removeEmergencyContact) {
  window.removeEmergencyContact = (index) => {
    const { emergencyContacts = [] } = getState()
    setState({ emergencyContacts: emergencyContacts.filter((_, i) => i !== index) })
  }
}

// Auth handlers
window.openAuth = (reason) => {
  const updates = { showAuth: true }
  if (reason) updates.showAuthReason = reason
  setState(updates)
}
window.closeAuth = () => setState({ showAuth: false, authPendingAction: null, showAuthReason: null })
window.setAuthMode = (mode) => setState({ authMode: mode })
// Email login/signup is handled by Auth.js via window.handleAuth (with executePendingAction)
// Social auth handlers are defined in Auth.js (handleGoogleSignIn, handleAppleSignIn, handleFacebookSignIn)
// Fallback registrations in case Auth.js hasn't loaded yet — must also resume authPendingAction
if (!window.handleGoogleSignIn) {
  window.handleGoogleSignIn = async () => {
    const fb = await getFirebase()
    fb.initializeFirebase()
    const result = await fb.signInWithGoogle()
    if (result.success) {
      await fb.createOrUpdateUserProfile(result.user)
      fb.onAuthChange((user) => actions.setUser(user))
      const pendingAction = getState().authPendingAction
      setState({ showAuth: false, authPendingAction: null, showAuthReason: null })
      showToast(t('googleLoginSuccess') || 'Google login successful!', 'success')
      if (pendingAction === 'addSpot') setTimeout(() => window.openAddSpot?.(), 300)
    } else {
      showToast(t('googleLoginError') || 'Google login error', 'error')
    }
  }
}
if (!window.handleFacebookSignIn) {
  window.handleFacebookSignIn = async () => {
    const fb = await getFirebase()
    fb.initializeFirebase()
    const result = await fb.signInWithFacebook()
    if (result.success) {
      await fb.createOrUpdateUserProfile(result.user)
      fb.onAuthChange((user) => actions.setUser(user))
      const pendingAction = getState().authPendingAction
      setState({ showAuth: false, authPendingAction: null, showAuthReason: null })
      showToast(t('facebookLoginSuccess') || 'Facebook login successful!', 'success')
      if (pendingAction === 'addSpot') setTimeout(() => window.openAddSpot?.(), 300)
    } else {
      showToast(t('facebookLoginError') || 'Facebook login error', 'error')
    }
  }
}
if (!window.handleAppleSignIn) {
  window.handleAppleSignIn = async () => {
    const fb = await getFirebase()
    fb.initializeFirebase()
    const result = await fb.signInWithApple()
    if (result.success) {
      await fb.createOrUpdateUserProfile(result.user)
      fb.onAuthChange((user) => actions.setUser(user))
      const pendingAction = getState().authPendingAction
      setState({ showAuth: false, authPendingAction: null, showAuthReason: null })
      showToast(t('appleLoginSuccess') || 'Apple login successful!', 'success')
      if (pendingAction === 'addSpot') setTimeout(() => window.openAddSpot?.(), 300)
    } else {
      showToast(t('authError'), 'error')
    }
  }
}
// Keep handleAppleLogin as alias for backward compat
window.handleAppleLogin = () => window.handleAppleSignIn?.()
// Auth fallbacks — overridden by Auth.js/Profile.js when loaded
if (!window.handleForgotPassword) {
  window.handleForgotPassword = async () => {
    const email = document.querySelector('[name="email"]')?.value || document.getElementById('auth-email')?.value
    if (!email) { showToast(t('enterEmailFirst') || 'Enter your email first', 'warning'); return }
    const fb = await getFirebase()
    fb.initializeFirebase()
    const result = await fb.resetPassword(email)
    if (result.success) showToast(t('resetEmailSent') || 'Password reset email sent!', 'success')
    else showToast(t('sendError') || 'Error sending email', 'error')
  }
}
if (!window.handleLogout) {
  window.handleLogout = async () => {
    const fb = await getFirebase()
    await fb.logOut()
    actions.setUser(null)
    setState({ currentUser: null, userProfile: null })
    showToast(t('logoutSuccess') || 'Logged out', 'success')
  }
}
// Progressive Auth Gate — exposed globally
window.requireAuth = (actionName) => {
  const { isLoggedIn } = getState()
  if (isLoggedIn) return true

  const reasonMap = {
    addSpot: t('authRequiredAddSpot'),
    validateSpot: t('authRequiredAddSpot'),
    saveFavorite: t('authRequiredFavorite'),
    sos: t('authRequiredSOS'),
    companion: t('authRequiredCompanion'),
    social: t('authRequiredSocial'),
    tripPlanner: t('authRequiredSocial'),
    checkin: t('authRequiredAddSpot'),
  }
  setState({
    showAuth: true,
    authPendingAction: actionName,
    showAuthReason: reasonMap[actionName] || t('loginRequired'),
  })
  return false
}

// Age Verification handlers (RGPD/GDPR)
window.openAgeVerification = () => {
  setState({ showAgeVerification: true });
  // Initialize the date input field on next render
  setTimeout(() => {
    const initAgeVerification = window.initAgeVerification;
    if (initAgeVerification) initAgeVerification();
  }, 100);
};
window.closeAgeVerification = () => setState({ showAgeVerification: false });
window.showAgeVerification = () => window.openAgeVerification();

// Identity Verification handlers (Security - Progressive Trust System 0-5)
window.openIdentityVerification = () => {
  // Reset modal state
  window.identityVerificationState = {
    currentStep: 'overview',
    phoneNumber: '',
    verificationCode: '',
    photoPreview: null,
    documentType: 'id_card',
    documentPreview: null,
    selfieIdStep: 1,
    selfiePhoto: null,
    idCardPhoto: null,
    selfieWithIdPhoto: null,
    isLoading: false,
    error: null,
  };
  setState({ showIdentityVerification: true });
};
window.closeIdentityVerification = () => setState({ showIdentityVerification: false });
window.showIdentityVerification = () => window.openIdentityVerification();

// Identity Verification - New handlers for Selfie + ID flow
window.startIdentityVerification = () => {
  window.openIdentityVerification();
};

window.submitVerificationPhotos = async () => {
  const state = window.identityVerificationState;
  if (!state || !state.selfiePhoto || !state.idCardPhoto || !state.selfieWithIdPhoto) {
    showToast(t('photosRequired') || 'Toutes les photos sont requises', 'error');
    return;
  }

  const { uploadSelfieIdVerification } = await import('./services/identityVerification.js');
  const result = await uploadSelfieIdVerification({
    selfie: state.selfiePhoto,
    idCard: state.idCardPhoto,
    selfieWithId: state.selfieWithIdPhoto,
  });

  if (result.success) {
    showToast(t('photosSubmitted') || 'Photos soumises avec succes !', 'success');
    window.closeIdentityVerification();
  } else {
    showToast(t('submissionError') || 'Erreur lors de la soumission', 'error');
  }
};

window.getTrustLevel = () => {
  const state = getState();
  return state.trustLevel || state.verificationLevel || 0;
};

window.getTrustBadge = async (level = null) => {
  const { getTrustBadge } = await import('./services/identityVerification.js');
  return getTrustBadge(level);
};

// Welcome / Profile Setup handlers
window.selectAvatar = (avatar) => {
  setState({ selectedAvatar: avatar })
}
window.completeWelcome = () => {
  const usernameInput = document.getElementById('welcome-username')
  const username = usernameInput?.value.trim() || t('traveler') || 'Traveler'
  const { selectedAvatar, pendingProfileAction } = getState()
  setState({
    username,
    avatar: selectedAvatar || '🤙',
    showWelcome: false,
    pendingProfileAction: null,
  })
  showToast(`${t('welcome') || 'Welcome'} ${username} !`, 'success')
  // Resume the action that required a profile
  if (pendingProfileAction === 'addSpot') {
    setTimeout(() => window.openAddSpot?.(), 300)
  }
}
window.skipWelcome = () => {
  setState({ showWelcome: false, pendingProfileAction: null })
}
// Require profile before contributing — returns true if profile exists
window.requireProfile = (action) => {
  const state = getState()
  if (state.username) return true
  setState({ showWelcome: true, pendingProfileAction: action || null })
  return false
}

// Settings handlers
window.openSettings = () => setState({ showSettings: true });
window.closeSettings = () => setState({ showSettings: false });
window.setLanguage = async (lang) => {
  // Write lang directly to localStorage BEFORE anything else
  // This ensures it survives the reload regardless of state/render timing
  try {
    const stored = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
    stored.lang = lang
    localStorage.setItem('spothitch_v4_state', JSON.stringify(stored))
  } catch (e) { /* no-op */ }
  // Load new language translations then reload
  await setLanguage(lang)
  // Force full page reload to apply translations everywhere
  window.location.href = window.location.href.split('#')[0]
};

// Tutorial handlers
window.startTutorial = () => {
  setState({ showTutorial: true, tutorialStep: 0 });
  // Go to map tab for tutorial
  actions.changeTab('map');
  // Position spotlight after render
  import('./components/modals/Tutorial.js').then(({ executeStepAction }) => {
    executeStepAction(0);
  });
};
window.nextTutorial = () => {
  const { tutorialStep } = getState();
  const newStep = (tutorialStep || 0) + 1;

  // Import tutorial to check step count and execute action
  import('./components/modals/Tutorial.js').then(({ tutorialSteps, executeStepAction }) => {
    if (newStep >= tutorialSteps.length) {
      window.finishTutorial();
    } else {
      setState({ tutorialStep: newStep });
      executeStepAction(newStep);
    }
  });
};
window.prevTutorial = () => {
  const { tutorialStep } = getState();
  const newStep = Math.max(0, (tutorialStep || 0) - 1);
  setState({ tutorialStep: newStep });
  import('./components/modals/Tutorial.js').then(({ executeStepAction }) => {
    executeStepAction(newStep);
  });
};
window.skipTutorial = () => {
  // Clean up tutorial targets
  import('./components/modals/Tutorial.js').then(({ cleanupTutorialTargets }) => {
    cleanupTutorialTargets();
  });
  setState({ showTutorial: false, tutorialStep: 0 });
  actions.changeTab('map');
  showToast(t('tutorialSkipped') || 'Tutoriel passé. Tu peux le relancer depuis le Profil.', 'info');
};
window.finishTutorial = async () => {
  const state = getState()
  const tutorialCompleted = state.tutorialCompleted

  // Clean up tutorial targets
  import('./components/modals/Tutorial.js').then(({ cleanupTutorialTargets }) => {
    cleanupTutorialTargets()
  })

  setState({ showTutorial: false, tutorialStep: 0, tutorialCompleted: true })
  actions.changeTab('map')

  // Award rewards if first time completing
  if (!tutorialCompleted) {
    const { addPoints, addSeasonPoints } = await import('./services/gamification.js')
    addPoints(100, 'tutorial_complete')
    addSeasonPoints(20)
    showToast(t('tutorialCompleted') || 'Tutoriel termine ! +100 👍 bonus !', 'success')
    // Trigger confetti
    if (window.launchConfetti) {
      window.launchConfetti()
    }
  } else {
    showToast(t('tutorialReviewed') || 'Tutoriel revu ! Bonne route !', 'success')
  }
};

// Chat handlers
window.setChatRoom = (room) => setState({ chatRoom: room });
window.sendMessage = async () => {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text) return;
  const { chatRoom } = getState();
  const fbChat = await getFirebase()
  await fbChat.sendChatMessage(chatRoom || 'general', text);
  if (input) input.value = '';
};

// Filter handlers
window.setFilter = (filter) => actions.setFilter(filter);
window.handleSearch = (query) => debounce('search', () => actions.setSearchQuery(query), 250);
window.openFilters = () => setState({ showFilters: true });
window.closeFilters = () => setState({ showFilters: false });
window.toggleSplitView = () => {
  const s = getState()
  setState({ splitView: !s.splitView })
};
window.openActiveTrip = () => {
  setState({ showTripPlanner: true })
};
window.setFilterCountry = (country) => setState({ filterCountry: country });
window.setFilterMinRating = (rating) => setState({ filterMinRating: rating });
window.setFilterMaxWait = (wait) => setState({ filterMaxWait: wait });
window.toggleVerifiedFilter = () => {
  const { filterVerifiedOnly } = getState();
  setState({ filterVerifiedOnly: !filterVerifiedOnly });
};
window.setSortBy = (sortBy) => setState({ sortBy });
window.applyFilters = () => {
  // Close overlay + update state
  const overlay = document.getElementById('filters-overlay')
  if (overlay) overlay.remove()
  setState({ showFilters: false })
  // Refresh spots on map with new filter settings (no map destroy)
  if (window._refreshMapSpots) window._refreshMapSpots()
};
window.resetFilters = () => resetFiltersUtil();

// Quiz handlers (lazy-loaded)
window.openQuiz = () => setState({ showQuiz: true })
window.closeQuiz = () => setState({
  showQuiz: false, quizActive: false, quizResult: null, quizCountryCode: null, quizShowExplanation: false
})
window.startQuizGame = async () => {
  const { startQuiz } = await import('./services/quiz.js')
  startQuiz()
}
window.startCountryQuiz = async (countryCode) => {
  const { startQuiz } = await import('./services/quiz.js')
  startQuiz(countryCode)
}
window.answerQuizQuestion = async (answerIndex) => {
  const { answerQuestion } = await import('./services/quiz.js')
  answerQuestion(answerIndex)
}
window.nextQuizQuestion = async () => {
  const { nextQuizQuestion } = await import('./services/quiz.js')
  nextQuizQuestion()
}
window.retryQuiz = async () => {
  const { startQuiz } = await import('./services/quiz.js')
  startQuiz()
}
window.showCountryQuizSelection = () => {
  setState({ quizActive: false, quizResult: null, quizCountryCode: null, quizShowExplanation: false });
};

// Badge handlers
window.openBadges = () => setState({ showBadges: true });
window.closeBadges = () => setState({ showBadges: false });
window.showBadgeDetail = (badgeId) => setState({ showBadgeDetail: true, selectedBadgeId: badgeId });
window.closeBadgeDetail = () => setState({ showBadgeDetail: false, selectedBadgeId: null });
window.dismissBadgePopup = () => setState({ showBadgePopup: false, newBadge: null });
window.closeBadgePopup = () => setState({ showBadgePopup: false, newBadge: null });
window.openBadgePopup = (badge) => setState({ showBadgePopup: true, newBadge: badge });

// Daily reward
window.openDailyReward = () => setState({ showDailyReward: true });
window.closeDailyReward = () => setState({ showDailyReward: false, lastDailyRewardResult: null });
window.closeDailyRewardResult = () => setState({ showDailyReward: false, lastDailyRewardResult: null });

// UI toggles
window.closeFavoritesOnMap = () => setState({ showFavoritesOnMap: false, filterFavorites: false });
window.toggleGasStationsOnMap = () => {
  const s = getState();
  setState({ showGasStationsOnMap: !s.showGasStationsOnMap });
};

// Challenge handlers
window.openChallenges = () => setState({ showChallenges: true });
window.closeChallenges = () => setState({ showChallenges: false });
window.setChallengeTab = (tab) => setState({ challengeTab: tab });

// Thumb History toggle
window.toggleThumbHistory = () => {
  const s = getState();
  setState({ showThumbHistory: !s.showThumbHistory });
};

// Shop handlers
window.openShop = () => setState({ showShop: true });
window.closeShop = () => setState({ showShop: false });
window.setShopCategory = (category) => setState({ shopCategory: category });
window.redeemReward = (rewardId) => redeemReward(rewardId);
window.showMyRewards = () => setState({ showShop: false, showMyRewards: true });
window.openMyRewards = () => setState({ showShop: false, showMyRewards: true });
window.closeMyRewards = () => setState({ showMyRewards: false });
window.equipAvatar = (avatar) => {
  setState({ avatar });
  showToast(t('avatarEquipped') || 'Avatar équipé !', 'success');
};
window.equipFrame = (frame) => {
  setState({ profileFrame: frame });
  showToast(t('frameEquipped') || 'Cadre équipé !', 'success');
};
window.equipTitle = (title) => {
  setState({ profileTitle: title });
  showToast(t('titleEquipped') || 'Titre équipé !', 'success');
};
window.activateBooster = (_boosterId) => {
  // Activate booster logic
  showToast(t('boosterActivated') || 'Booster activé !', 'success');
};

// Stats handlers
window.openStats = () => setState({ showStats: true });
window.closeStats = () => setState({ showStats: false });

// Trip handlers are now defined in Travel.js (calculateTrip, saveTrip, etc.)
// Only keep backward-compatible aliases for old planner step-based mode
window.searchTripCity = (query) => {
  if (query.length < 3) {
    document.getElementById('city-suggestions')?.classList.add('hidden')
    return
  }
  debounce('tripCity', async () => {
    const { searchTripLocation } = await import('./services/planner.js')
    const results = await searchTripLocation(query)
    const container = document.getElementById('city-suggestions')
    if (container && results.length > 0) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="bg-white/5 rounded-xl shadow-xl border border-white/10 overflow-hidden">
          ${results.map(r => `
            <button onclick="addTripStepFromSearch('${escapeHTML(r.name).replace(/'/g, '&#39;')}', ${Number(r.lat)}, ${Number(r.lng)}, '${escapeHTML(r.fullName).replace(/'/g, '&#39;')}')"
                    class="w-full px-4 py-3 text-left text-white hover:bg-white/10 border-b border-white/10 last:border-0">
              <div class="font-medium">${escapeHTML(r.name)}</div>
              <div class="text-xs text-slate-400 truncate">${escapeHTML(r.fullName)}</div>
            </button>
          `).join('')}
        </div>
      `
    }
  }, 400)
}
window.addTripStepFromSearch = async (name, lat, lng, fullName) => {
  const { addTripStep } = await import('./services/planner.js')
  addTripStep({ name, lat, lng, fullName })
  document.getElementById('step-input').value = ''
  document.getElementById('city-suggestions')?.classList.add('hidden')
}
window.addFirstSuggestion = () => {
  const firstBtn = document.querySelector('#city-suggestions button')
  if (firstBtn) firstBtn.click()
}
window.removeTripStep = async (index) => {
  const { removeTripStep } = await import('./services/planner.js')
  removeTripStep(index)
}
window.moveTripStep = async (from, to) => {
  const { reorderTripSteps } = await import('./services/planner.js')
  reorderTripSteps(from, to)
}
window.clearTripSteps = async () => {
  const { clearTripSteps } = await import('./services/planner.js')
  clearTripSteps()
}

// Trip Planner & Guides overlays
window.openTripPlanner = () => setState({ showTripPlanner: true })
window.closeTripPlanner = () => setState({ showTripPlanner: false })
window.openGuidesOverlay = () => setState({ showGuidesOverlay: true })
window.closeGuidesOverlay = () => setState({ showGuidesOverlay: false })

// Guides handlers
window.showGuides = () => setState({ activeTab: 'guides', selectedCountryCode: null, showSafety: false });
window.showCountryDetail = (code) => setState({ selectedCountryCode: code });
window.showSafetyPage = () => setState({ showSafety: true });
window.reportGuideError = async (countryCode) => {
  const { getGuideByCode } = await import('./data/guides.js');
  const guide = getGuideByCode(countryCode);
  const name = guide?.name || countryCode;
  const errorType = prompt(t('guideErrorReport') || `Quelle information est incorrecte dans le guide ${name} ?`);
  if (errorType) {
    // Store reports in localStorage as fallback
    const reports = JSON.parse(localStorage.getItem('spothitch_guide_reports') || '[]');
    reports.push({ countryCode, error: errorType, date: new Date().toISOString() });
    localStorage.setItem('spothitch_guide_reports', JSON.stringify(reports));

    // Also save to Firestore
    try {
      const { db } = await import('./services/firebase.js');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'guide_reports'), {
        countryCode,
        error: errorType,
        date: new Date().toISOString(),
        userId: getState().user?.uid || 'anonymous'
      });
    } catch (error) {
      // Firestore save failed - report stored locally
    }

    showToast(t('thankYouReport') || 'Merci pour le signalement ! Nous allons vérifier.', 'success');
  }
};

// Friends handlers
window.showFriends = () => setState({ activeTab: 'friends', selectedFriendId: null });
window.openFriendsChat = (friendId) => setState({ selectedFriendId: friendId });

// Animation handlers (global) — lazy-loaded
window.showSuccessAnimation = async (...args) => {
  const { showSuccessAnimation } = await import('./utils/animations.js')
  showSuccessAnimation(...args)
}
window.showErrorAnimation = async (...args) => {
  const { showErrorAnimation } = await import('./utils/animations.js')
  showErrorAnimation(...args)
}
window.showBadgeUnlock = async (...args) => {
  const { showBadgeUnlockAnimation } = await import('./utils/animations.js')
  showBadgeUnlockAnimation(...args)
}
window.showLevelUp = async (...args) => {
  const { showLevelUpAnimation } = await import('./utils/animations.js')
  showLevelUpAnimation(...args)
}
window.showPoints = async (...args) => {
  const { showPointsAnimation } = await import('./utils/animations.js')
  showPointsAnimation(...args)
}
window.playSound = async (...args) => {
  const { playSound } = await import('./utils/animations.js')
  playSound(...args)
}
window.launchConfetti = async (...args) => {
  const { launchConfetti } = await import('./utils/confetti.js')
  launchConfetti(...args)
}
window.launchConfettiBurst = async (...args) => {
  const { launchConfettiBurst } = await import('./utils/confetti.js')
  launchConfettiBurst(...args)
}

// Sharing handlers (global) — lazy-loaded
window.shareSpot = async (...args) => {
  const { shareSpot } = await import('./utils/share.js')
  shareSpot(...args)
}
window.shareBadge = async (...args) => {
  const { shareBadge } = await import('./utils/share.js')
  shareBadge(...args)
}
window.shareStats = async (...args) => {
  const { shareStats } = await import('./utils/share.js')
  shareStats(...args)
}
window.shareApp = async (...args) => {
  const { shareApp } = await import('./utils/share.js')
  shareApp(...args)
}
window.showAddFriend = () => setState({ showAddFriend: true });
window.closeAddFriend = () => setState({ showAddFriend: false });
window.acceptFriendRequest = (_requestId) => {
  // Accept friend logic
  showToast(t('friendAccepted') || 'Ami accepté !', 'success');
};
window.declineFriendRequest = window.declineFriendRequest || ((_requestId) => {
  showToast(t('requestDeclined') || 'Request declined', 'info')
});
window.sendPrivateMessage = (_friendId) => {
  const input = document.getElementById('private-chat-input');
  const text = input?.value?.trim();
  if (!text) return;
  // Send private message logic
  if (input) input.value = '';
};
window.copyFriendLink = () => {
  navigator.clipboard.writeText('spothitch.app/add/user123');
  showToast(t('linkCopied') || 'Lien copié !', 'success');
};

// Friend Challenges handlers (#157) — lazy-loaded
window.createFriendChallenge = async (friendId, typeId, target = null, durationDays = 7) => {
  const { createChallenge } = await import('./services/friendChallenges.js')
  const challenge = createChallenge(friendId, typeId, target, durationDays)
  if (challenge) {
    trackPageView('/action/challenge_created')
  }
}

window.acceptFriendChallenge = async (challengeId) => {
  const { acceptChallenge } = await import('./services/friendChallenges.js')
  const success = acceptChallenge(challengeId)
  if (success) {
    trackPageView('/action/challenge_accepted')
  }
  renderApp()
}

window.declineFriendChallenge = async (challengeId) => {
  const { declineChallenge } = await import('./services/friendChallenges.js')
  const success = declineChallenge(challengeId)
  if (success) {
    trackPageView('/action/challenge_declined')
  }
  renderApp()
}

window.cancelFriendChallenge = async (challengeId) => {
  const { cancelChallenge } = await import('./services/friendChallenges.js')
  const success = cancelChallenge(challengeId)
  if (success) {
    trackPageView('/action/challenge_cancelled')
  }
  renderApp()
}

window.syncFriendChallenges = async () => {
  const { syncChallengeProgress } = await import('./services/friendChallenges.js')
  syncChallengeProgress()
  renderApp()
}

window.getActiveFriendChallenges = async () => {
  const { getActiveChallenges } = await import('./services/friendChallenges.js')
  return getActiveChallenges()
}
window.getPendingFriendChallenges = async () => {
  const { getPendingChallenges } = await import('./services/friendChallenges.js')
  return getPendingChallenges()
}
window.getChallengeStats = async () => {
  const { getChallengeStats } = await import('./services/friendChallenges.js')
  return getChallengeStats()
}
window.getChallengeTypes = async () => {
  const { getChallengeTypes } = await import('./services/friendChallenges.js')
  return getChallengeTypes()
}

// Legal handlers
window.showLegalPage = (page = 'cgu') => setState({ activeTab: 'legal', legalPage: page });

// Side menu handlers
window.openSideMenu = () => setState({ showSideMenu: true });
window.closeSideMenu = () => setState({ showSideMenu: false });

// Accessibility handlers
window.showAccessibilityHelp = () => setState({ showAccessibilityHelp: true });
window.closeAccessibilityHelp = () => setState({ showAccessibilityHelp: false });
window.srAnnounce = srAnnounce; // Allow components to announce

// PWA handlers
window.showInstallBanner = showInstallBanner;
window.dismissInstallBanner = dismissInstallBanner;
window.installPWA = installPWA;

// Map handlers
window.centerOnUser = () => getMap().then(m => m.centerOnUser());

// Titles modal handler
window.openTitles = () => setState({ showTitles: true });
window.closeTitles = () => setState({ showTitles: false });

// Team challenges handlers — lazy-loaded
window.openTeamChallenges = () => setState({ showTeamChallenges: true })
window.closeTeamChallenges = () => setState({ showTeamChallenges: false })
window.openCreateTeam = () => setState({ showCreateTeam: true })
window.closeCreateTeam = () => setState({ showCreateTeam: false })
window.createTeamAction = async (...args) => {
  const { createTeam } = await import('./services/teamChallenges.js')
  return createTeam(...args)
}
window.joinTeamAction = async (...args) => {
  const { joinTeam } = await import('./services/teamChallenges.js')
  return joinTeam(...args)
}
window.leaveTeamAction = async (...args) => {
  const { leaveTeam } = await import('./services/teamChallenges.js')
  return leaveTeam(...args)
}
window.startTeamChallengeAction = async (...args) => {
  const { startTeamChallenge } = await import('./services/teamChallenges.js')
  return startTeamChallenge(...args)
}

// Travel groups handlers — lazy-loaded
window.openTravelGroups = () => setState({ activeTab: 'travel-groups' })
window.openCreateTravelGroup = () => setState({ showCreateTravelGroup: true })
window.closeCreateTravelGroup = () => setState({ showCreateTravelGroup: false })
window.openTravelGroupDetail = (groupId) => setState({ showTravelGroupDetail: true, selectedTravelGroupId: groupId })
window.closeTravelGroupDetail = () => setState({ showTravelGroupDetail: false, selectedTravelGroupId: null })
window.createTravelGroupAction = async (...args) => {
  const { createTravelGroup } = await import('./services/travelGroups.js')
  return createTravelGroup(...args)
}
window.joinTravelGroupAction = async (...args) => {
  const { joinTravelGroup } = await import('./services/travelGroups.js')
  return joinTravelGroup(...args)
}
window.leaveTravelGroupAction = async (...args) => {
  const { leaveTravelGroup } = await import('./services/travelGroups.js')
  return leaveTravelGroup(...args)
}

// Nearby friends handlers — lazy-loaded
window.toggleNearbyFriends = async (...args) => {
  const { toggleNearbyFriends } = await import('./services/nearbyFriends.js')
  return toggleNearbyFriends(...args)
}
window.openNearbyFriends = () => setState({ showNearbyFriends: true })
window.closeNearbyFriends = () => setState({ showNearbyFriends: false })

// Profile customization handlers — lazy-loaded
window.openProfileCustomization = () => setState({ showProfileCustomization: true })
window.closeProfileCustomization = () => setState({ showProfileCustomization: false })
window.equipFrameAction = async (...args) => {
  const { equipFrame } = await import('./services/profileCustomization.js')
  return equipFrame(...args)
}
window.equipTitleAction = async (...args) => {
  const { equipTitle } = await import('./services/profileCustomization.js')
  return equipTitle(...args)
}

// Proximity alerts handlers — lazy-loaded
window.toggleProximityAlerts = async (...args) => {
  const { toggleProximityAlerts } = await import('./services/proximityAlerts.js')
  return toggleProximityAlerts(...args)
}
window.setProximityRadius = async (...args) => {
  const { setProximityRadius } = await import('./services/proximityAlerts.js')
  return setProximityRadius(...args)
}

// Trip history handlers — lazy-loaded
window.openTripHistory = () => setState({ showTripHistory: true })
window.closeTripHistory = () => setState({ showTripHistory: false })
window.clearTripHistory = async () => {
  if (confirm(t('clearTripHistory') || 'Effacer tout l\'historique de voyage ?')) {
    const { clearTripHistory } = await import('./services/tripHistory.js')
    clearTripHistory()
    setState({ showTripHistory: false })
  }
}

// Image handlers — lazy-loaded
window.compressImage = async (...args) => {
  const { compressImage } = await import('./utils/imageOptimizer.js')
  return compressImage(...args)
}
window.generateThumbnail = async (...args) => {
  const { generateThumbnail } = await import('./utils/imageOptimizer.js')
  return generateThumbnail(...args)
}
window.validateImage = async (...args) => {
  const { validateImage } = await import('./utils/imageOptimizer.js')
  return validateImage(...args)
}

// Landing page dismiss handler — show tutorial after landing
window.dismissLanding = () => {
  localStorage.setItem('spothitch_landing_seen', '1')
  const { tutorialCompleted } = getState()
  setState({
    showLanding: false,
    showTutorial: !tutorialCompleted,
    tutorialStep: 0,
  })
  preloadMap()
}

// Landing carousel next slide — overridden by initLandingCarousel()
window.landingNext = () => {}

window.installPWAFromLanding = () => {
  localStorage.setItem('spothitch_landing_seen', '1')
  setState({ showLanding: false })
  // Trigger PWA install prompt
  setTimeout(() => {
    try {
      installPWA()
    } catch (e) {
      showToast(t('addToHomeScreen') || 'Ajoutez SpotHitch depuis le menu de votre navigateur', 'info')
    }
  }, 300)
}

// Landing page & help handlers
window.openFAQ = () => {
  setState({ activeTab: 'guides' });
  showToast(t('openingFAQ') || 'Ouverture de la FAQ...', 'info');
};
window.openHelpCenter = () => {
  setState({ activeTab: 'guides' });
  showToast(t('helpCenterOpen') || 'Centre d\'aide ouvert', 'info');
};
window.openChangelog = () => {
  showToast(t('changelog') || 'Changelog - Version 2.0\n\n✨ Nouvelle interface avec Vite\n🎮 Gamification améliorée\n🗺️ Carte interactive MapLibre GL\n📱 PWA complète\n🌍 Support multilingue', 'info');
};
window.openRoadmap = () => {
  showToast(t('roadmap') || 'Roadmap SpotHitch 2026\n\n✅ Chat temps réel\n✅ Messages privés\n✅ Vérification identité\n🔄 Guerres de guildes\n🔄 Événements saisonniers\n🔄 Intégration natives (iOS/Android)', 'info');
};
window.openContactForm = () => {
  setState({ showContactForm: true });
};
window.closeContactForm = () => {
  setState({ showContactForm: false });
};
window.submitContactForm = async (event) => {
  const { handleContactFormSubmit } = await import('./components/modals/ContactForm.js');
  handleContactFormSubmit(event);
};

// Companion Mode handlers
window.showCompanionModal = () => setState({ showCompanionModal: true })
window.closeCompanionModal = () => setState({ showCompanionModal: false })
window.startCompanion = () => {
  const nameEl = document.getElementById('companion-guardian-name')
  const phoneEl = document.getElementById('companion-guardian-phone')
  const intervalEl = document.getElementById('companion-interval')
  const destEl = document.getElementById('companion-destination')
  const notifyDepartureEl = document.getElementById('companion-notify-departure')
  const notifyArrivalEl = document.getElementById('companion-notify-arrival')

  const name = nameEl?.value?.trim()
  const phone = phoneEl?.value?.trim()
  const interval = parseInt(intervalEl?.value || '30', 10)
  const destination = destEl?.value?.trim() || ''
  const notifyOnDeparture = notifyDepartureEl ? notifyDepartureEl.checked : true
  const notifyOnArrival = notifyArrivalEl ? notifyArrivalEl.checked : true

  if (!name || !phone) {
    showToast(t('guardianRequired') || 'Remplis le nom et le numéro de ton gardien.', 'warning')
    return
  }

  // Collect trusted contacts from saved state (added via companionAddTrustedContact)
  let trustedContacts = []
  try {
    const raw = localStorage.getItem('spothitch_companion')
    if (raw) {
      const parsed = JSON.parse(raw)
      trustedContacts = Array.isArray(parsed.trustedContacts) ? parsed.trustedContacts : []
    }
  } catch {
    // ignore
  }

  startCompanionMode({ name, phone }, interval, {
    trustedContacts,
    destination,
    notifyOnDeparture,
    notifyOnArrival,
  })
  onCompanionOverdue(() => {
    setState({ showCompanionModal: true })
  })
  showToast(t('companionStarted') || 'Mode compagnon activé !', 'success')
  // Re-render to show active view
  scheduleRender(() => render(getState()))
}
window.stopCompanion = () => {
  stopCompanionMode()
  showToast(t('companionStopped') || 'Mode compagnon désactivé.', 'info')
  setState({ showCompanionModal: false })
}
window.companionCheckIn = () => {
  companionCheckInFn()
  showToast(t('companionCheckedIn') || 'Check-in enregistré !', 'success')
  // Re-render to update timer
  scheduleRender(() => render(getState()))
}
window.companionSendAlert = () => {
  const url = companionSendAlertFn()
  if (url) {
    showToast(t('companionAlertOpening') || 'Ouverture de WhatsApp...', 'info')
    // sendAlert already opens the URLs internally; url is returned for info only
  } else {
    // Fallback to SMS if sendAlert returned nothing (no contacts configured)
    const smsUrl = companionGetSMSLink()
    if (smsUrl) {
      window.open(smsUrl, '_blank')
    }
  }
}

// City Panel handlers
window.openCityPanel = async (citySlug, cityName, lat, lng, countryCode, countryName) => {
  const parsedLat = parseFloat(lat)
  const parsedLng = parseFloat(lng)

  // Force-load the country's spots before building city info
  try {
    const { loadSpotsInBounds, getAllLoadedSpots } = await import('./services/spotLoader.js')
    await loadSpotsInBounds({
      north: parsedLat + 3,
      south: parsedLat - 3,
      east: parsedLng + 3,
      west: parsedLng - 3,
    })
    // Merge newly loaded spots into state
    const allLoaded = getAllLoadedSpots()
    const current = getState().spots || []
    const existingIds = new Set(current.map(s => s.id))
    const newSpots = allLoaded.filter(s => !existingIds.has(s.id))
    if (newSpots.length > 0) {
      actions.setSpots([...current, ...newSpots])
    }
  } catch (e) {
    console.warn('Failed to load spots for city panel:', e)
  }

  const { buildCityInfo } = await import('./services/cityRoutes.js')
  const { spots } = getState()
  const cityInfo = buildCityInfo(spots, cityName, parsedLat, parsedLng, countryCode, countryName)

  // Always show city panel — even with 0 spots (guide info is still useful)
  const panelData = cityInfo || {
    name: cityName,
    slug: citySlug,
    lat: parsedLat,
    lng: parsedLng,
    country: countryCode || '',
    countryName: countryName || '',
    spotCount: 0,
    avgWait: 0,
    avgRating: 0,
    routesList: [],
    spots: [],
  }
  setState({ selectedCity: citySlug, cityData: panelData, selectedRoute: null })
  if (window.mapInstance) {
    window.mapInstance.flyTo({ center: [parsedLng, parsedLat], zoom: 11 })
  }
}
window.closeCityPanel = () => setState({ selectedCity: null, selectedRoute: null, cityData: null })
window.selectCityRoute = (citySlug, routeSlug) => {
  setState({ selectedRoute: routeSlug })
  const { cityData } = getState()
  if (cityData) {
    const route = cityData.routesList?.find(r => r.slug === routeSlug)
    if (route && window.mapInstance) {
      window.mapInstance.flyTo({ center: [route.destLon, route.destLat], zoom: 12 })
    }
  }
}
window.viewCitySpotsOnMap = () => {
  const { cityData } = getState()
  if (cityData && window.mapInstance) {
    window.mapInstance.flyTo({ center: [cityData.lng, cityData.lat], zoom: 13 })
    setState({ selectedCity: null, selectedRoute: null, cityData: null })
  }
}

// Lazy load handlers
window.loadModal = loadModal;
window.preloadModals = preloadModals;

// Loading indicator handlers
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.setLoadingMessage = setLoadingMessage;
window.setLoadingProgress = setLoadingProgress;
window.isLoading = isLoading;
window.withLoading = withLoading;

// Hostel recommendations handlers
window.openAddHostel = async (city) => {
  const { renderAddHostelForm } = await import('./services/hostelRecommendations.js');
  const formHTML = renderAddHostelForm(city);
  const existingModal = document.getElementById('hostel-modal');
  if (existingModal) existingModal.remove();

  const modalDiv = document.createElement('div');
  modalDiv.id = 'hostel-modal';
  modalDiv.innerHTML = formHTML;
  document.body.appendChild(modalDiv);
};

window.closeAddHostel = () => {
  const modal = document.getElementById('hostel-modal');
  if (modal) modal.remove();
};

window.setHostelCategory = (category) => {
  // Update selected category
  document.getElementById('selected-category').value = category;

  // Update button styles
  document.querySelectorAll('.category-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.className = 'category-btn py-3 px-2 rounded-xl text-center transition-all border-2 border-primary-500 bg-primary-500/20';
    } else {
      btn.className = 'category-btn py-3 px-2 rounded-xl text-center transition-all border border-white/10 hover:border-primary-500';
    }
  });
};

window.submitHostelRec = async (city) => {
  const hostelName = document.getElementById('hostel-name')?.value?.trim();
  const category = document.getElementById('selected-category')?.value;

  if (!hostelName) {
    showToast(t('enterHostelName') || 'Veuillez entrer le nom de l\'auberge', 'warning');
    return;
  }

  if (!category) {
    showToast(t('selectCategory') || 'Veuillez sélectionner une catégorie', 'warning');
    return;
  }

  const { addRecommendation } = await import('./services/hostelRecommendations.js');
  const success = addRecommendation(city, hostelName, category);

  if (success) {
    window.closeAddHostel();
    // Re-render to show new recommendation
    scheduleRender(() => render(getState()));
  }
};

window.upvoteHostel = async (city, hostelName) => {
  const { upvoteRecommendation } = await import('./services/hostelRecommendations.js');
  const success = upvoteRecommendation(city, hostelName);

  if (success) {
    // Re-render to update upvote count
    scheduleRender(() => render(getState()));
  }
};

window.switchHostelCategory = async (category, cityName) => {
  const { switchHostelCategory } = await import('./services/hostelRecommendations.js');
  switchHostelCategory(category, cityName);
};

// Webhook handlers
window.openAddWebhook = async () => {
  const { addWebhook, WEBHOOK_TYPES } = await import('./services/webhooks.js');
  const url = prompt(t('webhookURL') || 'URL du webhook (Discord/Telegram/Slack):');
  if (!url) return;
  const type = url.includes('discord') ? WEBHOOK_TYPES.DISCORD
    : url.includes('telegram') ? WEBHOOK_TYPES.TELEGRAM
    : url.includes('slack') ? WEBHOOK_TYPES.SLACK
    : WEBHOOK_TYPES.CUSTOM;
  addWebhook({ type, url, name: type.charAt(0).toUpperCase() + type.slice(1) + ' Webhook' });
  showToast(t('webhookAdded') || 'Webhook ajoute !', 'success');
  scheduleRender(() => render(getState()));
};
window.toggleWebhookAction = async (id) => {
  const { toggleWebhook } = await import('./services/webhooks.js');
  toggleWebhook(id);
  scheduleRender(() => render(getState()));
};
window.removeWebhookAction = async (id) => {
  const { removeWebhook } = await import('./services/webhooks.js');
  removeWebhook(id);
  showToast(t('webhookRemoved') || 'Webhook supprime', 'success');
  scheduleRender(() => render(getState()));
};

// Form persistence handler
window.clearFormDraft = async (formId) => {
  const { clearDraft } = await import('./utils/formPersistence.js');
  clearDraft(formId);
  showToast(t('draftCleared') || 'Brouillon efface', 'info');
  scheduleRender(() => render(getState()));
};

// ==================== PUSH NOTIFICATION HANDLERS ====================

window.togglePushNotifications = async () => {
  const { isPushEnabled, enablePushNotifications, disablePushNotifications } = await import('./services/pushNotifications.js')
  if (isPushEnabled()) {
    disablePushNotifications()
    showToast(t('pushDisabled') || 'Notifications push désactivées', 'info')
  } else {
    const result = await enablePushNotifications()
    if (result.success) {
      showToast(t('pushEnabled') || 'Notifications push activées', 'success')
    } else {
      showToast(t('pushDenied') || 'Notifications refusées par le navigateur', 'warning')
    }
  }
  scheduleRender(() => render(getState()))
}

// ==================== COUNTRY BUBBLE HANDLERS ====================

window.loadCountryOnMap = async (code) => {
  try {
    const { loadCountrySpots } = await import('./services/spotLoader.js')
    await loadCountrySpots(code)
    showToast(`${t('countryLoaded') || 'Pays chargé'} (${code})`, 'success')
    // Refresh map spots source if map is active
    if (window.homeMapInstance) {
      const source = window.homeMapInstance.getSource('home-spots')
      if (source) {
        // Trigger a moveend to reload spots on map
        window.homeMapInstance.fire('moveend')
      }
    }
    if (window._refreshCountryBubbles) window._refreshCountryBubbles()
    // Close any open popup
    const popups = document.querySelectorAll('.maplibregl-popup')
    popups.forEach(p => p.remove())
  } catch (e) {
    showToast(t('downloadFailed') || 'Échec du chargement', 'error')
  }
}

window.downloadCountryFromBubble = async (code, name) => {
  const btn = document.getElementById(`bubble-download-${code}`)
  if (btn) {
    btn.disabled = true
    btn.innerHTML = `${icon('loader-circle', 'w-4 h-4 animate-spin')} ${t('downloadingCountry') || 'Téléchargement...'}`
  }
  try {
    const { downloadCountrySpots } = await import('./services/offlineDownload.js')
    const result = await downloadCountrySpots(code, (progress) => {
      if (btn) btn.innerHTML = `${icon('loader-circle', 'w-4 h-4 animate-spin')} ${progress}%`
    })
    if (result.success) {
      showToast(`${name}: ${result.count} ${t('countryDownloaded') || 'Téléchargé'}`, 'success')
      if (window._refreshCountryBubbles) window._refreshCountryBubbles()
      // Close popup
      const popups = document.querySelectorAll('.maplibregl-popup')
      popups.forEach(p => p.remove())
    } else {
      showToast(t('downloadFailed') || 'Échec du téléchargement', 'error')
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon('download', 'w-4 h-4')} ${t('downloadOffline') || 'Télécharger'}` }
    }
  } catch (e) {
    showToast(t('downloadFailed') || 'Échec du téléchargement', 'error')
    if (btn) { btn.disabled = false; btn.innerHTML = `${icon('download', 'w-4 h-4')} ${t('downloadOffline') || 'Télécharger'}` }
  }
}

// ==================== OFFLINE DOWNLOAD HANDLERS ====================

window.downloadCountryOffline = async (code, name) => {
  const btn = document.getElementById(`offline-download-${code}`)
  if (btn) {
    btn.disabled = true
    btn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin mr-2')}${t('downloading') || 'Téléchargement...'}`
  }
  try {
    const { downloadCountrySpots } = await import('./services/offlineDownload.js')
    const result = await downloadCountrySpots(code, (progress) => {
      if (btn) btn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin mr-2')}${progress}%`
    })
    if (result.success) {
      showToast(`${name}: ${result.count} ${t('spotsDownloaded') || 'spots téléchargés pour offline'}`, 'success')
      if (btn) {
        btn.innerHTML = `${icon('check', 'w-5 h-5 mr-2')}${t('downloaded') || 'Téléchargé'}`
        btn.classList.remove('border-primary-500/30', 'text-primary-400')
        btn.classList.add('border-green-500/30', 'text-green-400')
      }
    } else {
      showToast(t('downloadFailed') || 'Échec du téléchargement', 'error')
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `${icon('download', 'w-5 h-5')} ${t('downloadForOffline') || 'Télécharger pour offline'}`
      }
    }
  } catch (e) {
    console.error('Offline download error:', e)
    showToast(t('downloadError') || 'Erreur lors du téléchargement', 'error')
    if (btn) {
      btn.disabled = false
      btn.innerHTML = `${icon('download', 'w-5 h-5')} ${t('downloadForOffline') || 'Télécharger pour offline'}`
    }
  }
}

window.deleteOfflineCountry = async (code) => {
  try {
    const { deleteOfflineCountry } = await import('./services/offlineDownload.js')
    await deleteOfflineCountry(code)
    showToast(t('offlineDataDeleted') || 'Données offline supprimées', 'success')
    scheduleRender(() => render(getState()))
  } catch (e) {
    showToast(t('deletionError') || 'Erreur lors de la suppression', 'error')
  }
}

// ==================== HOME HANDLERS ====================

// Home search with debounce — search a place, show city panel option, center map
let homeDestDebounce = null

window.homeSearchDestination = (query) => {
  clearTimeout(homeDestDebounce)
  const container = document.getElementById('home-dest-suggestions')
  if (!container) return
  if (!query || query.trim().length < 2) {
    container.classList.add('hidden')
    return
  }
  homeDestDebounce = setTimeout(async () => {
    try {
      const results = await searchLocation(query)
      if (results && results.length > 0) {
        container.classList.remove('hidden')
        container.innerHTML = `
          <div class="bg-dark-secondary/95 backdrop-blur rounded-xl border border-white/10 overflow-hidden shadow-xl">
            ${results.map((r, i) => {
              const shortName = escapeHTML((r.name || '').split(',').slice(0, 2).join(','))
              const fullName = escapeHTML(r.name || '')
              const cityName = escapeHTML((r.name || '').split(',')[0].trim())
              const countryName = escapeHTML((r.name || '').split(',').pop().trim())
              const cc = (r.countryCode || '').toUpperCase()
              const slug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              return `
              <div class="border-b border-white/5 last:border-0">
                <button
                  onclick="homeSelectPlace(${Number(r.lat)}, ${Number(r.lng)}, '${shortName.replace(/'/g, '&#39;')}')"
                  class="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all"
                  data-home-suggestion="${i}"
                >
                  <div class="font-medium text-sm truncate">${shortName}</div>
                  <div class="text-xs text-slate-400 truncate">${fullName}</div>
                </button>
                <button
                  onclick="openCityPanel('${slug}', '${cityName.replace(/'/g, '&#39;')}', ${Number(r.lat)}, ${Number(r.lng)}, '${cc}', '${countryName.replace(/'/g, '&#39;')}')"
                  class="w-full px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 transition-all text-xs font-medium border-t border-white/5"
                >
                  📍 ${t('hitchhikingFrom') || 'Hitchhiking from'} ${cityName}
                </button>
              </div>`
            }).join('')}
          </div>
        `
      } else {
        container.classList.add('hidden')
      }
    } catch (e) {
      container.classList.add('hidden')
    }
  }, 300)
}

window.homeSelectFirstSuggestion = () => {
  const btn = document.querySelector('[data-home-suggestion="0"]')
  if (btn) btn.click()
}

// Select a place → center map there, spots update via moveend listener
window.homeSelectPlace = (lat, lng, name) => {
  const input = document.getElementById('home-destination')
  if (input) input.value = name
  document.getElementById('home-dest-suggestions')?.classList.add('hidden')
  setState({ homeSearchLabel: name })

  if (window.homeMapInstance) {
    window.homeMapInstance.setView([lat, lng], 12)
  }
}

window.homeClearSearch = () => {
  setState({ homeSearchLabel: '' })
  const input = document.getElementById('home-destination')
  if (input) input.value = ''
}

// Keep old handler names as aliases (for compatibility)
window.homeSelectDestination = window.homeSelectPlace
window.homeClearDestination = window.homeClearSearch

window.homeCenterOnUser = () => {
  const { userLocation } = getState()
  if (userLocation && window.homeMapInstance) {
    window.homeMapInstance.setView([userLocation.lat, userLocation.lng], 13)
  }
}

window.homeZoomIn = () => {
  if (window.homeMapInstance) window.homeMapInstance.zoomIn()
}

window.homeZoomOut = () => {
  if (window.homeMapInstance) window.homeMapInstance.zoomOut()
}

// Simple haversine for distance calculations (currently unused but may be needed)
// eslint-disable-next-line no-unused-vars
function haversineSimple(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ==================== START APP ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
