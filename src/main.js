/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Styles
import './styles/main.css';

// State & Store
import { getState, setState, subscribe, actions } from './stores/state.js';

// Services
import {
  initializeFirebase,
  onAuthChange,
  signIn,
  signUp,
  signInWithGoogle,
  logOut,
  resetPassword,
  sendChatMessage,
  saveSpotToFirebase,
  uploadPhotoToFirebase,
  saveValidationToFirebase,
  saveCommentToFirebase,
  reportSpot,
} from './services/firebase.js';
import { initSentry, setupGlobalErrorHandlers, setUser as setSentryUser } from './services/sentry.js';
import { initNotifications, showToast, showFriendlyError } from './services/notifications.js';
import { initOfflineHandler } from './services/offline.js';
import { initMap as initMapService, initMapService as initMainMapService, initPlannerMap, initSavedTripMap, centerOnSpot, centerOnUser, destroyMaps } from './services/map.js';
import {
  addPoints,
  addSeasonPoints,
  recordCheckin,
  recordSpotCreated,
  recordReview,
  updateStreak,
  recordCountryVisit,
  checkBadges,
  getGamificationSummary,
} from './services/gamification.js';
import {
  startQuiz,
  answerQuestion as answerQuizQuestion,
  finishQuiz,
  getQuizState,
} from './services/quiz.js';
import {
  createTrip,
  saveTrip,
  deleteTrip,
  getSavedTrips,
  getTripById,
  searchTripLocation,
  addTripStep,
  removeTripStep,
  reorderTripSteps,
  clearTripSteps,
} from './services/planner.js';
import { searchLocation, reverseGeocode, formatDistance, formatDuration } from './services/osrm.js';
import {
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  updateChallengeProgress,
  getActiveChallenges as getActiveFriendChallenges,
  getPendingChallenges,
  getChallengeStats,
  getChallengeTypes,
  syncChallengeProgress,
} from './services/friendChallenges.js';

// i18n
import { t, detectLanguage, setLanguage, getAvailableLanguages } from './i18n/index.js';

// Components
import { renderApp, afterRender } from './components/App.js';
import { initSplashScreen, hideSplashScreen } from './components/SplashScreen.js';

// Data
import { sampleSpots } from './data/spots.js';
import { allBadges, getBadgeById } from './data/badges.js';
import { getActiveChallenges } from './data/challenges.js';
import { shopRewards, getRewardById, canAfford } from './data/rewards.js';
import { getVipLevel, getLeague, vipLevels, leagues, applyVipDiscount } from './data/vip-levels.js';
// guides.js loaded dynamically to reduce main bundle size

// Utils
import { initSEO, trackPageView } from './utils/seo.js';
import { announce, announceAction, prefersReducedMotion } from './utils/a11y.js';
import { initPWA, showInstallBanner, dismissInstallBanner, installPWA } from './utils/pwa.js';
import { initNetworkMonitor, updateNetworkStatus, cleanupOldData } from './utils/network.js';
import { scheduleRender, debouncedRender } from './utils/render.js';
import { debounce } from './utils/performance.js';
import { observeAllLazyImages } from './utils/lazyImages.js';
import { initWebVitals } from './utils/webVitals.js';
import { initHoverPrefetch, prefetchNextTab } from './utils/prefetch.js';
import { trackTabChange, trackModalOpen, trackAction } from './utils/analytics.js';
import { getAdaptiveConfig } from './utils/adaptiveLoading.js';
import { cleanupDrafts } from './utils/formPersistence.js';
import { initWasm } from './utils/wasmGeo.js';
import { sanitize, sanitizeInput } from './utils/sanitize.js';
import { runAllCleanup, registerCleanup } from './utils/cleanup.js';
import { initDeepLinkListener, handleDeepLink, shareLink } from './utils/deeplink.js';
import { setupGlobalErrorHandlers as setupErrorHandlers, withErrorBoundary } from './utils/errorBoundary.js';
import { showSuccessAnimation, showErrorAnimation, showBadgeUnlockAnimation, showLevelUpAnimation, showPointsAnimation, playSound } from './utils/animations.js';
import { shareSpot, shareBadge, shareStats, shareApp } from './utils/share.js';
import { launchConfetti, launchConfettiBurst } from './utils/confetti.js';
import { getErrorMessage, getFormattedError, isRecoverableError } from './utils/errorMessages.js';
import { showShareModal } from './services/shareCard.js';
import { initAutoOfflineSync } from './services/autoOfflineSync.js';
import { getFilteredSpots, resetFilters as resetFiltersUtil } from './components/modals/Filters.js';
import { redeemReward } from './components/modals/Shop.js';
import './components/modals/Leaderboard.js'; // Register global handlers
import { registerCheckinHandlers } from './components/modals/CheckinModal.js'; // Checkin modal handlers
import { startNavigation, stopNavigation, openExternalNavigation } from './services/navigation.js'; // GPS navigation
import {
  initScreenReaderSupport,
  announce as srAnnounce,
  announceViewChange,
  announceListUpdate,
  announceLoading,
  announceError,
  renderAccessibilityHelp,
} from './services/screenReader.js'; // Accessibility
import {
  initProximityAlerts,
  stopProximityAlerts,
  setProximityRadius,
  toggleProximityAlerts,
  isProximityAlertsEnabled,
} from './services/proximityAlerts.js'; // Proximity alerts
import {
  logTripEvent,
  getTripHistory,
  clearTripHistory,
  renderTripHistory,
  getTripStats,
} from './services/tripHistory.js'; // Trip history
import {
  isWebShareSupported,
  canShareFiles,
  shareSpot as shareSpotNative,
  shareTrip as shareTripNative,
  shareProfile as shareProfileNative,
  shareAchievement,
  shareCustom,
  shareWithFiles,
  renderShareButton,
  renderShareIconButton,
} from './services/webShare.js'; // Native Web Share API

// New services
import {
  renderSkillTree,
  renderSkillSummary,
  unlockSkill,
  awardSkillPoints,
  getSkillTreeProgress,
} from './services/skillTree.js';
import {
  createTeam,
  joinTeam,
  leaveTeam,
  startTeamChallenge,
  renderTeamDashboard,
  getTeamLeaderboard,
} from './services/teamChallenges.js';
import {
  createTravelGroup,
  joinTravelGroup,
  leaveTravelGroup,
  renderTravelGroupsList,
  renderTravelGroupDetail,
} from './services/travelGroups.js';
import {
  initNearbyFriendsTracking,
  toggleNearbyFriends,
  renderNearbyFriendsWidget,
  renderNearbyFriendsList,
} from './services/nearbyFriends.js';
import {
  equipFrame,
  equipTitle,
  renderCustomizationModal,
  renderAvatarWithFrame,
  checkUnlocks as checkProfileUnlocks,
} from './services/profileCustomization.js';
import {
  getSpotsInBounds,
  paginateSpots,
  onMapBoundsChange,
  renderPagination,
} from './services/spotPagination.js';
import {
  compressImage,
  generateThumbnail,
  validateImage,
} from './utils/imageOptimizer.js';
import {
  loadModal,
  preloadModals,
  preloadOnIdle,
} from './utils/lazyLoad.js';
import { exportUserData, getExportSummary } from './utils/dataExport.js';
import {
  showLoading,
  hideLoading,
  setLoadingMessage,
  setLoadingProgress,
  isLoading,
  withLoading,
} from './components/LoadingIndicator.js';

// ==================== INITIALIZATION ====================

/**
 * Initialize the application
 */
async function init() {
  console.log('🚀 SpotHitch initializing...');

  // Initialize fun splash screen immediately
  initSplashScreen();

  // Check for reset parameter in URL
  if (window.location.search.includes('reset')) {
    localStorage.clear();
    window.history.replaceState({}, '', window.location.pathname);
    console.log('🔄 État réinitialisé');
  }

  try {
    // Set detected language
    const lang = detectLanguage();
    setLanguage(lang);

    // Initialize SEO
    initSEO();

    // Check reduced motion preference
    if (prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Initialize error tracking (optional - won't break app if fails)
    try {
      await initSentry();
      setupGlobalErrorHandlers();
    } catch (e) {
      console.warn('Sentry init skipped:', e.message);
    }

    // Initialize Firebase (optional - won't break app if fails)
    try {
      initializeFirebase();
      // Listen to auth state changes
      onAuthChange((user) => {
        actions.setUser(user);
        setSentryUser(user);
        if (user) {
          console.log('✅ User logged in:', user.displayName);
          updateStreak(); // Update daily streak on login
        }
      });
    } catch (e) {
      console.warn('Firebase init skipped:', e.message);
    }

    // Initialize notifications (optional)
    try {
      await initNotifications();
    } catch (e) {
      console.warn('Notifications init skipped:', e.message);
    }

    // Initialize offline handler (optional)
    try {
      initOfflineHandler();
    } catch (e) {
      console.warn('Offline handler skipped:', e.message);
    }

    // Initialize network monitor
    try {
      initNetworkMonitor();
    } catch (e) {
      console.warn('Network monitor skipped:', e.message);
    }

    // Initialize PWA
    try {
      initPWA();
    } catch (e) {
      console.warn('PWA init skipped:', e.message);
    }

    // Initialize screen reader support
    try {
      initScreenReaderSupport();
    } catch (e) {
      console.warn('Screen reader support skipped:', e.message);
    }

    // Initialize nearby friends tracking
    try {
      initNearbyFriendsTracking();
    } catch (e) {
      console.warn('Nearby friends tracking skipped:', e.message);
    }

    // Initialize proximity alerts
    try {
      initProximityAlerts();
    } catch (e) {
      console.warn('Proximity alerts skipped:', e.message);
    }

    // Preload common modals on idle
    try {
      preloadOnIdle();
    } catch (e) {
      console.warn('Modal preload skipped:', e.message);
    }

    // Cleanup old cached data
    cleanupOldData();

    // Initialize Web Vitals monitoring
    try {
      initWebVitals();
    } catch (e) {
      console.warn('Web Vitals init skipped:', e.message);
    }

    // Initialize WASM geo module (non-blocking, JS fallback)
    try {
      initWasm();
    } catch (e) {
      console.warn('WASM geo init skipped:', e.message);
    }

    // Initialize PostHog analytics (only if consent given + key configured)
    try {
      const { initPostHog } = await import('./utils/posthog.js');
      initPostHog();
    } catch (e) {
      console.warn('PostHog init skipped:', e.message);
    }

    // Initialize predictive prefetch on hover
    try {
      initHoverPrefetch();
    } catch (e) {
      console.warn('Hover prefetch skipped:', e.message);
    }

    // Cleanup expired form drafts
    try {
      cleanupDrafts();
    } catch (e) {
      console.warn('Draft cleanup skipped:', e.message);
    }

    // Subscribe to state changes and render
    subscribe((state) => {
      scheduleRender(() => render(state));
    });

    // Load initial data (AFTER subscribe so state changes trigger render)
    loadInitialData();

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

    // Register cleanup on page unload
    window.addEventListener('beforeunload', runAllCleanup);

    console.log('✅ SpotHitch ready!');
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
          <style>.reload-btn{margin-top:16px;padding:8px 16px;background:#0ea5e9;color:#fff;
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
  } catch (e) {}

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
      (error) => {
        console.log('Location not available:', error.message);
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
        console.log(`📍 ${newSpots.length} spots chargés à proximité`)
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
  const mainContent = document.getElementById('main-content');
  if (mainContent && tab) {
    scrollPositions.set(tab, mainContent.scrollTop);
  }
}

/**
 * Restore scroll position for tab
 */
function restoreScrollPosition(tab) {
  const mainContent = document.getElementById('main-content');
  const saved = scrollPositions.get(tab);
  if (mainContent && saved !== undefined) {
    mainContent.scrollTop = saved;
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

  // Save scroll position before re-render if tab changed
  if (previousTab && previousTab !== state.activeTab) {
    saveScrollPosition(previousTab);
  }

  // Preserve map containers across re-renders to avoid destroying Leaflet
  const isMapTab = state.activeTab === 'map' || state.activeTab === 'home'
  const isFullMapTab = state.activeTab === 'fullmap'
  const mainMapContainer = document.getElementById('main-map')
  const homeMapContainer = document.getElementById('home-map')
  const hasMainMap = mainMapContainer && window.mapInstance
  const hasHomeMap = homeMapContainer && window.homeMapInstance
  const savedMainMap = hasMainMap ? mainMapContainer : null
  const savedHomeMap = hasHomeMap ? homeMapContainer : null

  app.innerHTML = renderApp(state);

  // Re-insert preserved map containers
  if (savedMainMap && isFullMapTab) {
    const slot = document.getElementById('main-map')
    if (slot) slot.replaceWith(savedMainMap)
  }
  if (savedHomeMap && isMapTab) {
    const slot = document.getElementById('home-map')
    if (slot) slot.replaceWith(savedHomeMap)
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
    setTimeout(() => restoreScrollPosition(state.activeTab), 50);
  }
  previousTab = state.activeTab;

  // Initialize maps based on view
  if (state.activeTab === 'spots' && state.viewMode === 'map') {
    initMapService();
  }
  if (state.activeTab === 'fullmap') {
    initMapService();
  }
}

/**
 * Register service worker with aggressive auto-update
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/Spothitch/sw.js')
    console.log('✅ Service Worker registered')

    // Check for updates every 2 minutes
    setInterval(() => registration.update(), 2 * 60 * 1000)

    // Check for updates when user returns to the app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })

    // Check on online recovery
    window.addEventListener('online', () => registration.update())

    // Auto-reload when new SW takes control
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    // Force activate new SW immediately when found
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })

    // If a waiting worker already exists (e.g. from previous visit), activate it now
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
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
  console.log('🗺️ openFullMap called');
  setState({ activeTab: 'spots', viewMode: 'map' });
  trackPageView('spots-map');
  // Initialize map after DOM update
  setTimeout(() => {
    console.log('🗺️ Calling initMapService...');
    initMapService();
  }, 200);
};
window.toggleTheme = () => actions.toggleTheme();
window.setViewMode = (mode) => {
  setState({ viewMode: mode });
  // Initialize map after DOM update
  if (mode === 'map') {
    setTimeout(() => initMapService(), 100);
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
    centerOnSpot(spot);
  }
};
window.openSpotDetail = window.selectSpot; // alias for services that use openSpotDetail
window.closeSpotDetail = () => actions.selectSpot(null);
window.openAddSpot = () => setState({ showAddSpot: true });
window.closeAddSpot = () => setState({ showAddSpot: false });

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
window.triggerPhotoUpload = () => {
  const input = document.getElementById('spot-photo-input');
  if (input) input.click();
};
window.doCheckin = (spotId) => {
  recordCheckin();
  saveValidationToFirebase(spotId, getState().user?.uid);
  showToast(t('checkinSuccess'), 'success');
  announceAction('checkin', true);

  // Show share card after checkin
  const { spots } = getState();
  const spot = spots.find(s => s.id == spotId);
  if (spot) {
    setTimeout(() => {
      try {
        showShareModal(spot);
      } catch (err) {
        console.warn('Failed to show share modal:', err);
      }
    }, 500);
  }
  // Log to trip history
  logTripEvent('checkin', { spotId });
};
window.submitReview = async (spotId) => {
  const comment = document.getElementById('review-comment')?.value;
  const rating = getState().currentRating || 4;
  if (comment) {
    await saveCommentToFirebase({ spotId, text: comment, rating });
    recordReview();
    showToast(t('reviewPublished') || 'Avis publié !', 'success');
    setState({ showRating: false });
  }
};
window.setRating = (rating) => setState({ currentRating: rating });
window.reportSpotAction = async (spotId) => {
  const reason = prompt(t('reportReason') || 'Raison du signalement ?');
  if (reason) {
    await reportSpot(spotId, reason);
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
  // Show contextual tip for SOS feature
  try {
    const { triggerSOSTip } = await import('./services/contextualTips.js');
    triggerSOSTip();
  } catch (e) {
    // Silently fail if tips service not available
  }
};
window.closeSOS = () => setState({ showSOS: false });

// Missing handlers (prevent ReferenceError on click)
window.openAccessibilityHelp = () => showToast(t('accessibilityHelp') || 'Accessibilité : utilise les raccourcis clavier et le zoom du navigateur', 'info')
window.showFriendOptions = () => showToast(t('friendOptionsSoon') || 'Options ami bientôt disponibles', 'info')
window.showFullNavigation = () => changeTab('map')
window.shareSOSLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        if (navigator.share) {
          navigator.share({
            title: t('sosShareTitle') || 'Ma position SOS - SpotHitch',
            text: t('sosShareText') || 'Je suis en situation d\'urgence. Voici ma position :',
            url: url
          });
        } else {
          navigator.clipboard.writeText(url);
          showToast(t('linkCopied') || 'Lien copié !', 'success');
        }
      },
      () => showToast(t('positionFailed') || 'Impossible de récupérer la position', 'error')
    );
  }
};
window.markSafe = () => {
  setState({ sosActive: false });
  showToast(t('markedSafe') || 'Vous êtes marqué en sécurité', 'success');
};
window.addEmergencyContact = () => {
  const name = document.getElementById('emergency-name')?.value;
  const phone = document.getElementById('emergency-phone')?.value;
  if (!name || !phone) {
    showToast(t('fillNameAndNumber') || 'Remplissez le nom et le numéro', 'warning');
    return;
  }
  const { emergencyContacts = [] } = getState();
  setState({ emergencyContacts: [...emergencyContacts, { name, phone }] });
  document.getElementById('emergency-name').value = '';
  document.getElementById('emergency-phone').value = '';
  showToast(t('contactAdded') || 'Contact ajouté !', 'success');
};
window.removeEmergencyContact = (index) => {
  const { emergencyContacts = [] } = getState();
  setState({ emergencyContacts: emergencyContacts.filter((_, i) => i !== index) });
};

// Auth handlers
window.openAuth = () => setState({ showAuth: true });
window.closeAuth = () => setState({ showAuth: false });
window.setAuthMode = (mode) => setState({ authMode: mode });
window.handleLogin = async (e) => {
  e?.preventDefault();
  const form = document.getElementById('auth-form');
  if (!form) return;
  const email = form.querySelector('[name="email"]')?.value || document.getElementById('auth-email')?.value;
  const password = form.querySelector('[name="password"]')?.value || document.getElementById('auth-password')?.value;
  if (!email || !password) {
    showToast(t('fillAllFields') || 'Veuillez remplir tous les champs', 'error');
    return;
  }
  const result = await signIn(email, password);
  if (result.success) {
    setState({ showAuth: false });
    showToast(t('loginSuccess') || 'Connexion réussie !', 'success');
  } else {
    showToast(t('loginError') || 'Erreur de connexion', 'error');
  }
};
window.handleSignup = async (e) => {
  e?.preventDefault();
  const form = document.getElementById('auth-form');
  if (!form) return;
  const name = form.querySelector('[name="name"]')?.value || document.getElementById('auth-username')?.value;
  const email = form.querySelector('[name="email"]')?.value || document.getElementById('auth-email')?.value;
  const password = form.querySelector('[name="password"]')?.value || document.getElementById('auth-password')?.value;
  if (!email || !password) {
    showToast(t('fillAllFields') || 'Veuillez remplir tous les champs', 'error');
    return;
  }
  const result = await signUp(email, password, name || t('defaultUser') || 'Utilisateur');
  if (result.success) {
    setState({ showAuth: false });
    showToast(t('accountCreated') || 'Compte créé !', 'success');
  } else {
    showToast(t('signupError') || 'Erreur lors de l\'inscription', 'error');
  }
};
window.handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  if (result.success) {
    setState({ showAuth: false });
    showToast(t('googleLoginSuccess') || 'Connexion Google réussie !', 'success');
  } else {
    showToast(t('googleLoginError') || 'Erreur de connexion Google', 'error');
  }
};
window.handleForgotPassword = async () => {
  const email = document.querySelector('[name="email"]')?.value || document.getElementById('auth-email')?.value;
  if (!email) {
    showToast(t('enterEmailFirst') || 'Entrez votre email d\'abord', 'warning');
    return;
  }
  const result = await resetPassword(email);
  if (result.success) {
    showToast(t('resetEmailSent') || 'Email de réinitialisation envoyé !', 'success');
  } else {
    showToast(t('sendError') || 'Erreur lors de l\'envoi', 'error');
  }
};
window.handleLogout = async () => {
  await logOut();
  actions.setUser(null);
  showToast(t('logoutSuccess') || 'Déconnexion réussie', 'success');
};

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

// Welcome handlers
window.selectAvatar = (avatar) => setState({ selectedAvatar: avatar });
window.completeWelcome = () => {
  const { selectedAvatar } = getState();
  const name = document.getElementById('welcome-name')?.value || t('traveler') || 'Voyageur';
  localStorage.setItem('spothitch_user', JSON.stringify({ name, avatar: selectedAvatar }));
  setState({ showWelcome: false, userName: name, userAvatar: selectedAvatar });
  showToast(`${t('welcome') || 'Bienvenue'} ${name} !`, 'success');
};
window.skipWelcome = () => {
  localStorage.setItem('spothitch_welcomed', 'true');
  setState({ showWelcome: false });
};

// Settings handlers
window.openSettings = () => setState({ showSettings: true });
window.closeSettings = () => setState({ showSettings: false });
window.setLanguage = (lang) => {
  // Write lang directly to localStorage BEFORE anything else
  // This ensures it survives the reload regardless of state/render timing
  try {
    const stored = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
    stored.lang = lang
    localStorage.setItem('spothitch_v4_state', JSON.stringify(stored))
  } catch (e) {}
  // Also set via normal state (for any subscribers that run before reload)
  setLanguage(lang)
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
  import('./components/modals/Tutorial.js').then(({ tutorialSteps, executeStepAction, cleanupTutorialTargets }) => {
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
window.finishTutorial = () => {
  const state = getState();
  const tutorialCompleted = state.tutorialCompleted;

  // Clean up tutorial targets
  import('./components/modals/Tutorial.js').then(({ cleanupTutorialTargets }) => {
    cleanupTutorialTargets();
  });

  setState({ showTutorial: false, tutorialStep: 0, tutorialCompleted: true });
  actions.changeTab('map');

  // Award rewards if first time completing
  if (!tutorialCompleted) {
    addPoints(100, 'tutorial_complete');
    addSeasonPoints(20);
    showToast(t('tutorialCompleted') || 'Tutoriel termine ! +100 points bonus !', 'success');
    // Trigger confetti
    if (window.launchConfetti) {
      window.launchConfetti();
    }
  } else {
    showToast(t('tutorialReviewed') || 'Tutoriel revu ! Bonne route !', 'success');
  }
};

// Chat handlers
window.setChatRoom = (room) => setState({ chatRoom: room });
window.sendMessage = async () => {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text) return;
  const { chatRoom } = getState();
  await sendChatMessage(chatRoom || 'general', text);
  if (input) input.value = '';
};

// Filter handlers
window.setFilter = (filter) => actions.setFilter(filter);
window.handleSearch = (query) => debounce('search', () => actions.setSearchQuery(query), 250);
window.openFilters = () => setState({ showFilters: true });
window.closeFilters = () => setState({ showFilters: false });
window.setFilterCountry = (country) => setState({ filterCountry: country });
window.setFilterMinRating = (rating) => setState({ filterMinRating: rating });
window.setFilterMaxWait = (wait) => setState({ filterMaxWait: wait });
window.toggleVerifiedFilter = () => {
  const { filterVerifiedOnly } = getState();
  setState({ filterVerifiedOnly: !filterVerifiedOnly });
};
window.setSortBy = (sortBy) => setState({ sortBy });
window.applyFilters = () => {
  setState({ showFilters: false });
  // Force map re-init with new filters
  destroyMaps();
  setTimeout(() => initMapService(), 200);
};
window.resetFilters = () => resetFiltersUtil();

// Quiz handlers
window.openQuiz = () => setState({ showQuiz: true });
window.closeQuiz = () => setState({ showQuiz: false, quizActive: false, quizResult: null });
window.startQuizGame = () => {
  startQuiz();
};
window.answerQuizQuestion = (answerIndex) => {
  answerQuizQuestion(answerIndex);
};
window.retryQuiz = () => {
  startQuiz();
};

// Badge handlers
window.openBadges = () => setState({ showBadges: true });
window.closeBadges = () => setState({ showBadges: false });
window.showBadgeDetail = (badgeId) => setState({ showBadgeDetail: true, selectedBadgeId: badgeId });
window.closeBadgeDetail = () => setState({ showBadgeDetail: false, selectedBadgeId: null });
window.dismissBadgePopup = () => setState({ showBadgePopup: false, newBadge: null });

// Challenge handlers
window.openChallenges = () => setState({ showChallenges: true });
window.closeChallenges = () => setState({ showChallenges: false });
window.setChallengeTab = (tab) => setState({ challengeTab: tab });

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
window.activateBooster = (boosterId) => {
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
    document.getElementById('city-suggestions')?.classList.add('hidden');
    return;
  }
  debounce('tripCity', async () => {
    const results = await searchTripLocation(query);
    const container = document.getElementById('city-suggestions');
    if (container && results.length > 0) {
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          ${results.map(r => `
            <button onclick="addTripStepFromSearch('${r.name}', ${r.lat}, ${r.lng}, '${r.fullName}')"
                    class="w-full px-4 py-3 text-left text-white hover:bg-gray-700 border-b border-gray-700 last:border-0">
              <div class="font-medium">${r.name}</div>
              <div class="text-xs text-gray-500 truncate">${r.fullName}</div>
            </button>
          `).join('')}
        </div>
      `;
    }
  }, 400);
};
window.addTripStepFromSearch = (name, lat, lng, fullName) => {
  addTripStep({ name, lat, lng, fullName });
  document.getElementById('step-input').value = '';
  document.getElementById('city-suggestions')?.classList.add('hidden');
};
window.addFirstSuggestion = () => {
  const firstBtn = document.querySelector('#city-suggestions button');
  if (firstBtn) firstBtn.click();
};
window.removeTripStep = (index) => removeTripStep(index);
window.moveTripStep = (from, to) => reorderTripSteps(from, to);
window.clearTripSteps = () => clearTripSteps();

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
      console.log('Guide report saved to Firestore');
    } catch (error) {
      console.warn('Could not save guide report to Firestore:', error);
    }

    showToast(t('thankYouReport') || 'Merci pour le signalement ! Nous allons vérifier.', 'success');
  }
};

// Friends handlers
window.showFriends = () => setState({ activeTab: 'friends', selectedFriendId: null });
window.openFriendsChat = (friendId) => setState({ selectedFriendId: friendId });

// Animation handlers (global)
window.showSuccessAnimation = showSuccessAnimation;
window.showErrorAnimation = showErrorAnimation;
window.showBadgeUnlock = showBadgeUnlockAnimation;
window.showLevelUp = showLevelUpAnimation;
window.showPoints = showPointsAnimation;
window.playSound = playSound;
window.launchConfetti = launchConfetti;
window.launchConfettiBurst = launchConfettiBurst;

// Sharing handlers (global)
window.shareSpot = shareSpot;
window.shareBadge = shareBadge;
window.shareStats = shareStats;
window.shareApp = shareApp;
window.showAddFriend = () => setState({ showAddFriend: true });
window.closeAddFriend = () => setState({ showAddFriend: false });
window.acceptFriendRequest = (requestId) => {
  // Accept friend logic
  showToast(t('friendAccepted') || 'Ami accepté !', 'success');
};
window.rejectFriendRequest = (requestId) => {
  // Reject friend logic
};
window.sendPrivateMessage = (friendId) => {
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

// Friend Challenges handlers (#157)
window.createFriendChallenge = (friendId, typeId, target = null, durationDays = 7) => {
  const challenge = createChallenge(friendId, typeId, target, durationDays);
  if (challenge) {
    trackPageView('/action/challenge_created');
  }
};

window.acceptFriendChallenge = (challengeId) => {
  const success = acceptChallenge(challengeId);
  if (success) {
    trackPageView('/action/challenge_accepted');
  }
  renderApp();
};

window.declineFriendChallenge = (challengeId) => {
  const success = declineChallenge(challengeId);
  if (success) {
    trackPageView('/action/challenge_declined');
  }
  renderApp();
};

window.cancelFriendChallenge = (challengeId) => {
  const success = cancelChallenge(challengeId);
  if (success) {
    trackPageView('/action/challenge_cancelled');
  }
  renderApp();
};

window.syncFriendChallenges = () => {
  syncChallengeProgress();
  renderApp();
};

window.getActiveFriendChallenges = getActiveFriendChallenges;
window.getPendingFriendChallenges = getPendingChallenges;
window.getChallengeStats = getChallengeStats;
window.getChallengeTypes = getChallengeTypes;

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
window.centerOnUser = centerOnUser;

// Titles modal handler
window.openTitles = () => setState({ showTitles: true });
window.closeTitles = () => setState({ showTitles: false });

// Skill tree handlers
window.openSkillTree = () => setState({ showSkillTree: true });
window.closeSkillTree = () => setState({ showSkillTree: false });
window.unlockSkillAction = unlockSkill;
window.awardSkillPoints = awardSkillPoints;

// Team challenges handlers
window.openTeamChallenges = () => setState({ showTeamChallenges: true });
window.closeTeamChallenges = () => setState({ showTeamChallenges: false });
window.openCreateTeam = () => setState({ showCreateTeam: true });
window.closeCreateTeam = () => setState({ showCreateTeam: false });
window.createTeamAction = createTeam;
window.joinTeamAction = joinTeam;
window.leaveTeamAction = leaveTeam;
window.startTeamChallengeAction = startTeamChallenge;

// Travel groups handlers
window.openTravelGroups = () => setState({ activeTab: 'travel-groups' });
window.openCreateTravelGroup = () => setState({ showCreateTravelGroup: true });
window.closeCreateTravelGroup = () => setState({ showCreateTravelGroup: false });
window.openTravelGroupDetail = (groupId) => setState({ showTravelGroupDetail: true, selectedTravelGroupId: groupId });
window.closeTravelGroupDetail = () => setState({ showTravelGroupDetail: false, selectedTravelGroupId: null });
window.createTravelGroupAction = createTravelGroup;
window.joinTravelGroupAction = joinTravelGroup;
window.leaveTravelGroupAction = leaveTravelGroup;

// Nearby friends handlers
window.toggleNearbyFriends = toggleNearbyFriends;
window.openNearbyFriends = () => setState({ showNearbyFriends: true });
window.closeNearbyFriends = () => setState({ showNearbyFriends: false });

// Profile customization handlers
window.openProfileCustomization = () => setState({ showProfileCustomization: true });
window.closeProfileCustomization = () => setState({ showProfileCustomization: false });
window.equipFrameAction = equipFrame;
window.equipTitleAction = equipTitle;

// Proximity alerts handlers
window.toggleProximityAlerts = toggleProximityAlerts;
window.setProximityRadius = setProximityRadius;

// Trip history handlers
window.openTripHistory = () => setState({ showTripHistory: true });
window.closeTripHistory = () => setState({ showTripHistory: false });
window.clearTripHistory = () => {
  if (confirm(t('clearTripHistory') || 'Effacer tout l\'historique de voyage ?')) {
    clearTripHistory();
    setState({ showTripHistory: false });
  }
};

// Image handlers
window.compressImage = compressImage;
window.generateThumbnail = generateThumbnail;
window.validateImage = validateImage;

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
  showToast(t('changelog') || 'Changelog - Version 2.0\n\n✨ Nouvelle interface avec Vite\n🎮 Gamification améliorée\n🗺️ Carte interactive Leaflet\n📱 PWA complète\n🌍 Support multilingue', 'info');
};
window.openRoadmap = () => {
  showToast(t('roadmap') || 'Roadmap SpotHitch 2026\n\n✅ Chat temps réel\n✅ Messages privés\n✅ Vérification identité\n🔄 Guerres de guildes\n🔄 Événements saisonniers\n🔄 Intégration natives (iOS/Android)', 'info');
};
window.openContactForm = () => {
  setState({ showContactForm: true });
  showToast(t('contactFormOpen') || 'Formulaire de contact ouvert', 'info');
};

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
      btn.className = 'category-btn py-3 px-2 rounded-lg text-center transition-all border-2 border-primary-500 bg-primary-500/20';
    } else {
      btn.className = 'category-btn py-3 px-2 rounded-lg text-center transition-all border border-white/10 hover:border-primary-500';
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

// ==================== OFFLINE DOWNLOAD HANDLERS ====================

window.downloadCountryOffline = async (code, name) => {
  const btn = document.getElementById(`offline-download-${code}`)
  if (btn) {
    btn.disabled = true
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${t('downloading') || 'Téléchargement...'}`
  }
  try {
    const { downloadCountrySpots } = await import('./services/offlineDownload.js')
    const result = await downloadCountrySpots(code, (progress) => {
      if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${progress}%`
    })
    if (result.success) {
      showToast(`${name}: ${result.count} ${t('spotsDownloaded') || 'spots téléchargés pour offline'}`, 'success')
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check mr-2"></i>${t('downloaded') || 'Téléchargé'}`
        btn.classList.remove('border-primary-500/30', 'text-primary-400')
        btn.classList.add('border-green-500/30', 'text-green-400')
      }
    } else {
      showToast(t('downloadFailed') || 'Échec du téléchargement', 'error')
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `<i class="fas fa-download"></i> ${t('downloadForOffline') || 'Télécharger pour offline'}`
      }
    }
  } catch (e) {
    console.error('Offline download error:', e)
    showToast(t('downloadError') || 'Erreur lors du téléchargement', 'error')
    if (btn) {
      btn.disabled = false
      btn.innerHTML = `<i class="fas fa-download"></i> ${t('downloadForOffline') || 'Télécharger pour offline'}`
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

// Home search with debounce — just search a place and center the map
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
            ${results.map((r, i) => `
              <button
                onclick="homeSelectPlace(${r.lat}, ${r.lng}, '${(r.name || '').split(',').slice(0, 2).join(',').replace(/'/g, "\\'")}')"
                class="w-full px-4 py-3 text-left text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-all"
                data-home-suggestion="${i}"
              >
                <div class="font-medium text-sm truncate">${(r.name || '').split(',').slice(0, 2).join(',')}</div>
                <div class="text-xs text-slate-400 truncate">${r.name}</div>
              </button>
            `).join('')}
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

// Simple haversine for distance calculations
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
