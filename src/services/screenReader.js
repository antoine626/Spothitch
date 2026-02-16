/**
 * Screen Reader Service
 * Complete accessibility support for screen reader users
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// ARIA live region priorities
const PRIORITY = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off',
};

// Store reference to live regions
const liveRegions = {
  polite: null,
  assertive: null,
};

// Announcement queue for managing multiple announcements
const announcementQueue = [];
let isAnnouncing = false;

/**
 * Initialize screen reader support
 * Creates ARIA live regions and sets up keyboard navigation
 */
export function initScreenReaderSupport() {
  // Create live regions if they don't exist
  createLiveRegions();

  // Set up skip links
  createSkipLinks();

  // Set up landmark roles
  setupLandmarks();

  // Initialize focus management
  initFocusManagement();

  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
}

/**
 * Create ARIA live regions for announcements
 */
function createLiveRegions() {
  // Check if already created
  if (document.getElementById('sr-live-polite')) return;

  // Polite region (non-urgent announcements)
  const politeRegion = document.createElement('div');
  politeRegion.id = 'sr-live-polite';
  politeRegion.setAttribute('role', 'status');
  politeRegion.setAttribute('aria-live', 'polite');
  politeRegion.setAttribute('aria-atomic', 'true');
  politeRegion.className = 'sr-only';
  document.body.appendChild(politeRegion);
  liveRegions.polite = politeRegion;

  // Assertive region (urgent announcements)
  const assertiveRegion = document.createElement('div');
  assertiveRegion.id = 'sr-live-assertive';
  assertiveRegion.setAttribute('role', 'alert');
  assertiveRegion.setAttribute('aria-live', 'assertive');
  assertiveRegion.setAttribute('aria-atomic', 'true');
  assertiveRegion.className = 'sr-only';
  document.body.appendChild(assertiveRegion);
  liveRegions.assertive = assertiveRegion;
}

/**
 * Create skip links for keyboard navigation
 */
function createSkipLinks() {
  // Check if already created
  if (document.getElementById('skip-links')) return;

  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.id = 'skip-links';
  skipLinksContainer.className = 'skip-links';
  skipLinksContainer.innerHTML = `
    <a href="#main-content" class="skip-link">${t('sr.skipToMainContent') || 'Aller au contenu principal'}</a>
    <a href="#main-navigation" class="skip-link">${t('sr.skipToNavigation') || 'Aller à la navigation'}</a>
    <a href="#map-container" class="skip-link">${t('sr.skipToMap') || 'Aller à la carte'}</a>
    <a href="#search-input" class="skip-link">${t('sr.skipToSearch') || 'Aller à la recherche'}</a>
  `;

  document.body.insertBefore(skipLinksContainer, document.body.firstChild);
}

/**
 * Set up ARIA landmark roles
 */
function setupLandmarks() {
  // Main content
  const main = document.querySelector('main, #app-content, .app-content');
  if (main && !main.id) main.id = 'main-content';

  // Navigation
  const nav = document.querySelector('nav, .bottom-nav, .navigation');
  if (nav) {
    nav.id = nav.id || 'main-navigation';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', t('sr.mainNavigation') || 'Navigation principale');
  }

  // Header
  const header = document.querySelector('header, .header');
  if (header) {
    header.setAttribute('role', 'banner');
  }

  // Search
  const search = document.querySelector('[type="search"], .search-input');
  if (search) {
    search.id = search.id || 'search-input';
    search.setAttribute('role', 'searchbox');
  }
}

/**
 * Initialize focus management
 */
function initFocusManagement() {
  // Track focus for modal management
  document.addEventListener('focusin', (e) => {
    const state = getState();

    // If modal is open, trap focus inside
    const activeModal = document.querySelector('.modal[aria-modal="true"], [role="dialog"][aria-modal="true"]');
    if (activeModal && !activeModal.contains(e.target)) {
      const firstFocusable = getFirstFocusable(activeModal);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  });

  // Handle focus visibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

/**
 * Set up keyboard shortcuts for screen reader users
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + key shortcuts (don't interfere with screen reader)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'h':
          // Alt+H: Go to home/map
          e.preventDefault();
          announce(t('sr.navigatingToMap') || 'Navigation vers la carte');
          window.setView?.('map');
          break;
        case 's':
          // Alt+S: Go to spots list
          e.preventDefault();
          announce(t('sr.navigatingToSpots') || 'Navigation vers la liste des spots');
          window.setView?.('spots');
          break;
        case 'c':
          // Alt+C: Go to chat
          e.preventDefault();
          announce(t('sr.navigatingToChat') || 'Navigation vers le chat');
          window.setView?.('chat');
          break;
        case 'p':
          // Alt+P: Go to profile
          e.preventDefault();
          announce(t('sr.navigatingToProfile') || 'Navigation vers le profil');
          window.setView?.('profile');
          break;
        case 'a':
          // Alt+A: Add new spot
          e.preventDefault();
          announce(t('sr.openingAddSpotForm') || 'Ouverture du formulaire d\'ajout de spot');
          window.openAddSpot?.();
          break;
        case '/': {
          // Alt+/: Focus search
          e.preventDefault();
          const searchInput = document.querySelector('#search-input, [type="search"]');
          if (searchInput) {
            searchInput.focus();
            announce(t('sr.searchActivated') || 'Recherche activée');
          }
          break;
        }
        case 'x':
          // Alt+X: Close current modal
          e.preventDefault();
          closeCurrentModal();
          break;
      }
    }

    // Question mark: Show help
    if (e.key === '?' && !isInInput(e.target)) {
      e.preventDefault();
      showAccessibilityHelp();
    }
  });
}

/**
 * Announce a message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 * @param {number} delay - Optional delay in ms
 */
export function announce(message, priority = PRIORITY.POLITE, delay = 0) {
  if (!message) return;

  announcementQueue.push({ message, priority, delay });
  processAnnouncementQueue();
}

/**
 * Process the announcement queue
 */
function processAnnouncementQueue() {
  if (isAnnouncing || announcementQueue.length === 0) return;

  isAnnouncing = true;
  const { message, priority, delay } = announcementQueue.shift();

  setTimeout(() => {
    const region = liveRegions[priority] || liveRegions.polite;
    if (region) {
      // Clear then set (ensures announcement)
      region.textContent = '';
      requestAnimationFrame(() => {
        region.textContent = message;
      });
    }

    // Allow next announcement after a brief pause
    setTimeout(() => {
      isAnnouncing = false;
      processAnnouncementQueue();
    }, 500);
  }, delay);
}

/**
 * Announce an action result
 * @param {string} action - Action name
 * @param {boolean} success - Whether action succeeded
 * @param {string} details - Optional details
 */
export function announceAction(action, success, details = '') {
  const status = success ? (t('sr.succeeded') || 'réussi') : (t('sr.failed') || 'échoué');
  const message = details ? `${action} ${status}. ${details}` : `${action} ${status}`;

  announce(message, success ? PRIORITY.POLITE : PRIORITY.ASSERTIVE);
}

/**
 * Announce page/view change
 * @param {string} viewName - Name of the new view
 */
export function announceViewChange(viewName) {
  const viewNames = {
    map: t('sr.viewMap') || 'Carte',
    spots: t('sr.viewSpots') || 'Liste des spots',
    social: t('sr.viewSocial') || 'Communauté',
    chat: t('sr.viewChat') || 'Chat',
    profile: t('sr.viewProfile') || 'Profil',
    challenges: t('sr.viewChallenges') || 'Défis',
    planner: t('sr.viewPlanner') || 'Planificateur',
    guides: t('sr.viewGuides') || 'Guides',
  };

  const name = viewNames[viewName] || viewName;
  announce(`${t('sr.pageLoaded') || 'Page'} ${name} ${t('sr.loaded') || 'chargée'}`, PRIORITY.POLITE, 100);

  // Focus main content
  setTimeout(() => {
    const main = document.getElementById('main-content') || document.querySelector('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  }, 200);
}

/**
 * Announce list update
 * @param {string} listType - Type of list
 * @param {number} count - Number of items
 */
export function announceListUpdate(listType, count) {
  const listNames = {
    spots: t('sr.listSpots') || 'spots',
    messages: t('sr.listMessages') || 'messages',
    friends: t('sr.listFriends') || 'amis',
    badges: t('sr.listBadges') || 'badges',
    challenges: t('sr.listChallenges') || 'défis',
  };

  const name = listNames[listType] || (t('sr.listItems') || 'éléments');
  announce(`${count} ${name} ${t('sr.listLoaded') || 'chargés'}`);
}

/**
 * Announce loading state
 * @param {boolean} isLoading - Whether loading is in progress
 * @param {string} context - What is being loaded
 */
export function announceLoading(isLoading, context = '') {
  if (isLoading) {
    announce(`${t('sr.loading') || 'Chargement'}${context ? ` ${t('sr.of') || 'de'} ${context}` : ''} ${t('sr.inProgress') || 'en cours'}`);
  } else {
    announce(`${t('sr.loading') || 'Chargement'}${context ? ` ${t('sr.of') || 'de'} ${context}` : ''} ${t('sr.completed') || 'terminé'}`);
  }
}

/**
 * Announce error
 * @param {string} error - Error message
 */
export function announceError(error) {
  announce(`${t('sr.error') || 'Erreur'}: ${error}`, PRIORITY.ASSERTIVE);
}

/**
 * Announce notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function announceNotification(title, body) {
  announce(`${t('sr.notification') || 'Notification'}: ${title}. ${body}`, PRIORITY.ASSERTIVE);
}

/**
 * Get first focusable element in container
 * @param {HTMLElement} container
 * @returns {HTMLElement|null}
 */
export function getFirstFocusable(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return container.querySelector(focusableSelectors);
}

/**
 * Get all focusable elements in container
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getAllFocusable(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Trap focus within a container (for modals)
 * @param {HTMLElement} container
 * @returns {Function} Cleanup function
 */
export function trapFocus(container) {
  const focusables = getAllFocusable(container);
  if (focusables.length === 0) return () => {};

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKeydown);
  first.focus();

  return () => {
    container.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Close current modal and restore focus
 */
function closeCurrentModal() {
  const modal = document.querySelector('.modal[aria-modal="true"], [role="dialog"][aria-modal="true"]');
  if (modal) {
    // Find close button
    const closeBtn = modal.querySelector('[aria-label*="fermer"], [aria-label*="close"], .close-btn, button[onclick*="close"]');
    if (closeBtn) {
      closeBtn.click();
    }
    announce(t('sr.modalClosed') || 'Modal fermée');
  }
}

/**
 * Check if element is an input
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isInInput(element) {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
}

/**
 * Show accessibility help modal
 */
function showAccessibilityHelp() {
  const state = getState();
  setState({ showAccessibilityHelp: true });
  announce(t('sr.accessibilityHelpOpened') || 'Aide accessibilité ouverte');
}

/**
 * Render accessibility help content
 */
export function renderAccessibilityHelp(state) {
  if (!state.showAccessibilityHelp) return '';

  return `
    <div
      class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-help-title"
      onclick="if(event.target===this)closeAccessibilityHelp()"
    >
      <div class="bg-dark-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div class="p-6 border-b border-white/10">
          <div class="flex justify-between items-center">
            <h2 id="a11y-help-title" class="text-xl font-bold">
              ${icon('accessibility', 'w-5 h-5 mr-2 text-primary-400')}
              ${t('sr.keyboardShortcuts') || 'Raccourcis clavier'}
            </h2>
            <button
              onclick="closeAccessibilityHelp()"
              class="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="${t('sr.closeHelp') || 'Fermer l\'aide'}"
            >
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <section class="mb-6">
            <h3 class="font-semibold text-primary-400 mb-3">${t('sr.navigation') || 'Navigation'}</h3>
            <ul class="space-y-2 text-sm" role="list">
              <li class="flex justify-between">
                <span>${t('sr.goToMap') || 'Aller à la carte'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + H</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.goToSpots') || 'Aller aux spots'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + S</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.goToChat') || 'Aller au chat'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + C</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.goToProfile') || 'Aller au profil'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + P</kbd>
              </li>
            </ul>
          </section>

          <section class="mb-6">
            <h3 class="font-semibold text-primary-400 mb-3">${t('sr.actions') || 'Actions'}</h3>
            <ul class="space-y-2 text-sm" role="list">
              <li class="flex justify-between">
                <span>${t('sr.addSpot') || 'Ajouter un spot'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + A</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.search') || 'Rechercher'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + /</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.closeModal') || 'Fermer la modal'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Alt + X</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.showThisHelp') || 'Afficher cette aide'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">?</kbd>
              </li>
            </ul>
          </section>

          <section class="mb-6">
            <h3 class="font-semibold text-primary-400 mb-3">${t('sr.quickLinks') || 'Liens rapides'}</h3>
            <ul class="space-y-2 text-sm" role="list">
              <li class="flex justify-between">
                <span>${t('sr.navigateByLinks') || 'Navigation par liens'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Tab</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.reverseNavigation') || 'Navigation inverse'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">Shift + Tab</kbd>
              </li>
              <li class="flex justify-between">
                <span>${t('sr.activateLink') || 'Activer un lien'}</span>
                <kbd class="px-2 py-1 bg-white/10 rounded text-xs">${t('sr.enter') || 'Entrée'}</kbd>
              </li>
            </ul>
          </section>

          <section class="p-4 bg-primary-500/10 rounded-xl">
            <h3 class="font-semibold text-primary-400 mb-2">
              ${icon('info', 'w-5 h-5 mr-1')}
              ${t('sr.tips') || 'Conseils'}
            </h3>
            <ul class="text-sm text-slate-300 space-y-1" role="list">
              <li>• ${t('sr.tip1') || 'Les annonces importantes sont lues automatiquement'}</li>
              <li>• ${t('sr.tip2') || 'Utilisez les liens d\'évitement au début de la page'}</li>
              <li>• ${t('sr.tip3') || 'Chaque section a un titre de niveau approprié'}</li>
              <li>• ${t('sr.tip4') || 'Les images ont des descriptions alternatives'}</li>
            </ul>
          </section>
        </div>

        <div class="p-4 border-t border-white/10">
          <button
            onclick="closeAccessibilityHelp()"
            class="btn btn-primary w-full"
          >
            ${t('sr.close') || 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate accessible description for a spot
 * @param {Object} spot
 * @returns {string}
 */
export function generateSpotDescription(spot) {
  const parts = [];

  parts.push(`${spot.name || (t('sr.spotWithoutName') || 'Spot sans nom')}`);

  if (spot.country) {
    parts.push(`${t('sr.locatedIn') || 'situé en'} ${spot.country}`);
  }

  if (spot.globalRating) {
    parts.push(`${t('sr.rated') || 'noté'} ${spot.globalRating.toFixed(1)} ${t('sr.outOf5') || 'sur 5'}`);
  }

  if (spot.type) {
    const types = {
      highway_entrance: t('sr.typeHighwayEntrance') || 'entrée d\'autoroute',
      gas_station: t('sr.typeGasStation') || 'station-service',
      rest_area: t('sr.typeRestArea') || 'aire de repos',
      city_exit: t('sr.typeCityExit') || 'sortie de ville',
      roundabout: t('sr.typeRoundabout') || 'rond-point',
      other: t('sr.typeOther') || 'autre',
    };
    parts.push(`${t('sr.type') || 'type'}: ${types[spot.type] || spot.type}`);
  }

  if (spot.verificationStatus) {
    const statuses = {
      verified: t('sr.statusVerified') || 'vérifié par la communauté',
      disputed: t('sr.statusDisputed') || 'en discussion',
      dangerous: t('sr.statusDangerous') || 'marqué comme dangereux',
    };
    parts.push(statuses[spot.verificationStatus] || '');
  }

  return parts.filter(Boolean).join(', ');
}

/**
 * Generate accessible label for rating
 * @param {number} rating
 * @returns {string}
 */
export function generateRatingLabel(rating) {
  if (!rating) return t('sr.noRating') || 'Aucune note';

  const rounded = Math.round(rating * 10) / 10;
  const stars = Math.round(rating);

  return `${rounded} ${t('sr.outOf5Stars') || 'sur 5 étoiles'}, ${stars} ${stars > 1 ? (t('sr.stars') || 'étoiles') : (t('sr.star') || 'étoile')}`;
}

/**
 * Generate accessible time label
 * @param {string|Date} date
 * @returns {string}
 */
export function generateTimeLabel(date) {
  if (!date) return '';

  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('sr.justNow') || 'à l\'instant';
  if (minutes < 60) return `${t('sr.ago') || 'il y a'} ${minutes} ${minutes > 1 ? (t('sr.minutes') || 'minutes') : (t('sr.minute') || 'minute')}`;
  if (hours < 24) return `${t('sr.ago') || 'il y a'} ${hours} ${hours > 1 ? (t('sr.hours') || 'heures') : (t('sr.hour') || 'heure')}`;
  if (days < 7) return `${t('sr.ago') || 'il y a'} ${days} ${days > 1 ? (t('sr.days') || 'jours') : (t('sr.day') || 'jour')}`;

  const state = getState();
  const locale = state.language || 'fr';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Global handlers
window.closeAccessibilityHelp = () => {
  setState({ showAccessibilityHelp: false });
  announce(t('sr.helpClosed') || 'Aide fermée');
};

window.showAccessibilityHelp = showAccessibilityHelp;

export default {
  initScreenReaderSupport,
  announce,
  announceAction,
  announceViewChange,
  announceListUpdate,
  announceLoading,
  announceError,
  announceNotification,
  getFirstFocusable,
  getAllFocusable,
  trapFocus,
  renderAccessibilityHelp,
  generateSpotDescription,
  generateRatingLabel,
  generateTimeLabel,
  PRIORITY,
};
