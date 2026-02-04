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
import { countryGuides, getGuideByCode } from './data/guides.js';

// Utils
import { initSEO, trackPageView } from './utils/seo.js';
import { announce, announceAction, prefersReducedMotion } from './utils/a11y.js';
import { initPWA, showInstallBanner, dismissInstallBanner, installPWA } from './utils/pwa.js';
import { initNetworkMonitor, updateNetworkStatus, cleanupOldData } from './utils/network.js';
import { scheduleRender, debouncedRender } from './utils/render.js';
import { sanitize, sanitizeInput } from './utils/sanitize.js';
import { runAllCleanup, registerCleanup } from './utils/cleanup.js';
import { initDeepLinkListener, handleDeepLink, shareLink } from './utils/deeplink.js';
import { setupGlobalErrorHandlers as setupErrorHandlers, withErrorBoundary } from './utils/errorBoundary.js';
import { showSuccessAnimation, showErrorAnimation, showBadgeUnlockAnimation, showLevelUpAnimation, showPointsAnimation, playSound } from './utils/animations.js';
import { shareSpot, shareBadge, shareStats, shareApp } from './utils/share.js';
import { launchConfetti, launchConfettiBurst } from './utils/confetti.js';
import { getErrorMessage, getFormattedError, isRecoverableError } from './utils/errorMessages.js';
import { getFilteredSpots, resetFilters as resetFiltersUtil } from './components/modals/Filters.js';
import { redeemReward } from './components/modals/Shop.js';
import './components/modals/Leaderboard.js'; // Register global handlers
import { registerCheckinHandlers } from './components/modals/CheckinModal.js'; // Checkin modal handlers
import { setupGlobalSwipe } from './utils/swipe.js'; // Swipe navigation
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

    // Preload common modals on idle
    try {
      preloadOnIdle();
    } catch (e) {
      console.warn('Modal preload skipped:', e.message);
    }

    // Cleanup old cached data
    cleanupOldData();

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

    // Setup swipe navigation
    try {
      setupGlobalSwipe();
    } catch (e) {
      console.warn('Swipe navigation skipped:', e.message);
    }

    // Register checkin modal handlers
    try {
      registerCheckinHandlers();
    } catch (e) {
      console.warn('Checkin handlers skipped:', e.message);
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
          <div style="color:#fff;font-size:18px;margin-bottom:8px">Erreur de chargement</div>
          <div style="color:#94a3b8;font-size:14px">${error.message}</div>
          <button onclick="location.reload()" class="reload-btn">Réessayer</button>
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

  // Try to get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        actions.setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Location not available:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

  // Save scroll position before re-render if tab changed
  if (previousTab && previousTab !== state.activeTab) {
    saveScrollPosition(previousTab);
  }

  app.innerHTML = renderApp(state);

  // Call afterRender hook
  afterRender(state);

  // Restore scroll position after render
  if (previousTab !== state.activeTab) {
    setTimeout(() => restoreScrollPosition(state.activeTab), 50);
  }
  previousTab = state.activeTab;

  // Initialize maps based on view
  if (state.activeTab === 'spots' && state.viewMode === 'map') {
    initMapService();
  }
  if (state.activeTab === 'travel') {
    // Travel tab may need planner map
  }
}

/**
 * Register service worker
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/Spothitch/sw.js');
      console.log('✅ Service Worker registered');

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Mise à jour disponible ! Rechargez la page.', 'info', 10000);
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
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
  if (confirm('Réinitialiser l\'application ? Toutes les données locales seront effacées.')) {
    localStorage.clear();
    location.reload();
  }
};

// Navigation
window.changeTab = (tab) => {
  const previousTab = getState().activeTab;

  // Clean up maps when leaving map-related tabs to prevent memory leaks
  if (previousTab !== tab) {
    if (previousTab === 'map' || previousTab === 'spots' || previousTab === 'travel') {
      // Delay cleanup to allow smooth transition
      setTimeout(() => destroyMaps(), 500);
    }
  }

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

// Spot handlers
window.selectSpot = (id) => {
  const { spots } = getState();
  const spot = spots.find(s => s.id === id);
  actions.selectSpot(spot);
  if (spot) centerOnSpot(spot);
};
window.closeSpotDetail = () => actions.selectSpot(null);
window.openAddSpot = () => setState({ showAddSpot: true });
window.closeAddSpot = () => setState({ showAddSpot: false });
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
        showToast('Position récupérée !', 'success');
      },
      () => showToast('Impossible de récupérer la position', 'error'),
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
};
window.submitReview = async (spotId) => {
  const comment = document.getElementById('review-comment')?.value;
  const rating = getState().currentRating || 4;
  if (comment) {
    await saveCommentToFirebase({ spotId, text: comment, rating });
    recordReview();
    showToast('Avis publié !', 'success');
    setState({ showRating: false });
  }
};
window.setRating = (rating) => setState({ currentRating: rating });
window.reportSpotAction = async (spotId) => {
  const reason = prompt('Raison du signalement ?');
  if (reason) {
    await reportSpot(spotId, reason);
    showToast('Signalement envoyé', 'success');
  }
};

// Navigation GPS handlers
window.startSpotNavigation = async (lat, lng, name) => {
  if (!lat || !lng) {
    showToast('Coordonnées manquantes', 'error');
    return;
  }
  // Close spot detail modal
  setState({ selectedSpot: null });
  // Start navigation
  await startNavigation(lat, lng, name || 'Spot d\'autostop');
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
window.shareSOSLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        if (navigator.share) {
          navigator.share({
            title: 'Ma position SOS - SpotHitch',
            text: 'Je suis en situation d\'urgence. Voici ma position :',
            url: url
          });
        } else {
          navigator.clipboard.writeText(url);
          showToast('Lien copié !', 'success');
        }
      },
      () => showToast('Impossible de récupérer la position', 'error')
    );
  }
};
window.markSafe = () => {
  setState({ sosActive: false });
  showToast('Vous êtes marqué en sécurité', 'success');
};
window.addEmergencyContact = () => {
  const name = document.getElementById('emergency-name')?.value;
  const phone = document.getElementById('emergency-phone')?.value;
  if (!name || !phone) {
    showToast('Remplissez le nom et le numéro', 'warning');
    return;
  }
  const { emergencyContacts = [] } = getState();
  setState({ emergencyContacts: [...emergencyContacts, { name, phone }] });
  document.getElementById('emergency-name').value = '';
  document.getElementById('emergency-phone').value = '';
  showToast('Contact ajouté !', 'success');
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
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }
  const result = await signIn(email, password);
  if (result.success) {
    setState({ showAuth: false });
    showToast('Connexion réussie !', 'success');
  } else {
    showToast('Erreur de connexion', 'error');
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
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }
  const result = await signUp(email, password, name || 'Utilisateur');
  if (result.success) {
    setState({ showAuth: false });
    showToast('Compte créé !', 'success');
  } else {
    showToast('Erreur lors de l\'inscription', 'error');
  }
};
window.handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  if (result.success) {
    setState({ showAuth: false });
    showToast('Connexion Google réussie !', 'success');
  } else {
    showToast('Erreur de connexion Google', 'error');
  }
};
window.handleForgotPassword = async () => {
  const email = document.querySelector('[name="email"]')?.value || document.getElementById('auth-email')?.value;
  if (!email) {
    showToast('Entrez votre email d\'abord', 'warning');
    return;
  }
  const result = await resetPassword(email);
  if (result.success) {
    showToast('Email de réinitialisation envoyé !', 'success');
  } else {
    showToast('Erreur lors de l\'envoi', 'error');
  }
};
window.handleLogout = async () => {
  await logOut();
  actions.setUser(null);
  showToast('Déconnexion réussie', 'success');
};

// Welcome handlers
window.selectAvatar = (avatar) => setState({ selectedAvatar: avatar });
window.completeWelcome = () => {
  const { selectedAvatar } = getState();
  const name = document.getElementById('welcome-name')?.value || 'Voyageur';
  localStorage.setItem('spothitch_user', JSON.stringify({ name, avatar: selectedAvatar }));
  setState({ showWelcome: false, userName: name, userAvatar: selectedAvatar });
  showToast(`Bienvenue ${name} !`, 'success');
};
window.skipWelcome = () => {
  localStorage.setItem('spothitch_welcomed', 'true');
  setState({ showWelcome: false });
};

// Settings handlers
window.openSettings = () => setState({ showSettings: true });
window.closeSettings = () => setState({ showSettings: false });
window.setLanguage = (lang) => {
  setLanguage(lang);
  showToast('Langue changée', 'success');
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
  showToast('Tutoriel passé. Tu peux le relancer depuis le Profil.', 'info');
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
    showToast('Tutoriel termine ! +100 points bonus !', 'success');
    // Trigger confetti
    if (window.launchConfetti) {
      window.launchConfetti();
    }
  } else {
    showToast('Tutoriel revu ! Bonne route !', 'success');
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
window.handleSearch = (query) => actions.setSearchQuery(query);
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
window.applyFilters = () => setState({ showFilters: false });
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
  showToast('Avatar équipé !', 'success');
};
window.equipFrame = (frame) => {
  setState({ profileFrame: frame });
  showToast('Cadre équipé !', 'success');
};
window.equipTitle = (title) => {
  setState({ profileTitle: title });
  showToast('Titre équipé !', 'success');
};
window.activateBooster = (boosterId) => {
  // Activate booster logic
  showToast('Booster activé !', 'success');
};

// Stats handlers
window.openStats = () => setState({ showStats: true });
window.closeStats = () => setState({ showStats: false });

// Planner handlers
window.searchTripCity = async (query) => {
  if (query.length < 3) {
    document.getElementById('city-suggestions')?.classList.add('hidden');
    return;
  }
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
window.calculateTrip = async () => {
  const { tripSteps } = getState();
  if (tripSteps.length < 2) return;
  const trip = await createTrip(tripSteps);
  if (trip) {
    setState({ activeTrip: trip });
    initPlannerMap();
    showToast('Itinéraire calculé !', 'success');
  }
};
window.saveCurrentTrip = () => {
  const { activeTrip } = getState();
  if (activeTrip) {
    saveTrip(activeTrip);
  }
};
window.loadSavedTrip = (tripId) => {
  const trip = getTripById(tripId);
  if (trip) {
    setState({ activeTrip: trip, tripSteps: trip.steps, showTripDetail: true, selectedTripId: tripId });
  }
};
window.deleteSavedTrip = (tripId) => {
  deleteTrip(tripId);
};
window.shareTrip = (tripId) => {
  const trip = getTripById(tripId);
  if (trip && navigator.share) {
    navigator.share({
      title: 'Mon voyage SpotHitch',
      text: `Voyage: ${trip.steps.map(s => s.name).join(' → ')}`,
      url: window.location.href,
    });
  }
};

// Guides handlers
window.showGuides = () => setState({ activeTab: 'guides', selectedCountryCode: null, showSafety: false });
window.showCountryDetail = (code) => setState({ selectedCountryCode: code });
window.showSafetyPage = () => setState({ showSafety: true });

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
  showToast('Ami accepté !', 'success');
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
  showToast('Lien copié !', 'success');
};

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

// Image handlers
window.compressImage = compressImage;
window.generateThumbnail = generateThumbnail;
window.validateImage = validateImage;

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

// ==================== START APP ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
