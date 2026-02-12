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
  let instructions = '';

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
    <div class="install-banner fixed bottom-20 left-4 right-4 bg-gradient-to-r from-primary-500 to-primary-600
                rounded-2xl p-4 shadow-xl z-40 animate-slide-up">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <span class="text-2xl">📲</span>
        </div>
        <div class="flex-1">
          <h3 class="text-white font-bold text-sm">${t('installSpotHitch') || 'Installer SpotHitch'}</h3>
          <p class="text-white/80 text-xs">${t('installDescription') || 'Accès rapide et mode hors-ligne'}</p>
        </div>
        <div class="flex gap-2">
          <button
            onclick="dismissInstallBanner()"
            class="px-3 py-2 text-white/80 text-sm hover:text-white"
          >
            ${t('later') || 'Plus tard'}
          </button>
          <button
            onclick="installPWA()"
            class="px-4 py-2 bg-white text-primary-600 rounded-lg text-sm font-semibold
                   hover:bg-primary-50 transition-colors"
          >
            ${t('install') || 'Installer'}
          </button>
        </div>
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
