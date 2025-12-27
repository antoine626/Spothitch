/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Styles
import './styles/main.css';

// State
import { getState, setState, subscribe, actions } from './stores/state.js';

// Data
import { sampleSpots } from './data/spots.js';

// Components
import { renderApp } from './components/App.js';

// i18n
import { t, detectLanguage, setLanguage } from './i18n/index.js';

// Services (lazy loaded)
let firebaseModule = null;
let notificationsModule = null;

/**
 * Initialize the application
 */
function init() {
  console.log('🚀 SpotHitch initializing...');

  // Set language
  setLanguage(detectLanguage());

  // Load spots
  actions.setSpots(sampleSpots);

  // Render on state changes
  subscribe((state) => {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = renderApp(state);
      app.classList.add('loaded');
    }
  });

  // Hide loader
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }

  // Load optional services in background
  loadOptionalServices();

  console.log('✅ SpotHitch ready!');
}

/**
 * Load Firebase and other services (non-blocking)
 */
async function loadOptionalServices() {
  try {
    firebaseModule = await import('./services/firebase.js');
    firebaseModule.initializeFirebase();
    firebaseModule.onAuthChange((user) => {
      actions.setUser(user);
    });
  } catch (e) {
    console.warn('Firebase not loaded:', e.message);
  }

  try {
    notificationsModule = await import('./services/notifications.js');
  } catch (e) {
    console.warn('Notifications not loaded:', e.message);
  }
}

// ==================== GLOBAL FUNCTIONS FOR ONCLICK ====================

// Navigation
window.setTab = (tab) => {
  actions.setTab(tab);
};

window.setViewMode = (mode) => {
  actions.setViewMode(mode);
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

  if (firebaseModule && email && password) {
    const result = await firebaseModule.signIn(email, password);
    if (result.success) {
      setState({ showAuth: false });
      showToast('Connexion réussie !', 'success');
    } else {
      showToast('Erreur de connexion', 'error');
    }
  }
};

window.handleSignup = async (e) => {
  e?.preventDefault();
  const email = document.getElementById('signup-email')?.value;
  const password = document.getElementById('signup-password')?.value;
  const name = document.getElementById('signup-name')?.value;

  if (firebaseModule && email && password) {
    const result = await firebaseModule.signUp(email, password, name);
    if (result.success) {
      setState({ showAuth: false });
      showToast('Compte créé !', 'success');
    } else {
      showToast('Erreur d\'inscription', 'error');
    }
  }
};

window.handleGoogleLogin = async () => {
  if (firebaseModule) {
    const result = await firebaseModule.signInWithGoogle();
    if (result.success) {
      setState({ showAuth: false });
      showToast('Connexion réussie !', 'success');
    }
  }
};

window.handleLogout = async () => {
  if (firebaseModule) {
    await firebaseModule.logOut();
    showToast('Déconnexion réussie', 'success');
  }
};

// SOS
window.openSOS = () => {
  setState({ showSOS: true });
};

window.closeSOS = () => {
  setState({ showSOS: false });
};

window.sendSOSAlert = () => {
  showToast('Alerte SOS envoyée !', 'warning');
  setState({ showSOS: false });
};

window.callEmergency = (number) => {
  window.location.href = `tel:${number}`;
};

window.shareLocation = async () => {
  if (navigator.share && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      await navigator.share({
        title: 'Ma position - SpotHitch SOS',
        url: url
      });
    });
  }
};

// Welcome
window.completeWelcome = () => {
  const username = document.getElementById('welcome-username')?.value?.trim() || 'Voyageur';
  actions.updateProfile({
    username,
    avatar: window.selectedAvatar || '🤙',
  });
  showToast(`Bienvenue ${username} !`, 'success');
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

// Filters
window.setFilter = (filter) => actions.setFilter(filter);
window.handleSearch = (query) => actions.setSearchQuery(query);

// Check-in
window.doCheckin = (spotId) => {
  actions.incrementCheckins();
  showToast(t('checkinSuccess'), 'success');
};

// Language
window.setLanguage = (lang) => {
  setLanguage(lang);
  actions.setLanguage(lang);
};

// Translation function
window.t = t;

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#0ea5e9'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.showToast = showToast;

// ==================== START APP ====================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
