/**
 * Infinite Scroll Service
 * Handles infinite scroll loading for lists (spots, chat, etc.)
 * Uses Intersection Observer API for optimal performance
 */

// Store for managing infinite scroll instances per container
const scrollInstances = new Map();

/**
 * Configuration defaults
 */
const DEFAULT_OPTIONS = {
  threshold: 100, // pixels from bottom to trigger load
  initialLoad: true, // trigger initial load on init
};

/**
 * Initialize infinite scroll for a container
 * @param {string|HTMLElement} container - DOM element or selector
 * @param {Function} loadMoreFn - async function called to load more items
 * @param {Object} options - Configuration options
 * @returns {Object} Instance reference for later cleanup
 */
export function initInfiniteScroll(container, loadMoreFn, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found');
    return null;
  }

  // Prevent duplicate instances
  if (scrollInstances.has(element)) {
    console.warn('[InfiniteScroll] Instance already exists for this container');
    return scrollInstances.get(element);
  }

  // Create sentinel element for intersection observer
  const sentinel = document.createElement('div');
  sentinel.className = 'infinite-scroll-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  element.appendChild(sentinel);

  // Initialize instance state
  const instance = {
    container: element,
    sentinel,
    loadMoreFn,
    isLoading: false,
    hasMore: true,
    observer: null,
    config,
  };

  // Create intersection observer
  instance.observer = new IntersectionObserver(
    (entries) => handleIntersection(entries, instance),
    {
      root: element.parentElement || null,
      rootMargin: `${config.threshold}px`,
      threshold: 0,
    }
  );

  // Start observing sentinel
  instance.observer.observe(sentinel);

  // Store instance
  scrollInstances.set(element, instance);

  // Trigger initial load if configured
  if (config.initialLoad) {
    loadMore(instance);
  }

  return instance;
}

/**
 * Handle intersection observer callback
 * @private
 */
function handleIntersection(entries, instance) {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !instance.isLoading && instance.hasMore) {
      loadMore(instance);
    }
  });
}

/**
 * Load more items
 * @private
 */
async function loadMore(instance) {
  if (instance.isLoading || !instance.hasMore) {
    return;
  }

  instance.isLoading = true;
  setLoading(instance.container, true);

  try {
    await instance.loadMoreFn(instance);
  } catch (error) {
    console.error('[InfiniteScroll] Error loading more items:', error);
    instance.hasMore = false;
  } finally {
    instance.isLoading = false;
    setLoading(instance.container, false);
  }
}

/**
 * Destroy infinite scroll instance
 * @param {string|HTMLElement} container - DOM element or selector
 */
export function destroyInfiniteScroll(container) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for destruction');
    return;
  }

  const instance = scrollInstances.get(element);
  if (!instance) {
    console.warn('[InfiniteScroll] No instance found for this container');
    return;
  }

  // Stop observing
  if (instance.observer) {
    instance.observer.disconnect();
  }

  // Remove sentinel
  if (instance.sentinel && instance.sentinel.parentElement) {
    instance.sentinel.remove();
  }

  // Remove loader if present
  const loader = element.querySelector('.infinite-scroll-loader');
  if (loader) {
    loader.remove();
  }

  // Delete instance
  scrollInstances.delete(element);
}

/**
 * Set loading state and show/hide loader
 * @param {string|HTMLElement} container - DOM element or selector
 * @param {boolean} isLoading - Whether loading is active
 */
export function setLoading(container, isLoading) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for setLoading');
    return;
  }

  let loader = element.querySelector('.infinite-scroll-loader');

  if (isLoading) {
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'infinite-scroll-loader';
      loader.innerHTML = `
        <div class="flex justify-center items-center p-4">
          <div class="animate-spin">
            <i class="fas fa-circle-notch text-primary-500 text-xl" aria-hidden="true"></i>
          </div>
          <span class="sr-only">Chargement...</span>
        </div>
      `;
      element.appendChild(loader);
    }
    loader.style.display = 'block';
  } else if (loader) {
    loader.style.display = 'none';
  }
}

/**
 * Check if there are more items to load
 * @param {string|HTMLElement} container - DOM element or selector
 * @returns {boolean} true if more items available, false otherwise
 */
export function hasMoreItems(container) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for hasMoreItems');
    return false;
  }

  const instance = scrollInstances.get(element);
  return instance ? instance.hasMore : false;
}

/**
 * Set whether there are more items to load
 * @param {string|HTMLElement} container - DOM element or selector
 * @param {boolean} hasMore - Whether more items are available
 */
export function setHasMore(container, hasMore) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for setHasMore');
    return;
  }

  const instance = scrollInstances.get(element);
  if (instance) {
    instance.hasMore = hasMore;
  }
}

/**
 * Reset infinite scroll instance (clear loading state, keep hasMore)
 * @param {string|HTMLElement} container - DOM element or selector
 */
export function resetScroll(container) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for reset');
    return;
  }

  const instance = scrollInstances.get(element);
  if (instance) {
    instance.isLoading = false;
    const loader = element.querySelector('.infinite-scroll-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }
}

/**
 * Get loading state
 * @param {string|HTMLElement} container - DOM element or selector
 * @returns {boolean} true if loading, false otherwise
 */
export function isLoading(container) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for isLoading');
    return false;
  }

  const instance = scrollInstances.get(element);
  return instance ? instance.isLoading : false;
}

/**
 * Manually trigger load more
 * @param {string|HTMLElement} container - DOM element or selector
 */
export async function manualLoadMore(container) {
  const element = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!element) {
    console.warn('[InfiniteScroll] Container not found for manualLoadMore');
    return;
  }

  const instance = scrollInstances.get(element);
  if (instance && !instance.isLoading && instance.hasMore) {
    await loadMore(instance);
  }
}

export default {
  initInfiniteScroll,
  destroyInfiniteScroll,
  setLoading,
  hasMoreItems,
  setHasMore,
  resetScroll,
  isLoading,
  manualLoadMore,
};
