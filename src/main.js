/**
 * SpotHitch - Main Entry Point
 * La communauté des autostoppeurs
 */

// Global error handler
window.onerror = (msg, url, line) => {
  console.error('Error:', msg);
  document.getElementById('loader-text').textContent = `Erreur: ${msg}`;
};

window.onunhandledrejection = (event) => {
  console.error('Rejection:', event.reason);
  document.getElementById('loader-text').textContent = `Erreur: ${event.reason?.message || 'Unknown'}`;
};

// Mark that we got past the error handlers
console.log('🔧 Error handlers set');

// Styles
import './styles/main.css';
console.log('🎨 CSS loaded');

// State
import { subscribe, actions } from './stores/state.js';
console.log('📦 State loaded');

// Data
import { sampleSpots } from './data/spots.js';
console.log('📍 Spots data loaded:', sampleSpots.length);

// Components
import { renderApp } from './components/App.js';
console.log('🧩 Components loaded');

// i18n
import { t, detectLanguage, setLanguage } from './i18n/index.js';
console.log('🌐 i18n loaded');

/**
 * Initialize the application
 */
function init() {
  console.log('🚀 Init started');
  document.getElementById('loader-text').textContent = 'Initialisation...';

  try {
    // Set language
    setLanguage(detectLanguage());

    // Load spots
    actions.setSpots(sampleSpots);
    console.log('Spots set in state');

    // Render
    subscribe((state) => {
      console.log('Rendering...', state.activeTab);
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

    console.log('✅ Init complete!');
  } catch (error) {
    console.error('Init error:', error);
    document.getElementById('loader-text').textContent = `Erreur: ${error.message}`;
  }
}

// Start when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('📦 Main module fully loaded');
