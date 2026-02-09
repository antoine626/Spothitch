/**
 * Big Text Mode Service Tests
 * Comprehensive tests for accessibility text scaling functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
} from '../src/services/bigTextMode.js';

describe('Big Text Mode Service', () => {
  // Reset state before each test
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset state by calling resetBigTextMode
    resetBigTextMode();

    // Clean up any style elements
    const styleEl = document.getElementById('big-text-styles');
    if (styleEl) {
      styleEl.remove();
    }

    // Remove big-text class from body
    document.body.classList.remove('big-text');
  });

  afterEach(() => {
    resetBigTextMode();
  });

  describe('initBigTextMode', () => {
    it('should initialize with default values', () => {
      const result = initBigTextMode();

      expect(result).toEqual({ enabled: false, scale: 1.0 });
    });

    it('should load enabled state from localStorage', () => {
      localStorage.setItem('spothitch_big_text', 'true');

      const result = initBigTextMode();

      expect(result.enabled).toBe(true);
    });

    it('should load scale from localStorage', () => {
      localStorage.setItem('spothitch_big_text', 'true');
      localStorage.setItem('spothitch_text_scale', '1.5');

      const result = initBigTextMode();

      expect(result.scale).toBe(1.5);
    });

    it('should ignore invalid scale values', () => {
      localStorage.setItem('spothitch_text_scale', 'invalid');

      const result = initBigTextMode();

      expect(result.scale).toBe(1.0);
    });

    it('should clamp scale to valid range', () => {
      localStorage.setItem('spothitch_text_scale', '5.0');

      const result = initBigTextMode();

      // Should use default since 5.0 is out of range
      expect(result.scale).toBe(1.0);
    });

    it('should apply styles if enabled', () => {
      localStorage.setItem('spothitch_big_text', 'true');

      initBigTextMode();

      expect(document.body.classList.contains('big-text')).toBe(true);
    });

    it('should not apply styles if disabled', () => {
      localStorage.setItem('spothitch_big_text', 'false');

      initBigTextMode();

      expect(document.body.classList.contains('big-text')).toBe(false);
    });
  });

  describe('isBigTextEnabled', () => {
    it('should return false by default', () => {
      expect(isBigTextEnabled()).toBe(false);
    });

    it('should return true after enabling', () => {
      enableBigText();

      expect(isBigTextEnabled()).toBe(true);
    });

    it('should return false after disabling', () => {
      enableBigText();
      disableBigText();

      expect(isBigTextEnabled()).toBe(false);
    });
  });

  describe('enableBigText', () => {
    it('should enable big text mode', () => {
      enableBigText();

      expect(isBigTextEnabled()).toBe(true);
    });

    it('should add big-text class to body', () => {
      enableBigText();

      expect(document.body.classList.contains('big-text')).toBe(true);
    });

    it('should save preference to localStorage', () => {
      enableBigText();

      expect(localStorage.getItem('spothitch_big_text')).toBe('true');
    });

    it('should not duplicate enable calls', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      enableBigText();
      enableBigText(); // Second call should be ignored

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should create style element', () => {
      enableBigText();

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl).not.toBeNull();
    });
  });

  describe('disableBigText', () => {
    it('should disable big text mode', () => {
      enableBigText();
      disableBigText();

      expect(isBigTextEnabled()).toBe(false);
    });

    it('should remove big-text class from body', () => {
      enableBigText();
      disableBigText();

      expect(document.body.classList.contains('big-text')).toBe(false);
    });

    it('should save preference to localStorage', () => {
      enableBigText();
      disableBigText();

      expect(localStorage.getItem('spothitch_big_text')).toBe('false');
    });

    it('should not duplicate disable calls', () => {
      enableBigText();
      const callback = vi.fn();
      onBigTextChange(callback);

      disableBigText();
      disableBigText(); // Second call should be ignored

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should remove style element', () => {
      enableBigText();
      disableBigText();

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl).toBeNull();
    });
  });

  describe('toggleBigText', () => {
    it('should enable when disabled', () => {
      const result = toggleBigText();

      expect(result).toBe(true);
      expect(isBigTextEnabled()).toBe(true);
    });

    it('should disable when enabled', () => {
      enableBigText();
      const result = toggleBigText();

      expect(result).toBe(false);
      expect(isBigTextEnabled()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      expect(toggleBigText()).toBe(true);
      expect(toggleBigText()).toBe(false);
      expect(toggleBigText()).toBe(true);
      expect(toggleBigText()).toBe(false);
    });
  });

  describe('getTextScale', () => {
    it('should return 1.0 when disabled', () => {
      expect(getTextScale()).toBe(1.0);
    });

    it('should return current scale when enabled', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getTextScale()).toBe(1.5);
    });

    it('should return 1.0 after disabling even with custom scale set', () => {
      enableBigText();
      setTextScale(1.5);
      disableBigText();

      expect(getTextScale()).toBe(1.0);
    });
  });

  describe('setTextScale', () => {
    it('should set valid scale', () => {
      enableBigText();
      const result = setTextScale(1.5);

      expect(result).toBe(true);
      expect(getTextScale()).toBe(1.5);
    });

    it('should clamp scale below minimum', () => {
      enableBigText();
      setTextScale(0.5);

      expect(getTextScale()).toBe(1.0);
    });

    it('should clamp scale above maximum', () => {
      enableBigText();
      setTextScale(3.0);

      expect(getTextScale()).toBe(2.0);
    });

    it('should reject invalid values', () => {
      const result = setTextScale('invalid');

      expect(result).toBe(false);
    });

    it('should reject NaN', () => {
      const result = setTextScale(NaN);

      expect(result).toBe(false);
    });

    it('should save scale to localStorage', () => {
      setTextScale(1.5);

      expect(localStorage.getItem('spothitch_text_scale')).toBe('1.5');
    });

    it('should update styles when enabled', () => {
      enableBigText();
      setTextScale(1.75);

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl.textContent).toContain('1.75rem');
    });

    it('should notify callbacks', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      setTextScale(1.5);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ scale: 1.5 }));
    });
  });

  describe('applyBigTextStyles', () => {
    it('should add big-text class to body', () => {
      applyBigTextStyles();

      expect(document.body.classList.contains('big-text')).toBe(true);
    });

    it('should create style element', () => {
      applyBigTextStyles();

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl).not.toBeNull();
    });

    it('should set CSS custom property', () => {
      enableBigText();
      setTextScale(1.5);

      const scale = document.documentElement.style.getPropertyValue('--text-scale');
      expect(scale).toBe('1.5');
    });

    it('should contain scaling rules', () => {
      applyBigTextStyles();

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl.textContent).toContain('.big-text');
      expect(styleEl.textContent).toContain('font-size');
    });

    it('should not create duplicate style elements', () => {
      applyBigTextStyles();
      applyBigTextStyles();

      const styleEls = document.querySelectorAll('#big-text-styles');
      expect(styleEls.length).toBe(1);
    });
  });

  describe('removeBigTextStyles', () => {
    it('should remove big-text class from body', () => {
      applyBigTextStyles();
      removeBigTextStyles();

      expect(document.body.classList.contains('big-text')).toBe(false);
    });

    it('should remove style element', () => {
      applyBigTextStyles();
      removeBigTextStyles();

      const styleEl = document.getElementById('big-text-styles');
      expect(styleEl).toBeNull();
    });

    it('should remove CSS custom property', () => {
      enableBigText();
      disableBigText();

      const scale = document.documentElement.style.getPropertyValue('--text-scale');
      expect(scale).toBe('');
    });
  });

  describe('getFontSize', () => {
    it('should return base size when disabled', () => {
      expect(getFontSize(16)).toBe(16);
    });

    it('should return scaled size when enabled', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getFontSize(16)).toBe(24);
    });

    it('should handle invalid input', () => {
      expect(getFontSize('invalid')).toBe(16);
    });

    it('should handle NaN input', () => {
      expect(getFontSize(NaN)).toBe(16);
    });

    it('should round result', () => {
      enableBigText();
      setTextScale(1.33);

      const result = getFontSize(16);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('getLineHeight', () => {
    it('should return base height when disabled', () => {
      expect(getLineHeight(1.5)).toBe(1.5);
    });

    it('should return scaled height when enabled', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getLineHeight(1.5)).toBe(2.25);
    });

    it('should handle invalid input', () => {
      expect(getLineHeight('invalid')).toBe(1.5);
    });

    it('should handle NaN input', () => {
      expect(getLineHeight(NaN)).toBe(1.5);
    });

    it('should scale pixel values', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getLineHeight(24)).toBe(36);
    });
  });

  describe('detectSystemTextSize', () => {
    it('should return object with prefersLargeText', () => {
      const result = detectSystemTextSize();

      expect(result).toHaveProperty('prefersLargeText');
      expect(typeof result.prefersLargeText).toBe('boolean');
    });

    it('should return object with scaleFactor', () => {
      const result = detectSystemTextSize();

      expect(result).toHaveProperty('scaleFactor');
      expect(typeof result.scaleFactor).toBe('number');
    });

    it('should include prefersReducedMotion', () => {
      const result = detectSystemTextSize();

      expect(result).toHaveProperty('prefersReducedMotion');
    });

    it('should include prefersMoreContrast', () => {
      const result = detectSystemTextSize();

      expect(result).toHaveProperty('prefersMoreContrast');
    });

    it('should return default values when matchMedia is mocked', () => {
      const result = detectSystemTextSize();

      expect(result.prefersLargeText).toBe(false);
      expect(result.scaleFactor).toBe(1.0);
    });
  });

  describe('syncWithSystemTextSize', () => {
    it('should return sync status', () => {
      const result = syncWithSystemTextSize();

      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('enabled');
      expect(result).toHaveProperty('scale');
    });

    it('should not sync when no preference detected', () => {
      const result = syncWithSystemTextSize();

      expect(result.synced).toBe(false);
    });

    it('should return current state when not syncing', () => {
      enableBigText();
      setTextScale(1.5);

      const result = syncWithSystemTextSize();

      expect(result.enabled).toBe(true);
      expect(result.scale).toBe(1.5);
    });
  });

  describe('onBigTextChange', () => {
    it('should register callback', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      enableBigText();

      expect(callback).toHaveBeenCalled();
    });

    it('should pass enabled state to callback', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      enableBigText();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });

    it('should pass scale to callback', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      enableBigText();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ scale: expect.any(Number) }));
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = onBigTextChange(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe when called', () => {
      const callback = vi.fn();
      const unsubscribe = onBigTextChange(callback);

      unsubscribe();
      enableBigText();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle invalid callback gracefully', () => {
      const result = onBigTextChange('not a function');

      expect(typeof result).toBe('function');
    });

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      onBigTextChange(callback1);
      onBigTextChange(callback2);

      enableBigText();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('offBigTextChange', () => {
    it('should unregister callback', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      offBigTextChange(callback);
      enableBigText();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw for unregistered callback', () => {
      const callback = vi.fn();

      expect(() => offBigTextChange(callback)).not.toThrow();
    });
  });

  describe('renderBigTextToggle', () => {
    it('should return HTML string', () => {
      const html = renderBigTextToggle();

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should contain toggle button', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('role="switch"');
    });

    it('should contain aria-checked attribute', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('aria-checked');
    });

    it('should show correct state when disabled', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('aria-checked="false"');
    });

    it('should show correct state when enabled', () => {
      enableBigText();
      const html = renderBigTextToggle();

      expect(html).toContain('aria-checked="true"');
    });

    it('should use French labels by default', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('Mode gros texte');
    });

    it('should use English labels when specified', () => {
      const html = renderBigTextToggle('en');

      expect(html).toContain('Big text mode');
    });

    it('should use Spanish labels when specified', () => {
      const html = renderBigTextToggle('es');

      expect(html).toContain('Modo texto grande');
    });

    it('should use German labels when specified', () => {
      const html = renderBigTextToggle('de');

      expect(html).toContain('Grosser Text Modus');
    });

    it('should contain icon', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('fa-text-height');
    });

    it('should contain onclick handler', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('toggleBigTextMode');
    });
  });

  describe('renderTextSizeSlider', () => {
    it('should return HTML string', () => {
      const html = renderTextSizeSlider();

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should contain range input', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('type="range"');
    });

    it('should have correct min value', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('min="100"');
    });

    it('should have correct max value', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('max="200"');
    });

    it('should show current scale percentage', () => {
      enableBigText();
      setTextScale(1.5);
      const html = renderTextSizeSlider();

      expect(html).toContain('150%');
    });

    it('should contain reset button', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('resetTextScale');
    });

    it('should contain preview element', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('text-preview');
    });

    it('should contain description', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('lisibilite');
    });

    it('should use correct language labels', () => {
      const html = renderTextSizeSlider('en');

      expect(html).toContain('Text size');
      expect(html).toContain('readability');
    });

    it('should contain aria attributes', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('aria-label');
      expect(html).toContain('aria-valuemin');
      expect(html).toContain('aria-valuemax');
      expect(html).toContain('aria-valuenow');
    });
  });

  describe('getBigTextLabel', () => {
    it('should return French label by default', () => {
      const label = getBigTextLabel();

      expect(label).toBe('Mode gros texte');
    });

    it('should return English label', () => {
      const label = getBigTextLabel('en', 'bigTextToggle');

      expect(label).toBe('Big text mode');
    });

    it('should return Spanish label', () => {
      const label = getBigTextLabel('es', 'bigTextToggle');

      expect(label).toBe('Modo texto grande');
    });

    it('should return German label', () => {
      const label = getBigTextLabel('de', 'bigTextToggle');

      expect(label).toBe('Grosser Text Modus');
    });

    it('should return key for unknown label', () => {
      const label = getBigTextLabel('fr', 'unknownKey');

      expect(label).toBe('unknownKey');
    });

    it('should fallback to French for unknown language', () => {
      const label = getBigTextLabel('xx', 'bigTextToggle');

      expect(label).toBe('Mode gros texte');
    });
  });

  describe('getAllLabels', () => {
    it('should return all French labels', () => {
      const labels = getAllLabels('fr');

      expect(labels).toHaveProperty('bigTextToggle');
      expect(labels).toHaveProperty('textSizeSlider');
      expect(labels).toHaveProperty('textSizeReset');
    });

    it('should return all English labels', () => {
      const labels = getAllLabels('en');

      expect(labels.bigTextToggle).toBe('Big text mode');
      expect(labels.textSizeSlider).toBe('Text size');
    });

    it('should return French labels for unknown language', () => {
      const labels = getAllLabels('xx');

      expect(labels.bigTextToggle).toBe('Mode gros texte');
    });
  });

  describe('resetBigTextMode', () => {
    it('should disable big text', () => {
      enableBigText();
      resetBigTextMode();

      expect(isBigTextEnabled()).toBe(false);
    });

    it('should reset scale to default', () => {
      enableBigText();
      setTextScale(1.75);
      resetBigTextMode();
      enableBigText();

      expect(getTextScale()).toBe(1.0);
    });

    it('should clear localStorage', () => {
      enableBigText();
      setTextScale(1.5);
      resetBigTextMode();

      expect(localStorage.getItem('spothitch_big_text')).toBeNull();
      expect(localStorage.getItem('spothitch_text_scale')).toBeNull();
    });

    it('should remove styles', () => {
      enableBigText();
      resetBigTextMode();

      expect(document.body.classList.contains('big-text')).toBe(false);
      expect(document.getElementById('big-text-styles')).toBeNull();
    });

    it('should notify callbacks with reset flag', () => {
      const callback = vi.fn();
      onBigTextChange(callback);

      resetBigTextMode();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ reset: true }));
    });
  });

  describe('getBigTextState', () => {
    it('should return current state', () => {
      const state = getBigTextState();

      expect(state).toHaveProperty('enabled');
      expect(state).toHaveProperty('scale');
      expect(state).toHaveProperty('minScale');
      expect(state).toHaveProperty('maxScale');
    });

    it('should return correct enabled state', () => {
      enableBigText();
      const state = getBigTextState();

      expect(state.enabled).toBe(true);
    });

    it('should return correct scale', () => {
      enableBigText();
      setTextScale(1.5);
      const state = getBigTextState();

      expect(state.scale).toBe(1.5);
    });

    it('should include constants', () => {
      const state = getBigTextState();

      expect(state.minScale).toBe(1.0);
      expect(state.maxScale).toBe(2.0);
      expect(state.defaultScale).toBe(1.0);
      expect(state.bigTextScale).toBe(1.25);
    });
  });

  describe('Integration tests', () => {
    it('should persist state across init calls', () => {
      enableBigText();
      setTextScale(1.75);

      // Simulate app restart
      resetBigTextMode();
      localStorage.setItem('spothitch_big_text', 'true');
      localStorage.setItem('spothitch_text_scale', '1.75');

      initBigTextMode();

      expect(isBigTextEnabled()).toBe(true);
      expect(getTextScale()).toBe(1.75);
    });

    it('should handle rapid toggle calls', () => {
      for (let i = 0; i < 10; i++) {
        toggleBigText();
      }

      // After 10 toggles (starting from false), should be false
      expect(isBigTextEnabled()).toBe(false);
    });

    it('should handle multiple scale changes', () => {
      enableBigText();

      setTextScale(1.25);
      setTextScale(1.5);
      setTextScale(1.75);
      setTextScale(2.0);

      expect(getTextScale()).toBe(2.0);
    });

    it('should update UI elements correctly', () => {
      enableBigText();
      setTextScale(1.5);

      const styleEl = document.getElementById('big-text-styles');

      expect(styleEl).not.toBeNull();
      expect(styleEl.textContent).toContain('1.5rem');
      expect(styleEl.textContent).toContain('.big-text h1');
    });

    it('should work with font size calculations', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getFontSize(16)).toBe(24);
      expect(getFontSize(14)).toBe(21);
      expect(getFontSize(12)).toBe(18);
    });

    it('should work with line height calculations', () => {
      enableBigText();
      setTextScale(1.5);

      expect(getLineHeight(1.5)).toBe(2.25);
      expect(getLineHeight(1.2)).toBeCloseTo(1.8, 1);
    });
  });

  describe('Edge cases', () => {
    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => enableBigText()).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle missing document gracefully in SSR', () => {
      // The service checks for document existence before DOM operations
      // This test ensures no errors are thrown
      expect(() => getBigTextState()).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      onBigTextChange(errorCallback);
      onBigTextChange(normalCallback);

      expect(() => enableBigText()).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should handle extreme scale values', () => {
      enableBigText();

      setTextScale(-1);
      expect(getTextScale()).toBe(1.0);

      setTextScale(100);
      expect(getTextScale()).toBe(2.0);
    });

    it('should handle zero and null font sizes', () => {
      expect(getFontSize(0)).toBe(0);
      expect(getFontSize(null)).toBe(16);
      expect(getFontSize(undefined)).toBe(16);
    });
  });

  describe('Accessibility', () => {
    it('should include proper ARIA attributes in toggle', () => {
      const html = renderBigTextToggle();

      expect(html).toContain('role="switch"');
      expect(html).toContain('aria-checked');
      expect(html).toContain('aria-label');
    });

    it('should include proper ARIA attributes in slider', () => {
      const html = renderTextSizeSlider();

      expect(html).toContain('aria-label');
      expect(html).toContain('aria-valuemin');
      expect(html).toContain('aria-valuemax');
      expect(html).toContain('aria-valuenow');
      expect(html).toContain('aria-valuetext');
    });

    it('should update aria-checked on toggle state', () => {
      const htmlDisabled = renderBigTextToggle();
      expect(htmlDisabled).toContain('aria-checked="false"');

      enableBigText();

      const htmlEnabled = renderBigTextToggle();
      expect(htmlEnabled).toContain('aria-checked="true"');
    });

    it('should provide meaningful aria-labels', () => {
      enableBigText();
      const html = renderBigTextToggle('en');

      expect(html).toContain('Big text enabled');
    });

    it('should have readable scale percentage in aria-valuetext', () => {
      enableBigText();
      setTextScale(1.5);
      const html = renderTextSizeSlider();

      expect(html).toContain('aria-valuetext="150%"');
    });
  });

  describe('Global handlers', () => {
    it('should expose toggleBigTextMode globally', () => {
      expect(typeof window.toggleBigTextMode).toBe('function');
    });

    it('should expose setTextScaleFromSlider globally', () => {
      expect(typeof window.setTextScaleFromSlider).toBe('function');
    });

    it('should expose previewTextScale globally', () => {
      expect(typeof window.previewTextScale).toBe('function');
    });

    it('should expose resetTextScale globally', () => {
      expect(typeof window.resetTextScale).toBe('function');
    });

    it('should setTextScaleFromSlider convert percentage to scale', () => {
      enableBigText();
      window.setTextScaleFromSlider('150');

      expect(getTextScale()).toBe(1.5);
    });

    it('should resetTextScale disable and reset', () => {
      enableBigText();
      setTextScale(1.75);

      window.resetTextScale();

      expect(isBigTextEnabled()).toBe(false);
    });
  });
});
