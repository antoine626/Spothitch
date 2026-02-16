import { icon } from './icons.js'

/**
 * Lazy Loading Service
 * Code splitting for modals and heavy components
 */

// Cache for loaded modules
const moduleCache = new Map();
const loadingModules = new Map();

/**
 * Lazy load a modal component
 * @param {string} modalName - Name of the modal to load
 * @returns {Promise<Object>} - The loaded module
 */
export async function loadModal(modalName) {
  // Check cache first
  if (moduleCache.has(modalName)) {
    return moduleCache.get(modalName);
  }

  // Check if already loading
  if (loadingModules.has(modalName)) {
    return loadingModules.get(modalName);
  }

  // Start loading
  const loadPromise = importModal(modalName);
  loadingModules.set(modalName, loadPromise);

  try {
    const module = await loadPromise;
    moduleCache.set(modalName, module);
    loadingModules.delete(modalName);
    return module;
  } catch (error) {
    loadingModules.delete(modalName);
    console.error(`Failed to load modal: ${modalName}`, error);
    throw error;
  }
}

/**
 * Import modal by name
 * @param {string} modalName
 * @returns {Promise<Object>}
 */
async function importModal(modalName) {
  switch (modalName) {
    case 'AddSpot':
      return import('../components/modals/AddSpot.js');

    case 'Auth':
      return import('../components/modals/Auth.js');

    case 'SpotDetail':
      return import('../components/modals/SpotDetail.js');

    case 'SOS':
      return import('../components/modals/SOS.js');

    case 'Tutorial':
      return import('../components/modals/Tutorial.js');

    case 'Welcome':
      return import('../components/modals/Welcome.js');

    case 'Quiz':
      return import('../components/modals/Quiz.js');

    case 'Badges':
      return import('../components/modals/Badges.js');

    case 'Challenges':
      return import('../components/modals/Challenges.js');

    case 'Shop':
      return import('../components/modals/Shop.js');

    case 'Stats':
      return import('../components/modals/Stats.js');

    case 'Filters':
      return import('../components/modals/Filters.js');

    case 'Leaderboard':
      return import('../components/modals/Leaderboard.js');

    case 'Donation':
      return import('../components/ui/DonationCard.js');

    case 'Report':
      return import('../services/moderation.js');

    case 'Navigation':
      return import('../components/ui/NavigationOverlay.js');

    default:
      throw new Error(`Unknown modal: ${modalName}`);
  }
}

/**
 * Preload modals that are likely to be needed soon
 * @param {string[]} modalNames - Array of modal names to preload
 */
export function preloadModals(modalNames) {
  modalNames.forEach((name) => {
    // Start loading but don't wait
    loadModal(name).catch(() => {
      // Silently ignore preload failures
    });
  });
}

/**
 * Lazy load a view component
 * @param {string} viewName - Name of the view to load
 * @returns {Promise<Object>} - The loaded module
 */
export async function loadView(viewName) {
  const cacheKey = `view_${viewName}`;

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  if (loadingModules.has(cacheKey)) {
    return loadingModules.get(cacheKey);
  }

  const loadPromise = importView(viewName);
  loadingModules.set(cacheKey, loadPromise);

  try {
    const module = await loadPromise;
    moduleCache.set(cacheKey, module);
    loadingModules.delete(cacheKey);
    return module;
  } catch (error) {
    loadingModules.delete(cacheKey);
    console.error(`Failed to load view: ${viewName}`, error);
    throw error;
  }
}

/**
 * Import view by name
 * @param {string} viewName
 * @returns {Promise<Object>}
 */
async function importView(viewName) {
  switch (viewName) {
    case 'Planner':
      return import('../components/views/Planner.js');

    case 'Legal':
      return import('../components/views/Legal.js');

    case 'Guides':
      return import('../components/views/Guides.js');

    case 'Friends':
      return import('../components/views/Friends.js');

    case 'ChallengesHub':
      return import('../components/views/ChallengesHub.js');

    default:
      throw new Error(`Unknown view: ${viewName}`);
  }
}

/**
 * Load a service lazily
 * @param {string} serviceName
 * @returns {Promise<Object>}
 */
export async function loadService(serviceName) {
  const cacheKey = `service_${serviceName}`;

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  const loadPromise = importService(serviceName);

  try {
    const module = await loadPromise;
    moduleCache.set(cacheKey, module);
    return module;
  } catch (error) {
    console.error(`Failed to load service: ${serviceName}`, error);
    throw error;
  }
}

/**
 * Import service by name
 * @param {string} serviceName
 * @returns {Promise<Object>}
 */
async function importService(serviceName) {
  switch (serviceName) {
    case 'heatmap':
      return import('../services/heatmap.js');

    case 'sosTracking':
      return import('../services/sosTracking.js');

    case 'moderation':
      return import('../services/moderation.js');

    case 'trustScore':
      return import('../services/trustScore.js');

    case 'verification':
      return import('../services/verification.js');

    case 'navigation':
      return import('../services/navigation.js');

    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }
}

/**
 * Render a loading placeholder while modal loads
 * @returns {string}
 */
export function renderModalLoader() {
  return `
    <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60">Chargement...</p>
      </div>
    </div>
  `;
}

/**
 * Render an error placeholder
 * @param {string} message
 * @returns {string}
 */
export function renderModalError(message = 'Une erreur est survenue') {
  return `
    <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-dark-card rounded-2xl p-6 max-w-sm text-center">
        ${icon('triangle-alert', 'w-10 h-10 text-danger-400 mb-4')}
        <p class="text-white mb-4">${message}</p>
        <button onclick="this.closest('.fixed').remove()" class="btn btn-ghost">
          Fermer
        </button>
      </div>
    </div>
  `;
}

/**
 * Get cache statistics
 * @returns {Object}
 */
export function getCacheStats() {
  return {
    loadedModules: moduleCache.size,
    loadingModules: loadingModules.size,
    moduleNames: Array.from(moduleCache.keys()),
  };
}

/**
 * Clear module cache (useful for development)
 */
export function clearModuleCache() {
  moduleCache.clear();
}

/**
 * Check if a modal is already loaded
 * @param {string} modalName
 * @returns {boolean}
 */
export function isModalLoaded(modalName) {
  return moduleCache.has(modalName);
}

/**
 * Preload common modals on idle
 */
export function preloadOnIdle() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        // Preload commonly used modals
        preloadModals(['Auth', 'SpotDetail', 'AddSpot']);
      },
      { timeout: 5000 }
    );
  }
}

export default {
  loadModal,
  preloadModals,
  loadView,
  loadService,
  renderModalLoader,
  renderModalError,
  getCacheStats,
  clearModuleCache,
  isModalLoaded,
  preloadOnIdle,
};
