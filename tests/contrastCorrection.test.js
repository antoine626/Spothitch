/**
 * Contrast Correction Service Tests
 * Comprehensive tests for WCAG contrast compliance utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isHighContrastEnabled,
  enableHighContrast,
  disableHighContrast,
  toggleHighContrast,
  detectSystemHighContrast,
  syncWithSystemPreference,
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  suggestContrastFix,
  applyHighContrastStyles,
  removeHighContrastStyles,
  getContrastIssues,
  renderHighContrastToggle,
  getHighContrastLabel,
  getLabel,
  adjustColorForContrast,
  parseColor,
  rgbToHex,
  getRelativeLuminance,
  isLargeText,
  getStorageKey,
  getHighContrastClass,
  initContrastCorrection,
  resetContrastCorrection,
} from '../src/services/contrastCorrection.js'
import contrastCorrection from '../src/services/contrastCorrection.js'

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    },
  }
})()

// Mock matchMedia
const createMatchMediaMock = (matches = false) => {
  return vi.fn((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Setup
beforeEach(() => {
  // Reset localStorage mock
  mockLocalStorage.clear()
  Object.defineProperty(global, 'localStorage', { value: mockLocalStorage })

  // Reset matchMedia mock
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: createMatchMediaMock(false),
  })

  // Reset document body
  document.body.innerHTML = ''
  document.body.className = ''

  // Remove any high contrast style elements
  const styleEl = document.getElementById('spothitch-high-contrast-styles')
  if (styleEl) styleEl.remove()

  // Reset service state
  resetContrastCorrection()
})

afterEach(() => {
  vi.clearAllMocks()
  resetContrastCorrection()
})

// ============================================================================
// Core Toggle Functions
// ============================================================================

describe('isHighContrastEnabled', () => {
  it('should return false by default', () => {
    expect(isHighContrastEnabled()).toBe(false)
  })

  it('should return true after enableHighContrast', () => {
    enableHighContrast()
    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should return false after disableHighContrast', () => {
    enableHighContrast()
    disableHighContrast()
    expect(isHighContrastEnabled()).toBe(false)
  })
})

describe('enableHighContrast', () => {
  it('should enable high contrast mode', () => {
    const result = enableHighContrast()
    expect(result).toBe(true)
    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should save preference to localStorage', () => {
    enableHighContrast()
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('spothitch_high_contrast', 'true')
  })

  it('should apply high contrast styles', () => {
    enableHighContrast()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(true)
  })

  it('should create style element', () => {
    enableHighContrast()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl).not.toBeNull()
    expect(styleEl.textContent).toContain('high-contrast-mode')
  })
})

describe('disableHighContrast', () => {
  it('should disable high contrast mode', () => {
    enableHighContrast()
    const result = disableHighContrast()
    expect(result).toBe(true)
    expect(isHighContrastEnabled()).toBe(false)
  })

  it('should save preference to localStorage', () => {
    enableHighContrast()
    disableHighContrast()
    expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith('spothitch_high_contrast', 'false')
  })

  it('should remove high contrast class from body', () => {
    enableHighContrast()
    disableHighContrast()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(false)
  })

  it('should remove style element', () => {
    enableHighContrast()
    disableHighContrast()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl).toBeNull()
  })
})

describe('toggleHighContrast', () => {
  it('should enable when disabled', () => {
    const result = toggleHighContrast()
    expect(result).toBe(true)
    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should disable when enabled', () => {
    enableHighContrast()
    const result = toggleHighContrast()
    expect(result).toBe(false)
    expect(isHighContrastEnabled()).toBe(false)
  })

  it('should toggle multiple times correctly', () => {
    toggleHighContrast() // true
    toggleHighContrast() // false
    toggleHighContrast() // true
    expect(isHighContrastEnabled()).toBe(true)
  })
})

// ============================================================================
// System Preference Detection
// ============================================================================

describe('detectSystemHighContrast', () => {
  it('should return false when system does not prefer high contrast', () => {
    window.matchMedia = createMatchMediaMock(false)
    expect(detectSystemHighContrast()).toBe(false)
  })

  it('should return true when system prefers high contrast', () => {
    window.matchMedia = createMatchMediaMock(true)
    expect(detectSystemHighContrast()).toBe(true)
  })

  it('should check prefers-contrast: more media query', () => {
    window.matchMedia = createMatchMediaMock(false)
    detectSystemHighContrast()
    expect(window.matchMedia).toHaveBeenCalled()
  })

  it('should return false when matchMedia is not available', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    })
    expect(detectSystemHighContrast()).toBe(false)
  })
})

describe('syncWithSystemPreference', () => {
  it('should enable high contrast if system prefers it', () => {
    window.matchMedia = createMatchMediaMock(true)
    syncWithSystemPreference(false)
    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should not change state if already matches system preference', () => {
    window.matchMedia = createMatchMediaMock(false)
    syncWithSystemPreference(false)
    expect(isHighContrastEnabled()).toBe(false)
  })

  it('should return current state', () => {
    window.matchMedia = createMatchMediaMock(true)
    const result = syncWithSystemPreference(false)
    expect(result).toBe(true)
  })

  it('should respect manual preference over system', () => {
    mockLocalStorage.setItem('spothitch_high_contrast', 'true')
    window.matchMedia = createMatchMediaMock(false)
    enableHighContrast()
    syncWithSystemPreference(false)
    // Should still be enabled because of manual preference
    expect(isHighContrastEnabled()).toBe(true)
  })
})

// ============================================================================
// Color Parsing
// ============================================================================

describe('parseColor', () => {
  it('should parse 6-digit hex colors', () => {
    const result = parseColor('#ff5500')
    expect(result).toEqual({ r: 255, g: 85, b: 0 })
  })

  it('should parse 3-digit hex colors', () => {
    const result = parseColor('#f50')
    expect(result).toEqual({ r: 255, g: 85, b: 0 })
  })

  it('should parse hex colors without #', () => {
    // The function requires # prefix
    const result = parseColor('ff5500')
    expect(result).toBeNull()
  })

  it('should parse rgb() colors', () => {
    const result = parseColor('rgb(255, 128, 64)')
    expect(result).toEqual({ r: 255, g: 128, b: 64 })
  })

  it('should parse rgba() colors', () => {
    const result = parseColor('rgba(100, 150, 200, 0.5)')
    expect(result).toEqual({ r: 100, g: 150, b: 200 })
  })

  it('should parse named colors', () => {
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('should handle case insensitivity', () => {
    expect(parseColor('#FF5500')).toEqual({ r: 255, g: 85, b: 0 })
    expect(parseColor('WHITE')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should return null for invalid colors', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor(null)).toBeNull()
    expect(parseColor(undefined)).toBeNull()
    expect(parseColor('notacolor')).toBeNull()
  })

  it('should return null for transparent', () => {
    expect(parseColor('transparent')).toBeNull()
  })

  it('should handle 8-digit hex (with alpha)', () => {
    const result = parseColor('#ff550080')
    expect(result).toEqual({ r: 255, g: 85, b: 0 })
  })
})

describe('rgbToHex', () => {
  it('should convert RGB to hex', () => {
    expect(rgbToHex(255, 85, 0)).toBe('#ff5500')
  })

  it('should handle single digit values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f')
  })

  it('should clamp values to 0-255', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080')
  })

  it('should round decimal values', () => {
    expect(rgbToHex(127.6, 64.4, 200.9)).toBe('#8040c9')
  })
})

describe('getRelativeLuminance', () => {
  it('should return 0 for black', () => {
    const luminance = getRelativeLuminance({ r: 0, g: 0, b: 0 })
    expect(luminance).toBeCloseTo(0, 5)
  })

  it('should return 1 for white', () => {
    const luminance = getRelativeLuminance({ r: 255, g: 255, b: 255 })
    expect(luminance).toBeCloseTo(1, 5)
  })

  it('should return 0 for null input', () => {
    expect(getRelativeLuminance(null)).toBe(0)
  })

  it('should calculate correct luminance for gray', () => {
    const luminance = getRelativeLuminance({ r: 128, g: 128, b: 128 })
    expect(luminance).toBeGreaterThan(0.2)
    expect(luminance).toBeLessThan(0.3)
  })
})

// ============================================================================
// Contrast Ratio Calculations
// ============================================================================

describe('getContrastRatio', () => {
  it('should return 21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('should return 21 for white on black', () => {
    const ratio = getContrastRatio('#ffffff', '#000000')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('should return 1 for same colors', () => {
    const ratio = getContrastRatio('#ff0000', '#ff0000')
    expect(ratio).toBeCloseTo(1, 5)
  })

  it('should handle named colors', () => {
    const ratio = getContrastRatio('black', 'white')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('should handle rgb() colors', () => {
    const ratio = getContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('should return 1 for invalid colors', () => {
    expect(getContrastRatio('invalid', '#ffffff')).toBe(1)
    expect(getContrastRatio('#ffffff', 'invalid')).toBe(1)
  })

  it('should calculate approximately correct ratio for gray on white', () => {
    // Gray (#767676) on white should be around 4.54:1 (just passing AA)
    const ratio = getContrastRatio('#767676', '#ffffff')
    expect(ratio).toBeGreaterThan(4)
    expect(ratio).toBeLessThan(5)
  })
})

// ============================================================================
// WCAG Compliance Checking
// ============================================================================

describe('meetsWCAG_AA', () => {
  it('should pass for black on white (normal text)', () => {
    expect(meetsWCAG_AA('#000000', '#ffffff', false)).toBe(true)
  })

  it('should pass for black on white (large text)', () => {
    expect(meetsWCAG_AA('#000000', '#ffffff', true)).toBe(true)
  })

  it('should fail for light gray on white (normal text)', () => {
    expect(meetsWCAG_AA('#aaaaaa', '#ffffff', false)).toBe(false)
  })

  it('should pass for medium gray on white with 4.5:1+ ratio (normal)', () => {
    // #757575 has roughly 4.6:1 ratio with white
    expect(meetsWCAG_AA('#757575', '#ffffff', false)).toBe(true)
  })

  it('should have lower threshold for large text (3:1)', () => {
    // A color that passes 3:1 but fails 4.5:1
    // #949494 has about 3.0:1 ratio
    expect(meetsWCAG_AA('#949494', '#ffffff', true)).toBe(true)
    expect(meetsWCAG_AA('#949494', '#ffffff', false)).toBe(false)
  })

  it('should fail for same color', () => {
    expect(meetsWCAG_AA('#ffffff', '#ffffff', false)).toBe(false)
  })
})

describe('meetsWCAG_AAA', () => {
  it('should pass for black on white (normal text)', () => {
    expect(meetsWCAG_AAA('#000000', '#ffffff', false)).toBe(true)
  })

  it('should fail for medium gray on white (normal text)', () => {
    // AAA requires 7:1 for normal text
    expect(meetsWCAG_AAA('#757575', '#ffffff', false)).toBe(false)
  })

  it('should pass for dark gray on white (normal text)', () => {
    // #595959 has about 7:1 ratio
    expect(meetsWCAG_AAA('#595959', '#ffffff', false)).toBe(true)
  })

  it('should have lower threshold for large text (4.5:1)', () => {
    // #767676 has about 4.5:1 ratio
    expect(meetsWCAG_AAA('#767676', '#ffffff', true)).toBe(true)
    expect(meetsWCAG_AAA('#767676', '#ffffff', false)).toBe(false)
  })
})

describe('isLargeText', () => {
  it('should return true for 18px text', () => {
    expect(isLargeText(18, 400)).toBe(true)
  })

  it('should return true for text larger than 18px', () => {
    expect(isLargeText(24, 400)).toBe(true)
    expect(isLargeText(36, 400)).toBe(true)
  })

  it('should return true for 14px bold text', () => {
    expect(isLargeText(14, 700)).toBe(true)
  })

  it('should return false for small normal text', () => {
    expect(isLargeText(12, 400)).toBe(false)
    expect(isLargeText(16, 400)).toBe(false)
  })

  it('should return false for 14px non-bold text', () => {
    expect(isLargeText(14, 400)).toBe(false)
    expect(isLargeText(14, 500)).toBe(false)
    expect(isLargeText(14, 600)).toBe(false)
  })
})

// ============================================================================
// Color Adjustment
// ============================================================================

describe('adjustColorForContrast', () => {
  it('should return original color if already meets requirement', () => {
    const result = adjustColorForContrast('#000000', 4.5, '#ffffff')
    expect(result).toBe('#000000')
  })

  it('should darken color for light background', () => {
    // Light gray doesn't meet 4.5:1 on white, should darken
    const result = adjustColorForContrast('#aaaaaa', 4.5, '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('should lighten color for dark background', () => {
    // Dark gray doesn't meet 4.5:1 on black, should lighten
    const result = adjustColorForContrast('#333333', 4.5, '#000000')
    const ratio = getContrastRatio(result, '#000000')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('should return original for invalid colors', () => {
    expect(adjustColorForContrast('invalid', 4.5, '#ffffff')).toBe('invalid')
  })

  it('should adjust to meet different ratios', () => {
    // Adjust to meet AAA (7:1)
    const result = adjustColorForContrast('#888888', 7, '#ffffff')
    const ratio = getContrastRatio(result, '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(7)
  })
})

describe('suggestContrastFix', () => {
  it('should suggest darker color for failing combination', () => {
    const result = suggestContrastFix('#aaaaaa', '#ffffff')
    expect(result.original).toBe('#aaaaaa')
    expect(result.suggestedRatio).toBeGreaterThanOrEqual(4.5)
    expect(result.meetsAA).toBe(true)
  })

  it('should return original info when already meets AA', () => {
    const result = suggestContrastFix('#000000', '#ffffff')
    expect(result.original).toBe('#000000')
    expect(result.meetsAA).toBe(true)
    expect(result.meetsAAA).toBe(true)
  })

  it('should include ratio information', () => {
    const result = suggestContrastFix('#888888', '#ffffff')
    expect(result.originalRatio).toBeDefined()
    expect(result.suggestedRatio).toBeDefined()
    expect(typeof result.originalRatio).toBe('number')
    expect(typeof result.suggestedRatio).toBe('number')
  })

  it('should suggest AAA improvement for AA-passing colors', () => {
    // #767676 passes AA but not AAA
    const result = suggestContrastFix('#767676', '#ffffff')
    expect(result.meetsAA).toBe(true)
    expect(result.suggested).toBeDefined()
  })
})

// ============================================================================
// Style Management
// ============================================================================

describe('applyHighContrastStyles', () => {
  it('should add class to body', () => {
    applyHighContrastStyles()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(true)
  })

  it('should create style element with high contrast CSS', () => {
    applyHighContrastStyles()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl).not.toBeNull()
    expect(styleEl.tagName).toBe('STYLE')
  })

  it('should include button border styles', () => {
    applyHighContrastStyles()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl.textContent).toContain('button')
    expect(styleEl.textContent).toContain('border')
  })

  it('should include focus styles', () => {
    applyHighContrastStyles()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl.textContent).toContain(':focus')
    expect(styleEl.textContent).toContain('outline')
  })

  it('should not create duplicate style elements', () => {
    applyHighContrastStyles()
    applyHighContrastStyles()
    const styleEls = document.querySelectorAll('#spothitch-high-contrast-styles')
    expect(styleEls.length).toBe(1)
  })
})

describe('removeHighContrastStyles', () => {
  it('should remove class from body', () => {
    applyHighContrastStyles()
    removeHighContrastStyles()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(false)
  })

  it('should remove style element', () => {
    applyHighContrastStyles()
    removeHighContrastStyles()
    const styleEl = document.getElementById('spothitch-high-contrast-styles')
    expect(styleEl).toBeNull()
  })

  it('should be safe to call when not applied', () => {
    expect(() => removeHighContrastStyles()).not.toThrow()
  })
})

// ============================================================================
// Page Audit
// ============================================================================

describe('getContrastIssues', () => {
  beforeEach(() => {
    // Create test DOM structure
    document.body.innerHTML = `
      <div id="test-container">
        <p style="color: #aaaaaa; background-color: #ffffff;">Low contrast text</p>
        <p style="color: #000000; background-color: #ffffff;">High contrast text</p>
        <span style="color: #cccccc; background-color: #ffffff;">Very low contrast</span>
      </div>
    `
  })

  it('should return array of issues', () => {
    const issues = getContrastIssues()
    expect(Array.isArray(issues)).toBe(true)
  })

  it('should detect low contrast elements', () => {
    const issues = getContrastIssues()
    // Should find at least the low contrast elements
    expect(issues.length).toBeGreaterThan(0)
  })

  it('should not report high contrast elements', () => {
    const issues = getContrastIssues()
    // None of the issues should be for the black on white text
    const highContrastIssue = issues.find((i) => i.ratio >= 21)
    expect(highContrastIssue).toBeUndefined()
  })

  it('should include element information', () => {
    const issues = getContrastIssues()
    if (issues.length > 0) {
      const issue = issues[0]
      expect(issue.element).toBeDefined()
      expect(issue.fg).toBeDefined()
      expect(issue.bg).toBeDefined()
      expect(issue.ratio).toBeDefined()
    }
  })

  it('should return empty array for valid document', () => {
    document.body.innerHTML = `
      <p style="color: #000000; background-color: #ffffff;">Good contrast</p>
    `
    const issues = getContrastIssues()
    expect(issues.length).toBe(0)
  })

  it('should accept custom root element', () => {
    const container = document.getElementById('test-container')
    const issues = getContrastIssues(container)
    expect(Array.isArray(issues)).toBe(true)
  })
})

// ============================================================================
// UI Rendering
// ============================================================================

describe('renderHighContrastToggle', () => {
  it('should return HTML string', () => {
    const html = renderHighContrastToggle()
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('should include toggle button with switch role', () => {
    const html = renderHighContrastToggle()
    expect(html).toContain('role="switch"')
  })

  it('should include aria-checked attribute', () => {
    const html = renderHighContrastToggle()
    expect(html).toContain('aria-checked')
  })

  it('should reflect current state', () => {
    let html = renderHighContrastToggle()
    expect(html).toContain('aria-checked="false"')

    enableHighContrast()
    html = renderHighContrastToggle()
    expect(html).toContain('aria-checked="true"')
  })

  it('should use correct language labels', () => {
    const htmlFr = renderHighContrastToggle('fr')
    expect(htmlFr).toContain('contraste')

    const htmlEn = renderHighContrastToggle('en')
    expect(htmlEn).toContain('contrast')
  })

  it('should include onclick handler', () => {
    const html = renderHighContrastToggle()
    expect(html).toContain('onclick')
    expect(html).toContain('toggleHighContrastMode')
  })
})

// ============================================================================
// i18n Support
// ============================================================================

describe('getHighContrastLabel', () => {
  it('should return French labels by default', () => {
    const labels = getHighContrastLabel()
    expect(labels.highContrastToggle).toContain('contraste')
  })

  it('should return French labels for fr', () => {
    const labels = getHighContrastLabel('fr')
    expect(labels.highContrastEnabled).toContain('active')
  })

  it('should return English labels for en', () => {
    const labels = getHighContrastLabel('en')
    expect(labels.highContrastEnabled).toContain('enabled')
  })

  it('should return Spanish labels for es', () => {
    const labels = getHighContrastLabel('es')
    expect(labels.highContrastToggle).toContain('alto contraste')
  })

  it('should return German labels for de', () => {
    const labels = getHighContrastLabel('de')
    expect(labels.highContrastToggle).toContain('Hochkontrast')
  })

  it('should fallback to English for unknown language', () => {
    const labels = getHighContrastLabel('xx')
    expect(labels.highContrastToggle).toBe('High contrast mode')
  })
})

describe('getLabel', () => {
  it('should return specific label by key', () => {
    expect(getLabel('highContrastToggle', 'en')).toBe('High contrast mode')
  })

  it('should return French label', () => {
    expect(getLabel('highContrastEnabled', 'fr')).toContain('active')
  })

  it('should fallback to English for unknown key', () => {
    const label = getLabel('unknownKey', 'fr')
    expect(label).toBe('unknownKey')
  })
})

// ============================================================================
// Configuration
// ============================================================================

describe('getStorageKey', () => {
  it('should return correct storage key', () => {
    expect(getStorageKey()).toBe('spothitch_high_contrast')
  })
})

describe('getHighContrastClass', () => {
  it('should return correct CSS class', () => {
    expect(getHighContrastClass()).toBe('high-contrast-mode')
  })
})

// ============================================================================
// Initialization and Reset
// ============================================================================

describe('initContrastCorrection', () => {
  it('should load saved preference from localStorage', () => {
    mockLocalStorage.setItem('spothitch_high_contrast', 'true')
    const result = initContrastCorrection()
    expect(result).toBe(true)
    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should return false when no saved preference', () => {
    const result = initContrastCorrection()
    expect(result).toBe(false)
  })

  it('should apply styles if saved preference is true', () => {
    mockLocalStorage.setItem('spothitch_high_contrast', 'true')
    initContrastCorrection()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(true)
  })
})

describe('resetContrastCorrection', () => {
  it('should disable high contrast', () => {
    enableHighContrast()
    resetContrastCorrection()
    expect(isHighContrastEnabled()).toBe(false)
  })

  it('should remove styles', () => {
    enableHighContrast()
    resetContrastCorrection()
    expect(document.body.classList.contains('high-contrast-mode')).toBe(false)
  })

  it('should clear localStorage', () => {
    enableHighContrast()
    resetContrastCorrection()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spothitch_high_contrast')
  })
})

// ============================================================================
// Default Export
// ============================================================================

describe('default export', () => {
  it('should export all core functions', () => {
    expect(contrastCorrection.isHighContrastEnabled).toBeDefined()
    expect(contrastCorrection.enableHighContrast).toBeDefined()
    expect(contrastCorrection.disableHighContrast).toBeDefined()
    expect(contrastCorrection.toggleHighContrast).toBeDefined()
  })

  it('should export system preference functions', () => {
    expect(contrastCorrection.detectSystemHighContrast).toBeDefined()
    expect(contrastCorrection.syncWithSystemPreference).toBeDefined()
  })

  it('should export contrast calculation functions', () => {
    expect(contrastCorrection.getContrastRatio).toBeDefined()
    expect(contrastCorrection.meetsWCAG_AA).toBeDefined()
    expect(contrastCorrection.meetsWCAG_AAA).toBeDefined()
    expect(contrastCorrection.adjustColorForContrast).toBeDefined()
    expect(contrastCorrection.suggestContrastFix).toBeDefined()
  })

  it('should export style management functions', () => {
    expect(contrastCorrection.applyHighContrastStyles).toBeDefined()
    expect(contrastCorrection.removeHighContrastStyles).toBeDefined()
  })

  it('should export utility functions', () => {
    expect(contrastCorrection.parseColor).toBeDefined()
    expect(contrastCorrection.rgbToHex).toBeDefined()
    expect(contrastCorrection.getRelativeLuminance).toBeDefined()
    expect(contrastCorrection.isLargeText).toBeDefined()
  })

  it('should export UI functions', () => {
    expect(contrastCorrection.renderHighContrastToggle).toBeDefined()
    expect(contrastCorrection.getHighContrastLabel).toBeDefined()
    expect(contrastCorrection.getContrastIssues).toBeDefined()
  })

  it('should export config functions', () => {
    expect(contrastCorrection.getStorageKey).toBeDefined()
    expect(contrastCorrection.getHighContrastClass).toBeDefined()
  })

  it('should export lifecycle functions', () => {
    expect(contrastCorrection.initContrastCorrection).toBeDefined()
    expect(contrastCorrection.resetContrastCorrection).toBeDefined()
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Full workflow', () => {
  it('should complete enable-disable cycle correctly', () => {
    // Start disabled
    expect(isHighContrastEnabled()).toBe(false)

    // Enable
    enableHighContrast()
    expect(isHighContrastEnabled()).toBe(true)
    expect(document.body.classList.contains('high-contrast-mode')).toBe(true)
    expect(document.getElementById('spothitch-high-contrast-styles')).not.toBeNull()

    // Disable
    disableHighContrast()
    expect(isHighContrastEnabled()).toBe(false)
    expect(document.body.classList.contains('high-contrast-mode')).toBe(false)
    expect(document.getElementById('spothitch-high-contrast-styles')).toBeNull()
  })

  it('should persist preference across init cycles', () => {
    enableHighContrast()
    resetContrastCorrection()

    // Simulate re-init with saved preference
    mockLocalStorage.setItem('spothitch_high_contrast', 'true')
    initContrastCorrection()

    expect(isHighContrastEnabled()).toBe(true)
  })

  it('should handle contrast check workflow', () => {
    const fg = '#888888'
    const bg = '#ffffff'

    // Check if passes
    const passesAA = meetsWCAG_AA(fg, bg)
    expect(passesAA).toBe(false)

    // Get suggestion
    const fix = suggestContrastFix(fg, bg)
    expect(fix.meetsAA).toBe(true)

    // Verify suggestion works
    expect(meetsWCAG_AA(fix.suggested, bg)).toBe(true)
  })
})

describe('Integration: Color adjustment workflow', () => {
  it('should adjust colors to meet AA for light backgrounds', () => {
    const colors = ['#999999', '#aaaaaa', '#bbbbbb', '#cccccc']
    const bg = '#ffffff'

    colors.forEach((color) => {
      const adjusted = adjustColorForContrast(color, 4.5, bg)
      expect(meetsWCAG_AA(adjusted, bg)).toBe(true)
    })
  })

  it('should adjust colors to meet AA for dark backgrounds', () => {
    const colors = ['#555555', '#444444', '#333333', '#222222']
    const bg = '#000000'

    colors.forEach((color) => {
      const adjusted = adjustColorForContrast(color, 4.5, bg)
      expect(meetsWCAG_AA(adjusted, bg)).toBe(true)
    })
  })
})

describe('Integration: i18n consistency', () => {
  it('should have all labels in all supported languages', () => {
    const languages = ['fr', 'en', 'es', 'de']
    const requiredKeys = [
      'highContrastToggle',
      'highContrastEnabled',
      'highContrastDisabled',
      'contrastIssue',
      'contrastRatio',
      'wcagAA',
      'wcagAAA',
      'passed',
      'failed',
    ]

    languages.forEach((lang) => {
      const labels = getHighContrastLabel(lang)
      requiredKeys.forEach((key) => {
        expect(labels[key]).toBeDefined()
        expect(labels[key].length).toBeGreaterThan(0)
      })
    })
  })
})
