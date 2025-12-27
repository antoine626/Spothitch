/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Styles
import './styles/main.css';

// State & Store
import { getState, setState, subscribe, actions } from './stores/state.js';

// Services
import { initializeFirebase, onAuthChange, signIn, signUp, signInWithGoogle, logOut } from './services/firebase.js';
import { initSentry, setupGlobalErrorHandlers, setUser as setSentryUser } from './services/sentry.js';
import { initNotifications, showToast, showSuccess, showError } from './services/notifications.js';
import { initOfflineHandler } from './services/offline.js';

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
  console.log('🚀 SpotHitch initializing...');

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

    // Initialize error tracking
    try {
      await initSentry();
      setupGlobalErrorHandlers();
    } catch (e) {
      console.warn('Sentry skipped:', e.message);
    }

    // Initialize Firebase
    try {
      initializeFirebase();
      onAuthChange((user) => {
        actions.setUser(user);
        setSentryUser(user);
        if (user) {
          console.log('✅ User logged in:', user.displayName);
        }
      });
    } catch (e) {
      console.warn('Firebase skipped:', e.message);
    }

    // Initialize notifications
    try {
      await initNotifications();
    } catch (e) {
      console.warn('Notifications skipped:', e.message);
    }

    // Initialize offline handler
    try {
      initOfflineHandler();
    } catch (e) {
      console.warn('Offline handler skipped:', e.message);
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
 * Show error screen
 */
function showErrorScreen(message) {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.innerHTML = `
      <div style="text-align:center;padding:20px;max-width:400px">
        <div style="color:#ef4444;font-size:48px;margin-bottom:16px">⚠️</div>
        <div style="color:#fff;font-size:18px;margin-bottom:8px">Erreur</div>
        <div style="color:#94a3b8;font-size:12px">${message}</div>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer">Réessayer</button>
      </div>
    `;
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

  // Track page view
  trackPageView(state.activeTab);
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
 * Register service worker for PWA
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/Spothitch/sw.js')
        .then((reg) => console.log('✅ Service Worker registered'))
        .catch((err) => console.log('SW registration failed:', err));
    });
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      const state = getState();
      if (state.selectedSpot) actions.selectSpot(null);
      if (state.showAddSpot) setState({ showAddSpot: false });
      if (state.showAuth) setState({ showAuth: false });
      if (state.showSOS) setState({ showSOS: false });
    }

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('input[type="search"]')?.focus();
    }

    // Number keys for tabs
    if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey) {
      const tabs = ['home', 'spots', 'planner', 'chat', 'profile'];
      const tabIndex = parseInt(e.key) - 1;
      if (tabs[tabIndex]) {
        actions.setTab(tabs[tabIndex]);
      }
    }
  });
}

// ==================== GLOBAL FUNCTIONS FOR ONCLICK ====================

// Navigation
window.setTab = (tab) => {
  actions.setTab(tab);
  announce(t(tab));
};

window.setViewMode = (mode) => {
  actions.setViewMode(mode);
  if (mode === 'map') {
    // Reset map on view change
    window.spotHitchMap = null;
  }
};

// Spots
window.openSpotDetail = (spotId) => {
  const state = getState();
  const spot = state.spots.find(s => s.id === spotId);
  if (spot) {
    actions.selectSpot(spot);
  }
};

window.closeSpotDetail = () => {
  actions.selectSpot(null);
};

window.openAddSpot = () => {
  setState({ showAddSpot: true });
};

window.closeAddSpot = () => {
  setState({ showAddSpot: false });
};

window.submitSpot = async () => {
  const from = document.getElementById('spot-from')?.value;
  const to = document.getElementById('spot-to')?.value;
  const description = document.getElementById('spot-description')?.value;

  if (from && to) {
    // Add spot logic here
    showSuccess('Spot ajouté avec succès !');
    setState({ showAddSpot: false });
  } else {
    showError('Veuillez remplir tous les champs');
  }
};

// Auth
window.openAuth = () => {
  setState({ showAuth: true });
};

window.closeAuth = () => {
  setState({ showAuth: false });
};

window.handleLogin = async (e) => {
  e?.preventDefault();
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;

  if (email && password) {
    const result = await signIn(email, password);
    if (result.success) {
      setState({ showAuth: false });
      showSuccess('Connexion réussie !');
    } else {
      showError('Email ou mot de passe incorrect');
    }
  }
};

window.handleSignup = async (e) => {
  e?.preventDefault();
  const email = document.getElementById('signup-email')?.value;
  const password = document.getElementById('signup-password')?.value;
  const name = document.getElementById('signup-name')?.value;

  if (email && password && name) {
    const result = await signUp(email, password, name);
    if (result.success) {
      setState({ showAuth: false });
      showSuccess('Compte créé avec succès !');
    } else {
      showError('Erreur lors de l\'inscription');
    }
  }
};

window.handleGoogleLogin = async () => {
  const result = await signInWithGoogle();
  if (result.success) {
    setState({ showAuth: false });
    showSuccess('Connexion réussie !');
  }
};

window.handleLogout = async () => {
  await logOut();
  showSuccess('Déconnexion réussie');
};

window.handleForgotPassword = () => {
  showToast('Fonctionnalité bientôt disponible', 'info');
};

// SOS
window.openSOS = () => {
  setState({ showSOS: true });
};

window.closeSOS = () => {
  setState({ showSOS: false });
};

window.sendSOSAlert = () => {
  showToast('🆘 Alerte SOS envoyée !', 'warning');
  setState({ showSOS: false });
};

window.callEmergency = (number) => {
  window.location.href = `tel:${number}`;
};

window.shareLocation = async () => {
  if (navigator.share && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      try {
        await navigator.share({
          title: 'Ma position - SpotHitch SOS',
          text: 'J\'ai besoin d\'aide à cette position',
          url: url
        });
        showSuccess('Position partagée');
      } catch (e) {
        // User cancelled
      }
    });
  } else {
    showError('Partage non disponible sur cet appareil');
  }
};

// Welcome
window.completeWelcome = () => {
  const username = document.getElementById('welcome-username')?.value?.trim() || 'Voyageur';
  actions.updateProfile({
    username,
    avatar: window.selectedAvatar || '🤙',
  });
  showSuccess(`Bienvenue ${username} !`);
};

window.skipWelcome = () => {
  setState({ showWelcome: false });
};

window.selectedAvatar = '🤙';
window.selectAvatar = (avatar) => {
  window.selectedAvatar = avatar;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.avatar === avatar);
  });
};

// Tutorial
window.nextTutorial = () => actions.nextTutorialStep();
window.prevTutorial = () => actions.prevTutorialStep();
window.skipTutorial = () => actions.skipTutorial();

// Filters & Search
window.setFilter = (filter) => actions.setFilter(filter);
window.handleSearch = (query) => actions.setSearchQuery(query);
window.setCountryFilter = (country) => actions.setCountryFilter(country);

// Check-in & Rating
window.doCheckin = (spotId) => {
  actions.incrementCheckins();
  showSuccess(t('checkinSuccess'));
};

window.rateSpot = (spotId, rating) => {
  showSuccess('Note enregistrée !');
};

// Language
window.changeLanguage = (lang) => {
  setLanguage(lang);
  actions.setLanguage(lang);
  showSuccess(`Langue changée: ${lang.toUpperCase()}`);
};

// Theme
window.toggleTheme = () => {
  const state = getState();
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  actions.setTheme(newTheme);
};

// Chat
window.sendMessage = async () => {
  const input = document.getElementById('chat-input');
  const message = input?.value?.trim();
  if (message) {
    // Send message logic
    input.value = '';
    showToast('Message envoyé', 'success');
  }
};

// Profile
window.updateProfile = () => {
  showToast('Profil mis à jour', 'success');
};

// Translation function
window.t = t;

// Expose showToast globally
window.showToast = showToast;

// ==================== START APP ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
