/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Styles
import './styles/main.css';

// State & Store
import { getState, setState, subscribe, actions } from './stores/state.js';

// Services
import { initializeFirebase, onAuthChange } from './services/firebase.js';
import { initSentry, setupGlobalErrorHandlers, setUser as setSentryUser } from './services/sentry.js';
import { initNotifications, showToast } from './services/notifications.js';

// i18n
import { t, detectLanguage, setLanguage } from './i18n/index.js';

// Components
import { renderApp } from './components/App.js';

// Data
import { sampleSpots } from './data/spots.js';

// Utils
import { initSEO, trackPageView } from './utils/seo.js';
import { announce, prefersReducedMotion } from './utils/a11y.js';

// ==================== INITIALIZATION ====================

/**
 * Initialize the application
 */
async function init() {
  try {
    console.log('🚀 SpotHitch initializing...');

    // Set detected language
    const lang = detectLanguage();
    setLanguage(lang);

    // Initialize SEO
    initSEO();

    // Check reduced motion preference
    if (prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Initialize error tracking (optional)
    try {
      await initSentry();
      setupGlobalErrorHandlers();
    } catch (e) {
      console.warn('Sentry init skipped:', e.message);
    }

    // Initialize Firebase (optional)
    try {
      initializeFirebase();
      // Listen to auth state changes
      onAuthChange((user) => {
        actions.setUser(user);
        setSentryUser(user);
        if (user) {
          console.log('✅ User logged in:', user.displayName);
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

    // Load initial data
    loadInitialData();

    // Subscribe to state changes and render
    subscribe((state) => {
      render(state);
    });

    // Hide loader
    hideLoader();

    // Register service worker
    registerServiceWorker();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('✅ SpotHitch ready!');
  } catch (error) {
    console.error('❌ Init error:', error);
    // Show error to user
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.innerHTML = `
        <div style="text-align:center;padding:20px">
          <div style="color:#ef4444;font-size:48px;margin-bottom:16px">⚠️</div>
          <div style="color:#fff;font-size:18px;margin-bottom:8px">Erreur de chargement</div>
          <div style="color:#94a3b8;font-size:14px">${error.message}</div>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer">Réessayer</button>
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
 * Hide the loading screen
 */
function hideLoader() {
  const loader = document.getElementById('app-loader');
  const app = document.getElementById('app');

  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }

  if (app) {
    app.classList.add('loaded');
  }
}

/**
 * Main render function
 */
function render(state) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = renderApp(state);

  // Initialize map if on spots tab with map view
  if (state.activeTab === 'spots' && state.viewMode === 'map') {
    initMap(state);
  }
}

/**
 * Initialize Leaflet map
 */
function initMap(state) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || window.spotHitchMap) return;

  // Dynamically import Leaflet
  import('leaflet').then((L) => {
    const map = L.map('map').setView([48.8566, 2.3522], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add spot markers
    state.spots.forEach((spot) => {
      if (spot.coordinates) {
        L.marker([spot.coordinates.lat, spot.coordinates.lng])
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${spot.from} → ${spot.to}</h3>
              <p class="text-sm mt-1">⭐ ${spot.globalRating?.toFixed(1) || 'N/A'}</p>
            </div>
          `);
      }
    });

    window.spotHitchMap = map;
  });
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
window.changeTab = (tab) => {
  actions.changeTab(tab);
  trackPageView(tab);
  announce(`Navigation vers ${tab}`);
};
window.toggleTheme = () => actions.toggleTheme();
window.setViewMode = (mode) => setState({ viewMode: mode });
window.selectSpot = (id) => {
  const { spots } = getState();
  const spot = spots.find(s => s.id === id);
  actions.selectSpot(spot);
};
window.closeSpotDetail = () => actions.selectSpot(null);
window.openAddSpot = () => setState({ showAddSpot: true });
window.closeAddSpot = () => setState({ showAddSpot: false });
window.openSOS = () => setState({ showSOS: true });
window.closeSOS = () => setState({ showSOS: false });
window.openSettings = () => setState({ showSettings: true });
window.closeSettings = () => setState({ showSettings: false });
window.openAuth = () => setState({ showAuth: true });
window.closeAuth = () => setState({ showAuth: false });
window.nextTutorial = () => actions.nextTutorialStep();
window.prevTutorial = () => actions.prevTutorialStep();
window.skipTutorial = () => actions.skipTutorial();
window.setFilter = (filter) => actions.setFilter(filter);
window.handleSearch = (query) => actions.setSearchQuery(query);
window.doCheckin = (_spotId) => {
  actions.incrementCheckins();
  showToast(t('checkinSuccess'), 'success');
};
window.t = t;

// ==================== START APP ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
