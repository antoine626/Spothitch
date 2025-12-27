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
  sendChatMessage
} from './services/firebase.js';
import { initSentry, setupGlobalErrorHandlers, setUser as setSentryUser } from './services/sentry.js';
import { initNotifications, showToast } from './services/notifications.js';
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

// Auth handlers
window.setAuthMode = (mode) => setState({ authMode: mode });
window.handleLogin = async (e) => {
  e?.preventDefault();
  const form = document.getElementById('auth-form');
  if (!form) return;
  const email = form.querySelector('[name="email"]')?.value;
  const password = form.querySelector('[name="password"]')?.value;
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
  const name = form.querySelector('[name="name"]')?.value;
  const email = form.querySelector('[name="email"]')?.value;
  const password = form.querySelector('[name="password"]')?.value;
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
  const email = document.querySelector('[name="email"]')?.value;
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

// Spot handlers
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

// SOS handlers
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

// Tutorial handlers
window.startTutorial = () => {
  setState({ showTutorial: true, tutorialStep: 0 });
};

// ==================== START APP ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
