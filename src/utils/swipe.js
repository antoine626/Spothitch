/**
 * Swipe Gesture Handler
 * Enables touch swipe navigation between tabs
 */

// Configuration
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity
const SWIPE_MAX_VERTICAL = 100; // Maximum vertical movement

// State
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;

/**
 * Initialize swipe handlers on an element
 * @param {HTMLElement} element - Element to attach handlers to
 * @param {Object} callbacks - Callback functions { onSwipeLeft, onSwipeRight }
 */
export function initSwipeHandlers(element, callbacks) {
  if (!element) return;

  const { onSwipeLeft, onSwipeRight } = callbacks;

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    isSwiping = true;
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;

    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Cancel if too much vertical movement (scrolling)
    if (deltaY > SWIPE_MAX_VERTICAL) {
      isSwiping = false;
    }
  }

  function handleTouchEnd(e) {
    if (!isSwiping) return;
    isSwiping = false;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const deltaTime = Date.now() - touchStartTime;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Check if swipe is valid
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaY > SWIPE_MAX_VERTICAL) return;
    if (velocity < SWIPE_VELOCITY_THRESHOLD) return;

    // Trigger callback
    if (deltaX > 0 && onSwipeRight) {
      onSwipeRight();
    } else if (deltaX < 0 && onSwipeLeft) {
      onSwipeLeft();
    }
  }

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Initialize tab swipe navigation
 * @param {string[]} tabs - Array of tab names in order
 * @param {Function} changeTab - Function to change tab
 * @param {Function} getCurrentTab - Function to get current tab
 */
export function initTabSwipe(tabs, changeTab, getCurrentTab) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  return initSwipeHandlers(appContainer, {
    onSwipeLeft: () => {
      const currentIndex = tabs.indexOf(getCurrentTab());
      if (currentIndex < tabs.length - 1) {
        changeTab(tabs[currentIndex + 1]);
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(10);
      }
    },
    onSwipeRight: () => {
      const currentIndex = tabs.indexOf(getCurrentTab());
      if (currentIndex > 0) {
        changeTab(tabs[currentIndex - 1]);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    },
  });
}

/**
 * Add swipe indicator dots
 * @param {string[]} tabs - Array of tab names
 * @param {string} currentTab - Current active tab
 */
export function renderSwipeIndicator(tabs, currentTab) {
  const currentIndex = tabs.indexOf(currentTab);

  return `
    <div class="swipe-indicator flex justify-center gap-1.5 py-2">
      ${tabs.map((tab, i) => `
        <div class="w-1.5 h-1.5 rounded-full transition-all ${
  i === currentIndex
    ? 'bg-primary-500 w-4'
    : 'bg-white/20'
}"></div>
      `).join('')}
    </div>
  `;
}

// Global initialization
let cleanupSwipe = null;

export function setupGlobalSwipe() {
  // Clean up previous handler
  if (cleanupSwipe) {
    cleanupSwipe();
  }

  const tabs = ['map', 'travel', 'challenges', 'social', 'profile'];

  cleanupSwipe = initTabSwipe(
    tabs,
    (tab) => window.changeTab?.(tab),
    () => window.getState?.()?.activeTab || 'map'
  );
}

// Auto-setup disabled - swipe tab navigation removed per user request
// To re-enable, uncomment the block below:
// if (typeof window !== 'undefined') {
//   setTimeout(setupGlobalSwipe, 1000);
//   window.addEventListener('popstate', () => {
//     setTimeout(setupGlobalSwipe, 100);
//   });
// }

export default {
  initSwipeHandlers,
  initTabSwipe,
  renderSwipeIndicator,
  setupGlobalSwipe,
};
