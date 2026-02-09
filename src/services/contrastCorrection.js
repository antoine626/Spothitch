/**
 * Contrast Correction Service
 * WCAG 2.1 AA/AAA contrast compliance utilities
 *
 * Features:
 * - High contrast mode toggle with localStorage persistence
 * - System preference detection and sync
 * - Color contrast ratio calculation
 * - WCAG AA/AAA compliance checking
 * - Automatic color adjustment suggestions
 * - Page contrast audit
 * - i18n support (FR, EN, ES, DE)
 */

// Storage key for localStorage
const STORAGE_KEY = 'spothitch_high_contrast'

// CSS class applied to body when high contrast is enabled
const HIGH_CONTRAST_CLASS = 'high-contrast-mode'

// Internal state
let highContrastEnabled = false
let systemPreferenceListener = null

// i18n labels
const labels = {
  fr: {
    highContrastToggle: 'Mode contraste eleve',
    highContrastEnabled: 'Contraste eleve active',
    highContrastDisabled: 'Contraste eleve desactive',
    contrastIssue: 'Probleme de contraste',
    contrastRatio: 'Ratio de contraste',
    wcagAA: 'WCAG AA',
    wcagAAA: 'WCAG AAA',
    passed: 'Reussi',
    failed: 'Echoue',
    largeText: 'Grand texte',
    normalText: 'Texte normal',
    suggestedFix: 'Correction suggeree',
    issuesFound: 'problemes de contraste trouves',
    noIssues: 'Aucun probleme de contraste detecte',
    syncWithSystem: 'Synchronise avec les preferences systeme',
    manualMode: 'Mode manuel',
  },
  en: {
    highContrastToggle: 'High contrast mode',
    highContrastEnabled: 'High contrast enabled',
    highContrastDisabled: 'High contrast disabled',
    contrastIssue: 'Contrast issue',
    contrastRatio: 'Contrast ratio',
    wcagAA: 'WCAG AA',
    wcagAAA: 'WCAG AAA',
    passed: 'Passed',
    failed: 'Failed',
    largeText: 'Large text',
    normalText: 'Normal text',
    suggestedFix: 'Suggested fix',
    issuesFound: 'contrast issues found',
    noIssues: 'No contrast issues detected',
    syncWithSystem: 'Synced with system preferences',
    manualMode: 'Manual mode',
  },
  es: {
    highContrastToggle: 'Modo de alto contraste',
    highContrastEnabled: 'Alto contraste activado',
    highContrastDisabled: 'Alto contraste desactivado',
    contrastIssue: 'Problema de contraste',
    contrastRatio: 'Ratio de contraste',
    wcagAA: 'WCAG AA',
    wcagAAA: 'WCAG AAA',
    passed: 'Aprobado',
    failed: 'Fallido',
    largeText: 'Texto grande',
    normalText: 'Texto normal',
    suggestedFix: 'Correccion sugerida',
    issuesFound: 'problemas de contraste encontrados',
    noIssues: 'No se detectaron problemas de contraste',
    syncWithSystem: 'Sincronizado con preferencias del sistema',
    manualMode: 'Modo manual',
  },
  de: {
    highContrastToggle: 'Hochkontrastmodus',
    highContrastEnabled: 'Hoher Kontrast aktiviert',
    highContrastDisabled: 'Hoher Kontrast deaktiviert',
    contrastIssue: 'Kontrastproblem',
    contrastRatio: 'Kontrastverhaltnis',
    wcagAA: 'WCAG AA',
    wcagAAA: 'WCAG AAA',
    passed: 'Bestanden',
    failed: 'Gescheitert',
    largeText: 'Grosser Text',
    normalText: 'Normaler Text',
    suggestedFix: 'Vorgeschlagene Korrektur',
    issuesFound: 'Kontrastprobleme gefunden',
    noIssues: 'Keine Kontrastprobleme erkannt',
    syncWithSystem: 'Mit Systemeinstellungen synchronisiert',
    manualMode: 'Manueller Modus',
  },
}

/**
 * Get translated label
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {object} Labels object for the language
 */
export function getHighContrastLabel(lang = 'fr') {
  return labels[lang] || labels.en
}

/**
 * Get a specific label by key
 * @param {string} key - Label key
 * @param {string} lang - Language code
 * @returns {string} Translated label
 */
export function getLabel(key, lang = 'fr') {
  const langLabels = labels[lang] || labels.en
  return langLabels[key] || labels.en[key] || key
}

/**
 * Initialize the service - load saved preference
 */
export function initContrastCorrection() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      highContrastEnabled = saved === 'true'
      if (highContrastEnabled) {
        applyHighContrastStyles()
      }
    }
  } catch (e) {
    // localStorage not available
    console.warn('[ContrastCorrection] localStorage not available:', e.message)
  }
  return highContrastEnabled
}

/**
 * Check if high contrast mode is currently enabled
 * @returns {boolean} True if high contrast mode is enabled
 */
export function isHighContrastEnabled() {
  return highContrastEnabled
}

/**
 * Enable high contrast mode
 * @returns {boolean} True if successfully enabled
 */
export function enableHighContrast() {
  highContrastEnabled = true
  applyHighContrastStyles()
  savePreference()
  return true
}

/**
 * Disable high contrast mode
 * @returns {boolean} True if successfully disabled
 */
export function disableHighContrast() {
  highContrastEnabled = false
  removeHighContrastStyles()
  savePreference()
  return true
}

/**
 * Toggle high contrast mode
 * @returns {boolean} New state after toggle
 */
export function toggleHighContrast() {
  if (highContrastEnabled) {
    disableHighContrast()
  } else {
    enableHighContrast()
  }
  return highContrastEnabled
}

/**
 * Save preference to localStorage
 */
function savePreference() {
  try {
    localStorage.setItem(STORAGE_KEY, String(highContrastEnabled))
  } catch (e) {
    console.warn('[ContrastCorrection] Could not save preference:', e.message)
  }
}

/**
 * Detect if the system has high contrast preference enabled
 * @returns {boolean} True if system prefers high contrast
 */
export function detectSystemHighContrast() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  // Check both prefers-contrast: more and forced-colors: active (Windows)
  const prefersMore = window.matchMedia('(prefers-contrast: more)').matches
  const forcedColors = window.matchMedia('(forced-colors: active)').matches

  return prefersMore || forcedColors
}

/**
 * Sync with system preference and listen for changes
 * @param {boolean} listen - Whether to set up a listener for changes
 * @returns {boolean} Current state after sync
 */
export function syncWithSystemPreference(listen = true) {
  const systemPrefers = detectSystemHighContrast()

  if (systemPrefers && !highContrastEnabled) {
    enableHighContrast()
  } else if (!systemPrefers && highContrastEnabled) {
    // Only disable if there's no saved manual preference
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) {
      disableHighContrast()
    }
  }

  // Set up listener for system preference changes
  if (listen && typeof window !== 'undefined' && window.matchMedia) {
    // Remove existing listener if any
    if (systemPreferenceListener) {
      try {
        const mediaQuery = window.matchMedia('(prefers-contrast: more)')
        mediaQuery.removeEventListener('change', systemPreferenceListener)
      } catch (e) {
        // Ignore
      }
    }

    systemPreferenceListener = (event) => {
      if (event.matches) {
        enableHighContrast()
      } else {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved !== 'true') {
          disableHighContrast()
        }
      }
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-contrast: more)')
      mediaQuery.addEventListener('change', systemPreferenceListener)
    } catch (e) {
      // Fallback for older browsers
      console.warn('[ContrastCorrection] Could not add media query listener')
    }
  }

  return highContrastEnabled
}

/**
 * Parse color string to RGB values
 * Supports hex (#RGB, #RRGGBB), rgb(), rgba(), and named colors
 * @param {string} color - Color string
 * @returns {{r: number, g: number, b: number}|null} RGB values or null if invalid
 */
export function parseColor(color) {
  if (!color || typeof color !== 'string') {
    return null
  }

  color = color.trim().toLowerCase()

  // Handle named colors (basic subset)
  const namedColors = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    gray: '#808080',
    grey: '#808080',
    navy: '#000080',
    teal: '#008080',
    lime: '#00ff00',
    aqua: '#00ffff',
    maroon: '#800000',
    olive: '#808000',
    silver: '#c0c0c0',
    fuchsia: '#ff00ff',
    transparent: null,
  }

  if (namedColors.hasOwnProperty(color)) {
    const namedColor = namedColors[color]
    if (namedColor === null) return null
    color = namedColor
  }

  // Handle hex colors
  if (color.startsWith('#')) {
    let hex = color.slice(1)

    // Expand shorthand (#RGB -> #RRGGBB)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    // Handle 8-character hex (with alpha)
    if (hex.length === 8) {
      hex = hex.slice(0, 6)
    }

    if (hex.length !== 6) {
      return null
    }

    const num = parseInt(hex, 16)
    if (isNaN(num)) {
      return null
    }

    return {
      r: (num >> 16) & 0xff,
      g: (num >> 8) & 0xff,
      b: num & 0xff,
    }
  }

  // Handle rgb() and rgba()
  const rgbMatch = color.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/**
 * Convert RGB to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 * @param {{r: number, g: number, b: number}} rgb - RGB values
 * @returns {number} Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb) {
  if (!rgb) return 0

  const { r, g, b } = rgb

  // Convert 8-bit RGB to sRGB
  const sR = r / 255
  const sG = g / 255
  const sB = b / 255

  // Apply gamma correction
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4)
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4)
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4)

  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @returns {number} Contrast ratio (1 to 21)
 */
export function getContrastRatio(foreground, background) {
  const fgRgb = parseColor(foreground)
  const bgRgb = parseColor(background)

  if (!fgRgb || !bgRgb) {
    return 1 // Return minimum ratio if colors can't be parsed
  }

  const l1 = getRelativeLuminance(fgRgb)
  const l2 = getRelativeLuminance(bgRgb)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color combination meets WCAG AA requirements
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} isLarge - True if text is large (18px+ or 14px+ bold)
 * @returns {boolean} True if meets WCAG AA
 */
export function meetsWCAG_AA(foreground, background, isLarge = false) {
  const ratio = getContrastRatio(foreground, background)
  // AA requires 4.5:1 for normal text, 3:1 for large text
  return isLarge ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if color combination meets WCAG AAA requirements
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} isLarge - True if text is large (18px+ or 14px+ bold)
 * @returns {boolean} True if meets WCAG AAA
 */
export function meetsWCAG_AAA(foreground, background, isLarge = false) {
  const ratio = getContrastRatio(foreground, background)
  // AAA requires 7:1 for normal text, 4.5:1 for large text
  return isLarge ? ratio >= 4.5 : ratio >= 7
}

/**
 * Adjust a color to achieve a target contrast ratio
 * @param {string} color - Color to adjust
 * @param {number} minRatio - Minimum contrast ratio to achieve (default 4.5 for AA)
 * @param {string} against - Background color to contrast against (default white)
 * @returns {string} Adjusted color in hex format
 */
export function adjustColorForContrast(color, minRatio = 4.5, against = '#ffffff') {
  const originalRgb = parseColor(color)
  const bgRgb = parseColor(against)

  if (!originalRgb || !bgRgb) {
    return color
  }

  // Check if already meets requirement
  if (getContrastRatio(color, against) >= minRatio) {
    return color
  }

  const bgLuminance = getRelativeLuminance(bgRgb)

  // Determine if we need to lighten or darken
  // If background is light, darken the foreground; if dark, lighten it
  const shouldDarken = bgLuminance > 0.5

  let { r, g, b } = originalRgb
  let bestColor = color
  let bestRatio = getContrastRatio(color, against)

  // Iteratively adjust the color
  for (let i = 0; i < 100; i++) {
    if (shouldDarken) {
      // Darken by reducing RGB values
      r = Math.max(0, r - 3)
      g = Math.max(0, g - 3)
      b = Math.max(0, b - 3)
    } else {
      // Lighten by increasing RGB values
      r = Math.min(255, r + 3)
      g = Math.min(255, g + 3)
      b = Math.min(255, b + 3)
    }

    const newColor = rgbToHex(r, g, b)
    const newRatio = getContrastRatio(newColor, against)

    if (newRatio >= minRatio) {
      return newColor
    }

    if (newRatio > bestRatio) {
      bestRatio = newRatio
      bestColor = newColor
    }

    // Stop if we've hit the limits
    if (shouldDarken && r === 0 && g === 0 && b === 0) break
    if (!shouldDarken && r === 255 && g === 255 && b === 255) break
  }

  return bestColor
}

/**
 * Suggest a better foreground color for contrast
 * @param {string} foreground - Current foreground color
 * @param {string} background - Background color
 * @returns {{original: string, suggested: string, originalRatio: number, suggestedRatio: number}} Fix suggestion
 */
export function suggestContrastFix(foreground, background) {
  const originalRatio = getContrastRatio(foreground, background)

  // Determine target ratio (AA normal text = 4.5:1)
  const targetRatio = 4.5

  // If already meets AA, suggest AAA improvement
  if (originalRatio >= targetRatio) {
    const aaaColor = adjustColorForContrast(foreground, 7, background)
    return {
      original: foreground,
      suggested: aaaColor,
      originalRatio: Math.round(originalRatio * 100) / 100,
      suggestedRatio: Math.round(getContrastRatio(aaaColor, background) * 100) / 100,
      meetsAA: true,
      meetsAAA: originalRatio >= 7,
    }
  }

  // Suggest color that meets AA
  const suggested = adjustColorForContrast(foreground, targetRatio, background)
  const suggestedRatio = getContrastRatio(suggested, background)

  return {
    original: foreground,
    suggested,
    originalRatio: Math.round(originalRatio * 100) / 100,
    suggestedRatio: Math.round(suggestedRatio * 100) / 100,
    meetsAA: suggestedRatio >= 4.5,
    meetsAAA: suggestedRatio >= 7,
  }
}

/**
 * Apply high contrast CSS styles to the document
 */
export function applyHighContrastStyles() {
  if (typeof document === 'undefined') return

  // Add class to body
  document.body.classList.add(HIGH_CONTRAST_CLASS)

  // Create or update style element
  let styleEl = document.getElementById('spothitch-high-contrast-styles')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'spothitch-high-contrast-styles'
    document.head.appendChild(styleEl)
  }

  // High contrast styles
  styleEl.textContent = `
    .${HIGH_CONTRAST_CLASS} {
      --text-contrast: #000000;
      --bg-contrast: #ffffff;
      --border-contrast: #000000;
    }

    .${HIGH_CONTRAST_CLASS} body,
    .${HIGH_CONTRAST_CLASS} .dark body {
      background-color: #ffffff !important;
      color: #000000 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark {
      background-color: #000000 !important;
      color: #ffffff !important;
    }

    /* Increase text contrast */
    .${HIGH_CONTRAST_CLASS} p,
    .${HIGH_CONTRAST_CLASS} span,
    .${HIGH_CONTRAST_CLASS} div,
    .${HIGH_CONTRAST_CLASS} label {
      color: inherit !important;
    }

    .${HIGH_CONTRAST_CLASS} .text-gray-400,
    .${HIGH_CONTRAST_CLASS} .text-gray-500,
    .${HIGH_CONTRAST_CLASS} .text-gray-600 {
      color: #1f2937 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark .text-gray-400,
    .${HIGH_CONTRAST_CLASS} .dark .text-gray-500,
    .${HIGH_CONTRAST_CLASS} .dark .text-gray-600 {
      color: #e5e7eb !important;
    }

    /* Add borders to buttons */
    .${HIGH_CONTRAST_CLASS} button,
    .${HIGH_CONTRAST_CLASS} .btn,
    .${HIGH_CONTRAST_CLASS} [role="button"] {
      border: 2px solid currentColor !important;
      outline-offset: 2px;
    }

    .${HIGH_CONTRAST_CLASS} button:focus,
    .${HIGH_CONTRAST_CLASS} .btn:focus,
    .${HIGH_CONTRAST_CLASS} [role="button"]:focus {
      outline: 3px solid #000000 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark button:focus,
    .${HIGH_CONTRAST_CLASS} .dark .btn:focus {
      outline: 3px solid #ffffff !important;
    }

    /* Increase icon visibility */
    .${HIGH_CONTRAST_CLASS} svg,
    .${HIGH_CONTRAST_CLASS} i,
    .${HIGH_CONTRAST_CLASS} .icon {
      stroke-width: 2.5 !important;
    }

    .${HIGH_CONTRAST_CLASS} .fa,
    .${HIGH_CONTRAST_CLASS} .fas,
    .${HIGH_CONTRAST_CLASS} .far {
      font-weight: 900 !important;
    }

    /* Card borders */
    .${HIGH_CONTRAST_CLASS} .card,
    .${HIGH_CONTRAST_CLASS} [class*="rounded"] {
      border: 2px solid #000000 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark .card,
    .${HIGH_CONTRAST_CLASS} .dark [class*="rounded"] {
      border-color: #ffffff !important;
    }

    /* Link underlines */
    .${HIGH_CONTRAST_CLASS} a {
      text-decoration: underline !important;
      text-decoration-thickness: 2px !important;
    }

    /* Input borders */
    .${HIGH_CONTRAST_CLASS} input,
    .${HIGH_CONTRAST_CLASS} select,
    .${HIGH_CONTRAST_CLASS} textarea {
      border: 2px solid #000000 !important;
      background-color: #ffffff !important;
      color: #000000 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark input,
    .${HIGH_CONTRAST_CLASS} .dark select,
    .${HIGH_CONTRAST_CLASS} .dark textarea {
      border-color: #ffffff !important;
      background-color: #1f2937 !important;
      color: #ffffff !important;
    }

    /* Focus states */
    .${HIGH_CONTRAST_CLASS} *:focus {
      outline: 3px solid #000000 !important;
      outline-offset: 2px !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark *:focus {
      outline-color: #ffffff !important;
    }

    /* Placeholder text */
    .${HIGH_CONTRAST_CLASS} ::placeholder {
      color: #4b5563 !important;
      opacity: 1 !important;
    }

    .${HIGH_CONTRAST_CLASS} .dark ::placeholder {
      color: #9ca3af !important;
    }
  `
}

/**
 * Remove high contrast CSS styles from the document
 */
export function removeHighContrastStyles() {
  if (typeof document === 'undefined') return

  // Remove class from body
  document.body.classList.remove(HIGH_CONTRAST_CLASS)

  // Remove style element
  const styleEl = document.getElementById('spothitch-high-contrast-styles')
  if (styleEl) {
    styleEl.remove()
  }
}

/**
 * Get computed styles of an element
 * @param {HTMLElement} element - Element to analyze
 * @returns {{color: string, backgroundColor: string, fontSize: number, fontWeight: number}|null}
 */
function getElementStyles(element) {
  if (typeof window === 'undefined' || !element) return null

  const computed = window.getComputedStyle(element)

  return {
    color: computed.color,
    backgroundColor: computed.backgroundColor,
    fontSize: parseFloat(computed.fontSize),
    fontWeight: parseInt(computed.fontWeight, 10),
  }
}

/**
 * Check if text is considered "large" per WCAG
 * Large text is 18px+ or 14px+ bold
 * @param {number} fontSize - Font size in pixels
 * @param {number} fontWeight - Font weight (100-900)
 * @returns {boolean} True if considered large text
 */
export function isLargeText(fontSize, fontWeight) {
  if (fontSize >= 18) return true
  if (fontSize >= 14 && fontWeight >= 700) return true
  return false
}

/**
 * Audit page for contrast issues
 * @param {HTMLElement} root - Root element to audit (default: document.body)
 * @returns {Array<{element: HTMLElement, fg: string, bg: string, ratio: number, isLarge: boolean, meetsAA: boolean, meetsAAA: boolean}>}
 */
export function getContrastIssues(root = null) {
  if (typeof document === 'undefined') return []

  const rootEl = root || document.body
  if (!rootEl) return []

  const issues = []

  // Selectors for text elements
  const textSelectors = 'p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th'

  try {
    const elements = rootEl.querySelectorAll(textSelectors)

    elements.forEach((element) => {
      // Skip hidden elements
      if (element.offsetParent === null && element.tagName !== 'BODY') return

      // Skip elements with no text content
      const text = element.textContent?.trim()
      if (!text) return

      const styles = getElementStyles(element)
      if (!styles) return

      // Skip if background is transparent (will inherit)
      if (styles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
          styles.backgroundColor === 'transparent') {
        return
      }

      const ratio = getContrastRatio(styles.color, styles.backgroundColor)
      const large = isLargeText(styles.fontSize, styles.fontWeight)
      const meetsAA = meetsWCAG_AA(styles.color, styles.backgroundColor, large)
      const meetsAAA = meetsWCAG_AAA(styles.color, styles.backgroundColor, large)

      // Only report if doesn't meet AA
      if (!meetsAA) {
        issues.push({
          element,
          selector: getElementSelector(element),
          fg: styles.color,
          bg: styles.backgroundColor,
          ratio: Math.round(ratio * 100) / 100,
          isLarge: large,
          meetsAA,
          meetsAAA,
          required: large ? 3 : 4.5,
        })
      }
    })
  } catch (e) {
    console.warn('[ContrastCorrection] Error auditing page:', e.message)
  }

  return issues
}

/**
 * Get a CSS selector for an element (for debugging)
 * @param {HTMLElement} element - Element
 * @returns {string} Selector string
 */
function getElementSelector(element) {
  if (!element) return ''

  let selector = element.tagName.toLowerCase()

  if (element.id) {
    selector += '#' + element.id
  } else if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2)
    if (classes.length) {
      selector += '.' + classes.join('.')
    }
  }

  return selector
}

/**
 * Render a toggle button for high contrast mode
 * @param {string} lang - Language code for labels
 * @returns {string} HTML string for toggle
 */
export function renderHighContrastToggle(lang = 'fr') {
  const langLabels = getHighContrastLabel(lang)
  const isEnabled = isHighContrastEnabled()

  return `
    <div class="high-contrast-toggle flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-dark-secondary" role="group" aria-labelledby="hc-label">
      <span id="hc-label" class="text-sm font-medium">
        ${langLabels.highContrastToggle}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked="${isEnabled}"
        aria-label="${langLabels.highContrastToggle}"
        onclick="window.toggleHighContrastMode && window.toggleHighContrastMode()"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}"
      >
        <span class="sr-only">${langLabels.highContrastToggle}</span>
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}"
          aria-hidden="true"
        ></span>
      </button>
      <span class="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
        ${isEnabled ? langLabels.highContrastEnabled : langLabels.highContrastDisabled}
      </span>
    </div>
  `
}

/**
 * Get the storage key used for persistence
 * @returns {string} Storage key
 */
export function getStorageKey() {
  return STORAGE_KEY
}

/**
 * Get the CSS class applied in high contrast mode
 * @returns {string} CSS class name
 */
export function getHighContrastClass() {
  return HIGH_CONTRAST_CLASS
}

/**
 * Reset the service state (useful for testing)
 */
export function resetContrastCorrection() {
  highContrastEnabled = false
  removeHighContrastStyles()

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // Ignore
  }

  if (systemPreferenceListener) {
    try {
      const mediaQuery = window.matchMedia('(prefers-contrast: more)')
      mediaQuery.removeEventListener('change', systemPreferenceListener)
    } catch (e) {
      // Ignore
    }
    systemPreferenceListener = null
  }
}

// Default export with all functions
export default {
  // Core toggle functions
  isHighContrastEnabled,
  enableHighContrast,
  disableHighContrast,
  toggleHighContrast,

  // System preference
  detectSystemHighContrast,
  syncWithSystemPreference,

  // Contrast calculations
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  adjustColorForContrast,
  suggestContrastFix,

  // Style management
  applyHighContrastStyles,
  removeHighContrastStyles,

  // Audit
  getContrastIssues,
  isLargeText,

  // UI
  renderHighContrastToggle,
  getHighContrastLabel,
  getLabel,

  // Color utilities
  parseColor,
  rgbToHex,
  getRelativeLuminance,

  // Config
  getStorageKey,
  getHighContrastClass,

  // Lifecycle
  initContrastCorrection,
  resetContrastCorrection,
}
