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
  preloadOnIdle,
};
