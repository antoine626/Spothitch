/**
 * Reduced Animations Service
 * Manages user preference for reduced motion/animations
 * Respects system preferences but allows user override
 * WCAG 2.1 AA Compliant
 */

const STORAGE_KEY = 'spothitch_reduced_motion';
const CSS_CLASS = 'reduced-motion';

// Registered change listeners
let changeListeners = [];

// Internal state
let userOverride = null;
let styleElement = null;

/**
 * Translations for reduced motion label
 */
const translations = {
  fr: {
    label: 'Reduire les animations',
    description: 'Desactive les animations et transitions pour une experience plus calme',
    enabled: 'Animations reduites activees',
    disabled: 'Animations normales',
    autoLabel: 'Suivre le systeme',
    manualLabel: 'Preference manuelle'
  },
  en: {
    label: 'Reduce animations',
    description: 'Disable animations and transitions for a calmer experience',
    enabled: 'Reduced animations enabled',
    disabled: 'Normal animations',
    autoLabel: 'Follow system',
    manualLabel: 'Manual preference'
  },
  es: {
    label: 'Reducir animaciones',
    description: 'Desactiva las animaciones y transiciones para una experiencia mas tranquila',
    enabled: 'Animaciones reducidas activadas',
    disabled: 'Animaciones normales',
    autoLabel: 'Seguir el sistema',
    manualLabel: 'Preferencia manual'
  },
  de: {
    label: 'Animationen reduzieren',
    description: 'Deaktiviert Animationen und Ubergange fur ein ruhigeres Erlebnis',
    enabled: 'Reduzierte Animationen aktiviert',
    disabled: 'Normale Animationen',
    autoLabel: 'System folgen',
    manualLabel: 'Manuelle Einstellung'
  }
};

/**
 * Initialize the service - load saved preference
 */
function init() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      userOverride = saved === 'true';
    } else {
      userOverride = null;
    }
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to load preference:', e);
    userOverride = null;
  }

  // Apply styles based on current state
  if (isReducedMotionEnabled()) {
    applyReducedMotionStyles();
  }

  // Setup system preference listener
  setupSystemPreferenceListener();
}

/**
 * Detect system prefers-reduced-motion media query
 * @returns {boolean} True if system prefers reduced motion
 */
export function detectSystemPreference() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to detect system preference:', e);
  }
  return false;
}

/**
 * Check if reduced motion is enabled (user override or system preference)
 * @returns {boolean} True if reduced motion is enabled
 */
export function isReducedMotionEnabled() {
  // User override takes precedence
  if (userOverride !== null) {
    return userOverride;
  }
  // Otherwise, follow system preference
  return detectSystemPreference();
}

/**
 * Enable reduced motion (user override)
 */
export function enableReducedMotion() {
  const wasEnabled = isReducedMotionEnabled();
  userOverride = true;

  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to save preference:', e);
  }

  applyReducedMotionStyles();

  if (!wasEnabled) {
    notifyListeners(true);
  }
}

/**
 * Disable reduced motion (user override)
 */
export function disableReducedMotion() {
  const wasEnabled = isReducedMotionEnabled();
  userOverride = false;

  try {
    localStorage.setItem(STORAGE_KEY, 'false');
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to save preference:', e);
  }

  removeReducedMotionStyles();

  if (wasEnabled) {
    notifyListeners(false);
  }
}

/**
 * Toggle reduced motion setting
 * @returns {boolean} New state (true if now enabled)
 */
export function toggleReducedMotion() {
  const currentState = isReducedMotionEnabled();

  if (currentState) {
    disableReducedMotion();
  } else {
    enableReducedMotion();
  }

  return !currentState;
}

/**
 * Sync setting with system preference (remove user override)
 */
export function syncWithSystemPreference() {
  const wasEnabled = isReducedMotionEnabled();
  userOverride = null;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to clear preference:', e);
  }

  const nowEnabled = detectSystemPreference();

  if (nowEnabled) {
    applyReducedMotionStyles();
  } else {
    removeReducedMotionStyles();
  }

  if (wasEnabled !== nowEnabled) {
    notifyListeners(nowEnabled);
  }
}

/**
 * Get animation duration based on reduced motion setting
 * @param {number} defaultMs - Default duration in milliseconds
 * @returns {number} 0 if reduced motion, default otherwise
 */
export function getAnimationDuration(defaultMs = 300) {
  if (typeof defaultMs !== 'number' || defaultMs < 0) {
    defaultMs = 300;
  }
  return isReducedMotionEnabled() ? 0 : defaultMs;
}

/**
 * Get transition class based on reduced motion setting
 * @param {string} defaultClass - Default transition class
 * @returns {string} Empty string or 'transition-none' if reduced, default otherwise
 */
export function getTransitionClass(defaultClass = 'transition-all') {
  if (typeof defaultClass !== 'string') {
    defaultClass = 'transition-all';
  }
  return isReducedMotionEnabled() ? 'transition-none' : defaultClass;
}

/**
 * Check if animations should play
 * @returns {boolean} True if animations should play
 */
export function shouldAnimate() {
  return !isReducedMotionEnabled();
}

/**
 * Apply CSS styles for reduced motion
 * Adds 'reduced-motion' class to document.body
 */
export function applyReducedMotionStyles() {
  try {
    if (typeof document !== 'undefined') {
      document.body?.classList.add(CSS_CLASS);

      // Inject global styles if not already present
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'reduced-motion-styles';
        styleElement.textContent = `
          .${CSS_CLASS} *,
          .${CSS_CLASS} *::before,
          .${CSS_CLASS} *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head?.appendChild(styleElement);
      }
    }
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to apply styles:', e);
  }
}

/**
 * Remove CSS styles for reduced motion
 * Removes 'reduced-motion' class from document.body
 */
export function removeReducedMotionStyles() {
  try {
    if (typeof document !== 'undefined') {
      document.body?.classList.remove(CSS_CLASS);

      // Remove injected styles
      if (styleElement) {
        styleElement.remove();
        styleElement = null;
      }
    }
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to remove styles:', e);
  }
}

/**
 * Register callback for reduced motion changes
 * @param {Function} callback - Function to call when setting changes
 * @returns {boolean} True if successfully registered
 */
export function onReducedMotionChange(callback) {
  if (typeof callback !== 'function') {
    console.warn('[ReducedAnimations] Callback must be a function');
    return false;
  }

  if (!changeListeners.includes(callback)) {
    changeListeners.push(callback);
  }

  return true;
}

/**
 * Unregister callback for reduced motion changes
 * @param {Function} callback - Function to remove
 * @returns {boolean} True if successfully unregistered
 */
export function offReducedMotionChange(callback) {
  if (typeof callback !== 'function') {
    return false;
  }

  const index = changeListeners.indexOf(callback);
  if (index > -1) {
    changeListeners.splice(index, 1);
    return true;
  }

  return false;
}

/**
 * Notify all registered listeners of change
 * @param {boolean} isEnabled - New state
 */
function notifyListeners(isEnabled) {
  changeListeners.forEach(callback => {
    try {
      callback(isEnabled);
    } catch (e) {
      console.warn('[ReducedAnimations] Listener error:', e);
    }
  });
}

/**
 * Setup listener for system preference changes
 */
function setupSystemPreferenceListener() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const handleChange = (event) => {
        // Only react if user hasn't set an override
        if (userOverride === null) {
          if (event.matches) {
            applyReducedMotionStyles();
          } else {
            removeReducedMotionStyles();
          }
          notifyListeners(event.matches);
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        // Older browsers
        mediaQuery.addListener(handleChange);
      }
    }
  } catch (e) {
    console.warn('[ReducedAnimations] Failed to setup system listener:', e);
  }
}

/**
 * Get translated label for reduced motion setting
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated label
 */
export function getReducedMotionLabel(lang = 'fr') {
  const validLang = translations[lang] ? lang : 'fr';
  return translations[validLang].label;
}

/**
 * Get translated description for reduced motion setting
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated description
 */
export function getReducedMotionDescription(lang = 'fr') {
  const validLang = translations[lang] ? lang : 'fr';
  return translations[validLang].description;
}

/**
 * Get all translations for a language
 * @param {string} lang - Language code
 * @returns {Object} All translations for the language
 */
export function getReducedMotionTranslations(lang = 'fr') {
  const validLang = translations[lang] ? lang : 'fr';
  return { ...translations[validLang] };
}

/**
 * Get current preference status
 * @returns {Object} Status object with enabled, source, and userOverride
 */
export function getReducedMotionStatus() {
  return {
    enabled: isReducedMotionEnabled(),
    source: userOverride !== null ? 'user' : 'system',
    userOverride: userOverride,
    systemPreference: detectSystemPreference()
  };
}

/**
 * Check if user has set an override
 * @returns {boolean} True if user has overridden system preference
 */
export function hasUserOverride() {
  return userOverride !== null;
}

/**
 * Clear all registered listeners (for cleanup/testing)
 */
export function clearListeners() {
  changeListeners = [];
}

/**
 * Reset internal state (for testing)
 */
export function resetState() {
  userOverride = null;
  changeListeners = [];
  removeReducedMotionStyles();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Render toggle UI HTML for reduced motion setting
 * @param {string} lang - Language code for translations
 * @returns {string} HTML string for toggle UI
 */
export function renderReducedMotionToggle(lang = 'fr') {
  const t = getReducedMotionTranslations(lang);
  const isEnabled = isReducedMotionEnabled();
  const status = getReducedMotionStatus();

  return `
    <div class="reduced-motion-toggle card p-4" role="group" aria-labelledby="reduced-motion-label">
      <div class="flex items-center justify-between mb-2">
        <label id="reduced-motion-label" class="text-sm font-medium text-white dark:text-slate-200">
          ${t.label}
        </label>
        <button
          type="button"
          role="switch"
          aria-checked="${isEnabled}"
          aria-label="${t.label}"
          onclick="window.toggleReducedMotion()"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary-500' : 'bg-slate-600'}"
        >
          <span class="sr-only">${t.label}</span>
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}"
          ></span>
        </button>
      </div>
      <p class="text-xs text-slate-400 mb-3">${t.description}</p>
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2 py-1 rounded-full ${status.source === 'user' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-500/20 text-slate-400'}">
          ${status.source === 'user' ? t.manualLabel : t.autoLabel}
        </span>
        ${status.source === 'user' ? `
          <button
            type="button"
            onclick="window.syncReducedMotionWithSystem()"
            class="text-primary-400 hover:text-primary-300 underline"
            aria-label="${t.autoLabel}"
          >
            ${t.autoLabel}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Get the CSS class name used for reduced motion
 * @returns {string} The CSS class name
 */
export function getReducedMotionClass() {
  return CSS_CLASS;
}

/**
 * Get the localStorage key used for storage
 * @returns {string} The storage key
 */
export function getStorageKey() {
  return STORAGE_KEY;
}

// Initialize on module load
init();

// Export default object with all functions
export default {
  isReducedMotionEnabled,
  enableReducedMotion,
  disableReducedMotion,
  toggleReducedMotion,
  detectSystemPreference,
  syncWithSystemPreference,
  getAnimationDuration,
  getTransitionClass,
  shouldAnimate,
  applyReducedMotionStyles,
  removeReducedMotionStyles,
  onReducedMotionChange,
  offReducedMotionChange,
  renderReducedMotionToggle,
  getReducedMotionLabel,
  getReducedMotionDescription,
  getReducedMotionTranslations,
  getReducedMotionStatus,
  hasUserOverride,
  clearListeners,
  resetState,
  getReducedMotionClass,
  getStorageKey
};
