/**
 * Big Text Mode Service
 * Accessibility feature for users who need larger text sizes
 */

import { getState, setState } from '../stores/state.js';

// Storage key for persistence
const STORAGE_KEY = 'spothitch_big_text';
const SCALE_STORAGE_KEY = 'spothitch_text_scale';

// Default values
const DEFAULT_SCALE = 1.0;
const BIG_TEXT_SCALE = 1.25;
const MIN_SCALE = 1.0;
const MAX_SCALE = 2.0;

// CSS class for big text mode
const BIG_TEXT_CLASS = 'big-text';

// Callbacks for change notifications
const changeCallbacks = new Set();

// Current state
let bigTextEnabled = false;
let currentScale = DEFAULT_SCALE;

// Translations for labels
const translations = {
  fr: {
    bigTextToggle: 'Mode gros texte',
    bigTextEnabled: 'Gros texte active',
    bigTextDisabled: 'Gros texte desactive',
    textSizeSlider: 'Taille du texte',
    textSizeSmall: 'Normal',
    textSizeLarge: 'Grand',
    textSizeCustom: 'Personnalise',
    textSizeDescription: 'Ajuste la taille du texte pour une meilleure lisibilite',
    textSizeReset: 'Reinitialiser',
    textSizePreview: 'Apercu du texte',
  },
  en: {
    bigTextToggle: 'Big text mode',
    bigTextEnabled: 'Big text enabled',
    bigTextDisabled: 'Big text disabled',
    textSizeSlider: 'Text size',
    textSizeSmall: 'Normal',
    textSizeLarge: 'Large',
    textSizeCustom: 'Custom',
    textSizeDescription: 'Adjust text size for better readability',
    textSizeReset: 'Reset',
    textSizePreview: 'Text preview',
  },
  es: {
    bigTextToggle: 'Modo texto grande',
    bigTextEnabled: 'Texto grande activado',
    bigTextDisabled: 'Texto grande desactivado',
    textSizeSlider: 'Tamano del texto',
    textSizeSmall: 'Normal',
    textSizeLarge: 'Grande',
    textSizeCustom: 'Personalizado',
    textSizeDescription: 'Ajusta el tamano del texto para mejor legibilidad',
    textSizeReset: 'Restablecer',
    textSizePreview: 'Vista previa del texto',
  },
  de: {
    bigTextToggle: 'Grosser Text Modus',
    bigTextEnabled: 'Grosser Text aktiviert',
    bigTextDisabled: 'Grosser Text deaktiviert',
    textSizeSlider: 'Textgrosse',
    textSizeSmall: 'Normal',
    textSizeLarge: 'Gross',
    textSizeCustom: 'Benutzerdefiniert',
    textSizeDescription: 'Passen Sie die Textgrosse fur bessere Lesbarkeit an',
    textSizeReset: 'Zurucksetzen',
    textSizePreview: 'Textvorschau',
  },
};

/**
 * Initialize big text mode from stored preferences
 */
export function initBigTextMode() {
  try {
    // Load enabled state
    const storedEnabled = localStorage.getItem(STORAGE_KEY);
    if (storedEnabled !== null) {
      bigTextEnabled = storedEnabled === 'true';
    }

    // Load custom scale
    const storedScale = localStorage.getItem(SCALE_STORAGE_KEY);
    if (storedScale !== null) {
      const parsedScale = parseFloat(storedScale);
      if (!isNaN(parsedScale) && parsedScale >= MIN_SCALE && parsedScale <= MAX_SCALE) {
        currentScale = parsedScale;
      }
    }

    // Apply if enabled
    if (bigTextEnabled) {
      applyBigTextStyles();
    }

    return { enabled: bigTextEnabled, scale: currentScale };
  } catch (error) {
    console.warn('[BigTextMode] Failed to initialize:', error);
    return { enabled: false, scale: DEFAULT_SCALE };
  }
}

/**
 * Check if big text mode is enabled
 * @returns {boolean}
 */
export function isBigTextEnabled() {
  return bigTextEnabled;
}

/**
 * Enable big text mode
 */
export function enableBigText() {
  if (bigTextEnabled) return;

  bigTextEnabled = true;

  // Save preference
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch (error) {
    console.warn('[BigTextMode] Failed to save preference:', error);
  }

  // Apply styles
  applyBigTextStyles();

  // Notify callbacks
  notifyCallbacks({ enabled: true, scale: currentScale });
}

/**
 * Disable big text mode
 */
export function disableBigText() {
  if (!bigTextEnabled) return;

  bigTextEnabled = false;

  // Save preference
  try {
    localStorage.setItem(STORAGE_KEY, 'false');
  } catch (error) {
    console.warn('[BigTextMode] Failed to save preference:', error);
  }

  // Remove styles
  removeBigTextStyles();

  // Notify callbacks
  notifyCallbacks({ enabled: false, scale: currentScale });
}

/**
 * Toggle big text mode
 * @returns {boolean} New enabled state
 */
export function toggleBigText() {
  if (bigTextEnabled) {
    disableBigText();
  } else {
    enableBigText();
  }
  return bigTextEnabled;
}

/**
 * Get current text scale factor
 * @returns {number} Scale factor (1.0 normal, 1.25 big, up to 2.0)
 */
export function getTextScale() {
  if (!bigTextEnabled) {
    return DEFAULT_SCALE;
  }
  return currentScale;
}

/**
 * Set custom text scale
 * @param {number} scale - Scale factor (1.0 to 2.0)
 * @returns {boolean} Success
 */
export function setTextScale(scale) {
  // Validate scale
  if (typeof scale !== 'number' || isNaN(scale)) {
    console.warn('[BigTextMode] Invalid scale value:', scale);
    return false;
  }

  // Clamp to valid range
  const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  currentScale = clampedScale;

  // Save preference
  try {
    localStorage.setItem(SCALE_STORAGE_KEY, String(clampedScale));
  } catch (error) {
    console.warn('[BigTextMode] Failed to save scale:', error);
  }

  // Re-apply styles if enabled
  if (bigTextEnabled) {
    applyBigTextStyles();
  }

  // Notify callbacks
  notifyCallbacks({ enabled: bigTextEnabled, scale: currentScale });

  return true;
}

/**
 * Apply CSS styles for big text mode
 */
export function applyBigTextStyles() {
  // Add class to body
  if (typeof document !== 'undefined') {
    document.body.classList.add(BIG_TEXT_CLASS);

    // Set CSS custom property for scale
    document.documentElement.style.setProperty('--text-scale', String(currentScale));

    // Add style element if not exists
    let styleEl = document.getElementById('big-text-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'big-text-styles';
      document.head.appendChild(styleEl);
    }

    // Generate CSS rules
    styleEl.textContent = generateBigTextCSS(currentScale);
  }
}

/**
 * Remove CSS styles for big text mode
 */
export function removeBigTextStyles() {
  if (typeof document !== 'undefined') {
    document.body.classList.remove(BIG_TEXT_CLASS);

    // Remove CSS custom property
    document.documentElement.style.removeProperty('--text-scale');

    // Remove style element
    const styleEl = document.getElementById('big-text-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }
}

/**
 * Generate CSS rules for big text mode
 * @param {number} scale - Scale factor
 * @returns {string} CSS rules
 */
function generateBigTextCSS(scale) {
  return `
    /* Big Text Mode Styles */
    .big-text {
      font-size: ${scale}rem;
    }

    .big-text p,
    .big-text span,
    .big-text a,
    .big-text li,
    .big-text td,
    .big-text th,
    .big-text label,
    .big-text input,
    .big-text textarea,
    .big-text select,
    .big-text button {
      font-size: ${scale}em;
      line-height: ${1.5 * scale};
    }

    .big-text h1 {
      font-size: ${2 * scale}rem;
      line-height: ${1.2 * scale};
    }

    .big-text h2 {
      font-size: ${1.75 * scale}rem;
      line-height: ${1.3 * scale};
    }

    .big-text h3 {
      font-size: ${1.5 * scale}rem;
      line-height: ${1.35 * scale};
    }

    .big-text h4 {
      font-size: ${1.25 * scale}rem;
      line-height: ${1.4 * scale};
    }

    .big-text h5,
    .big-text h6 {
      font-size: ${1.1 * scale}rem;
      line-height: ${1.45 * scale};
    }

    .big-text .text-xs {
      font-size: ${0.75 * scale}rem;
    }

    .big-text .text-sm {
      font-size: ${0.875 * scale}rem;
    }

    .big-text .text-base {
      font-size: ${scale}rem;
    }

    .big-text .text-lg {
      font-size: ${1.125 * scale}rem;
    }

    .big-text .text-xl {
      font-size: ${1.25 * scale}rem;
    }

    .big-text .text-2xl {
      font-size: ${1.5 * scale}rem;
    }

    .big-text .text-3xl {
      font-size: ${1.875 * scale}rem;
    }

    .big-text .text-4xl {
      font-size: ${2.25 * scale}rem;
    }

    /* Icon scaling */
    .big-text .fa,
    .big-text .fas,
    .big-text .far,
    .big-text .fab,
    .big-text i[class*="fa-"] {
      font-size: ${scale}em;
    }

    /* Button and input scaling */
    .big-text .btn {
      padding: ${0.5 * scale}rem ${1 * scale}rem;
    }

    .big-text input[type="text"],
    .big-text input[type="email"],
    .big-text input[type="password"],
    .big-text input[type="search"],
    .big-text textarea {
      padding: ${0.5 * scale}rem ${0.75 * scale}rem;
    }
  `;
}

/**
 * Get adjusted font size based on current scale
 * @param {number} basePx - Base font size in pixels
 * @returns {number} Adjusted font size in pixels
 */
export function getFontSize(basePx) {
  if (typeof basePx !== 'number' || isNaN(basePx)) {
    return 16; // Default browser font size
  }

  if (!bigTextEnabled) {
    return basePx;
  }

  return Math.round(basePx * currentScale);
}

/**
 * Get adjusted line height based on current scale
 * @param {number} baseHeight - Base line height (unitless ratio or pixels)
 * @returns {number} Adjusted line height
 */
export function getLineHeight(baseHeight) {
  if (typeof baseHeight !== 'number' || isNaN(baseHeight)) {
    return 1.5; // Default line height
  }

  if (!bigTextEnabled) {
    return baseHeight;
  }

  // For unitless line heights (< 4), scale proportionally
  // For pixel values (>= 4), also scale
  return baseHeight * currentScale;
}

/**
 * Detect system text size preference
 * Uses CSS media queries for text size preferences
 * @returns {object} { prefersLargeText: boolean, scaleFactor: number }
 */
export function detectSystemTextSize() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { prefersLargeText: false, scaleFactor: 1.0 };
  }

  // Check for prefers-reduced-motion as a proxy for accessibility needs
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check font-size related media queries
  // Note: There's no direct "prefers-large-text" media query, but we can check for zoom level
  const prefersMoreContrast = window.matchMedia('(prefers-contrast: more)').matches;

  // If user has accessibility preferences, suggest larger text
  const prefersLargeText = prefersReducedMotion || prefersMoreContrast;

  // Detect browser zoom level (approximate)
  let scaleFactor = 1.0;
  if (typeof window !== 'undefined' && window.devicePixelRatio) {
    // If zoom is above 1.25, user might need larger text
    const zoomLevel = Math.round(window.devicePixelRatio * 100) / 100;
    if (zoomLevel > 1.25) {
      scaleFactor = Math.min(zoomLevel, MAX_SCALE);
    }
  }

  return {
    prefersLargeText,
    scaleFactor,
    prefersReducedMotion,
    prefersMoreContrast,
  };
}

/**
 * Sync with system text size preference
 * Automatically enables big text if system preference detected
 * @returns {object} { synced: boolean, enabled: boolean, scale: number }
 */
export function syncWithSystemTextSize() {
  const systemPref = detectSystemTextSize();

  if (systemPref.prefersLargeText) {
    // Enable big text if not already enabled
    if (!bigTextEnabled) {
      bigTextEnabled = true;

      // Use system scale factor if greater than default
      if (systemPref.scaleFactor > BIG_TEXT_SCALE) {
        currentScale = systemPref.scaleFactor;
      } else {
        currentScale = BIG_TEXT_SCALE;
      }

      // Save preference
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(SCALE_STORAGE_KEY, String(currentScale));
      } catch (error) {
        console.warn('[BigTextMode] Failed to save sync preference:', error);
      }

      // Apply styles
      applyBigTextStyles();

      // Notify callbacks
      notifyCallbacks({ enabled: true, scale: currentScale, synced: true });

      return { synced: true, enabled: true, scale: currentScale };
    }
  }

  return { synced: false, enabled: bigTextEnabled, scale: currentScale };
}

/**
 * Register callback for big text mode changes
 * @param {Function} callback - Callback function (receives { enabled, scale })
 * @returns {Function} Unsubscribe function
 */
export function onBigTextChange(callback) {
  if (typeof callback !== 'function') {
    console.warn('[BigTextMode] Callback must be a function');
    return () => {};
  }

  changeCallbacks.add(callback);

  // Return unsubscribe function
  return () => {
    changeCallbacks.delete(callback);
  };
}

/**
 * Unregister callback for big text mode changes
 * @param {Function} callback - Callback function to remove
 */
export function offBigTextChange(callback) {
  changeCallbacks.delete(callback);
}

/**
 * Notify all registered callbacks
 * @param {object} data - Data to pass to callbacks
 */
function notifyCallbacks(data) {
  changeCallbacks.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.warn('[BigTextMode] Callback error:', error);
    }
  });
}

/**
 * Render toggle UI for big text mode
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} HTML string
 */
export function renderBigTextToggle(lang = 'fr') {
  const t = translations[lang] || translations.fr;
  const isEnabled = bigTextEnabled;

  return `
    <div class="big-text-toggle" role="group" aria-labelledby="big-text-label">
      <label id="big-text-label" class="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
        <div class="flex items-center gap-3">
          <i class="fas fa-text-height text-xl text-primary-400" aria-hidden="true"></i>
          <span class="font-medium">${t.bigTextToggle}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked="${isEnabled}"
          aria-label="${isEnabled ? t.bigTextEnabled : t.bigTextDisabled}"
          onclick="window.toggleBigTextMode()"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary-500' : 'bg-slate-600'}"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}"
            aria-hidden="true"
          ></span>
        </button>
      </label>
    </div>
  `;
}

/**
 * Render text size slider UI
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} HTML string
 */
export function renderTextSizeSlider(lang = 'fr') {
  const t = translations[lang] || translations.fr;
  const scale = currentScale;
  const percentage = Math.round((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE) * 100);

  return `
    <div class="text-size-slider p-4 rounded-xl bg-white/5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <i class="fas fa-font text-xl text-primary-400" aria-hidden="true"></i>
          <span class="font-medium">${t.textSizeSlider}</span>
        </div>
        <span class="text-sm text-slate-400">${Math.round(scale * 100)}%</span>
      </div>

      <p class="text-sm text-slate-400 mb-4">${t.textSizeDescription}</p>

      <div class="flex items-center gap-4">
        <span class="text-xs text-slate-500" aria-hidden="true">${t.textSizeSmall}</span>
        <input
          type="range"
          min="100"
          max="200"
          step="5"
          value="${Math.round(scale * 100)}"
          onchange="window.setTextScaleFromSlider(this.value)"
          oninput="window.previewTextScale(this.value)"
          class="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          aria-label="${t.textSizeSlider}"
          aria-valuemin="100"
          aria-valuemax="200"
          aria-valuenow="${Math.round(scale * 100)}"
          aria-valuetext="${Math.round(scale * 100)}%"
        />
        <span class="text-xs text-slate-500" aria-hidden="true">${t.textSizeLarge}</span>
      </div>

      <div class="flex justify-between items-center mt-4">
        <button
          type="button"
          onclick="window.resetTextScale()"
          class="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          aria-label="${t.textSizeReset}"
        >
          <i class="fas fa-undo-alt mr-1" aria-hidden="true"></i>
          ${t.textSizeReset}
        </button>

        <div class="text-preview p-2 bg-white/5 rounded-lg" aria-label="${t.textSizePreview}">
          <span style="font-size: ${scale}rem">Aa</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get translated label for big text mode
 * @param {string} lang - Language code (fr, en, es, de)
 * @param {string} key - Label key
 * @returns {string} Translated label
 */
export function getBigTextLabel(lang = 'fr', key = 'bigTextToggle') {
  const t = translations[lang] || translations.fr;
  return t[key] || key;
}

/**
 * Get all available labels for a language
 * @param {string} lang - Language code
 * @returns {object} All labels for the language
 */
export function getAllLabels(lang = 'fr') {
  return translations[lang] || translations.fr;
}

/**
 * Reset to default settings
 */
export function resetBigTextMode() {
  bigTextEnabled = false;
  currentScale = DEFAULT_SCALE;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SCALE_STORAGE_KEY);
  } catch (error) {
    console.warn('[BigTextMode] Failed to clear preferences:', error);
  }

  removeBigTextStyles();
  notifyCallbacks({ enabled: false, scale: DEFAULT_SCALE, reset: true });
}

/**
 * Get current big text mode state
 * @returns {object} { enabled, scale, minScale, maxScale }
 */
export function getBigTextState() {
  return {
    enabled: bigTextEnabled,
    scale: currentScale,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    defaultScale: DEFAULT_SCALE,
    bigTextScale: BIG_TEXT_SCALE,
  };
}

// Global handlers for UI
if (typeof window !== 'undefined') {
  window.toggleBigTextMode = toggleBigText;
  window.setTextScaleFromSlider = (value) => {
    const scale = parseInt(value, 10) / 100;
    setTextScale(scale);
  };
  window.previewTextScale = (value) => {
    // Preview without saving
    const scale = parseInt(value, 10) / 100;
    const preview = document.querySelector('.text-preview span');
    if (preview) {
      preview.style.fontSize = `${scale}rem`;
    }
  };
  window.resetTextScale = () => {
    setTextScale(DEFAULT_SCALE);
    disableBigText();
  };
}

// Export default object with all functions
export default {
  initBigTextMode,
  isBigTextEnabled,
  enableBigText,
  disableBigText,
  toggleBigText,
  getTextScale,
  setTextScale,
  applyBigTextStyles,
  removeBigTextStyles,
  getFontSize,
  getLineHeight,
  detectSystemTextSize,
  syncWithSystemTextSize,
  onBigTextChange,
  offBigTextChange,
  renderBigTextToggle,
  renderTextSizeSlider,
  getBigTextLabel,
  getAllLabels,
  resetBigTextMode,
  getBigTextState,
  // Constants
  DEFAULT_SCALE,
  BIG_TEXT_SCALE,
  MIN_SCALE,
  MAX_SCALE,
  STORAGE_KEY,
  BIG_TEXT_CLASS,
};
