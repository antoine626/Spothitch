/**
 * PWA Utilities
 * Progressive Web App installation and management
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from '../services/notifications.js';
import { t } from '../i18n/index.js';

// Store the deferred install prompt
let deferredPrompt = null;

/**
 * Initialize PWA handlers
 */
export function initPWA() {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install banner after a delay
    setTimeout(() => {
      if (!isAppInstalled()) {
        showInstallBanner();
      }
    }, 30000); // 30 seconds delay
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    setState({ isPWAInstalled: true });
    showToast(t('appInstalled') || 'Application installée !', 'success');
    dismissInstallBanner();
  });

  // Check if already installed
  if (isAppInstalled()) {
    setState({ isPWAInstalled: true });
  }
}

/**
 * Check if the app is installed as PWA
 */
export function isAppInstalled() {
  // Check display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS standalone
  if (window.navigator.standalone === true) {
    return true;
  }

  // Check localStorage flag
  if (localStorage.getItem('pwa_installed') === 'true') {
    return true;
  }

  return false;
}

/**
 * Show the install banner
 */
export function showInstallBanner() {
  // Check if user has dismissed before
  const dismissed = localStorage.getItem('install_banner_dismissed');
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return; // Don't show again for 7 days
    }
  }

  setState({ showInstallBanner: true });
}

/**
 * Dismiss the install banner
 */
export function dismissInstallBanner() {
  setState({ showInstallBanner: false });
  localStorage.setItem('install_banner_dismissed', new Date().toISOString());
}

/**
 * Trigger PWA installation
 */
export async function installPWA() {
  if (!deferredPrompt) {
    // Show manual install instructions
    showManualInstallInstructions();
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      showToast(t('installingApp') || 'Installation en cours...', 'info');
    }

    deferredPrompt = null;
    dismissInstallBanner();

    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA install error:', error);
    return false;
  }
}

/**
 * Show manual installation instructions based on browser/OS
 */
function showManualInstallInstructions() {
  const ua = navigator.userAgent.toLowerCase();
  let instructions;

  if (/iphone|ipad|ipod/.test(ua)) {
    instructions = t('pwaInstallIOS') || 'Appuyez sur le bouton Partager puis "Sur l\'écran d\'accueil"';
  } else if (/android/.test(ua)) {
    instructions = t('pwaInstallAndroid') || 'Appuyez sur le menu (⋮) puis "Ajouter à l\'écran d\'accueil"';
  } else if (/chrome/.test(ua)) {
    instructions = t('pwaInstallChrome') || 'Cliquez sur l\'icône d\'installation dans la barre d\'adresse';
  } else if (/firefox/.test(ua)) {
    instructions = t('pwaInstallFirefox') || 'Ce navigateur ne supporte pas l\'installation PWA';
  } else {
    instructions = t('pwaInstallOther') || 'Utilisez Chrome ou Safari pour installer l\'application';
  }

  showToast(instructions, 'info', 8000);
}

/**
 * Render install banner component
 */
export function renderInstallBanner() {
  const { showInstallBanner } = getState();

  if (!showInstallBanner) return '';

  return `
    <div class="install-banner fixed bottom-20 left-3 right-3 bg-gradient-to-br from-primary-500 via-primary-600 to-amber-600
                rounded-2xl shadow-2xl shadow-primary-500/30 z-40 animate-slide-up overflow-hidden" role="alert">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27%3E%3Ccircle cx=%272%27 cy=%272%27 r=%271%27 fill=%27white%27 opacity=%270.08%27/%3E%3C/svg%3E')]"></div>
      <div class="relative p-4">
        <button onclick="dismissInstallBanner()" class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-white/50 hover:text-white rounded-full hover:bg-white/10" aria-label="${t('close')}">✕</button>
        <div class="flex items-start gap-3 pr-6">
          <div class="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
            <span class="text-2xl">📲</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-white font-bold text-sm leading-tight">${t('installTitle')}</h3>
            <p class="text-white/80 text-xs mt-0.5 leading-snug">${t('installDesc')}</p>
          </div>
        </div>
        <button onclick="installPWA()"
          class="w-full mt-3 py-2.5 bg-white text-primary-600 rounded-xl text-sm font-bold
                 hover:bg-primary-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span>⚡</span> ${t('installBtn')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('Update check failed:', error);
    return false;
  }
}

/**
 * Force reload to apply updates
 */
export function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }

  // Reload the page
  window.location.reload();
}

/**
 * Get PWA display mode
 */
export function getDisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Check if device supports PWA installation
 */
export function canInstallPWA() {
  return deferredPrompt !== null || /chrome|chromium/i.test(navigator.userAgent);
}

export default {
  initPWA,
  isAppInstalled,
  showInstallBanner,
  dismissInstallBanner,
  installPWA,
  renderInstallBanner,
  checkForUpdates,
  applyUpdate,
  getDisplayMode,
  canInstallPWA,
};
