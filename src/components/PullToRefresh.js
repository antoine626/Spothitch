/**
 * Pull-to-Refresh Component
 * Tire vers le bas pour actualiser les donnees
 */

import { t } from '../i18n/index.js';

// Messages humoristiques pour le refresh
const refreshMessages = {
  fr: [
    'Recherche de nouvelles voitures...',
    'Mise a jour du karma routier...',
    'Actualisation des bonnes ondes...',
    'Verification des pouces en l\'air...',
    'Scan des spots magiques...',
    'Connexion avec l\'univers du stop...',
    'Invocation des conducteurs sympas...',
    'Calibration du compteur de kilometre...',
    'Rechargement des ondes positives...',
    'Interrogation de la route...',
  ],
  en: [
    'Looking for new rides...',
    'Updating road karma...',
    'Refreshing good vibes...',
    'Checking thumbs up...',
    'Scanning magic spots...',
    'Connecting with hitchhiker universe...',
    'Summoning friendly drivers...',
    'Calibrating kilometer counter...',
    'Recharging positive energy...',
    'Asking the road...',
  ],
  es: [
    'Buscando nuevos coches...',
    'Actualizando el karma del camino...',
    'Refrescando buenas vibras...',
    'Verificando pulgares arriba...',
    'Escaneando spots magicos...',
    'Conectando con el universo del autoestop...',
    'Invocando conductores amables...',
    'Calibrando el contador de kilometros...',
    'Recargando energia positiva...',
    'Preguntando a la carretera...',
  ],
};

/**
 * Get a random refresh message
 */
export function getRandomRefreshMessage(lang = 'fr') {
  const messages = refreshMessages[lang] || refreshMessages.fr;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type = 'light') {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 10, 30]);
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]);
        break;
    }
  }
}

/**
 * Pull-to-Refresh state and handlers
 */
let ptrState = {
  active: false,
  refreshing: false,
  startY: 0,
  currentY: 0,
  pullDistance: 0,
  threshold: 80, // Distance to trigger refresh
  maxPull: 120, // Maximum pull distance
  resistance: 2.5, // Pull resistance factor
};

// Callbacks
let onRefreshCallback = null;
let currentLang = 'fr';

/**
 * Initialize Pull-to-Refresh on a container
 */
export function initPullToRefresh(container, onRefresh, lang = 'fr') {
  if (!container) return;

  onRefreshCallback = onRefresh;
  currentLang = lang;

  // Create the indicator element
  createPTRIndicator(container);

  // Touch events
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Mouse events for desktop testing
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);

  // Mark container as initialized
  container.dataset.ptrInitialized = 'true';

  return () => {
    // Cleanup function
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseup', handleMouseUp);
    container.removeEventListener('mouseleave', handleMouseUp);
  };
}

/**
 * Create the PTR indicator element
 */
function createPTRIndicator(container) {
  // Remove existing indicator if any
  const existing = document.getElementById('ptr-indicator');
  if (existing) existing.remove();

  const indicator = document.createElement('div');
  indicator.id = 'ptr-indicator';
  indicator.className = 'ptr-indicator';
  indicator.innerHTML = `
    <div class="ptr-content">
      <div class="ptr-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <div class="ptr-icon">
        <i class="fas fa-arrow-down"></i>
      </div>
      <div class="ptr-message">Tirez pour actualiser</div>
    </div>
  `;

  // Insert at the top of the container
  if (container.firstChild) {
    container.insertBefore(indicator, container.firstChild);
  } else {
    container.appendChild(indicator);
  }
}

/**
 * Check if we're at the top of the scroll
 */
function isAtTop(element) {
  // Check if the container itself or any scrollable parent is at top
  let current = element;
  while (current && current !== document.body) {
    if (current.scrollTop > 5) {
      return false;
    }
    current = current.parentElement;
  }
  return window.scrollY <= 5;
}

/**
 * Update the indicator UI
 */
function updateIndicator() {
  const indicator = document.getElementById('ptr-indicator');
  if (!indicator) return;

  const content = indicator.querySelector('.ptr-content');
  const spinner = indicator.querySelector('.ptr-spinner');
  const icon = indicator.querySelector('.ptr-icon');
  const message = indicator.querySelector('.ptr-message');

  if (ptrState.refreshing) {
    indicator.style.height = `${ptrState.threshold}px`;
    indicator.classList.add('refreshing');
    spinner.style.display = 'block';
    icon.style.display = 'none';
    message.textContent = getRandomRefreshMessage(currentLang);
  } else if (ptrState.pullDistance > 0) {
    const height = Math.min(ptrState.pullDistance, ptrState.maxPull);
    indicator.style.height = `${height}px`;
    indicator.classList.remove('refreshing');
    spinner.style.display = 'none';
    icon.style.display = 'block';

    // Rotate arrow based on pull distance
    const progress = Math.min(ptrState.pullDistance / ptrState.threshold, 1);
    const rotation = progress * 180;
    icon.style.transform = `rotate(${rotation}deg)`;

    // Update message based on state
    if (ptrState.pullDistance >= ptrState.threshold) {
      message.textContent = 'Relacher pour actualiser';
      icon.innerHTML = '<i class="fas fa-sync-alt"></i>';
      indicator.classList.add('ready');
    } else {
      message.textContent = 'Tirez pour actualiser';
      icon.innerHTML = '<i class="fas fa-arrow-down"></i>';
      indicator.classList.remove('ready');
    }

    // Scale effect
    content.style.transform = `scale(${0.8 + progress * 0.2})`;
    content.style.opacity = Math.min(progress * 1.5, 1);
  } else {
    indicator.style.height = '0';
    indicator.classList.remove('refreshing', 'ready');
    content.style.transform = 'scale(0.8)';
    content.style.opacity = '0';
  }
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
  if (ptrState.refreshing) return;

  const touch = e.touches[0];
  ptrState.startY = touch.clientY;
  ptrState.active = isAtTop(e.target);
}

/**
 * Handle touch move
 */
function handleTouchMove(e) {
  if (!ptrState.active || ptrState.refreshing) return;

  const touch = e.touches[0];
  ptrState.currentY = touch.clientY;
  const diff = ptrState.currentY - ptrState.startY;

  if (diff > 0 && isAtTop(e.target)) {
    // Apply resistance
    ptrState.pullDistance = diff / ptrState.resistance;

    // Prevent default scrolling while pulling
    if (ptrState.pullDistance > 10) {
      e.preventDefault();
    }

    // Haptic feedback at threshold
    if (ptrState.pullDistance >= ptrState.threshold &&
        ptrState.pullDistance - (diff / ptrState.resistance - diff / ptrState.resistance) < ptrState.threshold) {
      triggerHaptic('medium');
    }

    updateIndicator();
  }
}

/**
 * Handle touch end
 */
function handleTouchEnd() {
  if (!ptrState.active || ptrState.refreshing) return;

  if (ptrState.pullDistance >= ptrState.threshold) {
    // Trigger refresh
    triggerRefresh();
  } else {
    // Reset
    resetPTR();
  }

  ptrState.active = false;
}

/**
 * Mouse handlers (for desktop testing)
 */
let mouseDown = false;

function handleMouseDown(e) {
  if (ptrState.refreshing) return;
  mouseDown = true;
  ptrState.startY = e.clientY;
  ptrState.active = isAtTop(e.target);
}

function handleMouseMove(e) {
  if (!mouseDown || !ptrState.active || ptrState.refreshing) return;

  ptrState.currentY = e.clientY;
  const diff = ptrState.currentY - ptrState.startY;

  if (diff > 0) {
    ptrState.pullDistance = diff / ptrState.resistance;
    updateIndicator();
  }
}

function handleMouseUp() {
  if (!mouseDown) return;
  mouseDown = false;

  if (ptrState.pullDistance >= ptrState.threshold) {
    triggerRefresh();
  } else {
    resetPTR();
  }

  ptrState.active = false;
}

/**
 * Trigger the refresh action
 */
async function triggerRefresh() {
  ptrState.refreshing = true;
  triggerHaptic('success');
  updateIndicator();

  try {
    if (onRefreshCallback) {
      await onRefreshCallback();
    }
    // Minimum refresh time for UX
    await new Promise(resolve => setTimeout(resolve, 800));
  } catch (error) {
    console.error('Refresh failed:', error);
  }

  ptrState.refreshing = false;
  resetPTR();
}

/**
 * Reset PTR state
 */
function resetPTR() {
  ptrState.pullDistance = 0;
  ptrState.startY = 0;
  ptrState.currentY = 0;

  const indicator = document.getElementById('ptr-indicator');
  if (indicator) {
    indicator.style.transition = 'height 0.3s ease-out';
    indicator.style.height = '0';

    setTimeout(() => {
      indicator.style.transition = '';
      indicator.classList.remove('refreshing', 'ready');
    }, 300);
  }
}

/**
 * Render Pull-to-Refresh wrapper
 * Wraps content with PTR functionality
 */
export function renderPullToRefreshWrapper(content, viewId) {
  return `
    <div
      id="ptr-container-${viewId}"
      class="ptr-container"
      data-view="${viewId}"
    >
      <div id="ptr-indicator-${viewId}" class="ptr-indicator">
        <div class="ptr-content">
          <div class="ptr-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
          </div>
          <div class="ptr-icon">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="ptr-message">Tirez pour actualiser</div>
        </div>
      </div>
      ${content}
    </div>
  `;
}

/**
 * Setup PTR for a specific view
 */
export function setupViewPTR(viewId, onRefresh) {
  const container = document.getElementById(`ptr-container-${viewId}`);
  if (container && !container.dataset.ptrInitialized) {
    initPullToRefresh(container, onRefresh, currentLang);
  }
}

/**
 * Global refresh handlers for different views
 */
export const viewRefreshHandlers = {
  map: async () => {
    // Reload spots and re-center map
    const { sampleSpots } = await import('../data/spots.js');
    const { setState, getState } = await import('../stores/state.js');
    const state = getState();

    // Simulate refresh with slight delay
    setState({ spotsLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    setState({ spots: sampleSpots, spotsLoading: false });

    // Re-init map
    if (window.mapInstance) {
      window.mapInstance.invalidateSize();
    }

    window.showToast?.('Spots actualises !', 'success');
  },

  spots: async () => {
    const { sampleSpots } = await import('../data/spots.js');
    const { setState } = await import('../stores/state.js');

    setState({ spotsLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    setState({ spots: sampleSpots, spotsLoading: false });

    window.showToast?.('Liste mise a jour !', 'success');
  },

  chat: async () => {
    const { setState } = await import('../stores/state.js');

    setState({ chatLoading: true });
    // In real app, this would fetch new messages from Firebase
    await new Promise(resolve => setTimeout(resolve, 500));
    setState({ chatLoading: false });

    window.showToast?.('Messages actualises !', 'success');
  },

  social: async () => {
    const { setState } = await import('../stores/state.js');

    await new Promise(resolve => setTimeout(resolve, 500));

    window.showToast?.('Feed actualise !', 'success');
  },

  profile: async () => {
    const { updateStreak } = await import('../services/gamification.js');

    await new Promise(resolve => setTimeout(resolve, 500));
    updateStreak();

    window.showToast?.('Profil synchronise !', 'success');
  },

  travel: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    window.showToast?.('Donnees voyage actualisees !', 'success');
  },

  challenges: async () => {
    const { checkBadges } = await import('../services/gamification.js');

    await new Promise(resolve => setTimeout(resolve, 500));
    checkBadges();

    window.showToast?.('Defis actualises !', 'success');
  },
};

/**
 * Initialize PTR for the current view
 */
export function initViewPTR(viewId) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Remove old listeners
  const oldCleanup = mainContent._ptrCleanup;
  if (oldCleanup) {
    oldCleanup();
  }

  // Setup new PTR
  const handler = viewRefreshHandlers[viewId];
  if (handler) {
    mainContent._ptrCleanup = initPullToRefresh(mainContent, handler, currentLang);
  }
}

// Export for global access
export default {
  initPullToRefresh,
  initViewPTR,
  triggerHaptic,
  getRandomRefreshMessage,
  viewRefreshHandlers,
};
