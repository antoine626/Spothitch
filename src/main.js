/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Global error handler - catch any unhandled errors
window.onerror = (msg, url, line) => {
  console.error('Global error:', msg, url, line);
  showErrorScreen(`${msg} (ligne ${line})`);
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason);
  showErrorScreen(event.reason?.message || 'Promise rejection');
};

function showErrorScreen(message) {
  const loader = document.getElementById('app-loader');
  if (loader && !loader.dataset.error) {
    loader.dataset.error = 'true';
    loader.innerHTML = `
      <div style="text-align:center;padding:20px;max-width:400px">
        <div style="color:#ef4444;font-size:48px;margin-bottom:16px">⚠️</div>
        <div style="color:#fff;font-size:18px;margin-bottom:8px">Erreur</div>
        <div style="color:#94a3b8;font-size:12px;word-break:break-all">${message}</div>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer">Réessayer</button>
      </div>
    `;
  }
}

function updateLoaderText(text) {
  const el = document.getElementById('loader-text');
  if (el) el.textContent = text;
}

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
    updateLoaderText('Initialisation...');

    // Set detected language
    const lang = detectLanguage();
    setLanguage(lang);
    console.log('Language set:', lang);

    // Initialize SEO
    initSEO();
    console.log('SEO initialized');

    // Check reduced motion preference
    if (prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Load initial data FIRST
    updateLoaderText('Chargement des spots...');
    loadInitialData();
    console.log('Data loaded');

    // Subscribe to state changes and render
    updateLoaderText('Affichage...');
    subscribe((state) => {
      console.log('Render triggered, spots:', state.spots?.length);
      render(state);
    });

    // Hide loader immediately
    hideLoader();

    console.log('✅ SpotHitch basic init done!');

    // Non-blocking optional services
    setTimeout(async () => {
      try {
        initializeFirebase();
        onAuthChange((user) => {
          actions.setUser(user);
          setSentryUser(user);
        });
      } catch (e) {
        console.warn('Firebase skipped:', e.message);
      }

      try {
        await initSentry();
        setupGlobalErrorHandlers();
      } catch (e) {
        console.warn('Sentry skipped:', e.message);
      }

      try {
        await initNotifications();
      } catch (e) {
        console.warn('Notifications skipped:', e.message);
      }

      registerServiceWorker();
      setupKeyboardShortcuts();
      console.log('✅ SpotHitch fully ready!');
    }, 100);

  } catch (error) {
    console.error('❌ Init error:', error);
    showErrorScreen(error.message);
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

// Debug: Show we got this far
console.log('📦 Main module loaded successfully');
